# Master Backend Roadmap — Resale-Grade E-Commerce Backbone

**Date:** 2026-05-25. **Purpose:** the single ordered list of what to build to make this backend "near-perfect for resale", combining (a) the verified code-audit gaps, (b) owner's explicit asks, and (c) high-value features from competitor/feature research. Honest about what EXISTS vs MISSING (verified by reading the code, not memory).

> **Working rule:** finish ALL backend first → then admin → then frontend (owner-locked). Build each phase fully; temp breakage OK ([[build-it-right-breakage-ok]]). Where a future feature only needs a *field* now (not full logic), ADD THE FIELD now so the site doesn't need a big rewrite later (owner: "field rakha lagle rakho" — e.g. warehouse, wholesale).

---

## ✅ Already EXISTS (verified in code) — keep
Product+variation (SKU, **barcode + barcode_image**, image/video **upload** + size_chart), **direct video upload** on product (`main_video`) AND category (`category_video`) via `VideoUploader` helper, nested category tree + product-level filter (just rebuilt), cart, COD checkout, coupon/campaign/offer, Pathao+Steadfast courier (push+track), Meta/TikTok pixel, review, Q&A, banner/slider, RBAC (~100 flags), theme system, `wallet_amount` field on user, `buying_price` (cost) field on product+variation, `alert_quantity` field.

> NOTE: `video_link` (YouTube URL) = an ADDITIONAL cheap-embed option ALONGSIDE the existing upload, NOT a replacement. Upload stays.

---

## ✅ PHASE A — DONE: variation + attribute + filter + nested category
Shipped across all 3 apps (2026-05-25). Verified: Backend tsc EXIT 0, Admin build EXIT 0, Frontend compiles ✓. Scratch folder `.claude/work/variation-attribute-filter/` retired after harvest.
- **Backend:** nested category tree (`categories` self-ref `parent_id`/`category_path[]`/`depth`/`default_theme_id`; routes `/tree`,`/children/:id`,`/breadcrumb/:id`); DELETED sub_category+child_category+specification modules; product single-leaf `category_id`+`category_path[]`; `product_attributes[]`+`variant_axes[]`; variation `combination[]`+`variation_price_delta`+`is_active` (ADDITIVE — legacy variation fields kept); `product.price.resolver.ts` (`resolveProductPrice` pure fn w/ extension stubs); productFilter rewritten product-level (attribute facets+match from `product_attributes`, subtree via `category_path`, brand+price+availability).
- **Admin:** CategoryTree manager (drill-down add-child anywhere) + CategoryTreePicker on product form; stepper 2-step; StepOneVariation unified (tick-and-fill + per-attr "variation axis?" toggle + inline "+Add value"); StepOneVariationTable combination matrix (delta input + live final + is_active); controllers map new fields.
- **Frontend:** filter sidebar reads `attributes`; PDP spec table from `product_attributes`; variation chips filtered to `variant_axes` via `variantAxisAttributes()` helper; `is_active` guard on variation finders.

