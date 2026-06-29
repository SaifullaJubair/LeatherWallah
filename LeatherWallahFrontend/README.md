# FruitSnacks Frontend

Customer-facing storefront for the FruitSnacks e-commerce platform — built with Next.js 14 (App Router) and Redux Toolkit + RTK Query.

## Tech Stack

- **Next.js 14** (App Router) + **React 18**
- **Redux Toolkit 2** with **RTK Query** for API state and caching
- **redux-persist** for cart persistence across reloads
- **Tailwind CSS 3** with `tailwindcss-animate`, `tailwind-merge`, `tailwindcss-motion`
- **Shadcn/Radix UI** primitives (accordion, dialog, dropdown, popover, select, tabs, toast, tooltip, etc.)
- **React Hook Form** + **Zod** for forms and validation
- **Framer Motion** for animations, **Swiper** + `react-fast-marquee` for carousels
- **Lucide React** + `react-icons` for icons
- **jsPDF** + `@react-pdf/renderer` + `html2canvas` for invoice/PDF generation
- **bangla-calendar**, **moment**, **date-fns** for date handling (Bangla support included)
- **Sharp** for image optimization
- **SweetAlert2** dialogs, **React Toastify** toasts
- Analytics: Meta Pixel, TikTok Pixel, Google Tag Manager, GA4, Microsoft Clarity

## Getting Started

```bash
npm install
npm run dev          # http://localhost:3000
```

For production:

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Backend
NEXT_PUBLIC_API_URL=https://your-backend-host/api/v1
NEXT_PUBLIC_SITE_URL=https://fruitsnacksbd.com

# Analytics
META_PIXEL_ID=
GTM_ID=
GA4_ID=
CLARITY_ID=
TIKTOK_PIXEL_ID=

# SEO
GOOGLE_VERIFICATION=
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |

> No test runner is configured. TypeScript build errors are intentionally ignored via Next config.

## Features

- Product browsing with 3-level category navigation, brand filters, search, and sort
- Product detail pages with image gallery, variations, and live pricing
- Cart with **dual storage**: localStorage for guests, database for logged-in users; auto-merge on login
- Checkout with multiple addresses, courier selection, and SSLCommerz / bKash / COD payments
- Customer auth: phone-based sign-up, OTP verification, password reset
- User dashboard: orders, order tracking, wishlist, reviews, profile
- Campaign and flash-sale support with countdown UI
- Coupon application at checkout
- Full SEO: dynamic metadata, sitemap, robots, structured data, Bangla descriptions
- Server-side analytics events (Meta + TikTok) for Login, AddToCart, Purchase

## Architecture Notes

### Routing

App Router groups under [src/app/](src/app/):

- `(auth)/` — sign-in, sign-up, OTP, password reset
- `(frontend)/` — main storefront (products, checkout, orders, campaigns)
- `(user-profile)/` — logged-in user dashboard

### State Management

The Redux store ([src/redux/store.js](src/redux/store.js)) wires together:

- `baseApi` — single RTK Query API instance; **all feature endpoints inject into it** (never create separate API instances)
- `cartSlice` — local cart state
- `cartLocalstorageMiddleware` — intercepts cart actions and syncs to both localStorage and DB with a 500 ms debounce

Cache tag types are centralized in [src/redux/tag-types.js](src/redux/tag-types.js).

### Data Fetching

- **Server-side** (SEO / SSG / ISR): `fetch` calls in [src/lib/](src/lib/) using Next.js `revalidate` (60–3600 s depending on data volatility).
- **Client-side**: RTK Query hooks for mutations and user-specific data.

All requests use `credentials: "include"` to send the `fruit_snacks_token` auth cookie set by the backend.

### Path Aliases

`@/*` maps to `src/*` (configured in [jsconfig.json](jsconfig.json)).

### Image Domains

Configured in [next.config.mjs](next.config.mjs): DigitalOcean Spaces (`fruit-snacks.sgp1.cdn.digitaloceanspaces.com`), Contabo, Cloudinary, Unsplash, Pexels.

### Styling

Tailwind with a custom 5-palette color system (primary, secondary, accent, neutral, complementary — 9 shades each) defined in [tailwind.config.js](tailwind.config.js). UI primitives are Shadcn components in `src/components/ui/`.

For per-feature file maps, see [CLAUDE.FILEMAP.md](CLAUDE.FILEMAP.md). For deeper architectural guidance, see [CLAUDE.md](CLAUDE.md). SEO setup is documented in [SEO_README.md](SEO_README.md) and caching strategy in [Caching_Optimization_README.md](Caching_Optimization_README.md).

## Related Repos

- Backend: [FruitSnacksBackend](https://github.com/SaifullaJubair/FruitSnacksBackend)
- Admin: [FruitSnacksAdmin](https://github.com/SaifullaJubair/FruitSnacksAdmin)
