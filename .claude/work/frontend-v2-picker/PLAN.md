# Frontend V2 Picker Rebuild — PLAN

**Created:** 2026-06-03
**Track:** Frontend V2 — 4 backlog items bundled (C9 + C10 + C11 + C12)
**Status:** Plan approved, edge-audit done, coding pending

## Goal

Rebuild the themed PDP variation picker (currently inline in `SingleProduct.jsx:837-923`) so it handles:

- **C9** — Pre-click OOS visual cue + toast feedback
- **C10** — Overflow cap with "+N more" search modal (8/14/20 by viewport)
- **C11** — `display_type="dropdown"` native select branch
- **C12** — Swatch-no-hex fallback to button-style with full label

All four touch the same picker render loop, so they ship together as one component extraction.

## Decisions locked

| # | Decision | Rationale |
|---|----------|-----------|
| Q1 | Overflow caps: **mobile 8 / tablet 14 / desktop 20** (fixed, viewport-driven) | Dynamic 2-row measurement deemed over-engineered for MVP; fixed caps via `matchMedia` is ~15 LOC vs ~80 LOC measurement infra |
| Q2 | Swatch-no-hex → **button-style with full label** | First-letter circles ambiguous in Bangla (e.g. "হ" matches হলুদ + হালকা); full label is clearer + a11y-friendly |
| Q3 | OOS click → **faded chip + click-allowed + toast** | Graceful fallback (existing) keeps working; toast explains why price/stock changed, kills user confusion |

## In scope (files)

```
themedProduct/singeProduct/
├── SingleProduct.jsx           EDIT — replace picker JSX (lines 837-923) with <VariationPicker> calls
├── VariationPicker.jsx         NEW — one attribute's chip row, branches on display_type
└── OverflowValuesModal.jsx     NEW — "+N more" search modal
```

Plus helper:
- `src/utils/helper.js` — add `wouldComboBeInStock(product, currentVars, attrName, candidateVal)`

**Total ~250 LOC** across the new files.

## Out of scope (do NOT touch)

