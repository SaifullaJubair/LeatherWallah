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

- [ ] STEP 1 — Analytics + Pixel + CAPI values (GTM / GA4 / Clarity / Meta Pixel + CAPI) 🤝 — DEFERRED to STEP 6 (all via Admin Panel, no env needed; owner does later)
- [x] STEP 2 — Pre-deploy code check ✅ DONE 2026-06-15: BE tsc 0 · Admin vite 0 · FE next build 0; git clean, dev ahead (BE+17/Admin+25/FE+15); next.config Contabo host present
- [x] STEP 3 — Coolify env ✅ DONE: added SUPER_ADMIN_PHONE/PASSWORD (01700000000/123456 — CHANGE after launch), CORS_ORIGINS, STEADFAST_WEBHOOK_SECRET, fresh ACCESS_TOKEN (was shared w/ Artisan). Analytics deferred to STEP 6 (Admin Panel).
- [x] STEP 4 — Fresh DB + bootstrap ✅ DONE 2026-06-15: backed up (/root/fs_pre_bootstrap_*.archive), dropped fruitsnacks DB (41→0), ran `npm run bootstrap` IN backend container. Created super-admin role+user+settings+auth+24 pageSeo+6 FAQ. Admin login API verified 200.
- [x] STEP 5 — Deploy ✅ DONE 2026-06-15: dev→main merged (3 repos), Coolify auto-deployed. Hit + fixed 4 build bugs (ESM uuid/nanoid/any-ascii, npm ci ERESOLVE→.npmrc, vite8 rolldown→vite5). All 3 live HTTP 200: BE 4b199ae, FE cf262ee, Admin c5a921d. See [[deploy-build-gotchas]].
- [ ] STEP 6 — Post-deploy live test (content / order / SMS / courier / pixel / SEO + analytics setup) 🤝 ← NEXT (owner does on live site)
- [ ] STEP 7 — Post-launch doc + memory sync 🤖

## Post-launch additions
- ✅ DEMO-SEED feature (session 43) — `npm run seed:demo` + Admin "Clear demo data". Ran on the
  live prod container (`node dist/scripts/seed-demo.js`). fruitsnacksbd.com now shows a full food
  demo catalog. Plan: `.claude/work/demo-seed/PLAN.md`. Commits BE `532499e`, Admin `27f761c`.
  Owner removes demo anytime: Admin → Settings → Demo Data → Clear.

## Locked context (don't re-derive — see PLAN.md "Context locked")

- S3 Contabo is SHARED across all owner's shops — don't touch; FruitSnacks uses
  `fruit_snacks_images/` prefix.
- Production DB = the `MONGO_URI` in **Coolify's FruitSnacks backend env** — that's the one we
  WIPE then bootstrap.
- Bootstrap script already exists (`npm run bootstrap`, schema-derived) — don't rebuild it.
- Fresh DB → no floating backfill / no legacy migration needed.
- Real super-admin via `SUPER_ADMIN_PHONE/PASSWORD` — NOT the demo `01700000000`.
- Deploy = `dev`→`main` merge on the 3 deployable repos only when STEP 1-4 are green.
