import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StepOneBaseContext } from "./StepOneBaseContext";
import VariationImageModal from "./VariationImageModal";
import ToggleSwitch from "../sections/ToggleSwitch";
import IconPicker from "../../common/IconPicker/IconPicker";

// Phase 2 combination matrix.
//
// Auto-generates one row per combination of value picks across the *variant
// axes only*. Each row emits BOTH the new combination shape AND the legacy
// variation fields, so the additive migration (Phase 1 plan) doesn't break
// cart/order/courier until they migrate to the resolver.
//
// Row payload:
//   { combination:[sorted value_ids],          // Phase-1 new shape (D2)
//     variation_price_delta, is_active,        // Phase-1 new shape
//     variation_name, variation_price,         // legacy (computed from base+delta)
//     variation_quantity, variation_sku,       // legacy
//     variation_image, variation_video }
//
// variation_image stored as a tagged value-object so the row can reference an
// already-uploaded product image (no duplicate upload) OR a fresh per-row file:
//   { source:"existing", ref:"main" | "other:<index>" }  →  reuse pool item
//   { source:"new",      file: File }                    →  upload new
//   string URL                                           →  legacy (prefilled
//                                                            on update — keeps
//                                                            backward-compat)
// ProductForm.handleDataPost resolves "existing" refs to actual File objects
// from the form pool before appending to FormData. That keeps the backend
// payload shape identical to the original per-row file input.
//
// Final price column = base + delta, read-only, recomputes live from the base
// price the admin typed in StepOnePrice (via StepOneBaseContext).

const cartesian = (arrays) => {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const tail = cartesian(rest);
  return first.flatMap((item) => tail.map((combo) => [item, ...combo]));
};