- `handleSelectVariation` URL sync logic
- `findVariationByValueIds` set-intersection matching
- `applyVariationPriceStock` shared helper
- Initial seed effect (Fix #23 — first in-stock variation)
- Cart / order / analytics chain
- F1 URL pattern (`?color=jet-black&size=m`)
- Existing aria-label + title from C14 fix (preserved)
- Existing A4 hex validation (preserved)

## Component architecture

### `<VariationPicker attribute={attr} ... />`

Single attribute row. Internally:

1. **Cap selection** — `useEffect` + `window.matchMedia("(min-width: 1024px)")` and `(min-width: 768px)` → `visibleCap` state = 8 | 14 | 20
2. **Value split** — `attribute.attribute_values` split into:
   - `visibleValues` — first `visibleCap`, but **selected value always pinned first** (never hidden in modal)
   - `overflowValues` — rest
3. **Branch render** per value, based on `attribute.display_type`:
   - `"swatch"` + valid hex → `<ChipSwatch>` (color circle)
   - `"swatch"` + no/invalid hex → `<ChipButton>` (full label, same as button branch)
   - `"button"` → `<ChipButton>`
   - `"dropdown"` → `<ChipDropdown>` (native `<select>`, ONLY ONE for the attribute, no chip loop)
   - `unset` / legacy → infer from `isHexColor(value.attribute_value_code)` (existing behavior preserved for back-compat)
4. **OOS cue per chip** — `wouldComboBeInStock(...)` → if `false`, apply `opacity-50` + add strikethrough for buttons / diagonal slash overlay for swatches + `title="স্টকে নেই"`
5. **"+N more" trigger** — if `overflowValues.length > 0`, show button → opens `<OverflowValuesModal>`

Inline branches (no separate `<ChipSwatch>` / `<ChipButton>` / `<ChipDropdown>` files) to keep file count low. ~150 LOC.

### `<OverflowValuesModal attribute, values, onSelect, onClose />`

- Backdrop click + Esc closes
- Search input with `autoFocus`, `trim().toLowerCase().includes()` filter (Bangla-safe via trim, no Unicode normalization)
- Chip render uses the SAME inline branch logic as `<VariationPicker>` (extract a `renderChip(value)` function inside `VariationPicker` and pass it down, OR duplicate the branch — TBD during coding, prefer extraction)
- On select → `onSelect(value)` + `onClose()` — caller wires both
- ~80 LOC

## Helper: `wouldComboBeInStock`

```js
// src/utils/helper.js
export const wouldComboBeInStock = (product, currentVars, attrName, candidateVal) => {
  if (!product?.is_variation) return true;
  const trial = { ...currentVars, [attrName]: candidateVal };
  // Skip if combo incomplete — don't fade chips when user hasn't fully picked
  const axes = variantAxisAttributes(product) || [];
  if (axes.some((a) => !trial[a.attribute_name]?._id)) return true;
  const ids = Object.values(trial).map((v) => String(v?._id)).filter(Boolean);
  if (!ids.length) return true;
  const target = new Set(ids);
  const found = (product.variations || []).find((v) => {
    if (v?.is_active === false) return false;
    const combo = v?.combination;
    if (!Array.isArray(combo) || combo.length !== target.size) return false;
    return combo.every((id) => target.has(String(id)));
  });
  return found ? Number(found.variation_quantity) > 0 : false;
};
```

Generic — works for 1 axis, 2 axes, N axes. Single-axis-safe (BLOCKER #1 fix). Incomplete-combo guard (BLOCKER #2 fix).

## OOS toast

```js
toast.error("এই combination স্টকে নেই, কাছাকাছি একটি দেখানো হচ্ছে", {
  toastId: "oos-warn",  // dedupe — rapid clicks won't spam
  autoClose: 2000,
});
```

Then existing `handleSelectVariation` runs (which already does graceful fallback via `findVariationByValueIds` returning null → set to first active variation).

## Dropdown handler

```jsx
<select
  onChange={(e) => {
    const picked = attribute.attribute_values.find(
      (v) => String(v._id) === e.target.value
    );
    if (picked) handleSelectVariation(picked, attribute.attribute_name);
  }}
  value={selectedVariations[attribute.attribute_name]?._id || ""}
>
  {visibleValues.map((v) => (
    <option key={v._id} value={v._id}>{v.attribute_value_name}</option>
  ))}
  {overflowValues.length > 0 && <option disabled>──── আরো {overflowValues.length} টি ────</option>}
</select>
{overflowValues.length > 0 && (
  <button onClick={() => setModalOpen(true)}>+{overflowValues.length} আরো</button>
)}
```

For dropdown, overflow modal triggers separately (since `<select>` can't host a custom "more" item natively — disabled option is just a hint).

## Edge-audit findings absorbed

From `/edge-audit` run (2026-06-03):

### Blockers addressed
- ✅ BLOCKER #1 — single-axis trap → generic combo lookup in helper
- ✅ BLOCKER #2 — incomplete-combo trap → axes-complete guard in helper
- ✅ BLOCKER #3 (zero-width container) — **DISSOLVED** by switching to fixed caps
- ✅ BLOCKER #4 (font race) — **DISSOLVED** by switching to fixed caps

### High addressed
- ✅ HIGH #5 — modal close-on-select → `onSelect` calls both `handleSelectVariation` + `onClose`
- ✅ HIGH #5b — selected chip always visible → split logic pins selected first
- ✅ HIGH #6 — dropdown URL sync → lookup value-object from `_id` before calling handler
- ✅ HIGH #7 — OOS toast spam → `toastId: "oos-warn"` dedupe

### Medium addressed
- ✅ MEDIUM #10 — Modal Esc + autoFocus → keyDown handler + `autoFocus` on search input
- ✅ MEDIUM #11 — Bangla search → `trim().toLowerCase().includes()`

### Deferred (acceptable)
- 🟡 MEDIUM #8 (very-wide Bangla values cap-vs-fit mismatch) — owner-acceptable trade-off; document in commit
- 🟡 MEDIUM #9 (admin changes display_type mid-flight) — transient; refresh fixes
- 💡 NICE-TO-HAVE — chip animations, analytics event, "reset" link — all deferred

## Test plan (for `/test` after coding)

### Tier 1 — Build verification
- Frontend `npm run build` exits 0

### Tier 2 — Functional smoke
- B11 product (existing 2-axis: TestWeight + Test Weight 2) — chips render, OOS faded, toast on click, URL still syncs
- Single-axis product — swatch only color → chips render correctly without breaking
- No-variation product — picker not rendered (existing guard `product?.is_variation` preserved)

### Tier 3 — Display type branches
- Create attribute with `display_type=swatch` + valid hex → color circle ✓
- Same attribute with no hex (e.g. attribute_value_code empty) → button-style chip with full label ✓
- Create attribute with `display_type=button` → button chip (existing behavior unchanged) ✓
- Create attribute with `display_type=dropdown` → native `<select>` renders ✓

### Tier 4 — Overflow caps
- Attribute with 5 values → all visible, no "more" button (mobile/tablet/desktop)
- Attribute with 10 values → mobile: 8 visible + "+2 more"; tablet/desktop: all visible
- Attribute with 16 values → mobile: 8 + "+8"; tablet: 14 + "+2"; desktop: all
- Attribute with 25 values → mobile: 8 + "+17"; tablet: 14 + "+11"; desktop: 20 + "+5"

### Tier 5 — Modal
- "+N more" click → modal opens, search autoFocus, type "white" → filter live
- Bangla search "সাদা" matches stored "সাদা " (trimmed)
- Select in modal → modal closes + chip selected + URL updates
- Esc closes modal
- Backdrop click closes modal

### Tier 6 — OOS edge cases
- Pick size M (in stock), then look at colors — colors that have OOS variation for M are faded
- Click faded color → toast appears (once, even on rapid click) + graceful fallback to nearest available variation
- All variations of a value OOS → chip faded across all axes combos
- Incomplete selection (only color picked, size not selected yet) → no chips faded (incomplete-combo guard)

### Tier 7 — Real-world scenarios
- Customer on slow 3G — chips render before fonts load → visual ok? (acceptable: re-render on font swap is fine, no measurement to break)
- Customer with screen reader — dropdown has accessible label, modal has Esc, chips have aria-label (C14 preserved)
- Customer mid-purchase, owner changes display_type from swatch → dropdown — customer refresh shows new render
- Customer pastes deep-link URL with `?color=jet-black&size=m` — initial seed (Fix #23 preserved) still picks first in-stock; URL value wins (Fix #23 logic)

## NEXT SESSION START HERE

If session breaks mid-flight, resume at: **whatever task in TODO.md is the first unchecked item**. PLAN.md + decisions are locked; no need to re-litigate.
