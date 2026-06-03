---
name: F002-rate-limit-auth-endpoints
description: "No rate limiting anywhere — login/OTP/signup/order placement all brute-forceable from a single IP."
metadata:
  finding_id: F002
  severity: P0
  status: in-progress
  module: middleware (global) + auth/order routes
---

# F002 — Rate limiting on auth, OTP, order, review

## Severity: 🔴 P0 (most exploitable, ship first)
## Status: Session 18 — implementing now

## The problem

Backend has **zero** rate-limiting middleware. Confirmed via:
- No `express-rate-limit`, `express-slow-down`, or similar in package.json
- No `app.use(...)` wrappers in index.ts
- No per-route throttling

### Attack surfaces

**Auth (brute-force):**
- `POST /api/v1/admin_reg_log/login` — guess admin password
- `POST /api/v1/user/login` — guess user password
- `POST /api/v1/user/verifyOTP` — only 5 attempts per OTP doc, BUT attacker can spam new OTP requests

**OTP cost:**
- `POST /api/v1/user/forgetPassword` → triggers SMS (real money)
- `POST /api/v1/user/resend_otp` → triggers SMS
- `POST /api/v1/admin_reg_log/forgot-password` → SMS
- Attacker can bleed SMS credits trivially

**Resource creation:**
- `POST /api/v1/order/...` — spam orders, even cancelled, pollutes DB + Pathao courier counter
- `POST /api/v1/review` — spam reviews
- `POST /api/v1/user/` (signup) — bot account creation

### Phase D limit is per-doc, not per-IP

[auth.otp.ts:23](../../../FruitSnacksBackend/src/utils/auth.otp.ts#L23) sets `OTP_MAX_ATTEMPTS = 5` — this is per-OTP-doc. Attacker who can re-request OTPs unlimited times bypasses this entirely.

## Fix

Use [`express-rate-limit`](https://github.com/express-rate-limit/express-rate-limit) — in-memory store, fits clone-per-client single-container model.

### New file `src/middlewares/rate.limit.ts`

```ts
import rateLimit from "express-rate-limit";
import { Request } from "express";

// Common IP extractor — respects X-Forwarded-For (Coolify reverse proxy)
// Express trust-proxy must be enabled for this to work safely.
const keyByIp = (req: Request) => req.ip || "unknown";

// Strict — login, password reset, OTP verify (brute-force targets)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 min
  max: 20,                      // 20 attempts per IP per window
  keyGenerator: keyByIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Try again in 15 minutes." },
});

// SMS-triggering — forgot password, resend OTP (cost + spam control)
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 5,                       // 5 sends per IP per hour
  keyGenerator: keyByIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests. Try again in 1 hour." },
});

// Signup — bot prevention
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 10,                      // 10 signups per IP per hour
  keyGenerator: keyByIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many signup attempts. Try again in 1 hour." },
});

// Order placement — burst spam control (still generous for legitimate retry)
export const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,    // 10 min
  max: 30,                      // 30 orders per IP per 10 min
  keyGenerator: keyByIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Order rate limit reached. Try again shortly." },
});

// Review submission — spam control
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 20,                      // 20 reviews per IP per hour
  keyGenerator: keyByIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many reviews submitted. Try again later." },
});
```

### Apply to routes

**user.routes.ts:**
- `POST /login` → `authLimiter`
- `POST /` (signup public) → `signupLimiter`
- `POST /verifyOTP` → `authLimiter`
- `POST /forgetPassword` → `otpSendLimiter`
- `POST /resend_otp` → `otpSendLimiter`
- `POST /setNewPassword` → `authLimiter`

**admin.routes.ts:**
- `POST /login` → `authLimiter`
- `POST /forgot-password` → `otpSendLimiter`
- `POST /reset-password` → `authLimiter`

**order.routes.ts:**
- All public POST order endpoints → `orderLimiter`

**review.routes.ts:**
- POST review → `reviewLimiter`

### index.ts trust proxy

Required because Coolify uses reverse proxy → `req.ip` returns proxy IP without this:
```ts
app.set("trust proxy", 1);  // trust first proxy hop (Coolify)
```

## Decisions for owner re-review

- **Window/limit values** are conservative defaults. Owner may want to loosen if they see legitimate users blocked, or tighten if abuse seen.
- **In-memory store** = limits reset on container restart. Acceptable for clone-per-client. Migrate to Redis later if SaaS.
- **No per-account limits yet** — only per-IP. Per-account would help against distributed attacks but needs more infra.

## Test plan

1. Hit login 25 times rapidly → 21st returns 429 ✓
2. Hit forgetPassword 6 times in an hour → 6th returns 429 ✓
3. Normal user login → no impact ✓
4. Rate-limit headers present in response (`RateLimit-Limit`, `RateLimit-Remaining`) ✓

## Files touched

- NEW: `src/middlewares/rate.limit.ts`
- `src/app/adminRegLog/admin.routes.ts` — apply limiters
- `src/app/user/user.routes.ts` — apply limiters
- `src/app/order/order.routes.ts` — apply limiters
- `src/app/review/review.routes.ts` — apply limiters
- `src/index.ts` — `app.set("trust proxy", 1)`
- `package.json` — `express-rate-limit`
