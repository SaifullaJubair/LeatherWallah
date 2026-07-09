# Client bug report — investigation + fix plan

**Date:** 2026-07-10
**Reported by:** client (via owner)
**Investigated by:** Claude (code read + live production DB queries)

**Verdict: all 5 reports are real bugs. All 5 exist identically in both FruitSnacks and Leather Wallah**, because both descend from the same Artisan Leather codebase. Nothing here was introduced by the 2026-07-10 Leather-Wallah→FruitSnacks port (commits `763b901`…`32ea84d`); every defect predates it.

> **Leather Wallah launches 2026-07-13.** Bug 5 fires on the demo-data handover flow, so it will hit that client. Bugs 1 and 2 corrupt data silently. Prioritise accordingly.

---

## Summary table

| # | Symptom (client's words) | Root cause | Apps to touch | Severity | Data loss? | Status |
|---|---|---|---|---|---|---|
| 1a | "variation discount price সব same হয়ে যায়" | `useRef("")` never seeded on edit → propagation effect fires on first render | Admin | **Critical** | **Yes** — silently overwrites saved prices | Open |
| 1b | "badge remove করলে দুই row-এ দেখায়" | Admin omits empty field; backend `updateOne` `$set` only merges present keys | Admin + Backend | **High** | No (stale value persists) | Open |
| 2 | "update product এ গেলেই theme default হয়ে যায়" | `theme_id` wrongly in `OPTIONAL_FK_FIELDS`, whose loop read an absent key as *cleared* → `$unset` | Backend + Admin | **Critical** | **Yes** — wipes theme assignment | ✅ Fixed 2026-07-10 |
| 3 | "top save btn এ কাজ হয় না, row-wise save লাগে" | `VariationWeightEditor` is the only uncontrolled section; no bulk variation endpoint exists | Admin + Backend | Medium | No | Open |
| 4 | "icon না দিলে fallback icon দেখায়" | `FaUtensils` hardcoded fallback; `icon_key` ignored entirely | Frontend | Medium | No | Open |
| 5 | "demo data delete করলেও theme এ 6 products দেখায়" | Query-level `deleteOne` never fires the document-only counter hook | Backend | **High** | No (counter drift) | Open |

> **Bug 2 note:** the fix was the *opposite* of what this doc originally prescribed. See its section below — the planned "add a hidden `theme_id` field, don't touch `OPTIONAL_FK_FIELDS`" advice rested on an unchecked assumption.

---

## Bug 1 — Variation discount price + badge

This is **two independent defects** that the client experienced as one.

### 1a. Discount price collapses to one value on product update

**File:** `*/Admin/src/components/ProductNew/stepOne/StepOneVariationTable.jsx:173-196`

```js
const lastBuyingRef  = useRef("");   // ← always starts as ""
const lastDiscountRef = useRef("");
useEffect(() => {
  const discountChanged = String(baseDiscountPrice) !== lastDiscountRef.current;
  if (!buyingChanged && !discountChanged) return;
  ...
  setFormData(inputValueData.map(row => ({ ...row, variation_discount_price: nextDiscount })));
}, [baseBuyingPrice, baseDiscountPrice]);
```

On **add**, propagating the base price to every row is intended behaviour. On **update**, the form loads `baseDiscountPrice = "200"` from the DB. The ref is still `""`, so `"200" !== ""` is true on the *first render*, the effect fires, and it stamps `200` onto every row — destroying the per-row values (200 / 250) that came from the database. The admin sees identical discounts across all variations and, if they save, the corruption is persisted.

The refs are only ever written *inside* the effect. They are never seeded from the loaded product, and the component has no `mode` / `isEdit` prop to distinguish add from update.

**Fix:** seed both refs with the initial base values on mount so the first render is a no-op, and only propagate on a genuine user edit.

```js
const lastBuyingRef   = useRef(String(baseBuyingPrice ?? ""));
const lastDiscountRef = useRef(String(baseDiscountPrice ?? ""));
```

Guard against the case where `baseDiscountPrice` arrives asynchronously (react-hook-form `reset()` after fetch) — if the value is empty on mount and populated later, the same bug reappears. Safest shape: track a `hydratedRef` that flips true once `inputValueData` is first populated from the DB, and skip propagation until then.

**Verify:** load a product with two variations at different discounts, open edit, save without touching anything → both discounts unchanged in DB.

---

### 1b. Removing a badge does not remove it

**Files:**
- `*/Admin/src/components/ProductNew/ProductForm.jsx:1243-1257`
- `*/Backend/src/app/product/product.controllers.ts:1640-1645`

