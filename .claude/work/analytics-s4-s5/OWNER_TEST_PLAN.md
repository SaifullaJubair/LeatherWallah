# S4 + S5 Phase 1 — Owner Local Test Plan

> **Status:** All 3 phases (1A + 1B + 1C) shipped on `v2` + feature-tester
> regression fixes applied (BE `c0da12f`, FE `223ea93`).
> **Builds:** BE tsc EXIT 0 / Admin Vite EXIT 0 / FE Next ✓ Compiled successfully.
> **Goal:** Verify everything works in a real browser + DevTools + DB before declaring done.
> **Owner-locked constraint:** Anonymous FB-ads checkout MUST keep working untouched.
>
> Take your time — break this into 2-3 sessions if needed. Tick boxes as you go.

## ⭐ Feature-tester additions (must verify these)

The independent feature-tester sub-agent pass found 3 BLOCKERS + 4 WARNINGs
that were already fixed inline before owner test. Re-verify these specifically:

- [ ] **BE-side Purchase event** (fired silently from `order.controller.ts` on every order placement) now sends `fn`/`ln` split + `em` (if `customer_email` present) + `ct`/`st` from billing fields + `country: "bd"` + `num_items` summed from `product_quantity`. To verify: BE terminal log shows the full Meta CAPI payload; check the `user_data` and `custom_data` fields against expectations.
- [ ] **FE Purchase event num_items** = SUM of qty (cart with Product A qty=2 + Product B qty=3 → num_items: 5, not 3).
- [ ] **TikTok `ttq.identify`** carries `first_name` + `last_name` (Phase 1B EMQ for TikTok side too).
- [ ] **Duplicate-email signup**: existing guest user tries to sign up with an email already linked to another account → friendly 409 toast, NOT a 500 crash.

---

## Prep (5 min)

- [ ] `npm run dev` from project root → BE 5000, Admin 3001, FE 3000 all green
- [ ] Browser DevTools open (F12) — keep Network + Console tabs visible
- [ ] MongoDB Compass connected to your dev DB (optional but helpful)
- [ ] Two browsers ready: Chrome (admin login) + Chrome Incognito (anon storefront)
- [ ] **Important:** `.env` keeps your real Meta/TikTok tokens (Phase 1A fallback). For CAPI-acceptance tests, paste REAL tokens via Admin → Settings → Analytics → CAPI Secrets section. Without real tokens you'll see "Malformed access token" — that's expected, code architecture still verifiable.

---

## Phase 1A — Security architecture

### 1A.1 — Secrets stripped from public `/setting` ⭐ CRITICAL

**Why:** If secrets leak via public endpoint, anyone can read CAPI tokens / SMS API keys / courier passwords.

- [ ] Incognito → `http://localhost:3000` → DevTools → Network → filter `setting`
- [ ] Open the GET `/setting` response body
- [ ] **VERIFY these 11 fields are ABSENT:**
  - [ ] `meta_capi_access_token`
  - [ ] `tiktok_capi_access_token`
  - [ ] `meta_test_event_code`
  - [ ] `tiktok_test_event_code`
  - [ ] `sms_api_key`
  - [ ] `sms_api_secret`
  - [ ] `email_password`
  - [ ] `pathao_password`
  - [ ] `pathao_client_secret`
  - [ ] `steadfast_api_secret`
  - [ ] `redx_api_key`
- [ ] **VERIFY these 6 public IDs ARE present (when set):**
  - [ ] `meta_pixel_id`, `tiktok_pixel_id`, `gtm_id`, `ga4_id`, `clarity_id`, `google_verification_meta`

**🔴 FAIL = STOP everything else and report — it's a leak.**

### 1A.2 — Admin Analytics tab public IDs save flow

