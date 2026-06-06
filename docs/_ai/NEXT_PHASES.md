# Next Phases — Roadmap (captured 2026-05-24, last updated 2026-06-05)

Owner-provided backlog. **Do these phase-by-phase, one at a time.** Items
ticked off as shipped, with the commit hash next to them.

> Context: the themed PDP at `/products/[slug]` is largely dynamic now (icon
> picker, trust points, hero badges, video title, offer countdown, footer name).
> See [PDP_SECTION_AUDIT.md](PDP_SECTION_AUDIT.md) for what's already done.

---

## Progress snapshot (2026-06-05)

| # | Item | Status |
|---|------|--------|
| 1 | Nutrition info tiles dynamic | ✅ DONE |
| 2 | Nutrition rows dynamic | ✅ DONE |
| 3 | Description redesign + reposition | ✅ DONE (FE `f0d1b20`) |
| 4 | Floating images rethink | ⏸ BLOCKED on owner sketch |
| 5 | Keep `/products-original` alive | 🟡 Verified existing, no regression watch yet |
| 6 | Admin theme-create page friendlier | ⏭ Deferred to Admin 2.0 |
| 7 | Theme preview page improve | ⏭ Deferred to Admin 2.0 |
| 8 | Category/subcategory/attribute check | ✅ DONE (BE `129a749` + Admin `218a9b1`) |
| 9 | Product CREATE wizard | ⏭ Deferred to Admin 2.0 |
| 10 | Product UPDATE round-trip | ✅ DONE (BE `61a9631` — optional-FK clear fix) |
| 11 | Pricing resolver (campaign/coupon/offer/combo) | 🟡 PARTIAL — Option α shipped (BE `50a4926` + FE `9a53444`): resolver doc-cleanup + FE cart parity helper + PDP offer-discovery banner. Offer-in-cart, BOGO, combo all deferred |
| 12 | Page-content editor friendlier | ⏭ Deferred to Admin 2.0 |
| Home redesign | ❌ Pending (after the above) |

Anything marked "Deferred to Admin 2.0" lives in the [[admin-2-rebuild-backlog]]
memory — owner-locked decision: do those in the ground-up admin rebuild, not
in the current admin shell.

---

## Group 1 — PDP polish (finish the product page)

### 1. Nutrition info tiles → fully dynamic, "add more" style ✅ DONE
Today: the 4 right-side info tiles (উপাদান / শেলফ লাইফ / সংরক্ষণ পদ্ধতি / দেশ তৈরি)
have **static labels** + a mix of API/fallback values; some are hard-mapped or
faked from `certifications`.
**Want:** a flexible repeater — admin clicks "Add more", types **any label +
any value**, submit. Fully free-form (like a key-value list), not fixed fields.
- Schema: replace fixed `nutrition.origin/shelf_life/...`-driven tiles with an
  array e.g. `nutrition.info_tiles: [{ label, value, icon_key? }]` (keep old
  fields readable for back-compat / migration).
- Admin: repeater UI in Page Content (label + value + optional IconPicker).
- Frontend: render the array; drop the static fallback labels + the faked
  "সংরক্ষণ পদ্ধতি" / certifications-derived "দেশ তৈরি" tiles.

### 2. Nutrition nutrient ROWS → also fully dynamic ✅ DONE
Today: nutrient rows (ক্যালরি, প্রোটিন, ফাইবার…) use **static Bangla labels** +
API values keyed by fixed field names.
**Want:** same free-form approach — admin adds any nutrient label + value. So #1
and #2 together = the whole Nutrition section becomes "add rows / add tiles,
type label+value, submit". Fully flexible.
- Decide: one combined flexible model for the section, or two arrays (rows +
  tiles). Likely `nutrition.rows: [{label, value}]` + `nutrition.info_tiles[]`.

### 3. Description / "পণ্য সম্পর্কে" section — redesign + reposition ✅ DONE (FE `f0d1b20`, 2026-06-05)

