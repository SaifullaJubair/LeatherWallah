# Client Sprint 3 — FruitSnacks (Frontend redesign + future design-heavy work)

**Created:** 2026-06-05 (session 24)
**Last revised:** 2026-06-07 (session 30 — Track E/F/G added: route consolidation + listing engine + home + bug fixes)
**Status:** Track D DONE. Tracks E/F/G = PLANNING (scope locked 2026-06-07).
**Branch:** `v2` (continuation).
**Predecessor:** [CLIENT_SPRINT_2.md](CLIENT_SPRINT_2.md)

---

## 🔒 Owner decisions LOCKED

| # | Decision | Why |
|---|---|---|
| **D1** | **Sprint 3 dedicated to design-heavy frontend work** | Sprint 2 = quick wins + backend; Sprint 3 = UI redesign + design-pass items |
| **D2** | **plan-edge-auditor already ran on H1 (2026-06-05)** | Findings documented below; absorbed into the design pass |
| **ST.D1** | **No `/brands` dedicated page** | Client has only 1 brand — not needed now |
| **ST.D2** | **No `/flash-sale` dedicated page** | Flash sale section lives on home only; no separate listing page |
| **ST.D3** | **No `/all-products`, `/all-trending-products`, `/latest-product`, `/top-product`, `/new-arrival`, `/all-ecommerce-product` pages** | All replaced by `/shop?sort=...` params — dead routes get redirects |
| **ST.D4** | **`/campaign/[slug]` kept** | Promo hero + engine — needs own chrome |
| **ST.D5** | **1 shared `ProductListing` engine** | All listing views = same engine, different chrome. Based on Shopify collection model |
| **CRITICAL** | **Anonymous checkout MUST keep working** | Carry-forward from Sprint 1 + 2 |

---

## Sprint 3 scope

### Item 1 — **H1 Frontend home page redesign** (~60-80h Sprint 3 total)

**SCOPE EXPANDED 2026-06-05 (session 24 end):** Sprint 3 is now a real 2-3 week sprint, not a single item. Splits into tracks:

| Track | Doc | Effort | Status |
|---|---|---|---|
| **A. Product Strip API audit + fix** | [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) Part 2 | ~12-15h | 🟡 BE done; FE wired in Track E |
| **B. Global Search 4-tier dropdown** | [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) Part 1 | ~11-13h | 🟡 Deferred to FE redesign |
| **C. View More dedicated routing** | [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) Part 3 | ~3-5h | 🟡 Absorbed into Track E |
| **D. Home Layout Control + redesign** | [SPRINT_3_HOME_LAYOUT_TOGGLES.md](SPRINT_3_HOME_LAYOUT_TOGGLES.md) | ~35-45h | ✅ **DONE** (BE `9e4ec34`, Admin `3f9c629`, FE `8b486f2`) |
| **E. Route consolidation + ProductListing engine** | this doc | ~10-15h | 🔵 PLANNING |
| **F. Home page redesign (short pass)** | this doc | ~8-12h | 🔵 PLANNING |
| **G. Bug fixes (cart + wishlist + critical)** | this doc | ~3-4h | 🔵 PLANNING |

**Order matters:** A → B → C → D. Strip fix is foundation; toggling broken strips just hides the bug.

Bumped estimate trail: 8-12h initial → 10-14h after H1 audit → 35-45h after toggle catalog → **60-80h after search+strip audit scope-out**.

#### What it is

Replace leftover leather-template sections in `src/app/(frontend)/page.js` with fruit-snacks-themed sections matching the PDP aesthetic. Reuse existing data sources (banner, slider, featured categories, trending products, new arrivals, offers, trust points).

#### Audit findings (plan-edge-auditor 2026-06-05)

The auditor surfaced 3 blockers + 4 highs + 5 open questions. Several are now absorbed into Sprint 2 Bucket 0 (BUG-1 to BUG-3). Remaining items below.

**🚨 BLOCKERS (must resolve before code)**

1. **Home page has no `ThemeStyleInjector`** → CSS variables (`--brand-primary`, etc.) undefined → entire visual design breaks if new sections use `var(--brand-primary)`.
   - Owner decision needed: option (a) fetch default theme from BE and inject server-side, OR option (b) hardcode green palette CSS vars in `globals.css`.
   - **Recommendation (audit):** option (b) — simpler, keeps home SSR-zero-JS, matches PDP `mergeTheme` fallback behaviour.

**⚠️ HIGH (likely production bugs without fix)**

