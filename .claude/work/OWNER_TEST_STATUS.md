# Owner Test Status — Master Tracker

**Created:** 2026-06-05
**Purpose:** Single source of truth for what's been live-tested vs what's awaiting owner verification. Update this doc every time owner runs a test — mark as ✅ PASSED / ❌ FAILED / 🟡 PARTIAL / ⏸ PENDING.

> Owner's testing rule (memory: [[dont-break-old-tests]]) — when a new bug-fix lands, the test plan for related earlier work must be re-checked too, not just the new fix.

---

## Legend

- ✅ PASSED — owner ran the scenario, behaviour matches expected
- ❌ FAILED — owner ran the scenario, found a regression → file a follow-up
- 🟡 PARTIAL — some scenarios passed, others still pending
- ⏸ PENDING — never run by owner yet
- 🔵 STATIC-VERIFIED — Claude verified at code level only (build / grep / trace), needs real browser/DB to confirm

---

## Summary

| Work area | Code status | Test status |
|-----------|-------------|-------------|
| Client Sprint Layer 1 BE (7 items) | ✅ Shipped session 19 | ⏸ PENDING |
| Client Sprint Layer 2 Admin (6 items) | ✅ Shipped session 20 | ⏸ PENDING |
| Client Sprint Layer 3 FE (13 items) | ✅ Shipped session 21 | ⏸ PENDING |
| Phase 1 Analytics S4+S5 (1A+1B+1C) | ✅ Shipped session 23 | ⏸ PENDING |
| Group A — PDP polish (Items 1, 2, 3) | ✅ Shipped session 23-cont | ⏸ PENDING |
| Group B — Item 8 Category audit | ✅ Shipped session 23-cont | ⏸ PENDING |
| Group B — Item 11α Pricing resolver | ✅ Shipped session 23-cont | ⏸ PENDING |
| Group B — Item 10 UPDATE round-trip | ✅ Shipped session 23-cont | ⏸ PENDING |
| Sprint 2 — C12 SMS settings runtime read | ✅ Shipped session 25 | ⏸ PENDING |

**Nothing has been live-tested by owner yet.** All shipped on `v2` branch; no merges to `main`; no deploys.

---

## Test backlog (priority order)

### 🔴 P1 — Smoke test before any deploy (~5 min)

Run these first; if any fail, do NOT proceed to other tests:

1. **Admin login works** — visit admin URL → log in with credentials → dashboard loads
2. **Storefront homepage loads** — visit FE URL → page renders, no console errors
3. **PDP loads** — open one product → image, price, variant picker all render
4. **Add to cart works** — pick variant if applicable → "Add to Cart" → cart counter updates
5. **Checkout flow loads** — go to /checkout → form appears, can fill fields
6. **Anonymous order can be placed** — fill form as guest → submit → order success page (critical — owner-locked rule)

If P1 passes, proceed to specific feature tests below.

---

### 🟠 P2 — Recently shipped (this session 23-cont — 2026-06-05)

#### Sprint 2 — C12: SMS settings runtime read (~3h, session 25)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) C12 section (2 BLOCKERS + 3 HIGH)
**Touches:** `setting.services.ts`, `setting.interface.ts`, `setting.model.ts`, `send.otp.phone.ts`, `send.order.sms.ts`, Admin `SmsSettings.jsx`