- [ ] Admin → Site Settings → Analytics & Pixels tab
- [ ] Click "Edit Settings"
- [ ] Each platform input field renders (Pixel ID, GTM, GA4, Clarity, Google Verification)
- [ ] Toggle Meta Pixel ON, type Pixel ID `123456789012345`, save
- [ ] Toast: "Analytics settings updated successfully"
- [ ] Reload Admin page — value persisted in input
- [ ] FE reload `http://localhost:3000` → DevTools Network → `/setting` response → contains `meta_pixel_id: "123456789012345"`

### 1A.3 — Admin Secrets section visibility (permission gating)

- [ ] Log in as admin **WITHOUT** `setting_secrets_update` flag → Analytics tab → scroll down → "CAPI Secrets section is hidden" gray message visible
- [ ] Admin → Role Management → your test role → tick "Update Setting Secrets" checkbox → save
- [ ] Re-login → Analytics tab → CAPI Secrets section now visible (amber border)

### 1A.4 — Admin Secrets section save flow

- [ ] CAPI Secrets section → "Update Secrets" button → 4 input fields reveal
- [ ] Type Meta CAPI Access Token: `EAAtest12345678abc3a4f`
- [ ] Type TikTok CAPI Access Token: `tt-test-12349k7m`
- [ ] Leave Meta Test Event Code blank
- [ ] Click "Save Secrets"
- [ ] Toast: "Secrets updated"
- [ ] After save, masked display shows `••••3a4f` (Meta), `••••9k7m` (TikTok), `(not set)` for blank ones
- [ ] **Refresh Admin page** — masked display still shows last-4 (proves BE returns lastFour summary, not raw token)

### 1A.5 — Empty submit = no change

- [ ] CAPI Secrets → Update Secrets → don't type anything → click Save
- [ ] Toast: "Nothing to update"
- [ ] Existing values intact (last-4 unchanged)

### 1A.6 — `PATCH /setting/secrets` response leak check ⭐ CRITICAL

- [ ] DevTools Network → clear → save secrets again
- [ ] Open the PATCH `/setting/secrets` response body
- [ ] **VERIFY secrets fields ABSENT from response data:**
  - [ ] `meta_capi_access_token` NOT in response
  - [ ] `tiktok_capi_access_token` NOT in response
  - [ ] `meta_test_event_code` NOT in response
  - [ ] `tiktok_test_event_code` NOT in response
- [ ] Only non-secret fields (currency, social links, etc.) in response

**🔴 FAIL = secrets leak via mutation response, must-fix.**

### 1A.7 — `GET /setting/secrets` returns lastFour, not raw

- [ ] DevTools Console:
```js
fetch('http://localhost:5000/api/v1/setting/secrets', { credentials: 'include' })
  .then(r => r.json()).then(d => console.log(d.data))
```
- [ ] **VERIFY response has `secrets_summary` object:**
```json
{
  "secrets_summary": {
    "meta_capi_access_token": "3a4f",
    "tiktok_capi_access_token": "9k7m",
    ...
  }
}
```
- [ ] **VERIFY raw token fields NOT present** (e.g., no `meta_capi_access_token: "EAAtest..."` at top level)

### 1A.8 — `/setting/secrets` auth check

- [ ] Log out admin
- [ ] DevTools Console:
```js
fetch('http://localhost:5000/api/v1/setting/secrets', { credentials: 'include' })
  .then(r => r.json()).then(console.log)
```
- [ ] **Expected:** 401 / 403 error, NOT the secrets data
- [ ] Log in as admin without `setting_secrets_update` flag → same fetch → still 401/403

### 1A.9 — FE getSeoConfig DB-driven check

- [ ] Admin → Settings → GTM enabled, GTM ID `GTM-TESTXYZ` → save
- [ ] FE reload → DevTools → Elements tab → search in `<head>` for `GTM-TESTXYZ` → GTM script tag present
- [ ] Admin → Settings → GTM enabled OFF → save → FE reload → GTM script absent
- [ ] Same test for Meta Pixel (search "connect.facebook.net"), TikTok (search "analytics.tiktok.com"), Clarity (search "clarity.ms")

### 1A.10 — Settings cache invalidation

