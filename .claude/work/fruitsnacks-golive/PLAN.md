# FruitSnacks Go-Live Deploy — fruitsnacksbd.com

**Created:** 2026-06-15 (session 42)
**Purpose:** Step-by-step to take FruitSnacks live on `https://fruitsnacksbd.com/` (Coolify).
This is the OWN-brand production launch (not a third-party client). Read this fresh-chat
to resume the deploy.

> **Legend:** ⬜ todo · 🔄 in progress · ✅ done · 🤝 owner-does (Claude guides) · 🤖 Claude-does

---

## ⚠️ Context locked (don't re-derive)

- **Infra is SHARED across all owner's shops** (Artisan + FruitSnacks + future):
  - **S3 (Contabo)** — ONE shared account/bucket for every client. FruitSnacks images
    live under key-prefix `fruit_snacks_images/` (vs `artisen_leather_images/`). No
    separate bucket needed. **Do NOT touch S3 creds.**
  - **MongoDB (Atlas)** — the FruitSnacks **production** DB = whatever `MONGO_URI` is set
    in **Coolify's FruitSnacks backend service env**. That is the DB we CLEAR + bootstrap.
- **Coolify already has the FruitSnacks env mostly wired** — we only UPDATE the analytics /
  pixel / CAPI values (+ verify the deploy-day secrets below).
- **DB will be wiped to FRESH** before bootstrap (owner confirmed). Whatever is in the
  production DB now gets dropped, then `npm run bootstrap` seeds admin/role/settings/pageSeo.
- **Script execution:** Claude runs bootstrap/migrations from the **local machine** pointed at
  the **production Mongo URI** (temporarily in local `.env`, or via env override). Claude runs
  scripts — never asks owner to.
- Branch rule: work on `dev`; **deploy = merge `dev`→`main`** on the 3 deployable repos →
  Coolify auto-deploys. Only do the merge when this checklist's pre-deploy steps are green.
- Demo login `01700000000/123456` is LOCAL ONLY — must NOT be the production super-admin.

---

## STEP 1 — 🤝 Analytics + Pixel + CAPI setup (owner + Claude, BEFORE deploy)

Owner will send screenshots; Claude guides each, then Claude writes the resulting IDs/tokens
into the env (Step 3). Account: **fruitsnacksbd@gmail.com**.

Need to collect these VALUES:

- ⬜ **GTM** — `GTM-XXXXXXX` container id (create container for fruitsnacksbd.com)
- ⬜ **GA4** — `G-XXXXXXXXXX` measurement id (create GA4 property → web stream)
- ⬜ **Microsoft Clarity** — project id (create project for the domain)
- ⬜ **Meta Pixel** — pixel id (Facebook Business → Events Manager → create/find pixel on
  the FB page)
- ⬜ **Meta CAPI token** — `META_CAPI_ACCESS_TOKEN` (Events Manager → Settings → Conversions
  API → generate access token)
- ⬜ (optional) **TikTok Pixel** id + `TIKTOK_CAPI_ACCESS_TOKEN` — only if owner runs TikTok ads
- ⬜ (optional) **GA4 / GTM** any server-side measurement protocol secret — skip unless needed

> Where these go in code (already wired, just need values):
> - FE `.env.local` (server-side, NOT NEXT_PUBLIC_): `META_PIXEL_ID / GTM_ID / GA4_ID /
>   CLARITY_ID / TIKTOK_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN / TIKTOK_CAPI_ACCESS_TOKEN`.
> - OR via Admin → Site Settings → Analytics tab (6 public IDs) + Secrets section (CAPI tokens)
>   — confirm at deploy whether this client reads them from env or DB-settings. Both paths exist.

---

## STEP 2 — 🤖 Pre-deploy code check (Claude, quick)

- ⬜ All 3 repos `dev` is green + pushed (session 42 already done: BE `2e55a47`, Admin
  `7b5f897`). Confirm `git status` clean + `dev` ahead of `main`.
- ⬜ Build-verify each: BE `tsc --noEmit` 0 · Admin `vite build` 0 · FE `next build` compiled.
- ⬜ Confirm `next.config.mjs` image `remotePatterns` includes the Contabo S3 host (shared host
  — should already be there from Artisan).
- ⬜ Confirm SEO defaults: the hardcoded Artisan-leather copy must be overwritten via Admin
  AFTER deploy (Step 6) — not a code change.

---

## STEP 3 — 🤝 Coolify env update (owner does in Coolify UI, Claude provides exact values)

For the FruitSnacks **backend** service env:
- ⬜ `MONGO_URI` — confirm it points at the intended FruitSnacks production DB (this is the one
  we wipe). **Double-check before Step 4 wipe.**
- ⬜ `ACCESS_TOKEN` — a fresh JWT secret (not reused from Artisan)
- ⬜ `CORS_ORIGINS` — `https://fruitsnacksbd.com` + the admin domain (comma-sep, https)
- ⬜ `SUPER_ADMIN_PHONE` + `SUPER_ADMIN_PASSWORD` (+ optional `SUPER_ADMIN_NAME/EMAIL`) — the
  REAL first-login (NOT the demo 01700000000). Owner changes password after first login.