Admin side — the field is appended **only when non-empty**:

```js
if (row.variation_badge_text !== null &&
    row.variation_badge_text !== undefined &&
    row.variation_badge_text !== "") {
  fd.append(`${prefix}[variation_badge_text]`, row.variation_badge_text);
}
```

Backend side — a partial `$set`:

```js
for (const v of toUpdate) {
  await VariationModel.updateOne({ _id: v._id }, v, { runValidators: true });
}
```

Mongoose's `updateOne(filter, obj)` builds `$set` from the keys **present** in `obj`. Because the admin never sends `variation_badge_text` when it is empty, the key is absent, so Mongo leaves the previous badge untouched. Clearing a badge is therefore impossible. Move it to another row and the PDP renders it on **both**.

Same applies to `variation_badge_icon_key`.

**Fix (choose one, do not do both):**

- **Preferred — send the clear explicitly.** Always append the field; send `""` when cleared. Then have the backend coerce `""` → `null` for these two fields before the `updateOne` (a `""` in a `String` field is a valid value, so an explicit null is what we want stored).
- Alternative — build an explicit `$set`/`$unset` pair per row in the backend, mirroring the `OPTIONAL_FK_FIELDS` pattern already used in `updateProductServices`.

Prefer the first: it keeps the "absent means unchanged" contract intact for every other field, which the `updateOne` merge currently relies on.

**Verify:** set a badge on variation 1 → save → remove it, add one to variation 2 → save → PDP shows exactly one badge, on variation 2.

---

## Bug 2 — Product update resets the theme to default

**Files:**
- `*/Admin/src/components/ProductNew/ProductForm.jsx` — contains **zero** occurrences of `theme_id`
- `*/Backend/src/app/product/product.services.ts:3147-3178`

```js
const OPTIONAL_FK_FIELDS = ["brand_id","category_id","product_supplier_id","warehouse_id","theme_id"];

for (const field of OPTIONAL_FK_FIELDS) {
  const present = Object.prototype.hasOwnProperty.call(data, field);
  const value = (data as any)[field];
  const isCleared = !present || value === undefined || value === null || value === "";
  if (isCleared) {
    unsetData[field] = "";      // → $unset
    delete updateData[field];
  }
}
```

`theme_id` is only editable from the **Page Content** form. The main **Product** form never sends it. The backend cannot distinguish "field not sent" from "admin cleared it" — `!present` is treated as cleared — so every save from the product form `$unset`s the theme.

The client's second observation ("page content থেকেও অন্য কিছু update করলে theme default হয়") is the same root cause reached from the other direction: any code path that PATCHes the product without including `theme_id` wipes it.

### ✅ FIXED 2026-07-10 — and the planned fix above was wrong

The original plan here said: add `theme_id` as a hidden field in `ProductForm`, and **do not** remove it from `OPTIONAL_FK_FIELDS` because "that would make it impossible to ever clear a theme."

That premise was never checked. Clearing a theme does **not** go through `updateProductServices` at all. `updateProductPageContentServices` (same file, ~line 3004) has its own independent `$set`/`$unset` builder with a dedicated `theme_id` branch:

```js
if (field === "theme_id") {
  if (value === undefined || value === "") continue;   // no change
  if (value === null) { unset.theme_id = ""; continue; } // explicit clear
  set.theme_id = value;
  continue;
}
```

It's a JSON route, so `null` survives the wire. That is the **only** path that assigns or clears a theme. `theme_id`'s presence in `OPTIONAL_FK_FIELDS` was therefore dead weight on the one code path that read it — and actively harmful. The comment above the list shows how it got there: a 2026-06-05 audit added it by analogy with the other three FKs, without checking that the main form has no theme control.

**Shipped instead:**

1. **Backend** `product.services.ts` — removed `theme_id` from `OPTIONAL_FK_FIELDS`, and changed the loop so an absent key means *"this caller does not manage the field"* rather than *"cleared"*:
   ```js
   if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
   const isCleared = value === undefined || value === null || value === "";
   ```
2. **Admin** `ProductForm.jsx` — the loop change made key-presence load-bearing, and `warehouse_id` was appended only when truthy (`if (warehouseId) fd.append(...)`), so clearing a warehouse would have become a silent no-op. Now always sent: `fd.append("warehouse_id", warehouseId || "")`.

`brand_id` and `product_supplier_id` needed no change — the update controller writes both keys unconditionally (as `undefined` when empty, `product.controllers.ts:1353,1425`), so `hasOwnProperty` is always true for them.

