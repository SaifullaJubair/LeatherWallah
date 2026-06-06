# S4 + S5 — Analytics Bundle Audit + Refactor (Phase 1) — FINAL LOCKED

> **Status:** ✅ Plan locked after `/edge-audit` pass + owner approval
> **Branch:** `v2`
> **Date:** 2026-06-05
> **Estimated effort:** ~21h (single focused sprint OR split 1A + 1B + 1C)
> **Owner decisions locked:** D1=A (geoip-lite, VPS 8GB RAM), D2=A (new permission flag), D3=B (strip all secrets), D4=A (full revised Phase 1)

---

## Goal

1. **Architecture (security):** Analytics IDs + CAPI secrets move from `.env` → DB (3-tier security model). Resale code becomes plug-and-play deploy. ALL settings secrets stripped from public response.
2. **Event quality (EMQ jump):** Meta Pixel + CAPI event match quality 5-6 → 7-8 via IP enrichment + name split + dedup guard + num_items fix + form-data pass-through + optional email collection + fbclid capture + test event code admin.
3. **Anonymous FB-ads flow:** **MUST stay untouched** (owner-locked constraint).

---

## Owner decisions locked

| ID | Question | Decision |
|----|----------|----------|
| D1 | VPS RAM enough for geoip-lite? | **A — geoip-lite (VPS 8GB RAM, plenty)** |
| D2 | CAPI tokens permission flag? | **A — new flag `setting_secrets_update`** |
| D3 | Secret-strip scope? | **B — strip ALL secrets (CAPI + SMS + email + courier)** |
| D4 | Final scope? | **A — full revised Phase 1 (~21h) with all blocker fixes** |

---

## Scope — full revised Phase 1 (~21h)

### A. DB-driven analytics IDs (3-tier security model) — ~7h

**Tier 1 — Public IDs (safe to leak, browser-side):**
- New settings fields: `meta_pixel_id`, `tiktok_pixel_id`, `gtm_id`, `ga4_id`, `clarity_id`, `google_verification_meta`
- Exposed via existing `/setting` public GET endpoint (already used by FE)
- Edit from Admin Site Settings → new **Analytics tab**
- Format validation hints in UI (Meta 15-16 digit, GTM `GTM-XXXXXX`, GA4 `G-XXXXXXXXXX`)

**Tier 2 — Secrets (NEVER leak):**
- New settings fields: `meta_capi_access_token`, `tiktok_capi_access_token`, `meta_test_event_code`, `tiktok_test_event_code`
- **D3 expansion:** strip ALL existing secrets too — `sms_api_key`, `sms_api_secret`, `email_password`, `pathao_password`, `pathao_client_secret`, `steadfast_api_secret`, `redx_api_key`
- Public `/setting` response stripped via `.select("-meta_capi_access_token -tiktok_capi_access_token -meta_test_event_code -tiktok_test_event_code -sms_api_key -sms_api_secret -email_password -pathao_password -pathao_client_secret -steadfast_api_secret -redx_api_key")`
- New route `GET /setting/secrets` guarded by `verifyToken("setting_secrets_update")` — returns full settings including secrets
- New route `PATCH /setting/secrets` guarded by `verifyToken("setting_secrets_update")` — accepts secret updates
- Admin UI: masked display `••••3a4f` (last 4 chars); "Update" reveals empty input; empty submit = no change
- **D2 new flag:** `setting_secrets_update` added to role.interface + role.model + permissionData.js + role assignment UI

**Tier 3 — Backend CAPI reads from DB:**
- `meta.pixel.service.ts`: reads `setting.meta_capi_access_token || process.env.META_ACCESS_TOKEN` (back-compat fallback)
- `tiktok.pixel.service.ts`: same pattern, `setting.tiktok_capi_access_token || process.env.TIKTOK_ACCESS_TOKEN`
- In-memory cache with 5min TTL to avoid DB hit per event
- Test event code read from settings: `setting.meta_test_event_code || process.env.META_TEST_EVENT_CODE`

**Files touched (BE):**
- `setting.interface.ts`, `setting.model.ts`, `setting.controllers.ts`, `setting.routes.ts`, `setting.services.ts`
- `meta.pixel.service.ts`, `tiktok.pixel.service.ts`
- `role.interface.ts`, `role.model.ts`