- [ ] PDP visit → BE terminal shows Meta CAPI call (success or "Malformed" error)
- [ ] Admin → Settings → Meta Pixel toggle OFF → save
- [ ] Immediately PDP visit → BE terminal: **no** Meta CAPI call (early return from disabled)
- [ ] Toggle ON → save → PDP visit → CAPI call fires again

---

## Phase 1B — Event quality

### 1B.1 — PDP CAPI payload includes Phase 1B fields

- [ ] Logged-in user (with name "Sumiya Akter", district saved, division saved) → PDP visit
- [ ] DevTools Network → `meta-pixel/event` POST → Request Payload → user_data
- [ ] **VERIFY fields present:**
  - [ ] `fn: "Sumiya"` (first word)
  - [ ] `ln: "Akter"` (rest)
  - [ ] `em: "<your email>"` (if Phase 1C email set)
  - [ ] `ct: "<your saved district>"`
  - [ ] `st: "<your saved division>"`
  - [ ] `country: "bd"`
  - [ ] `external_id: "<user id>"`

- [ ] **Anonymous test:** Incognito → PDP visit → CAPI payload → user_data has only `country: "bd"` + `external_id: "anon-..."` (rest filled server-side from IP)

### 1B.2 — IP enrichment server-side

⚠️ **Note:** geoip-lite cannot resolve localhost (127.0.0.1 / ::1). For local test you'll see ct/st missing in the payload sent to Meta — that's expected on localhost. To verify the code path works:
- [ ] Use ngrok / cloudflared to tunnel localhost:3000 to a public URL, OR
- [ ] Deploy to staging and test there, OR
- [ ] Trust the code: it's wired through `helpers/geoipEnrich.ts` → called from both Meta + TikTok controllers (visible in BE source)

### 1B.3 — Meta Events Manager Test Events (REAL token required)

**Pre:** Admin → Secrets → set Meta Test Event Code (get from Meta Business → Events Manager → Test Events tab, e.g. `TEST12345`).

- [ ] Meta Business Manager → Events Manager → your pixel → **Test Events** tab
- [ ] Browser PDP visit
- [ ] **Real-time visible in Test Events:**
  - [ ] Event Name: ViewContent
  - [ ] Match Quality score (target ≥ 7 after Phase 1B; was ~3-4 before)
  - [ ] Customer Information Parameters table: shows ph, em, fn, ln, ct, st, country (whichever were sent)
- [ ] Place a test order → Test Events tab shows Purchase event with same EMQ uplift

### 1B.4 — fbclid → _fbc cookie

- [ ] Clear all cookies for localhost:3000
- [ ] Visit: `http://localhost:3000/?fbclid=test-click-id-12345`
- [ ] DevTools → Application → Cookies → http://localhost:3000
- [ ] **VERIFY:** `_fbc` cookie present with value `fb.1.<timestamp>.test-click-id-12345`
- [ ] Reload `http://localhost:3000/` (no fbclid in URL) → cookie value unchanged (FbclidCapture skips when already set)

### 1B.5 — InitiateCheckout value > 0 guard

- [ ] Empty cart → /checkout → type phone in form → DevTools Network
- [ ] **NO** InitiateCheckout event fires (value would be 0)
- [ ] Add to Cart any product → /checkout → type phone
- [ ] **EXACTLY ONE** InitiateCheckout event with non-zero `value`

### 1B.6 — num_items = sum of quantities

- [ ] Cart: Product A qty 2, Product B qty 3
- [ ] /checkout → type phone → InitiateCheckout fires
- [ ] Network → request payload → custom_data → **`num_items: 5`** (2+3, NOT 2 for product count)
- [ ] Place Order → Purchase event fires → same `num_items: 5`

### 1B.7 — Purchase dedup (FE + BE) ⭐ CRITICAL

**Why critical:** Duplicate Purchase events corrupt Meta ad attribution, inflate ROAS report.

