import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaTrash } from "react-icons/fa";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

// Theme-level (GLOBAL) floating images manager. Every product using this theme
// inherits these floats; a product can later hide/replace/extend them from its
// own Page Content → Floating tab (product-level override layer).
//
// TWO MODES:
//   • persisted (themeId given, UPDATE): uses the per-asset endpoints, uploads
//     immediately —
//       POST   /theme/:id/floating-asset           (multipart: asset file + meta)
//       DELETE /theme/:id/floating-asset/:index
//   • buffer (no themeId, CREATE): holds picked files + meta + blob previews in
//     local state and reports them up via onPendingChange. The parent ThemeForm
//     uploads them right after the theme is created (AB-3). No theme _id needed.
//
// Both modes support queuing MULTIPLE images at once (AB-4): a multi-file input
// adds one pending row per file (shared meta, individually editable/removable),
// then "Add" uploads/commits them in a batch.

// MULTI-NICHE-DEBT: section list hardcoded food (mirrors theme.model.ts enum).
// When the PDP section registry + pdp_section_array lands, build this list from the
// active niche's section registry. See docs/_ai/MULTI_NICHE_PLAN.md §4.
const SECTIONS = [
  { v: "any", label: "All sections (any)" },
  { v: "hero", label: "Hero / top" },
  { v: "order", label: "Order form" },
  { v: "benefits", label: "Benefits" },
  { v: "use_cases", label: "Use cases" },
  { v: "nutrition", label: "Nutrition" },
  { v: "reviews", label: "Reviews" },
  { v: "faq", label: "FAQ" },
];
const SIDES = [
  { v: "left", label: "Left" },
  { v: "right", label: "Right" },
];
const ALIGNS = [
  { v: "top", label: "Top" },
  { v: "middle", label: "Middle" },
  { v: "bottom", label: "Bottom" },
];
const ANIMS = [
  { v: "float", label: "Float (up-down)" },
  { v: "sway", label: "Sway (side)" },
  { v: "bounce", label: "Bounce" },
  { v: "spin", label: "Spin" },
  { v: "none", label: "No animation" },
];
const SPEEDS = [
  { v: "slow", label: "Slow" },
  { v: "normal", label: "Normal" },
  { v: "fast", label: "Fast" },
];
const SIZES = [
  { v: "xs", label: "XS" },
  { v: "sm", label: "Small" },
  { v: "md", label: "Medium" },
  { v: "lg", label: "Large" },
];

const ANIM_PREVIEW = {
  float: "brand-anim-float-slow",
  sway: "brand-anim-sway-slow",
  bounce: "brand-anim-bounce-slow",
  spin: "brand-anim-spin-slow",
  none: "",
};

const DEFAULT_META = {
  section: "any",
  position: "left",
  align: "middle",
  animation_type: "float",
  animation_speed: "slow",
  size: "md",
  opacity: 1,
  hide_on_mobile: true,
};

let pendingSeq = 0;
const nextLocalId = () => `pending_${Date.now()}_${pendingSeq++}`;

