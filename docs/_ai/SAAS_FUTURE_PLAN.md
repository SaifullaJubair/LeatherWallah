# SaaS Future Plan — Multi-Tenant E-Commerce Platform (ZatiqEasy-inspired)

> 🆕 **2026-06-24 — read [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md) FIRST.** The SaaS path
> is now sharpened there: **landing-page tier becomes the FIRST multi-tenant SaaS** (cost-driven,
> high volume — master §11–12), full-shop SaaS stays deferred to 100+ clients. The OWNER feature-flag
> layer ([OWNER_FEATURE_FLAG.md](OWNER_FEATURE_FLAG.md)) + client-config (niche/skin/plan_tier/
> language/currency) is the layer that BECOMES tenant config at migration. This doc's multi-tenant
> mechanics are still the reference for that phase; the master decides WHEN/WHICH tier goes first.

**Date:** 2026-05-25
**Goal:** The long-term plan to turn this codebase into a **multi-tenant SaaS** (like ZatiqEasy / Shopify) where one deployment serves many shops, each on its own domain, with central feature/bug updates. This is the FUTURE direction; today we ship **clone-per-client** (see [CLONE_NOW_FIXES.md](CLONE_NOW_FIXES.md) + [[architecture-clone-now-saas-ready]]).

> Reference: we deeply studied **ZatiqEasy** (easybill.zatiq.tech) — a live BD e-commerce SaaS. This doc captures their model + what we'd build. Their stack is **Next.js + Vercel + Tailwind + Laravel API**, multi-tenant via `shop_id`. Ours: Next.js + Express + Mongo. Same shape.

---

## 0. The core multi-tenant shift

**One backend + one frontend deployment, every model scoped by `shop_id`/`store_id`.**

