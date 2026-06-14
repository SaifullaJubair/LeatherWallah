# Owner Test Status — Master Tracker

**Created:** 2026-06-05
**Purpose:** Single source of truth for what's been live-tested vs what's awaiting owner verification. Update this doc every time owner runs a test — mark as ✅ PASSED / ❌ FAILED / 🟡 PARTIAL / ⏸ PENDING.

> Owner's testing rule (memory: [[dont-break-old-tests]]) — when a new bug-fix lands, the test plan for related earlier work must be re-checked too, not just the new fix.

---

## Legend

- ✅ PASSED — owner ran the scenario, behaviour matches expected
- ❌ FAILED — owner ran the scenario, found a regression → file a follow-up
- 🟡 PARTIAL — some scenarios passed, others still pending
- ⏸ PENDING — never run by owner yet
- 🔵 STATIC-VERIFIED — Claude verified at code level only (build / grep / trace), needs real browser/DB to confirm

---

## Summary

| Work area | Code status | Test status |
|-----------|-------------|-------------|
| **Session 40 — Floating images rethink: section-anchored unified model (theme-global floating + per-product override hide/replace/extras). z-index trap removed, reduced-motion guard, admin theme floating manager re-introduced + product Floating tab rebuilt. Migration ran (2 products, 5 floats moved).** | ✅ Shipped session 40 (BE `ccac100` / FE `e9e2cd1` / Admin `796ad16` / docs `0b98cd7`, `dev`/`main`). BE tsc 0 / Admin 0 / FE compiled. Migration LIVE-RAN on dev DB | 🔵 STATIC-VERIFIED — needs owner browser test: theme global floating upload→render; product inherit list hide/replace (scoped, theme intact); extra float on a section; migrated products still float; mobile + reduced-motion |
| **Session 40 — PDP bug-fixes (gallery flash, video lightbox enlarge, sold/view count, admin image preview + per-image remove, video upload modal, disabled-variation hide, read-only SKU) + PDP section reorder (order→video→details→rest)** | ✅ Shipped session 40 (FE `daf31c3`/`b83b0bb`/`8fd7e79`/`341512c`, Admin `303d9ef`/`f2b4416`, BE `7607bd4`, `dev`) | 🔵 STATIC-VERIFIED — needs owner browser test: gallery no-flash + all images in lightbox, video lightbox 80vh, sold/view badges, admin upload preview/remove/video-replace, inactive variation hidden, SKU read-only |
| **Session 40 — FAQ template overhaul: free-text dynamic topic + product-category scope + DB-driven (bootstrap seed, no hardcode) + nested category tree + niche-neutral DB-driven placeholders ({{english_slug}} from custom_fields/nutrition) + unresolved-placeholder PDP auto-hide & admin warn + clickable chips w/ labels + modal reset + live cache invalidation** | ✅ Shipped session 40 (BE `ba7161a`/`c8ce581`/`c74f94f`/`b9503fd`, Admin `9c1f10c`→`9a41c72` chain, FE `8fd7e79`, docs `abd3308`, `dev`/`main`). Bootstrap seeded 6 templates LIVE | 🔵 STATIC-VERIFIED — needs owner browser test: create topic appears in filter live, scope a template to category → suggested on matching product, placeholder chip insert + fill, unresolved placeholder hidden on PDP |
| **Session 39 — Pre-delivery hardening: bootstrap script + admin sidebar 8-group reorg + Settings grouped nav + Feature-Cards gap fix + SEO robots/pageSeo fixes + dynamic-PDP audit + dead-code cleanup** | ✅ Shipped session 39 (BE+Admin+FE+docs, `dev`). Bootstrap LIVE-VERIFIED (ran ok, created super-admin+shop pageSeo) | 🔵 needs owner browser test — admin login via bootstrap, new grouped sidebar (all menus reachable), Settings tabs incl. Feature Cards save, Page SEO /shop+/offer indexable, themed PDP renders |
| **Session 39 — Order Unification Phase B (offer/bundle merge into orders) + GATE 0 security (F012 IDOR + F008 webhook + F009/F007/F011)** | ✅ Shipped session 39 (BE+Admin+FE, committed `dev`) | 🔵 STATIC-VERIFIED (BE tsc 0 / Admin 0 / FE compiled; stale-ref scan 0; needs owner browser test — place offer order guest+logged-in, expired-offer reject, stock decrement, old offer URL redirect) |
| **Session 38 — Order Unification Phase A (future-ready order/orderproduct schema + order_type/currency/pre_discount_total/snapshot/discount_source/vat + admin internal_note & cancel/return reason + order_type filter tab)** | ✅ Shipped session 38 (BE+Admin+FE, committed `dev`) | 🔵 STATIC-VERIFIED (BE tsc 0 / Admin 0 / FE compiled; /test PASS 0 blockers; needs owner browser test — see P1/P2/P3) |
| **Session 37 — Order Status overhaul (on_hold/confirmed/completed) + SMS-on-confirm + COD checkout fixes + tracking redesign** | ✅ Shipped session 37 (BE+Admin+FE, committed `dev`) | 🔵 STATIC-VERIFIED (tsc EXIT 0; needs owner browser+SMS test) |
| **Session 36 — Cart System Overhaul + Quick-Edit Modal** | ✅ Shipped session 36 (BE + FE, no commit yet) | ✅ PASSED (P1/P2/P3 all owner-verified 2026-06-10) |
| **Session 35 — Price resolution end-to-end: flash sale storefront endpoint + home strip flash enrichment + helper.js base fix + ECommerceChoice section** | ✅ Shipped session 35 (BE `f63f336`, FE `9036928`) | ⏸ PENDING |
| **Session 34 — User dashboard full redesign + QuickViewModal portal fix + WishList variant image** | ✅ Shipped session 34 (FE `266792c`) | ⏸ PENDING |
| **Session 33 — FE card polish + helper.js fix** | ✅ Shipped session 33 (FE, no commit yet) | ⏸ PENDING |
| **Sprint 3 Track G — FE Bug Fixes** | ✅ Shipped session 32 (FE `93048d9`) | ⏸ PENDING |
| **Sprint 3 Track E — Route Consolidation + ProductListing engine** | ✅ Shipped session 32 (FE `d30921c`) | ⏸ PENDING |
| **Sprint 3 Track F — Home short pass** | ✅ Shipped session 32 (FE `7567380`) | ⏸ PENDING |
| **Sprint 3 Track D — Home Layout Builder (BE+Admin+FE)** | ✅ Shipped session 30 (BE `9e4ec34`, Admin `3f9c629`, FE `8b486f2`) | ⏸ PENDING |
| Client Sprint Layer 1 BE (7 items) | ✅ Shipped session 19 | ⏸ PENDING |
| Client Sprint Layer 2 Admin (6 items) | ✅ Shipped session 20 | ⏸ PENDING |
| Client Sprint Layer 3 FE (13 items) | ✅ Shipped session 21 | ⏸ PENDING |
| Phase 1 Analytics S4+S5 (1A+1B+1C) | ✅ Shipped session 23 | ⏸ PENDING |
| Group A — PDP polish (Items 1, 2, 3) | ✅ Shipped session 23-cont | ⏸ PENDING |
| Group B — Item 8 Category audit | ✅ Shipped session 23-cont | ⏸ PENDING |
| Group B — Item 11α Pricing resolver | ✅ Shipped session 23-cont | ⏸ PENDING |
| Group B — Item 10 UPDATE round-trip | ✅ Shipped session 23-cont | ⏸ PENDING |
| Sprint 2 — C12 SMS settings runtime read | ✅ Shipped session 25 | ⏸ PENDING |
| Sprint 2 — D15 Wishlist BE wire-up | ✅ Shipped session 25 | ⏸ PENDING |
| Sprint 2 — 11β Coupon BOGO wire-up | ✅ Shipped session 25 | ⏸ PENDING |
| Sprint 2 — H Auth hardening (Admin ForgotPassword + 3 BE fixes) | ✅ Shipped session 25 | ⏸ PENDING |
| Sprint 2 — C13 Storefront Behaviour toggles (13 toggles, all 3 apps) | ✅ Shipped session 26 | ⏸ PENDING |
| Sprint 2 — E20 Dashboard auth gate + widgets + compound index | ✅ Shipped session 27 | ⏸ PENDING |
| Sprint 2 — D18 Admin Create Order POS | ✅ Shipped session 28 | ⏸ PENDING |

**Nothing has been live-tested by owner yet.** All shipped on `v2` branch; no merges to `main`; no deploys.

