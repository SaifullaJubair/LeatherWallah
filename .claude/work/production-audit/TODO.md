# Production Audit — TODO

## Stage 1.5a Backend Security

### Setup (session 18)
- [x] Create master plan + checklist + work folder
- [x] Recon pass (index, middlewares, auth utils)
- [x] Capture preliminary findings F001–F012 in checklist
- [ ] Open per-finding cards for the 4 quick wins (F001/F002/F003/F006)
- [ ] Get owner sign-off on rate-limit lib + logging lib + helmet defaults + CSRF strategy

### Quick wins (after owner approval)
- [ ] F001 — Add env guard: throw on boot if `ACCESS_TOKEN`/`MONGO_URI`/required S3 envs missing
- [ ] F002 — Install `express-rate-limit`; wrap auth + OTP + order placement routes
- [ ] F003 — Install `helmet`; mount with sane defaults; document CSP gaps for future
- [ ] F006 — `express.json({ limit: '1mb' })` + `express.urlencoded({ extended: true, limit: '1mb' })`

### Verification pass (need to actually read code, not just preliminary)
- [ ] F004 — Audit every state-changing POST/PATCH/DELETE for CSRF posture; propose fix
- [ ] F007 — Remove http:// CORS entries (or document why kept)
- [ ] F008 — Pathao + Steadfast webhook handlers: read code, check signature verify presence
- [ ] F009 — image.upload.ts: read multer config, check size/mime/key collision
- [ ] F012 — Cart + wishlist + order list endpoints: read each, confirm uses `req.user.id` not body/param

### Module pass (one ✅ per module — see main checklist)
- [ ] adminRegLog
- [ ] user
- [ ] authentication
- [ ] order + payment + webhook + courier
- [ ] cart + wishlist
- [ ] (continue per checklist in BACKEND_SECURITY_AUDIT.md)

### Wrap
- [ ] Run BE tsc EXIT 0 after all fixes
- [ ] Ask owner: merge audit v2 → main → Coolify deploy?
- [ ] Update handoff memory with Stage 1.5a outcome
- [ ] Update SESSION_LOG.md
- [ ] Move to Stage 1.5b (dynamic-vs-hardcoded audit)

## NEXT SESSION START HERE

Session 18 left off after creating the audit infra + capturing 12 preliminary findings. The next thing is:

1. Open finding cards for F001, F002, F003, F006 (the 4 quick wins) so owner can review the exact fix proposals
2. ASK owner the 4 decisions in PLAN.md (rate-limit lib, CSRF strategy, logging lib, helmet defaults)
3. Once approved, ship the quick wins on BE v2
4. Then start module-by-module pass with `adminRegLog`