| # | Scenario | Status |
|---|----------|--------|
| C12.1 | **Clobber test (BLOCKER 1)** — Admin Analytics tab Save (non-secret tab, no SMS fields touched) → DB `sms_api_key` still intact. Previously `$set:undefined` full-replace wiped it | ⏸ |
| C12.2 | **Split save (BLOCKER 2)** — In SmsSettings: change Sender ID + Save → only `PATCH /setting` fires (Network tab). Open Secrets section → type new API key → Save Credentials → only `PATCH /setting/secrets` fires. Existing key NOT touched when SMS form saved without typing a new key | ⏸ |
| C12.3 | **Masked display (HIGH 3)** — Super admin opens SmsSettings → Secrets section shows `••••3a4f` (last-4 of saved key), not blank. Admin without `setting_secrets_update` flag sees the "permission required" stub instead | ⏸ |
| C12.4 | **HTTPS upgrade (HIGH 4)** — Trigger an OTP send (forgot-password / new-user signup) → server log shows `https://bulksmsbd.net/api/smsapi` not `http://` | ⏸ |
| C12.5 | **Storefront base URL (HIGH 5)** — Admin sets `storefront_base_url = "https://test.example.com"` (via Software Information tab once exposed; for now via DB or postman) → place a guest order → SMS body link points to `test.example.com/...` not `fruitsnacksbd.com` | 🔵 STATIC-VERIFIED until UI exposes field |
| C12.6 | **Silent no-op when disabled** — Admin toggles `sms_enabled: false` → place a guest order → order succeeds 200, no BulkSMS network call, no error toast. Toggle back ON → next order sends SMS again | ⏸ |
| C12.7 | **Anonymous checkout regression** — Owner-locked rule: guest checkout must still work with these SMS changes. Place anonymous order → success page reached, SMS attempted (or silently skipped if disabled) | ⏸ |
| C12.8 | **Wrong API key graceful failure** — Admin sets a bogus key → place order → order still 200, BE log has BulkSMS error response (`response_code !== 202`), customer sees normal success page | ⏸ |

#### Post-hoc audit follow-ups — 5 BLOCKERS + 6 HIGH fixed
**Source:** 4 plan-edge-auditor sub-agents run on already-shipped code
**Commits:** FE `0bcf174` + BE `90e1ecf` + BE `22f4d0e` + FE `6654f2a` + BE `479ebcc`

| # | Scenario | Status |
|---|----------|--------|
| PH.1 | (B0-H1) Admin marks a category `explore_category_show: true`. Verify Navbar Explore dropdown, Footer category list, user-profile SecondNavbar all show it. Previously empty for every clone | ⏸ |
| PH.2 | (B0-H2) Storefront homepage Trending Products carousel actually renders the products. Previously empty (silent — products.data.data was undefined) | ⏸ |
| PH.3 | (8-B1) Re-parent category X (serial=1) under parent Y where another child already has serial=1 → succeeds; X gets auto-assigned max+1 in Y's sibling list. Previously rejected with "Serial Number Previously Added!" | ⏸ |
| PH.4 | (8-H1) Admin edits a category WITH a new image upload (multipart) + ticks feature_category_show. 7th featured attempt blocked at 6. Previously bypassed when multipart sent string "true" | ⏸ |
| PH.5 | (11α-B1) Cart price calculation behaviour unchanged — applyCampaignMath removal is dead-code cleanup; productPrice() still drives campaign display via cart cache | ⏸ |
| PH.6 | (11α-H1) Sparse product (no benefits/nutrition/FAQ/description) but in an active offer → OfferDiscoveryBanner DOES surface on PDP. Previously hidden by ProductThemedSections hasContent gate | ⏸ |
| PH.7 | (11α-H2) Hit `/api/v1/offer/by-product/<malformed-id>` (e.g. "abc") → returns 200 with `data: []`. Previously could throw 500 mid-query | ⏸ |
| PH.8 | (10-B1) Assign Theme A to product → Theme B. themes.used_in_products: A decremented, B incremented. is_deletable on A flips correctly when count hits 0. Previously stayed permanently > 0 | ⏸ |
| PH.9 | (10-B2) Admin opens product Page Content form, clears theme dropdown → submits → product saved with no theme_id; storefront falls back to default green. Previously not possible | ⏸ |
| PH.10 | (10-H1) Admin clears product_supplier_id on full edit form → saves → reopen → supplier field empty. Previously persisted old supplier silently | ⏸ |
| PH.11 | (10-H2) Admin clears warehouse_id on full edit form → saves → reopen → warehouse field empty. Previously persisted old warehouse silently | ⏸ |

#### Sprint 2 Bucket 0 — Production-blocking bug fixes
**Source:** plan-edge-auditor on H1 home redesign (audit findings absorbed into Sprint 2)
**Commit:** FE `00de5da`

