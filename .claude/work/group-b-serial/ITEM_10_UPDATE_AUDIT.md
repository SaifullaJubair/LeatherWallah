# Item 10 — UPDATE Round-Trip Audit

**Goal:** Verify every PATCH-style write to a product actually persists the right fields and doesn't wipe siblings. Memory said "PATCH /product wipes the doc on partial body" — turns out reality is more nuanced.

**Date:** 2026-06-05

---

## TL;DR

The memory note is **outdated**. `updateProductServices` already uses `$set: data` (not `replaceOne`), so a partial body doesn't blanket-wipe. The real risk lives ONE LAYER UP in the **controller**, which receives FormData → coerces nullish strings → builds a full `productData` literal → passes it to `$set`. Fields it forgets to read OR explicitly defaults to `""` / `undefined` DO get overwritten.

Today's surface already has safer paths (`/product/quick`, `/product/images`, `/product/page-content`) and almost every admin modal correctly uses them. The risky callers are:

- **UpdateStepThree.jsx (legacy)** — 2 spots calling `PATCH /product`
- **ProductForm.jsx (new wizard)** — line 1409 calling `PATCH /product`

Both submit a "full edit" form so they're DESIGNED to send the complete payload — they should rebuild. Problem isn't them, it's the field round-trip: a few fields silently drop on update.

---

## 🚨 BLOCKERS

### B-1. Slug clears when product name is unchanged but other fields update