- [ ] Incognito → Add to Cart → Checkout → Place Order
- [ ] /order-success page → Network tab clear → **Reload page (Ctrl+R)**
- [ ] **VERIFY:** NO new `meta-pixel/event` POST with `event_name: Purchase`
- [ ] DevTools → Application → Local Storage → key `purchased_order_ids` contains the new order_id
- [ ] MongoDB Compass → `orders` collection → that order doc → `meta_purchase_sent: true`, `tiktok_purchase_sent: true`

**Cross-device test:**
- [ ] Copy /order-success URL → paste in different browser (Firefox or Chrome non-incognito) → reload
- [ ] BE terminal: log line includes `skipped: dedup` (or no CAPI call at all)
- [ ] No new Purchase event on Meta Events Manager

### 1B.8 — Form-derived ct/st override IP-derived

- [ ] Anonymous → /checkout → form: name "Test", phone, division "Sylhet", district "Sylhet Sadar", address
- [ ] Place Order
- [ ] BE terminal / Meta Events Manager: Purchase event user_data should have `ct: "Sylhet Sadar"`, `st: "Sylhet"` (from form), NOT whatever IP says

---

## Phase 1C — Optional email

### 1C.1 — Profile Setting email field

- [ ] Logged-in user → User Profile → Profile Setting tab
- [ ] Email row visible at bottom: "not set" if no email, or current email value
- [ ] Click "Add email" → input + Save/Cancel buttons appear
- [ ] Invalid input (e.g., "abc") → red toast "Please enter a valid email address"
- [ ] Valid input (e.g., `test@example.com`) → save → toast "Email saved" → reload, email persisted
- [ ] Click "Change" → can edit → save again, value updates
- [ ] MongoDB Compass → `users` collection → `user_email: "test@example.com"` (lowercase, trimmed)

### 1C.2 — Duplicate email rejection

- [ ] User A: set email `same@example.com` → save → success
- [ ] User B: try to set same email → 409 toast "This email is already linked to another account"

### 1C.3 — Post-order email prompt (logged-in user)

- [ ] Logged-in user WITHOUT email → Add to Cart → Checkout → Place Order
- [ ] /order-success → amber dismissible card appears between verify/login boxes and Action Buttons
- [ ] Card: "Want a receipt + tracking link?" + email input + Save button + X dismiss
- [ ] Type valid email → Save → green success card "Email saved. We'll send your invoice + tracking shortly."
- [ ] Card disappears
- [ ] Reload /order-success → amber card NO longer shows (email now set)

### 1C.4 — Post-order email prompt (guest)

- [ ] Incognito (no login) → Add to Cart → Checkout → Place Order
- [ ] /order-success → amber card visible
- [ ] Type valid email → Save → green success
- [ ] MongoDB Compass → `orders` collection → that order doc → `customer_email: "..."` set

### 1C.5 — Post-order email single-use guard

