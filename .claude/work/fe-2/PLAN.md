# FruitSnacks Frontend 2.0 — Master Plan
**Date:** 2026-06-07
**Status:** DEFERRED — Plan locked, not started. Resume when owner triggers FE 2.0 sprint.
**Approach:** Same folder (`FruitSnacksFrontend`), upgrade in-place

---

## Core Rules (NON-NEGOTIABLE)

1. **shadcn/ui components everywhere possible** — Alert, Dialog, Toast, Tooltip, Slider, Skeleton, Table, etc.
2. **No garbage packages** — remove anything unused or replaceable
3. **Reusable components** — shared ProductCard, SectionHeader, SkeletonStrip, etc.
4. **API calls best way** — RTK Query for everything, no direct axios/fetch in components
5. **Optimized + lightweight** — code-split, lazy load, ISR, Suspense streaming
6. **Premium feel** — smooth transitions, proper spacing, mobile-first, app-like
7. **Tailwind 4** — CSS-based config, no `tailwind.config.js` color definitions
8. **React 19** — use() hook, useOptimistic where applicable
9. **Next.js 16** — await params/searchParams, ISR, Suspense, React cache()
10. **Global theme system** — CSS variables, change entire site color with one value

---

## Stack After Upgrade

| Layer | Before | After |
|---|---|---|
| Framework | Next.js 16.2.6 + React 18 | Next.js 16 latest + React 19 |
| Styling | Tailwind 3 + tailwind.config.js | Tailwind 4 + CSS-based config |
| Theme | Hardcoded palette | CSS variables (runtime swappable) |
| Components | Mix of custom + some shadcn | shadcn/ui as base, custom on top |
| Icons | react-icons (263 files) | react-icons (keep — too embedded) |
| Toasts | react-toastify (37 files) | Sonner (shadcn compatible, lighter) |
| Alerts | sweetalert2 (1 file) | shadcn AlertDialog |
| Skeleton | react-loading-skeleton (13 files) | shadcn Skeleton |
| Slider | react-slider (1 file) | shadcn Slider (radix already installed) |
| Phone input | react-phone-number-input (11 files) | shadcn Input + manual regex validation |
| Scrollbar | tailwind-scrollbar plugin | Tailwind 4 native `[&::-webkit-scrollbar]` |
| Progress bar | react-circular-progressbar (0 use) | REMOVE |
| Date | moment (0 use) + date-fns (0 use) | remove both — add date-fns only when needed |

---

## Phase 1 — Package Cleanup + Upgrade

### 1A. Remove unused/replaceable packages

**Remove — unused (0 imports):**
- `react-circular-progressbar` — 0 uses
- `react-lottie` — 0 uses
- `@react-pdf/renderer` — 0 uses (OrderInvoice uses jsPDF instead)
- `html2canvas` — 0 uses (html-to-image used instead)
- `react-quill-new` — 0 uses in frontend (admin only)
- `moment` — 0 uses, 300KB
- `redux-persist` — not wired in store
- `jwt-decode` — 0 uses
- `bangla-calendar` — 0 uses
- `react-date-range` — 0 uses
- `react-tooltip` — only a CSS import in layout.js, no actual component use
- `class-variance-authority` — 0 direct uses (shadcn uses it internally via its own install)
- `date-fns` — 0 actual imports anywhere

**Remove — used but replaced:**
- `sweetalert2-optimized` → shadcn `AlertDialog` (1 file: Addresses.jsx)
- `react-slider` → shadcn `Slider` (1 file: PriceRangeFilter.jsx)
- `axios` → native `fetch` (1 file: ImageUploader.jsx — already mostly commented out)
- `js-cookie` → Next.js `cookies()` server-side / `document.cookie` client-side (2 files)
- `qs` → native `URLSearchParams` (2 files: fetchCartDetails.js, oldaddtocarttest.jsx)
- `react-phone-number-input` → shadcn `Input` + phone regex validation (11 files — replace during auth/checkout redesign)
- `tailwind-scrollbar` → Tailwind 4 native `[&::-webkit-scrollbar]:` utility classes
- `react-toastify` → `sonner` (37 files — migrate gradually as pages are redesigned)
- `react-loading-skeleton` → shadcn `Skeleton` (13 files — migrate gradually)
- `react-fast-marquee` → CSS `@keyframes marquee` animation (2 files: Navbar, TopNavbar)

