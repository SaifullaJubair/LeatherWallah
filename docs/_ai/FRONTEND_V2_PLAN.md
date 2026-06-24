# Frontend (Storefront) V2 — Plan (deferred: after backend, alongside/after Admin V2)

> 🆕 **2026-06-24 — read [PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md) FIRST.** Major V2
> decisions are now there and SUPERSEDE parts of this doc: **FE + Admin MERGE into one Next app**
> (this doc assumes FE stays separate — outdated), design-token system, skin registry + `next/dynamic`,
> `pdp_section_array`, i18n, staging workflow. This doc's component/UX detail is still useful, but the
> storefront-as-a-separate-app assumption is replaced by the merged-app model. Master wins on conflict.

**Captured:** 2026-05-25 (session 3). **Status:** PLANNING ONLY — not started. Pick up after backend roadmap is solid (and likely after/with Admin V2). Detail into a scratch PLAN when work begins.

> Owner's vision: rebuild the storefront to resale-grade — redesign + feature completeness + performance + i18n + security, all themeable. Sibling to `ADMIN_PANEL_V2_PLAN.md`.

## Current frontend stack (verified 2026-05-25)
- ✅ Next 16, **redux-toolkit + RTK Query AND @tanstack/react-query** (both present), react-hook-form + **zod**, **full @radix-ui suite + tailwind-merge + tailwindcss-animate** (= shadcn essentially ready to drop in), framer-motion.
- ❌ to ADD: **i18next/react-i18next** (or next-intl), react-dropzone (if needed).
- ⚠️ **PERFORMANCE RED FLAG:** ~163 `"use client"` files vs only 12 `page.js` → almost everything is a client component. Next's SSR/SSG/ISR benefits are largely unused right now. This is the heart of the "where SSR/SSG/ISR" question below.

## Requirements (owner-stated)

### A. Redesign / UI
1. **Home page redesign** — still has leftover leather-template sections/copy → match the new themed look.
2. **Navbar + Footer** redesign (consistent with home).
3. **Listing pages:** All Products, Trending, and other listing pages — redesign.
4. **User dashboard** — new design.
5. **Cart drawer (NEW feature):** clicking add-to-cart / cart summary opens a **right-side slide-in drawer** (not a full page jump). radix Dialog/Drawer + framer-motion.
6. **Animation** throughout (framer-motion + tailwindcss-animate already present).
7. **Global filter** — consistent filter UX across listing pages (ties to the Phase-A product-level filter backend).

### B. Feature / page completeness (audit each — works correctly?)
- **Cart, Wishlist, Compare** — full flows.
- **Checkout page + Add-to-cart page** — review + polish (also where payment from backend Phase C lands).
- **Campaign, Flash sale, Offer, Coupon** — verify they display + apply correctly (ties to backend resolver + Phase E promo).
- **Order tracking** — verify end-to-end.

### C. Technical / non-functional
8. **Storefront theme system (like Admin V2):** ALL buttons/components from **shadcn**, ZERO hardcoded classes/colors — everything via **global theme classes/CSS variables**, so changing the theme color recolors the whole storefront. ⚠️ Verified: ~278 hardcoded-color occurrences (hex or `bg-red-500`-style) today → all must move to theme vars. radix + tailwind-merge already present (shadcn-ready). Mirror the storefront's existing ThemeStyleInjector approach ([[default-site-theme]]) so PDP-theme + global-theme are one system. + day/night.
9. **Multi-language** — i18next, BN + EN first (mirror Admin V2). All strings via keys.
10. **Performance / fetching strategy (BIG):** decide per route — where **SSR vs SSG vs ISR**, where to **cache**, where **Redux** (client cart/UI state) vs **TanStack Query / RTK Query** (server data). Convert over-client'd pages to proper server components where SEO/perf matters (PDP, listings, home). ⚠️ Verified: ~163 `"use client"` vs 12 pages = almost all CSR; Next perf unused. Real audit + refactor, not a tweak.
11. **Codebase cleanup for performance (owner-stated):**
    - **Remove backdated/heavy/duplicate packages.** Verified candidates: `moment` (deprecated + heavy → replace with `dayjs`/`date-fns`), TWO icon libs `react-icons` + `@radix-ui/react-icons` (consolidate to one), `axios` (Next has native fetch — drop unless a real need). 73 deps total — prune unused.
    - **Kill garbage/dead code + bad queries** that drop performance (over-fetching, N+1 client calls, fetching whole lists to show one item, no pagination, refetch storms).
    - **Proper React hooks where needed:** `useMemo`/`useCallback`/`React.memo` for expensive renders + stable props; verified only ~11 of ~163 client components use any memoization today → big re-render optimization headroom. (Apply judiciously — not blanket; measure.)
    - Goal: site genuinely **fast** (good Lighthouse / Core Web Vitals).
12. **Analytics correctness:** verify **Meta Pixel + Conversion API, GTM, GA4** fire correctly (page view, add-to-cart, purchase) — pair with backend Meta Purchase events.
13. **Security review** — XSS (dangerouslySetInnerHTML in rich text/PDP), auth-cookie handling, no secret leakage to client bundle, input validation, safe external embeds (YouTube video_link).

## Why it's big (honest)
Three things stacked: (1) a visual redesign of most pages, (2) a feature-completeness audit, and (3) a performance/rendering refactor (the 163-client-component problem) + i18n + security. Each is substantial. Best as its own multi-phase feature with a scratch PLAN; likely interleaves with Admin V2 (shared theming approach, same i18n setup).

## Rough phase shape (detail later)
- FV2.0 Foundation: i18next (BN/EN); confirm shadcn token theme (radix already there) shared with admin/storefront theme system ([[default-site-theme]], ThemeStyleInjector); cart-drawer primitive.
- FV2.1 Rendering/data audit: map each route → SSR/SSG/ISR/CSR decision + cache; settle Redux-vs-Query boundaries; convert key pages (home, listings, PDP) to server-first.
- FV2.2 Redesign sweep: home → navbar/footer → listings → user dashboard → cart drawer → animations.
- FV2.3 Feature audit: cart/wishlist/compare/checkout/campaign/flash/offer/coupon/order-tracking each verified + polished.
- FV2.4 Analytics + Security pass: pixel/GTM/GA4 event verification; XSS/auth/secret audit.
- FV2.last: i18n string sweep; perf measure (Lighthouse); final verify.

## Dependencies / ordering
- After backend solid (so data shapes are stable) and ideally after/with Admin V2 (shared i18n + theme-token approach → don't build twice).
- PDP variation selector + filter sidebar (Phase A FE) already landed — V2 polishes/redesigns on top.
- Checkout depends on backend Phase C (payment) being far enough along.

## When starting
Make `.claude/work/frontend-v2/` with a detailed PLAN, get owner approval, go foundation-first ([[feature-work-scratch-folder]]). The rendering/data audit (FV2.1) should likely come early since it shapes everything else.