const StepOneVariationTable = ({
  data,
  inputValueData,
  setFormData,
  // Media pool — passed in from parent ProductForm so each row's modal can
  // show the product's currently-uploaded main + other images as pickable
  // thumbnails. Both may be File, string-URL, or null/undefined.
  mainImage,
  otherImages,
  // Variable mode-এর product-level base buying price + base discount price.
  // These propagate LIVE to every row (admin can override per row). Same
  // pattern as `basePrice` (which the matrix already syncs into Final price
  // via context). Empty / blank base → don't touch existing rows.
  baseBuyingPrice = "",
  baseDiscountPrice = "",
  // Phase A — { attribute_value._id (string): weight_grams } map built from
  // every selected axis attribute that has tracks_weight=true. The row
  // weight = sum of weights for value_ids in that row's combination. Empty
  // map → Weight column hides. NEW rows auto-fill; existing rows preserved.
  valueWeightMap = {},
  // Names of the axes contributing to weight — used in the column tooltip.
  weightAxisNames = [],
}) => {
  // Phase A — weight column only renders when at least one axis has weight.
  const hasWeightAxis = Object.keys(valueWeightMap || {}).length > 0;
  // Compute the sum-weight for a given combination of value_ids. Returns
  // null when no value in the combo has a weight entry — that means the
  // matrix shouldn't auto-fill (preserves manual overrides + handles
  // partial weight data gracefully).
  const sumWeightFor = (value_ids) => {
    if (!value_ids?.length || !hasWeightAxis) return null;
    let sum = 0;
    let any = false;
    for (const vid of value_ids) {
      const w = valueWeightMap[String(vid)];
      if (typeof w === "number") {
        sum += w;
        any = true;
      }
    }
    return any ? sum : null;
  };
  // Base price = the product-level price entered in StepOnePrice. We read it
  // from a context (falling back to 0 if context is absent) so we can render
  // the final-price calc without prop-drilling through StepOne.
  const ctx = useContext(StepOneBaseContext);
  const basePrice = Number(ctx?.basePrice) || 0;

  // Modal state — open against a specific row index.
  const [modalRowIdx, setModalRowIdx] = useState(null);

  const combinations = useMemo(() => {
    const axes = data?.map((attr) => attr?.attribute_values) || [];
    return cartesian(axes);
  }, [data]);

  // Re-seed inputValueData whenever the axis set (or its values) changes.
  // Update-mode preservation: if the current inputValueData already has a row
  // whose `combination` matches the new combo's sorted value_ids, REUSE that
  // row (keeps existing price/stock/image from the saved product). Otherwise
  // seed a blank row. So:
  //   - Add mode (fresh form):       all rows seeded blank
  //   - Update mode (initial mount): existing variations preserved
  //   - Admin tweaks an axis later:  matching combos kept, new combos blank,
  //                                  removed combos dropped
  const [lastShape, setLastShape] = useState(null);
  useEffect(() => {
    const shape = JSON.stringify(
      data?.map((a) => [a._id, (a.attribute_values || []).map((v) => v._id)]),
    );
    if (shape === lastShape) return;

    // Index existing rows by their combination signature.
    const existingByKey = new Map();
    (inputValueData || []).forEach((row) => {
      const key = [...(row.combination || [])].sort().join("|");
      if (key) existingByKey.set(key, row);
    });

    const seeded = combinations.map((combo) => {
      const value_ids = combo.map((v) => v?._id).sort();
      const key = value_ids.join("|");
      const existing = existingByKey.get(key);
      const variation_name = combo
        .map((v) => v?.attribute_value_name)
        .join(" / ");
      const sku = combo
        .map((v) => v?.attribute_value_name?.toLowerCase())
        .join("-");
      if (existing) {
        // Preserve everything the admin/DB already has; just refresh name + base price.
        // Phase A MOD #13 — existing variation_weight_grams preserved as-is
        // even if tracks_weight flipped later; never overwritten by auto-fill.
        return {
          ...existing,
          combination: value_ids,
          variation_name,
        };
      }
      // Phase A — auto-fill variation_weight_grams for NEW rows only,
      // computed from the combination's weight axis values. null → blank
      // input (admin can type a value manually).
      const autoWeight = sumWeightFor(value_ids);
      return {
        combination: value_ids,
        variation_price_delta: 0,
        is_active: true,
        variation_name,
        variation_price: basePrice,
        variation_discount_price: Number(baseDiscountPrice) || 0,
        variation_buying_price: Number(baseBuyingPrice) || 0,
        variation_quantity: 1,
        variation_alert_quantity: 0,
        variation_sku: sku,
        variation_image: null,
        variation_video: null,
        variation_weight_grams: autoWeight,
        variation_badge_text: null,
        variation_badge_icon_key: null,
      };
    });
    setFormData(seeded);
    setLastShape(shape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinations, data, lastShape, basePrice, baseBuyingPrice, baseDiscountPrice, setFormData, inputValueData]);

  // Live-propagate the base buying / discount price to EVERY row whenever the
  // admin edits the base field. (Final price already updates via context
  // because the Final column is computed at render time from basePrice +
  // delta.) Tracks the last-applied base values so unrelated row edits
  // don't trigger spurious overwrites.
  //
  // Seeded from the CURRENT props, not "": on an update form the base prices
  // arrive already populated (RHF defaultValues ← initialData, and the parent
  // won't mount this form until the product has loaded), so refs starting at ""
  // made the very first effect run see a "change" and overwrite every row's
  // saved buying/discount price with the base value.
  const lastBuyingRef = useRef(String(baseBuyingPrice));
  const lastDiscountRef = useRef(String(baseDiscountPrice));

  // A blank base means "no opinion" — leave the rows alone (see the prop
  // docblock). Number("") is 0, not NaN, so Number.isFinite alone would happily
  // propagate a 0 into every row when the admin clears the field.
  const propagatable = (raw) => {
    if (raw === "" || raw === null || raw === undefined) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  useEffect(() => {
    const buyingChanged = String(baseBuyingPrice) !== lastBuyingRef.current;
    const discountChanged = String(baseDiscountPrice) !== lastDiscountRef.current;
    if (!buyingChanged && !discountChanged) return;
    lastBuyingRef.current = String(baseBuyingPrice);
    lastDiscountRef.current = String(baseDiscountPrice);
    if (!Array.isArray(inputValueData) || inputValueData.length === 0) return;
    const nextBuying = propagatable(baseBuyingPrice);
    const nextDiscount = propagatable(baseDiscountPrice);
    if (nextBuying === null && nextDiscount === null) return;
    setFormData(
      inputValueData.map((row) => ({
        ...row,
        ...(buyingChanged && nextBuying !== null
          ? { variation_buying_price: nextBuying }
          : {}),
        ...(discountChanged && nextDiscount !== null
          ? { variation_discount_price: nextDiscount }
          : {}),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseBuyingPrice, baseDiscountPrice]);

  const updateRow = (idx, field, value) => {
    const next = [...inputValueData];
    next[idx] = { ...next[idx], [field]: value };
    // keep variation_price (legacy) in sync with base+delta so old consumers
    // (cart/order/courier) still see a coherent absolute price.
    if (field === "variation_price_delta") {
      const delta = Number(value) || 0;
      next[idx].variation_price = basePrice + delta;
    }
    setFormData(next);
  };

  // Atomic multi-field row update — avoids the stale-closure race when two
  // back-to-back setState calls both read the SAME old inputValueData (React
  // hasn't re-rendered yet, so call #2 overwrites call #1). Use this whenever
  // a single user action needs to update >1 field on the same row.
  const updateRowMulti = (idx, patch) => {
    const next = [...inputValueData];
    next[idx] = { ...next[idx], ...patch };
    if (patch.variation_price_delta !== undefined) {
      const delta = Number(patch.variation_price_delta) || 0;
      next[idx].variation_price = basePrice + delta;
    }
    setFormData(next);
  };

  // Bulk apply
  const [bulkDelta, setBulkDelta] = useState(0);
  const [bulkQty, setBulkQty] = useState(1);
  // Bulk apply intentionally only covers Price delta + Stock — base discount /
  // base buying live-propagate from the "Variation base values" card above,
  // so duplicating them here would just confuse the admin.
  const applyBulk = () => {
    const delta = Number(bulkDelta) || 0;
    const qty = Number(bulkQty);
    setFormData(
      inputValueData.map((row) => ({
        ...row,
        variation_price_delta: delta,
        variation_price: basePrice + delta,
        variation_quantity: Number.isFinite(qty) ? qty : row.variation_quantity,
      })),
    );
  };

  const rowCount = combinations.length;
  const axisNames = (data || [])
    .map((a) => a?.attribute_name)
    .filter(Boolean);
  const outOfStockCount = (inputValueData || []).filter(
    (r) => Number(r?.variation_quantity || 0) <= 0,
  ).length;

  return (
    <>
      {/* Matrix summary — tells admin what they're looking at + warns about
          out-of-stock rows before publish. Shopify-style "review generated
          variants" pattern. */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p>
          🧮 <strong>{rowCount}</strong> variation row
          {rowCount === 1 ? "" : "s"}{" "}
          {axisNames.length > 0 && (
            <>
              generated from <strong>{axisNames.length}</strong> axis
              {axisNames.length === 1 ? "" : "es"}: {axisNames.join(" × ")}
            </>
          )}
          .
          {outOfStockCount > 0 && (
            <span className="ml-2 text-amber-700 font-semibold">
              ⚠️ {outOfStockCount} row{outOfStockCount === 1 ? "" : "s"} with
              zero stock — customer won&apos;t be able to buy these.
            </span>
          )}
        </p>
      </div>

      {/* Phase A A8 — multi weight-axis SUM hint. Surfaces the math so
          admin knows the auto-filled Weight (g) column is base axis SUM,
          not a single value lookup. 2026-06-02 owner feedback. */}
      {weightAxisNames.length > 1 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-900 flex items-start gap-2">
          <span className="text-base">⚖️</span>
          <div>
            <strong>Multiple weight axes detected:</strong>{" "}
            {weightAxisNames.join(" + ")}
            <div className="mt-1 italic text-amber-700">
              Variation weight is auto-filled as the <strong>SUM</strong> of
              every axis weight. Edit any row to override (e.g. add packaging
              grams).
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-semibold my-2">Bulk apply</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            <span className="text-gray-600 mb-1">Price delta (+/−)</span>
            <input
              type="number"
              value={bulkDelta}
              onChange={(e) => setBulkDelta(e.target.value)}
              className="p-2 border rounded-md outline-primaryColor w-32"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="text-gray-600 mb-1">Stock</span>
            <input
              type="number"
              min={0}
              value={bulkQty}
              onChange={(e) => setBulkQty(e.target.value)}
              className="p-2 border rounded-md outline-primaryColor w-32"
            />
          </label>
          <button
            type="button"
            onClick={applyBulk}
            className="px-4 py-2 bg-primaryColor text-white rounded-md hover:opacity-90"
          >
            Apply to all
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200">
        {/* Phase 0.5 follow-up — cap matrix height so 50-100 row tables don't
            push the Save bar off-screen. Header sticks via thead z-index, body
            scrolls vertically + horizontally. */}
        <div
          className="overflow-auto scrollbar-thin"
          style={{ maxHeight: "60vh" }}
        >
          <table className="w-full divide-y-2 divide-gray-200 bg-white text-sm">
            <thead className="bg-[#fff9ee] sticky top-0 z-10">
              <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                <td className="whitespace-nowrap px-4 py-3">#</td>
                <td className="whitespace-nowrap px-4 py-3">Combination</td>
                <td className="whitespace-nowrap px-4 py-3">Price delta</td>
                <td className="whitespace-nowrap px-4 py-3">Final price</td>
                <td
                  className="whitespace-nowrap px-4 py-3 cursor-help"
                  title="Customer-facing discounted price (absolute). Leave 0 if no discount."
                >
                  Discount price ⓘ
                </td>
                <td
                  className="whitespace-nowrap px-4 py-3 cursor-help"
                  title="Your cost — for profit calculation. Customer never sees this."
                >
                  Buying price ⓘ
                </td>
                <td className="whitespace-nowrap px-4 py-3">Stock</td>
                {/* Phase A — Weight column only when at least one axis
                    contributes weight. Tooltip names the source axes. */}
                {hasWeightAxis && (
                  <td
                    className="whitespace-nowrap px-4 py-3 cursor-help"
                    title={`Auto-filled from ${weightAxisNames.join(" + ")}. Edit per row if needed (e.g. add packaging).`}
                  >
                    Weight (g) ⓘ
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3">Active</td>
                <td
                  className="whitespace-nowrap px-4 py-3 cursor-help"
                  title="Optional badge shown on PDP variation chip. Text (max 20 chars) + optional icon. Color = theme primary."
                >
                  Badge ⓘ
                </td>
                <td className="whitespace-nowrap px-4 py-3">Image</td>
                <td className="whitespace-nowrap px-4 py-3">Video</td>
              </tr>
            </thead>
            <tbody>
              {combinations?.map((combo, idx) => {
                const row = inputValueData?.[idx] || {};
                const finalPrice = basePrice + (Number(row.variation_price_delta) || 0);
                const isOOS = Number(row?.variation_quantity || 0) <= 0;
                const isInactive = row?.is_active === false;
                return (
                  <tr
                    key={idx}
                    className={`divide-x divide-gray-200 ${
                      isOOS
                        ? "bg-red-50"
                        : isInactive
                          ? "bg-gray-100 opacity-70"
                          : idx % 2 === 0
                            ? "bg-white"
                            : "bg-tableRowBGColor"
                    }`}
                    title={
                      isOOS
                        ? "Out of stock — customer can't buy"
                        : isInactive
                          ? "Inactive — hidden from storefront"
                          : ""
                    }
                  >
                    <td className="py-1.5 text-center font-medium text-gray-700">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <div className="font-medium text-gray-700">
                        {combo.map((v) => v?.attribute_value_name).join(" / ")}
                      </div>
                      {row.variation_sku && (
                        <code className="block mt-0.5 text-[10px] font-mono text-gray-400 select-all">
                          {row.variation_sku}
                        </code>
                      )}
                    </td>
                    <td className="py-1.5 text-center">
                      <input
                        type="number"
                        value={row.variation_price_delta ?? 0}
                        onChange={(e) =>
                          updateRow(idx, "variation_price_delta", e.target.value)
                        }
                        className="p-1.5 border rounded-md text-center w-24"
                      />
                    </td>
                    <td className="py-1.5 text-center text-gray-700">
                      ৳ {finalPrice}
                    </td>
                    <td className="py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={row.variation_discount_price ?? 0}
                        onChange={(e) =>
                          updateRow(idx, "variation_discount_price", e.target.value)
                        }
                        placeholder="0"
                        className="p-1.5 border rounded-md text-center w-24"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={row.variation_buying_price ?? 0}
                        onChange={(e) =>
                          updateRow(idx, "variation_buying_price", e.target.value)
                        }
                        className="p-1.5 border rounded-md text-center w-24"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={row.variation_quantity ?? 0}
                        onChange={(e) =>
                          updateRow(idx, "variation_quantity", e.target.value)
                        }
                        className="p-1.5 border rounded-md text-center w-20"
                      />
                    </td>
                    {/* Phase A — per-row weight. Empty string → null on
                        submit (backend insertMany would NaN-throw otherwise,
                        MOD #3). Auto-filled by seed effect for NEW rows;
                        admin can override here. */}
                    {hasWeightAxis && (
                      <td className="py-1.5 text-center">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={
                            row.variation_weight_grams === null ||
                            row.variation_weight_grams === undefined
                              ? ""
                              : row.variation_weight_grams
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            updateRow(
                              idx,
                              "variation_weight_grams",
                              v === "" ? null : Number(v),
                            );
                          }}
                          placeholder="—"
                          className="p-1.5 border rounded-md text-center w-20"
                        />
                      </td>
                    )}
                    <td className="py-1.5 text-center">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={row.is_active !== false}
                          onChange={(v) => updateRow(idx, "is_active", v)}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <VariationBadgeCell
                        text={row.variation_badge_text}
                        iconKey={row.variation_badge_icon_key}
                        onTextChange={(v) =>
                          updateRow(
                            idx,
                            "variation_badge_text",
                            v === "" ? null : v,
                          )
                        }
                        onIconChange={(k) =>
                          updateRow(idx, "variation_badge_icon_key", k || null)
                        }
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <VariationImageCell
                        // Prefer multi-image array if present, else fall back
                        // to single-image legacy field for prefill display.
                        images={row.variation_images}
                        legacyImage={row.variation_image}
                        onPick={() => setModalRowIdx(idx)}
                        onClear={() =>
                          updateRowMulti(idx, {
                            variation_images: [],
                            variation_image: null,
                          })
                        }
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <VariationVideoCell
                        value={row.variation_video}
                        onChange={(file) =>
                          updateRow(idx, "variation_video", file)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Final price = product base price + this row&apos;s delta. Toggle a row off
        to hide that combination without deleting it.
      </p>

      <VariationImageModal
        open={modalRowIdx !== null}
        rowLabel={
          modalRowIdx !== null
            ? inputValueData?.[modalRowIdx]?.variation_name
            : ""
        }
        mainImage={mainImage}
        otherImages={otherImages}
        currentValue={
          modalRowIdx !== null
            ? inputValueData?.[modalRowIdx]?.variation_images ||
              (inputValueData?.[modalRowIdx]?.variation_image
                ? [inputValueData[modalRowIdx].variation_image]
                : null)
            : null
        }
        onClose={() => setModalRowIdx(null)}
        onSelect={(arrValue) => {
          // arrValue is an array of {source, url|file}. Store the array on
          // the row; keep variation_image (legacy single) synced to the
          // primary item's URL for cart/order/courier back-compat.
          //
          // Atomic update — earlier 2 back-to-back updateRow() calls hit a
          // stale-closure race where the second call overwrote the first.
          const first = arrValue?.[0];
          let firstUrl = null;
          if (first) {
            if (typeof first === "string") firstUrl = first;
            else if (first instanceof File) firstUrl = null; // resolved on submit
            else if (first.url) firstUrl = first.url;
          }
          updateRowMulti(modalRowIdx, {
            variation_images: arrValue || [],
            ...(firstUrl ? { variation_image: firstUrl } : {}),
          });
        }}
      />
    </>
  );
};

// ── Per-cell preview + "Choose" button ───────────────────────────────────────
// Renders a thumbnail strip summarising what's currently chosen for this row.
// Supports BOTH the new multi-image array (Batch 2 C1) AND the legacy single
// value/URL (back-compat). Modal trigger button opens the multi-pick modal.
const VariationImageCell = ({ images, legacyImage, onPick, onClear }) => {
  // Normalise to an array of preview source strings.
  const previewSrcs = [];
  let labelOverride = null;
  if (Array.isArray(images) && images.length > 0) {
    images.forEach((it) => {
      if (typeof it === "string") {
        previewSrcs.push(it);
      } else if (it instanceof File) {
        try {
          previewSrcs.push(URL.createObjectURL(it));
        } catch {
          /* skip */
        }
      } else if (it && typeof it === "object") {
        if (it.url) previewSrcs.push(it.url);
        else if (it.file instanceof File) {
          try {
            previewSrcs.push(URL.createObjectURL(it.file));
          } catch {
            /* skip */
          }
        }
      }
    });
    labelOverride = `${previewSrcs.length} image${previewSrcs.length === 1 ? "" : "s"}`;
  } else if (legacyImage) {
    if (typeof legacyImage === "string") previewSrcs.push(legacyImage);
    else if (legacyImage instanceof File) {
      try {
        previewSrcs.push(URL.createObjectURL(legacyImage));
      } catch {
        /* skip */
      }
    }
  }

  const hasAny = previewSrcs.length > 0;
  return (
    <div className="flex items-center justify-center gap-1">
      {previewSrcs.slice(0, 3).map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`v-${i}`}
          className="w-8 h-8 rounded object-cover border"
        />
      ))}
      {previewSrcs.length > 3 && (
        <span className="text-[10px] text-gray-500">
          +{previewSrcs.length - 3}
        </span>
      )}
      <button
        type="button"
        onClick={onPick}
        className="px-2 py-1 border rounded cursor-pointer text-xs hover:bg-gray-50"
      >
        {hasAny ? labelOverride || "Change" : "Choose"}
      </button>
      {hasAny && (
        <button
          type="button"
          onClick={onClear}
          className="text-red-500 text-xs hover:underline"
          title="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// (Old single-image cell retained below for reference — no longer used.)
const VariationImageCellLegacy = ({ value, mainImage, otherImages, onPick, onClear }) => {
  // Resolve preview source from the row's stored value-shape.
  let preview = null;
  let summary = "Choose";
  if (value) {
    if (typeof value === "string") {
      // Legacy / prefill: a direct S3 URL string.
      preview = value;
      summary = "Change";
    } else if (value instanceof File) {
      // Old shape (raw File) — keep working until the row is re-picked.
      try {
        preview = URL.createObjectURL(value);
      } catch {
        preview = null;
      }
      summary = "Change";
    } else if (typeof value === "object" && value.source === "existing") {
      let item = null;
      if (value.ref === "main") {
        item = mainImage;
      } else if (value.ref?.startsWith("other:")) {
        const i = Number(value.ref.split(":")[1]);
        item = (otherImages || [])[i];
      }
      if (typeof item === "string") preview = item;
      else if (item instanceof File) {
        try {
          preview = URL.createObjectURL(item);
        } catch {
          preview = null;
        }
      }
      summary =
        value.ref === "main"
          ? "Main"
          : `Other ${Number(value.ref.split(":")[1]) + 1}`;
    } else if (typeof value === "object" && value.source === "new" && value.file instanceof File) {
      try {
        preview = URL.createObjectURL(value.file);
      } catch {
        preview = null;
      }
      summary = "New";
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {preview && (
        <img
          src={preview}
          alt="variation"
          className="w-8 h-8 rounded object-cover border"
        />
      )}
      <button
        type="button"
        onClick={onPick}
        className="px-2 py-1 border rounded cursor-pointer text-xs hover:bg-gray-50"
      >
        {summary}
      </button>
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="text-red-500 text-xs hover:underline"
          title="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ── Per-cell video pick + clear ─────────────────────────────────────────────
// Renders a small <video> thumbnail preview (saved URL OR fresh File via
// createObjectURL) so the admin can confirm what's wired without opening the
// PDP. Plus a "Replace" label that swaps the file and a clear ✕ button.
const VariationVideoCell = ({ value, onChange }) => {
  let previewSrc = null;
  let label = "Choose";
  if (value instanceof File) {
    try {
      previewSrc = URL.createObjectURL(value);
    } catch {
      previewSrc = null;
    }
    label = "Replace";
  } else if (typeof value === "string" && value) {
    previewSrc = value;
    label = "Replace";
  }
  return (
    <div className="flex items-center justify-center gap-1">
      {previewSrc && (
        <video
          src={previewSrc}
          muted
          playsInline
          preload="metadata"
          className="w-10 h-10 rounded border object-cover bg-black"
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
          title="Hover to preview"
        />
      )}
      <label
        className={`px-2 py-1 border rounded cursor-pointer text-xs hover:bg-gray-50 ${
          previewSrc ? "border-emerald-300 text-emerald-700" : ""
        }`}
      >
        {label}
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-red-500 text-xs hover:underline"
          title="Clear video"
        >
          ✕
        </button>
      )}
    </div>
  );
};

// ── Per-cell badge editor ───────────────────────────────────────────────────
// Compact 2-input cell: text (max 20) + icon picker. Both optional — either
// alone is enough to render a badge on PDP. Background color comes from the
// theme primary at render time, so admin doesn't pick color here. Owner-locked
// decision 2026-06-04. Reuses the shared IconPicker (which owns its own modal).
const VariationBadgeCell = ({ text, iconKey, onTextChange, onIconChange }) => {
  return (
    <div className="flex items-center gap-2 min-w-[260px]">
      <input
        type="text"
        maxLength={20}
        value={text || ""}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="e.g. সেরা প্যাক"
        className="p-1.5 border rounded-md text-xs flex-1 min-w-0"
      />
      <div className="shrink-0">
        <IconPicker value={iconKey} onChange={onIconChange} />
      </div>
    </div>
  );
};

export default StepOneVariationTable;
