# Client Sprint 2 — FruitSnacks

**Created:** 2026-06-05 (session 24)
**Last revised:** 2026-06-05 (post FULL Sprint 2 plan-edge-auditor pass — 5 items audited, 49 findings absorbed)
**Approach:** Same horizontal-sweep pattern as Sprint 1 — quick wins first, design-heavy work last. Per-item edge-audit BEFORE code.
**Branch:** All on `v2` in BE/Admin/FE. NO partial deploys. Single main merge at end, owner-explicit only.
**Predecessor:** [CLIENT_SPRINT.md](CLIENT_SPRINT.md) (Sprint 1 — 22 items, COMPLETE on v2, waiting on owner test + deploy).
**Companion:** [CLIENT_SPRINT_3.md](CLIENT_SPRINT_3.md) (Sprint 3 — Frontend home redesign + future design-heavy work).

---

## 🔒 Owner decisions LOCKED

| # | Decision | Why |
|---|---|---|
| **D1** | **Item order: quick wins first, design-heavy items LAST** | Owner-rule: "thinking gula beshi plan lagbe — agula last er dike rakhba" |
| **D2** | **Payment work DEFERRED — COD-only this update** | D16 SSLCommerz full E2E + 11γ combo + 11δ offer-in-cart all skipped this sprint |
| **D3** | **Plan-edge-auditor sub-agent runs on ALL Sprint 2 items before code** | DONE 2026-06-05 in 2 waves: wave 1 = D15/H/H1, wave 2 = C12/C13/11β/D18/E20. All findings absorbed below. |
| **D4** | **H1 home redesign moved to Sprint 3** | Owner decision: "thinking gula beshi plan lagbe" needs design pass first |
| **D5** | **C13 scope expanded to Tier A+B = 12 toggles** | Owner picked Option C (recommended). Tier A 7 essentials + Tier B 5 high-value additions |
| **D6** | **11β BOGO — anonymous allowed** | FB-ad guest traffic must use BOGO. CouponSection login gate bypassed for BOGO type; `findACoupon` accepts no customer_id. |
| **D7** | **11β BOGO — coupon stock decrements per order** | Same as percent/fixed. Admin can cap with `coupon_available`. |
| **D8** | **C13 `maintain_stock: false` — skip guard AND skip decrement** | Pre-order/MTO mode = stock fields display-only. Decrement also skipped so counters don't drift. |
| **D9** | **E20 dashboard timezone = BST (Asia/Dhaka)** | "Today" widget aligns with shop operating hours, not server UTC. |
| **D10** | **D18 POS — skip Meta/TikTok CAPI + skip SMS for admin-source orders** | POS = offline sale; fake Purchase events pollute pixel audience; walk-in SMS optional. |
| **D11** | **D18 POS — manual discount field only (no coupons)** | Admin types discount amount free-form. Coupon system untouched, global coupon stock not consumed by POS. |
| **D12** | **E20 dashboard — new `dashboard_show` permission flag** | 4-point sync. Warehouse/limited staff can't see revenue. Dedicated control vs reusing `order_show`. |
| **CRITICAL** | **Anonymous checkout MUST keep working** | Same constraint as Sprint 1. C13's `verify_phone_on_order` defaults OFF; admin opt-in only |

---

## Wave 1 audit (D15 / H / H1) — already absorbed earlier

**plan-edge-auditor ran on D15, H, H1 in parallel (2026-06-05). Findings reshaped the plan significantly:**