> ⚠️ **3 bugs fixed inline (BE `11ddee2`, 2026-06-06) before owner browser test:**
> 1. BLOCKER: `postOrder` — returning customer 2nd order with same address → false 400 rejection (modifiedCount → matchedCount)
> 2. WARNING: Dashboard top-selling thumbnail blank (product_thumbnail field → main_image)
> 3. WARNING: `auto_approve_reviews` fresh-DB fallback `?? true` → `?? false` (matches model default)

---

## Test backlog (priority order)

### 🔴 P1 — Smoke test before any deploy (~5 min)

> ⚠️ **Session 34 shipped (2026-06-09): User dashboard full redesign + QuickViewModal portal fix + WishList variant image. New P2 scenarios added below.**

---

### 🟠 P2 — Session 35: Price Resolution + Flash Sale Storefront (2026-06-09)

**BE changed:** `flashsale.services.ts` (new `findActiveFlashSaleStorefrontService` + `ProductModel` import), `flashsale.controllers.ts` (new `findActiveFlashSaleStorefront` handler), `flashsale.routes.ts` (new `GET /active` before `/:_id`), `product.services.ts` (Phase 1-3 from prior sessions: dual-write flash, campaign PDP lookup, 6-strip flash enrichment)
**FE changed:** `getFlashSaleProducts.js` (URL: `flash_sale` → `flash-sale/active`), `FlashSale.jsx` (parallel fetch + currencySymbol prop), `FlashProductSlider.jsx` (full rewrite: `/products/` link, currency prop, flash price math), `SectionRenderer.jsx` (ECommerceChoice added), `helper.js` (`productPrice` + `singleProductPrice` flash base = `variation_price`)

| # | Scenario | Expected | Status |
|---|---|---|---|
| P35.1 | **Flash sale section visible** — create flash sale in admin (status=active, start=now-1h, end=now+24h, add 2+ products) → visit `localhost:3000` → flash sale banner appears with cards + countdown | Section renders from new `/flash-sale/active` endpoint | ⏸ |
| P35.2 | **Flash price % correct** — product `variation_price=1000`, no variation_discount_price; flash_price=20, flash_price_type="percent" → card shows `৳800` with strikethrough `৳1000` | `1000 - 20% = 800` | ⏸ |
| P35.3 | **Flash price fixed correct** — product `variation_price=1000`, `variation_discount_price=900`; flash_price=100, flash_price_type="fixed" → card shows `৳900` not `৳800` (flash applies to 1000, not stacked on 900) | `1000 - 100 = 900` | ⏸ |
| P35.4 | **Flash slider link correct** — click flash product card → goes to `/products/{slug}` not `/{slug}` | `/products/` prefix present | ⏸ |
| P35.5 | **Flash slider currency** — flash product price shows `৳` (from settings) not `$` | Site currency symbol used | ⏸ |
| P35.6 | **Home strip flash price** — product in trending/new arrivals/bestsellers AND in active flash sale → card shows flash price with strikethrough, not regular price | Flash enrichment on strip | ⏸ |
| P35.7 | **ECommerceChoice section renders** — Admin → Site Settings → Home Layout → enable `ecommerce_choice` → Save → visit home → E-Commerce Choice section appears | Section now wired | ⏸ |
| P35.8 | **No active flash → section hidden** — no active flash sale in DB (or all expired) → flash sale banner completely absent from home | Null check works | ⏸ |
| P35.9 | **Flash sale product removed** — flash sale product's `product_status=in-active` → NOT shown in slider (filtered by `product_status: "active"` in storefront query) | Inactive products excluded | ⏸ |
| P35.10 | **PDP flash price** — open PDP of flash product → price shows flash-discounted price; countdown timer shows | PDP dual-write (Phase 1) working | ⏸ |
| P35.11 | **PDP campaign price** — open PDP of campaign product → campaign price shows (Phase 2) | Campaign lookup on PDP working | ⏸ |

---

### 🟠 P2 — Session 34: User Dashboard Redesign + QuickViewModal + WishList (2026-06-09)

**Files changed:** `UserProfile.jsx` (full rewrite — sidebar + mobile bottom nav + More sheet), `Dashboard.jsx` (StatCard rewrite), `PurchaseHistory.jsx` (card wrapper + search), `UserDashboardWishList.jsx` (full rewrite — no Contain/no double PhotoProvider), `Addresses.jsx` (card wrapper), `LoyaltyHistory.jsx` (card wrapper), `WalletHistory.jsx` (card wrapper), `ReviewDashBoard.jsx` (pill switcher), `ShowProfileDetails.jsx` (card wrapper + email section), `ProfileSetting.jsx` (z-70 modal + max-w), `WishList.jsx` (variant image fallback), `QuickViewModal.jsx` (createPortal), `(user-profile)/layout.js` (pb-16 mobile fix), **deleted** `MobileNavBarUserDashBoard.jsx` + `MobileNavBarUserDashBoardClient.jsx`

**Pre-test:** Must be logged in as a registered user. Navigate to `/user-profile`.

| # | Scenario | Expected | Status |
|---|---|---|---|
| P34.1 | **Dashboard overview loads** — visit `/user-profile` → Dashboard tab visible; 5 stat cards show (Cart, Wishlist, Orders, Offer Orders, Reviews); Trending Products grid renders or "no products" state | No crash; stat cards visible | ⏸ |
| P34.2 | **Sidebar sticky on desktop** — open `/user-profile` on desktop (≥1024px); scroll down → sidebar stays fixed on left; tab content scrolls independently | Sidebar stays visible | ⏸ |
| P34.3 | **URL tab deep-link** — visit `/user-profile?tab=wishlist` directly → Wishlist tab is pre-selected, not Dashboard | URL sync works | ⏸ |
| P34.4 | **Tab navigation URL sync** — on desktop: click "Purchase History" in sidebar → URL changes to `?tab=purchase-history`; browser back → returns to previous tab | Router.push works | ⏸ |
| P34.5 | **Mobile bottom nav visible** — open on mobile (≤768px) → bottom bar with 5 icons (Home, Orders, Wishlist, Profile, More) floats above footer | Bottom nav renders | ⏸ |
| P34.6 | **Mobile More sheet** — tap "More" icon → slide-up sheet shows: Addresses, Order Tracking, Loyalty, Wallet, Offer History, Reviews + Sign Out | More sheet opens | ⏸ |
| P34.7 | **More sheet active state** — navigate to Loyalty via More sheet → "More" icon in bottom bar shows as active (primary color) | Active indicator correct | ⏸ |
| P34.8 | **Mobile content not hidden by bottom nav** — on mobile, any tab content (especially Purchase History table) is not cut off at bottom; `pb-16` layout padding keeps it visible | No content hidden by nav | ⏸ |
| P34.9 | **Purchase History tab** — click "Purchase History" → order table renders (or empty state); search input visible; table header and rows styled | No crash; table renders | ⏸ |
| P34.10 | **Wishlist tab — variant image** — open wishlist with a variation product saved → card shows variation's first image (not main_image); fallback to main_image if no variation image | Correct image shown | ⏸ |
| P34.11 | **Wishlist tab — add to cart** — click "Add to Cart" on wishlist item → cart count increments; product added | Cart add works | ⏸ |
| P34.12 | **Addresses tab** — click Addresses → list renders (or "No addresses" empty state); "Add New Address" button visible | No crash | ⏸ |
| P34.13 | **Loyalty Points tab** — click Loyalty Points → balance card shows; ledger table (or "no transactions") renders | No crash | ⏸ |
| P34.14 | **Wallet tab** — click Wallet → balance card shows (৳); ledger renders or empty state | No crash | ⏸ |
| P34.15 | **Offer History tab (via More)** — mobile: More sheet → Offer History → tab content loads | Tab reached, no blank screen | ⏸ |
| P34.16 | **Reviews tab** — click Reviews → pill switcher "To Be Reviewed" / "Review History"; switch between tabs | Both sub-tabs render | ⏸ |
| P34.17 | **Profile Setting tab** — click Profile Setting (sidebar or More sheet) → ShowProfileDetails card shows user info (avatar, name, phone, division, district, address) | Profile info renders | ⏸ |
| P34.18 | **Edit Profile modal** — click "Edit Profile" button → ProfileSetting modal opens centered on viewport with `z-[70]`; scrollable on mobile; not clipped | Modal renders correctly | ⏸ |
| P34.19 | **ProfileSetting modal above More sheet** — if More sheet is open while ProfileSetting modal opens (edge case) → modal (z-70) appears above sheet (z-60) | Z-index order correct | ⏸ |
| P34.20 | **Sign Out** — click Sign Out (sidebar or More sheet) → cookie cleared; redirected to home page | Logout works | ⏸ |
| P34.21 | **QuickViewModal viewport center** — on home page: hover trending product card → click eye icon → modal opens in CENTER of viewport, not inside the card's stacking context | Portal fix works | ⏸ |
| P34.22 | **QuickViewModal from category page** — same test on `/category/[slug]` product cards → modal also opens in viewport center | No regression | ⏸ |
| P34.23 | **User avatar photo view** — on desktop sidebar: click avatar image (if user has photo) → react-photo-view lightbox opens | PhotoProvider from UserProfile.jsx works | ⏸ |
| P34.24 | **Non-logged-in redirect** — visit `/user-profile` without being logged in → redirected to `/sign-in` | Auth guard works | ⏸ |