Shipped: DescriptionCard moved from post-hero position to mid-page (between
NutritionSection and ReviewsSection inside `ProductThemedSections`).
Empty-state self-hides when `product.description` is empty/whitespace.
`hasContent` check now includes description so description-only products
still render the themed sections wrapper.

---

## Group 2 — Floating images (NEW concept) ⚠️ NEEDS OWNER SKETCH
### 4. Floating image placement — full rethink
Today: `theme.floating_assets[]` (fruit images) placed left/right per section
with auto-distribute fallback.
**Owner has a new concept** and will provide a **hand-drawn sketch**. Full
detailed discussion required before any work. **BLOCKED on sketch + discussion.**
→ Open question Q1 below.

---

## Group 3 — Safety / structure

### 5. Keep the OLD single-product page alive as a separate route
Today: old design already preserved at `/products-original/[slug]` (backup made
in an earlier session). Owner wants to **make sure the old design + full code
stays working** on its own page "for now — reason to be explained later."
- Action: verify `/products-original/[slug]` still renders correctly end-to-end
  and isn't broken by any of the themed-PDP refactors. Don't delete.
→ Open question Q2 (is products-original enough, or a fresh dedicated route?).

---

## Group 4 — Admin UX (theming + product authoring) ⏭ DEFERRED TO ADMIN 2.0

These three items are owner-locked deferred to the planned Admin 2.0 ground-up
rebuild — see [[admin-2-rebuild-backlog]] memory. Don't bolt onto current
admin; design once for whatever stack 2.0 picks.

### 6. Admin "Add New Product Theme" / theme create page → much friendlier ⏭
Make theme creation **easy to visualize**: live section previews while picking
colors, add colors visually, and **provide color-palette suggestions** (pull
good UI/UX palette ideas from online references and offer them as presets).
- Theme create/update form redesign + preset palettes + live preview.

### 7. Theme preview page — improve ⏭
The `/theme/preview/:id` page needs an update (show the theme applied to a
realistic PDP mock, all sections, so admin sees the full effect).

### 12. Page-Content editor — more visual & user-friendly ⏭
The product Page Content form should be easier to visualize/use (section-by-
section, clearer grouping, maybe live preview). Pairs with #6/#7.

---

## Group 5 — Catalog correctness (data integrity)

### 8. Category / Sub-category / Attribute — full check vs product ✅ DONE (2026-06-05)

Audit + 6 fixes shipped (BE `129a749`, Admin `218a9b1`):
- Sibling-scoped `category_serial` uniqueness check (was global → broke nested tree)
- 22 dead `subcategories` / `childcategories` `$lookup` blocks purged from product / campaign / coupon / offer services (collections retired but joins remained)
- 8 stale RBAC flags (`sub_category_*`, `child_category_*`) dropped
- Delete cascade now `$pull`s the deleted id from product `category_path` snapshots
- Featured + Explore caps now filter by `category_status: "active"`
- Backend CLAUDE.md updated to describe nested-tree (was still describing retired 3-level model)

Audit doc: `.claude/work/group-b-serial/ITEM_8_CATEGORY_AUDIT.md`.
4 medium/nice-to-have items deferred (storefront full-tree menu, slug chain-uniqueness, breadcrumb status, reparent transaction memory).

### 9. Product CREATE flow — friendlier + better variation system ⏭ DEFERRED TO ADMIN 2.0
- Make the multi-step create flow more user-friendly.
- Improve the **variation system**, including **weight-per-variation** handling
  (ties into the Pathao courier weight calc — `variation_weight_grams`).

Owner decision 2026-06-05: wizard work waits for the ground-up admin rebuild
so it fits whatever component library Admin 2.0 picks. See [[admin-2-rebuild-backlog]].

### 10. Product UPDATE flow — make everything work ✅ DONE (2026-06-05)

