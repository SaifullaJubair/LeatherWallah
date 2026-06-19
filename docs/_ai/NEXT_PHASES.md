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
| 4 | Floating images rethink | ✅ DONE (section-anchored unified: theme-global + product override) |
| 5 | Keep `/products-original` alive | 🟡 Verified existing, no regression watch yet |
| 6 | Admin theme-create page friendlier | ⏭ Deferred to Admin 2.0 |
| 7 | Theme preview page improve | ⏭ Deferred to Admin 2.0 |
| 8 | Category/subcategory/attribute check | ✅ DONE (BE `129a749` + Admin `218a9b1`) |
| 9 | Product CREATE wizard | ⏭ Deferred to Admin 2.0 |
| 10 | Product UPDATE round-trip | ✅ DONE (BE `61a9631` — optional-FK clear fix) |
| 11 | Pricing resolver (campaign/coupon/offer/combo) | 🟡 PARTIAL — Option α shipped (BE `50a4926` + FE `9a53444`): resolver doc-cleanup + FE cart parity helper + PDP offer-discovery banner. Offer-in-cart, BOGO, combo all deferred |
| 12 | Page-content editor friendlier | ⏭ Deferred to Admin 2.0 |
| Home redesign Track D | ✅ DONE — dynamic home_section_array + 2 new modules + 5 new FE sections (BE `9e4ec34`, Admin `3f9c629`, FE `8b486f2`). FE redesign visual pass + Track B/C deferred to FE redesign sprint. |

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

## Group 2 — Floating images (NEW concept) ✅ DONE
### 4. Floating image placement — full rethink — ✅ DONE
Shipped a **unified section-anchored floating model** (food-only for now):
- Theme `floating_assets[]` now carry a stable `id` + `align` (top/middle/bottom
  inside the anchored section). Section was already the anchor.
- New product `floating_overrides { hidden_ids, replacements, extras[] }` — a
  product inherits its theme's global floats and can **hide**, **replace** (same
  slot/animation, swap image — this product only, theme untouched), or add
  **extra** product-only floats.
- FE `mergeFloating()` layers override over theme (dead-ref guard for theme
  swap/asset-delete); injected once into `theme.floating_assets` at page level so
  all section `<FloatingAssets/>` render the resolved set. **Old full-page
  `ProductFloatingImages` (z-index trap) removed.**
- `prefers-reduced-motion` kills float animation.
- Admin: theme editor re-gained a **global floating manager**; product Page
  Content → Floating tab rebuilt as the override editor (inherited list with
  hide/replace + product extras).
- Migration `backfill-floating-assets.ts` ran on dev DB: 2 products, 5 legacy
  floats → `floating_overrides.extras`. Theme asset ids backfilled.

⚠️ **Multi-niche debt:** the section list (hero/order/benefits/nutrition/…) is
hardcoded to the food PDP. When the PDP section registry (`pdp_section_array`,
see [[multi-niche-platform-blueprint]]) lands, this list must become dynamic so
fashion/cosmetics PDPs anchor floats to *their* sections. Owner accepted this
rework when choosing "Section-anchored — food-only now".

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
- **Q1 (item 4):** ✅ RESOLVED — owner chose section-anchored (food-only now),
  full scope shipped. Position model = section anchor + side + align. No sketch
  needed; built on the existing section-scoped theme floating system.
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

> ⚠️ **Item 5 UPDATE (FE deep-audit 2026-06-18, F2.2):** `/products-original/[slug]`
> route **does NOT exist** — the entire old non-themed `src/components/frontend/singeProduct/**`
> tree is orphaned dead code, and the live PDP page comment claiming the fallback is stale.
> Q2 effectively resolved by reality: there is no old page to keep. Either delete the
> dead tree or rebuild the route if a fallback is genuinely wanted.

---

## ⚠️ Deep-Audit bug tickets (2026-06-18) — found, NOT yet fixed (owner did doc-only)

Full findings: [ADMIN_DEEP_AUDIT_FINDINGS.md](ADMIN_DEEP_AUDIT_FINDINGS.md) ·
[FRONTEND_DEEP_AUDIT_FINDINGS.md](FRONTEND_DEEP_AUDIT_FINDINGS.md) ·
[BACKEND_DEEP_AUDIT_FINDINGS.md](BACKEND_DEEP_AUDIT_FINDINGS.md) (BE 9 fixed on `dev`).
These are pre-next-phase reference bugs; triage + fix on `dev` when owner says go.

