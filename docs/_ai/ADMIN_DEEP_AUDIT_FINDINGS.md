# Admin Deep Audit (logic-level) — findings — 2026-06-17/18

Page-by-page deep-read of the FruitSnacks **Admin** SPA (full components + hooks + data slices, not just routes) vs `docs/admin.md`, run by 4 parallel agents. Mirrors `BACKEND_DEEP_AUDIT_FINDINGS.md`. This file collects RAW findings; doc-fixes + bug-tickets are applied/tracked separately.

Legend: ❌ DOC WRONG · ⚠️ DOC MISSING · 🐛 REAL CODE BUG/SMELL · ✅ confirmed.
Severity: BLOCKER / HIGH / MEDIUM / SMELL.

**FIX STATUS:** s47 (2026-06-19, browser-verified via Playwright) — **✅ FIXED on `dev` (Admin `d3c6c88`):** A4.1 (warehouse ghost-flag guards → `site_setting_update`), A4.2/A4.3 (permissionData Question/Offer/Campaign/Slider uncommented), A2.1 (/pathao-order → /order/pathao), A1.1 (buying-price required dropped; quantity still required = deferred owner decision). **⏳ STILL OPEN:** A2.2/A2.3 (order-status dropdown dead code — OWNER DECISION: wire vs courier-only) + the MEDIUM/SMELL batch.

---

## ⭐ TOP FINDINGS (cross-agent triage)

**BLOCKER / workflow-breaking:**
- **A2.2 + A2.3 — order status cannot be advanced via UI.** The forward-transition `<select>` dropdown (+cancel/return reason prompts) lives ONLY in `OrderTable.jsx`, which is imported NOWHERE. `/order` renders PendingRow/SteadfastRow/PathaoRow/DefaultRow (no dropdown); `ViewAllOrderInfo` only DISPLAYS status. So an admin can't move pending→confirmed→processing→shipped→delivered→completed except via courier sync + the list "Cancel" button. Backend `updateOrder` also does NO transition validation. **VERIFY then decide: wire dropdown into ViewAllOrderInfo, or confirm status-advance is intentionally courier-only.** Highest-impact finding.
- **A4.1 (VERIFY) — Warehouse menu+page hidden for everyone** (FE guards on nonexistent `setting_show`/`setting_update`; backend routes already fixed in B1). Likely a 1-line FE repoint.

**HIGH:**
- **A4.2/A4.3 — permissionData.js commented-out blocks → Question/Offer/Campaign/Slider ungrantable to custom staff roles** (only schema-derived super-admin can use them). Uncomment fixes it.
- **A1.1 — simple-product "Save Draft" blocked** by RHF-required buying price.
- **A2.1 — `/pathao-order` page broken** — queries `order_status=shipped` (all couriers) instead of `/order/pathao`.

**MEDIUM/SMELL:** A1.2 category file-branch, A2.4 Fraud page no RBAC guard, A2.5 abandoned-cart default shape, A3.2 chat config in 2 tabs, A3.3 position selector hidden for live-chat-only, A3.4 PageSeo title-length 3-way disagreement, A4.4 login reload, A4.5 Supplier page no guard, console.logs, delete-by-index.

**Doc-only fixes (no code):** A1.6/A1.7 (product list/variation endpoints), A2 doc rows (POS path, 4 list endpoints, status-transition overclaim, view-only reasons, legacy courier pages), A3 (13→19 toggles, embed public-not-secret + stale code comments, FAQ overclaim), A4 (supplier not commented, warehouse flags, "all flags shown" false), coupon BOGO / status defaults missing.

---

## ADMIN AGENT 1 — Products / Catalog (DONE)

