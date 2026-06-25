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

## ⭐ Craft-quality additions (independent FE audit, 2026-06-25 — must-lock for the rewrite)

A fresh-context FE/Admin craft audit (verified against current code) found that the rewrite's biggest
risk is **silently regressing things the current app already does well** (esp. SEO), plus a few craft
concerns the plan posed as questions instead of doctrine. Lock these before FV2.1/FV2.2.

### FE-A1. Technical SEO — MUST re-implement, not regress 🔴 (the #1 rewrite risk)
The current app ALREADY ships: `sitemap.js`, `robots.js`, Organization JSON-LD (layout), Product JSON-LD
w/ offers+aggregateRating (PDP), per-page `generateMetadata` from the DB `/page-seo/:key` endpoint, and
slug-history 301. The plan today only says "good Lighthouse/CWV" → **a clean rewrite with no SEO spec
will lose all of it** → a resold shop that de-indexes on rebuild = exactly "low-grade." Re-spec, in App
Router terms:
- `generateMetadata` per route + canonical + `metadataBase`; title/description from the DB page-SEO endpoint.
- JSON-LD: **Product · BreadcrumbList · Organization · WebSite (SearchAction)** (+ aggregateRating where present).
- `sitemap.ts` (products + categories + static) + `robots.ts`.
- **301 from slug-history** — product `product_slug_history` AND the new `category_slug_history` seam (§17c #8).
- OOS / discontinued products → `noindex` or 410, NOT a soft-404.
> Skill: run **seo-audit** on the rebuilt storefront before declaring FV2 done.

### FE-A4. ONE ProductCard + ProductStrip + a canonical ProductCardDTO 🔴
The most-reused unit (card → home/shop/category/search/related; strips popular/trending/flash) has no
single-component + single-DTO contract today (the "popular ≠ popular" strip bug proves the shapes drift).
Lock: **one `<ProductCard variant/density/aspect>`** (driven by tokens §3 — niche differs by token, not by
component) + **one `<ProductStrip>`** + a **canonical `ProductCardDTO` that EVERY list endpoint returns**
(BE shapes it once). Cards never re-map per surface. (Pairs with master §13b shared types + D5 envelope.)

### FE-A5. App-Router data-fetching DOCTRINE (lock the rules, don't re-litigate per route) 🔴
FV2.1 says "decide SSR/SSG/ISR + Redux-vs-Query" — turn that intent into locked rules:
- **RSC by default**; `"use client"` only at interaction leaves (kills the 163-client-component problem at the root).
- **Tag-based revalidation:** storefront pages cache with `revalidate`/`cacheTag`; admin mutations call
  `revalidateTag`/`revalidatePath` on publish → edits go live without `no-store` everywhere (current PDP
  is `no-store` = a perf hole).
- **Request dedupe** via React `cache()` (fixes the known PDP double-fetch).
- **One state-library per data-type:** TanStack/RTK Query = server data; Redux = cart/UI only. NEVER both
  for the same data (the app ships both libs today — this rule prevents the mess).
> Skills: **next-best-practices**, **next-cache-components**, **vercel-react-best-practices**, **tanstack-query**.

### FE-A6. Accessibility baseline 🔴 (zero mention today; part of "not low-grade")
Radix/shadcn give keyboard+ARIA free, but the CUSTOM surfaces break a11y: cart drawer (focus-trap +
restore + Esc + scroll-lock), variation swatches, mega-menu, dropzone, any pointer-only DnD (add a
**keyboard DnD fallback** — pointer-only is inaccessible), `aria-live` for cart/stock/toast, RHF+Zod
errors wired to inputs (`aria-describedby`), visible focus rings that survive the token system, WCAG-AA
contrast enforced by the token palettes.

### FE-A7. Loading / skeleton / error / empty-state contract 🟠 (perceived perf)
Real perf ≠ feels-fast. Spec: route-level `loading.tsx`/`error.tsx`/`not-found.tsx` per group; a shared
`<Skeleton>` matching each card/table; optimistic UI for add-to-cart/wishlist; image LQIP/blur placeholders.
A storefront with content-pop/white-flash reads low-grade regardless of Lighthouse.

### FE-A10. Analytics — a SPEC, not just "verify it fires" 🟠
Add to item 12: **consent gating** (i18n ⇒ international ⇒ GDPR ⇒ no pixel before consent — ties §21.5),
**GTM as the single source** (don't hardcode GA4+Pixel+TikTok+Clarity separately — current drift), one
typed `track(event)` contract reused across surfaces, and preserve **server/browser eventID dedup** through
the rewrite.

### Polish (FE)
- **B1 Image strategy** — `next/image` everywhere w/ explicit `sizes`, AVIF/WebP, `priority` on LCP/hero,
  blur placeholders, env-driven remote-host allowlist; tie aspect/fit to tokens §3.
- **B2 Font + i18n + tokens** — `next/font` is build-time → the curated whitelist (§3) is the bridge from a
  token font-choice to a build-time font set; spec `font-display:swap` + Bangla subset.
- **B5 Cart-drawer edge spec** — focus-trap/restore, scroll-lock, optimistic line edits, stock-clamp echo
  (F1.2 shipped — keep), empty state, mini-cart ↔ full-cart parity.

> See ADMIN_PANEL_V2_PLAN for the admin-side craft additions (server-side TanStack Table, a11y, empty
> states) and PLATFORM_ARCHITECTURE §13b (shared UI/contract lib), §17b i18n-SEO, §14 skill→phase map.

## When starting
Make `.claude/work/frontend-v2/` with a detailed PLAN, get owner approval, go foundation-first ([[feature-work-scratch-folder]]). The rendering/data audit (FV2.1) should likely come early since it shapes everything else.
