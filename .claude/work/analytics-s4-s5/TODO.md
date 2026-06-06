# S4 + S5 — Analytics Phase 1 — TODO

> Status: PLAN locked, ready to code. Read [PLAN.md](./PLAN.md) first for full context + owner-locked decisions.
> Branch: `v2` (BE + Admin + FE all on v2)
> Estimated: ~21h end-to-end

---

## Phase 1A — Security architecture (~8h)

### BE — settings schema + routes

- [ ] `setting.interface.ts` — add 6 public ID fields + 4 secret fields (Meta/TikTok CAPI tokens + test event codes)
- [ ] `setting.model.ts` — same, with proper types
- [ ] `setting.services.ts` — public GET uses `.select("-meta_capi_access_token -tiktok_capi_access_token -meta_test_event_code -tiktok_test_event_code -sms_api_key -sms_api_secret -email_password -pathao_password -pathao_client_secret -steadfast_api_secret -redx_api_key")`
- [ ] `setting.controllers.ts` — new handlers `getSettingSecrets`, `updateSettingSecrets`
- [ ] `setting.routes.ts` — new `GET /setting/secrets` + `PATCH /setting/secrets` guarded by `verifyToken("setting_secrets_update")`
- [ ] `role.interface.ts` + `role.model.ts` — add `setting_secrets_update?: boolean`
- [ ] Enumerate ALL settings read paths backend-side (grep `SettingModel.findOne` / `findById`) — confirm select-strip applied EVERYWHERE OR clearly intentional (e.g., internal CAPI service reads full doc)
- [ ] Quick smoke assertion: hit public `/setting` after deploy, assert no secret fields present

### Admin — Settings UI

- [ ] `permissionData.js` — add `setting_secrets_update` flag
- [ ] Site Settings page — new **Analytics** tab with 6 public ID inputs
- [ ] Analytics tab — **Secrets section** (admin-only render, gated by user permission): masked display `••••3a4f`, "Update" button reveals empty input
- [ ] Secrets section: 4 fields (Meta CAPI token, TikTok CAPI token, Meta test event code, TikTok test event code)
- [ ] Save handler: empty input = no change; non-empty = replace

### BE — CAPI services switch to DB

- [ ] `meta.pixel.service.ts` — read `setting.meta_capi_access_token || process.env.META_ACCESS_TOKEN`; same for test event code
- [ ] `tiktok.pixel.service.ts` — same pattern, `setting.tiktok_capi_access_token || process.env.TIKTOK_ACCESS_TOKEN`
- [ ] Add in-memory cache for settings doc with 5min TTL (avoid DB hit per CAPI event)

### FE — getSeoConfig

- [ ] `getSeoConfig.js` — read IDs from settings, fallback to env
- [ ] FE `/setting` query: `staleTime: 60_000`

---

## Phase 1B — Event quality (~9h)

### Pixel + CAPI parity

- [ ] B1 — fn/ln split in `AnalyticsAdvancedMatching.jsx` + BE Meta + TikTok hash both
- [ ] B2 — num_items sum quantities in `useAnalytics.js` + `useMetaPixel.js` trackPurchase
- [ ] B3 — IP enrichment via geoip-lite:
  - [ ] `npm install geoip-lite` in backend
  - [ ] `meta.pixel.controller.ts` + `tiktok.pixel.controller.ts`: resolve IP → lookup → extract ct/st/country
  - [ ] Hash ct (lowercase), st (lowercase), pass country lowercase 2-letter
  - [ ] Override priority: form-derived > saved address > IP-derived
  - [ ] Consider centralizing in `helpers/geoip.helper.ts`
- [ ] B4 — Form data flows to CAPI:
  - [ ] `AddToCart.jsx` trackInitiateCheckout: ct/st/country from `formData.customer_division/district`
  - [ ] `AddToCart.jsx` trackPurchase: same + em from logged-in user
  - [ ] PDP ViewContent/AddToCart: pass logged-in user's `user_division`/`user_district` from useUserInfoQuery
- [ ] B5 — `AddToCart.jsx:179-189` — `if (shopGrandTotals > 0)` guard
- [ ] B6 — Purchase dedup guard:
  - [ ] FE localStorage `purchased_order_ids` check + append (last 50)
  - [ ] BE order model: `meta_purchase_sent?: boolean` field
  - [ ] BE CAPI services: if Purchase + order_id + already sent → skip; else set true after success
- [ ] B7 — fbclid URL capture: new `FbclidCapture.jsx` in layout.js, sets `_fbc` cookie in Meta format
- [ ] B8 — Test Event Code admin: settings field + Admin Secrets UI + BE service reads
- [ ] B9 — CAPI error response handling: check `events_received`, structured log
- [ ] B10 — TikTok parity: apply B1-B9 to TikTok service (mirrors Meta)

---

## Phase 1C — Optional email (~4h)

### Schema

- [ ] `user.interface.ts` — add `user_email?: string`
- [ ] `user.model.ts` — `user_email: { type: String, lowercase: true, trim: true, unique: true, sparse: true }`
- [ ] `order.interface.ts` + `order.model.ts` — add `customer_email?: string` (guest orders)

### Collection points

- [ ] C1 — `ShowProfileDetails.jsx`: optional email field + save handler
- [ ] C2 — Post-order email prompt:
  - [ ] New component on `/order-success/<id>` page
  - [ ] BE: `PATCH /user/me/email` (verifyUserToken)
  - [ ] BE: `PATCH /order/:id/email` (guest path, JWT token-protected)
  - [ ] Order placement response returns `email_update_token` (24h JWT) for guest
  - [ ] FE: skip-able, dismissible inline form
- [ ] C3 — Sign-up form: optional email field, graceful handling
- [ ] C4 — Meta CAPI `em` field:
  - [ ] FE `AnalyticsAdvancedMatching.jsx`: `em: user_email` when present
  - [ ] FE trackPurchase: em conditional
  - [ ] BE `meta.pixel.service.ts` + `tiktok.pixel.service.ts`: hash email lowercase trim

### H1 guest→registered merge

- [ ] `authentication.controllers.ts`: on OTP verify success, find Orders with matching phone + email → backfill user_email if not set + optionally link orders

---

## Build verification (after coding)

- [ ] BE: `node node_modules/typescript/bin/tsc --noEmit` → EXIT 0
- [ ] Admin: `npm run build` → EXIT 0
- [ ] FE: `npm run build` → "Compiled successfully" (live-backend prerender errors OK)

## Test plan (write after build pass)

- [ ] Owner manual test plan covering:
  - Phase 1A: Analytics tab save flow, Secrets section permission gate, public `/setting` response strip
  - Phase 1B: DevTools Network tab — verify CAPI payload contains hashed ct/st/country/fn/ln, Meta Events Manager Test Events
  - Phase 1C: Profile email save, post-order prompt skip flow, guest email associate, sign-up optional, Meta `em` hashed
  - Anonymous FB-ads flow regression: PDP → Add → Checkout → Place Order WITHOUT login still works

---

## NEXT SESSION START HERE

1. Read [PLAN.md](./PLAN.md) for context
2. Start Phase 1A → BE schema first → routes → services → admin → FE
3. Sequential order recommended (each layer enables next)
4. Commit per phase: BE Phase 1A commit, Admin Phase 1A commit, FE Phase 1A commit, repeat for 1B + 1C
5. Or one big multi-phase commit per repo if owner prefers
6. Build verification + `/test` skill after implementation
