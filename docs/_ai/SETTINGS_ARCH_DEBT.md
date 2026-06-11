# Settings Architecture Debt — split the 206-field monolith (FUTURE, not pre-delivery)

**Logged:** 2026-06-11 (session 39)
**Status:** PARKED — do during SaaS phase, NOT a first-client-delivery blocker.

## Current state (verified)

- One `settings` collection, **~206 fields**, holds everything: store identity, currency, shipping, VAT, loyalty, payment, social, policies, home layout, announcement/offer banners, feature cards, storefront-behaviour toggles, AND integration secrets.
- **Security IS already separated** (2-tier, good):
  - Public `GET /setting` → `.select(-secretFields)` strips Tier-2 secrets (`SETTING_SECRET_FIELDS` in `setting.services.ts`).
  - `GET/PATCH /setting/secrets` → `setting_secrets_update` flag-gated, masked last-4 display. Secrets = CAPI tokens, SMS api_key/secret, email password, Steadfast/Pathao/RedX keys, SSLCommerz, chat embed JS.
  - So sensitive vs public is NOT one undifferentiated blob — it's split at the API layer.

## Why it's still debt (owner's concern is valid)

- Any tiny setting save (e.g. currency) PATCHes the whole 206-field doc.
- Public `GET /setting` returns all ~206 (minus secrets) on every storefront page even when only logo+currency is needed.
- Concerns are mixed: store-identity / commerce-config / integration-secrets / home-layout all in one model → hard to cache differently, hard to reason about, doesn't scale cleanly to multi-tenant SaaS.

## Proposed future split (SaaS phase)

```
store_settings       — logo, title, currency, social, policies        (public, cache hard / long TTL)
commerce_settings    — shipping zones, vat, payment methods, loyalty   (admin)
storefront_settings  — home_layout, banners, feature cards, behaviour  (public, medium TTL) [home_layout already semi-split via /setting/home_layout]
integration_secrets  — CAPI / SMS / courier / SSLCommerz keys          (secret, encrypted-at-rest ideally, never in public projection)
```

- Migration: one-time script copies fields from the monolith into the 4 collections; keep a compatibility read-shim during transition.
- Touches all 3 apps' setting read/write paths → ~4-6h, do it as a dedicated task.
- Aligns with [SAAS_FUTURE_PLAN.md](SAAS_FUTURE_PLAN.md) (multi-tenant `shop_id` scoping).

## Decision

Not done now. Security (the real risk) is handled. Performance is fine at single-clone scale. Revisit when starting the SaaS migration or if a client's settings doc grows unwieldy.