2. **"New Arrivals" data source ambiguity** — `LatestProducts.jsx` currently fetches `/product/popular_product` but labels as "New Arrival". No real new-arrivals endpoint exists. Decide: (a) add BE endpoint `/product/new_arrival?sort=createdAt&limit=8`, OR (b) keep `popular_product` and document the alias.
   - **Recommendation:** option (a). New arrivals semantic ≠ popular semantic; mixing causes future confusion.

3. **`BannerItem.jsx` crashes when `bannerData` is null/undefined** (fresh clone) — Swiper with `loop={true}` and zero slides throws. Add `if (!bannerData?.length) return null` before Swiper render.

4. **`CategoryWiseProduct` (`just_for_you_product`) is `"use client"` with `useEffect` fetch** — hurts FCP (Lighthouse Performance ≥ 80 target). Convert to server component OR remove from v2 home.
   - **Recommendation:** convert to server component (`use server` + direct fetch in page.js).

5. **Trust points has no FE lib function** — `GET /api/v1/trust-point` exists on BE, but no `src/components/lib/getTrustPoints.js` wrapper. Trust Grid section in v2 needs this.

**🟡 MEDIUM (rare but worth handling)**

6. `BannerItem.jsx` uses `next/image fill` without `sizes` prop — Lighthouse warns about oversized images on mobile.
7. Offer/`pageSeo.js` marked `noIndex: true` — crawlers won't index offer pages reached from home (intentional but worth knowing).

#### 5 owner decisions needed BEFORE code

| # | Question | Recommendation |
|---|---|---|
| Q1 | **Default theme injection on home page:** option (a) BE-fetched default theme OR option (b) hardcoded green fallback in `globals.css` | (b) — simpler, SSR-zero-JS |
| Q2 | **"New Arrivals" data:** add real BE endpoint OR alias to `popular_product` | (a) — add real endpoint |
| Q3 | **`CategoryWiseProduct` section:** keep + convert to server component OR cut from v2 | Convert to server component (data is valuable) |
| Q4 | **Section ORDER admin-configurable** (admin can reorder sections via Page Content editor)? | Defer to Sprint 4 — adds 2+ days to scope |
| Q5 | **Testimonials section:** include OR skip? If yes, owner provides 3-5 testimonials as static content | Owner to decide at start of Sprint 3 |

#### Proposed section list (v2 home, in render order)

Subject to refinement after Q1-Q5 resolved.

1. **Hero** — banner slider OR full-width hero with announcement bar
2. **Featured categories** — dynamic from `feature_category_show` (BUG-1 of Sprint 2 must be merged first or section is empty)
3. **Trending products** — `/product/trending_product`
4. **Active offers/bundles** — offer cards linking to `/offer/:id`
5. **Brand story / Trust grid** — trust points (new lib function from H1 BLOCKER 5)
6. **New arrivals** — Q2 decision dependent
7. **Testimonials** — Q5 decision dependent; skip if no content
8. **Newsletter / contact CTA** — simple section
9. **Footer** — existing, already updated

#### Acceptance

- Home page loads in <2s on 4G
- No console errors
- All 9 sections render with real data (empty-state self-hide where data missing — pattern from PDP themed sections)
- Mobile + tablet + desktop responsive
- Theme colors match PDP (post Q1 resolution)
- Anonymous user: browse → click product → cart → checkout (Sprint 1 critical flow)
- Lighthouse: Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 90
- View source: all SEO meta tags + JSON-LD present

#### Contract — BE

- (Q2-dependent) Possibly new `/product/new_arrival?sort=createdAt&limit=N` endpoint
- (No other BE work — all data sources already exist)

#### Contract — Admin

- (No admin work initially)
- (Q4-dependent — admin section reorder UI defers to Sprint 4)

#### Contract — FE

- Rewrite `src/app/(frontend)/page.js`
- New components in `src/components/frontend/home/v2/` — keep `home/` for safety transition
- New `src/components/lib/getTrustPoints.js` server lib function
- Default theme CSS vars added to `globals.css` (Q1=b)
- Fix `BannerItem.jsx` empty-state guard
- Convert `CategoryWiseProduct` to server component (Q3)

#### Files

- BE: Maybe `product.routes.ts` + `product.controllers.ts` + `product.services.ts` (Q2-dependent new arrivals endpoint)
- FE:
  - `src/app/(frontend)/page.js` (rewrite)
  - `src/components/frontend/home/v2/` (new folder, 9 section components)
  - `src/components/lib/getTrustPoints.js` (new)
  - `src/app/globals.css` (CSS var defaults)
  - `src/components/frontend/home/banner/BannerItem.jsx` (empty-state guard)
  - `src/components/frontend/home/categoryWiseProduct/CategoryWiseProduct.jsx` (convert to server component OR delete)

---

### Item 2 — **Floating images rethink** (~?, BLOCKED on sketch)

