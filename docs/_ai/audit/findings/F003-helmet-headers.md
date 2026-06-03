---
name: F003-helmet-headers
description: "No security headers (helmet missing) — clickjacking, MIME-sniff, downgrade attack all open."
metadata:
  finding_id: F003
  severity: P1
  status: in-progress
  module: index.ts
---

# F003 — Security headers (helmet)

## Severity: 🟠 P1
## Status: Session 18 — implementing now

## The problem

[index.ts:41](../../../FruitSnacksBackend/src/index.ts#L41) mounts only CORS. No security headers:
- No `X-Frame-Options` → admin can be iframed = clickjacking
- No `X-Content-Type-Options: nosniff` → MIME-sniff attacks
- No `Strict-Transport-Security` → HTTPS downgrade attack
- No `Referrer-Policy` → URL leaks via Referer header
- No `X-DNS-Prefetch-Control`

## Fix

Install + mount [`helmet`](https://helmetjs.github.io/) with defaults. CSP intentionally disabled (mapping every external source = separate session — see F003b).

```bash
npm i helmet
```

In `index.ts` BEFORE CORS:
```ts
import helmet from "helmet";

app.use(helmet({
  // CSP needs separate effort to map S3/pixels/payment iframe — see F003b
  contentSecurityPolicy: false,
  // We serve cross-origin S3 images embedded in storefront pages
  crossOriginEmbedderPolicy: false,
  // crossOriginResourcePolicy default is "same-origin" — too strict for S3 image fetch by storefront
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
```

### Headers enabled by this

- `Content-Security-Policy` — **OFF** (F003b)
- `Cross-Origin-Embedder-Policy` — **OFF** (S3 cross-origin needed)
- `Cross-Origin-Opener-Policy: same-origin` — ON
- `Cross-Origin-Resource-Policy: cross-origin` — relaxed (S3)
- `Origin-Agent-Cluster: ?1` — ON
- `Referrer-Policy: no-referrer` — ON
- `Strict-Transport-Security: max-age=15552000` — ON
- `X-Content-Type-Options: nosniff` — ON
- `X-DNS-Prefetch-Control: off` — ON
- `X-Download-Options: noopen` — ON
- `X-Frame-Options: SAMEORIGIN` — ON
- `X-Permitted-Cross-Domain-Policies: none` — ON
- `X-XSS-Protection: 0` — ON (modern browsers ignore old XSS filter)

## Test plan

1. `curl -I https://api.fruitsnacksbd.com/` → confirm headers present
2. Storefront images load (S3 cross-origin) ✓
3. Pixel scripts load (Meta/TikTok) ✓
4. Admin login works ✓
5. SSLCommerz redirect callback works ✓

## Files touched

- `src/index.ts` — add helmet mount
- `package.json` — `helmet`

## Related
- [[F003b]] — full CSP plan (deferred)
