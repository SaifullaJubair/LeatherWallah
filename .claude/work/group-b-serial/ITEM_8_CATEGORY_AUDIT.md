# Item 8 — Category Audit Report

**Scope:** Nested category tree integrity across Backend + Admin + Frontend after the Phase-0 migration that retired `sub_category` and `child_category` modules and unified them into a single self-referencing `categories` collection.

**Date:** 2026-06-05

---

## 🚨 BLOCKERS

### B-1. `category_serial` global-uniqueness check breaks nested tree

[FruitSnacksBackend/src/app/category/category.controllers.ts:194-205, 289-294, 422-429, 529-538](FruitSnacksBackend/src/app/category/category.controllers.ts#L194)

POST + PATCH both run `CategoryModel.exists({ category_serial })` **without** scoping to `parent_id`. Under nested tree, sibling lists are independent — admin tries to add serial `1` under "Snacks" → backend rejects because serial `1` already exists under "Fruits" (different parent).

**Impact:** Admin cannot create a second root or any child with a serial that matches any other category anywhere in the tree. With ~10+ categories this becomes unusable.

**Fix:** Scope to `{ category_serial, parent_id: requestData?.parent_id ?? null }` plus exclude self on PATCH (`_id: { $ne: requestData._id }` already done for slug, replicate for serial). Note `updateCategoryServices` re-parent path already auto-resolves serial on conflict — controller's pre-check should NOT block that flow.

**Inline-fixable:** Yes (4 controller blocks).

---

### B-2. Dead `subcategories` / `childcategories` joins polluting 6 aggregation pipelines

[FruitSnacksBackend/src/app/product/product.services.ts](FruitSnacksBackend/src/app/product/product.services.ts) — 16 occurrences across `findTrendingProduct`, `findOfferProduct`, `findRelated`, etc.
[FruitSnacksBackend/src/app/campaign/campaign.services.ts:278-329](FruitSnacksBackend/src/app/campaign/campaign.services.ts#L278)
[FruitSnacksBackend/src/app/coupon/coupon.services.ts:174-211](FruitSnacksBackend/src/app/coupon/coupon.services.ts#L174)
[FruitSnacksBackend/src/app/offer/offer.services.ts:171-208](FruitSnacksBackend/src/app/offer/offer.services.ts#L171)

These pipelines `$lookup` against collections that no longer exist (`subcategories`, `childcategories`) and `$match` against fields the product schema no longer has (`sub_category.sub_category_status`, `child_category.child_category_status`). The lookup silently returns `[]` so the unwind with `preserveNullAndEmptyArrays:true` doesn't crash — but the **`$or: [{ field: "active" }, { sub_category: null }]` always falls to the null branch**, which means status gating is effectively no-op (any sub_category/child_category status check is dead code).

More importantly, **the joins still execute on every read**, slowing aggregations needlessly.

**Risk:** Latent if both collections happened to exist with the same shape (they don't here), or worse — if anyone restores them with different shape, status gating could mismatch.

**Fix:** Remove all `subcategories` + `childcategories` `$lookup` + their `$unwind` + their `$match` clauses. Category subtree behaviour is already correctly handled via `product.category_path` (see `productFilter.services`).

**Inline-fixable:** Yes (mechanical removal — keep the `categories` lookup, drop the other two).

---

### B-3. Stale RBAC permission flags for retired modules

[FruitSnacksBackend/src/app/role/role.model.ts:35-66](FruitSnacksBackend/src/app/role/role.model.ts#L35) — `sub_category_post`, `sub_category_update`, `sub_category_show`, `sub_category_delete`, `child_category_*` (8 fields total).
[FruitSnacksBackend/src/app/role/role.interface.ts:13-20](FruitSnacksBackend/src/app/role/role.interface.ts#L13)
[FruitSnacksAdmin/src/data/permissionData.js](FruitSnacksAdmin/src/data/permissionData.js)

Flags still exist in role schema + admin permission UI, but the modules are gone — no `verifyToken("sub_category_post")` consumers remain. Admin sees checkboxes for non-functional permissions and may grant/deny them under the impression they matter.

**Fix:** Remove the 8 flags from `role.interface.ts`, `role.model.ts`, and admin `permissionData.js`. Verify nothing references them.

**Inline-fixable:** Yes.

---

## ⚠️ HIGH

### H-1. Storefront menu still adapts to legacy 3-level shape (lossy for depth ≥ 4)

[FruitSnacksFrontend/src/components/lib/getMenu.js:16-39](FruitSnacksFrontend/src/components/lib/getMenu.js#L16)
[FruitSnacksFrontend/src/components/shared/navbar/Navbar.jsx:345-371](FruitSnacksFrontend/src/components/shared/navbar/Navbar.jsx#L345)

`adaptTreeToLegacyMenu()` collapses the infinite-depth tree into root → sub → child (3 levels). Categories at depth ≥ 4 are silently dropped from navbar / mobile menu / footer because the adapter stops at child level.

**Impact:** If owner creates Fruits → Citrus → Lemons → Meyer, "Meyer" never appears in the menu. Admin can save it (tree supports it) but customers can't reach it.

**Fix options:**
- Quick: Document the limit (max depth 3 for menu) in admin UI tooltip.
- Proper: Rewrite Navbar / MobileNavbar / MobileMenu / SecondNavbar / BottomNavbar to consume the full tree recursively. (~3-4h, separate from this audit.)

**Recommend:** Document for now, defer rewrite to a frontend nav refactor session.

---

### H-2. Sibling slug collision allowed → URL ambiguity

[FruitSnacksBackend/src/app/category/category.model.ts:13-15](FruitSnacksBackend/src/app/category/category.model.ts#L13)

`category_slug` is `unique: true` (globally). That's actually correct for the **flat slug** URL pattern the storefront uses (`/category/lemons` resolves by leaf slug only — see [FruitSnacksFrontend/src/app/(frontend)/category/[...slug]/page.js:68](FruitSnacksFrontend/src/app/(frontend)/category/[...slug]/page.js#L68)).

BUT: navbar links use **3-segment URLs** like `/category/fruits/citrus/lemons` and these resolve by **leaf only** too. So `/category/fruits/citrus/lemons` and `/category/snacks/dried/lemons` would both resolve to the same product list if both existed. Currently impossible due to global slug uniqueness, but admins may want to use "lemons" under multiple roots.

**Current behavior:** Global uniqueness forces admin to invent unique slugs like `lemons-citrus` vs `lemons-dried`. Functional but ugly.

**Recommend:** Keep global uniqueness for now (matches the resolver). Flag as a known constraint in admin tooltip: "Slug must be unique across all categories — chain-uniqueness not supported yet."

**Defer:** Real fix would require resolving categories by full path chain, not leaf — bigger refactor. Out of scope for this audit.

---

### H-3. Delete cascade does NOT clean up product references

[FruitSnacksBackend/src/app/category/category.services.ts:403-418](FruitSnacksBackend/src/app/category/category.services.ts#L403)
[FruitSnacksBackend/src/app/category/category.controllers.ts:608-615](FruitSnacksBackend/src/app/category/category.controllers.ts#L608)

The controller blocks delete if `categoryHasProducts()` returns true. But:

1. The check only looks at `category_id` direct match — it misses products whose `category_path` includes this id but whose `category_id` is a deeper descendant. Admin deletes a parent → products under grandchildren still reference the deleted node in their `category_path`. **Not blocked.**
2. The controller also blocks if `categoryHasChildren()` is true — so the parent-with-products case is partly mitigated (you can only delete a leaf), but a leaf delete after re-parenting may still leave dangling `category_path` entries on products.

**Impact:** Storefront filter on a deleted ancestor returns 0 products (silent), but admin filters / breadcrumbs may render stale references.

**Recommend:** On delete (after the leaf+no-products check passes), also `$pull` the deleted `_id` from any product's `category_path`. ~5-line fix in `deleteCategoryServices`.

---

### H-4. Featured category cap (6) + Explore cap (3) silently includes inactive categories

[FruitSnacksBackend/src/app/category/category.controllers.ts:211-219, 226-234](FruitSnacksBackend/src/app/category/category.controllers.ts#L211)

`CategoryModel.countDocuments({ feature_category_show: true })` doesn't filter by `category_status: "active"`. If 6 inactive categories all have the flag set, admin can never enable a 7th active one — even though the storefront only shows the 0 active ones.

**Fix:** Add `category_status: "active"` to the count query.

**Inline-fixable:** Yes.

---

## 🟡 MEDIUM

### M-1. `getCategoryDefaults` endpoint is public — no rate limit

[FruitSnacksBackend/src/app/category/category.routes.ts:61](FruitSnacksBackend/src/app/category/category.routes.ts#L61)

`/category/defaults/:id` walks the parent chain + fetches attributes per call. Storefront calls it on every filter sidebar render. No caching, no rate limit. Acceptable for current scale, would need fixing at 100+ rps.

**Defer:** Add to Phase H performance work.

### M-2. `getCategoryBreadcrumb` doesn't validate category status

[FruitSnacksBackend/src/app/category/category.services.ts:105-125](FruitSnacksBackend/src/app/category/category.services.ts#L105)

Returns ancestors regardless of their `category_status`. So a breadcrumb may render "Fruits › Citrus (inactive) › Lemons". Cosmetic but confusing.

**Fix:** Filter ancestors by `category_status: "active"` (or render greyed in FE).

### M-3. Reparent transaction holds a lot of state in memory

[FruitSnacksBackend/src/app/category/category.services.ts:265-381](FruitSnacksBackend/src/app/category/category.services.ts#L265)

`updateCategoryServices` reparent path loads all descendants + all attached products into memory for the bulkWrite. Fine for small trees, would OOM at 10k+ products under one subtree. Document the limit, defer optimization.

### M-4. CLAUDE.md project doc is STALE — references 3-level hierarchy

[FruitSnacksBackend/CLAUDE.md](FruitSnacksBackend/CLAUDE.md) "### 3-Level Category Hierarchy" section still says "Products reference `category_id → sub_category_id → child_category_id`. Always validate all three levels are `status: active`."

Reality: product schema has only `category_id` + `category_path`. Sub/child are gone.

**Fix:** Update CLAUDE.md to describe nested tree + `category_path` instead. Quick win for future sessions.

---

## 💡 NICE-TO-HAVE

### N-1. Inconsistent route signature in productFilter

[FruitSnacksBackend/src/app/productFilter/product.filter.services.ts:59-72](FruitSnacksBackend/src/app/productFilter/product.filter.services.ts#L59) — `findAllHeadingSub_Child_CategoryDataServices` still takes 3 args (`categoryType`, `_sub`, `_child`) but ignores the last two. Endpoint `/heading_sub_child_category_data` is descriptively stale.

Rename to `findCategoryChildrenForHeading` + simplify signature + rename route to `/category-heading-children`. Cosmetic but improves readability. Defer to a renaming pass.

### N-2. `category-data.js` is unused legacy demo data

[FruitSnacksAdmin/src/data/category-data.js](FruitSnacksAdmin/src/data/category-data.js) — flagged in admin CLAUDE.md as delete candidate. Confirmed unused now that DB is source of truth.

**Fix:** Delete file.

---

## ✅ Already correctly handled

- **Nested-tree storefront filter** uses `product.category_path` for subtree match — single indexed query handles infinite depth. [productFilter.services:44-52](FruitSnacksBackend/src/app/productFilter/product.filter.services.ts#L44)
- **Reparent cycle prevention** — self-parent + descendant-as-new-parent guards both present. [category.services:249-263](FruitSnacksBackend/src/app/category/category.services.ts#L249)
- **Reparent cascade** updates descendant `category_path` + product `category_path` in one transaction.
- **Tree integrity on delete** — blocks if has children or has direct products.
- **Default attribute resolver** walks parent chain with cycle guard + 10-level cap + dead-ref self-heal.
- **Admin tree UI** renders infinite depth with expand/collapse.
- **Category route** uses `[...slug]` catch-all, supports any depth URL.
- **Featured + explore caps** correctly exclude self on PATCH via `_id: { $ne }`.

---

## 📝 Recommended action plan (fix order)

### Immediate (can fix inline this session, ~1.5h):

1. **B-1** — Scope `category_serial` uniqueness check to sibling list (4 spots in controller).
2. **B-2** — Strip dead `subcategories`/`childcategories` joins from product/campaign/coupon/offer services (22 occurrences total, mechanical).
3. **B-3** — Remove 8 stale RBAC flags from role.interface + role.model + permissionData.js.
4. **H-3** — Add product `category_path` `$pull` to `deleteCategoryServices`.
5. **H-4** — Add `category_status: "active"` to feature/explore count queries.
6. **M-4** — Update Backend CLAUDE.md to describe nested-tree reality.

### Defer (separate session):

- **H-1** — Storefront menu full-tree refactor (~3-4h)
- **H-2** — Slug chain-uniqueness (architectural)
- **M-1, M-2, M-3** — Polish
- **N-1, N-2** — Cleanup

### Build verification after fixes:

- Backend `tsc --noEmit` → exit 0
- Admin `npm run build` → exit 0
- Frontend `npm run build` → "Compiled successfully"

### Manual test plan (after fixes, 10 min):

1. **Sibling serial:** Create category "A" with serial 1 under root. Create category "B" with serial 1 under "A". Should succeed (was previously blocked).
2. **Trending products:** Storefront homepage trending section loads (verifies B-2 didn't break aggregation).
3. **Filter sidebar:** Category page filter still shows attributes (verifies category_path subtree still works).
4. **Re-parent:** Move a category with products under a new parent → impact dialog shows correct counts → confirm → storefront filter under both old/new parent reflects the move.
5. **Delete with deep path:** Create A → B → C, put product under C, delete C → product's category_path no longer references C.
6. **Featured cap:** Mark 6 active categories as featured → try 7th → blocked. Mark one inactive → try 7th → allowed.
7. **Admin role page:** sub_category / child_category checkboxes gone.
