# First-Client Go-Live Checklist — FruitSnacks

**Created:** 2026-06-11 (session 38)
**Purpose:** The single gate between "code shipped on `dev`" and "a real paying client's shop is live." Every item here must be ✅ before handover. This is NOT a feature backlog (that's CLIENT_SPRINT_*/NEXT_PHASES) — it's the minimum production go-live gate.

**Legend:** ⬜ todo · 🔄 in progress · ✅ done · ⏭️ deferred-OK (won't block first delivery)

---

## 🔴 GATE 0 — Security must-close (CONFIRMED vulnerabilities — top blocker)

From [BACKEND_SECURITY_AUDIT.md](../../docs/_ai/audit/BACKEND_SECURITY_AUDIT.md) Stage 1.5a (incomplete). Two P0s **confirmed exploitable** by reading the code this session — must fix before any real customer data exists.

- ✅ **F012 — IDOR on customer order history (FIXED s39).** `GET /order` now requires `verifyUserToken` and derives `customer_id` from `req.user.id`; the query param is ignored. FE `getAllOrders.js` no longer sends customer_id. ([order.routes.ts](../../FruitSnacksBackend/src/app/order/order.routes.ts), [order.controller.ts](../../FruitSnacksBackend/src/app/order/order.controller.ts))
- ✅ **F008 — Courier webhook spoofing (FIXED s39).** Steadfast: shared-secret guard — set `STEADFAST_WEBHOOK_SECRET` and append `?token=<secret>` (or `x-steadfast-webhook-secret` header) when registering the webhook URL in the Steadfast dashboard → bad/missing secret = 401. Pathao: fail-open closed — invalid/missing HMAC signature now rejects (still 202 per Pathao requirement, but does not process). Both skip the check when the secret env is unset (local dev). ([webhook.controller.ts](../../FruitSnacksBackend/src/app/order/webhook/webhook.controller.ts), [pathao.webhook.controller.ts](../../FruitSnacksBackend/src/app/order/webhook/pathao.webhook.controller.ts))
  - ⬜ **Deploy-day:** set `STEADFAST_WEBHOOK_SECRET` + `PATHAO_WEBHOOK_SECRET` in backend `.env`, and register the webhook URLs with the matching secret in each courier dashboard.
- ✅ **F012 (wider) — IDOR sweep done:** cart + wishlist already safe (both `verifyUserToken` + `req.user.id`). Only order GET was vulnerable.
- ✅ **F009 — File upload whitelist (FIXED s39).** ImageUpload fileFilter now whitelists image/video/pdf extensions (was accept-all → .exe/.html/.svg-XSS possible). Size limits already present. Also removed a hardcoded S3 key pair from comments.
- ✅ **F007 — CORS env-driven (FIXED s39).** Origins from `CORS_ORIGINS` (comma-sep, https) + localhost dev defaults; hardcoded insecure http:// list removed. **Deploy-day:** set `CORS_ORIGINS` to client's storefront + admin https domains.
- ✅ **F011 — `.env.local` untracked (PARTIAL-FIXED s39).** FE `.env.local` was git-tracked → `git rm --cached` + `.gitignore .env*`. Admin/Backend already clean. ⚠️ **Deploy-day / owner:** secrets remain in git HISTORY → **ROTATE** leaked CAPI tokens, analytics IDs, old S3 keys. Full history scrub (force-push) is destructive — owner decides.
- ⏭️ F003b CSP / F004 CSRF / F005 console→pino / F010 cron-split — deferred (documented in audit, not first-delivery blockers).

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
- ✅ **Admin order sidebar audit (s39)** — found + fixed a broken "Processing Order" menu (route was commented → blank page). Removed it + 4 dead order pages; Processing/Delivered/Cancelled/Returned are tabs inside Order List. All remaining order menus verified working + hitting valid BE routes.
- ✅ **Admin full sidebar reorg (s39)** — restructured ~45 menus into 8 collapsible groups (Dashboard/Catalog/Orders/Marketing/Customers/Content/Inventory/Settings/Staff). Surfaced 5 working-but-hidden menus (Offers, Campaigns, Slider, Supplier, Questions) — incl. the Offer-create menu needed now that offer orders are merged. 0 broken paths, all RBAC preserved.
- ✅ **Admin Settings deep-audit (s39)** — grouped the 16 flat tabs into a 4-section left sub-nav (Store/Commerce/Storefront/Integrations). **GAP FIXED:** home "Feature Cards" (rendered by storefront FeatureService) had no admin editor → restored as `/settings/feature-cards` tab. Deleted ~1,160 lines of dead settings code (AllSiteSetting/StoreDetails/StoreSocial/AboutUs) after verifying every field is covered by a live tab. Admin build EXIT 0.

### Checkout audit leftovers (session 37 fixed #1–6; these remain — checkout-flow-audit memory)
- ⬜ **#7 — `billing_country: "Bangladesh"` hardcoded** in order placement → resale issue for non-BD client; read from settings (or accept for BD-only first client)
- ⏭️ **#9 — saved-address district race** — zone dropdown may not yet contain the saved district when `applySavedAddress` fires; minor UX, not a blocker

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
- ⬜ **`STEADFAST_WEBHOOK_SECRET` + `PATHAO_WEBHOOK_SECRET`** (F008 — set these AND register matching secret in each courier dashboard; without them the webhook auth is skipped)

### Admin `.env`
- ⬜ `VITE_API_URL` → client's backend root

### Frontend `.env.local`
- ⬜ `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_SITE_URL`
- ⬜ Analytics IDs: `META_PIXEL_ID / GTM_ID / GA4_ID / CLARITY_ID / TIKTOK_PIXEL_ID` (server-side, not NEXT_PUBLIC_)
- ⬜ CAPI tokens: `META_CAPI_ACCESS_TOKEN / TIKTOK_CAPI_ACCESS_TOKEN`

### Domain / CORS / image hosts
- ⬜ **`CORS_ORIGINS`** (backend `.env`) — comma-separated https origins for the client's storefront + admin (F007 made this env-driven; localhost is always allowed for dev)
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
1. **GATE 0** — close the 2 confirmed P0 security holes (F012 IDOR + F008 webhook spoof). Non-negotiable once real customer data exists.
2. **GATE 1** — one full E2E smoke pass (esp. order → confirm → real SMS → deliver)
3. **GATE 2** — client config swap + branding
4. **GATE 3** — deploy scripts + role flags + seed data

GATE 4/5 are per-client / post-launch decisions. If the client doesn't sell via online-pay or offers/bundles on day 1, ship COD-only and add later.

---

## NEXT
→ Recommended order: **GATE 0 first** (F012 + F008 are confirmed exploitable, small fixes ~1-2h) → then GATE 1 smoke test → GATE 2/3 config at deploy time. Owner picks where to start.