**🔴 BLOCKERs (4):**
- **FE F1.1 — CAMPAIGN HALF ✅ DONE (s47, browser-verified)** BE `5e97db7` + FE `09fdb86` (`dev`). `findCartProductServices` now batch-enriches `campaign_details` → cart shows campaign price + real `campaign_id` flows to checkout (was always null → discount lost). FE `helper.js` campaign base corrected to regular `product_price` (was `product_discount_price` → ৳450 shown vs ৳750 charged) + cart `staleTime` Infinity→60s. **FLASH HALF still OPEN** — flash "fixed"=absolute (BE resolver.ts:112) vs subtraction (FE helper.js:102) + percent base differs on variations; aligning touches the core price resolver = separate ticket. Flash stays known "regular shown / flash charged" (under-charge, buyer-favourable).
- **FE F4.1/F3.1 ✅ DONE (s47)** BE `4a1ce8a` + FE `424d961` (`dev`). New public `GET /review/featured` (active + 5-star + has-photo, product populated, review_user_id stripped, mounted before the :review_product_id wildcard); carousel auto_featured repointed to it. **F4.2 also fixed** — card now reads real DB fields `review_ratting`/`review_image`/`review_product_id.product_name` (were `review_rating`/`review_photo`/`product_id` → 0-star/no-photo). Needs seeded 5-star+photo reviews to render.
- **Admin A2.2/A2.3** — order-status forward-transition dropdown lives only in dead `OrderTable.jsx` (imported nowhere) → no reachable UI to advance status (only Cancel + courier sync); BE `updateOrder` has no transition validation. **OWNER DECISION NEEDED:** wire dropdown into ViewAllOrderInfo vs courier-only. **(still OPEN — blocked on decision)**
- **Admin A4.1 ✅ DONE (s47, browser-verified)** Admin `d3c6c88` (`dev`). Warehouse FE guards (SideNavBar/WarehousePage/WarehouseTable) repointed off ghost flags `setting_show`/`setting_update` → `site_setting_update`. Menu+page+CRUD now reachable.

**🟠 HIGH:** ~~FE F4.2 (carousel wrong field names)~~ ✅ DONE s47 (FE `424d961`, with F4.1), F3.3 (/shop sort page-local not catalog), F3.4 (3 default-ON home sections unwired → blank top), F1.3 (COD phone 2 formats), F1.2 (cart qty additive merge); **Admin A4.2/A4.3 ✅ DONE (s47, `d3c6c88`)** permissionData Question/Offer/Campaign/Slider uncommented (Flash gated by offer_*); **A1.1 ✅ DONE (s47, `d3c6c88`)** buying-price required dropped (quantity still required — stockless-draft = owner decision, deferred); **A2.1 ✅ DONE (s47, `d3c6c88`)** /pathao-order repointed to /order/pathao.

**🟡 MEDIUM/SMELL:** FE F1.4/F1.5 (invoice double-discount, ৳ hardcode), F4.3/F4.4 (dead /verify OTP), F4.5 (pixel double-fire), F2.1/F2.2 (2 dead component trees), F1.6 (dead cartUtils.productPrice); Admin A1.2, A2.4/A4.5 (Fraud/Supplier no guard), A3.2/A3.3/A3.4/A3.5, A4.4 (login reload).

**🌱 multi-niche debt:** FE F2.15 hardcoded "food" section enum (FloatingAssets). FE F2.16 GOOD — custom_fields spec-table now renders (was an open gap; closed).

**🔒 SECURITY (s47 security-privacy-reviewer, pre-existing — surfaced by A4.2/A4.3 RBAC unlock). ✅ ALL 3 FIXED on `dev` (BE `68b8095`/`9dabad9`/`c18c952`). Details + file:line in `.claude/work/agent-notes/security-privacy-reviewer.md`:**
- **SHF-1 ✅ DONE (s47, BE `68b8095` on `dev`)** — `GET /campaign/dashboard/add_campaign_product` was public + leaked `product_buying_price`/`alert_qty`/`sku`/`barcode` (+ variation equivalents) to unauthenticated callers. Added `verifyToken("campaign_create")` (admin-only; storefront never calls it) + stripped cost/warehouse fields in `$project`. (`campaign.routes.ts`, `campaign.services.ts`)
- **SHF-2 ✅ DONE (s47, BE `9dabad9` on `dev`)** — `DELETE /question` was unauthenticated → anyone with a question id could hard-delete. Now `verifyToken("question_update")`. POST stays public (storefront customers ask questions). (`question.routes.ts`)
- **SHF-3 ✅ DONE (s47, BE `c18c952` on `dev`)** — `findAllDashboardCampaignServices .select("-__v")` leaked `campaign_publisher_id`/`campaign_updated_by`. Both now excluded. (`campaign.services.ts`)