### D15 Wishlist — was assumed greenfield, actually **partially built and buggy**
- Backend module + sync utility already exist on disk; the plan thought they were todo
- 3 BLOCKER bugs in existing code (no WishlistLoader, Remove/Add don't hit DB for logged-in, login race)
- Plan rewritten as "fix + complete existing" rather than "build from scratch"

### H Auth hardening — was assumed full backend work, actually **backend already 100% shipped**
- `auth.tokens.ts` already uses 7d/30d (not 365d). bcrypt OTP already done with back-compat. Admin forgot/reset routes already wired
- Real gap: Admin FE has no ForgotPasswordPage; 3 backend bugs in SMS-vs-DB-save ordering and return-value handling
- Plan rewritten as "Admin FE page + small BE bug fixes"

### H1 Home redesign — **moved to Sprint 3** per owner D4
- Audit found 3 BLOCKERS + 4 HIGH + 5 open questions
- Sprint 2 Bucket 0 absorbed the 3 BLOCKERS as pre-sprint bug fixes (they affected more than just home — shipped 2026-06-05 commits `00de5da` + `0bcf174`)

---

## Wave 2 audit (C12 / C13 / 11β / D18 / E20) — newly absorbed

**13 BLOCKERS + 19 HIGH + 17 MEDIUM across 5 items. Below: per-item BLOCKER/HIGH list inlined into each contract. MEDIUM/NICE absorbed where impactful, deferred where genuinely "rare-but-real" with low blast radius.**

---

## Sprint 2 scope — 9 items, ~40-55h (revised up from ~35-48h after audit findings)

### Bucket 0 — Pre-sprint production-blocking bug fixes ✅ SHIPPED 2026-06-05

Already shipped via post-hoc audit (commits `00de5da`, `0bcf174` FE + Item 8/10/11α back-fixes BE). Listed in OWNER_TEST_STATUS PH.1-PH.11.

### Bucket 1 — Quick wins (Days 1-2, ~4-5h)

| ID | Item | Effort |
|---|---|---|
| **C12** | SMS settings runtime read (.env fallback) + **2 audit BLOCKERS fixed** | ~3h (was 2h) |
| **Item 5** | `/products-original` regression verify | ~30 min |

### Bucket 2 — D15 Wishlist (~5-6h, unchanged from wave 1)

### Bucket 3 — Schema-ready (Day 3, ~6-7h)

| ID | Item | Effort |
|---|---|---|
| **11β** | Coupon BOGO wire-up + **3 audit BLOCKERS fixed** | ~6h (was 4h) |

### Bucket 4 — Backend hardening + settings (~12-16h)

| ID | Item | Effort |
|---|---|---|
| **H** | Auth hardening (Admin FE + 3 BE bug fixes — wave 1 contract) | ~3-4h |
| **C13** | ZatiqEasy shop toggles — 12 toggles + **3 audit BLOCKERS fixed** | ~8-10h (was 5-7h, expanded for review moderation queue + `$set` fix) |

### Bucket 5 — Admin daily-use (~12-16h)

| ID | Item | Effort |
|---|---|---|
| **E20** | Dashboard widgets + **2 audit BLOCKERS fixed (auth gate + index)** | ~6-7h (was 4-5h) |
| **D18** | Admin "Create Order" POS + **3 audit BLOCKERS fixed** | ~8-10h (was 6-8h) |

---

## Item contracts

---

### **C12 — SMS settings runtime read** ✅ SHIPPED 2026-06-05 (session 25)

**Audit findings absorbed: 2 BLOCKERS + 3 HIGH**

**Status:** All 5 audit items + Core helper landed on `v2`. Includes C13 BLOCKER 1 (`$set` fix in `updateSettingServices`) as a side-effect because the strip-empty-secret guard depends on partial-update semantics — C13 can now skip its BLOCKER 1.

**Tests:** See OWNER_TEST_STATUS.md → P2 C12.1-C12.8.

**Core scope:**
- Helper `getSmsConfig()` in `setting.services.ts` with DB-first / `.env`-fallback
- Both SMS callers (`middlewares/send.otp.phone.ts` + `utils/send.order.sms.ts`) switch to it
- `sms_enabled === false` → silent no-op
- Use existing `settingCache` (avoid per-send DB read)

**BLOCKER fixes (must do as part of C12):**

1. **Strip-empty-secret guard in `updateSettingServices`** — current code does `$set: { sms_api_key: "" }` when Admin saves any unrelated SMS field, wiping the stored credential. Fix: before applying patch in `updateSettingServices`, drop any key in `SETTING_SECRET_FIELDS` whose incoming value is `""` or `undefined`. One-line guard, no schema change.

2. **Split SmsSettings.jsx Save into 2 endpoints** — non-secret fields (`sms_enabled`, `sms_provider_name`, `sms_sender_id`) → `PATCH /setting`. Secret fields (`sms_api_key`, `sms_api_secret`) → `PATCH /setting/secrets` only when admin actually typed a new value. Gate the secrets call on `setting_secrets_update` permission. Existing `/setting/secrets` endpoint already correct.

**HIGH fixes (must do as part of C12):**

3. **Show masked credential display in view mode** — fetch `GET /setting/secrets` on tab mount (if admin has `setting_secrets_update`), show `secrets_summary.sms_api_key` as `••••3a4f`. Eliminates "blank fields = no key set" confusion.

4. **`send.otp.phone.ts` line 45: `http://` → `https://`** for bulksmsbd.net call (matches order.sms.ts which is already HTTPS).

5. **Add `storefront_base_url` settings field** — `send.order.sms.ts` line 5 hardcodes `SITE_URL` fallback. Mirror existing `qr_storefront_base_url` pattern: add field, read from settings first, env second. Lets buyer change domain without redeploy.

**Acceptance:** Buyer pastes new BulkSMS key → saves → places test order → SMS arrives. Buyer saves an unrelated SMS field → DB credential preserved (not wiped). `sms_enabled: false` → order completes 200, no SMS attempt. Wrong API key → order still completes, BulkSMS error logged BE-side.

---

### **Item 5 — `/products-original` regression verify** 🟢 trivial (~30 min)

Owner manual test only. Document in OWNER_TEST_STATUS. If bug found, file as separate item.

---

### **D15 — Wishlist (revised after audit)** 🔴 medium (~5-6h, wave 1 contract unchanged)

Audit reality check: BE module + sync utility + login-flow wiring **already exist on disk**. Plan = fix + complete missing pieces. 8-step fix list in original plan section retained as-is — see prior commit.

**Anonymous checkout impact:** None.

---

### **11β — Coupon BOGO wire-up** 🟡 medium (~6h, was 4h)

**Audit findings absorbed: 3 BLOCKERS + 4 HIGH + 5 MEDIUM**

**Owner D-locks for 11β: D6 anonymous allowed, D7 stock decrements per order.**

**BLOCKER fixes (must do as part of 11β):**

1. **FE `applyCartLayers.js` must NOT defer BOGO** — current code at line 21 has explicit "BOGO deferred" comment + falls through with no discount. If BE applies BOGO at recompute but FE shows ৳0, customer sees discount appear at order success that wasn't in cart → "cart lied" UX bug. Implement `applyBogoCoupon(lines, coupon)` FE function that exactly mirrors BE logic (cheapest qualifying line at `bogo_get_discount_pct` off, scoped to `coupon_specific_product` if set). Insert as new layer between current layers 3 and 5.

2. **Schema `coupon_amount: required: true` blocks BOGO creation** — Mongoose validation rejects BOGO coupons. Fix: change to conditional required via Mongoose `required: function() { return this.coupon_type !== 'bogo'; }` OR default to `0` for BOGO. Admin form `AddCoupon.jsx` line 125 also needs the conditional.

3. **Admin coupon-type select missing `"bogo"` option** — `AddCoupon.jsx` lines 346-349 only has fixed + percent. Add `<option value="bogo">BOGO</option>` in both AddCoupon + UpdateCoupon. Conditionally render the 3 BOGO fields (`bogo_buy_qty`, `bogo_get_qty`, `bogo_get_discount_pct`) when selected.

**HIGH fixes (must do as part of 11β):**

4. **`updateCouponServices` only writes `coupon_status`** — pre-existing bug, BOGO fields can never be saved via Update. Expand service to write all editable coupon fields. (Note: this fix also lets admins edit non-BOGO coupons properly — surfaces in PH back-fix candidate list.)

5. **Anonymous BOGO wire (D6)** — `CouponSection.jsx` line 24 + `CartSummary.jsx` line 67 login gate must accept BOGO codes. Approach: try-apply-coupon endpoint accepts BOGO without `customer_id`; FE input shown when toggle `enable_promo_at_checkout: true` regardless of login.

6. **`findACoupon` controller (`coupon.controllers.ts` line 59) drops `customer_id` requirement for BOGO** — change to `if (!coupon_code) throw`. Then inside, if `coupon_type === "bogo" && !customer_id` allow validation, skip per-user usage check.

7. **Atomic decrement** — `coupon_available` race: 2 concurrent BOGO orders both pass `> 0` check, both honored, counter goes to `-1`. Use `findOneAndUpdate({ _id, coupon_available: { $gt: 0 } }, { $inc: { coupon_available: -1 } })` in `handleCouponUsage` — if no doc returned, recompute path rejects the coupon. Pre-existing bug, surface via BOGO marketing flash.

**MEDIUM absorbed (in-scope):**
- **M3 campaign-stacking guard** — when picking BOGO target line, skip lines where `product_unit_final_price <= 0` (campaign already brought to zero). Otherwise BOGO discount = 0 silently.
- **N1 `min: 1` validators** on `bogo_buy_qty` and `bogo_get_qty`.

**MEDIUM deferred (out of scope, document only):**
- M2 specific-product scope semantics — default behavior = scope to `coupon_specific_product` if set, else whole cart. Document, no separate config.
- M4 refund accounting — store `bogo_discount_line_product_id` snapshot OK to defer (operations can grep order line snapshot for now).

**Acceptance:**
- Admin creates BOGO (buy 2 get 1 free, 100% off cheapest, all products) → saves OK
- Anonymous customer adds 3 items (৳300/৳200/৳100), applies BOGO code → cart shows ৳100 discount → places order → BE order has `discount_amount: 100`, `coupon_id` set
- 2 concurrent orders racing `coupon_available: 1` → one wins, one rejected with clear error
- BOGO on campaign-discounted-to-zero line → skipped, BOGO targets next-cheapest non-zero line

---

### **H — Auth hardening (revised after audit)** 🟡 small-medium (~3-4h, wave 1 contract unchanged)

(a) Admin FE — new ForgotPassword page (~2-3h)
(b) Backend bug fixes (~1h, found by auditor)

Full contract in prior section, no wave-2 changes.

---

### **C13 — Shop toggles (EXPANDED, Tier A+B, ~8-10h, was 5-7h)** 🟡

**Audit findings absorbed: 3 BLOCKERS + 4 HIGH + 4 MEDIUM**

**Owner D-locks for C13: D5 12 toggles, D8 maintain_stock = skip guard AND decrement.**

**Tier A — Storefront essentials (7):**

| # | Toggle | Default | Behaviour |
|---|---|---|---|
| 1 | `maintain_stock` | true | OFF (D8) → BOTH stock guard AND decrement skipped at order placement. Stock field becomes display-only. |
| 2 | `show_sold_count` | true | OFF → "৫৩ জন কিনেছে" badge hidden on PDP |
| 3 | `show_email_field_checkout` | true | OFF → email input removed from checkout |
| 4 | `enable_promo_at_checkout` | true | OFF → coupon input removed from checkout |
| 5 | `verify_phone_on_order` | **false** | ON → order placement requires OTP-verified phone (extra step in checkout). Default OFF preserves anonymous-checkout rule |
| 6 | `allow_image_download` | false | ON → no right-click protection; OFF → `onContextMenu={preventDefault}`. Admin help text: "Prevents casual right-click save; does not prevent network-level download." |
| 7 | `min_order_amount` | 0 | > 0 → orders below this rejected with "Minimum order ৳N" (server-side enforcement is the only real guard) |

**Tier B — High-value additions (5 toggles, 6 fields):**

| # | Toggle | Default | Behaviour |
|---|---|---|---|
| 8 | `show_stock_count_on_pdp` | false | ON → "শুধু ৩টা বাকি" badge on PDP (urgency) |
| 9 | `hide_out_of_stock_products` | false | ON → out-of-stock products excluded from listing aggregations (server-side enforcement in `productFilter.services.ts`, NOT client query param) |
| 10 | `enable_whatsapp_chat` | false | ON → floating WhatsApp icon on storefront. **Component must be CLIENT-rendered** (read via `useGetSettingData`) to avoid 600s SSR cache. |
| 11 | `whatsapp_number` | "" | Paired with toggle 10 (the actual number) |
| 12 | `enable_reviews` | true | OFF → product review feature hidden (PDP section + form + listing) |
| 13 | `auto_approve_reviews` | false | ON → customer review goes live immediately; OFF → admin moderation queue |

**BLOCKER fixes (must do as part of C13):**

1. **`updateSettingServices` `$set` fix** — ✅ DONE in C12 session 25. Now uses `$set: patch` with `_id`/timestamps stripped + secret-fields-with-empty-incoming stripped. C13 inherits this — just verify the new 13 toggle fields survive a cross-tab save.

2. **`review.model.ts` + `review.interface.ts` enum add `"pending"`** — `auto_approve_reviews: false` sets `review_status: "pending"` but enum is `["active", "in-active"]` only. Without this, every review POST when `auto_approve_reviews: false` crashes Mongoose validation → 500. Plus update `findAllReviewServices` to keep `review_status: "active"` filter (already correct).

3. **`postReview` controller must STRIP client-sent `review_status`** — FE `ToBeReviewedTab.jsx:41` hardcodes `formData.append("review_status", "active")`. Toggle is dead unless BE controller overrides: `requestData.review_status = settings.auto_approve_reviews ? "active" : "pending"`. Delete the client-provided value first.

**HIGH fixes (must do as part of C13):**

4. **`hide_out_of_stock_products` enforced server-side, not via query param** — read setting in `productFilter.services.ts` at top of aggregation builder. If toggle ON, unconditionally append `{ effective_stock: { $gt: 0 } }` to match, overriding client `availability` param. Prevents API bypass.

5. **`maintain_stock: false` (D8) skips BOTH paths** — `order.controller.ts` reads toggle. If `false`: skip `decrementStockForLines` entirely (no guard call, no decrement). Stock fields stay frozen.

6. **`min_order_amount` server check FIRST in `postOrder`** — before `findOrCreateUser` + `recomputeOrderTotals`. Returns 400 without DB writes.

7. **Add Admin moderation queue page (`/reviews/pending` or filter tab)** — `auto_approve_reviews: false` is useless without an approve/reject UI for the pending items. Filter existing admin Review page by `review_status: "pending"` + show Approve/Reject buttons that PATCH status to active/in-active. Adds ~1-2h to C13.

**MEDIUM absorbed (in-scope):**
- **M9 OTP-verify state machine for `verify_phone_on_order`** — dedicated sub-contract: phone-input → "Send OTP" button → OTP modal pauses checkout submit → on-verify unlocks submit → cancel resets. Adds ~1h.
- **M11 fresh-DB undefined handling** — new `StorefrontBehaviourTab.jsx` must use `data?.field ?? defaultValue` for all 13 fields (no `data.field`).
- **N14 watsapp typo guard** — existing misspelled `watsapp` field stays untouched; new `whatsapp_number` is separate. Document.

**Contract — BE:**
- Add 13 fields to `setting.interface.ts` + `setting.model.ts` with defaults from table
- `updateSettingServices`: `$set` fix (BLOCKER 1)
- `review.model.ts` + `review.interface.ts`: `"pending"` enum (BLOCKER 2)
- `review.controller.ts`: strip+override `review_status` per toggle (BLOCKER 3)
- `order.controller.ts`: `min_order_amount` guard (first), `maintain_stock` skip-both branch, `verify_phone_on_order` rejection
- `productFilter.services.ts`: `hide_out_of_stock_products` server-side filter

**Contract — Admin:**
- New "Storefront Behaviour" tab in Site Settings
- 13 toggle switches grouped: Stock & Inventory (3) / Checkout (3) / PDP (2) / Customer Support (2) / Reviews (2) / Limits (1)
- Help text per toggle. `allow_image_download` help text: "Prevents casual right-click save only"
- WhatsApp number field visible only when `enable_whatsapp_chat: true`
- **NEW page: Pending Reviews moderation queue** (or tab on existing Reviews page)
- Read all settings via `data?.field ?? default` (M11)

**Contract — FE:**
- `getSettingData.js` already pulls full doc; FE reads new fields directly
- PDP: `show_sold_count` + `show_stock_count_on_pdp` gates
- Checkout: `show_email_field_checkout` + `enable_promo_at_checkout` gates
- Checkout: `verify_phone_on_order: true` → OTP state machine sub-contract (M9)
- Checkout: `min_order_amount` client-side hint + server-side enforcement
- Listing: client-side `hide_out_of_stock_products` is a no-op (server already filters)
- Image components: `onContextMenu` handler reading `allow_image_download`
- **Floating WhatsApp button = CLIENT component** (`"use client"`, `useGetSettingData`) — NOT server-rendered in layout (avoids 600s SSR cache)
- PDP review section + form: `enable_reviews` gate

**Acceptance:**
- All 13 toggles round-trip via Admin save → /setting GET → storefront behaviour change
- **Clobber test:** save Storefront Behaviour tab, then save unrelated tab → toggles still present (validates BLOCKER 1)
- **Review gate:** `auto_approve_reviews: false` → customer review → not visible on PDP → admin moderation queue shows pending → admin approves → visible
- Anonymous checkout still works when `verify_phone_on_order: false`
- `verify_phone_on_order: true` → anonymous customer OTP flow → order succeeds
- `maintain_stock: false` → order on 0-stock product succeeds, stock field unchanged
- `min_order_amount: 500` → subtotal 400 returns 400 BEFORE any DB write
- DevTools bypass on `min_order_amount` and `hide_out_of_stock_products` → still enforced server-side

---

### **E20 — Dashboard widgets full set** 🟢 medium (~6-7h, was 4-5h)

**Audit findings absorbed: 2 BLOCKERS + 4 HIGH + 3 MEDIUM**

**Owner D-locks for E20: D9 BST timezone, D12 new `dashboard_show` flag.**

**Surprise:** Audit found `/dashboard` route has **zero auth** today — anonymous can curl all stats including revenue. This is a pre-existing bug E20 must fix.

**BLOCKER fixes (must do as part of E20):**

1. **Add `verifyToken("dashboard_show")` to ALL 3 dashboard routes** (existing `/dashboard` + 2 new widget routes). Per D12, new `dashboard_show` flag via 4-point sync:
   - `role.interface.ts` — add `dashboard_show: boolean`
   - `role.model.ts` — `default: false` (existing super admin's role doc needs migration or manual flag tick)
   - `permissionData.js` — new group entry
   - `dashboard.routes.ts` — wrap all 3 routes
   - Admin Dashboard page route in `Route.jsx` — wrap with permission check, redirect to `/profile` (or first allowed page) if missing

2. **Add compound index `{ createdAt: -1, order_status: 1 }` on `orders` collection** — period selector + status filter aggregation will full-scan without this. Add as a migration script + Mongoose schema-level `.index()`.

**HIGH fixes (must do as part of E20):**

3. **Top-selling widget: clarify per-period vs lifetime** — `product.sold_count` is lifetime cumulative. Period selector cannot affect it. Decision: **aggregate `orderproducts` collection with `$lookup` to orders for date filter** (accurate per-period) — heavier but matches user expectation that "last 7 days" actually means 7 days.

4. **Revenue aggregations filter `order_status: { $nin: ["cancel", "return"] }`** — not just `$ne: "cancel"`. Returns also exclude from revenue.

5. **Delete hardcoded dummy `salesData` (line 89) + `orderStatusData` (line 99) from `DashBoard.jsx`** — current production dashboard renders these as real-looking charts. E20 rewrite must explicitly purge them.

6. **BST midnight for "today" (D9)** — compute start-of-day as `Asia/Dhaka` not server UTC. Use `new Date(new Date().toLocaleString('en-US', {timeZone:'Asia/Dhaka'}))` or fixed UTC+6 offset. Document in widget contracts.

**MEDIUM absorbed (in-scope):**
- **M7 QueryClient `staleTime: 60_000`** on dashboard queries — prevents 50 full-aggregation runs per day when owner refocuses tab.
- **M9 Low-stock widget reuses existing `/product/low_stock` endpoint** with `product_show` gate intact (not a separate new endpoint).

**Contract — BE:**
- New `dashboard_show` flag (4-point sync per BLOCKER 1)
- Wrap `dashboard.routes.ts` with `verifyToken("dashboard_show")`
- 2 new endpoints: `/dashboard/widgets/top-selling` (aggregate `orderproducts` + `$lookup`) + `/dashboard/widgets/orders-by-status` (aggregate `orders` group-by status)
- BST timezone helper for date boundaries
- Compound index on `orders.{createdAt, order_status}`
- Migration script: tick `dashboard_show: true` on existing super admin role doc

**Contract — Admin:**
- Rewrite `DashBoard.jsx`: delete hardcoded arrays (HIGH 5), grid of 5 widgets, period selector (7/30/90)
- Widget queries with `staleTime: 60_000`
- Hide dashboard nav link when admin lacks `dashboard_show`

**Acceptance:**
- Anonymous `curl GET /api/v1/dashboard` → 401 (validates BLOCKER 1)
- Logged-in super admin → dashboard loads, all 5 widgets show real data
- Logged-in limited admin without `dashboard_show` → redirected away from `/`, no revenue numbers visible
- Period selector switches (7/30/90) → all widgets reflect period
- Order placed at 11:50 PM BST → appears in "today" revenue (validates D9)
- Cancelled/returned orders excluded from revenue chart
- No dummy "Jan: 4200" data anywhere

---

### **D18 — Admin "Create Order" POS** 🟢 medium-large (~8-10h, was 6-8h)

**Audit findings absorbed: 3 BLOCKERS + 4 HIGH + 5 MEDIUM**

**Owner D-locks for D18: D10 skip CAPI + SMS, D11 manual discount only (no coupons).**

**BLOCKER fixes (must do as part of D18):**

1. **New permission flag `order_create_admin` — 4-point sync** (CLAUDE.md pattern):
   - `role.interface.ts` — add boolean
   - `role.model.ts` — `default: false`
   - `permissionData.js` — new group entry under Order section
   - `order.routes.ts` — apply `verifyToken("order_create_admin")` on new POST endpoint
   - Admin sidebar + page gate via permission check

2. **`findOrCreateUser` + `userUpdate` block overwrites returning customer's address** — `order.controller.ts` lines 292-300 unconditionally writes `user_division: billing_city`, `user_district: billing_state` to the user doc. POS-typed address (walk-in's temp address) overwrites the customer's saved address. Fix: in POS branch (`order_source === "admin"`), SKIP the `userUpdate` block entirely. Optionally: also gate by `user_created === true` (only update address for brand-new ghost users).

3. **Pathao zone fields cannot be `required: true` for POS orders** — `order.model.ts` lines for `pathao_city_id`, `pathao_zone_id`, `pathao_city_name`, `pathao_zone_name` are required. POS walk-in/pickup has no Pathao zone. Fix: make all 4 optional (or `default: 0` / `""`). Verify `postOrderServices` doesn't also server-validate.

**HIGH fixes (must do as part of D18):**

4. **Skip Meta/TikTok CAPI for admin-source orders (D10)** — gate `sendMetaEvent("Purchase", ...)` (lines 311-363) + `sendTikTokEvent` calls with `if (order_source !== "admin")`. Apply to both `postOrder` and `postSingleOrder`.

5. **Skip SMS for admin-source orders (D10)** — gate `sendSMS` block (lines 366-385) with same `order_source !== "admin"` check. Apply to both placement functions.

6. **Manual discount field (D11)** — add `admin_manual_discount: { type: Number, default: 0 }` to order schema. In `recomputeOrderTotals` for admin-source orders: skip coupon path entirely, subtract `admin_manual_discount` from total. Admin form has discount input + reason field (audit trail). Coupon system untouched.

7. **`maintain_stock` interaction (C13 D8)** — POS orders respect `maintain_stock` setting. If admin needs stock bypass for an OOS sale, the toggle is the path. Don't add a per-order stock-skip. Document this so D18 + C13 interaction is clear.

**MEDIUM absorbed (in-scope):**
- **M1 shipping cost for pickup** — POS form includes "Delivery type" radio: `delivery` (pick division/zone) / `pickup` (shipping_cost = 0, billing_state ignored).
- **M3 add `order_source` to `orderSearchableField`** + dedicated "POS Orders" filter tab on existing OrderPage. Adds visibility without separate page.
- **M5 field-name swap warning** — POS form labels match BE field swap (`user_division` ← `billing_city`, `user_district` ← `billing_state`). Document in form code.

**MEDIUM deferred (document only):**
- **M2 stock race on last unit** — atomic decrement already exists; admin sees 409 if customer beats them. Acceptable.
- **M4 loyalty points on ghost user** — earnOnOrder unconditionally — accept default (points stay on ghost user, redeemable if they later register).

**Contract — BE:**
- New `order_create_admin` flag (4-point sync per BLOCKER 1)
- Schema add: `order_source` enum, `admin_manual_discount` number, `admin_created_by` ObjectId ref User, `manual_discount_reason` string
- Pathao zone fields → optional (BLOCKER 3)
- `postOrder` branches: if `order_source === "admin"` → skip userUpdate, skip CAPI, skip SMS, use manual_discount path
- Add `order_source` to `orderSearchableField`

**Contract — Admin:**
- New `/order/create` page with permission gate (`order_create_admin`)
- Customer picker (existing UserModel search) or "Walk-in" → guest record
- Delivery type radio (delivery/pickup)
- Product picker with variation support
- Manual discount + reason fields
- Reuses recompute display (sub_total + shipping + manual_discount = grand_total)
- OrderPage gets "POS Orders" filter tab

**Acceptance:**
- Super admin places POS order with 2 items, manual ৳50 discount, walk-in pickup → order created, `order_source: "admin"`, `admin_manual_discount: 50`, `admin_created_by: <admin id>`
- No Meta event fired (verify network tab or pixel debug)
- No SMS sent
- Returning customer's saved user address NOT overwritten in DB after POS order with different billing address
- Limited admin without `order_create_admin` → no sidebar link, direct POST returns 403
- POS Orders tab on OrderPage filters by `order_source: "admin"`
- POS order in `maintain_stock: true` mode hits 0-stock product → 409 (admin must flip toggle if needed)

---

## Cross-cutting checklist (per [[cross-doc-sync-rule]])

After each item:
- [ ] Add test scenarios to `.claude/work/OWNER_TEST_STATUS.md` P2 section
- [ ] Update relevant backlog docs with ✅ + commit hash (NEXT_PHASES, CLONE_NOW_FIXES, BACKEND_AUDIT, this doc)
- [ ] Update relevant memories
- [ ] Commit on `v2` (NO remote push without explicit deploy command)

After Sprint 2 complete:
- [ ] Update OWNER_TEST_STATUS Summary table
- [ ] Update current-status-handoff
- [ ] Owner runs full P1+P2+P4 smoke test
- [ ] Single batch merge `v2` → `main` per repo on owner's "deploy" command
- [ ] Post-deploy: permission flag ticks (`dashboard_show` + `order_create_admin`) + analytics token paste + migration scripts (orders index)

---

## Execution order

```
Day 1 AM — C12 (SMS settings + 2 BLOCKERS + 3 HIGH)
Day 1 PM — Item 5 verify (test doc only)
Day 2 — D15 (Wishlist fix + complete)
Day 3 — 11β (BOGO + 3 BLOCKERS + 4 HIGH)
Day 4 AM — H (Auth: Admin FE page + 3 BE bug fixes)
Day 4 PM — C13 BE (settings $set fix + review enum + controller override + 13 schema fields + order gates)
Day 5 — C13 Admin (Storefront Behaviour tab + Pending Reviews queue)
Day 6 — C13 FE (PDP/checkout/listing gates + WhatsApp client component + OTP state machine)
Day 7 AM — E20 (dashboard_show flag + auth + index + widgets + delete dummy arrays)
Day 7 PM + Day 8 — D18 (POS: order_create_admin flag + schema + POS page + CAPI/SMS skip + manual discount)
```

Day numbers nominal; actual cadence = owner's available time. Audit absorption pushed Sprint 2 estimate from ~35-48h to **~40-55h**.

---

## Out of scope (deferred to future sprints)

- **H1 Home redesign** → [CLIENT_SPRINT_3.md](CLIENT_SPRINT_3.md)
- **D16 Payment full E2E** — client wants COD-only this update
- **11δ Offer-in-normal-cart** — bigger feature, separate sprint
- **11γ Combo product** — full new feature, separate sprint
- **Item 4 Floating images** — BLOCKED on owner sketch
- **Items 6, 7, 9, 12** — Admin 2.0 rebuild (parked in [[admin-2-rebuild-backlog]])
- **Backend J Inventory/Purchasing** — only if client requests
- **Backend K RBAC refactor** — optional, current flag system works
- **C13 Tier C 3 operational toggles** (site_under_maintenance / block_search_indexing / order_cancel_window_hours) — defer to a small followup if owner needs
- **11β BOGO refund accounting (M4)** — store `bogo_discount_line_product_id` snapshot deferred; operations can grep order line for now
- **D18 POS loyalty point semantics (M4)** — earn-on-ghost accepted as default; revisit if owner reports confusion

---

## Resume notes for next session

**Sprint 2 starts at Day 1 AM — C12.** Bucket 0 already shipped (commits `00de5da` + `0bcf174`).

All 7 D-locks (D6-D12) locked 2026-06-05 post-audit. Plan ready for code execution.

OWNER_TEST_STATUS will gain ~30 new scenarios as items ship (~7 per item average × 5 audited items + existing wishlist/auth scenarios from wave 1).
