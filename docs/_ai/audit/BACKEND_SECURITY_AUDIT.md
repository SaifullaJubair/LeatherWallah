# Backend Security Audit — Stage 1.5a

**Started:** 2026-06-03 (Session 18)
**Scope:** Entire FruitSnacksBackend codebase
**Status:** 🟡 In progress — recon complete, module-by-module pass starting

---

## Audit methodology

Module-by-module pass through `src/app/` + `src/middlewares/` + `src/utils/` + `src/index.ts`. Each module gets a security review using the 9-category checklist below. Findings get individual cards in `findings/`.

## 9-category checklist (per module)

For every module reviewed, walk through:

### A. Authentication
- Every endpoint that needs auth uses `verifyToken(...)` or `verifyUserToken`?
- Public endpoints intentionally public (no leakage)?
- Token kind/who checks present (post Phase-D)?
- No phone-only legacy lookup paths left active?

### B. Authorization (RBAC)
- `verifyToken("flag_name")` flag corresponds to a real role permission?
- Permission exists in `role.interface.ts` + `role.model.ts` + admin `permissionData.js`?
- No endpoint shares a permission with a more dangerous action (e.g., `_view` shouldn't allow `_delete`)?
- Cross-resource ownership checks (e.g., user A can't read user B's cart by guessing ID)?

### C. Input validation
- Body, params, query all validated (mongoose schema is NOT enough — type coercion, ObjectId cast)?
- No raw `req.body` spread into model (mass-assignment)?
- File upload mime + size limits enforced?
- Pagination bounds (no `?limit=999999`)?
- ObjectId fields validated before `findById`?

### D. Injection surface
- No `$where`, no string concat into `$expr`, no user input directly into aggregation `$lookup` lookups?
- Regex search escapes user input (no ReDoS)?
- Mongoose `strict: true` (default) — verify no `strict: false` overrides?
- SSRF: any user-controlled URL passed to fetch/axios (image proxy, webhook reply)?

### E. Secrets
- Env-only (never in DB, never in code)?
- `console.log` doesn't leak tokens/secrets?
- Error responses don't echo stack traces / DB error messages with credentials?
- `.env` gitignored (already verified — see audit F00X)

### F. Rate limiting / brute force
- Auth endpoints rate-limited (login, OTP send, OTP verify, password reset)?
- Resource-creating endpoints (signup, order placement, review submission) rate-limited?
- Webhook endpoints rate-limited per-source?

### G. Error handling + info leak
- Errors go through `globalErrorHandler` consistently (no raw `res.send(err)`)?
- No `error.stack` shipped in production response?
- 404 reveals route patterns? (currently returns originalUrl — fine)
- Timing-attack safety on login/OTP (constant-time compare)?

### H. File upload + S3
- Multer file count + size + type whitelisted?
- Local `uploads/` tmp deleted after S3 upload (always, even on error)?
- S3 keys: no user input directly (collision/overwrite risk)?
- Generated S3 URLs not guessable (or auth'd to read)?
- Old asset cleanup on update/delete (orphan scan)?

### I. CORS / CSRF / cookies / headers
- CORS allowlist correct (no `*`)?
- httpOnly + secure + sameSite cookies — Phase D set these; verify all paths use central helpers?
- CSRF: cookie-based auth + cross-site POST = needs CSRF token OR sameSite=strict OR sameSite=lax with no cross-site state change?
- Security headers (helmet): X-Content-Type-Options, X-Frame-Options, CSP, HSTS?

---

## Recon — known posture (verified 2026-06-03)

### What's GOOD (Phase D shipped real hardening)

- ✅ **JWT centralized** ([auth.tokens.ts](../../../FruitSnacksBackend/src/utils/auth.tokens.ts)) — single source of truth, `kind+who` separation, lifetimes tuned (admin 7d / user 30d / refresh 90d)
- ✅ **OTP hardened** ([auth.otp.ts](../../../FruitSnacksBackend/src/utils/auth.otp.ts)) — 6-digit, bcrypt at rest, 60s cooldown, 5-attempt cap
- ✅ **Admin middleware checks status + permission per request** ([verify.token.ts](../../../FruitSnacksBackend/src/middlewares/verify.token.ts)) — admins deactivated mid-session get blocked
- ✅ **Token kind/who rejection** — refresh can't be used as access; admin token can't be used as user
- ✅ **Cookies: httpOnly + secure + sameSite=none** centrally set
- ✅ **CORS allowlist** — explicit origin list, credentials true, no wildcards

### What needs immediate verification / fix (preliminary findings from recon)

| ID | Title | Severity (preliminary) | Notes |
|----|-------|------------------------|-------|
| F001 | `SECRET = process.env.ACCESS_TOKEN` — no startup guard for missing secret | 🟠 P1 | Server boots with undefined secret; all JWTs become invalid silently. Need fail-fast on missing required envs. |
| F002 | No rate limiting anywhere (login, OTP, signup, order placement) | 🔴 P0 | Brute-force OTP guessable in ~5 tries × infinite retries from new IPs (the 5-attempt cap is per-doc, but attacker can spam new accounts; login itself has no per-IP throttle) |
| F003 | No security headers (helmet missing from index.ts) | 🟠 P1 | No X-Frame, X-Content-Type, HSTS, no CSP. Clickjacking + MIME-sniff + downgrade-attack open. |
| F004 | No CSRF protection + `sameSite=none` cookies | 🟠 P1 | `sameSite=none` is required for cross-origin cookies but means CSRF must be defended explicitly. Any state-changing POST/PATCH/DELETE that doesn't require a non-cookie header is vulnerable from a third-party site. |
| F005 | `console.error` in cron job + scattered `console.log` (no structured logging) | 🟡 P2 | Hard to capture errors in prod. No request ID, no level. Symptom not cause-level but blocks incident response. |
| F006 | `express.json()` with no size limit | 🟡 P2 | Default is 100kb (express 4.16+) — verify; but no explicit cap = body-bomb DoS via huge JSON. |
| F007 | CORS allows `http://` admin domain alongside `https://` | 🟡 P2 | `http://admin.fruitsnacksbd.com` in allowlist alongside `https://` — http variant should be removed in prod, or auto-redirected. |
| F008 | Webhook endpoints (Pathao + Steadfast) — signature verification status unknown | 🔴 P0 (if missing) | If webhooks don't verify signature, anyone can POST fake delivery status / cancel order. Need to verify and fix. |
| F009 | File upload — multer size/type limits + S3 key collision audit needed | 🟡 P2 | Verify per-route. |
| F010 | `setInterval` cron in `src/index.ts` runs in same process as web server | 🟢 P3 | If web crashes, cron dies too; if cron throws, web crashes. Acceptable for clone-per-client but flag for SaaS direction. |
| F011 | `.env.local` committed to FE repo (Meta Pixel ID, Google verification, GTM/GA4/Clarity) | 🟠 P1 | Tracked in git history. Rotation needed at clone-handoff time. (Carried over from session 17.) |
| F012 | Per-user authorization on user-scoped endpoints (cart, wishlist, order list) — verify no IDOR | 🔴 P0 (if missing) | Need to confirm every user-scoped read uses `req.user.id` not body/param `user_id`. |

---

## Module checklist (running list)

Each module gets ✅ when its 9-category pass is complete + findings filed.

### Auth + identity
- [ ] adminRegLog — controllers, services, routes
- [ ] user — controllers (login, signup, OTP), services, routes
- [ ] authentication — what does this module hold? (SMS provider?)
- [ ] getme — admin/user `getMe`
- [ ] role — RBAC config

### Commerce core
- [ ] cart
- [ ] wishlist (new in Phase E)
- [ ] order — placement + payment + courier
- [ ] orderProducts
- [ ] payment — gateways, callbacks, manual MFS
- [ ] coupon, campaign, offer, flashsale
- [ ] wallet — ledger ops

### Catalog
- [ ] product (includes page-content patch endpoint)
- [ ] variation
- [ ] attribute
- [ ] category (tree)
- [ ] brand
- [ ] productFilter
- [ ] productFeed (Facebook catalog feed)

### Marketing + content
- [ ] banner, slider
- [ ] review, question
- [ ] theme
- [ ] faq_template
- [ ] trustPoint
- [ ] pageSeo
- [ ] setting (site settings)

### Operations
- [ ] dashboard
- [ ] supplier
- [ ] warehouse
- [ ] loyalty
- [ ] fraud
- [ ] abandonedCart
- [ ] paymentWithdrawList + withdrow_payment_method

### Integrations
- [ ] metaPixel
- [ ] tiktokPixel
- [ ] order/courier (Pathao + Steadfast)
- [ ] order/webhook (signature verification)

### Infrastructure
- [ ] middlewares (verify.token, verify.user.token, global.error.handler, send.otp.phone)
- [ ] utils (auth.tokens, auth.otp, sms, trnxId)
- [ ] helpers (image upload)
- [ ] index.ts (CORS, json limit, helmet, cron)
- [ ] server.ts (DB connection retry)

---

## Findings index

Each finding lives in `findings/F<NNN>-<slug>.md`. Index regenerated as cards are written.

| ID | Title | Severity | Status | Module | Card |
|----|-------|----------|--------|--------|------|
| F001 | Missing ACCESS_TOKEN fail-fast guard | 🟠 P1 | **fixed v2 s18** | utils/env.ts (new) | [F001 card](findings/F001-env-fail-fast.md) |
| F002 | No rate limiting on auth endpoints | 🔴 P0 | **fixed v2 s18** | middlewares/rate.limit.ts (new) | [F002 card](findings/F002-rate-limit-auth-endpoints.md) |
| F003 | Missing security headers (helmet) | 🟠 P1 | **fixed v2 s18** | index.ts | [F003 card](findings/F003-helmet-headers.md) |
| F003b | Content-Security-Policy | 🟡 P2 | **deferred** | index.ts (helmet CSP) | [F003b card](findings/F003b-csp-deferred.md) |
| F004 | No CSRF defense with sameSite=none cookies | 🟠 P1 | **deferred** | index.ts + 3-app FE | [F004 card](findings/F004-csrf-protection-deferred.md) |
| F005 | Unstructured logging (console.*) | 🟡 P2 | **partial v2 s18** (index.ts migrated to pino; module-level console.* migrates per module pass) | global | _(card pending)_ |
| F006 | No explicit body size limit | 🟡 P2 | **fixed v2 s18** | index.ts | [F006 card](findings/F006-body-size-limit.md) |
| F007 | http:// admin domain in CORS allowlist | 🟡 P2 | open | index.ts | _(pending card)_ |
| F008 | Courier webhook signature verification | 🔴 P0 if missing | open | order/webhook | _(pending verify)_ |
| F009 | File upload mime/size audit | 🟡 P2 | open | helpers/image.upload | _(pending audit)_ |
| F010 | Cron in same process as web | 🟢 P3 | open | index.ts | _(deferred)_ |
| F011 | .env.local in FE git history | 🟠 P1 | open | infra/secrets | _(carryover s17)_ |
| F012 | User-scoped endpoint IDOR audit | 🔴 P0 if present | open | cart/wishlist/order | _(pending audit)_ |

---

## Audit session log

### Session 18 — 2026-06-03 (start)
- Created this doc + master plan + work folder
- Recon pass: read index.ts, both verify middlewares, auth.tokens, auth.otp
- Captured 12 preliminary findings (F001–F012) from recon alone

### Session 18 — 2026-06-03 (quick wins shipped)
- Owner-approved tool choices: `express-rate-limit` (in-memory), `pino`+`pino-http`, `helmet` defaults (CSP off)
- Wrote finding cards: F001, F002, F003, F003b (CSP defer), F004 (CSRF defer — earlier), F006
- Installed deps: `helmet`, `express-rate-limit`, `pino`, `pino-http`, `pino-pretty` (dev)
- New files:
  - `src/utils/env.ts` — fail-fast guard for MONGO_URI/ACCESS_TOKEN/S3_*
  - `src/utils/logger.ts` — pino instance (JSON prod, pretty dev)
  - `src/middlewares/rate.limit.ts` — 5 limiters (auth/otpSend/signup/order/review)
- `index.ts` rewired: env validate first, then helmet, json limit 200kb, trust proxy 1, pino-http, console.* migrated to logger
- Rate limiters applied:
  - `user.routes.ts`: signup, login, verifyOTP, forgetPassword, resend_otp, setNewPassword
  - `admin.routes.ts`: login, forgot-password, reset-password
  - `order.routes.ts`: POST `/` + POST `/single_order`
  - `review.routes.ts`: POST `/`
- BE tsc EXIT 0 ✓
- **Next:** push to BE v2, owner smoke-test live, then start module-by-module pass (adminRegLog/user controllers + services)