- [ ] After C1.4 success: open same /order-success URL in a different browser
- [ ] Email prompt still shows (it's based on order data not session)
- [ ] Try to save a DIFFERENT email
- [ ] **Expected:** 409 toast "Email already set on this order; cannot be changed"
- [ ] Try to save the SAME email already on file
- [ ] **Expected:** silent success (idempotent retry handling)

### 1C.6 — Post-order prompt dismiss

- [ ] Logged-in user without email → /order-success → amber card
- [ ] Click X (top-right of card) → card disappears
- [ ] Reload page → card returns (dismissal is session-only by design)

### 1C.7 — Post-order prompt skip when email already exists

- [ ] User with email already set → place order → /order-success → amber card should NOT appear
- [ ] Guest order that already has `customer_email` → /order-success → amber card should NOT appear

### 1C.8 — Sign-up form optional email

- [ ] /sign-up → form has new optional "Email (optional)" field above phone
- [ ] Leave email blank → fill name + phone + password → submit → registration succeeds
- [ ] /sign-up → fill email `signup@test.com` + rest → submit → success
- [ ] MongoDB → user doc → `user_email: "signup@test.com"`
- [ ] Try invalid email format → red error message inline, form blocks submit

### 1C.9 — Guest → registered email auto-link ⭐ KEY UX

**Scenario:** Customer orders as guest, types email at post-order prompt, later signs up.

- [ ] Incognito → Add to Cart → Checkout (phone `01700000099`) → Place Order
- [ ] /order-success → post-order prompt → save email `autolink@test.com`
- [ ] MongoDB → orders → that order → `customer_email: "autolink@test.com"` ✓
- [ ] MongoDB → users → user doc for that phone → `user_email` empty/undefined (not set yet)
- [ ] Now /sign-up with phone `01700000099` + new password → OTP flow → verify
- [ ] After OTP verify success → MongoDB → users → user doc → `user_email: "autolink@test.com"` (auto-backfilled!)

### 1C.10 — Meta CAPI `em` field flows through after email set

- [ ] After 1C.1 or 1C.8 (user has email), do a PDP visit
- [ ] DevTools Network → meta-pixel/event POST → user_data → `em: "test@example.com"` present
- [ ] BE terminal: should NOT show "em missing" warnings
- [ ] Meta Events Manager Test Events: Customer Information Parameters shows email row with green check

---

## Owner-locked regression — Anonymous FB-ads ⚠️

**Re-verify after EVERY phase that anon flow still works (most important constraint).**

- [ ] Incognito (no login session) → home page loads
- [ ] PDP visit → Add to Cart works
- [ ] /checkout → form: name + phone + division + district + address (no email field shown by default — NOT added)
- [ ] Place Order → success
- [ ] Order placed in DB → `customer_id: null` or guest marker

**🔴 FAIL = owner-locked rule broken, IMMEDIATE rollback.**

---

## Build / system health

- [ ] BE: `npm --prefix FruitSnacksBackend run dev` starts without errors
- [ ] BE terminal log: no compilation errors after auto-restart
- [ ] Admin: `http://localhost:3001` loads, login works
- [ ] FE: `http://localhost:3000` loads, no console errors (besides known Next.js hydration warnings for browser extensions)
- [ ] Visit each major flow: home → category → PDP → cart → checkout → order success — no broken pages

---

## Edge cases to spot-check (~10 min)

- [ ] **Single-word user name** "Rakib" → CAPI payload: `fn: "Rakib"`, `ln` undefined
- [ ] **Three-word user name** "Mohammad Rakibul Islam" → `fn: "Mohammad"`, `ln: "Rakibul Islam"`
- [ ] **Special chars in email** `test+tag@example.com` → saves fine, lowercase preserved
- [ ] **Uppercase email at signup** `Foo@BAR.com` → BE saves as `foo@bar.com`
- [ ] **Concurrent settings save** (2 admins) → last-write-wins, no crash
- [ ] **Settings cache 5min TTL** — Admin updates settings → up to 5 min later CAPI services pick up new values (or immediately due to invalidate-on-save)

---

## Report format

For each section, report ✅ pass / ❌ fail / 🟡 skip-reason (e.g., "skipped 1B.3 — need real Meta token").

For failures, paste:
1. What you did
2. What you expected
3. What you saw (screenshot or DevTools payload)
4. BE terminal log if relevant

I'll fix → re-test → continue.

---

## Deploy-day reminders (cumulative — from PLAN)

When you eventually deploy to production:
1. Admin → Settings → Analytics tab → set real Pixel IDs / GTM / GA4 / Clarity / Google verification
2. Admin → Settings → Secrets section → paste real Meta CAPI + TikTok CAPI tokens
3. `npm install` on prod will pull `geoip-lite` (~50MB GeoIP DB) — confirm disk space (you have 75GB NVM, fine)
4. Tick role permission flag `setting_secrets_update` ONLY on owner/superadmin role — NOT general staff
5. Verify `META_ACCESS_TOKEN` / `TIKTOK_ACCESS_TOKEN` env vars present as fallback (or rely entirely on DB-set values now)