**Files touched (Admin):**
- Site Settings page: new **Analytics tab** (public IDs) + **Secrets section** (masked, admin-only)
- `permissionData.js` — add `setting_secrets_update` flag
- Role assignment UI auto-picks up new flag

**Files touched (FE):**
- `getSeoConfig.js` — read IDs from settings, fallback to env (back-compat)
- `/setting` query: `staleTime: 60_000` (H5 fix)

**Sub-tasks (audit + verify):**
- Enumerate ALL settings read paths backend-side (services, controllers, FE direct calls) — confirm `.select(-...)` applied EVERYWHERE
- Write a quick assertion script: hit public `/setting`, assert secret fields absent

---

### B. Event quality wins — ~8h (was 5.5h, +2.5h after edge-audit)

**B1. fn/ln name split — 30m**
- FE `AnalyticsAdvancedMatching.jsx`: split before passing to `fbq('init')` + `ttq.identify()`
- BE `meta.pixel.service.ts` + `tiktok.pixel.service.ts`: receive `fn` + `ln` separately, hash both

**B2. num_items sum quantities — 30m**
- `useAnalytics.js` trackPurchase: `num_items: order_products.reduce((s,p) => s + (p.quantity || 1), 0)`
- `useMetaPixel.js` trackPurchase: same

**B3. IP enrichment via geoip-lite — 1.5h** (D1 locked)
- `npm install geoip-lite` in backend
- Update `package.json` + run `geoip-lite-update` script in build
- `meta.pixel.controller.ts`: resolve `clientIp` → `geoip.lookup(ip)` → extract `city`, `region`, `country`
- Same in `tiktok.pixel.controller.ts`
- Hash `ct` (lowercase city), `st` (lowercase region), pass `country` as 2-letter ISO lowercase ("bd")
- Override priority enforced in CAPI service: form-derived > saved address > IP-derived
- Optional cron: monthly `geoip-lite` DB refresh

**B4. Form data flows to CAPI (B2 BLOCKER fix) — 30m**
- `AddToCart.jsx` trackInitiateCheckout: pass `ct: formData.customer_division`, `st: formData.customer_district`, `country: "bd"`, `zp: undefined`
- `AddToCart.jsx` trackPurchase: same + `em` if logged-in user has email
- ViewContent / AddToCart events on PDP: pass logged-in user's `user_division` / `user_district` from useUserInfoQuery → CAPI

**B5. InitiateCheckout value > 0 guard — 15m**
- `AddToCart.jsx:179-189`: `if (shopGrandTotals > 0)` before firing

**B6. Purchase dedup guard — 1.5h** (B3 BLOCKER expanded)
- FE `AddToCart.jsx`: `localStorage.purchased_order_ids` check before fire, append after fire (keep last 50)
- BE NEW: `order.meta_purchase_sent: boolean` field on order schema (server-side ultimate guard)
- BE `meta.pixel.service.ts` + `tiktok.pixel.service.ts`: if event is "Purchase" + `order_id` provided + `order.meta_purchase_sent === true` → skip; else set true after success
- FE passes `order_id` in custom_data so backend can correlate

**B7. fbclid URL capture — 30m** (H3 fix, pulled from Phase 2)
- New `useEffect` in `layout.js` OR new `FbclidCapture.jsx` component
- On mount: read `?fbclid=` URL param; if present, set `_fbc` cookie in Meta format: `fb.1.${Date.now()}.${fbclid}` (1-year expiry)
- Skip if `_fbc` cookie already present

**B8. Test Event Code admin toggle — 1h** (H4 fix, pulled from Phase 2)
- Settings model: `meta_test_event_code?: string`, `tiktok_test_event_code?: string` (stripped from public)
- Admin Settings → Analytics tab → Secrets section: input field per platform
- Backend CAPI services read from setting fallback to env (already in A spec)

**B9. CAPI error response handling — 30m**
- `meta.pixel.service.ts`: check `response.data.events_received` > 0, log to console + return `{ ok, accepted, rejected }`
- Same for TikTok
- Failed events logged with structured payload for future Phase 3 dashboard

