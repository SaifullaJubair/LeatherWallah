# Production Audit — Scratch Plan

**Active stage:** 1.5a Backend Security Audit
**Main doc:** [docs/_ai/audit/BACKEND_SECURITY_AUDIT.md](../../../docs/_ai/audit/BACKEND_SECURITY_AUDIT.md)
**Master plan:** [docs/_ai/PRODUCTION_AUDIT_PLAN.md](../../../docs/_ai/PRODUCTION_AUDIT_PLAN.md)

## This folder
Scratch only — plan + todo + half-baked notes. Final findings live in `docs/_ai/audit/findings/`. Delete this folder after Stage 1.5a complete.

## Approach

1. **Recon first** (DONE session 18) — read middlewares + index + token/OTP utils → 12 preliminary findings captured.
2. **Quick-win fixes first** — F001/F002/F003/F006 are low-effort high-impact; ship them as one BE `v2` commit. Builds momentum + shrinks attack surface immediately.
3. **Then per-module pass** — start with `adminRegLog` + `user` (auth surface), then `order` + `payment` + `webhook` (money/data integrity), then `cart` + `wishlist` (IDOR risk), then everything else.
4. **One finding = one card = one commit on v2** (or batched 2-3 related findings per commit).
5. **Owner approves push-to-main** at end of each sub-stage.

## Decision queue (ask owner)

- [ ] Rate-limit library choice — `express-rate-limit` (in-memory, simple, OK for single-process) vs `rate-limit-redis` (needs Redis). Recommend express-rate-limit for clone-per-client; flag Redis for SaaS direction.
- [ ] CSRF strategy — double-submit cookie token vs custom header + sameSite=lax migration? Currently sameSite=none for cross-subdomain. Need owner call.
- [ ] Logging library — `pino` (fast, JSON) or stick with console + later add transport? Recommend pino now.
- [ ] Helmet defaults — accept defaults or customize CSP for known external CDN sources (Cloudflare, S3, fonts)?

## Owner's hard rules to respect
- All work on BE `v2` branch
- Never silently break code paths previously tested ([[dont-break-old-tests]])
- Build features fully, temp breakage OK ([[build-it-right-breakage-ok]])
- Claude runs scripts, owner doesn't ([[claude-runs-scripts]])
- Discuss in chat with numbered options, not popup ([[discuss-in-chat-not-select-fields]])
