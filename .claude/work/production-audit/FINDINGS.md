# Findings Scratch

Quick notes / repro snippets / context too volatile for the proper card. Once a finding is fully captured in `docs/_ai/audit/findings/F<NNN>.md`, prune from here.

---

## F001 — ACCESS_TOKEN fail-fast

```ts
// auth.tokens.ts:25
const SECRET = process.env.ACCESS_TOKEN;
```
If env var missing, `SECRET` = `undefined`. `jwt.sign(payload, undefined, ...)` → throws OR signs with literal "undefined" depending on lib version. Either way silently broken. Fix = startup check in index.ts before `app.listen`.

## F002 — Rate limiting

Current state: zero. OTP per-doc cap is 5 attempts but attacker spams new accounts. Login has no per-IP throttle.

Endpoints needing rate limits:
- `POST /user/register` (signup)
- `POST /user/login`
- `POST /user/send-otp` + `/resend-otp`
- `POST /user/verify-otp`
- `POST /user/forgot-password`
- `POST /user/reset-password`
- `POST /admin_reg_log/login`
- `POST /admin_reg_log/forgot-password`
- `POST /admin_reg_log/reset-password`
- `POST /order` (placement — prevent burst spam orders)
- `POST /review` (spam review prevention)

## F003 — Helmet

```ts
// index.ts — current: NO helmet
app.use(cors(corsOptions));
// missing: app.use(helmet({ ... }))
```

Defaults to consider:
- contentSecurityPolicy: maybe off initially (until we audit all CDN sources)
- crossOriginEmbedderPolicy: off (we serve images cross-origin from S3)
- HSTS: on (already https in prod)

## F006 — Body size

express 4.16+ defaults to 100kb. We use express ^4.x — need to check version. Even at 100kb, explicit `limit: '1mb'` is best-practice + document why.

## F008 — Webhook signature

Need to read:
- `src/app/order/webhook/*` (or similar)
- Pathao + Steadfast docs to know signature header format

## F012 — IDOR scan

For each user-scoped route, the controller must read `req.user.id` (set by middleware) NOT trust body/param `user_id`. Quick test:
```bash
# Grep for body.user_id / params.user_id in user-protected routes
```