**Deploy order is safe either way.** Admin sending `""` also works against the *old* backend (whose `!present` clause caught `""` too), so Admin can ship first or alongside — never after.

**Verified:** backend `tsc --noEmit` clean, admin `vite build` clean, and the loop exercised against all four real payload shapes — ordinary save, clear-brand, clear-warehouse, themed-product save. `theme_id` untouched in all four; both clear paths still emit `$unset`.

**Owner manual check:** assign a theme via Page Content → edit the product name in Product form → save → theme still assigned. Then clear the theme from Page Content → save → theme actually cleared. Separately: assign a warehouse → clear it → save → warehouse actually cleared.

**Commits:** Backend `3909d38`, Admin `c55f089`. Both on `main`, pushed, Coolify auto-deploy.

---

## Bug 3 — Page Content: row edits are not saved by the top "Save Changes"

**File:** `*/Admin/src/components/ProductPageContent/VariationWeightEditor.jsx:31,63-64`

```js
const res = await fetch(`${BASE_URL}/variation/by-product/${productId}`, { credentials: "include" });
...
const res = await fetch(`${BASE_URL}/variation/${v._id}`, { method: "PATCH", ... });
```

### This is not a design decision — it is an incomplete implementation

Every *other* section of the Page Content form is a **controlled component**. Benefits, Use Cases, Short Features, Process Steps all render through `IconTextRepeater`, which takes `value` / `onChange` and lifts each row edit into the parent's state:

```jsx
<IconTextRepeater value={shortFeatures} onChange={setShortFeatures} ... />
```

The only network call inside `IconTextRepeater` is `POST /image_upload` — an *upload*, not a save. Its rows ride the single top Save, which does one `PATCH /product/page-content`.

`VariationWeightEditor` is the **sole exception** in the whole form:

```jsx
<VariationWeightEditor productId={product?._id} />   // ← only an id. no value, no onChange.
```

It fetches its own rows, keeps them in local `useState`, and persists them through its own per-row Save button. Nothing about that state reaches the parent's `react-hook-form`, so the top form's payload contains only hero-level fields (`badge_text`, `hero_corner_badge`) — never the variation rows.

**Why it ended up this way:** variations live in a separate collection. `PATCH /product/page-content` only writes the product document (verified — it never touches `VariationModel`), and the backend exposes only `PATCH /variation/:id` — **one row at a time, no bulk endpoint**. Nobody built the bulk path, so the UI grew a row-wise button to work around it.

So the client is right to expect one Save. There is no product trade-off to weigh here.

### Fix

1. **Add a bulk write path in the backend.** Either accept `variation_rows[]` on `PATCH /product/page-content`, or add `PATCH /variation/bulk`. Prefer extending page-content so one request stays atomic-ish and the admin gets one failure surface.
2. **Make `VariationWeightEditor` controlled.** Give it `value` / `onChange` like `IconTextRepeater`. Remove its internal save + per-row Save button. Initial load can stay inside the component (fetch once, hand the rows up via `onChange`), or move to the parent alongside the other page-content fetches.
3. **Include the rows in the parent's `onSubmit`,** and report a partial failure honestly rather than toasting a blanket success.

> **Do Bug 3 and Bug 1b together.** Both touch the same two fields (`variation_badge_text`, `variation_badge_icon_key`). If the bulk endpoint is built without fixing 1b's clear semantics, the new path inherits the same `$set`-merge trap and an emptied badge still will not clear.

**Verify:** change a row's badge, click only the top Save, reload → change persisted. Then clear a badge and save → it is actually gone.

---

## Bug 4 — Use-case icons show a hardcoded fallback

**File:** `*/Frontend/src/components/frontend/themedProduct/theme/sections/UseCasesSection.jsx:3,50-60`

```js
import { FaUtensils } from "react-icons/fa6";
...
{u.icon_url ? (
  <img src={u.icon_url} ... />
) : (
  <FaUtensils size={22} />       // ← hardcoded cutlery icon
)}
```

Two problems, and the second is worse than what the client reported:

1. When the admin sets no icon, a **fork-and-knife** icon appears. On a leather-goods or any non-food store this is simply wrong.
2. **`icon_key` is never read.** If the admin picks an icon from the icon picker, this component still renders the cutlery. Only a custom uploaded `icon_url` works at all.

For contrast, the sibling `BenefitsUseCasesSection.jsx` *does* honour `icon_key` (via `DynamicIcon`) but still falls back to `FaCheck` / `FaUtensils`. And the older, now-unused `components/theme/sections/UseCasesSection.jsx` gets it right: `{u.icon_url && (...)}` with no fallback.