### 🔸 Phase A FOLLOW-UPS (deferred — fold into B or a cleanup pass; do NOT lose these)
1. **Combination-array match (FE):** PDP currently matches the chosen variation by legacy `variation_name` slash-join. Switch to matching the sorted `combination[]` (value_ids) once the admin edit-existing-variation table (`DefaultProductVariation` in UpdateStepOne) is migrated to emit combination rows. Admin create already emits both.
2. **`resolveProductPrice()` wire-in:** built + unit-tested but NOT yet called by anything. order.validate.ts still has inline price logic; FE PDP/cart use the `productPrice()` helper. **Phase B B1 should wire the resolver into order total recompute** (that's the whole point — kill the client-trusted total). Then migrate PDP/cart to read resolver output.
3. **Category re-parent gap (BE):** `updateCategoryServices` does NOT recompute `category_path`/`depth` when `parent_id` changes, so the admin category edit form has move-to-another-parent DISABLED. To enable: add `resolveTreePosition` to the update path (+ cascade to descendants' paths). Today re-parent = delete & recreate.
4. **Dead `$lookup` cleanup (BE):** harmless leftover `$lookup subcategories/childcategories` + `$or {x:null}` blocks remain in product.services aggregations (findTrending/findPopular/findECommerceChoice/findJustForYou/findBrandMatch) + offer/coupon/campaign services. They return empty + pass products through (NOT broken, just wasteful). Delete when those aggregations get rewritten.
5. **offerProduct `ProductTable.jsx`** (FE) still maps `offer_product.attributes_details` for chips — fine (legacy snapshot kept), but could use `variantAxisAttributes` for consistency.
6. **Legacy variation fields drop:** variation model still carries `variation_name/variation_price/variation_quantity/...` alongside the new combination shape (additive). Drop them ONLY after cart/order/courier migrate to combination + resolver (part of B).

## ✅ PHASE B — DONE (2026-05-25): Order/stock/pricing integrity
Shipped + live-verified against Atlas. BE tsc EXIT 0. The most dangerous real gaps — now closed:
- **B1. Order total = backend recompute. DONE.** `order/order.recompute.ts` (`recomputeOrderTotals`) recomputes every line from DB via `resolveProductPrice()` + server-side campaign (mirrors FE calculatePrice) + server-side coupon (active/date/max). Wired into postOrder + postSingleOrder; client prices/totals OVERWRITTEN (server always wins). Dead `order.validate.ts` deleted. = Phase-A follow-up #2 (resolver wire-in). Verified: tampered 5৳ → saved 760/820.
- **B2. Stock transactional + guard. DONE.** `order/order.stock.ts`: atomic `$gte`-guarded decrement at PLACEMENT (throws "Out of stock", aborts txn) + idempotent `restockOrder` on cancel/return (guarded by new `order.stock_restored`). Removed all 6 deduct-at-delivery sites. Uses legacy variation_quantity (combination-stock migration deferred). Verified: OOS qty rejected w/ rollback; cancel restocks once.
- **B3. Currency from settings. DONE.** `getCurrencyCode()` in setting.services; both Meta Purchase events use it.
- **B4. Low-stock list. DONE.** `findLowStockServices()` + GET `/product/low_stock` (product_show), `$expr` qty<=alert for products+variations.
- 🔸 B leftovers (fold into later phases): combination-stock migration; shipping_cost server recompute (B1 trusts client shipping); coupon per-user/usage-limit enforcement.

## ✅ PHASE C — DONE (foundation + C1 + C2 + C3 + C4)
- **DONE (foundation + C2, 2026-05-25):** Order payment fields (payment_method/payment_status/transaction_id/paid_amount/advance_amount/paid_at/payment_meta); settings payment block; pluggable Gateway abstraction in `app/payment/` (cod + manual_mfs gateways); `initiatePayment` wired into postOrder + postSingleOrder post-commit; C2 routes PATCH `/payment/submit/:order_id` (customer trxId) + PATCH `/payment/verify/:order_id` (admin paid|failed; failed → cancel + restock via Phase-B). Live verified.
- **DONE (C1 SSLCommerz, 2026-05-26):** `sslcommerz.gateway.ts` (`gwprocess/v4/api.php` POST → returns `{kind:"redirect", redirect_url: GatewayPageURL}`); `sslcommerz.validator.ts` (re-validates each callback via `validationserverAPI.php` — official trust path); `sslcommerz.controllers.ts` 4 public callbacks (success/fail/cancel/ipn) all re-validate + check amount matches grand_total (replay-tiny-payment attack rejected) + idempotent (already-paid orders skipped); routes POST `/payment/sslcommerz/{success,fail,cancel,ipn}`; creds from `.env` (NOT settings — security); `enabled`+`sandbox` toggles from settings (admin UI). Callbacks redirect to `${FRONTEND_PUBLIC_URL}/order-success|order-failed/:invoice_id`. Mock-mode verified 20/20 (initiate, paid, IPN idempotency, amount-mismatch reject, fail+restock, double-restock guard). Live sandbox test pending owner's creds + ngrok.
- **DONE (C4 bank transfer, 2026-05-26):** `bank_transfer.gateway.ts` returns `{kind:"instruction", bank_instruction:{accounts, note, invoice_id, amount_due}}`; `settings.bank_transfer_instruction` added; `submitTransaction` extended w/ optional `screenshot_url`/`screenshot_key`; new PATCH `/payment/submit-with-screenshot/:order_id` w/ multer middleware → first file → S3 upload → meta. Live verified 11/11.
- **DONE (C3 advance/partial, 2026-05-26):** Settings `advance_payment_enabled` + `_min_percent` + `_methods[]` allow-list; recompute validates request advance (enabled + method allowed + ≥ min%); `initiateAdvancePayment(order, method, amount)` initiates gateway against advance_amount; order saved as `cod`+`advance_amount=X`; `verifyPayment` auto-detects partial flow (1st verify → `partial`+accrued paid_amount; 2nd verify → `paid` once ≥ grand_total). Live verified 11/11.

## ✅ PHASE D — DONE (2026-05-25): Auth hardening
Shipped + live-verified against Atlas. BE tsc EXIT 0.
- **D1 token payload + lifetimes:** new `utils/auth.tokens.ts` is the sole owner of jwt sign/verify + cookie set/clear. Admin access 7d (was 365d), user access 30d, refresh 90d. Payload now `{kind, who, _id, phone, role_id (admin)}` so middlewares index by `_id` (saves per-request phone lookup); back-compat phone fallback for old 1y tokens. Middlewares reject refresh-as-access and cross-`who` tokens. getMeAdmin + getMeUser + logoutUser also migrated.
- **D2 refresh + logout:** stateless v1 — `POST /admin_reg_log/refresh` + `POST /user/refresh` (rotates both cookies); `POST /admin_reg_log/logout` + `POST /user/logout` clear both via `clearAuthCookies`.
- **D3 OTP hardening:** new `utils/auth.otp.ts` (6-digit, bcrypt hash at rest, 60s send cooldown, 5-attempt cap, helpers `buildOtpFields`/`otpClearFields`). User model `forgot_otp` now String (hashed); new `otp_sent_at` + `otp_attempts`. All 3 user OTP endpoints upgraded (forgot/resend/verify+reset).
- **D4 admin self password-reset:** admin model + interface got OTP fields. `POST /admin_reg_log/forgot-password` + `POST /admin_reg_log/reset-password` (same OTP shape). Fixes locked-out-admin gap.
- 🔸 Follow-up: token revocation (per-user `token_invalidated_at` field) — deferred since stateless v1 was owner-locked; bumping `ACCESS_TOKEN` env = all-logout for now.

## ✅ PHASE E — DONE (2026-05-26)
Live verified 12/12. BE tsc EXIT 0.
- **Flash sale** (new `app/flashsale/` module): collection with time-window + products[] (flash_price + flash_price_type fixed|percent + active). Service `findActiveFlashForProduct(id)`. Resolver consumes `opts.flashSale` (fixed = absolute override, percent = % off current). Recompute fetches per line.
- **Tier pricing**: product `tier_prices[]` ({min_qty, price}); recompute picks lowest-applicable tier that beats current final.
- **Coupon hardening (B1 follow-up #3 closed)**: recompute blocks when per-person usage exceeded (via `coupon_used` collection lookup) OR `coupon_available <= 0`.
- **Wallet ledger** (new `app/wallet/` module): `wallet_transactions` collection (delta + type + reason + reference_id + performed_by); `moveWallet()` atomic credit/debit with insufficient-balance guard; admin POST `/wallet/adjust` + user GET `/wallet/history`. Pairs with existing `users.wallet_amount`.
- **BOGO scaffolding**: coupon_type adds `"bogo"`; bogo_buy_qty/get_qty/get_discount_pct fields. Cart-side application = future task (storefront cart rewrite).

## 🟡 PHASE E — original spec (kept for reference)
- **E1. Coupon validation:** server-side start/end date + min-order + per-user/usage limits (today only a `coupon_status` toggle is checked).
- **E2. Flash sale** (real, time-boxed, countdown) + **BOGO** + **tier/bulk pricing** (qty↑ → price↓). All slot into the Phase-3 resolver's extension stubs.
- **E3. Gift card / store credit** (wallet_amount field already exists → build the ledger).

## ✅ PHASE F — DONE (2026-05-26)
Live verified 5/5. BE tsc EXIT 0.
- Product fields: `video_link`, `condition` (new|used|refurbished default new), `sold_count`, `view_count`, `product_weight_grams`, `product_dimensions`, `custom_fields[]`, `qr_code`+`qr_code_image`+`_key`, `product_type` enum (simple|variable|digital|combo|preorder|subscription default simple) + per-type fields (`bundle_items[]`, `download_url`, `license_key`, `available_from`, `billing_interval`), and `tier_prices[]` (used by Phase E).
- `order.stock.bumpSoldCounts()` auto-increments sold_count by line qty at placement (wired into both endpoints alongside `decrementStockForLines`).
- POST `/product/qr` (admin product_update) generates QR via `qrcode` lib + persists. POST `/product/view-count` (public) fire-and-forget view counter.

## 🟡 PHASE F — original spec (kept for reference)
- `video_link` (YouTube, alongside upload), `condition` (new/used/refurbished), `sold_count`+`view_count` (social proof), product-level `weight_kg`/dims, `unit_name`, `custom_fields[]{key,value}` (friendly specs, nutrition-style).
- **QR code:** generate a QR (per product/order) — barcode exists, QR does not. Field + generator.
- **Product types** scaffold: `product_type` enum (`simple|variable|digital|combo|preorder|subscription`) + the few fields each needs (e.g. combo → `bundle_items[]`, digital → `download_url`, preorder → `available_from`). Add the field/enum now; wire behavior per-type incrementally.

## 🟡 PHASE G — New small modules
- **G1. Wishlist** backend (CRISM module; today localStorage-only).
- **G2. Abandoned cart** capture + recovery hook (email/SMS).
- **G3. Reward/loyalty points** ledger (earn on order, redeem at checkout) — pairs with wallet.
- **G4. FB/Google product feed XML** (catalog shopping).
- **G5. SMS from settings** (today hardcoded; read `setting.sms_*`).

## 🟡 PHASE H — Future-proof FIELDS to add NOW (so no big rewrite later)
Owner wants these reservable now even if logic comes later:
- **Warehouse:** `warehouse_id` on stock/variation + a `warehouses` collection stub (single default now). Multi-warehouse logic later, but the field is there.
- **Customer groups / wholesale:** `customer_group` on user (`retail|wholesale|vip`) + optional `group_prices[]` on product. Resolver reads group price when present.
- **Tax/VAT:** `vat_percentage` on settings + per-product override.
- **store_id** — ✅ DECIDED (owner, 2026-05-25): **DO NOT add store_id.** This is a clone-per-client product (one deployment = one store), not multi-tenant. Adding store_id everywhere is unnecessary overhead. If a real SaaS pivot ever happens it's a separate migration then — do NOT pre-scatter store_id now. (Supersedes the "write SaaS-ready" leaning in the architecture memory for THIS concern.)

## 🟡 PHASE H2 — Supplier → Purchasing / Stock-IN (pairs with warehouse)  [from BACKEND_AUDIT #14]
Today `supplier` is contact-list only; inventory only ever DECREASES. For stores that buy stock (electronics/grocery/retail): purchase orders, stock-in/receiving receipts (which INCREASE quantity), cost price per batch. Pairs naturally with warehouse (H) and profit reports (I). Add as a real Inventory/Purchasing feature when a client needs it; field-stubs can go in early.

## 🟢 PHASE I — Reporting & inventory ops
- Profit/loss report (uses `buying_price` vs sale), revenue chart, best-selling, top customers, category-wise sales, coupon-usage, stock report, low-stock report. Export PDF/Excel.
- Stock history/audit log.

## 🟢 PHASE J — Search & performance
- Instant search (typo-tolerant) — Meilisearch/Elasticsearch optional, or a good Mongo text+regex first.
- Bulk CSV/Excel import-export + bulk edit (price/stock/category).

## 🟢 PHASE K — Nice-to-have / enterprise (assess per-client demand)
Multi-language (Bangla+English), multi-currency, PWA, homepage drag-drop builder, POS, affiliate/referral, AI description/chatbot, "notify me when available". Build only when a client pays for it.

## 🟢 PHASE L — Partially DONE (2026-05-26): category-optional
- **DONE:** `product.category_id` `required: true` removed; products can now publish without a category. Verified 2/2.
- 🔸 DEFERRED (need cross-app coordination): `theme_overrides` dead-field removal (3 FE files still defensively read it); RBAC ~100-flag refactor (explicitly "schedule separately"); combination-stock migration; shipping_cost server recompute; manual MFS phone-match hardening; per-user token revocation.

## ✅ PHASE H — DONE (2026-05-27)
Live verified 12/12. BE tsc EXIT 0.
- **Warehouse module** (new `app/warehouse/`): CRISM, default-uniqueness, `getDefaultWarehouseServices()`, routes `/warehouse`.
- **warehouse_id** field on product + variation (optional, null = default).
- **customer_group** (`retail|wholesale|vip`) on user + **group_prices[]** on product. Recompute applies best-price-wins (group_price beats base when buyer is non-retail AND group_price < current final; tier_price still wins if lower).
- **VAT/tax**: settings `vat_percentage` (default 0) + per-product `vat_percentage_override`. New `order.vat_amount` field + `RecomputedOrder.vat_amount`. Per-line VAT on line-net-after-discount (proportional coupon split), sum + round once. `grand_total = sub_total − discount + vat + shipping`.

## ✅ PHASE G — DONE (2026-05-27)
Live verified 15/15. BE tsc EXIT 0.
- **G1 Wishlist** (`app/wishlist/`): unique (user, product, variation) index, upsert-add, sync-after-login endpoint, `verifyUserToken` gated.
- **G2 Abandoned cart** (`app/abandonedCart/`): phone-keyed upsert; `markAbandonedCartRecoveredByPhone` wired into both placement endpoints post-commit.
- **G3 Loyalty** (`app/loyalty/`): separate `loyalty_points` field + `loyalty_transactions` ledger; `moveLoyalty()` atomic + insufficient-guard; `earnOnOrder()` auto-earn at placement (silent no-op when settings.loyalty_enabled=false); admin POST `/loyalty/adjust` + user GET `/loyalty/history`. Cart-side redeem helper ready but not wired (storefront work).
- **G4 Product Feed** (`app/productFeed/`): public `GET /product-feed/feed.xml` RSS 2.0 + `g:` namespace, FB Catalog + Google Merchant Center compatible.
- **G5 SMS from settings**: `SendPhoneOTP` + `sendSMS` read settings.sms_* first, .env fallback; `sms_enabled=false` short-circuits.

## 🟡 PHASE L — original spec (kept for reference)
- **Category-optional product:** today `product.category_id` is `required:true` → can't upload a product without a category. ZatiqEasy/Shopify allow it (small sellers w/ 5 items). Make `category_id` optional now that we're on the tree model.
- **RBAC flag-drift refactor (optional, big):** ~100 boolean role flags → adding a module means editing role.interface+model+admin permissionData+sidebar. Consider a resource×action map (`{product:["create","update"]}`). Schedule separately — it's a refactor, not blocking.
- **Dead-field cleanup:** `product.theme_overrides` is unused (per-product color override UI was removed — [[color-picker-defaults-black-trap]]). Remove during a cleanup pass.

## 🎨 FRONTEND backlog (after backend; from NEXT_PHASES.md)
Not backend, but tracked so it's not lost — do after backend is solid:
- **Home page redesign** (still has leftover leather-template sections/copy → match fruit-snacks/whatever-client theme).
- **Keep old PDP alive** at `/products-original/[slug]` — owner wants the original design preserved "for now, reason later"; verify it still renders, don't delete.
- All-products **StarTech-style filter sidebar** + PDP **spec table + variation selector** (this is Phase A's frontend, Phase 5 in the variation feature).

---

## Suggested order
A ✅ → B ✅ → C-foundation+C2 ✅ → D ✅ → C1 ✅ (mock-verified) → C4 ✅ → C3 ✅ → F ✅ → E ✅ → L(partial) ✅ → H ✅ → G ✅ → **Stage 1 backend roadmap FULLY COMPLETE.** Next: admin + frontend pass-through (functional wiring of new endpoints into existing UI), or Stage 2 V2 rebuilds. See PROJECT_STRATEGY_V1_V2.md.
B is non-negotiable before any real launch (the price + stock bugs are exploitable). F + H are cheap field-adds — can be folded in early since they're additive.

## 🔗 Phase dependency map (what relates to / blocks what)

Read this before reordering — some phases HARD-depend on an earlier one; others are independent and can move freely.

| Phase | Depends on (must come after) | Tightly pairs with | Feeds / unblocks later | Independent? |
|-------|------------------------------|--------------------|------------------------|--------------|
| **A** variation/attribute/filter/category | — (foundation) | — | B, C, E, F, I, filter facets | keystone |
| **B** order/stock/price integrity | **A** (uses `resolveProductPrice` from A-Phase3 + combination-stock from A) | C (payment charges B's computed amount), E (resolver) | C, real launch | no — blocks launch |
| **C** payment | **B** (must recompute total server-side BEFORE charging) | B | advance-payment orders | no |
| **D** auth hardening | — | — | — | ✅ fully independent (do anytime) |
| **E** promo (flash/BOGO/tier/giftcard) | **A** (resolver extension stubs) | B (resolver), F (tier needs qty) | richer pricing | partly (needs A's resolver) |
| **F** additive fields + QR + product types | **A** (variation shape for combo/variable types) | G (custom_fields ↔ specs) | I (sold_count→reports) | mostly additive |
| **G** wishlist/abandoned/loyalty/FB-feed/SMS | wishlist & SMS independent; loyalty pairs with wallet | — | — | ✅ mostly independent (small modules) |
| **H** future-fields (warehouse/customer_group/vat) | — (just field-adds) | **H2** (warehouse↔purchasing), E (customer_group↔group pricing in resolver) | H2, I | ✅ field-adds anytime |
| **H2** supplier→purchasing/stock-in | **H** (warehouse field) | H, I (cost→profit) | I profit report | no (needs H field) |
| **I** reports (profit/loss, stock audit) | **B** (stock movement), **H2** (cost-in), F (sold_count) | — | — | no (needs the data first) |
| **J** search + bulk CSV | A (attributes to index/import) | — | — | mostly independent |
| **K** enterprise (multi-lang/PWA/POS…) | per-feature | — | — | ✅ independent, per-client |
| **L** category-optional + RBAC + dead-field cleanup | category-optional needs A's tree (done) | — | — | ✅ independent cleanups |
| **FE** home redesign + products-original + filter UI | filter UI needs A; rest independent | A (Phase 5) | — | mostly independent |

**Critical chain (can't reorder):** A → B → C. Everything hangs off A (the resolver + combination-stock + attribute model). B must precede C (never charge money on a client-trusted total). I needs B + H2 first (no data to report otherwise).

**Free-floating (slot in anytime, even early as filler):** D (auth), G (wishlist/SMS), H (field-adds), L (cleanups), most of K/FE. These touch isolated areas and don't block the critical chain.

**Recommended real order:** A → **B** (critical, exploitable bug) → C → E → F → G → H → H2 → I → J → (D, L anytime in gaps) → K/FE as demanded.

## 📚 END-OF-STAGE-1 — Project docs refresh (owner-stated, do BEFORE deploy)
Once Stage 1 is fully done (all backend phases + V1 pass-through + deploy-ready), **refresh ALL real project docs across the 3 apps** — they're stale after the heavy backend rewrite (e.g. `backend.md` still documents the DELETED sub_category/child_category/specification modules ×38 and is missing variation-combination/payment/nested-category/loyalty/warehouse). This is the owner's reference/handover doc set, not the `_ai/` working notes. Refresh:
- **Root `docs/`** (the human reference set): `backend.md` (biggest — rewrite to current modules/endpoints/schemas), `admin.md`, `frontend.md`, `features.md`, `issues.md`, `overview.md`, `setup-guide.md`. (`SAMPLE_FORMAT.md` = format sample, leave.)
- **Per-app `CLAUDE.md`** ×3 (root + Backend + Admin + Frontend) + per-app `README` ×3 — update stack/conventions/run notes to match V2-of-V1 reality (e.g. root CLAUDE.md "Active Feature Work" + "3-Level Category Hierarchy" sections are now wrong → nested tree).
- Best done at the END so the docs capture the settled picture (don't redo per-phase). The `_ai/` docs + handoff memory already hold the live truth meanwhile.

## Cross-refs
Detail/rationale already in `docs/_ai/BACKEND_AUDIT.md` (structural) + `docs/_ai/CLONE_NOW_FIXES.md` (incremental) + `docs/_ai/SAAS_FUTURE_PLAN.md` (future). This file = the unified ordered superset.
