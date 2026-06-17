# Backend Deep Audit (logic-level) — findings — 2026-06-16

Module-by-module deep-read (controller+service+model, not just routes) vs docs/backend.md, run by 4 parallel agents. This file collects RAW findings; doc-fixes + bug-tickets are applied/tracked separately.

Legend: ❌ DOC WRONG · ⚠️ DOC MISSING · 🐛 REAL CODE BUG/SMELL · ✅ confirmed.

---

## 🐛 REAL CODE BUGS found (not doc — owner action)

> **FIX STATUS (2026-06-17, FINAL):** ✅ ALL 9 code bugs FIXED + committed to `dev` (BE `bf4cc0b`) — B1 warehouse 403, B2 getme IDOR/double-hash, B3 coupon dead-code, B5 flashsale default, B7 campaign allowlist, Pathao bulk 0.5kg, B6 abandonedCart comment, B8 cron UTC, pathaoStatusMap dedup. ⏸ **DEFERRED by owner (not a bug)** — B4 offer min-qty gate = display-only for now (wire BE+FE+edge-audit only if a client needs real "buy N save"). Steadfast env = doc-fixed only (code names `STEADFAST_API_KEY`/`STEADFAST_SECRET_KEY` are correct as-is). All tsc 0. App repos `dev` ahead of `main` — waiting on deploy.

1. ✅ **FIXED — Pathao bulk-send 0.5kg.** Now computes weight from `variation_weight_grams` (mirrors single-send; 500g fallback, 0.5kg floor) in the bulk loop.

2. **Steadfast env var names** — `STEADFAST_API_KEY`/`STEADFAST_SECRET_KEY` is what the code reads; docs FIXED to match. (Code names unchanged — correct as-is.)

3. ✅ **FIXED — `pathaoStatusMap` dedup.** Webhook controller now imports the single map from `pathao.service.ts` (no second copy).

4. **(smell) `order.stock.ts` only decrements legacy `product_quantity`/`variation_quantity`**, not the new `combination` engine (self-noted `:16-18`). Known limitation.

