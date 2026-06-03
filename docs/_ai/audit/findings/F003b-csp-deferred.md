---
name: F003b-csp-deferred
description: "Content-Security-Policy (CSP) — defended decision DEFERRED to dedicated session due to need for full external-source mapping."
metadata:
  finding_id: F003b
  severity: P2
  status: deferred
  module: index.ts (helmet config)
---

# F003b — Content-Security-Policy (DEFERRED)

## Severity: 🟡 P2 (secondary defense; React auto-escapes XSS at layer 1)
## Status: DEFERRED to dedicated session

## Why deferred

CSP requires mapping every external source the site loads:
- DigitalOcean Spaces (S3) image URLs
- Meta Pixel: `connect.facebook.net`, `www.facebook.com`
- TikTok Pixel: `analytics.tiktok.com`, `business-api.tiktok.com`
- Google Tag Manager, GA4, Microsoft Clarity (FE .env.local references these)
- SSLCommerz iframe / redirect
- Custom fonts (Google Fonts? local?)
- Any inline script/style (Next.js may inject some)

Wrong CSP = white page in production. Needs careful test on every page (admin + storefront).

## Fix plan (for future session)

```ts
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'",  // Next.js inline bootstrap
        "https://connect.facebook.net",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://analytics.tiktok.com",
        "https://www.clarity.ms",
      ],
      "img-src": [
        "'self'",
        "data:",
        "https://*.digitaloceanspaces.com",
        "https://www.facebook.com",
        "https://*.google.com",
      ],
      "connect-src": [
        "'self'",
        "https://api.fruitsnacksbd.com",
        "https://*.facebook.com",
        "https://analytics.tiktok.com",
        "https://www.google-analytics.com",
      ],
      "frame-src": [
        "'self'",
        "https://securepay.sslcommerz.com",
        "https://sandbox.sslcommerz.com",
      ],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
    },
  },
  // ... rest as F003
}));
```

## Test plan (for future session)

- Open Network tab in DevTools, watch for `Refused to load … blocked by CSP` errors
- Test every storefront page (home, PDP, cart, checkout, success)
- Test every admin section (dashboard, products, orders, settings, theme)
- Test SSLCommerz payment flow start-to-finish
- Test Meta/TikTok pixel fires (event delivery in Pixel Helper)

## Why P2 not P1

- React + Next.js auto-escape user content → XSS attack vector is naturally limited
- CSP is **secondary** defense; primary is escape/sanitize at output (already there)
- No P0/P1 finding waiting on CSP

## Schedule

After all Stage 1.5a module pass complete, schedule a dedicated FE+BE session to map sources + test pages.

## Related
- [[F003]] — base helmet (this session — CSP off)
- [[F004]] — CSRF (also deferred, similar 3-app coordination needed)
