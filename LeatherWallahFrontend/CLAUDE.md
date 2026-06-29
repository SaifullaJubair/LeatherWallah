# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For complete frontend documentation in Bangla (every feature area, every flow), see [docs/frontend.md](../docs/frontend.md) in the monorepo root.
> For known bugs and improvement opportunities, see [docs/issues.md](../docs/issues.md).

## Feature Filemap

**Before working on any feature, read [CLAUDE.FILEMAP.md](CLAUDE.FILEMAP.md)** — it lists every file grouped by feature (cart, checkout, auth, product, orders, etc.) so you can read all relevant files at once without searching.

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build (⚠ TypeScript and ESLint errors are ignored — see F-1 in issues.md)
npm run start    # Start production server (after build)
npm run lint     # Run ESLint
```

## Architecture Overview

This is a **Next.js 14 App Router** e-commerce frontend using **Redux Toolkit with RTK Query** for state and API management.

### Provider Hierarchy

[src/app/layout.js](src/app/layout.js) → [src/components/providers/Providers.jsx](src/components/providers/Providers.jsx) → [src/components/providers/QueryProviders.jsx](src/components/providers/QueryProviders.jsx):

```
<html lang="bn">
  <body>
    <script type="application/ld+json" />  ← Organization schema
    <MetaPixel/TikTokPixel/Clarity/GTM scripts />  ← analytics (outside Redux)
    <Providers>                                    ← Redux store + CartLoader
      <QueryProviders>                             ← TanStack Query (alongside RTK Query — see F-9)
        <AnalyticsAdvancedMatching />              ← inside Redux for userInfo
        <main>{children}<ToastContainer/></main>