5. **(smell) flashsale `findActiveFlashMapForProducts`** (`flashsale.services.ts:67-69`) uses uncorrelated `$in` + `products.active:true` array match (Mongo doesn't correlate same element). Harmless due to in-loop guard, but semantically wrong filter.

---

## AGENT 1 — Core / Pricing / Order (DONE)

### product pricing (`product.price.resolver.ts`)
- ❌ `backend.md:510` price-priority chain is misleading. Real model = **two-stage**: resolver does base/variation→flash (`resolver:60-125`); campaign/tier/customer-group/offer/coupon/loyalty/vat applied later in `order.recompute.ts:318-381` as override/best-wins, NOT a single strict chain. Campaign computed off `unit_regular` → last-writer-wins.
- ⚠️ Dual variation pricing model: legacy absolute (`variation_price`/`variation_discount_price`) vs new `variation_price_delta` (added to base) — `resolver:75-94`. Doc omits.
- ⚠️ flash `fixed`=absolute target price, `percent`=% off (`resolver:106-114`). Undocumented.

### variation (`variation.interface.ts`/`model.ts`)
- ⚠️ Doc interface omits: `variation_price_delta`, `combination[]`, `is_active`, `variation_images[]`/`_keys[]`, `variation_badge_icon_key`, `variation_barcode_format`, `warehouse_id`. Sparse-unique indexes on sku+barcode (`model:127-128`).
- ✅ `variation_weight_grams` documented + real.

### order recompute / placement (`order.recompute.ts`, `order.controller.ts`)
- ❌ Shipping IS server-recomputed (`recomputeShippingCost`, `recompute:144-212`, called `:525`) — zone-aware, per-line, per-product modes, free-delivery rule. Doc says "totals calculate (sub+shipping−discount)" implying client-trusted shipping. **Real tamper-protection doc misses.**
- ❌ grand_total formula incomplete: actual `grand = sub − discount + vat + shipping` (`recompute:591-592`); doc (`backend.md:1414`) omits VAT.
- ⚠️ **Server price authority** — `recomputeOrderTotals` OVERWRITES all client prices, never trusts client (`recompute:1-13`, `controller:242-247`). Single most important rule, not stated.
- ⚠️ VAT layer (Phase H): per-line `vat_percentage_override` > `settings.vat_percentage`, on net-after-discount (`recompute:572-589`). order-level `vat_amount` (`order.interface.ts:101`) missing from doc interface.
- ⚠️ Loyalty redeem at checkout: `loyalty_redeem_points/_amount` clamped→discount (`recompute:527-570`).
- ⚠️ Advance/partial payment (Phase C3): `advance_amount/_method`, min-percent gate, gateway init (`recompute:594-629`). Whole Phase-C payment block in `order.interface.ts:79-96` undocumented (`payment_method/status`, `transaction_id`, `paid_amount/at`, `payment_meta`).
- ⚠️ Pre-write gates: `min_order_amount`, `verify_phone_on_order` (`controller:217-236`).
- ⚠️ `maintain_stock:false` (pre-order/MTO) bypasses stock guard+decrement (`controller:310-313`).
- ⚠️ POS `postAdminOrder` rules: forced `order_source:"admin"`, admin shipping survives recompute (`:1266-1272`), `admin_manual_discount` replaces coupon (`:1276-1279`), no Meta/SMS (`:1347-1354`), pickup→shipping 0. Interface omits `order_source`, `admin_manual_discount`, `admin_created_by`, `manual_discount_reason`, `payment_method_note`.
- ❌ discount_source enum: code = `offer|campaign|flash_sale|coupon|manual|none` (`recompute:70-76`). Doc (`backend.md:689`) says `flash|campaign|offer|none` — wrong (`flash_sale` not `flash`; missing coupon/manual).
- ⚠️ Coupon BOGO in recompute: percent (capped), fixed, AND bogo (buy-N-get-M-cheapest-%off, anon-allowed) `recompute:464-514` + atomic coupon-stock decrement (`controller:195-201`).
- ⚠️ Offer/coupon +1-day grace window (`now <= end + 86400000`, `recompute:262, 439`).

### order stock (`order.stock.ts`)
- ⚠️ Whole B2 model undocumented: **atomic conditional decrement** (`updateOne` qty`$gte` → 409 if `modifiedCount===0`, never negative, `:39-86`); decrement at PLACEMENT; idempotent restock on cancel/return via `stock_restored` flag (`:93-134`); `bumpSoldCounts` (`:142-154`). `order.interface.ts:70` `stock_restored` not in doc.
- ✅ Oversell guard genuinely atomic + transaction-bound.

### courier (`pathao.service.ts`, `steadfast.service.ts`)
- ❌ Steadfast env vars wrong in doc (see bug #2).
- ⚠️ `PATHAO_STORE_ID` env required (`pathao.service.ts:167,290`) — not in doc env list.
- 🐛 Pathao bulk-send 0.5kg (bug #1).
- ⚠️ Pathao token cache: 5-min margin, `expires_in` fallback 3600, **401→cache bust** (`:25-44,231-234,...`).
- ⚠️ Status maps undocumented: Pathao `On Hold/Hold→shipped`, `Partial Delivery→delivered`, `Partially Returned→return` (`:57-87`); Steadfast `pending/hold→shipped` (`webhook.controller.ts:9-21`).
- ⚠️ Send guards: block re-send if consignment exists or status processing/shipped/delivered; Pathao needs city+zone; send sets `processing`; Pathao cancel only while `pathao_status==="Pending"`.

### webhook (`pathao.webhook.controller.ts`, `webhook.controller.ts`)
- ❌ `backend.md:737` "no auth — public endpoint" is WRONG + contradicts own GATE-0 note (`:669`). Real: Pathao HMAC-SHA256 fail-closed when secret set (`:48-93`); Steadfast `?token=`/header secret, 401 on mismatch (`:29-45`).
- ❌ Steadfast webhook returns **200 always** (stop retries) + **401** on bad secret (`webhook.controller.ts:43,58,132,139`). Doc implies only Pathao needs 202.
- ⚠️ Both call `restockOrder` on cancel/return; event filtering (Pathao skips `webhook_integration`/`order.created`; Steadfast `delivery_status` vs `tracking_update`).

### productFilter (`product.filter.services.ts`)
- ⚠️ Variation-aware `effective_price` (cheapest active variation "from ৳X") + `effective_stock` (sum active variation stock) `:373-413`. The module's core, undocumented.
- ⚠️ `hide_out_of_stock_products` forces in-stock-only (`:284-299`); per-attribute `show_in_filter` (`:93-103`); facets UNION category `default_filter_attributes` parent-inherited (`:126-174`).
- ⚠️ Attribute match: within-attr OR, across-attr AND vs `product_attributes` (`:304-318`). `specifications` facet key = deprecated alias of `attributes` (`:235`).

---

## 🔴 REAL CODE BUGS / SECURITY (verified) — owner action

- **B1. warehouse CRUD permanently 403 (BLOCKER).** ✅ **FIXED 2026-06-16.** Routes required `verifyToken("setting_update"/"setting_show")` — flags absent from `role.model.ts` → always 403. Repointed all 4 to existing `site_setting_update` (`warehouse.routes.ts`); `/default` left public. tsc 0.
- **B2. getme IDOR.** ✅ **FIXED 2026-06-16.** `PATCH /get_me/` had no middleware → admin `updateUser` by body `_id` (any caller edits any user) + FE echoes hashed `user_password` back → double-hash lockout risk. Added `verifyUserToken` + new `updateMyProfile` controller: updates **only `req.user.id`**, strict allowlist (name/image/image_key/additional_phone/gender/country/division/district/address) — no _id/role/status/wallet/loyalty/verified/phone/password. `GET /dashboard_data` now `verifyUserToken` + `req.user.id` (was unauthed `?user_id=` query). FE compatible (sends `credentials:include`; stale query param ignored). tsc 0.
- **B3. coupon per-person cap dead code at `/check_coupon`.** ✅ **FIXED 2026-06-17** — `result?.coupon_id` (undefined) → `result?._id`. tsc 0.
- **B4. offer `offer_product_quantity` never enforced** as a bundle qualifier. **DECIDED (2026-06-17): keep display-only** — owner's call; `offer_product_quantity` is a UI suggestion, discount applies at any qty. No code change. Documented in backend.md offer section. **FUTURE:** if a client wants a real "buy N save" gate, implement BE (min-qty check in `order.recompute.ts` offer branch) + FE (cart message "add X more for the deal") together, with edge-audit — it's a cross-app feature, not a bug.
- **B5. flashsale `status` defaults to `"active"`.** ✅ **FIXED** → `"in-active"`.
- **B6. abandonedCart recovery comment wrong** (says invoice_id, code uses phone). ✅ **FIXED** — comment corrected.
- **B7. campaign PATCH no field allowlist.** ✅ **FIXED** — `ALLOWED[]` allowlist added (mirrors updateCouponServices).
- **B8. cron "23:55 UTC" was server-LOCAL.** ✅ **FIXED** — `cron.schedule(..., { timezone: "UTC" })`.
- **Pathao bulk-send 0.5kg + pathaoStatusMap dup** — ✅ **FIXED** (see top section).

> ✅ **2026-06-16 — ALL doc-fixable findings below applied to `docs/backend.md`** (factual errors corrected + missing logic/schema added: server price authority, atomic stock, VAT/loyalty/advance/POS, auth chapter, courier maps, coupon BOGO math, payment gateways, fraud thresholds, cart Math.max, attribute/variation/order/user/admin/review schema fields, is_demo note). Remaining 🐛 B3–B8 are CODE bugs = owner tickets (not doc).

## 🟡 DOC FACTUAL ERRORS to fix in backend.md (from agents 2/3/4)

- ❌ **`specification_*` flags NOT removed** — still in `role.model.ts:67-82` + interface. My earlier backend.md edit said "flag বাদ" — WRONG. They're dead/orphan flags but still present. Fix doc.
- ❌ **Steadfast env vars** `STEADFAST_CLIENT_ID/PASSWORD` → real `STEADFAST_API_KEY/SECRET_KEY` (deploy-breaking).
- ❌ **`PATHAO_STORE_ID`** env required, undocumented.
- ❌ **webhook "no auth — public"** (`backend.md:737`) → HMAC/secret now (contradicts own GATE-0 note).
- ❌ **coupon_type** missing `"bogo"` (3rd type shipped).
- ❌ **theme typography** doc inverted — real = two-font (`heading_font`+`body_font`); `style` is deprecated/dead. `asset_key` is REQUIRED not optional. "Sub_category default_theme_id" → now on `categories`.
- ❌ **attribute schema** missing `display_type`, `tracks_weight`, `weight_grams_value` (feature-bearing).
- ❌ **discount_source enum** `flash` → `flash_sale`; missing `coupon`/`manual`.
- ❌ **grand_total formula** missing VAT + server-side shipping recompute.
- ❌ **cookie flags** doc says httpOnly only → real `httpOnly+secure+sameSite:none` + dual cookie (`fruit_snacks_token` access + `fruit_snacks_refresh` refresh).
- ❌ **Known-Issues #1/#2/#3** (role/supplier/paymentWithdraw) described as open but FIXED — contradicts doc's own later ✅ notes.

## ⚠️ BIG DOC-MISSING themes (add to backend.md)
- **Server price authority** — ALL discount math (coupon/campaign/offer/flash/BOGO/loyalty/VAT/shipping) recomputed server-side in `order.recompute.ts`; client prices never trusted. Per-module pages mislead.
- **B2 atomic stock** (conditional `$gte` decrement, 409 oversell, placement-time, idempotent restock via `stock_restored`).
- **VAT layer, loyalty-redeem, advance/partial payment (Phase C3), POS/admin-order rules, min_order/verify_phone gates, maintain_stock:false pre-order bypass.**
- **Auth chapter:** dual-cookie, refresh cookie name, token lifetimes (admin 7d/user 30d/refresh 90d), `kind`/`who` anti-misuse, OTP hardening (6-digit, bcrypt, 60s cooldown, 5-attempt cap).
- **Schema gaps:** user (`user_email`, `customer_group`, `loyalty_points`, `addresses[]`, otp fields), admin (`admin_email`), review (`is_seeded`, `source`, `reviewer_name`, `"pending"` status), variation (`variation_price_delta`, `combination[]`, multi-image, `warehouse_id`), order (Phase C payment block, `order_source`, `admin_manual_discount`, `vat_amount`, `loyalty_redeem_*`, `advance_*`), newsletter (no interface block at all).
- **`is_demo` field** present on category/attribute/brand/banner/slider/theme — omitted from every doc interface (one global note suffices).
- **Cart merge = Math.max (not additive); PUT = full-array replace.**
- **Fraud:** real thresholds, 3-variant phone DB match, 20-order window, advisory/non-blocking.
- **Payment:** SSLCommerz amount-match guard + idempotency + fail-restock + gateway registry + env-sourced secrets.
- **category:** 6-featured / 3-explore caps; attribute delete 409-guard.
- **orphan `customer_*` flags** (exist, gate nothing).

## AGENT 2 — Commerce / Marketing — DONE (see consolidated above; full detail in transcript)
## AGENT 3 — Catalog / Theme / Config — DONE
## AGENT 4 — Auth / User / New — DONE