**Keep — genuinely needed:**
- `react-icons` — 263 files, too embedded to replace
- `swiper` — 14 files, no lightweight shadcn equivalent for carousels
- `react-photo-view` — 9 files, image lightbox/zoom — no shadcn equivalent
- `framer-motion` — 4 files, complex animations
- `react-select` — 4 files (DeliveryInfo, Profile) — shadcn Select replace during page redesign
- `html-to-image` + `jspdf` — OrderInvoice download feature, actually used
- `react-day-picker` — shadcn Calendar internal dep, comes automatically
- `react-hook-form` + `@hookform/resolvers` — 18 files, keep
- `@tanstack/react-query` — 37 files, keep (RTK consolidation Sprint 4+)
- `swiper` — 14 files

### 1B. Upgrade packages

```
next → latest 16.x
react + react-dom → ^19
@reduxjs/toolkit → latest
framer-motion → latest
eslint → 9 (flat config)
tailwindcss → ^4
```

**Note on major upgrades with breaking changes:**
- `lucide-react` 0.4 → 1.x — icon names changed, grep and fix
- `tailwind-merge` 2 → 3 — API same, safe
- `react-toastify` 10 → 11 — migrate to sonner instead
- `react-tooltip` — just remove
- `tailwindcss` 3 → 4 — full config rewrite (see Phase 2)

---

## Phase 2 — Tailwind 4 Migration

### What changes in Tailwind 4

**Old (tailwind.config.js):**
```js
theme: {
  extend: {
    colors: {
      primary: { 500: "#1B5E20", ... }
    }
  }
}
```

**New (globals.css — CSS-based config):**
```css
@import "tailwindcss";

@theme {
  --color-primary-50: #f0fdf4;
  --color-primary-100: #dcfce7;
  --color-primary-500: #1B5E20;
  --color-primary-600: #166534;
  --color-accent: #EDE0D4;
  /* ... all colors */
}
```

**Class names stay the same** — `text-primary-500`, `bg-accent` etc. সব কাজ করবে। শুধু config location বদলায়।

### Global Theme System (CSS Variables)

```css
/* globals.css */
:root {
  /* Brand theme — change these to reskin entire site */
  --brand-primary:     #1B5E20;
  --brand-primary-light: #4CAF50;
  --brand-primary-dark:  #0a3d14;
  --brand-accent:      #EDE0D4;
  --brand-bg:          #FAFAF8;
  --brand-surface:     #FFFFFF;
  --brand-ink:         #1A2820;
  --brand-muted:       #6B7280;

  /* shadcn compatible variables */
  --background:        var(--brand-bg);
  --foreground:        var(--brand-ink);
  --primary:           var(--brand-primary);
  --primary-foreground: #FFFFFF;
  --muted:             #F3F4F6;
  --muted-foreground:  var(--brand-muted);
  --border:            #E5E7EB;
  --ring:              var(--brand-primary);
  --radius:            0.5rem;
}

/* Dark mode (future) */
.dark {
  --brand-bg: #0f1a12;
  --brand-surface: #1a2e1e;
  /* ... */
}
```

**Result:** Admin এ "primary color" field → DB save → CSS variable inject → পুরো site রং বদলে যায়।

---

## Phase 3 — shadcn Setup + Component Library

### Install shadcn components needed

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog alert-dialog toast sonner
npx shadcn@latest add skeleton badge separator scroll-area
npx shadcn@latest add input label textarea select checkbox radio-group
npx shadcn@latest add accordion tabs sheet drawer
npx shadcn@latest add tooltip popover
npx shadcn@latest add slider progress
npx shadcn@latest add avatar
```

### Shared reusable components to build

```
src/components/shared/
  ProductCard.jsx          ← single card used everywhere (home, shop, PDP related)
  ProductCardSkeleton.jsx  ← matching skeleton
  SectionHeader.jsx        ← title + "সব দেখুন" link, used in every strip
  ProductStrip.jsx         ← horizontal scrollable strip of ProductCards
  ProductStripSkeleton.jsx ← strip loading state
  PageHeader.jsx           ← page title + breadcrumb
  EmptyState.jsx           ← empty cart, empty wishlist, no results
  PriceDisplay.jsx         ← ৳price with discount, crossed-out original
  RatingStars.jsx          ← star display (static + interactive)
  Badge.jsx                ← "নতুন", "সেল", "আউট অফ স্টক" badges
