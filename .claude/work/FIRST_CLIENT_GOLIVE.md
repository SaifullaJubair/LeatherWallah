# First-Client Go-Live Checklist — FruitSnacks

**Created:** 2026-06-11 (session 38)
**Purpose:** The single gate between "code shipped on `dev`" and "a real paying client's shop is live." Every item here must be ✅ before handover. This is NOT a feature backlog (that's CLIENT_SPRINT_*/NEXT_PHASES) — it's the minimum production go-live gate.

**Legend:** ⬜ todo · 🔄 in progress · ✅ done · ⏭️ deferred-OK (won't block first delivery)

> ⚠️ DB is fresh/dev — wipe-safe. But this codebase is RESOLD to many clients, so config swaps + branding must be repeatable, not one-off hacks.

---

## 🔴 GATE 1 — Live owner testing (BIGGEST blocker)

Code builds clean (BE tsc 0 / Admin 0 / FE compiled) but almost nothing is owner-verified in a real browser + real DB + real SMS. See [OWNER_TEST_STATUS.md](OWNER_TEST_STATUS.md) — nearly every row is ⏸ PENDING / 🔵 static-verified.

Minimum before delivery = **one full end-to-end smoke pass**, not every scenario.

- ⬜ **E2E smoke — guest order:** browse → add to cart → checkout (COD) → order placed → success page recap correct
- ⬜ **E2E smoke — logged-in order:** same as above while logged in → appears in user purchase history
- ⬜ **Admin order flow:** order list loads → open detail → change status pending→confirmed → **real SMS arrives** on the customer phone → processing → shipped → delivered
- ⬜ **Admin cancel + restock:** cancel an order with reason → stock returns → reason shows in detail
- ⬜ **Courier send:** send one order to Steadfast (or Pathao) → consignment id comes back → sync status
- ⬜ **Session 38 Phase A:** P1/P2/P3 in OWNER_TEST_STATUS (snapshot, internal_note hidden from customer, order_type tab, pre_discount_total)
- ⬜ **Session 37:** status overhaul + SMS-on-confirm (the SMS test above covers the core)
- ⏭️ Sprint 2/3 full scenario sweep (40+ rows) — do opportunistically; not a hard gate if smoke passes

---

## 🔴 GATE 2 — Client config swap (per-client, repeatable)

These still hold the PREVIOUS owner's values (CLAUDE.md warns: do not edit `.env` during dev — swap at deploy).

### Backend `.env` (FruitSnacksBackend/.env)
- ⬜ `MONGO_URI` → client's DB
- ⬜ `ACCESS_TOKEN` → fresh JWT secret (do NOT reuse)
- ⬜ S3: `S3_REGION/ENDPOINT/ACCESS_KEY/SECRET_KEY/S3_BUCKET/S3_PUBLIC_URL` → client's bucket
- ⬜ Pathao: `PATHAO_*` (5 vars) → client's courier account
- ⬜ Steadfast: `STEADFAST_CLIENT_ID/PASSWORD`
- ⬜ `FRAUDBD_API_KEY` (optional)

### Admin `.env`
- ⬜ `VITE_API_URL` → client's backend root

### Frontend `.env.local`
- ⬜ `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_SITE_URL`
- ⬜ Analytics IDs: `META_PIXEL_ID / GTM_ID / GA4_ID / CLARITY_ID / TIKTOK_PIXEL_ID` (server-side, not NEXT_PUBLIC_)
- ⬜ CAPI tokens: `META_CAPI_ACCESS_TOKEN / TIKTOK_CAPI_ACCESS_TOKEN`

### Domain / CORS / image hosts
- ⬜ **CORS allowlist** — [FruitSnacksBackend/src/index.ts](../../FruitSnacksBackend/src/index.ts) `corsOptions.origin[]` is HARDCODED with `fruitsnacksbd.com` family → add client domains (or make env-driven)
- ⬜ **next.config.mjs image domains** — add client's S3/CDN host
- ⬜ Auth cookie domain — `fruit_snacks_token` works across the 3 apps; verify cookie domain matches client's domain

### Branding (via Admin UI — no code edit)
- ⬜ Admin → Site Settings: brand name, logo, favicon, title, SEO defaults
- ⬜ Admin → Page SEO Management: override the leftover leather/Bangladesh product copy
- ⬜ Admin → currency: `currency_code / currency_symbol / currency_name` (session 38 order.currency reads currency_code; FE display uses symbol)
- ⬜ Theme / default site theme (green by default — confirm client wants it)
- ⏭️ Currency hardcoded `BDT` in analytics + JSON-LD (F-21) — refactor only if client is non-BDT

---

## 🟠 GATE 3 — Deploy-day DB scripts + role flags

Run on the client's PROD DB after first deploy. Scripts live in `FruitSnacksBackend/src/scripts/`.

- ⬜ `normalize-user-phones.ts` (exists)
- ⬜ `zero-product-qty-when-variation.ts` (exists)
- ⬜ **order_type index (session 38):** `db.orders.createIndex({ createdAt: -1, order_type: 1 })`
- ⬜ Dashboard access (E20): tick `dashboard_show` on super-admin role — ⚠️ `tick-dashboard-show.ts` script NOT in src/scripts (do via DB or write it)
- ⬜ Tick super-admin role flags that gate shipped features:
  - `order_create_admin` (D18 POS)
  - `review_seed_bulk` + `review_seed_manual` (Sprint 3 A)
  - `site_faq_show/post/update/delete` + `newsletter_show/delete/export` (Sprint 3 D)
  - `setting_secrets_update` (Analytics Phase 1A)
  - supplier + payment-withdraw + payment-method flags
- ⬜ Verify pageSeo entries exist: checkout, order-tracking
- ⬜ Seed: at least 1 category, 1 product, banner/slider, shipping charges (inside/outside Dhaka), min_order_amount

---

## 🟠 GATE 4 — Known incomplete features (decide: ship-as-is vs fix first)

Each is a conscious call — does THIS client need it on day 1?

- ⏭️ **Online payment** — only COD wired. bKash/SSLCommerz components exist but orphaned (not imported into checkout). If client needs online pay → must wire before delivery.
- ⏭️ **Wishlist** — localStorage-only, no DB module (F-10). Lost across devices. Acceptable for v1 unless client insists.
- ⏭️ **Offer/bundle orders** — still a separate `offerorders` collection (Phase B not done). Offer checkout has a known guest-checkout bug (edge-audit B2). If client runs offers/bundles day 1 → Phase B first.
- ⏭️ **Abandoned cart** — BE module exists, no UI (CLIENT_SPRINT_4 #3).

---

## 🟡 GATE 5 — Production hardening (PRODUCTION_AUDIT_PLAN Stage 1)

Not strictly blocking a first delivery, but needed for the "production-grade resellable" promise.

- ⏭️ Structured logging (replace stray `console.log`)
- ⏭️ Error capture (Sentry-style)
- ⏭️ Health check endpoint + DB reconnect/retry + graceful shutdown
- ⏭️ Index audit per collection + N+1 query scan + `.lean()` discipline
- ⏭️ Rate-limit coverage review (order placement already has `orderLimiter`)
- ⏭️ Webhook signature verification (Pathao/Steadfast)

---

## ✅ MINIMUM VIABLE DELIVERY (owner's call)

To hand a first client a working shop, the hard gates are:
1. **GATE 1** — one full E2E smoke pass (esp. order → confirm → real SMS → deliver)
2. **GATE 2** — client config swap + branding
3. **GATE 3** — deploy scripts + role flags + seed data

GATE 4/5 are per-client / post-launch decisions. If the client doesn't sell via online-pay or offers/bundles on day 1, ship COD-only and add later.

---

## NEXT
→ Owner picks: start GATE 1 smoke test (Claude writes exact step list + Claude runs servers), or GATE 3 script prep, or decide GATE 4 scope for this specific client.
