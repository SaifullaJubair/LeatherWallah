import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaUndo, FaSyncAlt } from "react-icons/fa";

// Product-level floating override editor.
//
// Two stacked panels:
//   A) FROM THEME — the floating assets this product INHERITS from its assigned
//      theme. Each row can be: kept (default), HIDDEN (per-product), or its
//      image REPLACED (same slot/animation, different picture — this product
//      only; the theme stays intact).
//   B) THIS PRODUCT ONLY — extra section-anchored floats that live on this
//      product alone (not inherited by anything).
//
// Output (via onChange) is the `floating_overrides` object:
//   { hidden_ids: string[], replacements: [{theme_asset_id,asset_url,asset_key}],
//     extras: [ <section-anchored float> ] }

// MULTI-NICHE-DEBT: section list hardcoded food (mirrors theme.model.ts enum).
// When the PDP section registry + pdp_section_array lands, build this list from the
// active niche's section registry. See docs/_ai/MULTI_NICHE_PLAN.md §4.
const SECTIONS = [
  { v: "any", label: "All sections" },
  { v: "hero", label: "Hero" },
  { v: "order", label: "Order form" },
  { v: "benefits", label: "Benefits" },
  { v: "use_cases", label: "Use cases" },
  { v: "nutrition", label: "Nutrition" },
  { v: "reviews", label: "Reviews" },
  { v: "faq", label: "FAQ" },
];
const SIDES = [{ v: "left", label: "Left" }, { v: "right", label: "Right" }];
const ALIGNS = [
  { v: "top", label: "Top" },
  { v: "middle", label: "Middle" },
  { v: "bottom", label: "Bottom" },
];
const ANIMS = [
  { v: "float", label: "Float" },
  { v: "sway", label: "Sway" },
  { v: "bounce", label: "Bounce" },
  { v: "spin", label: "Spin" },
  { v: "none", label: "None" },
];
const SPEEDS = [
  { v: "slow", label: "Slow" },
  { v: "normal", label: "Normal" },
  { v: "fast", label: "Fast" },
];
const SIZES = [
  { v: "xs", label: "XS" },
  { v: "sm", label: "S" },
  { v: "md", label: "M" },
  { v: "lg", label: "L" },
];
const ANIM_PREVIEW = {
  float: "brand-anim-float-slow",
  sway: "brand-anim-sway-slow",
  bounce: "brand-anim-bounce-slow",
  spin: "brand-anim-spin-slow",
  none: "",
};