Owner has a new concept for the floating fruit-image placement system. Provides a hand-drawn sketch + discussion before code can start.

Status: **BLOCKED** until sketch arrives. Not estimated.

---

### Item 3 — **PDP refinement pass** (post-H1, ~?)

After H1 ships and owner uses the new home page in production for a few days, common patterns may emerge that benefit the PDP too (typography unification, spacing rhythm, transition consistency). Hold this as a placeholder; design pass triggered after H1 live test.

---

### Item 4 — **Admin section reorder UI (Q4 deferred)** (~6-8h)

If Q4 in H1 turns out to be a YES later, add an admin Page Content style editor for home sections (drag-reorder + toggle on/off). Schema lives in `setting.home_layout` or a new `homeLayout` collection.

---

## Sprint 3 vs Admin 2.0

Sprint 3 is **storefront frontend redesign only**. Admin redesign work is parked in [[admin-2-rebuild-backlog]]:

- CREATE wizard (Item 9)
- Theme create page friendlier (Item 6)
- Theme preview page improve (Item 7)
- Page-Content editor friendlier (Item 12)

Those happen in a separate ground-up Admin 2.0 rebuild, not Sprint 3.

---

## Open before Sprint 3 starts

- [x] Sprint 2 fully shipped + confirmed via code (2026-06-07)
- [ ] Track E/F/G — edge audit before code (auto-trigger: 3+ files + route changes)

---

## Track E — Route consolidation + ProductListing engine (~10-15h)

**Scope locked:** 2026-06-07 (session 30)

### The model (Shopify collection pattern)

```
ProductListing.jsx          ← 1 engine, written once, used everywhere
/shop/page.js               ← hub: sort/search/filter/type all as URL params
/category/[...slug]/page.js ← category chrome (banner + breadcrumb) + engine
/campaign/[slug]/page.js    ← promo hero + engine
```

### URL param contract

| Use case | URL | Engine sort pre-select |
|----------|-----|----------------------|
| All products | `/shop` | `latest` (default) |
| Trending "View More" | `/shop?sort=popular` | `popular` (sold_count desc) |
| Popular "View More" | `/shop?sort=popular` | `popular` |
| New arrivals "View More" | `/shop?sort=latest` | `latest` (createdAt desc) |
| Search results | `/shop?search=premium` | `latest` |
| Combo products | `/shop?type=combo` | `latest` |
| Category | `/category/mens-fashion` | `latest` |
| Category + brand | `/category/mens-fashion?brand=nike` | `latest` |

> **ST.D6 — No `sort=trending` param (owner locked 2026-06-07):** "trending" = `popular` sort (sold_count desc) — same engine sort, no separate endpoint needed. Simpler, no backend contract change.

### Engine — built from `CategoryViewSection.jsx`

**Key discovery (audit):** `CategoryViewSection.jsx` already has URL-sync implemented (`readFiltersFromUrl` + `writeFiltersToUrl` + `router.replace`). No rebuild needed — extend existing logic.

**Current engine API call:** `GET /filter_product?categoryType=${leafSlug}&filterData=...`
- `/category/[slug]` → `leafSlug` = category slug ✅
- `/shop` → `leafSlug` = undefined → **must verify backend behaviour** (BLOCKER 1 resolution below)

**BLOCKER 1 resolution — verify before coding:**
Test `GET /filter_product` without `categoryType` param → if backend returns all products = ✅ engine works for `/shop`. If not, `/shop` needs separate param (e.g. `categoryType=all` or omit param entirely with backend fix).

**Engine props (additive — existing props kept):**
```jsx
<CategoryViewSection
  slug={slug}              // existing — array for category, [] for /shop
  filterData={filterData}  // existing — null/undefined OK for /shop (sidebar empty)
  filterHeadData={filterHeadData}  // existing — null OK for /shop (chips hidden)
  initialSort="popular"    // NEW — pre-select sort from URL param
/>
```

**Sort values (existing engine SORT_OPTIONS — no change needed):**
- `latest` — createdAt desc
- `popular` — sold_count desc  ← "trending" maps here
- `price_asc`, `price_desc`, `rating` — unchanged

**Mobile:** existing drawer already works. Desktop: existing sticky sidebar.

### Dead routes → redirects in `next.config.mjs`

| From | To | Notes |
|------|----|----|
| `/all-products` | `/shop` | |
| `/all-trending-products` | `/shop?sort=popular` | trending = popular sort |
| `/latest-product` | `/shop` | latest = default sort |
| `/top-product` | `/shop?sort=popular` | |
| `/new-arrival` | `/shop` | |
| `/all-ecommerce-product` | `/shop` | |
| `/all-brands` | `/shop` | |