export default function ThemeFloatingManager({
  themeId,
  initialAssets = [],
  onChange,
  // CREATE-mode: report buffered (not-yet-uploaded) floats up to the parent so
  // it can upload them after the theme is created.
  onPendingChange,
}) {
  const buffered = !themeId; // create mode = no saved theme to attach to yet
  const [assets, setAssets] = useState(
    Array.isArray(initialAssets) ? initialAssets : [],
  );
  // queued rows = files chosen but not yet committed; each has its own meta.
  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  // Revoke any blob preview URLs on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      queueRef.current.forEach((q) => {
        if (q.previewUrl) URL.revokeObjectURL(q.previewUrl);
      });
    };
  }, []);

  // In buffer mode, keep the parent in sync with the queued floats so it can
  // upload them after create. We strip the blob URL (parent only needs file+meta).
  const reportPending = (rows) => {
    if (buffered) {
      onPendingChange?.(
        rows.map((r) => ({ localId: r.localId, file: r.file, meta: r.meta })),
      );
    }
  };

  const handlePick = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const rows = files.map((file) => ({
      localId: nextLocalId(),
      file,
      previewUrl: URL.createObjectURL(file),
      meta: { ...DEFAULT_META },
    }));
    setQueue((prev) => {
      const next = [...prev, ...rows];
      reportPending(next);
      return next;
    });
  };

  const setRowMeta = (localId, k, v) => {
    setQueue((prev) => {
      const next = prev.map((r) =>
        r.localId === localId ? { ...r, meta: { ...r.meta, [k]: v } } : r,
      );
      reportPending(next);
      return next;
    });
  };

  const removeRow = (localId) => {
    setQueue((prev) => {
      const target = prev.find((r) => r.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((r) => r.localId !== localId);
      reportPending(next);
      return next;
    });
  };

  const clearQueue = () => {
    queue.forEach((r) => r.previewUrl && URL.revokeObjectURL(r.previewUrl));
    setQueue([]);
    reportPending([]);
  };

  // UPDATE-mode: upload every queued row to the saved theme in a batch.
  const handleUploadQueue = async () => {
    if (!queue.length) {
      toast.error("একটা image select করো");
      return;
    }
    setUploading(true);
    const uploaded = [];
    let failed = 0;
    for (const row of queue) {
      try {
        const fd = new FormData();
        fd.append("asset", row.file);
        Object.entries(row.meta).forEach(([k, v]) => fd.append(k, String(v)));
        const res = await fetch(`${BASE_URL}/theme/${themeId}/floating-asset`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const data = await res.json();
        if (data?.success) {
          uploaded.push(data.data);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    if (uploaded.length) {
      const next = [...assets, ...uploaded];
      setAssets(next);
      onChange?.(next);
    }
    clearQueue();
    setUploading(false);
    if (failed) {
      toast.warn(`${uploaded.length} added, ${failed} failed`);
    } else {
      toast.success(`${uploaded.length} floating image যোগ হয়েছে`);
    }
  };

  const handleDelete = async (index) => {
    try {
      const res = await fetch(
        `${BASE_URL}/theme/${themeId}/floating-asset/${index}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = await res.json();
      if (!data?.success) {
        toast.error(data?.message || "Delete failed");
        return;
      }
      const next = assets.filter((_, i) => i !== index);
      setAssets(next);
      onChange?.(next);
      toast.success("Removed");
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-4">
      {/* existing (already-saved) assets — only in update mode */}
      {!buffered &&
        (assets.length === 0 ? (
          <p className="text-sm text-gray-400">
            এখনো কোনো global floating image নেই। নিচ থেকে যোগ করো।
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {assets.map((a, i) => (
              <div
                key={a.id || i}
                className="relative border border-gray-200 rounded-lg p-2 bg-gray-50"
              >
                <div className="h-20 flex items-center justify-center overflow-hidden">
                  <img
                    src={a.asset_url}
                    alt=""
                    className={`max-h-20 object-contain ${ANIM_PREVIEW[a.animation_type] || ""}`}
                    style={{ opacity: typeof a.opacity === "number" ? a.opacity : 1 }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-gray-500 leading-tight">
                  <div className="truncate">
                    {a.section} · {a.position}/{a.align || "middle"}
                  </div>
                  <div className="truncate">
                    {a.animation_type} · {a.size}
                    {a.hide_on_mobile ? " · 📵" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Remove"
                >
                  <FaTrash size={9} />
                </button>
              </div>
            ))}
          </div>
        ))}

      {/* add new — multi-file picker (AB-4); buffered in create mode (AB-3) */}
      <div className="border-t border-dashed pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase">
          New floating image(s)
        </p>
        <input
          type="file"
          multiple
          accept="image/png,image/webp,image/svg+xml,image/*"
          onChange={(e) => {
            handlePick(e.target.files);
            e.target.value = ""; // allow re-picking the same file
          }}
          className="form-input"
        />

        {/* queued rows — each individually configurable + removable */}
        {queue.length > 0 && (
          <div className="space-y-3">
            {queue.map((row) => (
              <div
                key={row.localId}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={row.previewUrl}
                    alt=""
                    className="w-16 h-16 object-contain rounded border bg-white shrink-0"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 min-w-0">
                    <Lbl t="Section">
                      <select className="form-input" value={row.meta.section} onChange={(e) => setRowMeta(row.localId, "section", e.target.value)}>
                        {SECTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    </Lbl>
                    <Lbl t="Side">
                      <select className="form-input" value={row.meta.position} onChange={(e) => setRowMeta(row.localId, "position", e.target.value)}>
                        {SIDES.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    </Lbl>
                    <Lbl t="Vertical">
                      <select className="form-input" value={row.meta.align} onChange={(e) => setRowMeta(row.localId, "align", e.target.value)}>
                        {ALIGNS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    </Lbl>
                    <Lbl t="Size">
                      <select className="form-input" value={row.meta.size} onChange={(e) => setRowMeta(row.localId, "size", e.target.value)}>
                        {SIZES.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    </Lbl>
                    <Lbl t="Animation">
                      <select className="form-input" value={row.meta.animation_type} onChange={(e) => setRowMeta(row.localId, "animation_type", e.target.value)}>
                        {ANIMS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    </Lbl>
                    <Lbl t="Speed">
                      <select className="form-input" value={row.meta.animation_speed} onChange={(e) => setRowMeta(row.localId, "animation_speed", e.target.value)}>
                        {SPEEDS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                      </select>
                    </Lbl>
                    <Lbl t={`Opacity (${row.meta.opacity})`}>
                      <input
                        type="range" min="0.1" max="1" step="0.1"
                        value={row.meta.opacity}
                        onChange={(e) => setRowMeta(row.localId, "opacity", Number(e.target.value))}
                        className="w-full"
                      />
                    </Lbl>
                    {/* "Show on mobile" removed — floats are md+ only (they
                        overlap / hide behind the stacked product image on small
                        screens). Decorative-only, so nothing is lost. */}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.localId)}
                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shrink-0"
                    title="Remove from queue"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* In buffer (create) mode, the parent form uploads on save — show a hint
            instead of an Add button. In update mode, upload the queue now. */}
        {buffered ? (
          queue.length > 0 && (
            <p className="text-[11px] text-amber-600">
              {queue.length}টি floating image queue হয়েছে — theme{" "}
              <strong>Create</strong> করলেই এগুলো upload হবে।
            </p>
          )
        ) : (
          <button
            type="button"
            onClick={handleUploadQueue}
            disabled={uploading || queue.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 disabled:opacity-60 text-sm"
          >
            {uploading ? <MiniSpinner /> : <FaPlus />} Add{" "}
            {queue.length > 0 ? `${queue.length} ` : ""}floating image
            {queue.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

const Lbl = ({ t, children }) => (
  <div>
    <label className="block text-[11px] font-medium text-gray-500 mb-1">{t}</label>
    {children}
  </div>
);
