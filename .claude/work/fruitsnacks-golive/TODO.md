# FruitSnacks Go-Live — TODO

**Full plan:** [PLAN.md](PLAN.md) — read it for the 7-step detail + locked context.

## ⭐ NEXT SESSION START HERE

We are deploying FruitSnacks to **https://fruitsnacksbd.com/** (Coolify), as the owner's
OWN-brand production launch. All code is on `dev`, green + pushed (session 42).

**Resume at STEP 1 of PLAN.md.** The owner will send analytics screenshots; Claude guides
through GTM / GA4 / Clarity / Meta Pixel / CAPI setup, collects the IDs/tokens, then:
→ STEP 3 Coolify env update → STEP 4 fresh-DB wipe + `npm run bootstrap` (local → production
URI) → STEP 5 `dev`→`main` merge (Coolify auto-deploys) → STEP 6 live test (content → order →
SMS → courier → pixel → SEO) → STEP 7 sync.

## Status

- [ ] STEP 1 — Analytics + Pixel + CAPI values (GTM / GA4 / Clarity / Meta Pixel + CAPI) 🤝
- [ ] STEP 2 — Pre-deploy code check (3 repos build green) 🤖
- [ ] STEP 3 — Coolify env update (Mongo URI confirm / CORS / super-admin / webhook secrets / analytics) 🤝
- [ ] STEP 4 — Fresh DB wipe + bootstrap (local → production URI) 🤖 ⚠️ destructive — triple-confirm URI
- [ ] STEP 5 — Deploy (dev→main merge, Coolify auto-deploy) 🤖
- [ ] STEP 6 — Post-deploy live test (content / order / SMS / courier / pixel / SEO) 🤝
- [ ] STEP 7 — Post-launch doc + memory sync 🤖

## Locked context (don't re-derive — see PLAN.md "Context locked")

- S3 Contabo is SHARED across all owner's shops — don't touch; FruitSnacks uses
  `fruit_snacks_images/` prefix.
- Production DB = the `MONGO_URI` in **Coolify's FruitSnacks backend env** — that's the one we
  WIPE then bootstrap.
- Bootstrap script already exists (`npm run bootstrap`, schema-derived) — don't rebuild it.
- Fresh DB → no floating backfill / no legacy migration needed.
- Real super-admin via `SUPER_ADMIN_PHONE/PASSWORD` — NOT the demo `01700000000`.
- Deploy = `dev`→`main` merge on the 3 deployable repos only when STEP 1-4 are green.
