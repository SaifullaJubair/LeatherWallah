# Home Page Redesign — Full Implementation Plan
**Date:** 2026-06-06
**Branch:** sprint-3
**Status:** PLANNING — awaiting owner review + edge audit

---

## Scope Summary

3 apps touched: FE (heavy), Admin (none), BE (1 small endpoint).
New components: ~12. Modified components: ~8. Redux: 2 new actions.

---

## Architectural Decisions (LOCKED)

### A. Styling — Tailwind only, no custom CSS classes for layout/color

**Rule:** সব color → `tailwind.config.js` এর existing palette থেকে। Custom CSS শুধু animation keyframes এর জন্য (`globals.css`)।

| Need | Use |
|---|---|
| Brand green | `primary-500` (#1B5E20), `primary-400`, `primary-600` |
| Light green bg | `primary-50`, `primary-100` |
| Warm cream/accent | `accent-DEFAULT` (#EDE0D4), `accent-100` |
| Dark bg (topbar) | `secondary-900` (#1D0E0B) |
| Body text | `text-default` (#1f2937), `text-light` |
| Success/stock | `success-300` (#22C55E) |
| Error/remove | `error-200` (#FF4747) |
| Neutrals | `neutral-50` → `neutral-900` |

**No new colors added to tailwind.config.js.** Existing palette যথেষ্ট।

**globals.css additions — শুধু:**
1. Scroll reveal animation classes (`.reveal`, `.stagger`, `.reveal.in`)
2. Body scroll-lock helper (`.body-lock { overflow: hidden }`)
3. Scrollbar hiding utility for horizontal strips

---

### B. Next.js 16 — Complete Feature Decision Framework

**Installed version: `next@^16.2.6`, `react@^18`** (React 19 নয় — important for feature decisions below)

**Philosophy:** প্রতিটা Next.js feature evaluate করব — use করলে কেন, skip করলে কেন। কোনো feature "কারণ ছাড়া" use বা skip করা হবে না।

---

#### B-0. Next.js 16 Breaking Changes — চেক করতে হবে

Next.js 15+ থেকে `params` এবং `searchParams` এখন **Promise** — `await` ছাড়া access করলে runtime error।

```js
// ❌ Next.js 14 style (breaks in 16)
export default function Page({ params }) {
  const slug = params.slug;  // TypeError in Next.js 16
}

// ✅ Next.js 16 style
export default async function Page({ params }) {
  const { slug } = await params;
}
```

**Home page (`/`) তে params নেই** — তাই home page safe। কিন্তু:
- `/shop/page.jsx` → `searchParams` use করে (VM-1 এ touch করব) → **must await**
- `/category/[...slug]/page.js` → `params` use করে → already fixed in earlier session
- `/products/[slug]/page.js` → `params` use করে → already fixed in earlier session

**Action:** VM-1 (shop page sort param) implement করার সময় `await searchParams` করব।

---

#### B-1. Async Server Components (RSC) — ✅ USED

**কী:** Component function-এ `async` keyword → server-এ await করা যায়, HTML হয়ে আসে। Client-এ কোনো JS hydration নেই।

**কোথায় use করব:**

| Component | কেন server |
|---|---|
| `Home.jsx` | Above-fold data fetch (settings + banner + flash + categories) |
| `SectionRenderer.jsx` | `"use client"` সরিয়ে async server → Suspense boundaries wrap করা যাবে |
| `BestsellersStrip.jsx` | Product list fetch, SEO crawlable |
| `NewArrivalsStrip.jsx` | Product list fetch, SEO crawlable |
| `TrendingStrip.jsx` | Product list fetch, SEO crawlable |
| `TrustStrip.jsx` | Trust points fetch, SEO মে index হবে |
| `FeatureCategoriesSection.jsx` | Category fetch, SEO এর জন্য critical |
| `ReviewsCarousel.jsx` | Reviews fetch, schema markup এর জন্য |

**কোথায় client রাখব:**

| Component | কেন client |
|---|---|
| `NewsletterForm` | `useState`, form submit, toast |
| `SearchDropdown` | `useState`, debounced input, localStorage |
| `CartDrawer` | `useSelector` Redux cart state |
| `FloatingCartBubble` | `useSelector` Redux cart count |
| `QuickViewModal` | `useSelector` Redux ui state |

**বিদ্যমান সমস্যা (fix করব):**
`SectionRenderer.jsx` এখন `"use client"` — সব below-fold product sections client bundle এ যায়। `getBestsellers` fetcher আলাদা করে async server component এ নিয়ে Suspense wrap করলে এই bundle size কমে।

---

#### B-2. ISR — Incremental Static Regeneration — ✅ USED

**কী:** `fetch()` এ `next: { revalidate: N }` → Next.js server-side cache। N সেকেন্ড পর background-এ fresh fetch হয়, পুরানো version serve হতে থাকে (stale-while-revalidate)।

**কেন এখানে perfect:** Home page-এ data frequently বদলায় না — bestsellers list হয়তো 2 মিনিটে একই। ISR মানে প্রতিটা visitor hit করলেই backend এ request যাবে না — Next.js cache serve করবে।

**Revalidation schedule:**

| Data | revalidate | কারণ |
|---|---|---|
| Settings / home layout | 60s | Admin পরিবর্তন → 1 মিনিটে reflect |
| Banner | 300s | Rarely changes |
| Flash sale | 60s | Countdown time-sensitive |
| Feature categories | 300s | Rarely changes |
| Bestsellers / trending / new arrivals | 120s | Sales data, 2min lag acceptable |
| Offers | 60s | Start/end time sensitive |
| Reviews carousel | 300s | Moderation lag OK |
| Trust points / FAQ | 600s | Almost never changes |

**Implementation pattern — সব lib function একরকম:**
```js
// src/components/lib/getBestsellers.js
export async function getBestsellers(limit = 8) {
  try {
    const res = await fetch(`${BASE_URL}/product/top_selling?limit=${limit}`, {
      next: { revalidate: 120 },   // ISR: 2min cache
    });
    if (!res.ok) return null;      // null-return — never throw
    return res.json();
  } catch {
    return null;                   // backend down হলেও page render হবে
  }
}
```

**কেন fetch-level revalidate, route-level `export const revalidate` নয়:**
Route-level revalidate (`export const revalidate = 60` in page.js) সব fetch কে একই TTL দেয়। কিন্তু settings (60s) আর FAQ (600s) আলাদা TTL দরকার। Fetch-level দিলে প্রতিটা data নিজের rhythm এ revalidate হয় — সঠিক approach।

---

#### B-3. React Suspense Streaming — ✅ USED

**কী:** Async server component কে `<Suspense fallback={...}>` দিয়ে wrap করলে — Next.js আগের HTML পাঠায় (fallback সহ), তারপর component ready হলে stream করে পাঠায়।

**কেন home page এ critical:** Above-fold (banner, flash sale) instantly দেখাবে। Below-fold (bestsellers, trending, reviews) stream হয়ে আসবে — skeleton দেখাবে যতক্ষণ data আসছে।

**Implementation:**
```jsx
// SectionRenderer.jsx — server component, NO "use client"
export default async function SectionRenderer({ sections, settings }) {
  const sorted = (sections ?? [])
    .filter(s => s.enabled && !SERVER_SIDE_IDS.has(s.id))
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map(section => {
        switch (section.id) {
          case "bestsellers":
            return (
              <Suspense key={section.id} fallback={<ProductStripSkeleton />}>
                <BestsellersStrip settings={settings} />
              </Suspense>
            );
          case "new_arrivals":
            return (
              <Suspense key={section.id} fallback={<ProductStripSkeleton />}>
                <NewArrivalsStrip settings={settings} />
              </Suspense>
            );
          case "trending_products":
            return (
              <Suspense key={section.id} fallback={<ProductStripSkeleton />}>
                <TrendingStrip settings={settings} />
              </Suspense>
            );
          case "offers_block":
            return (
              <Suspense key={section.id} fallback={<OffersSkeleton />}>
                <OffersBlock settings={settings} />
              </Suspense>
            );
          case "reviews_carousel":
            return (
              <Suspense key={section.id} fallback={<ReviewsSkeleton />}>
                <ReviewsCarousel settings={settings} />
              </Suspense>
            );
          case "trust_strip":
            return (
              <Suspense key={section.id} fallback={<TrustSkeleton />}>
                <TrustStrip />
              </Suspense>
            );
          case "site_faq":
            return (
              <Suspense key={section.id} fallback={null}>
                <SiteFaqSection settings={settings} />
              </Suspense>
            );
          case "brand_story":
            return <BrandStory key={section.id} settings={settings} />;
          case "newsletter":
            return <NewsletterForm key={section.id} settings={settings} />;
        }
        return null;
      })}
    </>
  );
}
```

---

#### B-4. Promise.all Parallel Fetch — ✅ USED

**কী:** `await` এ sequential call না করে `Promise.all([...])` দিলে সব fetch একসাথে fire হয়। Total wait time = slowest single fetch (not sum of all).

**কোথায়:** `Home.jsx` — above-fold এ settings, banner, flash sale, categories সব একসাথে।

```js
// Home.jsx
const [settings, bannerData, flashData, categories] = await Promise.all([
  getServerSettingData().catch(() => null),
  getBanner().catch(() => null),
  getFlashSaleProducts().catch(() => null),
  getFeatureCategories().catch(() => null),
]);
```

**Layout.js তেও:** `getMenu()` আর `getServerSettingData()` এখন sequential — fix করব:
```js
// (frontend)/layout.js
const [menuData, settingData] = await Promise.all([
  getMenu().catch(() => null),
  getServerSettingData().catch(() => null),
]);
```

---

#### B-5. next/font — ✅ ALREADY DONE (no change needed)

**কী:** Google/local fonts Next.js এর optimization দিয়ে load হয় — zero layout shift (CLS=0), self-hosted, preloaded।

**Status:** `src/utils/font.js` তে already `localFont()` ব্যবহার করা হচ্ছে DM Sans, Cormorant Garamond, Yatra One এর জন্য। `Montserrat` Google Fonts থেকে `next/font/google` দিয়ে।

**Action:** কিছু করার নেই — already optimal।

---

#### B-6. next/image with sizes prop — ✅ USED (strictly enforced)

**কী:** `<Image>` component automatic format conversion (WebP/AVIF), lazy loading, blur placeholder, prevents CLS via explicit dimensions।

**Rules এই project এ:**

| Context | sizes prop | priority |
|---|---|---|
| Banner (hero) | `sizes="100vw"` | `priority={true}` — LCP element |
| Product grid 4-col | `sizes="(max-width:768px) 50vw, 25vw"` | lazy |
| Category grid 3-col | `sizes="(max-width:768px) 50vw, 33vw"` | lazy |
| Trust strip icons | `sizes="48px"` | lazy |
| Cart drawer thumb | `sizes="76px"` | lazy |

**Blur placeholder:** Product images — `placeholder="blur"` + `blurDataURL` (server-generated 10px base64) → LCP এর আগে smooth fill দেখাবে, no jarring blank.

**Existing issues fix করব:** অনেক `<Image>` তে `sizes` missing বা `width/height` wrong — সব fix।

---

#### B-7. error.tsx / error.js boundaries — ✅ USED (new)

**কী:** Route segment level এ `error.js` file রাখলে সেই segment crash হলে পুরো page না ভেঙে শুধু সেই অংশ error দেখায়।

**Plan এ missing ছিল। এখন add করছি:**

```
src/app/(frontend)/error.js   ← already exists (global frontend error boundary)
```

কিন্তু home page এর section-level errors Suspense-এ catch হবে। Suspense `fallback` null দিলে failed section gracefully disappear হয় — separate `error.js` দরকার নেই প্রতিটা section এর জন্য।

**Action:** Existing `src/app/error.js` review করব — proper UI আছে কিনা দেখব।

---

#### B-8. loading.js — ⚠️ EVALUATED, NOT USED

**কী:** Route segment এ `loading.js` রাখলে সেই page এর first load এ automatic Suspense boundary হয়।

**কেন use করছি না:**
- `loading.js` পুরো page-level Suspense — মানে page navigate হলে পুরো screen skeleton দেখাবে
- আমরা চাই section-level granular streaming — banner সাথে সাথে দেখা যাবে, bestsellers একটু পরে
- `loading.js` দিলে এই granularity পাওয়া যাবে না
- প্রতিটা `<Suspense>` boundary আমরা manually wrap করছি → বেশি control

**Decision: Skip `loading.js`, use per-section `<Suspense>` directly.**

---

#### B-9. generateStaticParams — ⚠️ EVALUATED, NOT USED FOR HOME

**কী:** Dynamic route (`[slug]`) এর জন্য build time এ static pages generate করে।

**Home page এ applicable কিনা:** না — home page dynamic route নয় (`/`). কিন্তু PDP (`/products/[slug]`) তে already applicable।

**PDP এ status (out of scope for this sprint):**
`src/app/(frontend)/products/[slug]/page.js` তে `generateStaticParams` add করলে popular products build time এ static হয়ে যাবে — zero TTFB। Deferred to Sprint 4.

**Decision: N/A for home. Note for PDP optimization.**

---

#### B-10. Route Segment Config (`export const dynamic`) — ⚠️ EVALUATED, NOT USED

**কী:** Page এ `export const dynamic = "force-static"` বা `"force-dynamic"` লিখলে সেই page এর behavior override হয়।

**কেন use করছি না:**
- `force-static`: Home এ cart count, user state আছে (client) — fully static নয়
- `force-dynamic`: প্রতি request এ fresh fetch — ISR এর benefit হারায়
- Default (no export) = Next.js নিজে decide করে (ISR for server components, real-time for client) — এটাই সঠিক

**Decision: No route segment config override. Let Next.js decide.**

---

#### B-11. React `cache()` — ✅ USED (for dedup)

**কী:** `import { cache } from "react"` → একই request-এ একই function multiple times call হলে result deduplicate হয়।

**কোথায় দরকার:**
`getServerSettingData()` এখন তিনটা জায়গায় call হয়:
1. `(frontend)/layout.js` (for announcement bar)
2. `Home.jsx` (for home_section_array)

এটা duplicate network request। `cache()` wrap করলে একই request এ একবারই fetch হবে।

```js
// src/components/lib/getServerSettingData.js
import { cache } from "react";

export const getServerSettingData = cache(async function () {
  try {
    const res = await fetch(`${BASE_URL}/setting`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
});
```

**Note:** `next/cache`-এর `unstable_cache` vs React `cache()` — React `cache()` per-request dedup, `unstable_cache` cross-request persistent cache। Home page এ per-request dedup যথেষ্ট → `cache()`.

---

#### B-12. next/dynamic (lazy import) — ✅ USED selectively

**কী:** `dynamic(() => import("..."))` → component code-split হয়, initial bundle এ থাকে না। `ssr: false` দিলে server-এ render হয় না।

**কোথায় use করব:**
```js
// QuickViewModal — opens on demand, no need in initial bundle
const QuickViewModal = dynamic(
  () => import("@/components/frontend/quickView/QuickViewModal"),
  { ssr: false }  // purely client-side interaction, Redux-dependent
);

// CartDrawer — same reasoning
const CartDrawer = dynamic(
  () => import("@/components/frontend/cart/CartDrawer"),
  { ssr: false }
);
```

**কেন ssr:false এখানে:**
CartDrawer এবং QuickViewModal দুটোই `useSelector` দিয়ে Redux read করে। SSR এ Redux state নেই (hydration mismatch হবে)। `ssr: false` → client-only, no hydration issue।

**কোথায় use করব না:**
ProductStrip sections → server components হচ্ছে, `dynamic()` এখানে meaningless।

---

#### B-13. Server Actions — ⚠️ EVALUATED, PARTIAL USE

**কী:** Next.js 14 Server Actions → form `action={serverFn}` দিলে API route ছাড়াই server-side mutation হয়।

**Newsletter form তে কি use করব?**
- Current pattern: RTK Query mutation → POST `/subscriber`
- Server Action হলে: `<form action={subscribeAction}>` → direct backend call, no RTK
- **Decision: RTK Query রাখব।** এই codebase এ RTK Query centralized। Server Actions নেওয়া মানে pattern inconsistency। Newsletter form ছোট — benefit কম, inconsistency বেশি।

**কোথায় applicable ভবিষ্যতে:** Checkout (address save) এ Server Actions + Optimistic UI ভালো হতো — Sprint 4 consideration।

---

#### B-14. Parallel Routes / Intercepting Routes — ❌ NOT APPLICABLE

**কী:** `@slot` folder convention দিয়ে একই URL এ multiple parallel views, বা `(.)route` দিয়ে current page এ modal।

**Quick View Modal এ use করব না কেন:**
Intercepting routes (`/products/(.)quick-view/[slug]`) দিলে URL বদলায় — shareable modal URL। কিন্তু:
- Home page এ product click = quick view, not navigate → URL change করা confusing
- V2 design এ in-page modal → Redux state দিয়ে সহজ
- Shareable quick view URL দরকার নেই (PDP এর জন্য আলাদা `/products/[slug]` আছে)

**Decision: Skip. Redux-based modal যথেষ্ট।**

---

#### B-15. Middleware — ⚠️ EVALUATED, NOT USED FOR HOME

**কী:** `middleware.ts` → request আসার আগে intercept, redirect/rewrite/header set করা যায়।

**Home page এ applicable?**
- Auth-gate: Home page public → middleware নেই
- A/B testing: এখন না
- Geo-redirect: এখন না
- Bot detection: Analytics already handles this

**Decision: Not used for home page redesign.**

---

#### B-16. Metadata API (generateMetadata) — ✅ ALREADY DONE

**কী:** Page এ `export async function generateMetadata()` → dynamic `<head>` tags।

**Status:** `src/app/(frontend)/page.js` তে already আছে:
```js
export async function generateMetadata() {
  return buildPageMeta("home");
}
```

`buildPageMeta("home")` → DB থেকে `/page-seo/home` fetch করে → OG tags, title, description set করে।

**Action:** No change needed. Already optimal.

---

#### B-17. Sitemap + Robots — ✅ ALREADY DONE

**Status:** `src/app/sitemap.js` এবং `src/app/robots.js` exist করে। Home page already sitemap এ আছে।

**Action:** No change needed.

---

#### B-18. On-Demand Revalidation — ⚠️ NOTE (not implementing now)

**কী:** `revalidatePath("/")` বা `revalidateTag("banner")` → Admin পরিবর্তন করার সাথে সাথে cache flush হয়।

**কেন এখন না:**
- Admin এ webhook বা API call দরকার যেটা BE route trigger করবে
- এটা Sprint 4 item — Admin "Save" button → POST `/api/revalidate?path=/`
- এখন ISR এর 60-300s lag acceptable

**Deferred to Sprint 4.**

---

#### B-19. `cacheLife` + `cacheTag` (Next.js 15.2+ / 16) — ⚠️ EVALUATED, NOT USED YET

**কী:** Next.js 15.2 থেকে `unstable_cache` replace করে নতুন cache API এসেছে:

```js
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from "next/cache";

async function getSettings() {
  "use cache";           // new directive
  cacheLife("minutes");  // preset: seconds/minutes/hours/days/weeks/max
  cacheTag("settings");  // tag for on-demand revalidation

  const res = await fetch(`${BASE_URL}/setting`);
  return res.json();
}
```

**কেন এখন use করছি না:**
1. এটা এখনো `unstable_` prefix — production-ready নয়
2. `"use cache"` directive experimental feature, `next.config.mjs` এ `experimental: { dynamicIO: true }` লাগে
3. আমাদের `fetch()` + `next: { revalidate: N }` pattern perfectly works — এটা stable API
4. `cacheTag` + `revalidateTag()` এর on-demand benefit আছে কিন্তু Sprint 4 এ Admin webhook এর সাথে করা better

**Decision: Stable `fetch revalidate` use করব। `cacheLife`/`cacheTag` Sprint 4 এ on-demand revalidation এর সাথে evaluate করব।**

---

#### B-20. `after()` API (Next.js 15.1+) — ❌ N/A for home page

**কী:** Response পাঠানোর পর background task চালানো — analytics logging, email queue, etc.

**Home page এ applicable?** না — home page শুধু data দেখায়, কোনো mutation নেই।

**কোথায় future applicable:** Order placement এ `after(() => trackPurchase())` দিলে checkout response block না করে analytics পাঠানো যাবে।

---

#### B-21. `connection()` API (Next.js 15+) — ❌ N/A

**কী:** Server component-এ `await connection()` call করলে সেই component dynamic rendering এ force হয়।

**কেন N/A:** আমরা ISR চাই, dynamic নয়। `connection()` ব্যবহার করলে cache হবে না।

---

#### B-22. Turbopack (Next.js 15+ default dev bundler) — ⚠️ AWARENESS NOTE

**Status:** `next dev` এখন Turbopack দিয়ে চলে (Next.js 16 এ default)। Production build এ webpack এখনো।

**Memory থেকে:** Turbopack stale chunk issue আছে — edited client component dev-এ পুরানো version render করে। Fix = new filename, not cache clear.

**Action during coding:** যদি কোনো client component edit করার পর পুরানো UI দেখায়, file rename করব।

---

#### Summary — What We're Using and Why

| Feature | Status | Reason |
|---|---|---|
| Async Server Components | ✅ Used | Product data server-rendered, SEO crawlable, no client JS |
| ISR (fetch revalidate) | ✅ Used | Cached responses, backend not hit per-visit |
| React Suspense streaming | ✅ Used | Above-fold instant, below-fold streams with skeleton |
| Promise.all parallel | ✅ Used | No waterfall — layout.js + Home.jsx উভয়েই |
| next/font | ✅ Already done | Zero CLS fonts, self-hosted local woff2 |
| next/image + sizes | ✅ Enforced | WebP, lazy, no CLS, blur placeholder, LCP priority on banner |
| React cache() | ✅ Used | Dedup getServerSettingData() — layout + page দুজনেই call করে |
| next/dynamic ssr:false | ✅ Used | CartDrawer + QuickViewModal code-split, no hydration issue |
| error.js boundary | ✅ Reviewed | Existing global boundary adequate; section errors → Suspense null fallback |
| generateMetadata | ✅ Already done | DB-driven SEO meta via buildPageMeta("home") |
| Next.js 16 await params/searchParams | ✅ Required | shop/page.jsx এ searchParams await করব (VM-1) |
| loading.js | ⚠️ Skip | Per-section Suspense gives more granular control |
| generateStaticParams | ⚠️ Deferred | PDP optimization — Sprint 4 |
| Route segment config | ⚠️ Skip | Default behavior correct; ISR per-fetch more granular |
| Server Actions | ⚠️ Skip | RTK Query canonical; consistency > marginal gain |
| cacheLife / cacheTag | ⚠️ Deferred | `unstable_` prefix, Sprint 4 with on-demand revalidation |
| after() API | ⚠️ Deferred | Useful for checkout analytics, not home page |
| Parallel/Intercepting routes | ❌ N/A | Redux modal sufficient, no URL change needed |
| Middleware | ❌ N/A | No auth-gate/geo/AB for home |
| On-Demand Revalidation | ⚠️ Deferred | Sprint 4 — Admin "Save" → revalidateTag() |
| connection() API | ❌ N/A | Would disable ISR — opposite of what we want |
| Turbopack | ⚠️ Awareness | Dev bundler (default in 16); stale chunk fix = file rename |

---

#### Existing lib function fixes (MUST DO before coding sections)

`getBanner.js` এবং `getServerSettingData.js` এখন `throw` করে — backend down থাকলে build break। **সব null-return pattern এ convert করব:**

```js
// BEFORE — breaks build when backend is down
if (!res.ok) throw new Error("Banner fetching error!");

// AFTER — build-safe, graceful degradation
if (!res.ok) return null;
```

এই fix ছাড়া ISR/Suspense এর কিছু থেকে benefit নেই — uncaught throw সব ভাঙবে।

---

### C. Mobile-First Design Rules

**70-80% users are mobile.** Every component designed mobile-first, desktop enhanced.

| Pattern | Mobile | Desktop |
|---|---|---|
| Product grid | `grid-cols-2` | `grid-cols-4` |
| Hero | Single column (image on top, text below) OR full-width slider | Split 55/45 |
| Category grid | `grid-cols-2` | `grid-cols-3` or `grid-cols-6` |
| Trust strip | `grid-cols-2` | `grid-cols-4` |
| Offers | `grid-cols-1` | `grid-cols-3` |
| Cart Drawer | Full width (`w-full`) | `max-w-[440px]` |
| Quick View | Full screen bottom sheet | Split modal dialog |
| Search dropdown | Full width, top of screen | Positioned below input |
| Navbar | Hamburger + logo + cart icon only | Full nav with search + links |
| Font sizes | `text-sm` base, `text-2xl` headers | `text-base`, `text-4xl` |
| Touch targets | Min `44px` height on all tappable elements | Standard |
| Horizontal strips | `overflow-x-auto` scroll (snap) | Grid |

**App-style feel:**
- No hover-only interactions — touch-friendly alternatives for everything
- Bottom nav for primary navigation (already exists)
- Cards: slightly elevated (`shadow-sm`), rounded (`rounded-xl`), no sharp borders
- Tap feedback: `active:scale-95 transition-transform` on interactive cards
- Smooth transitions everywhere: `transition-all duration-200`
- Section spacing: `py-6 md:py-12` (compact mobile, breathable desktop)

---

### D. Performance Rules

1. **Images:** All `next/image` with `sizes` prop — no missing sizes warning
2. **Product images:** `sizes="(max-width: 768px) 50vw, 25vw"` for 4-col grids
3. **Banner:** `priority` prop on first slide image (LCP element)
4. **Fonts:** Already loaded via Google Fonts in globals.css — no change
5. **Swiper:** Import only used modules (`Navigation`, `Autoplay`, `Pagination`) — already doing this
6. **Lazy sections:** Below-fold client components wrapped in `Suspense` with skeleton fallback
7. **No layout shift:** All image containers have explicit aspect ratios (`aspect-[3/4]`, `aspect-[16/9]`)
8. **Skeleton loaders:** Every client-fetched section shows skeleton while loading (not blank)

---

### E. Animation Rules (app-style, not heavy)

- **Scroll reveal:** IntersectionObserver, `opacity 0→1` + `translateY 20px→0`, 400ms ease-out
- **Stagger:** Section children delay 60ms each (max 6 items staggered, rest instant)
- **Card hover (desktop only):** `group-hover:scale-105` on image, `group-hover:shadow-md` on card
- **Card tap (mobile):** `active:scale-95` — subtle press feel
- **Transitions:** `duration-200` standard, `duration-300` for modals/drawers
- **No:** parallax, sparkles, heavy JS animations, CSS-only keyframes beyond reveal
- **Respect:** `prefers-reduced-motion: reduce` — disable all reveals, use instant transitions

---

## Track Overview

| Track | What | Effort |
|---|---|---|
| **B. Global Search** | Navbar search dropdown 3-tier | ~6-8h |
| **C. View More routing** | /shop?sort= links from strips | ~2-3h |
| **H1. Home Redesign** | Full home page visual overhaul | ~20-25h |
| **Cart Drawer** | Floating bubble + slide-out drawer | ~4-5h |
| **Quick View Modal** | Product modal from card click | ~5-6h |

**Total estimate: ~37-47h**

---

## Part 1 — Backend (minimal)

### BE-1: `GET /product/new_arrival` endpoint
**File:** `FruitSnacksBackend/src/app/product/product.routes.ts` + controllers + services

**Status:** Already exists (`/product/new_arrival?page=1&limit=8`) — confirmed in routes.
**Action:** No BE work needed here. ✅

### BE-2: Verify `GET /category/feature_category` returns correct shape
**File:** `FruitSnacksBackend/src/app/category/category.routes.ts`

**Status:** Route exists (`/category/feature_category`). Returns categories with `feature_category_show: true`.
**Action:** Read response shape when FE needs it. No change expected.

### BE-3: Verify `GET /trust-point` public endpoint
**File:** `FruitSnacksBackend/src/app/trustPoint/trustPoint.routes.ts`

**Status:** `GET /` is public (no verifyToken). ✅
**Action:** None.

**BE total: 0 new code** — all endpoints already exist.

---

## Part 2 — Redux (cartSlice changes)

### RX-1: Add `cartDrawerOpen` state + actions to cartSlice

**File:** `FruitSnacksFrontend/src/redux/feature/cart/cartSlice.js`

**Add to state:**
```js
cartDrawerOpen: false,
```

**Add to reducers:**
```js
openCartDrawer: (state) => { state.cartDrawerOpen = true; },
closeCartDrawer: (state) => { state.cartDrawerOpen = false; },
```

**Export from slice** and add to store exports.

### RX-2: Add `quickViewProduct` state + actions to a new slice

**File:** `FruitSnacksFrontend/src/redux/feature/ui/uiSlice.js` (new file)

```js
// uiSlice.js
const uiSlice = createSlice({
  name: "ui",
  initialState: { quickViewProduct: null },
  reducers: {
    openQuickView: (state, action) => { state.quickViewProduct = action.payload; },
    closeQuickView: (state) => { state.quickViewProduct = null; },
  },
});
```

Wire into `store.js`.

---

## Part 3 — New Lib Functions

### LIB-1: `getTrustPoints.js`

**File:** `FruitSnacksFrontend/src/components/lib/getTrustPoints.js`

```js
export async function getTrustPoints() {
  try {
    const res = await fetch(`${BASE_URL}/trust-point`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
```

### LIB-2: `getFeatureCategories.js`

**File:** `FruitSnacksFrontend/src/components/lib/getFeatureCategories.js`

```js
export async function getFeatureCategories() {
  try {
    const res = await fetch(`${BASE_URL}/category/feature_category`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
```

---

## Part 4 — globals.css CSS Variables

**File:** `FruitSnacksFrontend/src/app/globals.css`

Add to `:root`:
```css
/* Home page design tokens — used by floating elements, hero blob */
--brand-primary:    #2D5F3F;
--brand-accent:     #C97B3D;
--brand-bg:         #FAF6EE;
--brand-parchment:  #F2EBDB;
--brand-ink:        #1A2820;
--overlay:          rgba(0, 0, 0, 0.45);
--shadow-float:     0 8px 40px rgba(0,0,0,0.18);
```

---

## Part 5 — Cart Drawer + Floating Bubble

### CART-1: `FloatingCartBubble.jsx` (NEW)

**File:** `FruitSnacksFrontend/src/components/frontend/cart/FloatingCartBubble.jsx`

```
"use client"

Position: fixed, right: 0, top: 50%, translateY(-50%)
Shape: white pill, rounded-l-2xl, shadow-lg
Content:
  - Cart icon (🛍 or bag SVG)
  - Count badge (green circle, top-right of icon)
  - Subtotal amount (below icon, formatted ৳X,XXX)
Visibility: hidden when cartCount === 0
Click: dispatch(openCartDrawer())
Animation: opacity+translateX fade-in when cartCount goes 0→1
```

**Reads from Redux:**
```js
const cartCount = useSelector(selectCartCount);
const subtotal  = useSelector(selectCartSubtotal);
const dispatch  = useDispatch();
```

**Tailwind classes:**
```
fixed right-0 top-1/2 -translate-y-1/2 z-40
bg-white rounded-l-2xl shadow-lg px-3 py-3
flex flex-col items-center gap-1
transition-all duration-300
```

### CART-2: `CartDrawer.jsx` (NEW)

**File:** `FruitSnacksFrontend/src/components/frontend/cart/CartDrawer.jsx`

**Structure:**
```
"use client"

<>
  {/* Scrim */}
  <div onClick={closeCartDrawer} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 ..." />

  {/* Drawer */}
  <aside className="fixed top-0 right-0 bottom-0 w-[92%] max-w-[440px] bg-white z-50
                    flex flex-col shadow-2xl
                    translate-x-full open:translate-x-0 transition-transform duration-300">

    {/* Header */}
    <div className="flex items-center justify-between px-6 py-5 border-b">
      <span>আপনার ব্যাগ <span className="count-pill">{cartCount}</span></span>
      <button onClick={closeCartDrawer}><XIcon /></button>
    </div>

    {/* Free shipping bar */}
    {cartCount > 0 && (
      <div className="px-6 py-3 bg-gray-50 text-sm">
        {toGo > 0
          ? <>আপনি <b>৳{toGo}</b> দূরে ফ্রি ডেলিভারি থেকে</>
          : <>✓ ফ্রি ডেলিভারি আনলক হয়েছে</>}
        <div className="progress-bar"><div style={{ width: pct + "%" }} /></div>
      </div>
    )}

    {/* Items — scrollable */}
    {cartCount === 0 ? <EmptyCartState /> : (
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {items.map(item => <CartItem key={item.key} item={item} />)}
      </div>
    )}

    {/* Footer */}
    {cartCount > 0 && (
      <div className="px-6 py-5 border-t bg-white">
        <div className="flex justify-between mb-1">
          <span>সর্বমোট</span>
          <span className="font-bold text-xl">৳{subtotal.toLocaleString("bn-BD")}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mb-4">
          <span>ডেলিভারি</span>
          <span>চেকআউটে হিসাব হবে</span>
        </div>
        <Link href="/checkout" onClick={closeCartDrawer}
          className="w-full h-14 rounded-full bg-primary-600 text-white font-bold
                     flex items-center justify-center gap-2 hover:bg-primary-700 transition">
          চেকআউট <ArrowIcon />
        </Link>
        <button onClick={closeCartDrawer}
          className="w-full text-center text-sm text-gray-400 mt-3 hover:text-gray-700">
          কেনাকাটা চালিয়ে যান
        </button>
        <p className="text-center text-xs text-gray-300 mt-3">
          🔒 bKash · Nagad · Visa · COD
        </p>
      </div>
    )}
  </aside>
</>
```

**CartItem sub-component (inline):**
```
[product thumb 76×92]  [Product Name]              [×]
                        variant string (size·color)
                        [−] [qty] [+]    ৳price×qty
```

**Reads from Redux:** `cartSlice.items`, `cartSlice.cartDrawerOpen`
**Dispatches:** `closeCartDrawer()`, `updateQty()`, `removeItem()`

### CART-3: Mount in layout

**File:** `FruitSnacksFrontend/src/app/(frontend)/layout.js`

```jsx
import CartDrawer from "@/components/frontend/cart/CartDrawer";
import FloatingCartBubble from "@/components/frontend/cart/FloatingCartBubble";

// Inside layout render:
<CartDrawer />
<FloatingCartBubble />
```

### CART-4: Navbar cart icon — change to Link

**File:** `FruitSnacksFrontend/src/components/shared/navbar/Navbar.jsx` (find actual file)

```jsx
// BEFORE (probably a button that dispatches something)
<button onClick={openCart}>...</button>

// AFTER — direct link to checkout
<Link href="/checkout" aria-label="চেকআউট">
  <BagIcon />
  {cartCount > 0 && <span className="count-badge">{cartCount}</span>}
</Link>
```

---

## Part 6 — Quick View Modal

### QV-1: `QuickViewModal.jsx` (NEW)

**File:** `FruitSnacksFrontend/src/components/frontend/quickView/QuickViewModal.jsx`

**Structure:**
```
"use client"

<dialog> or <div role="dialog">
  ┌─ Scrim (backdrop) ─────────────────────────────┐
  │ ┌─ Modal (max-w-4xl, max-h-[90vh]) ──────────┐ │
  │ │ [×] close btn                               │ │
  │ │                                             │ │
  │ │  LEFT (gallery)    │  RIGHT (detail)        │ │
  │ │  ──────────────    │  ────────────────────  │ │
  │ │  Main image        │  Category eyebrow      │ │
  │ │  (aspect-[3/4])    │  Product name (Bangla) │ │
  │ │                    │  ★★★★☆ 4.3 · 127       │ │
  │ │  [t1][t2][t3][t4]  │  ৳৪৫০  ~~৬০০~~  -25%  │ │
  │ │  (4 thumbs)        │                        │ │
  │ │                    │  [Variant pills]        │ │
  │ │                    │  [Size pills + price]   │ │
  │ │                    │                        │ │
  │ │                    │  🟢 স্টকে আছে · ২৪টি  │ │
  │ │                    │                        │ │
  │ │                    │  [−] [2] [+]           │ │
  │ │                    │  [Add to bag — ৳৯০০]   │ │
  │ │                    │                        │ │
  │ │                    │  [♡] [↑ Share]         │ │
  │ │                    │  [Attributes grid]     │ │
  │ │                    │  [Trust badges]        │ │
  │ │                    │  View full details →   │ │
  └─└─────────────────────────────────────────────┘─┘
```

**Data source:**
- Modal opens with product object from card (already in memory)
- Gallery: `product.main_image` + `product.other_images[]` (up to 4)
- Variations: `product.variations[]` → size/weight pills
- Attributes: `product.attributes_details[]`
- Rating: `product.rating_count` + `product.rating_avg` (if returned by API)

**State (uiSlice):**
```js
const product = useSelector(state => state.ui.quickViewProduct);
// null = closed, object = open
```

**Behavior:**
- ESC → `dispatch(closeQuickView())`
- Backdrop click → `dispatch(closeQuickView())`
- Body scroll lock when open
- "View full details →" → `router.push("/products/" + product.product_slug)` + close modal
- "Add to bag" → `dispatch(addToCart(...))` + `dispatch(closeQuickView())`
- Mobile: full-screen bottom sheet (not split layout)

### QV-2: Mount in layout

**File:** `FruitSnacksFrontend/src/app/(frontend)/layout.js`

```jsx
import QuickViewModal from "@/components/frontend/quickView/QuickViewModal";
<QuickViewModal />
```

### QV-3: ProductCard — wire up quick view trigger

**File:** Every product strip component (TrendingProduct, LatestProducts, PopularProducts, etc.)

**Change:** Product card click → `dispatch(openQuickView(product))` instead of `<Link href="/products/slug">`

```jsx
// ProductCard
<div onClick={() => dispatch(openQuickView(product))} className="pcard cursor-pointer">
  ...
  <button onClick={(e) => { e.stopPropagation(); dispatch(addToCart(product)); }}>
    Add to bag
  </button>
</div>
```

**"View full details" link inside modal** → navigates to PDP.

---

## Part 7 — Global Search Dropdown (Track B)

### SEARCH-1: `SearchDropdown.jsx` (NEW)

**File:** `FruitSnacksFrontend/src/components/shared/navbar/SearchDropdown.jsx`

**3 states (V1 pattern):**

#### State A — Empty query
```
[🕐 সাম্প্রতিক খোঁজ]
  recent search pills (localStorage, max 5) + [সব মুছুন]

[🔥 জনপ্রিয় খোঁজ]
  popular keyword pills (hardcoded or from trending API)

[🎁 আপনার জন্য]
  mini product row — GET /product/trending_product?limit=4
  [thumb | name | ৳price]  ×4
```

#### State B — Query typed, results found
```
৫টি পণ্য পাওয়া গেছে "বাদাম" এর জন্য
[product thumb | name | ৳price ~~was~~]  × up to 5

[📁 ক্যাটাগরিতে]  (if category name matches)
  📁 নাটস এন্ড সিডস (২৩)

→ "বাদাম" এর সব ফলাফল দেখুন  (→ /shop?search=বাদাম)
```

#### State C — No results
```
🔍 (big icon)
"xyz" পাওয়া যায়নি
চেষ্টা করুন: [popular pills]
```

**API calls:**
- Live product search: `GET /product?search=query&limit=5` (debounced 300ms, RTK Query)
- Recent searches: `localStorage.getItem("fs_recent_searches")` → JSON array
- Trending mini row: `GET /product/trending_product?limit=4` (cached, loaded on mount)
- Category match: client-side filter from cached menu data (already fetched by Navbar)

**Behavior:**
- Input focus → dropdown open
- Click outside / ESC → close
- Pick a result → navigate to `/products/:slug` + save to recent + close
- Pick a keyword pill → set as query
- "সব ফলাফল" → navigate to `/shop?search=query`
- Recent searches: max 5, newest first, deduplicated

### SEARCH-2: Wire into Navbar

**File:** `FruitSnacksFrontend/src/components/shared/navbar/Navbar.jsx` (find actual path)

Replace current search input with:
```jsx
<div className="nav-search relative" ref={searchWrapRef}>
  <SearchBox
    value={query}
    onChange={setQuery}
    onFocus={() => setSearchOpen(true)}
    placeholder={rotatingPlaceholder}
  />
  {searchOpen && (
    <SearchDropdown
      query={query}
      onClose={() => setSearchOpen(false)}
      onPick={(val) => { setQuery(val); setSearchOpen(false); }}
    />
  )}
</div>
```

---

## Part 8 — Home Page Section Redesign (H1)

### H1-1: Fix `BannerItem.jsx` — null guard

**File:** `FruitSnacksFrontend/src/components/frontend/home/banner/BannerItem.jsx`

```jsx
// Add before Swiper render:
if (!bannerData?.length) return null;
```

### H1-2: Rewrite `FeatureCategories` (new design)

**File:** `FruitSnacksFrontend/src/components/frontend/home/featureCategories/FeatureCategoriesSection.jsx` (new name, server component)

**Design:**
```
Section header: "বিভাগ অনুযায়ী কেনাকাটা"

Grid: 3-col desktop, 2-col mobile
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  [cat image] │ │  [cat image] │ │  [cat image] │
│  ──────────  │ │  ──────────  │ │  ──────────  │
│  Cat Name    │ │  Cat Name    │ │  Cat Name    │
│  → Shop Now  │ │  → Shop Now  │ │  → Shop Now  │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Server component** — fetches `GET /category/feature_category` via `getFeatureCategories()`.
Mount in `Home.jsx` (not SectionRenderer) for SSR/SEO benefit.

### H1-3: New `TrustStrip.jsx`

**File:** `FruitSnacksFrontend/src/components/frontend/home/trustStrip/TrustStrip.jsx`

**Design:**
```
4-col grid (2-col mobile), border dividers between cells

[🌿 icon]      [🚚 icon]      [↩ icon]      [💳 icon]
১০০% খাঁটি   দ্রুত ডেলিভারি  ৭ দিন রিটার্ন  ক্যাশ অন ডেলিভারি
সরাসরি উৎস   ঢাকায় ২ঘণ্টা   ঝামেলামুক্ত   নিরাপদ পেমেন্ট
```

**Data source:** `GET /trust-point` via `getTrustPoints()` — client component (TanStack Query).
Falls back to 4 static items if API returns empty.

### H1-4: New `OffersBlock.jsx`

**File:** `FruitSnacksFrontend/src/components/frontend/home/offersBlock/OffersBlock.jsx`

**Design:**
```
Section header: "চলমান অফার"

3-col grid (1-col mobile, 2-col tablet):
┌─────────────────┐
│ [dark overlay   │  tag: "বান্ডল অফার"
│  product image] │  name: "মিক্সড নাটস বক্স"
│                 │  Save ৳২০০
│  → অফার দেখুন  │
└─────────────────┘
```

**Data:** `GET /offer` (public) → filter `offer_status: "active"` → max 6.
**Hidden** if API returns 0 active offers.
Client component (TanStack Query).

### H1-5: Fix `PopularProducts.jsx` label

**File:** `FruitSnacksFrontend/src/components/frontend/home/popularProducts/PopularProducts.jsx`

Current bug: title says "New Arrival" but data is `top_selling`. Fix:
```jsx
// Change h2 text from "New Arrival" to "বেস্টসেলার"
```

### H1-6: Redesign `PromotionalBanner.jsx` — remove leather copy

**File:** `FruitSnacksFrontend/src/components/frontend/home/promotionalBanner/PromotionalBanner.jsx`

Replace hardcoded "Imported Genuine Leather" copy with settings-driven content.
If `settings.promo_banner_image` exists → show image banner.
Else → show a generic "আমাদের সেরা কালেকশন" CTA block.
If both empty → `return null`.

### H1-7: Rewrite `FeatureService.jsx` → use TrustStrip

**File:** `FruitSnacksFrontend/src/components/frontend/home/featureService/FeatureService.jsx`

Replace with import of `TrustStrip` (or just delete and update SectionRenderer mapping):
- `feature_service` ID in SectionRenderer → now renders `TrustStrip`

### H1-8: Update `Home.jsx` — add server-side fetches

**File:** `FruitSnacksFrontend/src/components/frontend/home/Home.jsx`

```jsx
// Add server-side fetches
const [settingsRes, categoriesRes, trustPointsRes] = await Promise.all([
  getServerSettingData().catch(() => null),
  getFeatureCategories().catch(() => null),
  // trust points — client side is fine, skip here
]);

const settings   = settingsRes?.data?.[0] ?? null;
const categories = categoriesRes?.data   ?? [];

// Pass to children
<FeatureCategoriesSection categories={categories} />
```

### H1-9: Update `SectionRenderer.jsx` — remap IDs

**File:** `FruitSnacksFrontend/src/components/frontend/home/SectionRenderer.jsx`

Update `SECTION_COMPONENTS` map:
```js
feature_service: TrustStrip,       // was FeatureService
trust_strip:     TrustStrip,       // alias
offers_block:    OffersBlock,       // new
feature_categories: null,          // handled server-side in Home.jsx, skip here
```

---

## Part 9 — View More Routing (Track C)

### VM-1: Add `?sort=` param handling to `/shop` page

**File:** `FruitSnacksFrontend/src/app/(frontend)/shop/page.js` (find actual path)

Read `searchParams.sort` → map to API param:
```js
const SORT_MAP = {
  popular:     "top_selling",
  new:         "new_arrival",
  trending:    "trending_product",
  bestsellers: "top_selling",
};
```

### VM-2: Update "View More" / "সব দেখুন" links in strips

Each product strip section:
```jsx
// TrendingProduct
<Link href="/shop?sort=trending">সব দেখুন →</Link>

// LatestProducts (new arrivals)
<Link href="/shop?sort=new">সব দেখুন →</Link>

// PopularProducts (bestsellers)
<Link href="/shop?sort=bestsellers">সব দেখুন →</Link>
```

---

## Part 10 — Mobile-specific

### MOB-1: Verify `BottomNav` cart icon

**File:** Find existing BottomNav component.
Cart icon in BottomNav → `Link href="/checkout"` (same rule as navbar).

### MOB-2: Mobile search overlay

Current search: input in navbar.
On mobile (< md): search input tap → full-screen search overlay (keyboard focus auto).
Implementation: `MobileSearch` component — similar to V2's MobileSearch.

---

## Part 11 — Animation system

**File:** `FruitSnacksFrontend/src/components/lib/useReveal.js` (new utility)

```js
// Lightweight IntersectionObserver scroll reveal
export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll(".reveal, .stagger");
    if (reduce) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          if (en.target.classList.contains("stagger")) {
            [...en.target.children].forEach((ch, i) => {
              ch.style.transitionDelay = (i * 0.06) + "s";
            });
          }
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  });
}
```

Add to `globals.css`:
```css
.reveal { opacity: 0; transform: translateY(20px); transition: opacity .5s ease, transform .5s ease; }
.reveal.in { opacity: 1; transform: none; }
.stagger > * { opacity: 0; transform: translateY(16px); transition: opacity .4s ease, transform .4s ease; }
.stagger.in > * { opacity: 1; transform: none; }
```

---

## Part 12 — Files Checklist

### New files (create)
| File | Type | Part |
|---|---|---|
| `src/redux/feature/ui/uiSlice.js` | Redux slice | RX-2 |
| `src/components/lib/getTrustPoints.js` | Lib | LIB-1 |
| `src/components/lib/getFeatureCategories.js` | Lib | LIB-2 |
| `src/components/frontend/cart/CartDrawer.jsx` | Component | CART-2 |
| `src/components/frontend/cart/FloatingCartBubble.jsx` | Component | CART-1 |
| `src/components/frontend/quickView/QuickViewModal.jsx` | Component | QV-1 |
| `src/components/frontend/home/trustStrip/TrustStrip.jsx` | Component | H1-3 |
| `src/components/frontend/home/offersBlock/OffersBlock.jsx` | Component | H1-4 |
| `src/components/frontend/home/featureCategories/FeatureCategoriesSection.jsx` | Component | H1-2 |
| `src/components/shared/navbar/SearchDropdown.jsx` | Component | SEARCH-1 |
| `src/components/lib/useReveal.js` | Utility | MOB-2 |

### Modified files
| File | Change | Part |
|---|---|---|
| `src/redux/feature/cart/cartSlice.js` | Add cartDrawerOpen + 2 actions | RX-1 |
| `src/redux/store.js` | Add uiSlice | RX-2 |
| `src/app/(frontend)/layout.js` | Add CartDrawer + FloatingCartBubble + QuickViewModal | CART-3, QV-2 |
| `src/app/globals.css` | Add CSS vars + reveal classes | Part 4, Part 11 |
| `src/components/frontend/home/Home.jsx` | Server-side fetch categories | H1-8 |
| `src/components/frontend/home/SectionRenderer.jsx` | Remap IDs | H1-9 |
| `src/components/frontend/home/banner/BannerItem.jsx` | Null guard | H1-1 |
| `src/components/frontend/home/popularProducts/PopularProducts.jsx` | Fix label | H1-5 |
| `src/components/frontend/home/promotionalBanner/PromotionalBanner.jsx` | Remove leather copy | H1-6 |
| `src/components/frontend/home/featureService/FeatureService.jsx` | Replace with TrustStrip | H1-7 |
| Navbar.jsx (find path) | Cart icon → Link, wire SearchDropdown | CART-4, SEARCH-2 |
| Each product strip `.jsx` | Card click → openQuickView | QV-3 |
| `/shop` page | Add sort param handling | VM-1 |
| Strip "সব দেখুন" links | Add ?sort= hrefs | VM-2 |

---

## Part 13 — Implementation Order (dependency-aware)

```
Step 1 (foundation — no deps):
  - globals.css CSS vars + reveal classes
  - getTrustPoints.js + getFeatureCategories.js lib functions
  - uiSlice.js (quickView state)
  - cartSlice.js (cartDrawerOpen + actions)
  - store.js (wire uiSlice)

Step 2 (standalone new components):
  - TrustStrip.jsx
  - OffersBlock.jsx
  - FloatingCartBubble.jsx
  - CartDrawer.jsx

Step 3 (depends on Step 2):
  - layout.js: mount CartDrawer + FloatingCartBubble
  - QuickViewModal.jsx
  - layout.js: mount QuickViewModal

Step 4 (home page rewire):
  - BannerItem.jsx null guard
  - PopularProducts.jsx label fix
  - PromotionalBanner.jsx leather copy remove
  - FeatureCategoriesSection.jsx (new design)
  - Home.jsx server-side fetch update
  - SectionRenderer.jsx ID remap

Step 5 (search):
  - SearchDropdown.jsx
  - Navbar.jsx: wire SearchDropdown + cart Link change

Step 6 (product cards — wire quickView):
  - TrendingProduct, LatestProducts, PopularProducts, etc.

Step 7 (View More routing):
  - /shop page sort param
  - Strip "সব দেখুন" links

Step 8 (polish):
  - useReveal.js + wire .reveal/.stagger classes to section wrappers
  - Mobile search overlay
  - BottomNav cart icon verify
```

---

## Part 14 — Open Questions (resolve before code)

| # | Question | Default if no answer |
|---|---|---|
| Q1 | Floating bubble: show subtotal amount নাকি শুধু icon+count? | Show both (icon + count + subtotal) |
| Q2 | Free shipping threshold: hardcode ৳1500 নাকি settings field add? | Hardcode ৳1500 এখন |
| Q3 | Quick View: "Add to bag" করলে drawer auto-open হবে? | No — bubble appear হবে, drawer manual |
| Q4 | Search: popular keywords hardcode নাকি trending product names থেকে নেব? | Trending product names (live) |
| Q5 | Product card click = Quick View always, নাকি শুধু home page-এ? | Home page only (PDP/shop page-এ direct navigate) |
| Q6 | FeatureCategories: server component (SSR) নাকি client (TanStack Query)? | Server component (SEO benefit) |

---

## Deferred (not this sprint)

- Mobile MegaMenu accordion (Drawer) — exists, keep as-is
- Tweaks panel / theme customizer (V2 luxury feature — skip)
- Compare feature (V2 — skip)
- `just_for_you`, `ecommerce_choice` sections — remain disabled in HOME_SECTION_DEFAULTS
- Admin search config page (popular keywords management)