Audit + bug fix shipped (BE `61a9631`):
- Headline finding: the memory note was outdated — `updateProductServices` is NOT a destructive rebuild, it uses `$set: data` which is additive
- Real bug: optional FKs (`brand_id`, `category_id`) couldn't be cleared from the admin full-edit form. Controller always set the key with `undefined`, Mongoose treats `$set: { x: undefined }` as no-op, the existing `$unset` branch only fired when the key was MISSING (which the controller never let happen). Stale value persisted.
- Fix: `updateProductServices` now scans `OPTIONAL_FK_FIELDS` and diverts undefined/null/"" into `$unset`.
- Memory `product-update-route-is-full-rebuild` rewritten with accurate 4-endpoint partial-update cheatsheet (`/quick`, `/images`, `/page-content`, `/variation/:id`).

Audit doc: `.claude/work/group-b-serial/ITEM_10_UPDATE_AUDIT.md`.
Deferred follow-ups: `PATCH /product/images` to handle main_video swap/remove (~30 min); wrap product CRUD in mongoose transactions; self-heal `attribute_id` by name lookup.

### 11. Product PRICING — manage all price types correctly 🟡 PARTIAL (2026-06-05)

**What's actually done already (was hidden in `order.recompute.ts`):**
- Resolver (sync, pure): base + variation + flash sale
- Recompute (server-trusted): campaign + tier-price + customer-group + coupon (fixed/percent with caps) + loyalty redeem + VAT + advance payment + shipping (per-line-additive, zone-aware)
- FE `productPrice`: flash + campaign + variation + base discount

**Shipped this session (Option α, BE `50a4926` + FE `9a53444`):**
- Resolver doc-cleanup: dropped misleading `campaign/coupon/offer/comboPack` stub keys from `ResolvePriceOptions` (they were "accepted but ignored" — only consumer always passed the right `{ variation, flashSale }` shape so no break). Doc-comment rewritten to make the resolver-vs-recompute split explicit.
- New FE `utils/applyCartLayers.js`: pure helper mirroring `order.recompute.ts` layer sequence. Cart UI now computes the same total checkout will produce — eliminates silent storefront/server price mismatch risk.
- New BE endpoint `GET /offer/by-product/:product_id` + new PDP `<OfferDiscoveryBanner />` mounted between Benefits and Nutrition. Self-hides when product not in any active offer.

**Deferred (in priority order, see `.claude/work/group-b-serial/ITEM_11_PRICING_AUDIT_PLAN.md`):**
- **A2** Offer-in-normal-cart — when customer adds all bundle items separately, auto-apply offer pricing (~8h)
- **B** Coupon BOGO — schema fields exist (`bogo_buy_qty/get_qty/get_discount_pct`), no cart/recompute logic yet (~4h)
- **C** Combo product (`product_type: "combo"` + `bundle_items[]`) — schema exists, no resolver/cart logic — real new feature (~10-12h)

---

## Group 6 — Storefront beyond PDP

### Home page redesign
After the above, redesign the frontend **home page** (currently still has
leftover leather-template sections/copy). Match the new fruit-snacks themed look.

---

## Open questions (resolve before starting the relevant phase)
- **Q1 (item 4):** Owner to provide the floating-image placement sketch; full
  discussion needed before any code.
- **Q2 (item 5):** Is `/products-original/[slug]` the intended "keep old page"
  route, or does the owner want a fresh separate route? And the "reason" for
  keeping it (mentioned, to be explained).
- **Q3 (items 1+2):** Confirm the Nutrition model — one flexible section, or
  separate `rows[]` + `info_tiles[]` arrays. Keep old fixed fields for migration?

## Suggested ordering (proposal, owner to confirm each session)
PDP polish first (1→2→3), since the page is nearly done. Then catalog
correctness (8→9→10→11) as a block (they're related and high-value). Admin UX
(6→7→12) can interleave. Floating images (4) when the sketch is ready. Home
redesign last. Item 5 (verify old page) is a quick safety check, do anytime.