```

### State Management

**Redux store** ([src/redux/store.js](src/redux/store.js)) wires:
- `baseApi` — single RTK Query API instance; all feature endpoints **inject into it** (never create separate API instances)
- `cartSlice` — cart state ([src/redux/feature/cart/cartSlice.js](src/redux/feature/cart/cartSlice.js))
- `cartLocalStorageMiddleware` — intercepts cart actions → localStorage save + (logged-in) DB sync with 500ms debounce
- `preloadedState.cart` — SSR-safe localStorage hydration (`undefined` on server, real value on client)

**Tag types** for cache invalidation are centralized in [src/redux/tag-types.js](src/redux/tag-types.js). Add new tags there.

⚠️ `tagTypesList` and `tagTypes` object are out of sync (`pc_builder` referenced but not defined — see F-4). Better pattern: `tagTypesList = Object.values(tagTypes)`.

### API Pattern

All API slices inject endpoints into `baseApi` ([src/redux/api/baseApi.js](src/redux/api/baseApi.js)):

```js
import { baseApi } from "../api/baseApi";
const myApi = baseApi.injectEndpoints({ endpoints: (build) => ({ ... }) });
```

Base URL comes from `NEXT_PUBLIC_API_URL` (root, NO trailing /api/v1 — appended by [src/components/utils/baseURL.js](src/components/utils/baseURL.js)). All requests use `credentials: "include"` (cookie-based auth using backend `fruit_snacks_token`).

### Cart Dual-Storage Pattern

Cart state lives in both localStorage (guests) and the database (logged-in users):

1. User action → Redux action dispatched
2. `cartLocalStorageMiddleware` detects cart actions → writes to localStorage
3. If logged in (detected via RTK Query userInfo cache), debounced PUT `/api/v1/cart`
4. **On login button click:** [`syncCartAfterLogin()`](src/utils/cartSync.js) → POST `/cart/sync` → merges localStorage cart into DB → `dispatch(setCartFromDB(merged))`
5. **On page load (logged in):** [`<CartLoader>`](src/components/providers/Providers.jsx) → `loadCartFromDB()` → GET `/cart` → `dispatch(setCartFromDB)`

⚠️ Page reload after login overwrites localStorage cart with DB cart — see F-3.

### Routing Structure

App Router groups in [src/app/](src/app/):
- `(auth)/` — sign-in, sign-up, OTP verify, password reset (no shared layout)
- `(frontend)/` — main storefront (products, cart, checkout, orders, campaigns, policy pages) with [`(frontend)/layout.js`](src/app/(frontend)/layout.js) shared (navbar + footer + announcement bar + unverified banner)
- `(user-profile)/` — user dashboard (profile, history, wishlist, reviews) with separate layout

PDP is [`(frontend)/products/[slug]/page.js`](src/app/(frontend)/products/[slug]/page.js) — SSR fetch, `redirect_slug` handling for SEO 301, JSON-LD product schema, themed sections render.

### Data Fetching

**Server-side** (SEO/SSG): utility functions in [src/components/lib/](src/components/lib/) use native `fetch` with Next.js `revalidate` options:
- Category, Menu: 300–600s
- Banner, Slider: 60–300s
- Site Setting: 60s
- Product list: 60s
- Single Product: `cache: "no-store"` (live price/stock — see F-7)

Revalidate values are inconsistent across files (F-14) — consider centralizing.

**Client-side**: RTK Query hooks for mutations, user-specific data (cart, orders, profile). TanStack Query is also wired up but RTK Query is the standardized pattern — see F-9 about consolidating.

### Authentication

Storefront users authenticate via:
- POST `/api/v1/user/login` → backend sets httpOnly cookie `fruit_snacks_token`
- `useUserInfoQuery()` → GET `/api/v1/get_me` for current user
- All authenticated requests use `credentials: "include"` — no manual JWT handling

OTP flow: sign-up → verify (`/verify`) → set-password → sign-in.

### Path Aliases

`@/*` maps to `src/*` (configured in [jsconfig.json](jsconfig.json)). Used extensively: `@/components/...`, `@/utils/...`, `@/redux/...`.

⚠️ One folder is misspelled: `@/contants/storageKey` should be `constants` — see F-22.

### Styling

Tailwind CSS with a custom **5-palette color system** (primary, secondary, accent, neutral, complementary — 9 shades each, 50 to 900) defined in [tailwind.config.js](tailwind.config.js). UI primitives are Shadcn components in [src/components/ui/](src/components/ui/). `cn()` utility ([src/lib/utils.js](src/lib/utils.js)) for class merging.

Fonts (including Bangla support): [src/utils/font.js](src/utils/font.js) using Next.js Font Optimization.

### Analytics

Four analytics integrations loaded in the root layout via components in [src/components/analyticsScripts/](src/components/analyticsScripts/):
- **Meta Pixel** (client + CAPI server)
- **TikTok Pixel** (client + CAPI server)
- **Google Tag Manager** (for GA4)
- **Microsoft Clarity**

Setting toggles in DB (`meta_pixel_enabled`, etc.) — if off, IDs return `null` and scripts don't load. IDs come from env vars (`META_PIXEL_ID`, `GTM_ID`, `GA4_ID`, `CLARITY_ID`, `TIKTOK_PIXEL_ID`) — NOT `NEXT_PUBLIC_*` (server-side only).

Unified event API via [`useAnalytics()`](src/components/analyticsScripts/utils/useAnalytics.js):
- `trackViewContent`, `trackAddToCart`, `trackInitiateCheckout`, `trackPurchase`
- `trackSearch`, `trackLogin`, `trackCompleteRegistration`, `trackAddToWishlist`

Each call hits browser pixel + (if enabled) CAPI server endpoint — backend's `/meta-pixel/event` and `/tiktok-pixel/event` routes forward to provider Conversion APIs. `eventID` deduplicates browser + server events.

### Dynamic Product Page System

Per-product themes applied to PDP via:
- [`src/components/theme/ProductThemedSections.jsx`](src/components/theme/ProductThemedSections.jsx) — renders sections with theme's colors/floating_assets/typography
- [`src/components/theme/AnnouncementBar.jsx`](src/components/theme/AnnouncementBar.jsx) — top rolling banner from `settings.announcement_bar`

Product object's `theme_id` is populated by the backend product detail endpoint. See [FEATURE_PLAN.md](../docs/FEATURE_PLAN.md) for the full spec.

### Key Utilities

- [src/utils/helper.js](src/utils/helper.js) — price calculations (`productPrice`, `singleProductPrice`), discount priority (flash > campaign > variation > base), `useCartCalculations` for cart subtotals + coupon application
- [src/utils/cartUtils.js](src/utils/cartUtils.js) — cart manipulation helpers
- [src/utils/cartSync.js](src/utils/cartSync.js) — login cart sync + DB load
- [src/utils/font.js](src/utils/font.js) — custom font loading including Bangla
- [src/components/lib/buildPageMeta.js](src/components/lib/buildPageMeta.js) — dynamic `generateMetadata()` helper (DB → static fallback)
- [src/components/lib/getSeoConfig.js](src/components/lib/getSeoConfig.js) — centralized site SEO (siteName, siteUrl, logo, analytics IDs)

### SEO

- Root metadata: [src/app/layout.js](src/app/layout.js) `generateMetadata()` — title template, OG, Twitter, Organization JSON-LD
- Per-page metadata: each page exports `generateMetadata()` calling `buildPageMeta(page_key)` which checks `/page-seo/:key` DB endpoint, falls back to [src/components/utils/pageSeo.js](src/components/utils/pageSeo.js)
- PDP: dynamic product-based metadata + Product schema JSON-LD with offers and aggregateRating
- Sitemap: [src/app/sitemap.js](src/app/sitemap.js) — static pages + dynamic products + categories
- Robots: [src/app/robots.js](src/app/robots.js)
- Slug history: PDP redirects old slug → new slug if backend returns `redirect_slug`

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_API_URL=       # Backend root URL (NO trailing /api/v1 — appended by baseURL.js)
NEXT_PUBLIC_SITE_URL=      # Full site URL for SEO/canonical

# Server-side analytics IDs (NOT NEXT_PUBLIC_*)
META_PIXEL_ID=
GTM_ID=
GA4_ID=
CLARITY_ID=
TIKTOK_PIXEL_ID=

# Optional
GOOGLE_VERIFICATION=       # Google Search Console
META_CAPI_ACCESS_TOKEN=    # Meta Conversion API server token (keep secret)
TIKTOK_CAPI_ACCESS_TOKEN=  # TikTok CAPI server token (keep secret)
```

⚠️ Analytics IDs intentionally NOT prefixed with `NEXT_PUBLIC_` — they're read server-side in `getSeoConfig.js` and passed to client through props. CAPI access tokens must NEVER be public.

### Image Domains

Configured in [next.config.mjs](next.config.mjs): DigitalOcean Spaces, Contabo, Cloudinary, Unsplash. Add new CDN/host here if needed (or env-driven — see F-19).

## Known Pitfalls

- **TypeScript and ESLint errors ignored at build time** — `next.config.mjs` has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true`. Production may ship with type/lint errors. See F-1 in issues.md.
- **`campaignApi.js` uses deprecated Bearer token pattern** — was carried over from admin, references localStorage at module-load time. Frontend shouldn't have campaign mutations. See F-2.
- **CartLoader overwrites localStorage cart on logged-in page refresh** — if user adds items as guest then refreshes after login, DB cart wins. The `syncCartAfterLogin` only runs on login button click, not refresh. See F-3.
- **`tagTypesList` and `tagTypes` out of sync** — `pc_builder` referenced but not defined. Use `Object.values(tagTypes)`. See F-4.
- **PDP fetches product twice** — once for `generateMetadata`, once for page. Use `cache(async ...)` wrapper. See F-6.
- **Hardcoded leather/Bangladesh copy** — in `getSeoConfig.js`, `pageSeo.js`, several home components. Intentional per CLAUDE.md (buyer overrides via Admin UI). See F-8.
- **Folder typos:** `singeProduct/` (missing `l`), `cites.js`, `contants/`. See F-22.
- **Two parallel data libraries:** Redux + RTK Query alongside TanStack Query. RTK Query is canonical. See F-9.
- **Wishlist is now DB-backed** (D15, 2026-06) — `/wishlist` backend module exists; logged-in users get cross-device sync, guests use localStorage merged on login. (F-10 in issues.md is stale.)
- **Currency hardcoded `BDT`** in analytics, JSON-LD — buyer in another country needs to refactor. See F-21.

When making changes:
1. Read [CLAUDE.FILEMAP.md](CLAUDE.FILEMAP.md) for the feature you're touching — pulls in all related files
2. Mutations: prefer RTK Query `useMutation` (do not add Bearer headers; rely on cookie)
3. New SEO page: add to [pageSeo.js](src/components/utils/pageSeo.js) and call `buildPageMeta("key")` in `generateMetadata`
4. New analytics event: add a `trackXxx` function in [useAnalytics.js](src/components/analyticsScripts/utils/useAnalytics.js) (and backend route if CAPI)
5. New cart action: add to `cartSlice.js`, add to `CART_ACTIONS` array in middleware