---

### 🟠 P2 — Sprint 3 Track D shipped (BE `9e4ec34`, Admin `3f9c629`, FE `8b486f2`, 2026-06-06). New P2 scenarios added below.**

---

### 🟠 P2 — Session 33: FE card polish + helper.js fix (2026-06-08)

**Files changed:** `src/components/common/ProductCard.jsx` (new), `src/components/common/ProductCardSkeleton.jsx` (new), `src/components/common/HomeProductCard.jsx` (re-export), `src/components/categoryview/CategoryViewCard.jsx` (re-export), `src/components/frontend/home/categoryWiseProduct/CategoryWiseProduct.jsx` (rewrite), `src/components/frontend/home/latestProducts/LatestProductGrid.jsx`, `src/components/frontend/home/trendingProduct/TrendingSlider.jsx`, `src/components/frontend/home/popularProducts/PopularProducts.jsx`, `src/components/frontend/home/onlyForYouProduct/OnlyForYouProduct.jsx`, `src/components/categoryview/CategoryViewSection.jsx`, `src/components/shared/quickViewModal/QuickViewModal.jsx`, `src/utils/helper.js`

| # | Scenario | Expected | Status |
|---|---|---|---|
| P33.1 | **Home sections hover** — hover over any product card in trending/popular/latest/just-for-you → bottom bar slides up with "Add to Cart" + eye icon | Action bar visible on hover | ⏸ |
| P33.2 | **Quick View opens from home card** — click eye icon on any home section card → QuickViewModal opens with variant picker + price | Modal opens correctly | ⏸ |
| P33.3 | **Video card no white flash** — hover over a product card that has `main_video` → no white flicker; video stays visible; action bar slides over it | No white flash | ⏸ |
| P33.4 | **Crossfade hover** — hover over non-video product with variation/other image → main image fades to hover image | Crossfade works | ⏸ |
| P33.5 | **Category page cards parity** — `/category/[slug]` → product grid cards look identical to home section cards; hover + quick view works there too | No visual regression | ⏸ |
| P33.6 | **Shop by Category — category card size** — home page "Shop by Category" section → category card is noticeably wider/taller than before (2 columns on desktop) | Larger category card visible | ⏸ |
| P33.7 | **Shop by Category — Quick View** — hover over product in Shop by Category slider → Add to Cart + eye icon appear; click eye → modal opens | ProductCard actions work in Swiper slider | ⏸ |
| P33.8 | **helper.js price fix — variation product cards** — variation product (e.g. with multiple sizes/colors) shows correct price on card (first variation's price, not blank/wrong) | Price shows correctly | ⏸ |
| P33.9 | **helper.js discount badge** — variation product with `variation_discount_price` → card shows `-X%` badge and strikethrough original price | Discount badge correct | ⏸ |
| P33.10 | **PDP variation change — price** — open a variation product → change variant (color/size) → price updates immediately | Price changes per variant | ⏸ |
| P33.11 | **PDP variation change — image** — change variant → main image switches to variation_image | Image switches | ⏸ |
| P33.12 | **PDP variation change — video** — pick variant with video → video plays in gallery | Video switches to variation video | ⏸ |
| P33.13 | **QuickViewModal no leather features** — open Quick View on any product → no "Genuine Leather", "Built to Last", "Easy Return", "Cash on Delivery" feature cards visible | Removed correctly | ⏸ |
| P33.14 | **QuickViewModal mobile** — open on mobile (375px) → modal fills screen properly; scroll works; no overflow | Mobile responsive | ⏸ |

---

### 🟠 P2 — Sprint 3 Tracks G/E/F: Bug fixes + Route consolidation + Home pass (session 32, 2026-06-08)

**Commits:** FE `93048d9` (Track G), `d30921c` (Track E), `7567380` (Track F)
**Touches:** FE only — tag-types.js, Providers.jsx, dead file deletes, CategoryViewSection.jsx, shop/page.jsx, next.config.mjs, sitemap.js, 20+ navbar/home/cart/wishlist link fixes, BannerItem.jsx

| # | Scenario | Expected | Status |
|---|---|---|---|
| GEF.1 | **Guest cart preserved on reload** — Add 2 items as guest → log in → immediately reload page → cart still has both items (not wiped) | Guest items merged with DB on reload | ⏸ |
| GEF.2 | **/shop page loads** — Visit `localhost:3000/shop` → product grid with filter sidebar renders; no console error | Filter+grid from engine | ⏸ |
| GEF.3 | **/shop?sort=popular** — Products appear sorted by popularity (best-seller first) | Sort pre-selected from URL | ⏸ |
| GEF.4 | **Dead route redirect** — Visit `/all-products` → browser redirects to `/shop` (301) | Permanent redirect works | ⏸ |
| GEF.5 | **Dead route redirect (trending)** — Visit `/all-trending-products` → redirects to `/shop?sort=popular` | Trending → popular | ⏸ |
| GEF.6 | **Dead route redirect (new arrival)** — Visit `/new-arrival` → redirects to `/shop` | 301 works | ⏸ |
| GEF.7 | **Campaign not-found page** — Visit `/campaign/nonexistent-id` → "Campaign Not Found" page → "View All Products" links to `/shop` | No dead link | ⏸ |
| GEF.8 | **Navbar "All Products" link** — Click "All Products" in desktop navbar → goes to `/shop` | Updated | ⏸ |
| GEF.9 | **Search submit → /shop** — Navbar search: type query → submit → goes to `/shop?search=...` | Updated | ⏸ |
| GEF.10 | **Home Trending strip "View More"** — Click on home trending products "All Trending Product" → goes to `/shop?sort=popular` | Link updated | ⏸ |
| GEF.11 | **Home New Arrival strip "View More"** — Click home new arrivals "All Products" → goes to `/shop` | Link updated | ⏸ |
| GEF.12 | **Banner empty-state** — Fresh DB with no banners → home page loads without crash (previously Swiper loop=true threw error) | Graceful no-render | ⏸ |
| GEF.13 | **Category page still works** — Visit `/category/[any-slug]` → products load with filter sidebar | No regression | ⏸ |
| GEF.14 | **Anonymous checkout regression** — Guest: browse → add to cart → checkout → order placed | Core flow intact | ⏸ |

---

### 🟠 P2 — Sprint 3 Track D: Home Layout Builder (session 30, 2026-06-06)

**Commits:** BE `9e4ec34`, Admin `3f9c629`, FE `8b486f2`
**Touches:** BE setting schema+model+services+routes (60 new fields + home_section_array), siteFaq CRISM module, newsletterSubscriber CRISM+CSV+rate-limit, review/by-ids endpoint, role 7 new RBAC flags; Admin HomeLayoutTab (dnd-kit drag-drop), SiteFaqPage CRUD, NewsletterPage list+export, SettingPage+SettingS+SideNavBar+Route+permissionData; FE Home.jsx (server component rewrite), SectionRenderer (client), BrandStory, ReviewsCarousel, SiteFaqSection, NewsletterForm, ChatWidgetStacker, layout.js, FlashSale+getFlashSaleProducts (null-return fix), getServerSettingData (60s revalidate)

| # | Scenario | Expected | Status |
|---|---|---|---|
| D1.1 | **Admin → Settings → Home Layout tab** — loads without error; 15 section rows visible with drag handles + toggles | Tab renders, all sections listed | ⏸ |
| D1.2 | **Drag-drop reorder** — drag "Trending Products" above "New Arrivals" → Save → FE homepage: trending appears first | Sections reordered within ~60s | ⏸ |
| D1.3 | **Section toggle off** — disable "Newsletter" section → Save → FE home: newsletter form gone | Toggle works end-to-end | ⏸ |
| D1.4 | **Fresh DB backfill** — drop `home_section_array` from settings doc → reload FE → page still shows default sections (BE-side L9 backfill activates) | No crash; defaults render | ⏸ |
| D1.5 | **Site FAQ round-trip** — Admin `/site-faq` → Add FAQ q+a → Save → FE home FAQ accordion shows it | FAQ CRUD + public endpoint works | ⏸ |
| D1.6 | **FAQ toggle inactive** — Admin toggles FAQ status to inactive → FE home: FAQ hidden | Status filter working | ⏸ |
| D1.7 | **Newsletter subscribe** — FE home newsletter form → enter email → Subscribe → "Thank you!" message | Public POST endpoint + form work | ⏸ |
| D1.8 | **Newsletter validation** — submit empty form → shows error (not 500) | Client-side validation | ⏸ |
| D1.9 | **Newsletter rate limit** — same IP submits 11 times in 1 hour → 11th gets 429 error | Rate limiter (10/hr) active | ⏸ |
| D1.10 | **Admin → Newsletter Subscribers** — list shows subscribed emails; Export CSV downloads .csv file | List + CSV export work | ⏸ |
| D1.11 | **Admin Newsletter delete** — delete one subscriber → removed from list | Delete works | ⏸ |
| D1.12 | **Reviews Carousel auto_featured** — Admin Settings Home Layout → reviews_carousel config → mode: `auto_featured` → Save → FE shows 5-star reviews with photos | Auto-featured mode works | ⏸ |
| D1.13 | **Reviews Carousel manual_pick** — enter JSON array of review _ids → FE shows only those reviews | Manual-pick mode works | ⏸ |
| D1.14 | **Brand Story section** — Admin Settings → brand_story config: title + text + image URL → FE home shows brand story block | Brand story renders | ⏸ |
| D1.15 | **Chat Messenger button** — Admin settings → enable Messenger, set page_id → FE bottom-right shows Messenger icon | ChatWidgetStacker works | ⏸ |
| D1.16 | **Permission gate** — role without `site_faq_show` → no "Site FAQ" sidebar link; direct GET returns 403 | RBAC works | ⏸ |
| D1.17 | **Flash sale section still works** — Flash Sale still renders/hides properly on home page | No regression from Home.jsx rewrite | ⏸ |

---

### 🟠 P2 — Sprint 3 Track A: Strip API + Seed Review + Analytics Seed (session 29, 2026-06-06)

**Commits:** BE `9069064`, Admin `ad471bf`, FE `0d685e3`
**Touches:** BE product.services/controllers/routes + productCountHistory model + review model/interface/services/controllers/routes + role model/interface + setting model/interface; Admin StorefrontBehaviourTab + permissionData + ProductListTablePage + SeedReviewPage + Route + SideNavBar; FE all strip consumers (6 files)

**Pre-test:** For seed review RBAC, tick `review_seed_bulk` + `review_seed_manual` on super admin role. For analytics seed, tick `product_update` on super admin role.

#### Strip API migration

| # | Scenario | Expected | Status |
|---|---|---|---|
| S3.1 | **GET /top_selling** — `curl /api/v1/product/top_selling?page=1&limit=8` → products sorted by `sold_count` desc | Field `sold_count` descending; products with 0 sold_count in order at bottom | ⏸ |
| S3.2 | **GET /new_arrival** — `curl /api/v1/product/new_arrival?page=1&limit=8` → products sorted by `createdAt` desc | Newest products first | ⏸ |
| S3.3 | **GET /most_viewed** — `curl /api/v1/product/most_viewed?page=1&limit=8` → products sorted by `view_count` desc | Field `view_count` descending | ⏸ |
| S3.4 | **Deprecated routes still respond** — `curl /api/v1/product/popular_product` + `curl /api/v1/product/ecommerce_choice_product` → both return 200 (backward compat) | No 404 on old routes | ⏸ |
| S3.5 | **Storefront LatestProducts section** — homepage "New Arrival" section shows newest products by creation date (not most-sold) | Semantically correct now | ⏸ |
| S3.6 | **Storefront TopProduct page** (`/top-product`) and ECommerceChoice section — both now show top-selling products | No crash; products load | ⏸ |
| S3.7 | **/top_selling with category_id filter** — `curl /api/v1/product/top_selling?category_id=<id>` → products filtered to that category | Only products in that category returned | ⏸ |
| S3.8 | **Average rating in strip results** — products in strip lists show correct avg rating (only `review_status:"active"` reviews counted — H1 fix) | No inflated ratings from pending/inactive reviews | 🔵 STATIC-VERIFIED |

#### Analytics seed (sold_count / view_count)

| # | Scenario | Expected | Status |
|---|---|---|---|
| S3.9 | **Admin clicks Sold/Views column** — Admin → Products list → click the "Sold/Views" cell on any product → `ProductAnalyticsSeedModal` opens with current values | Modal opens; inputs show current sold_count + view_count | ⏸ |
| S3.10 | **Seed sold_count** — enter 50 in sold_count → Save → product card now shows "50 sold"; check DB `productcounthistories` collection → entry logged | sold_count updated; audit trail written | ⏸ |
| S3.11 | **Dashboard real data unaffected** — seed sold_count/view_count on a product → Dashboard top-selling chart still reads from ORDERS collection, not from sold_count field | Dashboard not polluted by seed data | 🔵 STATIC-VERIFIED |
| S3.12 | **No product_update permission** — limited admin without `product_update` → Product list Sold/Views cell NOT a clickable button; click does nothing | Permission gate working | ⏸ |

#### Seed Review system

| # | Scenario | Expected | Status |
|---|---|---|---|
| S3.13 | **Admin → Seed Reviews page** — sidebar "Seed Reviews" link visible when admin has `review_seed_bulk` or `review_seed_manual` → click → page loads with 3 tabs | Page accessible, tabs render | ⏸ |
| S3.14 | **Bulk upload dry run** — Bulk tab → paste JSON array → tick "Dry Run" → Submit → result shows inserted/skipped/failed counts but NO DB write | Count feedback shown; no reviews in DB | ⏸ |
| S3.15 | **Bulk upload live** — untick dry run → Submit → result shows inserted count; Admin → Reviews list → seeded reviews appear with `is_seeded:true` | Reviews written to DB with source:"csv_bulk" | ⏸ |
| S3.16 | **Dedup guard** — submit same bulk JSON twice → second submit: all rows skipped (0 inserted); no duplicate reviews in DB | Dedup by (product_id + reviewer_name + review_description) | ⏸ |
| S3.17 | **500 row limit** — submit bulk with 501 rows → rejected with "max 500 rows" error before DB write | Guard fires at input | ⏸ |
| S3.18 | **Manual add** — Manual tab → fill form → Submit → review appears in Seeded Reviews List tab | Single seeded review created with source:"manual_admin" | ⏸ |
| S3.19 | **Seeded Reviews List** — Seeded tab → paginated list shows all `is_seeded:true` reviews; delete one → row removed | Pagination + delete works | ⏸ |
| S3.20 | **`enable_seeded_reviews=false` toggle** — Admin → Settings → Storefront Behaviour → "Show Seeded Reviews" OFF → Save → FE PDP review section shows only REAL customer reviews; seeded ones hidden | Storefront toggle works | ⏸ |
| S3.21 | **`enable_seeded_reviews=true` (default)** — toggle ON → PDP shows all reviews including seeded | Default behavior; real + seeded shown | ⏸ |
| S3.22 | **Permission gate** — admin with `review_show` only (no seed_bulk/seed_manual) → sidebar link absent; direct GET `/api/v1/review/seed/list` returns 403 for POST seed routes | RBAC enforced | ⏸ |

#### Seed Review enhancement (session 41, 2026-06-14)

| # | Scenario | Expected | Status |
|---|---|---|---|
| S41.1 | **Manual multi-select** — Manual tab → search products → pick 2-3 → write review → Submit → toast "Added to N product(s)" → each picked product's PDP shows the review | Same review seeded to all selected products | 🔵 |
| S41.2 | **Manual image upload** — Manual tab → upload an image (≤10MB) → submit → review on PDP shows the image (no URL typing) | File upload replaces URL field | 🔵 |
| S41.3 | **Manual dedup** — re-submit same products + same text → toast "skipped N duplicate(s)", no duplicate reviews | Dedup ON per product | 🔵 |
| S41.4 | **Bulk shared image (lazy)** — Bulk tab → choose image → click "Validate (Dry Run)" → NO file uploaded to S3 / nothing saved → then "Upload & Save" → image now in S3, applied to rows with no `review_image` | Lazy upload, no orphan on dry run | 🔵 |
| S41.5 | **Bulk row image wins** — a JSON row with its own `review_image` keeps its own image even when shared image is set | Row image priority | 🔵 |
| S41.6 | **Bulk two buttons** — "Validate (Dry Run)" shows "Would insert N" + amber "nothing saved"; "Upload & Save" shows "Inserted N" and clears the form | Explicit dry-run vs save | ✅ owner-confirmed (upload→PDP works) |
| S41.7 | **Find product ID helper** — Bulk tab → search a product in "Find product ID" → pick → toast "Copied ID" → paste into JSON | _id copied to clipboard | 🔵 |
| S41.8 | **Bad product id guard** — bulk JSON with a fake/garbage `review_product_id` → that row in "Failed: ... product not found"; no orphan review | ObjectId valid + ProductModel.exists | 🔵 |
| S41.9 | **Buyer name on PDP (bug fix)** — seed a review with `reviewer_name` → themed PDP review accordion + home "প্রাহকদের ভালোবাসা" carousel show the NAME (not "ক্রেতা") | reviewer_name renders | ✅ owner-confirmed |

---

Run these first; if any fail, do NOT proceed to other tests:

1. **Admin login works** — visit admin URL → log in with credentials → dashboard loads
2. **Storefront homepage loads** — visit FE URL → page renders, no console errors
3. **PDP loads** — open one product → image, price, variant picker all render
4. **Add to cart works** — pick variant if applicable → "Add to Cart" → cart counter updates
5. **Checkout flow loads** — go to /checkout → form appears, can fill fields
6. **Anonymous order can be placed** — fill form as guest → submit → order success page (critical — owner-locked rule)

If P1 passes, proceed to specific feature tests below.

---

### 🟠 P2 — Recently shipped (this session 23-cont — 2026-06-06)

#### Sprint 2 — D18: Admin Create Order POS (~8-10h, session 28)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) D18 section (3 BLOCKERS + 4 HIGH + 3 MEDIUM)
**Touches:** BE `role.interface.ts` + `role.model.ts` + `order.interface.ts` + `order.model.ts` + `order.controller.ts` + `order.routes.ts` + `order.service.ts`; Admin `permissionData.js` + new `CreateOrderPage/CreateOrderPage.jsx` + `Route.jsx` + `SideNavBar.jsx` + `OrderPage.jsx`
**Pre-test:** Tick `order_create_admin: true` on super admin role (via Admin → Role Management, or run: `db.roles.updateMany({}, {$set:{order_create_admin:true}})`).

| # | Scenario | Expected | Status |
|---|---|---|---|
| D18.1 | **BLOCKER 1 — limited admin blocked** — create role WITHOUT `order_create_admin` → log in → no "Create POS Order" sidebar link; direct POST `/api/v1/order/create-admin` returns 403 | Permission gate working | ⏸ |
| D18.2 | **Happy path POS order** — super admin: sidebar "Create POS Order" → search product → add 2 lines, pick variations → enter walk-in name + phone → delivery type = pickup → Submit → "POS Order Created!" toast, redirected to /order?tab=all | Order in DB with `order_source:"admin"`, `admin_created_by:<admin id>` | ⏸ |
| D18.3 | **Delivery POS order** — same but delivery type = Home Delivery → enter address + shipping zone → Submit → order has `shipping_cost > 0`, `billing_address` saved | Shipping cost from zone selection | ⏸ |
| D18.4 | **BLOCKER 2 — no userUpdate overwrite** — pick existing registered customer (search by phone) → submit POS order with a DIFFERENT address → open Customer page → customer's original `user_division`/`user_district`/`user_address` unchanged in DB | Returning customer's saved address not overwritten | ⏸ |
| D18.5 | **Manual discount (D11)** — enter ৳50 discount + reason "Staff discount" → order saved with `admin_manual_discount: 50`, `discount_amount: 50`, `manual_discount_reason: "Staff discount"`, `grand_total = sub_total + shipping - 50` | Correct total, coupon not touched | ⏸ |
| D18.6 | **No Meta/TikTok CAPI (D10)** — place POS order → Meta Pixel debug tool / network tab shows NO "Purchase" event fired | Pixel audience not polluted | 🔵 STATIC-VERIFIED |
| D18.7 | **No SMS (D10)** — place POS order → BE logs show no BulkSMS call fired | Walk-in doesn't receive SMS | 🔵 STATIC-VERIFIED |
| D18.8 | **POS Orders tab** — Order List page → click "POS Orders" tab → shows only orders with `order_source: "admin"` | Filtered correctly; regular storefront orders not shown | ⏸ |
| D18.9 | **BLOCKER 3 — Pathao zone optional** — POS walk-in order saved without `pathao_city_id` / `pathao_zone_id` → Mongoose does NOT throw validation error; order persists | No required-field crash | ⏸ |
| D18.10 | **Storefront order not affected** — place regular storefront order → `order_source: "storefront"` (or absent/default) → SMS fired, Meta Purchase event fires, userUpdate runs normally | Regression: POS branch only for admin route | ⏸ |

#### Sprint 2 — E20: Dashboard auth gate + widgets (~6-7h, session 27)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) E20 section (2 BLOCKERS + 4 HIGH + 2 MEDIUM)
**Touches:** BE `role.interface.ts` + `role.model.ts` + `dashboard.routes.ts` + `dashboard.controllers.ts` + `order.model.ts` + `tsconfig.json`; Admin `permissionData.js` + `SideNavBar.jsx` + `DashBoard.jsx`; new `scripts/tick-dashboard-show.ts`
**Pre-test:** Run migration script `npx ts-node scripts/tick-dashboard-show.ts` so super admin can access dashboard.

| # | Scenario | Expected | Status |
|---|---|---|---|
| E20.1 | **BLOCKER 1 — anonymous curl blocked** — `curl GET /api/v1/dashboard` (no cookie) → 401 response | Was previously 200 with all stats; now gated | ⏸ |
| E20.2 | **Super admin dashboard loads** — log in as superadmin → visit `/` → stat cards all show real counts (Orders/Customers/Products/Staff/Reviews/Categories/Brands) | No dummy data, real DB counts | ⏸ |
| E20.3 | **Limited admin redirect** — create a role WITHOUT `dashboard_show` → log in → admin sidebar has no Dashboard link, direct GET /api/v1/dashboard returns 403 | Revenue data not accessible | ⏸ |
| E20.4 | **Period selector 7/30/90** — switch between periods → "Orders by Status" chart + revenue summary + top-selling list all update | Three buttons active state switches, data refreshes | ⏸ |
| E20.5 | **Revenue widget excludes cancel/return** — place one order, cancel it → revenue widget shows ৳0 for that order (only active orders counted) | Only non-cancel/non-return included | ⏸ |
| E20.6 | **Orders-by-status chart** — place orders with different statuses → chart bars reflect real counts per status | Real data, not hardcoded dummy Jan/Feb/Mar bars | ⏸ |
| E20.7 | **Top-selling list** — place 3 orders for same product → appears at position 1 in Top Selling (last 7 days) | Sorted by quantity sold desc, product name + thumbnail show | ⏸ |
| E20.8 | **Empty period graceful** — set period 7 days with no recent orders → chart shows "No orders in this period", top-selling shows "No sales in this period" | No crash, empty state shown | ⏸ |
| E20.9 | **BST boundary (D9)** — order placed at 11:55 PM BST → appears in "today" revenue in dashboard | BST midnight used, not UTC midnight | 🔵 STATIC-VERIFIED |
| E20.10 | **Steadfast balance card still works** — click refresh on Steadfast balance card → fetches live balance | Not broken by dashboard auth gate | ⏸ |

#### Sprint 2 — C13: Storefront Behaviour toggles (~10h, session 26)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) C13 section (3 BLOCKERS + 4 HIGH + 2 MEDIUM absorbed)
**Touches:** BE setting schema+model, review model+interface+controller, order controller, productFilter services; Admin StorefrontBehaviourTab, PendingReviews page, Route, SideNavBar; FE PdpPriceMeta, ProductHighlightSection, both SingleProduct.jsx, ProductThemedSections, CartSummary, DeliveryInformation, AddToCart, FloatingWhatsApp, (frontend)/layout.js

| # | Scenario | Expected | Status |
|---|---|---|---|
| C13.1 | Admin → Settings → Storefront Behaviour tab visible + saves 13 toggles | Tab appears in sidebar Settings; all 13 fields save; reload persists | ⏸ |
| C13.2 | `auto_approve_reviews=false` → customer submits review → status = pending | Review in DB has `review_status:"pending"`, not "active" | ⏸ |
| C13.3 | Admin → Pending Reviews → approve a pending review | Review shows on PDP after approve | ⏸ |
| C13.4 | `maintain_stock=false` → place order for OOS product | Order succeeds; stock count unchanged in DB | ⏸ |
| C13.5 | `min_order_amount=500` → attempt order with ৳300 cart | BE returns 400 "Minimum order ৳500"; FE shows hint in CartSummary | ⏸ |
| C13.6 | `hide_out_of_stock_products=true` → OOS products hidden in /shop | OOS products absent from listing; in-stock appear normally | ⏸ |
| C13.7 | `show_sold_count=false` → PDP sold count badge hidden | No "X জন কিনেছে" badge visible on standard + themed PDP | ⏸ |
| C13.8 | `show_stock_count_on_pdp=true` → PDP shows exact stock number | "Only N left!" shows on standard PDP; stock count shows on themed order section | ⏸ |
| C13.9 | `enable_reviews=false` → PDP review section hidden | Review accordion absent on standard PDP; ReviewsSection absent on themed PDP | ⏸ |
| C13.10 | `allow_image_download=false` → right-click on product image blocked | Context menu suppressed on product photo area (right-click shows nothing) | ⏸ |
| C13.11 | `enable_whatsapp_chat=true` + `whatsapp_number=01XXXXXXXXX` → floating button appears | Green WhatsApp button at bottom-right; click opens wa.me link | ⏸ |
| C13.12 | `show_email_field_checkout=false` → email input absent at checkout | No email input in DeliveryInformation form | ⏸ |
| C13.13 | `enable_promo_at_checkout=false` → coupon section hidden at checkout | No coupon Apply section in CartSummary | ⏸ |

#### Sprint 2 — C12: SMS settings runtime read (~3h, session 25)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) C12 section (2 BLOCKERS + 3 HIGH)
**Touches:** `setting.services.ts`, `setting.interface.ts`, `setting.model.ts`, `send.otp.phone.ts`, `send.order.sms.ts`, Admin `SmsSettings.jsx`

| # | Scenario | Status |
|---|----------|--------|
| C12.1 | **Clobber test (BLOCKER 1)** — Admin Analytics tab Save (non-secret tab, no SMS fields touched) → DB `sms_api_key` still intact. Previously `$set:undefined` full-replace wiped it | ⏸ |
| C12.2 | **Split save (BLOCKER 2)** — In SmsSettings: change Sender ID + Save → only `PATCH /setting` fires (Network tab). Open Secrets section → type new API key → Save Credentials → only `PATCH /setting/secrets` fires. Existing key NOT touched when SMS form saved without typing a new key | ⏸ |
| C12.3 | **Masked display (HIGH 3)** — Super admin opens SmsSettings → Secrets section shows `••••3a4f` (last-4 of saved key), not blank. Admin without `setting_secrets_update` flag sees the "permission required" stub instead | ⏸ |
| C12.4 | **HTTPS upgrade (HIGH 4)** — Trigger an OTP send (forgot-password / new-user signup) → server log shows `https://bulksmsbd.net/api/smsapi` not `http://` | ⏸ |
| C12.5 | **Storefront base URL (HIGH 5)** — Admin sets `storefront_base_url = "https://test.example.com"` (via Software Information tab once exposed; for now via DB or postman) → place a guest order → SMS body link points to `test.example.com/...` not `fruitsnacksbd.com` | 🔵 STATIC-VERIFIED until UI exposes field |
| C12.6 | **Silent no-op when disabled** — Admin toggles `sms_enabled: false` → place a guest order → order succeeds 200, no BulkSMS network call, no error toast. Toggle back ON → next order sends SMS again | ⏸ |
| C12.7 | **Anonymous checkout regression** — Owner-locked rule: guest checkout must still work with these SMS changes. Place anonymous order → success page reached, SMS attempted (or silently skipped if disabled) | ⏸ |
| C12.8 | **Wrong API key graceful failure** — Admin sets a bogus key → place order → order still 200, BE log has BulkSMS error response (`response_code !== 202`), customer sees normal success page | ⏸ |

#### Sprint 2 — H: Auth hardening (Admin ForgotPassword + 3 BE bugs, ~3-4h, session 25)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) H section
**Touches:** BE `admin.controllers.ts` (forgotPasswordAdmin + resetPasswordAdmin); Admin new `pages/ForgetPasswordPage/ForgetPasswordPage.jsx` + `Route.jsx` + `SignInPage.jsx`

| # | Scenario | Status |
|---|----------|--------|
| H.1 | **Happy path** — admin `/sign-in` → click "Forgot password?" → /forget-password → enter phone → "OTP sent" toast → step 2 → enter OTP + new password → "Password reset successfully" → redirected to /sign-in → login with NEW password works | ⏸ |
| H.2 | **Wrong OTP 5 times** — enter wrong OTP 5 times → 6th attempt blocked: "Too many wrong attempts. Please request a new OTP." | ⏸ |
| H.3 | **Expired OTP** — wait 11 min after step-1 → enter (correct) OTP → "OTP has expired. Please request a new one." | ⏸ |
| H.4 | **Cooldown** — request 2nd OTP within 60s → 429 "Please wait Xs before requesting another OTP." | ⏸ |
| H.5 | **Resend works** — step 2 → click "Resend OTP" (after 60s cooldown) → new OTP arrives → new code accepted | ⏸ |
| H.6 | **Inactive admin** — admin_status:"in-active" tries forgot → 403 "Admin is inactive." | ⏸ |
| H.7 | **BE fix-A ordering** — verify in BE log: DB save fires BEFORE BulkSMS call (was reversed previously) | 🔵 STATIC-VERIFIED (code-level grep confirms `AdminModel.updateOne` precedes `SendPhoneOTP`) |
| H.8 | **Anonymous checkout regression** — owner-locked: anonymous order placement still works (admin auth changes don't touch user flow) | ⏸ |

#### Sprint 2 — 11β: Coupon BOGO wire-up (~6h, session 25)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) 11β section (3 BLOCKERS + 4 HIGH + 2 MEDIUM)
**Touches:** BE `coupon.model.ts`/`coupon.controllers.ts`/`coupon.services.ts`/`order.controller.ts`/`order.recompute.ts`; Admin `AddCoupon.jsx`/`UpdateCoupon.jsx`; FE `applyCartLayers.js`/`CouponSection.jsx`/`CartSummary.jsx`
**Pre-test:** create a BOGO coupon in admin first (`/your-coupon` → Create → type=BOGO → buy 2 get 1 at 100% off, total avail = 5).

| # | Scenario | Status |
|---|----------|--------|
| 11β.1 | **Admin creates BOGO coupon** — `/your-coupon` → Create → type=BOGO → fill buy_qty=2 get_qty=1 discount_pct=100 → saves OK (previously rejected by `coupon_amount required`) | ⏸ |
| 11β.2 | **Admin edits BOGO coupon** — open Update modal → change discount_pct to 50 → save → reopen → field shows 50 (previously silent no-op; only status saved) | ⏸ |
| 11β.3 | **Anonymous BOGO applies** — Guest user: add 3 items to cart (৳300/৳200/৳100) → open `/cart` → coupon input visible (no login gate) → enter BOGO code → cart shows ৳100 discount on cheapest line | ⏸ |
| 11β.4 | **Anonymous BOGO checkout** — place anon order with applied BOGO → order succeeds → BE order has `discount_amount: 100`, `coupon_id` set | ⏸ |
| 11β.5 | **Atomic decrement race** — set coupon_available=1; place 2 concurrent BOGO orders → one succeeds, the other gets 409 "Coupon stock exhausted" toast; coupon_available ends at 0 (NOT -1) | ⏸ |
| 11β.6 | **Campaign-zero line skip (M3)** — cart has 1 line at ৳0 (campaign brought to zero) + 1 line at ৳200 → BOGO targets the ৳200 line, not the ৳0 line | ⏸ |
| 11β.7 | **Specific-product BOGO scope** — BOGO created with `coupon_specific_product=[X]`; cart has X + Y items → discount only applies to X line | ⏸ |
| 11β.8 | **Non-BOGO anon coupon rejection** — Guest user enters a fixed/percent (non-BOGO) code → BE recompute rejects (no customer_id) → toast surfaces; no order placed with bogus discount | ⏸ |

#### Sprint 2 — D15: Wishlist BE wire-up (~3h, session 25)
**Plan:** [docs/_ai/CLIENT_SPRINT_2.md](../../docs/_ai/CLIENT_SPRINT_2.md) D15 section (wave-1 audit: BE module already correct; FE wire missing)
**Touches:** FE `wishlistSync.js` (2 new helpers), `Providers.jsx` (WishlistLoader), `singeProduct/SingleProduct.jsx`, `themedProduct/singeProduct/SingleProduct.jsx`, `WishList.jsx`, `UserDashboardWishList.jsx`
**Pre-test:** ensure 2 devices/browsers signed in as same user. Each device starts with empty localStorage `wishlist`.

| # | Scenario | Status |
|---|----------|--------|
| D15.1 | **Guest → login cross-device** — Device A logged-out: add 2 products to wishlist (PDP heart). Then log in on Device A → page automatically syncs. Now log in on Device B (fresh browser, empty local) → wishlist page shows both items | ⏸ |
| D15.2 | **Logged-in add on Device A** — Both devices logged in. Device A: add product to wishlist via PDP heart icon → see Network tab fires `POST /wishlist/add` (200). Device B: reload → wishlist page shows the new item | ⏸ |
| D15.3 | **Logged-in remove on Device A** — Both devices have same item in wishlist. Device A: visit `/wishlist` → click trash → Network fires `POST /wishlist/remove`. Device B reload → item gone | ⏸ |
| D15.4 | **Guest local + login union-merge** — Device A logged-out: add product X. Device B logged-in: add product Y. Now log in on Device A → both X and Y present (no duplicate, no loss) | ⏸ |
| D15.5 | **Anonymous PDP heart still works** — Logged-out user: PDP heart click → toast appears, localStorage updated, NO `/wishlist/add` POST fired (verify Network tab is empty for that call). Guest-only wishlist preserved | ⏸ |
| D15.6 | **BE down resilience** — Stop backend → logged-in user clicks PDP heart → UI still shows "Added to wishlist" toast (localStorage wins) → no error toast surfaces. Restart BE → next add succeeds | ⏸ |
| D15.7 | **WishlistLoader fires once per login** — Open fresh tab as logged-in user → Network tab shows exactly one `GET /wishlist` on mount. Refresh page → fires again. Same userInfo across re-renders → does not refire | ⏸ |
| D15.8 | **UserDashboard remove also fires BE** — Visit `/user/wishlist` (UserDashboardWishList) → click trash → both localStorage AND BE removed (verify next-load on Device B) | ⏸ |

#### Post-hoc audit follow-ups — 5 BLOCKERS + 6 HIGH fixed
**Source:** 4 plan-edge-auditor sub-agents run on already-shipped code
**Commits:** FE `0bcf174` + BE `90e1ecf` + BE `22f4d0e` + FE `6654f2a` + BE `479ebcc`

| # | Scenario | Status |
|---|----------|--------|
| PH.1 | (B0-H1) Admin marks a category `explore_category_show: true`. Verify Navbar Explore dropdown, Footer category list, user-profile SecondNavbar all show it. Previously empty for every clone | ⏸ |
| PH.2 | (B0-H2) Storefront homepage Trending Products carousel actually renders the products. Previously empty (silent — products.data.data was undefined) | ⏸ |
| PH.3 | (8-B1) Re-parent category X (serial=1) under parent Y where another child already has serial=1 → succeeds; X gets auto-assigned max+1 in Y's sibling list. Previously rejected with "Serial Number Previously Added!" | ⏸ |
| PH.4 | (8-H1) Admin edits a category WITH a new image upload (multipart) + ticks feature_category_show. 7th featured attempt blocked at 6. Previously bypassed when multipart sent string "true" | ⏸ |
| PH.5 | (11α-B1) Cart price calculation behaviour unchanged — applyCampaignMath removal is dead-code cleanup; productPrice() still drives campaign display via cart cache | ⏸ |
| PH.6 | (11α-H1) Sparse product (no benefits/nutrition/FAQ/description) but in an active offer → OfferDiscoveryBanner DOES surface on PDP. Previously hidden by ProductThemedSections hasContent gate | ⏸ |
| PH.7 | (11α-H2) Hit `/api/v1/offer/by-product/<malformed-id>` (e.g. "abc") → returns 200 with `data: []`. Previously could throw 500 mid-query | ⏸ |
| PH.8 | (10-B1) Assign Theme A to product → Theme B. themes.used_in_products: A decremented, B incremented. is_deletable on A flips correctly when count hits 0. Previously stayed permanently > 0 | ⏸ |
| PH.9 | (10-B2) Admin opens product Page Content form, clears theme dropdown → submits → product saved with no theme_id; storefront falls back to default green. Previously not possible | ⏸ |
| PH.10 | (10-H1) Admin clears product_supplier_id on full edit form → saves → reopen → supplier field empty. Previously persisted old supplier silently | ⏸ |
| PH.11 | (10-H2) Admin clears warehouse_id on full edit form → saves → reopen → warehouse field empty. Previously persisted old warehouse silently | ⏸ |

#### Sprint 2 Bucket 0 — Production-blocking bug fixes
**Source:** plan-edge-auditor on H1 home redesign (audit findings absorbed into Sprint 2)
**Commit:** FE `00de5da`

| # | Scenario | Status |
|---|----------|--------|
| B0.1 | Featured Categories — admin marks a category `feature_category_show: true` (Site Settings or Category edit) → Storefront homepage Feature Category section + Navbar mega-menu now shows it. Was previously empty for every clone | ⏸ |
| B0.2 | Trending products section loads cleanly — no console error about `data` from autoprefixer; build emits no warning about the removed import | ⏸ |
| B0.3 | Fresh clone with NO admin `/page-seo` "home" entry — view-source on homepage `<title>` and `<meta description>` show fruit-snacks generic Bangla copy, NOT "Premium Genuine Leather Wallets..." | ⏸ |
| B0.4 | Existing clones with admin-set "home" pageSeo entry — admin's saved title/description still wins (regression check; falls through to fallback only if DB entry missing) | ⏸ |

#### Group B — Item 8: Category audit
**Plan:** `.claude/work/group-b-serial/ITEM_8_CATEGORY_AUDIT.md` (bottom of doc)
**Commits:** BE `129a749`, Admin `218a9b1`

| # | Scenario | Status |
|---|----------|--------|
| 8.1 | Sibling serial — create category A serial 1 under root → create child B serial 1 under A → both succeed (previously blocked) | ⏸ |
| 8.2 | Trending products — storefront homepage trending section loads (regression check on aggregation purge) | ⏸ |
| 8.3 | Filter sidebar — category page filter still shows attributes (regression check on category_path subtree) | ⏸ |
| 8.4 | Re-parent — move category with products → impact dialog shows correct counts → confirm → storefront filter updated for old + new parent | ⏸ |
| 8.5 | Deep-leaf delete — create A→B→C, put product under C, delete C → product's category_path no longer references C | ⏸ |
| 8.6 | Featured cap — mark 6 active categories featured → try 7th → blocked. Mark one inactive → try 7th → allowed | ⏸ |
| 8.7 | Admin role page — sub_category / child_category checkboxes gone | ⏸ |

#### Group B — Item 11α: Pricing resolver Option α
**Plan:** `.claude/work/group-b-serial/ITEM_11_PRICING_AUDIT_PLAN.md` (Phase 4 section)
**Commits:** BE `50a4926`, FE `9a53444`

| # | Scenario | Status |
|---|----------|--------|
| 11.1 | Regression — placing a regular order still computes correct total (resolver doc-only change should be no-op behaviorally) | ⏸ |
| 11.2 | Cart parity (percent coupon) — add 2 products + apply 10% coupon → cart sub/discount/grand matches what checkout finalizes | ⏸ |
| 11.3 | Cart parity (fixed coupon) — same with a fixed-amount coupon | ⏸ |
| 11.4 | Cart parity (specific-product coupon) — coupon `coupon_specific_product` set to just one cart item → only that line discounted | ⏸ |
| 11.5 | Tier price — product with `tier_prices` (e.g. min_qty 5, price 90) base 100 → cart qty 4 = ৳100/unit, qty 5 drops to ৳90/unit | ⏸ |
| 11.6 | Customer group — log in as wholesale user with matching `group_prices` → wholesale price shown. ⚠️ FE does NOT yet pass `customerGroup` through `useCartCalculations` — falls back to retail. Verify retail-only fallback is fine | 🔵 STATIC-VERIFIED |
| 11.7 | PDP offer-discovery banner — open product in an active offer → amber "Bundle Offer" card visible between Benefits and Nutrition → click → goes to `/offer/<id>` | ⏸ |
| 11.8 | PDP no offer — open product not in any offer → no banner, no whitespace | ⏸ |
| 11.9 | Anonymous checkout — guest places order, no per-user / loyalty path triggered (regression check) | ⏸ |

#### Group B — Item 10: UPDATE round-trip
**Plan:** `.claude/work/group-b-serial/ITEM_10_UPDATE_AUDIT.md` (Manual test plan)
**Commit:** BE `61a9631`

| # | Scenario | Status |
|---|----------|--------|
| 10.1 | Clear brand — admin product edit → set Brand to "None" → Save → reopen → brand empty (was previously stuck on old value) | ⏸ |
| 10.2 | Clear category — same flow with Category → Save → reopen → category empty; storefront drops product from old category subtree | ⏸ |
| 10.3 | Keep brand — edit any other field with brand kept selected → Save → brand still selected (regression check) | ⏸ |
| 10.4 | Set brand on brandless product — pick brand on a no-brand product → Save → brand persists | ⏸ |

#### Group A — PDP polish
**Plan:** Inline in respective commits
**Commits:** FE `f0d1b20` (Item 3); Items 1+2 in earlier session-23 commits

| # | Scenario | Status |
|---|----------|--------|
| A.1 | Nutrition info tiles — admin adds 3 free-form tiles (label + value + icon) → save → PDP renders 3 tiles | ⏸ |
| A.2 | Nutrition rows — admin adds 5 free-form rows (label + value) → save → PDP renders 5 rows | ⏸ |
| A.3 | Description position — open a product with `product.description` set → description card visible between Nutrition and Reviews (not after hero) | ⏸ |
| A.4 | Description empty-state — open a product with empty description → no description card / no empty whitespace | ⏸ |

---

### 🟡 P3 — Phase 1 Analytics S4+S5 (deferred from session 23)

**Plan:** `.claude/work/analytics-s4-s5/OWNER_TEST_PLAN.md` (full plan, feature-tester additions at top)
**Commits (11):** BE `e62a389` / `87e7787` / `3fd4164` / `4222f73` / `c0da12f`; Admin `d6365db` / `ff64822`; FE `bdb498d` / `6099aa4` / `3a4aa4f` / `90cd530` / `223ea93`

**Prerequisite:** Owner must paste REAL Meta + TikTok CAPI tokens via Admin → Site Settings → Secrets section (requires `setting_secrets_update` role flag). Dummy tokens will produce "Malformed access token" — that's expected, only architecture verifiable without real tokens.

| # | Scenario | Status |
|---|----------|--------|
| 1A.1 | Public IDs editable from Admin Analytics tab — 6 fields (Meta/TikTok pixel, GTM, GA4, Clarity, Google verification) | ⏸ |
| 1A.2 | Secrets section — 4 CAPI fields + SMS/email/courier secrets — masked last-4 display, edit-reveal flow, empty-submit keeps existing | ⏸ |
| 1A.3 | Public /setting endpoint does NOT leak any secret values (browser DevTools network tab check) | ⏸ |
| 1A.4 | Existing clones with .env-only setup still work (fallback chain) | ⏸ |
| 1B.1 | Add-to-cart event — Meta + TikTok client+server fire with proper EMQ user_data (fn/ln split, em, ct, st, country) | ⏸ |
| 1B.2 | InitiateCheckout — fires only if cart total > 0 | ⏸ |
| 1B.3 | Purchase event — fires exactly once per order (FE localStorage + BE order.meta_purchase_sent dedup) | ⏸ |
| 1B.4 | fbclid → _fbc cookie — visit with `?fbclid=test123` → check cookie `_fbc` = `fb.1.<ts>.test123` | ⏸ |
| 1B.5 | IP enrichment — order placed without ct/st/country in user_data → BE fills from geoip-lite lookup | ⏸ |
| 1C.1 | Optional email on profile — add email → unique-sparse index allows it | ⏸ |
| 1C.2 | Post-order email prompt — guest order success page → amber prompt → submit → JWT-protected guest endpoint saves to order.customer_email | ⏸ |
| 1C.3 | Sign-up email — optional field, account creation works with or without it | ⏸ |
| 1C.4 | OTP verify backfill — guest places orders → registers later → OTP verify auto-fills orders matching phone with user's email | ⏸ |

---

### 🟢 P4 — Client Sprint earlier work (sessions 19-21)

Sprint shipped 22 items + 6 deploy steps. Most behaviour is exercised by P1 smoke test. Specific sprint-item scenarios that need explicit verification:

#### Layer 1 BE (session 19, BE `8873f56`)

| # | Item | Scenario | Status |
|---|------|----------|--------|
| M28 | Currency from settings | Change Admin → Settings → Currency Code "BDT" → "USD" → storefront prices update to "$" prefix | ⏸ |
| M18 | Coupon date validation | Coupon with end_date in past → frontend tries to apply → rejected | ⏸ |
| M20 | Per-product delivery rules | Product with `delivery_mode:"free"` → shipping cost in cart drops to 0 for that line | ⏸ |
| B2 | Attribute delete 409 | Try delete attribute used by N products → 409 dialog with sample deep-links | ⏸ |
| M24 | Category re-parent | (covered by Item 8.4 above) | — |
| B1 | Anonymous flow security (D3) | Try `/login` with random phone + password → no auto-password-set; user must use OTP flow | ⏸ |

#### Layer 2 Admin (session 20)

| # | Item | Scenario | Status |
|---|------|----------|--------|
| A3 | Attribute value DnD reorder | Drag-reorder values in attribute → save → storefront filter shows new order | ⏸ |
| A4 | Variation badge | Set badge "Best Seller" + icon on variation → PDP shows badge with theme primary color | ⏸ |
| M24 admin | Parent picker confirm | Re-parent category → impact-preview dialog with "X children + Y products" → confirm → cascade runs | ⏸ |
| A2 | Product table list | Open product list → 5 column modals (Price/Stock/Images/Video/Variations) all open + save individually | ⏸ |
| B1 admin | Customer Type column | Customer list → Type column shows guest/registered → filter works | ⏸ |

#### Layer 3 FE (session 21, FE `a685a2d`)

| # | Item | Scenario | Status |
|---|------|----------|--------|
| S1 | /cart → /checkout rename | Click "Cart" → URL is `/checkout`; old `/cart` URL still 301-redirects | ⏸ |
| M9 | SKU display on PDP | PDP shows product SKU | ⏸ |
| M14 | Per-variant gallery auto-switch | Pick a variant with own image → main image updates | ⏸ |
| M16 | Filter URL → PDP query forward | Filter sidebar selects color=red → click product → PDP pre-selects red variant | ⏸ |
| S2 | PDP media | Image carousel + video play work | ⏸ |
| A4 FE | Badge render | (covered by A4 admin above) | — |
| S6 | User dashboard + addresses | Logged-in user → dashboard → Addresses tab → CRUD works | ⏸ |
| S7 | Order tracking | Order tracking page works for known order | ⏸ |
| S8 | Order history | Logged-in user → order history list + detail | ⏸ |
| **S3a** | **Global SEO** | View page source on homepage / category / PDP → all meta tags + JSON-LD present. robots.txt + sitemap.xml accessible. Google Rich Results Test passes for PDP | ⏸ |
| **S3b** | **Product SEO wiring** | Admin sets `product.seo_title` → reload PDP → `<title>` updates from DB. Same for description, og_*, keywords | ⏸ |
| B1 FE | Checkout / post-order polish | (covered by P1.5 + P1.6 + 1C.2) | — |

---

### 🔵 P5 — Static-verified items (Claude verified at code level, owner can skip unless audit needed)

These ran through `tsc` / `npm run build` / grep verification and integration trace. Owner can test if curious but not blocking deploy:

- All sub_category / child_category dead references purged (grep returns 0)
- 8 retired RBAC flags removed from role.interface / role.model / permissionData.js
- All `PATCH /product/quick` whitelisted field updates path-correct
- Resolver call sites in `order.recompute.ts` pass only `{ variation, flashSale }` after the option-key cleanup
- Frontend cart helper delegates correctly to `applyCartLayers`
- Backend `tsc --noEmit` clean for all current sessions

---

## After deploy — separate checklist

Once owner runs the test backlog and approves merge to `main`:

- [ ] Tick role permission flags: supplier_* + payment_withdraw_* + payment_method_* (M2/M3) + setting_secrets_update (Phase 1A — owner/superadmin only)
- [ ] Admin → Site Settings → Analytics tab → real Meta/TikTok pixel IDs + CAPI tokens
- [ ] PROD DB migration scripts (Claude runs):
  - `scripts/normalize-user-phones.ts` (B1)
  - `scripts/zero-product-qty-when-variation.ts` (A2)

---

## How to use this doc

When owner runs a test, update the relevant row's Status column:
- ✅ if passed
- ❌ with one-line failure note if failed (then file as new bug in `current-status-handoff`)
- 🟡 if some scenarios in a group passed but not all

When Claude ships new work, ADD a new section at the top of P2 with the new commits + scenarios, AND verify earlier P2 sections still hold (regression check) per [[dont-break-old-tests]].