```

---

## Phase 4 — Page Redesign Order

### Priority 1 — Core shopping flow
1. **Home page** — plan already done (HOME_REDESIGN_PLAN.md)
2. **Shop / Filter page** — product grid + sidebar filter
3. **Product Detail Page (PDP)** — already done ✅ (`/products-themed/[slug]`)
4. **Cart / Checkout** — cart drawer (new) + checkout page
5. **Wishlist**

### Priority 2 — Secondary
6. **Category page** (`/category/[...slug]`) — same as shop with category filter
7. **Campaign page**
8. **Offer page**
9. **All brands**
10. **Compare**

### Priority 3 — Auth + Profile (defer)
11. Sign in / Sign up / Verify / Forgot password
12. User profile / Orders / Addresses

### Priority 4 — Static (defer)
13. Policy pages (privacy, return, cancel, shipping, terms)
14. About us

---

## Phase 5 — Per-Page Design Rules

### ProductCard (shared everywhere)
```
┌─────────────────────┐
│   [product image]   │  aspect-[3/4], rounded-xl
│   [badge: -20%]     │  absolute top-left
│   [wishlist ♡]      │  absolute top-right
│                     │
│  Product Name       │  2 lines max, truncate
│  ★★★★☆ (4.2)       │  rating + count
│  ৳৪৫০  ~~৬০০~~     │  price + crossed original
│  [Add to bag +]     │  full width button
└─────────────────────┘
```
- Mobile: 2 col grid
- Desktop: 4 col grid
- Hover (desktop): image scale 1.05, shadow-md
- Tap (mobile): active:scale-95
- Card click → QuickView (home) / PDP navigate (shop/category)

### Shop / Filter Page
```
Desktop:
[Sidebar Filter 280px] | [Product Grid — 4 col]
                        | [Sort select + count]
                        | [Pagination]