| # | Scenario | Status |
|---|----------|--------|
| B0.1 | Featured Categories — admin marks a category `feature_category_show: true` (Site Settings or Category edit) → Storefront homepage Feature Category section + Navbar mega-menu now shows it. Was previously empty for every clone | ⏸ |
| B0.2 | Trending products section loads cleanly — no console error about `data` from autoprefixer; build emits no warning about the removed import | ⏸ |
| B0.3 | Fresh clone with NO admin `/page-seo` "home" entry — view-source on homepage `<title>` and `<meta description>` show fruit-snacks generic Bangla copy, NOT "Premium Genuine Leather Wallets..." | ⏸ |
| B0.4 | Existing clones with admin-set "home" pageSeo entry — admin's saved title/description still wins (regression check; falls through to fallback only if DB entry missing) | ⏸ |

#### Group B — Item 8: Category audit
**Plan:** `.claude/work/group-b-serial/ITEM_8_CATEGORY_AUDIT.md` (bottom of doc)
**Commits:** BE `129a749`, Admin `218a9b1`

| # | Scenario | Status |
|---|----------|--------|
| 8.1 | Sibling serial — create category A serial 1 under root → create child B serial 1 under A → both succeed (previously blocked) | ⏸ |
| 8.2 | Trending products — storefront homepage trending section loads (regression check on aggregation purge) | ⏸ |
| 8.3 | Filter sidebar — category page filter still shows attributes (regression check on category_path subtree) | ⏸ |
| 8.4 | Re-parent — move category with products → impact dialog shows correct counts → confirm → storefront filter updated for old + new parent | ⏸ |
| 8.5 | Deep-leaf delete — create A→B→C, put product under C, delete C → product's category_path no longer references C | ⏸ |
| 8.6 | Featured cap — mark 6 active categories featured → try 7th → blocked. Mark one inactive → try 7th → allowed | ⏸ |
| 8.7 | Admin role page — sub_category / child_category checkboxes gone | ⏸ |

#### Group B — Item 11α: Pricing resolver Option α
**Plan:** `.claude/work/group-b-serial/ITEM_11_PRICING_AUDIT_PLAN.md` (Phase 4 section)
**Commits:** BE `50a4926`, FE `9a53444`

| # | Scenario | Status |
|---|----------|--------|
| 11.1 | Regression — placing a regular order still computes correct total (resolver doc-only change should be no-op behaviorally) | ⏸ |
| 11.2 | Cart parity (percent coupon) — add 2 products + apply 10% coupon → cart sub/discount/grand matches what checkout finalizes | ⏸ |
| 11.3 | Cart parity (fixed coupon) — same with a fixed-amount coupon | ⏸ |
| 11.4 | Cart parity (specific-product coupon) — coupon `coupon_specific_product` set to just one cart item → only that line discounted | ⏸ |
| 11.5 | Tier price — product with `tier_prices` (e.g. min_qty 5, price 90) base 100 → cart qty 4 = ৳100/unit, qty 5 drops to ৳90/unit | ⏸ |
| 11.6 | Customer group — log in as wholesale user with matching `group_prices` → wholesale price shown. ⚠️ FE does NOT yet pass `customerGroup` through `useCartCalculations` — falls back to retail. Verify retail-only fallback is fine | 🔵 STATIC-VERIFIED |
| 11.7 | PDP offer-discovery banner — open product in an active offer → amber "Bundle Offer" card visible between Benefits and Nutrition → click → goes to `/offer/<id>` | ⏸ |
| 11.8 | PDP no offer — open product not in any offer → no banner, no whitespace | ⏸ |
| 11.9 | Anonymous checkout — guest places order, no per-user / loyalty path triggered (regression check) | ⏸ |

#### Group B — Item 10: UPDATE round-trip
**Plan:** `.claude/work/group-b-serial/ITEM_10_UPDATE_AUDIT.md` (Manual test plan)
**Commit:** BE `61a9631`

| # | Scenario | Status |
|---|----------|--------|
| 10.1 | Clear brand — admin product edit → set Brand to "None" → Save → reopen → brand empty (was previously stuck on old value) | ⏸ |
| 10.2 | Clear category — same flow with Category → Save → reopen → category empty; storefront drops product from old category subtree | ⏸ |
| 10.3 | Keep brand — edit any other field with brand kept selected → Save → brand still selected (regression check) | ⏸ |
| 10.4 | Set brand on brandless product — pick brand on a no-brand product → Save → brand persists | ⏸ |