**Fix:** restore the priority chain the code comments already claim — `icon_url` → `icon_key` (via `DynamicIcon`) → **render nothing** (no icon, and collapse the badge circle so the layout doesn't leave a coloured empty puck). Apply the same to `BenefitsUseCasesSection`'s `FaCheck`/`FaUtensils` fallbacks. Remove the now-unused `react-icons/fa6` imports.

**Verify:** a use-case with no icon renders text only, with no empty circle; one with `icon_key` renders the picked icon; one with `icon_url` renders the upload.

---

## Bug 5 — Theme "used in N products" never decrements

**Confirmed against the live production Contabo DB**, not just by reading code:

| Theme | `used_in_products` | actual products | drift | `is_deletable` |
|---|---|---|---|---|
| **Demo Fresh Food** | **6** | **0** | **+6** | false |
| **Apple Red** | 9 | 1 | +8 | false |
| Orange Citrus | 2 | 2 | 0 | false |
| Mango Gold | 1 | 1 | 0 | false |
| **Banana Yellow** | 1 | 0 | +1 | false |

(total products: 5; with a theme: 4)

### Root cause

The counter hook is registered as **document**-level:

```js
// Backend/src/app/product/product.model.ts:607
productSchema.post("deleteOne", { document: true, query: false }, async function () {
  if (this?.theme_id) await adjustThemeUsage(this.theme_id, -1);
});
```

…but the delete is **query**-level:

```js
// Backend/src/app/product/product.services.ts — deleteProductServices
const Product = await ProductModel.deleteOne({ _id }, { runValidators: true });
```

Mongoose does not fire a document hook for a query-level delete. So `used_in_products` is never decremented — not on demo clear, not on a normal admin product delete.

> The comment in `demo.services.ts` — *"Looped one-by-one (not deleteMany) so the cascade + theme-counter hooks run per product"* — **is factually wrong**. The loop does make the variation/S3 cascade run per product; it does nothing for the theme counter.

### Second symptom, same cause

`is_deletable` is only recomputed *inside* `adjustThemeUsage()`. Since that never runs on delete, `is_deletable` is stuck at `false` for **every** theme — including Orange Citrus and Mango Gold, whose counters are actually correct. The client cannot delete any theme.

### Fix — and the trap in it

The obvious change is `deleteOne` → `findOneAndDelete`, since `post("findOneAndDelete")` already exists (line 601) and receives the doc.

**But that alone breaks product deletion.** The controller checks:

```js
// product.controllers.ts:2110
const result = await deleteProductServices(_id);
if (result?.deletedCount > 0) { ... } else { throw new ApiError(400, "Product delete failed !"); }
```

`findOneAndDelete` returns the **deleted document**, which has no `deletedCount`. The guard would fail and throw *"Product delete failed !"* on every successful delete — a worse bug than the one being fixed.

**So the fix is two coordinated edits:**

1. `deleteProductServices` → use `findOneAndDelete({ _id })`, return the doc.
2. `deleteProduct` controller → check `if (result)` instead of `result?.deletedCount > 0`.

Check for any other caller of `deleteProductServices` before changing the contract. Known callers: `demo.services.ts:82` (ignores the return value) and `product.controllers.ts:2110`.

### Backfill for existing drift

The code fix stops *new* drift; it does not repair the live data. Ship an idempotent script that recomputes truth from the products collection:

```js
for (const t of await ThemeModel.find({})) {
  const real = await ProductModel.countDocuments({ theme_id: t._id });
  await ThemeModel.updateOne({ _id: t._id }, { $set: { used_in_products: real, is_deletable: real === 0 } });
}
```

Run it once per environment after deploying the code fix. Safe to re-run.

### Verify

Cannot be verified through the UI alone. Create a throwaway product with a theme on a **local** DB, note `used_in_products`, delete the product, confirm the counter decremented and `is_deletable` flipped. Do not test this against production.

---

## Secondary finding — demo clear does not cover everything the seeds write

Not reported by the client, but found while investigating Bug 5.

`clearDemoDataServices` deletes 6 collections. The seeds write 9+.

| Collection | Written by | Cleared? |
|---|---|---|
| products, reviews, banners, sliders, attributes, categories | `seed-demo.ts` | ✅ |
| **themes** | `seed-demo.ts`, `seed.theme.ts` | ❌ intentional (see file docblock) — but they survive with a lying counter |
| **uithemes** | `seed.ui_theme.ts` | ❌ |
| **roles** | both seeds | ❌ |
| **suppliers, warehouses, campaigns, flashsales, offers** | `seed-promotions.ts` | ❌ |

Two distinct problems:

- Keeping demo **themes** is a deliberate product decision. Fine — but Bug 5 makes them undeletable and mislabelled. Fixing Bug 5 resolves the client-visible part.
- `seed-promotions.ts` **stamps no `is_demo` flag at all**, so `clear` could not find those rows even if it wanted to. Today those collections are empty in production, so nothing is broken — but any client handed over after a `seed:promo` run will inherit demo campaigns/offers/flash-sales with no way to bulk-remove them.

**Recommendation:** stamp `is_demo: true` in `seed-promotions.ts` and extend `clearDemoDataServices` + `countDemoDataServices` to cover those five collections. Treat as a separate, lower-priority change from the five reported bugs.

### Orphan audit — clean

For completeness, checked the live DB for dangling references after the demo clear. **All zero:**

- `variations.product_id` orphans: 0 / 10 (the cascade genuinely works)
- reviews, carts, wishlists, flashsales, campaigns, offers, abandonedcarts → 0 orphaned `product_id`
- products → dead `category_id`: 0, dead `brand_id`: 0, dead `theme_id`: 0
- `products.category_path` dead entries: 0

The theme counter is the **only** stale reference left behind.

---

## Suggested order of work

Grouped so each lands as one reviewable, independently shippable change.

| Step | Change | Apps | Why this order |
|---|---|---|---|
| ~~1~~ | ~~**Bug 2**~~ — ✅ done: dropped `theme_id` from `OPTIONAL_FK_FIELDS`, absent-key now means "no change"; Admin always sends `warehouse_id` | Backend + Admin | Highest data-loss risk, smallest diff |
| 2 | **Bug 1a** — seed the propagation refs | Admin | Second data-loss bug; isolated to one component |
| 3 | **Bug 5** — `findOneAndDelete` + controller guard + backfill script | Backend | Blocks the LW handover; needs the paired controller edit |
| 4 | **Bug 4** — icon fallback chain | Frontend | Cosmetic, self-contained; safe to ship any time |
| 5 | **Bugs 1b + 3 together** — bulk variation endpoint, controlled `VariationWeightEditor`, explicit badge clear | Admin + Backend | Both touch `variation_badge_text` / `variation_badge_icon_key`; splitting them means building the bulk path and immediately re-hitting the `$set`-merge trap |
| 6 | *(optional)* `is_demo` on promo seeds + extend clear | Backend | Not client-reported; no live impact today |

**Leather Wallah first for steps 1–3** given the 2026-07-13 launch; then port the identical fixes to FruitSnacks. Steps 4–5 can go to FruitSnacks first, since it has no imminent launch and just received a deploy.

Step 5 is the largest change and the only one that adds a backend route. It should not be rushed into Leather Wallah before launch — the per-row Save button is ugly but it *works*, so the client is not blocked by it.

## Testing discipline

Per `CLAUDE.md`, steps 1, 2 and 5 touch admin form flows and cross app boundaries, so they need `/test` (and `feature-tester` if 3+ blockers surface). Specifically:

- Bugs 1a, 1b, 2, 3 — drive the real admin UI in a browser. Static reading is not sufficient; today's iOS-zoom miss (commit `32ea84d`) is the cautionary example: the commit message claimed the fix, the browser proved it wrong.
- Bug 5 — cannot be browser-tested. Use a local DB round-trip (create product with theme → delete → assert `used_in_products` decremented and `is_deletable` flipped). Never against production.
- Bug 4 — browser check that the empty case renders no icon *and* no empty badge circle.
- Step 3 (Bug 5) additionally needs a **regression check on ordinary product delete from the admin**, because it changes `deleteProductServices`' return contract — see the trap documented above. A green demo-clear does not prove the normal delete path still works.

## Cross-project note

Every fix in this document applies verbatim to **both** repos. Verified by grep, not assumed:

| Bug | FruitSnacks | Leather Wallah |
|---|---|---|
| 1a `useRef("")` | ✅ present | ✅ present |
| 1b badge omitted + `$set` merge | ✅ present | ✅ present |
| 2 `theme_id` absent → `$unset` | ✅ present | ✅ present |
| 3 self-managed row saves | ✅ present | ✅ present |
| 4 `FaUtensils` fallback | ✅ present | ✅ present |
| 5 query-level `deleteOne` | ✅ present | ✅ present |

File paths differ only by the `FruitSnacks*` / `LeatherWallah*` prefix.