// Deferred-upload override editor.
// Picking a file does NOT hit S3 here — that left orphaned uploads whenever the
// admin never pressed Save. Instead the raw File + a blob preview URL are stashed
// in the parent's `pendingUploads` map (key → File, with `_previewUrl` on the
// File). The parent flushes every pending File to S3 once, inside its onSubmit,
// right before the PATCH. Keys: "repl_<themeAssetId>" / "extra_<localId>".
export default function ProductFloatingTab({
  themeAssets = [],
  value,
  onChange,
  pendingUploads = {},
  onPendingChange = () => {},
}) {
  const overrides = value || { hidden_ids: [], replacements: [], extras: [] };
  const hidden = overrides.hidden_ids || [];
  const replacements = overrides.replacements || [];
  const extras = overrides.extras || [];

  const set = (patch) => onChange({ ...overrides, ...patch });

  const replByThemeId = (id) => replacements.find((r) => r.theme_asset_id === id);

  // Stash a File under `key`, attaching a blob preview URL. Revokes any blob the
  // same key previously held so re-picking a file doesn't leak object URLs.
  const stashPending = (key, file) => {
    const prev = pendingUploads[key];
    if (prev?._previewUrl) URL.revokeObjectURL(prev._previewUrl);
    file._previewUrl = URL.createObjectURL(file);
    onPendingChange({ ...pendingUploads, [key]: file });
  };
  const dropPending = (key) => {
    const prev = pendingUploads[key];
    if (prev?._previewUrl) URL.revokeObjectURL(prev._previewUrl);
    if (!(key in pendingUploads)) return;
    const next = { ...pendingUploads };
    delete next[key];
    onPendingChange(next);
  };

  // ── Panel A handlers ──
  const toggleHidden = (id) => {
    if (!id) return;
    set({
      hidden_ids: hidden.includes(id)
        ? hidden.filter((x) => x !== id)
        : [...hidden, id],
    });
  };
  // Defer: just stash the File (preview shown from blob). On Save the parent
  // uploads it and writes the real URL into the matching replacement row.
  const replaceThemeAsset = (id, file) => {
    if (!file || !id) return;
    stashPending(`repl_${id}`, file);
    // ensure a placeholder replacement row exists so Save knows to apply the URL
    if (!replByThemeId(id)) {
      set({
        replacements: [
          ...replacements,
          { theme_asset_id: id, asset_url: "", asset_key: "", _pendingKey: `repl_${id}` },
        ],
      });
    }
  };
  const clearReplacement = (id) => {
    dropPending(`repl_${id}`);
    set({ replacements: replacements.filter((r) => r.theme_asset_id !== id) });
  };

  // ── Panel B (extras) handlers ──
  const addExtra = () =>
    set({
      extras: [
        ...extras,
        {
          _localId: crypto.randomUUID(),
          asset_url: "",
          asset_key: "",
          section: "any",
          position: "left",
          align: "middle",
          animation_type: "float",
          animation_speed: "slow",
          size: "md",
          opacity: 1,
          hide_on_mobile: true,
        },
      ],
    });
  const updateExtra = (i, patch) =>
    set({ extras: extras.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const removeExtra = (i) => {
    const row = extras[i];
    if (row?._localId) dropPending(`extra_${row._localId}`);
    set({ extras: extras.filter((_, idx) => idx !== i) });
  };
  // Defer: stash File under the row's stable _localId; preview is read at render
  // time from the pending map (keyed by _localId), so no stale state read here.
  const uploadExtra = (i, file) => {
    if (!file) return;
    const row = extras[i];
    const localId = row._localId || crypto.randomUUID();
    stashPending(`extra_${localId}`, file);
    if (!row._localId) updateExtra(i, { _localId: localId });
  };

  return (
    <div className="space-y-6">
      {/* ── PANEL A: inherited from theme ── */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-1">
          Theme থেকে আসা floating (inherited)
        </h4>
        <p className="text-[11px] text-gray-400 mb-3">
          এই product যেই theme ব্যবহার করছে তার global floating image গুলো। চাইলে
          এই product-এর জন্য hide করো বা ছবি replace করো — theme অক্ষত থাকবে।
        </p>
        {themeAssets.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            এই theme-এ কোনো global floating image নেই (অথবা product-এ এখনো theme select করা হয়নি)।
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themeAssets.map((a) => {
              const id = a.id;
              const isHidden = id && hidden.includes(id);
              const repl = id ? replByThemeId(id) : null;
              // Deferred replace: blob preview from the pending File until Save
              // uploads it and fills repl.asset_url.
              const pendingPreview = id
                ? pendingUploads[`repl_${id}`]?._previewUrl
                : null;
              const shownUrl = pendingPreview || (repl ? repl.asset_url : a.asset_url);
              const isReplaced = !!pendingPreview || !!(repl && repl.asset_url);
              return (
                <div
                  key={id || a.asset_url}
                  className={`flex gap-3 p-3 border rounded-lg ${isHidden ? "bg-gray-100 opacity-60" : "bg-white"}`}
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded border bg-gray-50 overflow-hidden flex-shrink-0">
                    <img
                      src={shownUrl}
                      alt=""
                      className={`max-h-16 object-contain ${ANIM_PREVIEW[a.animation_type] || ""}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-500">
                      {a.section} · {a.position}/{a.align || "middle"} · {a.size}
                      {isReplaced && (
                        <span className="ml-1 text-amber-600 font-medium">
                          {pendingPreview ? "(replaced — unsaved)" : "(replaced)"}
                        </span>
                      )}
                      {isHidden && (
                        <span className="ml-1 text-red-500 font-medium">(hidden)</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleHidden(id)}
                        disabled={!id}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                        title={!id ? "Old theme asset has no id — re-save the theme to enable override" : ""}
                      >
                        {isHidden ? <FaEye size={10} /> : <FaEyeSlash size={10} />}
                        {isHidden ? "Show" : "Hide"}
                      </button>
                      <label className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-blueColor-50 hover:bg-blueColor-100 text-blueColor-600 cursor-pointer">
                        <FaSyncAlt size={10} /> Replace
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={!id}
                          onChange={(e) => replaceThemeAsset(id, e.target.files?.[0])}
                        />
                      </label>
                      {repl && (
                        <button
                          type="button"
                          onClick={() => clearReplacement(id)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700"
                        >
                          <FaUndo size={10} /> Reset
                        </button>
                      )}
                    </div>
                    {!id && (
                      <p className="text-[10px] text-red-400 mt-1">
                        এই theme asset-এর id নেই — theme টা একবার edit করে save করলে override কাজ করবে।
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PANEL B: product-only extras ── */}
      <div className="border-t pt-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">
          শুধু এই product-এর floating (extra)
        </h4>
        <p className="text-[11px] text-gray-400 mb-3">
          theme-এ নেই, শুধু এই product-এর জন্য বাড়তি floating image। section
          অনুযায়ী বসবে — same animation system।
        </p>
        {extras.length === 0 && (
          <p className="text-xs text-gray-400 italic mb-2">কোনো extra floating নেই।</p>
        )}
        <div className="space-y-3">
          {extras.map((row, i) => {
            // Preview: blob from pending File (unsaved) wins, else saved URL.
            const pendingPreview = row._localId
              ? pendingUploads[`extra_${row._localId}`]?._previewUrl
              : null;
            const previewUrl = pendingPreview || row.asset_url;
            return (
            <div key={row._localId || i} className="flex flex-wrap items-start gap-3 p-3 border rounded-lg bg-gray-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className={`w-16 h-16 object-contain rounded border bg-white ${ANIM_PREVIEW[row.animation_type] || ""}`}
                />
              ) : (
                <div className="w-16 h-16 rounded border bg-white flex items-center justify-center text-[10px] text-gray-400">
                  no image
                </div>
              )}
              <div className="flex-1 min-w-[180px] space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadExtra(i, e.target.files?.[0])}
                  className="form-input text-xs"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Sel label="Section" value={row.section} opts={SECTIONS} onChange={(v) => updateExtra(i, { section: v })} />
                  <Sel label="Side" value={row.position} opts={SIDES} onChange={(v) => updateExtra(i, { position: v })} />
                  <Sel label="Vertical" value={row.align} opts={ALIGNS} onChange={(v) => updateExtra(i, { align: v })} />
                  <Sel label="Anim" value={row.animation_type} opts={ANIMS} onChange={(v) => updateExtra(i, { animation_type: v })} />
                  <Sel label="Speed" value={row.animation_speed} opts={SPEEDS} onChange={(v) => updateExtra(i, { animation_speed: v })} />
                  <Sel label="Size" value={row.size} opts={SIZES} onChange={(v) => updateExtra(i, { size: v })} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* "Show on mobile" removed — hero/section floats are md+ only
                      (they overlap or hide behind the stacked product image on
                      small screens). Decorative-only, so nothing is lost. */}
                  {/* Opacity — same control as the theme floating manager so
                      per-product extras can be faded just like theme floats. */}
                  <label className="flex items-center gap-2 text-[11px] text-gray-500 min-w-[160px]">
                    <span className="whitespace-nowrap">
                      Opacity ({typeof row.opacity === "number" ? row.opacity : 1})
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={typeof row.opacity === "number" ? row.opacity : 1}
                      onChange={(e) =>
                        updateExtra(i, { opacity: Number(e.target.value) })
                      }
                      className="flex-1"
                    />
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeExtra(i)}
                className="px-2 py-2 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 self-start"
              >
                <FaTrash />
              </button>
            </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addExtra}
          className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-2 bg-blueColor-50 text-blueColor-600 rounded hover:bg-blueColor-100"
        >
          <FaPlus /> Add extra floating
        </button>
      </div>
    </div>
  );
}

const Sel = ({ label, value, opts, onChange }) => (
  <label className="text-[11px] text-gray-500">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-input text-xs py-1 mt-0.5"
    >
      {opts.map((o) => (
        <option key={o.v} value={o.v}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);