#### Group A — PDP polish
**Plan:** Inline in respective commits
**Commits:** FE `f0d1b20` (Item 3); Items 1+2 in earlier session-23 commits

| # | Scenario | Status |
|---|----------|--------|
| A.1 | Nutrition info tiles — admin adds 3 free-form tiles (label + value + icon) → save → PDP renders 3 tiles | ⏸ |
| A.2 | Nutrition rows — admin adds 5 free-form rows (label + value) → save → PDP renders 5 rows | ⏸ |
| A.3 | Description position — open a product with `product.description` set → description card visible between Nutrition and Reviews (not after hero) | ⏸ |
| A.4 | Description empty-state — open a product with empty description → no description card / no empty whitespace | ⏸ |

---

### 🟡 P3 — Phase 1 Analytics S4+S5 (deferred from session 23)

**Plan:** `.claude/work/analytics-s4-s5/OWNER_TEST_PLAN.md` (full plan, feature-tester additions at top)
**Commits (11):** BE `e62a389` / `87e7787` / `3fd4164` / `4222f73` / `c0da12f`; Admin `d6365db` / `ff64822`; FE `bdb498d` / `6099aa4` / `3a4aa4f` / `90cd530` / `223ea93`

**Prerequisite:** Owner must paste REAL Meta + TikTok CAPI tokens via Admin → Site Settings → Secrets section (requires `setting_secrets_update` role flag). Dummy tokens will produce "Malformed access token" — that's expected, only architecture verifiable without real tokens.

| # | Scenario | Status |
|---|----------|--------|
| 1A.1 | Public IDs editable from Admin Analytics tab — 6 fields (Meta/TikTok pixel, GTM, GA4, Clarity, Google verification) | ⏸ |
| 1A.2 | Secrets section — 4 CAPI fields + SMS/email/courier secrets — masked last-4 display, edit-reveal flow, empty-submit keeps existing | ⏸ |
| 1A.3 | Public /setting endpoint does NOT leak any secret values (browser DevTools network tab check) | ⏸ |
| 1A.4 | Existing clones with .env-only setup still work (fallback chain) | ⏸ |
| 1B.1 | Add-to-cart event — Meta + TikTok client+server fire with proper EMQ user_data (fn/ln split, em, ct, st, country) | ⏸ |
| 1B.2 | InitiateCheckout — fires only if cart total > 0 | ⏸ |
| 1B.3 | Purchase event — fires exactly once per order (FE localStorage + BE order.meta_purchase_sent dedup) | ⏸ |
| 1B.4 | fbclid → _fbc cookie — visit with `?fbclid=test123` → check cookie `_fbc` = `fb.1.<ts>.test123` | ⏸ |
| 1B.5 | IP enrichment — order placed without ct/st/country in user_data → BE fills from geoip-lite lookup | ⏸ |
| 1C.1 | Optional email on profile — add email → unique-sparse index allows it | ⏸ |
| 1C.2 | Post-order email prompt — guest order success page → amber prompt → submit → JWT-protected guest endpoint saves to order.customer_email | ⏸ |
| 1C.3 | Sign-up email — optional field, account creation works with or without it | ⏸ |
| 1C.4 | OTP verify backfill — guest places orders → registers later → OTP verify auto-fills orders matching phone with user's email | ⏸ |

---

### 🟢 P4 — Client Sprint earlier work (sessions 19-21)

Sprint shipped 22 items + 6 deploy steps. Most behaviour is exercised by P1 smoke test. Specific sprint-item scenarios that need explicit verification:

#### Layer 1 BE (session 19, BE `8873f56`)

| # | Item | Scenario | Status |
|---|------|----------|--------|
| M28 | Currency from settings | Change Admin → Settings → Currency Code "BDT" → "USD" → storefront prices update to "$" prefix | ⏸ |
| M18 | Coupon date validation | Coupon with end_date in past → frontend tries to apply → rejected | ⏸ |
| M20 | Per-product delivery rules | Product with `delivery_mode:"free"` → shipping cost in cart drops to 0 for that line | ⏸ |
| B2 | Attribute delete 409 | Try delete attribute used by N products → 409 dialog with sample deep-links | ⏸ |
| M24 | Category re-parent | (covered by Item 8.4 above) | — |
| B1 | Anonymous flow security (D3) | Try `/login` with random phone + password → no auto-password-set; user must use OTP flow | ⏸ |