**B10. TikTok CAPI parity — 1.5h**
- All Meta-side B1-B9 fixes applied to TikTok service mirror (already verified structure matches)

---

### C. Optional email collection — ~4h (was 3.5h, +30m for B2 + M3 + M4 fixes)

**Schema (M3 fix):**
- `user.interface.ts`: add `user_email?: string`
- `user.model.ts`: `user_email: { type: String, lowercase: true, trim: true, unique: true, sparse: true }` (unique-sparse from day 1)
- `order.interface.ts` + `order.model.ts`: add `customer_email?: string` (for guest orders, H1 fix)

**C1. Profile Setting page — 1h**
- `ShowProfileDetails.jsx`: add "Email (optional)" field
- Save via existing user update endpoint
- Hint: "We'll use this for order receipts and tracking links."
- Validation: email format check (regex), graceful unique-violation handling

**C2. Post-order email prompt — 2h** (was 1.5h, +30m for M4 token protection)
- New component on `/order-success/<id>` page
- Inline form: "Add your email for receipt + tracking" (skip-able, dismissible)
- Only renders when:
  - Logged-in user without `user_email`, OR
  - Guest order (no user_id) without `order.customer_email`
- New BE endpoints:
  - `PATCH /user/me/email` (logged-in, guarded by verifyUserToken)
  - `PATCH /order/:id/email` (guest-friendly, guarded by `email_update_token` short-lived 24h JWT)
- Order placement response now includes `email_update_token` for guest flow

**C3. Sign-up form optional email — 30m**
- Optional field, skip allowed
- Backend accepts empty/null gracefully, unique-sparse handles "no email" rows

**C4. Meta CAPI `em` field — 30m**
- FE `AnalyticsAdvancedMatching.jsx`: `em: userInfo?.data?.user_email` when present
- FE trackPurchase userData (logged-in + guest path): conditional email
- BE `meta.pixel.service.ts`: hash email same pattern as `ph`
- Conditional: `em: data.user_data?.em ? hashData(data.user_data.em.toLowerCase().trim()) : undefined`
- Same in `tiktok.pixel.service.ts`

**H1 guest→registered email merge:**
- On user registration via OTP, after phone-verify success:
  - Check `Order.find({ customer_phone: <phone>, customer_email: { $exists: true } })`
  - If any guest orders found with email → update new user doc with `user_email` (if not already set) + optionally backfill `user_id` on those orders
- Best-effort: phone-match more reliable than email-match in BD

**Explicit NOT in scope:**
- ❌ Checkout form email field — owner-locked anon FB-ads flow protection
- ❌ Email verification flow — out of scope
- ❌ Email-based login — out of scope, phone OTP stays primary
- ❌ Email marketing newsletter — separate feature

---

## Scope — what's STILL OUT (deferred to Phase 2/3)

- **content_category** field on ViewContent/AddToCart (product object populate audit needed)
- **event_source_url save on Purchase** (localStorage last PDP URL)
- **CAPI error logging dashboard** (new collection + admin widget)
- **DOB / gender** — schema field doesn't exist, future feature
- **`zp` (postal code)** — Bangladesh form doesn't collect, future
- **`_fruit_snacks_uid` per-tenant** — SaaS Phase 4+ concern
- **Pixel ID format validation** (Meta/GTM/GA4) — N3 nice-to-have, defer

---

## Files inventory (final)

**Backend (~14 files):**
- `setting.interface.ts`, `setting.model.ts`, `setting.controllers.ts`, `setting.routes.ts`, `setting.services.ts`
- `user.interface.ts`, `user.model.ts`, `user.controllers.ts`, `user.routes.ts`
- `order.interface.ts`, `order.model.ts`, `order.controller.ts` (post-order email endpoint + meta_purchase_sent flag)
- `meta.pixel.controller.ts`, `meta.pixel.service.ts`
- `tiktok.pixel.controller.ts`, `tiktok.pixel.service.ts`
- `role.interface.ts`, `role.model.ts`
- `authentication.controllers.ts` (registration merge guest orders)
- `package.json` (geoip-lite)
- Optional: `helpers/geoip.helper.ts` (centralize IP enrichment logic)