- ⬜ `STEADFAST_WEBHOOK_SECRET` + `PATHAO_WEBHOOK_SECRET` — set here AND register the matching
  secret in each courier dashboard's webhook URL (else webhook auth is skipped).
- ⬜ S3 / Pathao / Steadfast / BulkSMS creds — confirm present (shared infra, likely already set).

For the FruitSnacks **frontend** service env:
- ⬜ `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_SITE_URL` (= https://fruitsnacksbd.com)
- ⬜ Analytics IDs + CAPI tokens from Step 1 (if env-driven path)

For the **admin** service env:
- ⬜ `VITE_API_URL` — FruitSnacks backend root

---

## STEP 4 — 🤖 Fresh DB + bootstrap (Claude, from local → production URI)

⚠️ DESTRUCTIVE — triple-confirm the URI is the FruitSnacks production DB, not personal/dev.

- ⬜ Point local `FruitSnacksBackend/.env` `MONGO_URI` at the **production** URI (temporarily),
  OR run with an env override. Keep a note to restore the local dev URI after.
- ⬜ **Drop the DB** (wipe all collections) so bootstrap seeds a clean state.
- ⬜ `npm run bootstrap` — creates: super-admin role (all flags, schema-derived), super-admin
  user (from `SUPER_ADMIN_PHONE/PASSWORD`), settings doc, authentication (SMS/OTP) doc, pageSeo
  seed. Idempotent.
- ⬜ Verify: can log into admin with the real super-admin creds.
- ⬜ **Floating backfill NOT needed** on a fresh DB (no legacy `floating_images`). Only needed
  if deploying onto an existing DB — N/A here.
- ⬜ Restore local `.env` to the dev URI afterward.

> Other deploy-day scripts (`normalize-user-phones`, `zero-product-qty-when-variation`) are for
> EXISTING data — skip on a fresh DB. The order_type index
> `db.orders.createIndex({createdAt:-1, order_type:1})` can be created now or after first order.

---

## STEP 5 — 🤖 Deploy (Claude merges, Coolify auto-deploys)

- ⬜ Merge `dev`→`main` on the 3 deployable repos (Backend, Admin, Frontend) + push.
- ⬜ Coolify auto-builds + deploys each. Watch the build logs for green.
- ⬜ Confirm all 3 services up: storefront (fruitsnacksbd.com), admin, backend health.

---

## STEP 6 — 🤝 Post-deploy live test (owner drives, Claude assists/fixes)

Add real content, then run the full flow:

- ⬜ **Seed content via Admin:** ≥1 category, ≥1 product (with theme + page-content +
  variations + images), banner/slider, shipping charges (inside/outside Dhaka), min order amount.
- ⬜ **Branding:** Admin → Site Settings → brand name, logo, favicon, title; currency
  (`currency_code/symbol/name`); confirm green theme is wanted.
- ⬜ **SEO copy (MANDATORY — else leather copy leaks):** Admin → Page SEO Management → overwrite
  meta title/desc for home/shop/offer/about/policy pages; Site Settings → Software Info →
  `seo_title/description/keywords`; per-product SEO for hero products.
- ⬜ **Order E2E:** guest browse → add to cart → COD checkout → order success recap correct.
- ⬜ **Logged-in order:** appears in purchase history.
- ⬜ **Admin order flow:** status pending→confirmed → **REAL SMS arrives** on the phone →
  shipped → delivered.
- ⬜ **Cancel + restock:** cancel with reason → stock returns → reason shows.
- ⬜ **Courier:** send one order to Steadfast/Pathao → consignment id returns → sync status →
  webhook updates (verify the webhook secret works).
- ⬜ **Pixel/analytics check:** open storefront → Meta Pixel Helper / GA4 realtime / Clarity
  shows hits; place a test order → Purchase event fires (browser pixel + CAPI server event in
  Events Manager).
- ⬜ **SEO check:** view-source a product/home page → correct title/meta/OG (not leather);
  `/robots.txt` + `/sitemap.xml` resolve; `/shop` + `/offer` indexable.

---

## STEP 7 — 🤖 Post-launch sync (Claude)

- ⬜ Update OWNER_TEST_STATUS.md — mark the smoke rows ✅/❌.
- ⬜ Update current-status-handoff memory: "FruitSnacks LIVE on fruitsnacksbd.com (date)".
- ⬜ Log any bugs found during live test → fix→commit→deploy loop.
- ⬜ Owner: rotate any secrets that were ever in git history (F011 — old S3/CAPI), if not already.

---

## GATE 4 decisions (confirm before/at launch — ship-as-is vs fix)

- ⬜ **Online payment** — only COD wired (bKash/SSLCommerz orphaned). Need online pay day 1?
- ⬜ **Wishlist** — localStorage-only, no DB. OK for v1?
- ⬜ **Offer/bundle orders** — Phase B done (merged into orders s39). Verify offer checkout works
  if running offers day 1.

---

## Quick resume prompt for the new chat

> "Resume FruitSnacks go-live. Read `.claude/work/FRUITSNACKS_GOLIVE_DEPLOY.md`. We're deploying
> to fruitsnacksbd.com (Coolify). Start at STEP 1 — I'll send analytics screenshots, guide me
> through GTM/GA4/Clarity/Pixel/CAPI, then we do env → fresh-DB bootstrap → deploy → live test."