- Add `store_id` to EVERY collection (products, variations, orders, customers, categories, coupons, settings, cart, wishlist…) + filter on EVERY query. (Route all DB access through a helper so the filter is injected in one place — that's why [[architecture-clone-now-saas-ready]] says write code that way now.)
- **Domain → store resolve middleware:** request host (`shopname.sellbd.shop` or custom domain) → look up `store_id` → scope the whole request. (ZatiqEasy: free subdomain `*.sellbd.shop` + custom domain via CNAME to `gateway.zatiqeasy.com`.)
- **Storefront SSR is store-aware:** Next.js reads host on the server, fetches that store's settings/theme/products, server-renders. (ZatiqEasy does exactly this — `_rsc` requests, Next 16, Vercel.)
- **Admin is store-scoped:** each merchant logs into the same admin app, sees only their store; you (platform owner) see all.
- **S3 storage:** per-store prefix (`uploads/{shop_id}/...`).

This is the big lift — ~80-90% of business logic (catalog/variation/pricing/cart/order) is reusable; what's added is the tenancy layer.

---

## 1. Shop / Tenant model (from ZatiqEasy `shop` object)

A `stores` collection with everything per-shop:
- Identity: `shop_name`, `shop_uuid`, `subdomain`, `custom_domain`, logo, favicon, QR.
- Locale: `country_code`, `timezone`, `currency_code`/`symbol`, `default_language` (en/bn).
- Business: `business_type` (Beauty/Electronics/Grocery…), `trade_license`, address, phone, email.
- Theme: `theme_color.primary`, theme assignment (our theme system fits here per-store).
- Payment: `advance_payment_percentage`, `is_full_advanced_payment`, `payment_methods[]`.
- Analytics: `pixel_id` + `pixel_access_token`, `gtm_id`, `tiktok_pixel_*`, `analytics_id` — **per store** (not .env).
- Delivery: `delivery_option` (districts/zones/upazila), default charge, zone overrides, COD toggle.
- Flags: `isStockMaintain`, `show_product_sold_count`, `order_verification_enabled`, `is_delivery_charge_not_refundable`, etc.
- **Subscription:** `subscription_plan_slug`, `status`, `ends_at`, `product_limit`, `order_limit` — this is the SaaS monetization layer.

## 2. Subscription & billing (the SaaS business model)

ZatiqEasy: **Free plan** (subdomain, limited) + **Monthly Plan ৳500** (custom domain, unlimited products/orders, theme customization, reports, alerts). Paid via **bKash**, auto-renew option, promo codes, invoices.

We'd need: `plans` (free/monthly/yearly, feature flags + limits), `subscriptions` (per store, start/end, status, payment ref), billing via bKash/SSLCommerz, plan-gating middleware (block features/over-limit), renewal cron, promo codes for subscriptions, invoice generation.

## 3. Domain system

- **Free subdomain:** `{shop}.yourplatform.shop` — instant, wildcard DNS + wildcard SSL.
- **Custom domain (paid tier):** merchant adds CNAME → `gateway.yourplatform.com`; you handle SSL automation (Let's Encrypt / Cloudflare for SaaS). DNS-verify + propagation wait.
- Storefront resolves shop by host header.

## 4. Catalog (adopt ZatiqEasy's superior models — these are ALSO our BACKEND_AUDIT big-bone phases)

These we'll build as the variation/category rewrites regardless; in SaaS they're per-store:

- **Variation engine** = `variant_types[]` (axes: Size, Color, Installation; each `is_mandatory`) + per-variant **price delta** (base + Σ deltas) + per-variant image + **combination `stocks[]`** (`combination:[id,id]` → qty + is_active for out-of-stock combos). Handles single / single-axis / multi-axis matrix (Daraz/StarTech). [Keystone — BACKEND_AUDIT Phase A]
- **Category** = single self-referencing collection (`parent_id`, infinite depth) + **many-to-many product↔category** (pivot) + category-optional products. Drill-down admin UI (comma-path breadcrumb). [BACKEND_AUDIT 6b]
- **Product** = + `custom_fields` (free key-value), `video_link`, `condition`, `sold_count`/`view_count`, `weight/dimensions`, `unit_name`. [CLONE_NOW B — build now, reuse here]

## 5. Pricing & checkout (BACKEND_AUDIT Phase B/E)

- **Backend price-resolver** = single source of truth: base → discount → variation delta → campaign(fixed/%) → flash → coupon. Applied in product/filter/cart/order. No frontend price math.
- **Flash sale** module (real, time-boxed).
- **Payment:** pluggable gateways per store — COD, **SSLCommerz** (cards+MFS), **bKash**, **AamarPay**, **Self MFS** (merchant's own number), **advance/partial payment** (% online + rest COD). Order: `payment_method/status/transaction_id/paid_amount/advance_amount`.
- **Server-side order total recompute + stock decrement** in transaction.

## 6. Filter (BACKEND_AUDIT Phase C)

Auto-discover **attribute facets** from the variation axes present in a category's products → any store gets working Size/Color/etc. filters with zero config. Category(nested)+brand+price(resolved)+attribute. Scope facets to active category.

## 7. Courier — pluggable provider layer

ZatiqEasy: Pathao / Steadfast / Redx / Paperfly / Carrybee toggles + credentials, plus their own **"Zatiq Courier"** aggregator (no setup, auto COD collection, tracking). We'd build a `CourierProvider` abstraction (adapter per provider) + per-store enable/credentials. (For non-BD SaaS later: pluggable by country.)

## 8. Marketing / SEO (per store)

- Per-store **Facebook Product Feed XML** (`/{shop}/facebook-product-feed.xml`) for FB/Instagram catalog.
- Per-store sitemap, GTM, FB Pixel+CAPI, TikTok Pixel+Events (config in store, not .env).
- **Promo Codes**, **Spotlights**, **Landing Pages** builder, **Theme Builder** (visual), **Mobile App** generator — ZatiqEasy upsell features.

## 9. Multi-channel / advanced (ZatiqEasy "Soon" + extras)

- **Supplier / Dropship / Resell / Wholesale** — multi-supplier sourcing, dropship products, reseller network (ZatiqEasy has `is_dropship_product`, `supplier_product_id`, `multi_supplier_enabled`).
- **POS / In-shop orders** — "easybill" is billing-first; order can be `In shop` or `Online`. Receipt/invoice system with public receipt URLs + sales summary.
- **Users & Permissions** per store (roles within a merchant's team) — replaces our brittle ~100-flag model with resource×action + store scope.
- **Mobile app**, **Analytics/Reports export**, **Chat support** (FB/WhatsApp/Brevo), **Fraud check** integrated into order flow.

## 10. Hybrid business model (recommended)

Sell BOTH:
- **SaaS plan** (multi-tenant): cheap, fast, theme/content customization only. Most small sellers. Central updates. CANNOT do custom one-page/landing or bespoke home design.
- **Custom/Enterprise plan** (clone): premium, full per-client code customization (custom home, landing pages, special flows). Separate clone + deploy.

This is exactly why we keep the clone path alive now and build SaaS-ready — both products share one foundation.

---

## Migration path (clone → SaaS, NOT from zero)
1. Everything in CLONE_NOW_FIXES + BACKEND_AUDIT big-bone phases (variation/category/price/payment/wishlist) — build these in the clone codebase first; they're store-agnostic.
2. Add `store_id` + query-scoping helper + domain-resolve middleware + S3 prefixing.
3. Stores collection + subscription/billing + plan-gating.
4. Free subdomain + custom domain SSL automation.
5. Store-scoped admin auth + per-store config (pixels/SMS/courier/payment already DB-driven from clone work).
6. Storefront SSR host-resolve.

Estimated reuse: ~80-90%. The clone work is NOT wasted — it IS the SaaS foundation.