Mobile:
[Filter button (sheet)] [Sort button (sheet)]
[Active filter chips — horizontal scroll]
[Product Grid — 2 col]
[Pagination]
[Bottom nav — 5 tabs]
```
Filter sidebar → shadcn Sheet on mobile, sticky sidebar on desktop
Filters: Category (checkbox), Price range (dual-thumb slider → shadcn Slider), Size/Weight pills, Type pills, In stock toggle
Active filters shown as removable chips below filter bar

> **Mockup:** `.claude/work/demo-frontend/FruitSnacksFilterPage.jsx`
> Confirmed design — `useListing()` shared hook, FilterControls reused in both mobile sheet + desktop sidebar.
> CSS variables already compatible with global theme system.
> Layout/behavior locked — changes deferred post-implementation.

### QuickView Modal (product card click)
- Full modal: gallery (4 thumbnails), product name, rating, price + discount
- Variant selectors: Type/Finish (color swatches), Weight/Size (pills with price), Packaging (option pills)
- Stock indicator: in stock / low stock (X left) / out of stock
- Qty stepper + "Add to bag — ৳X" button (total updates live)
- Mini actions: Wishlist, Compare, Share
- Product attributes table (origin, shelf life, etc.)
- Trust bar: delivery + authentic
- "View full details" → PDP link

> **Mockup:** `.claude/work/demo-frontend/v2/quickview.jsx` + `quickview.css`
> Design confirmed — adapt to shadcn Dialog + RTK Query cart/wishlist state.

### Search Input (search bar click → dropdown)
Empty state (no query):
- সাম্প্রতিক খোঁজ (recent searches) — pills, "সব মুছুন"
- জনপ্রিয় খোঁজ (popular) — pills
- আপনার জন্য বাছাই — mini product cards (bestsellers)

Query state:
- "X টি পণ্য পাওয়া গেছে" header
- Product rows: image + name + price + chevron
- Category matches section
- "→ সব ফলাফল দেখুন" footer link

No results state:
- Not found message + popular suggestion pills

> **Mockup:** `.claude/work/demo-frontend/v1/topnav.jsx` → `SearchDropdown` component
> Navbar also has: rotating placeholder text, mega menu (desktop), mobile drawer
> Adapt to RTK Query search endpoint + Next.js router push on select.

### Cart (new — drawer based)
- Floating bubble (right side, mid-page) → opens CartDrawer
- CartDrawer → shadcn Sheet component
- Navbar cart icon → direct /checkout
- Free shipping progress bar (threshold configurable — currently ৳1500)
- Empty state with "Continue shopping" CTA
- Item row: image, name, variant, qty stepper (+/−), remove button, line price
- Footer: subtotal, delivery (free/calculated), Checkout button, payment method icons

> **Mockup:** `.claude/work/demo-frontend/v2/cart.jsx` + `cart.css`
> Design confirmed — adapt to shadcn Sheet + RTK Query cart state.

### Checkout
- Single page, no steps
- Left: delivery info form
- Right: order summary (sticky)
- Mobile: stacked

---

## Phase 6 — Performance Checklist

- [ ] All server-fetched sections: ISR with correct revalidate
- [ ] All below-fold: Suspense + skeleton
- [ ] All images: next/image with sizes prop
- [ ] Banner image: priority={true} (LCP)
- [ ] CartDrawer + QuickViewModal: next/dynamic ssr:false
- [ ] getServerSettingData: React cache() for dedup
- [ ] Promise.all on all above-fold parallel fetches
- [ ] No unused imports
- [ ] No console.log in production code
- [ ] Fonts: already next/font local — no change needed

---

## Implementation Sequence (dependency order)

```
Step 0: Package cleanup (remove unused, add sonner)
Step 1: Tailwind 4 migration (globals.css theme)
Step 2: shadcn init + install components
Step 3: Shared components (ProductCard, SectionHeader, etc.)
Step 4: Redux updates (cartDrawerOpen, uiSlice)
Step 5: Cart Drawer + Floating Bubble (shadcn Sheet)
Step 6: QuickView Modal
Step 7: Navbar + Footer redesign
Step 8: Home page (use HOME_REDESIGN_PLAN.md)
Step 9: Shop / Filter page
Step 10: Checkout page
Step 11: Wishlist page
Step 12: Category page (reuses Shop components)
Step 13: Campaign / Offer pages
Step 14: Replace react-loading-skeleton → shadcn Skeleton (13 files)
Step 15: Replace react-toastify → sonner (37 files)
Step 16: Remaining pages
```

---

## Bundle Size Impact (estimated)

| Action | Savings |
|---|---|
| Remove moment | ~300 KB |
| Remove @react-pdf/renderer | ~150 KB |
| Remove react-quill-new | ~200 KB |
| Remove html2canvas | ~100 KB |
| Remove react-lottie | ~80 KB |
| Remove react-phone-number-input | ~50 KB |
| Remove tailwind-scrollbar | ~5 KB |
| Remove axios + qs + js-cookie + others | ~60 KB |
| Remove unused small packages (bangla-calendar, redux-persist, etc.) | ~120 KB |
| react-toastify → sonner | ~80 KB saved |
| react-loading-skeleton → shadcn Skeleton | ~15 KB saved |
| **Total estimated** | **~1.16 MB removed** |

---

## Final Package Decision Summary

### REMOVE (total: 22 packages)
`react-circular-progressbar`, `react-lottie`, `@react-pdf/renderer`, `html2canvas`,
`react-quill-new`, `moment`, `redux-persist`, `jwt-decode`, `bangla-calendar`,
`react-date-range`, `react-tooltip`, `class-variance-authority`, `date-fns`,
`sweetalert2-optimized`, `react-slider`, `axios`, `js-cookie`, `qs`,
`react-phone-number-input`, `tailwind-scrollbar`,
`react-toastify` (→ sonner), `react-loading-skeleton` (→ shadcn Skeleton)

### ADD (new)
`sonner` — lightweight toast (shadcn compatible)

### KEEP
`react-icons`, `swiper`, `react-photo-view`, `framer-motion`, `react-select`,
`html-to-image`, `jspdf`, `react-day-picker`, `react-hook-form`, `@hookform/resolvers`,
`@tanstack/react-query`, `@reduxjs/toolkit`, `react-redux`, `react-hook-form`,
`next`, `react`, `react-dom`, `sharp`, `zod` (shadcn forms need it)

### Notes
- `react-icons` — 263 files, migration cost too high vs benefit. keep.
- `react-select` — 4 files; replace with shadcn Select during page redesign (not now)
- `react-photo-view` — no good shadcn lightbox equivalent; keep
- `swiper` — carousel/slider, no lightweight alternative
- OrderInvoice (`html-to-image` + `jsPDF`) — actually used, keep
- PDP (`/products-themed/[slug]`) — already done; CSS vars migrate to new theme system (minimal work)
- `zod` — currently 0 direct use but shadcn forms + react-hook-form validation needs it; add back