[product.controllers.ts:1204-1213](FruitSnacksBackend/src/app/product/product.controllers.ts#L1204)

```ts
let updatedSlug = existingProduct.product_slug;
if (existingProduct.product_name !== requestData.product_name) {
  updatedSlug = await generateUniqueSlug(requestData.product_name, requestData._id);
}
```

This is **correct** — but `productData.product_slug = updatedSlug` then gets `$set` again. If `existingProduct.product_slug` already has the right value, no harm done. Marking as **NOT a bug**, just noting it's safe.

Actually — re-reading carefully: this IS safe. Strike the blocker. Demoting.

---

### B-1 (real). Page-content fields wiped by full PATCH /product

[product.controllers.ts:1267-1357](FruitSnacksBackend/src/app/product/product.controllers.ts#L1267) (the `productData` literal in `updateProduct`)

The full edit form's `productData` literal includes ~30 fields (name, slug, category, brand, attributes, images, price, stock, weight, dimensions, etc.) but **does NOT include** any of the page-content fields:

```
theme_id, theme_overrides, short_description, badge_text, hero_corner_badge,
video_title, benefits_side_image*, use_cases_side_image*, faq_side_image*,
short_features, process_steps, benefits, use_cases, faqs, nutrition,
floating_images, og_image*, og_title, og_description
```

The service does `$set: updateData` — fields NOT in the literal are LEFT ALONE in the DB (`$set` is additive). **So they're safe.** Memory note was wrong. ✅

But wait — what about Phase F/H fields? Let me check `buildPhaseFHFields`.

---

### B-1 (real, take 3). `buildPhaseFHFields` may clobber on missing keys

[product.controllers.ts](FruitSnacksBackend/src/app/product/product.controllers.ts) — line 1356 spreads `...buildPhaseFHFields(requestData)` into `productData`.

If that helper writes `undefined` for a missing key, Mongoose `$set: { x: undefined }` is a no-op (good).
If it writes `""` or `null` for a missing key, that GETS set and overwrites prior value.

**Need to read `buildPhaseFHFields`** to confirm. Doing it now.

---

### B-2. `brand_id` unset path is the only "$unset" branch — other optional fields may also disappear

[product.services.ts:2636-2639](FruitSnacksBackend/src/app/product/product.services.ts#L2636)

```ts
const unsetData: any = {};
if (!data.hasOwnProperty("brand_id")) {
  unsetData.brand_id = "";
}
```

The service only `$unset`s `brand_id` when missing. If the controller's `productData` literal sets `brand_id: requestData.brand_id ? requestData.brand_id : undefined`, then the key IS present (just undefined) → `data.hasOwnProperty('brand_id')` returns true → `$unset` is skipped → AND `$set: { brand_id: undefined }` is a Mongoose no-op → the OLD brand_id stays.

So clearing a brand from the admin form is currently impossible via this route. Need to send `brand_id: null` explicitly to clear. **HIGH bug**, not blocker — admins typically don't change brand once set.

---

## ⚠️ HIGH

### H-1. Optional category cannot be cleared via UPDATE

Same pattern as B-2: schema marks `category_id` optional (Phase L — small sellers don't need categories), but if the admin form omits it the controller likely sets `productData.category_id = requestData.category_id` (undefined) → no `$unset` branch → old value sticks.

**Fix:** Mirror the `brand_id` pattern — explicit `$unset` when caller omits.

### H-2. Slug history not snapshotted if name changes during a multi-call flow

[product.controllers.ts:1377-1386](FruitSnacksBackend/src/app/product/product.controllers.ts#L1377) — pushes old slug to `product_slug_history` BEFORE calling `updateProductServices`. That's a separate write; if the subsequent `updateProductServices` fails, history was already pushed → orphan entry in history pointing at no rename. Cosmetic. Defer.

### H-3. `attributes_details` rebuild may drop attribute_id on partial save

[product.controllers.ts:1287-1308](FruitSnacksBackend/src/app/product/product.controllers.ts#L1287)

```ts
attributes_details: Object.values(requestData?.attributes_details ?? {})
  .filter((att: any) => att?.attribute_name !== undefined && att?.attribute_values?.length > 0)
  .map((att: any) => ({
    attribute_id: att?.attribute_id || undefined,
    ...
  }))
```

If the admin form sends an attribute name without `attribute_id` (legacy snapshot), `attribute_id` becomes `undefined`. On save, Mongoose drops the key. Next read → `variantAxisAttributes` falls back to the warned legacy branch. **Working as designed** (backfill is a separate migration). But worth noting the controller could LOOK UP the live attribute_id by name when missing, to self-heal.

### H-4. SKU/barcode immutability bypassable via PATCH /quick

[product.services.ts:2960-2975](FruitSnacksBackend/src/app/product/product.services.ts#L2960) — `PRODUCT_QUICK_WHITELIST` does NOT include sku/barcode (good!), so they're protected on the safe path. But the full `PATCH /product` route does `requestData.product_sku = existingProduct.product_sku` first (line 1223) → safe there too. ✅ No bug.

---

## 🟡 MEDIUM

### M-1. ProductVideoModal upload path documented as "wipe trap"

[ProductVideoModal.jsx:7-21](FruitSnacksAdmin/src/components/ProductList/ProductVideoModal.jsx#L7) — admin can't replace/remove the uploaded main_video from the modal because the safe path doesn't support multipart yet. Workaround comment says use full edit page.

**Fix:** Extend `PATCH /product/images` to also accept `mode: "swap_main_video"` / `"remove_main_video"`. Same multer config already in use. ~30 min.

### M-2. ProductImagesModal lacks `category_id` round-trip — moot

Modal is image-only; doesn't touch category. ✅ N/A.

### M-3. `tier_prices` cleared by sending empty `[]` via /quick

[product.services.ts:2987-2988](FruitSnacksBackend/src/app/product/product.services.ts#L2987) — `if (body[key] !== undefined) update[key] = body[key];` — so `tier_prices: []` does `$set: { tier_prices: [] }` (clears the array). That's CORRECT behavior (admin emptied the tier table). No bug.

### M-4. `product_quantity` block for variation products

[product.services.ts:2997-2999](FruitSnacksBackend/src/app/product/product.services.ts#L2997) — Quick path silently drops `product_quantity` when product is variation. Good guard. But ProductPriceModal sends it regardless → silent drop is fine; admin doesn't see "ignored" feedback. Minor UX.

### M-5. No transaction around: slug-history push → product update

[product.controllers.ts:1377-1392](FruitSnacksBackend/src/app/product/product.controllers.ts#L1377) — Two separate `ProductModel.updateOne` calls without a session. If the second one fails, history was already pushed. Defer (Phase B already wraps order placement in transactions; product CRUD doesn't yet).

---

## 💡 NICE-TO-HAVE

### N-1. Memory note is stale and should be updated

[[product-update-route-is-full-rebuild]] — currently says "PATCH /product wipes the doc on partial body; page-content saves go to PATCH /product/page-content instead." Reality is more nuanced: page-content fields are SAFE (the controller's literal doesn't touch them, $set is additive), but a few specific fields (brand_id, category_id, possibly Phase F/H optionals) can't be cleared without explicit null.

**Action after this audit:** Rewrite the memory note with the actual mechanics.

### N-2. Consolidate the duplicate FormData cleanup loop across admin

Admin CLAUDE.md flags this as A-14 — `cleanFormData()` utility candidate. Out of scope for this audit.

---

## ✅ Already correctly handled

- `PATCH /product/quick` is whitelisted (14 fields). All status/trending/price/stock/video_link/tier modals correctly route here. ✅
- `PATCH /product/images` handles main + other_images via dedicated mode field. ✅
- `PATCH /product/page-content` whitelist of 22 fields with proper `$set` / theme_id skip-on-empty guard. ✅
- `patchProductImagesServices` cleans the old S3 main_image key on swap. ✅
- `updateProductServices` uses `$set` not `replaceOne` (additive, doesn't wipe untouched fields). ✅
- SKU + barcode immutable on both safe path (excluded from whitelist) AND full path (forced from existingProduct.*). ✅
- category_path rebuilt on every save so subtree filter stays consistent after category change. ✅
- Slug history push on rename. ✅
- Product_status auto-downgrade to inactive when category/brand inactive. ✅

---

## 📝 Recommended fixes (in order)

### Inline-fixable this session (~1.5h)

1. **B-2 + H-1** — Mirror the `brand_id` `$unset` pattern for `category_id` so cleared categories actually persist. Tiny change in `updateProductServices` (~5 LOC).

2. **Read `buildPhaseFHFields`** and confirm it doesn't write `""` / `null` for missing keys — if it does, fix to use `undefined`. (~30 min — depends what it does)

3. **N-1** — Update the memory note `product-update-route-is-full-rebuild` with accurate mechanics.

### Defer (separate work)

4. **M-1** — Extend PATCH /product/images to handle main_video swap/remove (~30 min, scoped after this audit).
5. **M-5** — Wrap product CRUD in a mongoose session (architectural).
6. **H-3** — Self-heal attribute_id by name lookup on save (~1h, requires safety net for ambiguous matches).

---

## Next step

Reading `buildPhaseFHFields` now to confirm B-1 take 3.