Page files + components deleted after redirects verified.

### Inline fixes from audit (absorb into Track E)

- **BLOCKER 3:** `campaign/[id]/page.jsx` line 31 — `/all-products` → `/shop`
- **HIGH 2:** `shop/page.jsx` update to use engine BEFORE `Shop.jsx` delete
- **HIGH 4:** `app/sitemap.js` — remove dead route entries
- **HIGH 5 (G1 merge):** `CartLoader` in `Providers.jsx` needs `useSelector` to read localStorage cart before DB overwrite — merge with Track G G1 fix

### Home strip "View More" buttons

| Strip | Button target |
|-------|--------------|
| TrendingProduct | `/shop?sort=popular` |
| LatestProducts | `/shop?sort=new` |
| PopularProducts | `/shop?sort=popular` |
| LatestProducts | `/shop` |
| CategoryWiseProduct | `/category/[slug]` |

### Files touched

**Modify:**
- `components/categoryview/CategoryViewSection.jsx` — add `initialSort` prop + `/shop` (no slug) support
- `app/(frontend)/shop/page.jsx` — replace `Shop` import with `CategoryViewSection`, pass URL params
- `app/(frontend)/campaign/[id]/page.jsx` — line 31: `/all-products` → `/shop`
- `next.config.mjs` — add 7 redirects
- `app/sitemap.js` — remove dead route entries
- `components/providers/Providers.jsx` — G1 cart fix (merge from Track G)
- Home strip components — "View More" button URLs

**Delete (after redirects live + verified):**
- `app/(frontend)/all-products/`, `all-trending-products/`, `latest-product/`, `top-product/`, `new-arrival/`, `all-ecommerce-product/`, `all-brands/`
- `components/frontend/seeAllProduct/`, `viewAllTrendingProduct/`, `topBrand/`, `allBrand/`
- `components/frontend/shop/Shop.jsx` (replaced by engine)

**No change needed:**
- `components/categoryview/FilterSection.jsx` — URL sync already works
- `components/categoryview/PriceRangFilter.jsx` — already wired
- `app/(frontend)/category/[...slug]/page.js` — already passes slug+filterData correctly

---

## Track F — Home page short pass (~8-12h)

**Scope locked:** 2026-06-07 (session 30)
**Reference:** PDP themed page aesthetic — same CSS vars, same rhythm

### What changes

1. **Fix `BannerItem.jsx` crash** (B6) — empty-state guard
2. **Default theme CSS vars** in `globals.css` — `--primary`, `--ink`, `--muted` etc.
3. **Strip endpoint verify** — LatestProducts + TrendingProduct on correct endpoints
4. **`CategoryWiseProduct`** → convert to server component
5. **Section spacing** — inherit from CSS vars, consistent rhythm

### What does NOT change

- Layout structure (controlled by admin Home Layout — Track D done)
- Individual section designs — touch only for bugs
- No new sections

### Files touched

- `app/globals.css`
- `components/frontend/home/banner/BannerItem.jsx`
- `components/frontend/home/latestProducts/LatestProducts.jsx`
- `components/frontend/home/trendingProduct/TrendingProduct.jsx`
- `components/frontend/home/categoryWiseProduct/CategoryWiseProduct.jsx`

---

## Track G — Bug fixes (~3-4h)

**Scope locked:** 2026-06-07 (session 30)

### G1 — Guest cart lost on page reload after login (B1) 🔴
**Fix:** `Providers.jsx` mount — if logged in + localStorage has items → run `syncCartAfterLogin()` before DB overwrite.
**Files:** `components/providers/Providers.jsx`, `utils/cartSync.js`

### G2 — Wishlist heart missing remote call on Shop + Category pages (B8) 🟡
**Fix:** Product card heart → call `addToWishlistRemote` / `removeFromWishlistRemote` (already in `utils/wishlistSync.js`).
**Files:** `components/frontend/shop/Shop.jsx` + ProductListing engine (after Track E)

### G3 — `pc_builder` undefined tag type (B4) 🟡
**Fix:** Remove unused reference from `redux/tag-types.js`.

### G4 — Dead files cleanup 🟢
Delete: `oldaddtocarttest.jsx`, `data/products.js`, `data/preOrderList.js`, `data/getCategoriesForntend.js`, `components/lib/getSlider.js` (update imports).

---

## Execution order (Tracks E/F/G)

```
1. Track G — Bug fixes first (small, safe)
2. Track E — Route consolidation + engine (biggest structural change)
3. Track F — Home short pass (after engine done)
```

## Resume notes

**Track D DONE.** Tracks E/F/G scope locked 2026-06-07. Edge audit runs before Track E code starts.