**Admin (~6 files):**
- Site Settings page (Analytics tab + Secrets section)
- `permissionData.js` (`setting_secrets_update` flag)
- Role permission UI auto-renders new flag
- User list/detail (optional email column display)

**Frontend (~10 files):**
- `getSeoConfig.js` (read IDs from settings)
- `useAnalytics.js` (fn/ln, num_items, form-data pass, dedup guard, em conditional)
- `useMetaPixel.js` (same fixes)
- `AnalyticsAdvancedMatching.jsx` (fn/ln split, em conditional)
- `metaServerEvent.js` (passthrough updates)
- `AddToCart.jsx` (Purchase dedup, InitiateCheckout guard, form-data pass)
- `ShowProfileDetails.jsx` (email field)
- `OrderSuccessPage` (post-order email prompt)
- `SignUp` form (optional email)
- New `FbclidCapture.jsx` OR `layout.js` useEffect

**Total files: ~30**

---

## Migration safety

- Existing clones with `.env` IDs: fallback chain `setting.x || process.env.X` ensures zero break
- Existing user docs without `user_email`: optional + sparse-unique, no migration needed
- Existing order docs without `customer_email`: optional, no migration needed
- Existing order docs without `meta_purchase_sent`: defaults `undefined` → treated as "not sent" → first event fires normally, subsequent guarded
- Existing settings docs without analytics ID fields: new fields default `undefined`, getSeoConfig fallback to env

---

## Anonymous FB-ads flow protection checklist (verify in /test)

- [ ] Checkout form NO email field added
- [ ] Checkout form NO new mandatory field added
- [ ] PDP → Add to Cart → Checkout → Place Order works WITHOUT login
- [ ] Anonymous user can still complete purchase using customer_name + customer_phone + division + district + address
- [ ] Meta Pixel events fire for anonymous user with IP-enriched ct/st/country (no PII leak)
- [ ] CAPI events fire for anonymous user — no auth required
- [ ] `_fruit_snacks_uid` anon cookie continues to work as external_id
- [ ] Post-order email prompt is OPTIONAL + skip-able for guest

---

## Deploy-day reminders (cumulative — add to current-status-handoff)

- After deploy: admin login → Site Settings → Analytics tab → set Pixel IDs / GTM / GA4 / Clarity / Google Verification
- Admin → Site Settings → Secrets section → set Meta CAPI Access Token + TikTok CAPI Access Token (admin-only with `setting_secrets_update` flag)
- Optional: set Test Event Code per platform for staging verification, blank for production
- After admin sets values: `.env` vars can stay as fallback or be removed
- `geoip-lite` npm install on production server (~50MB GeoIP DB download)
- Optional: configure cron to refresh GeoIP DB monthly
- Verify `setting_secrets_update` permission flag assigned to owner/superadmin role only — NOT to staff

---

## Phase split recommendation

Total 21h — owner can ship as **one PR per repo** (recommended) OR split:

**Option Single (recommended):** All 21h in one sprint
- 1 BE commit, 1 Admin commit, 1 FE commit
- Coupled enough that splitting creates more rework than splitting saves

**Option Split:**
- **Phase 1A (security, ~8h):** A + secret strip + permission flag + admin Secrets UI
- **Phase 1B (event quality, ~9h):** B1-B10
- **Phase 1C (email, ~4h):** C1-C4 + H1

Splits mean 3 PRs per repo = 9 PRs total। Probably overkill, single sprint better।

---

## NEXT SESSION START HERE

✅ PLAN locked
✅ Edge audit done (3 BLOCKERS + 6 HIGH fixed inline)
✅ Owner decisions recorded
✅ TikTok service architecture verified (mirrors Meta)

**Next action:** Start Phase 1A — BE settings schema + secrets routes + role flag → Admin Settings Analytics tab + Secrets section → Backend CAPI services switch to DB-driven (in-memory cached, env fallback).

Recommend order: BE schema → BE routes → BE services → Admin UI → FE getSeoConfig → FE event quality fixes → FE email collection → BE order endpoint for email → FE post-order prompt → build verification → test plan.