Scope: ProductForm.jsx (2301 lines), AddProduct, UpdateProduct, StepOneVariation, StepOnePrice, all 5 ProductList/*Modal, ProductListTablePage, AddCategory, UpDateCategory, AddAttribute, AddBrandCategory, InternalCodesPanel + backend cross-check.

### 🐛 REAL CODE BUGS
- **A1.1 — HIGH — `StepOnePrice.jsx:52-53` (+47-49): `product_buying_price` RHF-`required` on simple products blocks "Save Draft".** Same `handleSubmit` fires for Draft and Publish (`ProductForm.jsx:2275,2282`). RHF rejects whole submit → can't save a simple draft without buying price, though backend treats it optional (`ProductForm.jsx:1173-1174`). Variable mode unaffected. Fix: drop `required` on buying price; gate `product_quantity` required behind publish only.
- **A1.2 — MEDIUM — `UpDateCategory.jsx:136`: 4-way copy-pasted file branch reads `data.category_logo[0]` unguarded.** FileLists usually safe, but throws if RHF yields undefined (conditionally-unmounted input). Lines 136/188/235/282. Fix: normalize once `const logo = data?.category_logo?.[0]`.
- **A1.3 — SMELL — `ProductUpdatePage.jsx:17`: product fetch omits `credentials:"include"`.** Works only because `GET /product/dashboard/:_id` has no verifyToken (`product.routes.ts:125`). Silently 401s if route ever protected. Inconsistent w/ ProductVariationsModal.jsx:87.
- **A1.4 — SMELL — over-strict category gate vs backend.** `ProductForm.jsx:1396-1399` hard-blocks save without category_id, but backend `product.model.ts:74` made category_id OPTIONAL (Phase L). Admin enforces a constraint backend relaxed. Decision needed.
- **A1.5 — SMELL — stale "100" cap in comment.** `StepOneVariation.jsx:745-746` comment says 100 hard cap; real = 500 (backend `product.controllers.ts:958,1499`; same file UI at 412/761 already uses 500). Comment-only, runtime correct.

### ❌ DOC WRONG
- **A1.6 — Variations modal endpoint.** `admin.md:248` says modal uses `/variation/by-product/:productId`. Actually `ProductVariationsModal.jsx:87` fetches `GET /product/dashboard/${id}` → `detail.data.variations`. `/variation/by-product/:productId` is used by a DIFFERENT component (`ProductPageContent/VariationWeightEditor.jsx:31`). Per-cell save `PATCH /variation/:id` matches doc.
- **A1.7 — Product List API.** `admin.md:243` says list uses `/product/dashboard`. Actual list (`ProductListTablePage.jsx:115-117`) calls `GET /product/dashboard-rich?...` (rows pre-annotated `_variation_count`/`_stock_total`/`_is_low_stock`/`_flags`/`_has_theme`). `/product/dashboard` only single-product fetch.

### ⚠️ DOC MISSING
- **A1.8 — sessionStorage draft autosave (create only).** `ProductForm.jsx:581-981` — debounced draft (key `fs_product_draft_create`, 30-min TTL, meaningfulness guard, restore-toast w/ Discard, attribute-id self-heal vs deleted attrs).
- **A1.9 — Category-default attribute auto-apply.** `ProductForm.jsx:376-505` fetches `GET /category/defaults/:id` on category pick → silent apply (empty) or Apply/Dismiss banner, AbortController race-guard. Add/UpDateCategory write `default_variant_attributes`/`default_filter_attributes` as JSON-stringified arrays (`AddCategory.jsx:114-121`).
- **A1.10 — per-attribute `show_in_filter` + variation-axis toggle + spec-only attributes.** `StepOneVariation.jsx` sends `product_attributes[i][show_in_filter]` (default true) + `variant_axes[i][is_mandatory]`; attrs are Axis (drive variations) or Spec-only (filter/PDP table). Core of variation engine, undocumented.
- **A1.11 — inactive ref → Publish-gating.** Inactive category/brand/attribute disables Save&Publish (Draft only) — `ProductForm.jsx:2256-2287` ← `StepOneVariation.jsx:382-388`.
- **A1.12 — partial-update modals richer than doc.** SIX modals: Images (`PATCH /product/images` mode swap_main/add_other/reorder/remove_other), Video, Price (`PATCH /product/quick` incl tier prices + masked buying-price reveal), Stock, Variations (per-cell `PATCH /variation/:id`), Analytics-Seed. Inline status/trending toggles → `PATCH /product/quick`.
- **A1.13 — list filter exposes uncreatable product types.** `ProductListTablePage.jsx:308-316` filters digital/preorder/subscription (valid backend enum) but form only offers simple/variable/combo (`ProductForm.jsx:1472-1481`).

## ADMIN AGENT 2 — Orders / POS / Courier / Fraud (DONE)

Scope: OrderPage, all 6 components/Order rows + OrderTable/OrderStatus/ViewAllOrderInfo/PathaoOrderTable/SteadfastOrderTable, CreateOrderPage (POS), Pathao/SteadfastOrderPage, Fraudcheckpage, AbandonedCart + backend cross-check.

### 🐛 REAL CODE BUGS
- **A2.1 — HIGH — `/pathao-order` page broken (`PathaoOrderPage.jsx:33-44`).** Queries `/order/dashboard?order_status=shipped` (ALL couriers in shipped status), not `/order/pathao`. Lists Steadfast/no-courier shipped orders + misses non-shipped Pathao. Legacy page never migrated. Fix: point at `/order/pathao` or retire route.
- **A2.2 — HIGH (dead code) — `components/Order/OrderTable.jsx` (518 lines) imported NOWHERE.** It's the ONLY component with the status `<select>` + forward-transition rules + cancel/return reason prompts (`:64-140,327-385`). `/order` uses Row components (no dropdown); ViewAllOrderInfo has no status control. **Admin has no reachable UI to advance order status** (only Cancel button + courier sync). Fix: wire into ViewAllOrderInfo OR delete if status is intentionally courier-driven. **Owner decision.**
- **A2.3 — HIGH (backend, surfaced here) — `order.controller.ts:1087-1116` `updateOrder` has NO forward-transition validation.** Stamps time + writes whatever `order_status` in body. Guard only in dead OrderTable.jsx. Crafted PATCH can jump pending→completed or delivered→pending. Fix: server-side allowed-transition map in updateOrderServices.
- **A2.4 — SMELL — `Fraudcheckpage.jsx:113-119` no client RBAC guard.** Every sibling checks a flag (OrderPage `order_show` :624). Server-gated (`fraud.routes.ts:7`) so no data leak, but unpermitted admin sees page + 403 toast. Fix: add `order_show` guard.
- **A2.5 — SMELL — `AbandonedCartPage.jsx:36-50` wrong default shape.** `data: carts = []` but response is `{data,totalData}` object → `carts.totalData` undefined initially. Harmless (guards). Fix: default `{}`.
- **A2.6 — SMELL — POS receipt naming can drift.** `CreateOrderPage.jsx:236` line uses live image; payload sends no name/image snapshot, relies on BE recompute (`postAdminOrder` :1316-1317). On-screen POSReceipt renders client lines → drift if renamed mid-cart. Low impact.

### ❌ DOC WRONG
- **admin.md:257** — POS API doc says `POST /order`. Real: `POST /order/create-admin` (`CreateOrderPage.jsx:331`, `order.routes.ts:40`). `POST /order` is public storefront checkout. Flag name correct, path wrong.
- **admin.md:256** — Order List doc says single `/order/dashboard`. Real: 4 endpoints by tab — `/order/dashboard` (all/delivered/cancelled/pos/offer), `/order/steadfast`, `/order/pathao` (`OrderPage.jsx:173-191`).
- **admin.md:264** — claims "status update (9-value, valid forward transition only)". As built that dropdown is dead code (A2.2), unreachable. Reachable writes = Cancel + courier sync. Doc = intended not shipped.
- **admin.md:260** — claims detail page supports cancel/return reason. ViewAllOrderInfo only DISPLAYS them read-only (`:262-281`); no control to set (reasons only via dead OrderTable prompt).

### ⚠️ DOC MISSING
- **Two legacy courier pages still live.** `/pathao-order` + `/steadfast-order` (Route.jsx:226/232, sidebar) use older tables w/ own dropdowns+send, DUPLICATING the Steadfast/Pathao tabs inside unified OrderPage. `/pathao-order` also broken (A2.1).
- **POS price authority:** BE recomputes all prices from DB + overwrites client, but `admin_manual_discount` + admin `shipping_cost` survive (`postAdminOrder:1263-1283`); enforces min_order/maintain_stock; skips Meta/TikTok/SMS for order_source:"admin".
- **Editable Delivery Override card** — DeliveryInfoModal (`PATCH /order/delivery-info/:id`) overrides courier recipient name/phone/address separate from billing.
- **POS hardcoded shipping** — `CreateOrderPage.jsx:28-30` hardcodes INSIDE=60/OUTSIDE=120/DHAKA="47" not from settings; can diverge from storefront DB shipping.
- **Steadfast cancel rule inconsistency** — OrderPage tab allows cancel unless in STEADFAST_CANCEL_BLOCKED (pending/in_review allowed) vs legacy SteadfastOrderPage only `in_review`.
- Cancel/Send buttons always rendered; safe via BE re-send guard (FE relies on BE not hiding).

### ✅ CONFIRMED
- 9-value status enum matches backend (`order.interface.ts:8-17`); color maps cover all 9 w/ singular cancel/return keys.
- `internal_note` does NOT leak (stripped `order.service.ts:27,75,321`).
- Snapshot-vs-live fallback correct (SKU + name/image).
- SMS on confirm fires post-commit (`:1132-1147`); none for POS.
- Offer Orders = order_type=offer tab; old pages removed.
- RBAC flags real+consistent (order_show/order_update/order_create_admin); no typos.
- Bulk send/sync guards server-side (≤50 cap, re-send reject, skipped bucket).

---

## ADMIN AGENT 1 — Products / Catalog (DONE)

Scope: ProductForm.jsx (2301 lines), AddProduct, UpdateProduct, StepOneVariation, StepOnePrice, all 5 ProductList/*Modal, ProductListTablePage, AddCategory, UpDateCategory, AddAttribute, AddBrandCategory, InternalCodesPanel + backend cross-check.

### 🐛 REAL CODE BUGS
- **A1.1 — HIGH — `StepOnePrice.jsx:52-53` (+47-49): `product_buying_price` RHF-`required` on simple products blocks "Save Draft".** Same `handleSubmit` fires for Draft and Publish (`ProductForm.jsx:2275,2282`). RHF rejects whole submit → can't save a simple draft without buying price, though backend treats it optional (`ProductForm.jsx:1173-1174`). Variable mode unaffected. Fix: drop `required` on buying price; gate `product_quantity` required behind publish only.
- **A1.2 — MEDIUM — `UpDateCategory.jsx:136`: 4-way copy-pasted file branch reads `data.category_logo[0]` unguarded.** FileLists usually safe, but throws if RHF yields undefined (conditionally-unmounted input). Lines 136/188/235/282. Fix: normalize once `const logo = data?.category_logo?.[0]`.
- **A1.3 — SMELL — `ProductUpdatePage.jsx:17`: product fetch omits `credentials:"include"`.** Works only because `GET /product/dashboard/:_id` has no verifyToken (`product.routes.ts:125`). Silently 401s if route ever protected.
- **A1.4 — SMELL — over-strict category gate vs backend.** `ProductForm.jsx:1396-1399` hard-blocks save without category_id, but backend `product.model.ts:74` made category_id OPTIONAL (Phase L). Decision needed.
- **A1.5 — SMELL — stale "100" cap in comment.** `StepOneVariation.jsx:745-746` says 100; real = 500 (same file UI at 412/761 uses 500). Comment-only.

### ❌ DOC WRONG
- **A1.6 — admin.md:248** Variations modal endpoint: doc says `/variation/by-product/:productId`; actual `ProductVariationsModal.jsx:87` fetches `GET /product/dashboard/${id}`. (`/variation/by-product` used by VariationWeightEditor.jsx:31 instead.)
- **A1.7 — admin.md:243** Product List doc says `/product/dashboard`; actual `ProductListTablePage.jsx:115-117` calls `/product/dashboard-rich` (annotated rows).

### ⚠️ DOC MISSING
- **A1.8** sessionStorage draft autosave (create only, `ProductForm.jsx:581-981`, key `fs_product_draft_create`, 30-min TTL, attr-id self-heal).
- **A1.9** category-default attribute auto-apply (`GET /category/defaults/:id`, banner/silent, AbortController guard).
- **A1.10** per-attribute `show_in_filter` + variation-axis toggle + spec-only attributes (core of variation engine).
- **A1.11** inactive ref disables Save&Publish (Draft only).
- **A1.12** SIX partial-update modals (Images mode-based / Video / Price+tier / Stock / Variations per-cell / Analytics-Seed); inline status/trending → `PATCH /product/quick`.
- **A1.13** list filters digital/preorder/subscription but form only creates simple/variable/combo.

### ✅ CONFIRMED
- PATCH `/product` = full multipart rebuild, `_id` in body not URL (`ProductForm.jsx:1427-1431`, backend `product.routes.ts:42`). Doc correct.
- `/variation/:id` whitelist real (controller `variation.controllers.ts:37-53` `allowedKeys`; service unfiltered but controller filters).
- All catalog RBAC flags exist in role.model (product/category/brand/attribute _show/create|post/update/delete). No phantom flags.
- Nested category routes confirmed: `/category/tree`, `/children/:id`, `/reparent-impact/:id`, `/defaults/:id`. Doc correct.
- Misspelled `UpDateCategory.jsx` confirmed (Brand uses correct spelling).
- SKU/Barcode backend-controlled, read-only via InternalCodesPanel. QR own block.
- Orphans still present: `hooks/useGetData.jsx`, `utils/cookie-storage.js` (dead).
- `URL.revokeObjectURL` IS done in ProductImagesModal.jsx (34,56,64-65,110,126); main ProductForm media handlers (989-1038) do NOT revoke (known A-14 leak).

---

## ADMIN AGENT 4 — Marketing / RBAC / Auth / Viewers (DONE)

Scope: backend role.model/interface/services/controllers/verify.token/bootstrap + warehouse/question/supplier/offer/flashsale routes + coupon/campaign/flashsale models; admin permissionData.js, SideNavBar, AuthProvider, PrivateRoute, SignIn, ForgetPassword, StaffRole create/update, AddAllStaff, AllStaffPage, marketing forms, viewer pages.

> ⚠️ NOTE for triage: backend B1 fix (s45) already repointed **warehouse ROUTES** to `site_setting_update`. This agent read a tree where the SIDEBAR + PAGE guards may still reference the old `setting_show`/`setting_update`. VERIFY current code before fixing A4.1 — the live bug may now be only the FE guard half (menu/page hidden) even though the route works.

### 🐛 REAL CODE BUGS
- **A4.1 — BLOCKER (VERIFY) — Warehouse sidebar+page guard on nonexistent `setting_show`/`setting_update`.** `SideNavBar.jsx:467,475` + `WarehousePage.jsx:50,61` check flags absent from role.model → menu + page body permanently hidden for ALL users incl super-admin (bootstrap derives role from schema paths only). Backend routes already fixed (B1→`site_setting_update`); FE guards likely still stale. Fix: repoint FE guards to `site_setting_update` (write) + a real read flag.
- **A4.2 — HIGH — `question_show`/`question_update` commented out in `permissionData.js:52-65` → ungrantable to custom roles.** Role create/update (`CreateStaffRole.jsx:37-41`, `UpDateStaffRole.jsx:40-45`) only emit flags present in `permissionsData` → omitted flags default false. Flags exist in schema (super-admin has them) but no custom role can get Question access. Fix: uncomment Question block.
- **A4.3 — HIGH — `offer_*` + `campaign_*` commented out in `permissionData.js:209-251` → Marketing ungrantable to custom roles.** Same mechanism. Marketing sidebar + Flash/Offer/Campaign pages gate on these (flash uses `offer_*` per `flashsale.routes.ts`). Only super-admin can use Marketing. Slider `slider_*` + Specification `specification_*` likewise commented (slider gated on `slider_show` = same defect; specification module retired). Fix: uncomment Offer+Campaign (+Slider) blocks.
- **A4.4 — MEDIUM — login `window.location.reload()` defeats SPA+AuthProvider** (`SignInPage.jsx:119-121`). Known A-6, still present. Races navigate, double-loads bundle. Fix: AuthProvider `refetchUser()`.
- **A4.5 — SMELL — SupplierPage has no page-level permission guard.** `SupplierPage.jsx` renders table + Add button unconditionally (every sibling viewer gates on `*_show`). Not a security hole (backend enforces) but broken UI for unpermitted staff hitting `/supplier`. Fix: wrap in `supplier_show`, gate Add on `supplier_create`.
- **A4.6 — SMELL — leftover console.log:** `AllStaffPage.jsx:38,55`, `UpDateStaffRole.jsx:11`, `AddCoupon.jsx:191`, `AuthProvider.jsx:35`.

### 🔑 RBAC DRIFT TABLE
| flag | in permissionData.js? | in role.model? | gated where | verdict |
|---|---|---|---|---|
| `setting_show`/`setting_update` | ❌ no | ❌ **no** | warehouse sidebar:467/475, WarehousePage:50/61 | **BLOCKER(verify) — nonexistent flag, FE guard stale post-B1 (A4.1)** |
| `question_show`/`question_update` | ❌ commented | ✅ yes | sidebar:398, QuestionPage:49 | **HIGH — ungrantable (A4.2)** |
| `offer_*` | ❌ commented | ✅ yes | Marketing sidebar + offer/flash routes | **HIGH — ungrantable (A4.3)** |
| `campaign_*` | ❌ commented | ✅ yes | Marketing sidebar + campaign routes | **HIGH — ungrantable (A4.3)** |
| `slider_*` | ❌ commented | ✅ yes | sidebar:317 | MEDIUM — ungrantable |
| `specification_*` | ❌ commented | ✅ yes (4) | nowhere | orphan — module retired, schema still carries |
| `dashboard_show`, `setting_secrets_update`, `demo_data_clear`, `customer_*`, `supplier_*`, `payment_*`, `site_faq_*`, `newsletter_*`, `trust_point_*`, `faq_template_*`, `theme_*`, `order_create_admin`, `user_*`, `role_*` | ✅ | ✅ | various | OK |

No `offer_order_*` flag in schema; permissionData correctly omits it (offer orders folded into Order List tab). Consistent.

### ❌ DOC WRONG
- **admin.md:350** — "Supplier … Sidebar-এ commented out". Code: `SideNavBar.jsx:483-490` actively renders Suppliers under Inventory, gated on `supplier_show`. NOT commented out.
- **admin.md:369** — documents Warehouse perm as `setting_show`/`setting_update` as if functional; those flags don't exist (A4.1). Doc reproduces broken gate without flagging.
- **admin.md:286** — "role page shows ALL available permission flags". False: Question/Offer/Campaign/Slider/Specification commented out → invisible in role UI (A4.2/A4.3).

### ⚠️ DOC MISSING
- Login hard `window.location.reload()` not flagged as anti-pattern (A4.4).
- Coupon BOGO undocumented: `coupon_type` = `fixed|percent|bogo` + `bogo_buy_qty`/`bogo_get_qty`/`bogo_get_discount_pct`, `coupon_amount` optional for BOGO; per-person `coupon_use_per_person` + total `coupon_use_total_person`; coupon status defaults `in-active`.
- Status default inconsistency: Flash Sale defaults `active` (`flashsale.model.ts:13`) vs Coupon/Campaign `in-active`. API flash w/o status goes live immediately. (Note: backend B5 fix changed flashsale default to in-active — VERIFY which tree.)
- Forgot-password fully built (phone/email toggle, 6-box OTP, resend) → `/admin_reg_log/forgot-password` + `/reset-password`; doc one-liner omits email channel.

### ✅ CONFIRMED
- verify.token rejects empty permission + requires active status + truthy flag from FRESH DB each request (mid-session deactivation enforced).
- Supplier+payment routes migrated off old `verifyToken("")` bypass.
- Flash Sale reuses `offer_*` deliberately.
- AddCoupon form mirrors conditional schema (omits amount for BOGO, percent≤100, BOGO qty≥1).
- Campaign payload field names match `campaign.model.ts` exactly.
- PrivateRoute gates `admin_status=="active" && admin_phone` w/ loader, no redirect flash. All viewer pages re-check perms EXCEPT Supplier (A4.5).
- Role update = `$set` of posted body (`role.services.ts:45`) → omitted flags preserved not nulled → super-admin keeps Question even when UI-edited; only NEW custom roles lose it (A4.2).

---

## ADMIN AGENT 3 — Settings / Home Layout / Theme / SEO (DONE)

Scope: SettingPage → SettingS → all 14 tabs, HomeLayoutTab (@dnd-kit), Theme form + ThemeFloatingManager, PageSeo, TrustPoint, SiteFaq, Newsletter, FaqTemplate, Banner/Slider vs setting.interface/model/services/routes + role flags. **Headline: s44 `_show`/`_enabled` chat bug NOT repeated — all chat fields use `_show` end-to-end.**

### 🐛 REAL CODE BUGS
- **A3.1 — SMELL — `HomeLayoutTab.jsx:542` misleading note.** Says live-chat embed saved in "Secrets tab (site_setting_update)". Wrong twice: (a) embed edited in **Storefront Behaviour** tab (`StorefrontBehaviourTab.jsx:384`), not Secrets; (b) `chat_livechat_embed_code` deliberately removed from SETTING_SECRET_FIELDS (`setting.services.ts:30-34`) so storefront can render it. Fix: point note to Storefront Behaviour → Customer Support → Enable Live Chat.
- **A3.2 — SMELL — chat-widget config duplicated across two tabs.** `chat_messenger_show`/`chat_messenger_page_id`/`chat_livechat_show`/`chat_widgets_position` editable in BOTH HomeLayoutTab:539-546 (`PATCH /setting/home_layout`) AND StorefrontBehaviourTab:345-417 (`PATCH /setting`). Last-saved wins. HomeLayoutTab has NO page-ID validation; StorefrontBehaviourTab enforces it (`:105-112`). Fix: consolidate to one tab.
- **A3.3 — SMELL — `StorefrontBehaviourTab.jsx:400` position selector hidden for live-chat-only shops.** Renders only when `enable_whatsapp_chat || chat_messenger_show`; excludes `chat_livechat_show`. Fix: add chat_livechat_show to condition.
- **A3.4 — MEDIUM — `UpdatePageSeo.jsx` title-length cap disagrees 3 ways.** RHF `maxLength:40` (`:205-208`) + counter `/40` (`:197`) but `isFormValid()` gates `>60` (`:135`). Stricter RHF(40) wins → 41–60 char title: button stays enabled but RHF error blocks submit (stuck state) w/ contradicting "/60" hint. Fix: pick one cap, make register+counter+isFormValid agree.
- **A3.5 — SMELL — `ThemeFloatingManager.jsx` delete-by-index.** Assets carry stable `id` (React key `a.id||i` `:148`) but delete is `DELETE /theme/:id/floating-asset/:index` (splice by index, `theme.services.ts:118-131`). Fragile if list reorders between render+delete. Low risk (single admin). Fix: delete by stable id.

### ❌ DOC WRONG
- **admin.md:335** — Storefront Behaviour = "13 toggle". Code sends ~19 fields (7 Tier-A + 6 Tier-B + 3 review toggles + 4 chat). "13" predates review/seeded-review additions.
- **admin.md:369** — Warehouse perm `setting_show`/`setting_update` don't exist (same as A4.1).
- **admin.md:325** — claims FAQ Templates has "unfilled-placeholder warn". No live warning on save — only clickable chips + static note. Overclaim.

### ⚠️ DOC MISSING
- **Embed-code is PUBLIC, not secret.** `setting.interface.ts:303` + `setting.model.ts:350` STILL carry stale comment "stored via /setting/secrets — sensitive", but it was moved OUT of SETTING_SECRET_FIELDS (`setting.services.ts:30-34`); saved via plain `PATCH /setting`, delivered in public `/setting`. Fix doc + those two in-code comments.
- **`/setting/home_layout` whitelists fields.** HomeLayoutTab spreads ENTIRE settings doc into PATCH; safe only because `updateHomeLayoutSettingServices` (`setting.services.ts:387-399`) hard-whitelists HOME_LAYOUT_FIELDS. Doc should note this (prevents clobber).
- **Demo Data double-gated** on `demo_data_clear`: SettingPage sub-nav + DemoDataSettings component short-circuit + both backend routes.
- **Theme typography two-font w/ legacy fallback.** `ThemeForm.jsx:59-69` reads heading_font/body_font, falls back to deprecated `font_key`; `style` deprecated/unused, admin never sends it.

### ✅ CONFIRMED
- Chat fields correct (no s44 repeat) — full `_show`/`_enabled` sweep clean.
- Secret handling sound: public IDs via `/setting`, CAPI tokens/test-codes via `/setting/secrets` (gated `setting_secrets_update`), masked lastFour, empty=no-change, SECRET_KEYS(admin) ⊆ SETTING_SECRET_FIELDS(backend).
- Home-layout full-18 honored: L9_DEFAULTS + backend HOME_SECTION_DEFAULTS both 18 incl 3 boutique; FE renders only enabled; no trim. (Minor cosmetic: backend default flash_sale:false vs admin L9 true — only matters as fallback, backend backfills.)
- Field names verified: OfferBanner, AnnouncementBar, FeatureCards, SoftwareInformation all match interface/model + correct `/setting` PATCH.
- TrustPoint own module (points[]{icon_key,icon_url,title,subtitle}); `ITrustPoint` in setting.interface:336 dead/unused. (lowercase `src/app/trustpoint/` dir on disk NOT git-tracked = core.ignorecase artifact; route imports tracked capital-P; no prod hazard.)
- FaqTemplate live cache refresh works (invalidation keys match hook keys). Free-text Topic + nested Scope + chips confirmed; field still named `category` (UI "Topic").