#### Layer 2 Admin (session 20)

| # | Item | Scenario | Status |
|---|------|----------|--------|
| A3 | Attribute value DnD reorder | Drag-reorder values in attribute → save → storefront filter shows new order | ⏸ |
| A4 | Variation badge | Set badge "Best Seller" + icon on variation → PDP shows badge with theme primary color | ⏸ |
| M24 admin | Parent picker confirm | Re-parent category → impact-preview dialog with "X children + Y products" → confirm → cascade runs | ⏸ |
| A2 | Product table list | Open product list → 5 column modals (Price/Stock/Images/Video/Variations) all open + save individually | ⏸ |
| B1 admin | Customer Type column | Customer list → Type column shows guest/registered → filter works | ⏸ |

#### Layer 3 FE (session 21, FE `a685a2d`)

| # | Item | Scenario | Status |
|---|------|----------|--------|
| S1 | /cart → /checkout rename | Click "Cart" → URL is `/checkout`; old `/cart` URL still 301-redirects | ⏸ |
| M9 | SKU display on PDP | PDP shows product SKU | ⏸ |
| M14 | Per-variant gallery auto-switch | Pick a variant with own image → main image updates | ⏸ |
| M16 | Filter URL → PDP query forward | Filter sidebar selects color=red → click product → PDP pre-selects red variant | ⏸ |
| S2 | PDP media | Image carousel + video play work | ⏸ |
| A4 FE | Badge render | (covered by A4 admin above) | — |
| S6 | User dashboard + addresses | Logged-in user → dashboard → Addresses tab → CRUD works | ⏸ |
| S7 | Order tracking | Order tracking page works for known order | ⏸ |
| S8 | Order history | Logged-in user → order history list + detail | ⏸ |
| **S3a** | **Global SEO** | View page source on homepage / category / PDP → all meta tags + JSON-LD present. robots.txt + sitemap.xml accessible. Google Rich Results Test passes for PDP | ⏸ |
| **S3b** | **Product SEO wiring** | Admin sets `product.seo_title` → reload PDP → `<title>` updates from DB. Same for description, og_*, keywords | ⏸ |
| B1 FE | Checkout / post-order polish | (covered by P1.5 + P1.6 + 1C.2) | — |

---

### 🔵 P5 — Static-verified items (Claude verified at code level, owner can skip unless audit needed)

These ran through `tsc` / `npm run build` / grep verification and integration trace. Owner can test if curious but not blocking deploy:

- All sub_category / child_category dead references purged (grep returns 0)
- 8 retired RBAC flags removed from role.interface / role.model / permissionData.js
- All `PATCH /product/quick` whitelisted field updates path-correct
- Resolver call sites in `order.recompute.ts` pass only `{ variation, flashSale }` after the option-key cleanup
- Frontend cart helper delegates correctly to `applyCartLayers`
- Backend `tsc --noEmit` clean for all current sessions

---

## After deploy — separate checklist

Once owner runs the test backlog and approves merge to `main`:

- [ ] Tick role permission flags: supplier_* + payment_withdraw_* + payment_method_* (M2/M3) + setting_secrets_update (Phase 1A — owner/superadmin only)
- [ ] Admin → Site Settings → Analytics tab → real Meta/TikTok pixel IDs + CAPI tokens
- [ ] PROD DB migration scripts (Claude runs):
  - `scripts/normalize-user-phones.ts` (B1)
  - `scripts/zero-product-qty-when-variation.ts` (A2)

---

## How to use this doc

When owner runs a test, update the relevant row's Status column:
- ✅ if passed
- ❌ with one-line failure note if failed (then file as new bug in `current-status-handoff`)
- 🟡 if some scenarios in a group passed but not all

When Claude ships new work, ADD a new section at the top of P2 with the new commits + scenarios, AND verify earlier P2 sections still hold (regression check) per [[dont-break-old-tests]].
