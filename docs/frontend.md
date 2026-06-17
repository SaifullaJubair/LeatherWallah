# FruitSnacks Frontend — সম্পূর্ণ ডকুমেন্টেশন

> Next.js 14 (App Router) ভিত্তিক স্টোরফ্রন্ট।
> পোর্ট ৩০০০ (dev) | SSR/SSG/ISR সব use করা হয়েছে।

---

## পরিচিতি

FruitSnacks Frontend হলো end-customer-এর স্টোরফ্রন্ট — যেখানে কাস্টমার প্রোডাক্ট দেখে, কার্টে যোগ করে, অর্ডার দেয়, রিভিউ লেখে, অর্ডার ট্র্যাক করে। React-এর App Router pattern follow করে সম্পূর্ণ rebuild — Redux Toolkit + RTK Query দিয়ে state এবং API call manage হয়।

### Technology Stack

| টেকনোলজি | ব্যবহার |
|----------|---------|
| Next.js 14 (App Router) | React SSR ফ্রেমওয়ার্ক |
| Redux Toolkit | ক্লায়েন্ট state |
| RTK Query | সার্ভার API ক্যাশিং ও mutation |
| React Query (TanStack) | কিছু client-side fetch (parallel to RTK Query) |
| Tailwind CSS | স্টাইলিং |
| Shadcn UI | UI primitives ([components/ui/](../FruitSnacksFrontend/src/components/ui/)) |
| React Hook Form | ফর্ম ম্যানেজমেন্ট |
| react-toastify | নোটিফিকেশন |
| react-photo-view, react-quill-new, react-slick, swiper | UX এনহান্সমেন্ট |
| react-helmet-async | SEO (পাশাপাশি Next.js Metadata API) |
| Next.js Metadata API | প্রতিটি page-এর dynamic title/description/OG |

### Entry Points

| File | কাজ |
|------|-----|
| [`src/app/layout.js`](../FruitSnacksFrontend/src/app/layout.js) | Root layout — analytics scripts, providers, organization JSON-LD, fonts, toast container |
| [`src/app/(frontend)/layout.js`](../FruitSnacksFrontend/src/app/(frontend)/layout.js) | Main storefront layout — navbar, announcement bar, unverified banner, footer |
| [`src/app/(frontend)/page.js`](../FruitSnacksFrontend/src/app/(frontend)/page.js) | Home page |
| [`src/components/providers/Providers.jsx`](../FruitSnacksFrontend/src/components/providers/Providers.jsx) | Redux Provider + CartLoader (login হলে DB থেকে cart load) |
| [`src/components/providers/QueryProviders.jsx`](../FruitSnacksFrontend/src/components/providers/QueryProviders.jsx) | React Query Provider |

---

## File Map Reference

প্রতিটি ফিচারের সব ফাইলের তালিকা [FruitSnacksFrontend/CLAUDE.FILEMAP.md](../FruitSnacksFrontend/CLAUDE.FILEMAP.md)-এ আছে। ফিচার-ভিত্তিক ফাইল খুঁজতে ওইটা দেখুন।

---

## Architecture Overview

### Provider Hierarchy (Root)

```
<html>
  <body>
    <Providers>                       ← Redux store
      <CartLoader />                  ← logged-in user হলে DB থেকে cart sync
      <QueryProviders>                ← React Query
        <AnalyticsAdvancedMatching /> ← user data analytics-এ পাঠানো
        <main>
          {children}                  ← Page component
          <ToastContainer />
```

বাইরে:
- Google Tag Manager (head)
- Meta Pixel, TikTok Pixel scripts
- Microsoft Clarity script
- Organization JSON-LD structured data

### Routing (App Router Groups)

`src/app/`-এ ৩টি route group:

| Group | Purpose | Layout? |
|-------|---------|---------|
| `(auth)/` | sign-in, sign-up, OTP verify, forget/set/change password | নেই (minimal pages) |
| `(frontend)/` | Storefront (products, cart, checkout, orders, campaigns, brands, policy, etc.) | আছে — navbar + footer |
| `(user-profile)/` | User dashboard (profile, orders history, wishlist, reviews) | আছে — separate layout |

### App Router Routes

```
src/app/
├── layout.js                # Root
├── error.js, not-found.js   # Error boundaries
├── sitemap.js, robots.js    # SEO
├── globals.css
│
├── (auth)/
│   ├── sign-in/
│   ├── sign-up/
│   ├── forget-password/
│   ├── change-password/
│   └── set-password/
│
├── (frontend)/
│   ├── page.js                              → Home
│   ├── layout.js
│   ├── products/[slug]/page.js              → Product Detail (PDP)
│   ├── all-products/                        → All products list
│   ├── all-ecommerce-product/
│   ├── all-trending-products/
│   ├── latest-product/, top-product/, new-arrival/, shop/
│   ├── category/[...slug]/                  → Category filter (catch-all)
│   ├── all-brands/, all-brands/brand-product/[id]/
│   ├── cart/                                → Cart page
│   ├── checkout/                            → Checkout
│   ├── compare/                             → Compare products
│   ├── wishlist/
│   ├── verify/                              → OTP verification
│   ├── campaign/, campaign/[id]/
│   ├── offer/, offer/[id]/   (offer checkout এখন POST /order; পুরোনো
│   │       /offer-orders/* → purchase history-তে 301 redirect — next.config.mjs)
│   ├── orders/[orderId]/                    → My order details
│   ├── orders/order-success/                → Post-checkout success
│   ├── orders/order-tracking/, [id]/        → Tracking
│   └── about-us/, privacy-policy/, terms-condition/, return-policy/,
│       refund-policy/, cancel-policy/, shipping-information/
│
└── (user-profile)/
    ├── layout.js
    └── user-profile/                        → Profile dashboard (tabs)
```

---

## State Management

### Redux Store

[`src/redux/store.js`](../FruitSnacksFrontend/src/redux/store.js):

```js
{
  reducer: {
    api: baseApi.reducer,    // RTK Query cache
    cart: cartReducer,       // local cart state
  },
  middleware: [
    baseApi.middleware,
    cartLocalStorageMiddleware,  // cart actions intercept করে localStorage + DB sync
  ],
  preloadedState: {
    cart: cartLoadState(),   // SSR safe: page load-এ localStorage থেকে cart hydrate
  },
}
```

### RTK Query (`baseApi`)

একটাই API instance — সব feature endpoint এতে inject করে। কখনো আলাদা api instance বানাবে না।

[`src/redux/api/baseApi.js`](../FruitSnacksFrontend/src/redux/api/baseApi.js):
```js
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: () => ({}),
  tagTypes: tagTypesList,
});
```

Endpoint inject pattern (যেমন [`src/redux/feature/auth/authApi.js`](../FruitSnacksFrontend/src/redux/feature/auth/authApi.js)):
```js
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    userInfo: build.query({ query: () => ({ url: "/get_me", credentials: "include" }) }),
    userLogin: build.mutation({ ..., invalidatesTags: [tagTypes.auth] }),
  }),
});
export const { useUserInfoQuery, useUserLoginMutation } = authApi;
```

### Tag Types (Cache Invalidation)

[`src/redux/tag-types.js`](../FruitSnacksFrontend/src/redux/tag-types.js)-এ সব ট্যাগ centralized:
- `user`, `auth`, `getme`
- `category`, `filter`, `brand`, `searchTerm` (+ legacy `sub_category`/`child_category`/`specification` tags — backend মডিউল merge হয়ে গেলেও tag-types.js-এ rows রয়ে গেছে, এখন unused)
- `product`, `review`, `question`
- `campaign`, `offer`, `coupon`, `banner`
- `wishlist`, `order`, `site_setting`

নতুন ট্যাগ যোগ করতে হলে এখানে। তারপর `providesTags`/`invalidatesTags`-এ use।

---

## Cart Dual-Storage Pattern

এটা frontend-এর সবচেয়ে complex flow। কাস্টমার logged-in না হলেও কার্টে product যোগ করতে পারে — localStorage-এ থাকে। লগইনের পরে DB-তে sync হয়।

### Components

| File | Role |
|------|------|
| [`src/redux/feature/cart/cartSlice.js`](../FruitSnacksFrontend/src/redux/feature/cart/cartSlice.js) | `addToCart`, `removeFromCart`, `incrementQuantity`, `decrementQuantity`, `updateQuantity`, `setCartFromDB`, `allRemoveFromCart` |
| [`src/redux/cartLocalstorageMiddleware.js`](../FruitSnacksFrontend/src/redux/cartLocalstorageMiddleware.js) | Cart action intercept → localStorage save → (logged-in হলে) DB sync (debounced 500ms) |
| [`src/utils/cartSync.js`](../FruitSnacksFrontend/src/utils/cartSync.js) | `syncCartAfterLogin()` — login-এর পরে localStorage merge; `loadCartFromDB()` — DB থেকে cart load |
| [`src/components/providers/Providers.jsx`](../FruitSnacksFrontend/src/components/providers/Providers.jsx)-এর `<CartLoader />` | Mount-এ logged-in user check → `loadCartFromDB()` call |

### Flow Diagram

```
Guest User:
  Action (addToCart)
    → cartSlice reducer
      → middleware intercepts
        → localStorage["cart"] = updated state
        (DB sync skipped — user logged out)

Logged-in User:
  Action (addToCart)
    → cartSlice reducer
      → middleware intercepts
        → localStorage save
        → check RTK Query cache for userInfo query
        → debounced PUT /api/v1/cart (500ms after last action)

Login Event:
  syncCartAfterLogin(localProducts, dispatch)
    → POST /api/v1/cart/sync
      → backend merges local cart + DB cart
      → returns merged cart
    → dispatch(setCartFromDB(mergedCart))
      → cart state updated
      (setCartFromDB action triggers middleware again,
       but skips DB sync to avoid infinite loop)

Page Load (logged-in):
  CartLoader useEffect
    → loadCartFromDB(dispatch)
      → GET /api/v1/cart
      → dispatch(setCartFromDB(dbCart))
```

### SSR Safety

`store.js`-এ `cartLoadState()`:
```js
if (typeof window === "undefined") return undefined; // server-এ localStorage নেই
```

`preloadedState.cart` hydrate করে — SSR এ undefined থাকে, hydration হলে real value আসে।

---

## Data Fetching Patterns

দুই ধরনের data fetch:

### ১. Server-side (App Router server components)

[`src/components/lib/`](../FruitSnacksFrontend/src/components/lib/) ফোল্ডারে utility functions — সব native `fetch` + Next.js `revalidate` option:

```js
// getCategory.js
export async function getCategory() {
  const res = await fetch(`${BASE_URL}/category`, {
    next: { revalidate: 600 },   // 10 minutes ISR
  });
  return res.json();
}
```

**Revalidate strategy:**
| Data | Revalidate (seconds) | Reason |
|------|----------------------|--------|
| Category, Menu | 300–600 | চেঞ্জ কম, রিফ্রেশ দরকার নেই |
| Site Setting | 60 | logo/setting change হলে ১ মিনিটের মধ্যে reflect |
| Product list | 60 | নতুন product/stock change |
| Banner, Slider | 60–300 | marketing update |
| Single Product | `cache: "no-store"` | live data — campaign/stock real-time |

### Server fetch functions

| File | Backend Endpoint | Purpose |
|------|------------------|---------|
| `getMenu.js` | `/category/category_sub_child` | Navbar dropdown |
| `getCategory.js` | `/category` | Category list |
| `getBanner.js` | `/banner` | Home banners |
| `getSlider.js` | `/slider` | Home sliders |
| `getSettingData.js`, `getServerSettingData.js` | `/setting` | Site config |
| `getSeoConfig.js` | (combines setting + .env) | Centralized SEO data |
| `getPageSeo.js` | `/page-seo/:key` | Per-page SEO override |
| `getZoneData.js` | `/setting/zone` | Pathao zone data (checkout) |
| `getShippingConfiguration.js` | (computed from setting) | Free delivery rules |
| `getAllProductandSearchProduct.js` | `/product` + filter | All-products page |
| `getRelatedProduct.js` | `/product/related_product` | PDP related section |
| `getSingleSellerProduct.js` | `/product/...` | "Other from this seller" |
| `getJustForProducts.js` | `/product/just_for_you_product` | Personalized list |
| `getPopularProducts.js` | `/product/popular_product` | Home popular section |
| `getTrendingProducts.js` | `/product/trending_product` | Trending |
| `getFlashSaleProducts.js` | (campaign filtered) | Home flash sale |
| `getECommerceChoiceProducts.js` | `/product/ecommerce_choice_product` | Curated picks |
| `getAllNewArrivalProduct.js` | `/product?sort=...` | New arrival |
| `getPreOrderProducts.js` | `/product/...` | Pre-order |
| `getAllCampaign.js`, `getCampaignProduct.js` | `/campaign`, `/campaign/:id` | Campaigns |
| `getAllOffers.js`, `getOfferProducts.js` | `/offer`, `/offer/:id` | Offers |
| `getFilterData.js`, `getFilterHeadData.js` | `/filter_product/...` | Sidebar filter, category page |
| `getProductQuestion.js` | `/question/:product_id` | PDP Q&A |
| `getReviewInDashboard.js`, `getUnReviewDashBoard.js` | `/review/...` | User profile reviews |
| `getAllOrders.js` | `/order` | User profile orders |

### ২. Client-side (RTK Query)

User-specific data, mutations, real-time state-এর জন্য:
- `useUserInfoQuery()` — current user
- `useUserLoginMutation()`, `useUserRegistrationMutation()`, etc.
- Cart endpoints
- Campaign mutations (admin uses similar pattern)

RTK Query auto-handles loading state, caching, refetching, invalidation।

---

## Authentication Flow

```
Sign-up:
  /sign-up → POST /user → SMS OTP send
  → /verify → POST /user/verifyOTP → user_verified: true
  → set-password (optional) → POST /user/setNewPassword

Sign-in:
  /sign-in → POST /user/login (cookie set: fruit_snacks_token)
  → userLogin mutation → syncCartAfterLogin() called
  → redirect to home or previous page

Logged-in state:
  useUserInfoQuery() returns user data
  cart, wishlist, orders accessible

Forget password:
  /forget-password → POST /user/forgetPassword → OTP via SMS
  → /change-password → POST /user/setNewPassword
```

### Unverified Banner

[`(frontend)/layout.js`](../FruitSnacksFrontend/src/app/(frontend)/layout.js)-এ `<UnverifiedBanner />` — যদি `user_verified === false`, top-এ banner দেখায় "Please verify your account"।

---

## Page Categories

### Home Page (Dynamic Section Renderer — Track D)

> ⚠️ Home আর hardcoded section list নয়। [`Home.jsx`](../FruitSnacksFrontend/src/components/frontend/home/Home.jsx) এখন **async server component** — SSR-এ `home_section_array` ([`/setting`](../FruitSnacksFrontend/src/components/lib/getServerSettingData.js)) fetch করে। Banner + FlashSale server-side render হয়; বাকি section [`SectionRenderer.jsx`](../FruitSnacksFrontend/src/components/frontend/home/SectionRenderer.jsx) (`"use client"`) handle করে — **শুধু enabled section, `order` অনুসারে sort করে** render। Admin → Home Layout থেকে drag-drop reorder + toggle।

**Section registry** (`SECTION_COMPONENTS` — id `setting.services.ts`-এর `HOME_SECTION_DEFAULTS`-এর সাথে match করতে হয়):

| Section id | Component | ধরন |
|-----------|-----------|------|
| `hero` / `flash_sale` | (server-side in Home.jsx) | hero carousel / flash countdown |
| `trending_products` | TrendingProduct | grid strip |
| `new_arrivals` | LatestProducts | grid strip |
| `category_wise_strip` | CategoryWiseProduct | per-category |
| `bestsellers` | PopularProducts | grid strip |
| `promo_banner` | PromotionalBanner | marketing |
| `feature_service` | FeatureService | trust cards |
| `ecommerce_choice` | ECommerceChoice | curated |
| `brand_story` | BrandStory | image+text+CTA (Track D) |
| `reviews_carousel` | ReviewsCarousel | Swiper — auto_featured / manual_pick |
| `site_faq` | SiteFaqSection | accordion (`/site-faq/active`) |
| `newsletter` | NewsletterForm | email/sms/both subscribe |
| **`hero_spotlight`** | **HeroSpotlight** | **boutique preset** |
| **`product_features`** | **ProductFeatures** | **boutique preset** |
| **`story_band`** | **StoryBand** | **boutique preset** |

### Boutique home preset (অল্প-product শপের জন্য)

পুরোনো marketplace grid অল্প product-এ (৫–৮টা) ফাঁকা দেখায় বলে একটা ২য় preset — premium animated storytelling। **Additive** (পুরোনো marketplace home অক্ষত, high-catalog preset হিসেবে)। ৩টা section ([`heroSpotlight/`](../FruitSnacksFrontend/src/components/frontend/home/heroSpotlight/), [`productFeatures/`](../FruitSnacksFrontend/src/components/frontend/home/productFeatures/), [`storyBand/`](../FruitSnacksFrontend/src/components/frontend/home/storyBand/)) + shared boutique components ([`home/boutique/`](../FruitSnacksFrontend/src/components/frontend/home/boutique/) — `bits.jsx`, `reveal.jsx`, `useBoutiqueProductActions.jsx`)। `trending_product`-flagged product Hero Spotlight + Product Features feed করে। Buy-now → checkout, responsive icon button (mobile icon-only / desktop +text), variation chip, image carousel। Admin → Home Layout-এ boutique section ON + grid section OFF করে switch করা হয়।

### Product Listing Pages

| Path | Component | Backend |
|------|-----------|---------|
| `/all-products` | `AllProduct.jsx` | `/product` (paginated) |
| `/all-ecommerce-product` | `AllECommerceProducts.jsx` | `/product/ecommerce_choice_product` |
| `/latest-product` | `LatestProducts.jsx` | `/product` (sort by date) |
| `/top-product` | `TopProduct.jsx` | `/product/popular_product` |
| `/new-arrival` | `NewArrivalProduct.jsx` | (new arrival logic) |
| `/all-trending-products` | `ViewAllTrendingProducts.jsx` | `/product/trending_product` |
| `/shop` | `Shop.jsx` | (combined filter view) |
| `/category/[...slug]` | `CategoryViewSection.jsx` | `/filter_product/...` |
| `/all-brands` | `AllBrand.jsx` | `/brand` |
| `/all-brands/brand-product/[id]` | (brand-filtered products) | `/product/brand_match_product` |

> **Route consolidation (Sprint 3 Track E):** আলাদা legacy listing route-গুলো এখন এক `ProductListing` engine + `/shop?sort=...` routing-এ একত্রিত (latest/top/new-arrival "View More" → `/shop`)। পুরোনো 5টা listing route noIndex + 301 → `/shop`। `/shop` ও `/offer` এখন indexable (robots + pageSeo fix)।

### Product Detail Page (PDP)

[`src/app/(frontend)/products/[slug]/page.js`](../FruitSnacksFrontend/src/app/(frontend)/products/[slug]/page.js):

1. SSR fetch: `GET /api/v1/product/:slug` (cache: no-store)
2. `redirect_slug` থাকলে old slug → new slug redirect (SEO 301)
3. Product null হলে "Not Found" UI
4. `<SingleProduct />` — main UI
5. `<ProductThemedSections />` — dynamic theme apply (theme_id থেকে)
6. JSON-LD structured data (Product schema with offers, aggregateRating)
7. Metadata (title, description, OG, Twitter card)

### PDP Components

| Section | File |
|---------|------|
| Photo gallery | `singeProduct/productDetails/ProductPhotoSelect.jsx` |
| Description | `singeProduct/productDescription/ProductDescription.jsx` |
| Right side (price, qty, add to cart) | `singeProduct/rightSideShoppingSection/RightSideShoppingSection.jsx` |
| Highlights / specs | `singeProduct/productHighLightSection/ProductHighlightSection.jsx` |
| Reviews + Q&A | `singeProduct/productReviewAccordion/`, `singeProduct/qnaAccordion/` |
| Return Policy | `singeProduct/returnPolicyAccordion/ReturnPolicyAccordion.jsx` |
| Related Products | `singeProduct/relatedProducts/RelatedProducts.jsx` |
| Seller Recent Products | `singeProduct/sellerProduct/RecentProducts.jsx` |

### Cart & Checkout

| Path | File | Logic |
|------|------|-------|
| `/cart` | `AddToCart.jsx` + `CartTable.jsx` + `CartSummary.jsx` + `CouponSection.jsx` | Cart items, coupon apply, totals |
| `/checkout` | `CheckoutProduct.jsx` + `DeliveryInformation.jsx` + `OrderSummaryTable.jsx` | Billing/shipping info, payment method, place order |
| `/orders/order-success` | `OrderSuccess.jsx` | Post-order thank you (invoice display) |
| `/orders/[orderId]` | `OrderInvoice.jsx` | Single order details + invoice |
| `/orders/order-tracking` | `OrderTrackingForm.jsx` | Invoice ID দিয়ে track |
| `/orders/order-tracking/[id]` | `OrderTracking.jsx` + `Stepper.jsx` | Status stepper |

Coupon apply: `POST /coupon/check_coupon` → validate → apply discount calc (`useCartCalculations` from `helper.js`)।

### User Profile / Dashboard

[`(user-profile)/user-profile/page.jsx`](../FruitSnacksFrontend/src/app/(user-profile)/user-profile/page.jsx) — tab-based dashboard:

- **Dashboard** — overview stats
- **Profile Setting** — name, address, image update
- **Purchase History** — past orders
- **Review** — written reviews + to-be-reviewed (delivered orders পাঠানো হয়েছে কিন্তু রিভিউ নেই)
- **Offer History** — অফার অর্ডার (এখন unified order; `order_type:"offer"`)
- **Wishlist** — saved products
- **Change Password**

---

## Price Calculation Logic

`src/utils/helper.js` — সবচেয়ে গুরুত্বপূর্ণ utility।

### Discount Priority

```
Flash Sale (campaign-এর মধ্যে flash_sale_details)
  ↓
Campaign (campaign_details.campaign_product)
  ↓
Variation discount price (যদি variation product হয়)
  ↓
Variation price
  ↓
Product discount price
  ↓
Product price (default)
```

### Functions

| Function | Use |
|----------|-----|
| `productPrice(product)` | Current selling price (priority অনুসারে) |
| `lineThroughPrice(product)` | Original price (cross-out দেখানোর জন্য) |
| `singleProductPrice(product)` | PDP-তে variation[0] consideration |
| `singleProductLineThroughPrice(product)` | PDP cross-out price |
| `calculatePrice(original, discount, type)` | "percent" or "fixed" দিয়ে calc |
| `useCartCalculations({ cartData, products, couponData, shippingCharge })` | Cart-এ subtotal, grand total, total discount, per-product adjusted prices (coupon apply) |
| `updateRecentProducts(product)` | localStorage-এ recent viewed track (max 5) |

### Coupon Logic (in `useCartCalculations`)

- `coupon_product_type: "all"` → cart-level discount
- `coupon_product_type: "specific"` → per-product check
- `coupon_type: "fixed"` → subtract amount
- `coupon_type: "percent"` → percentage with optional `coupon_max_amount` cap

---

## SEO Strategy

### Metadata API

Each page exports `generateMetadata()` — Next.js builds title/description/OG/Twitter tags server-side।

Two helpers:
1. [`buildPageMeta(page_key)`](../FruitSnacksFrontend/src/components/lib/buildPageMeta.js) — DB থেকে `/page-seo/:key` fetch, fallback to [`PAGE_SEO`](../FruitSnacksFrontend/src/components/utils/pageSeo.js) static object
2. [`getSeoConfig()`](../FruitSnacksFrontend/src/components/lib/getSeoConfig.js) — site-wide SEO (siteName, siteUrl, default title, logo, analytics IDs)

### Per-Page Metadata

```js
// Home, Cart, About-Us etc. — generic
export const generateMetadata = () => buildPageMeta("home");

// Product detail — dynamic from product data
export async function generateMetadata({ params }) {
  const product = await fetch(`${BASE_URL}/product/${params.slug}`);
  return { title: product.product_name, openGraph: {...}, ... };
}
```

### Structured Data (JSON-LD)

- **Organization** ([`layout.js`](../FruitSnacksFrontend/src/app/layout.js)) — sitewide
- **Product** (PDP) — name, image, offers, aggregateRating

### Sitemap & Robots

- [`src/app/sitemap.js`](../FruitSnacksFrontend/src/app/sitemap.js) — static pages + dynamic products + categories
- [`src/app/robots.js`](../FruitSnacksFrontend/src/app/robots.js) — robots.txt directives

### Slug History (301 redirect)

PDP route — backend `/product/:slug` response-এ `redirect_slug` থাকলে frontend `redirect()` call করে। SEO-friendly old URL → new URL।

---

## Analytics Integration

[`src/components/analyticsScripts/`](../FruitSnacksFrontend/src/components/analyticsScripts/) — ৪টি analytics provider:

1. **Meta Pixel** (Facebook) — both client (browser) and CAPI (server)
2. **TikTok Pixel** — both client and CAPI
3. **Google Tag Manager** (GTM) — দিয়ে GA4
4. **Microsoft Clarity** — heatmap/session recording

### Script Loading

Root [`layout.js`](../FruitSnacksFrontend/src/app/layout.js):
```jsx
{seo.gtmId && <GoogleTagManager gtmId={seo.gtmId} />}
{seo.metaPixelId && <MetaPixelScript pixelId={seo.metaPixelId} />}
{seo.tiktokPixelId && <TikTokPixelScript pixelId={seo.tiktokPixelId} />}
{seo.clarityId && <MicrosoftClarity clarityId={seo.clarityId} />}
```

Setting-এ toggle off হলে ID `null` হয় → script load হয় না।

> **DB-driven IDs (S4+S5):** analytics ID (Meta Pixel/TikTok/GTM/GA4/Clarity) এখন **DB থেকে** আসে (Admin → Settings → Analytics), env থেকে নয় — buyer কোড ছাড়াই Admin থেকে সেট করতে পারে। CAPI access token Settings → Secrets-এ (public `/setting`-এ আসে না)। env var fallback হিসেবে থাকে।

### Event Tracking

[`useAnalytics()` hook](../FruitSnacksFrontend/src/components/analyticsScripts/utils/useAnalytics.js) — unified API সব provider-এ একসাথে event পাঠায়:

- `trackViewContent(product)` — PDP visit
- `trackAddToCart(product, variation, quantity)`
- `trackInitiateCheckout(orderData)`
- `trackPurchase(orderData)`
- `trackSearch(searchString)`
- `trackLogin()`, `trackCompleteRegistration()`
- `trackAddToWishlist(product)`

CAPI (Conversion API) → ব্যাকএন্ডের `/meta-pixel/event`, `/tiktok-pixel/event` route-এ POST। `eventID` দিয়ে browser + server event deduplicate হয়।

### Advanced Matching

[`AnalyticsAdvancedMatching.jsx`](../FruitSnacksFrontend/src/components/analyticsScripts/utils/AnalyticsAdvancedMatching.jsx) — logged-in user-এর data Meta/TikTok-কে hashed পাঠায় (email, phone) — better match rate।

---

## Dynamic Product Page System

Per-product theme apply করতে frontend-এ:

- [`src/components/theme/ProductThemedSections.jsx`](../FruitSnacksFrontend/src/components/theme/ProductThemedSections.jsx) — PDP-তে theme অনুযায়ী sections render
- [`src/components/theme/AnnouncementBar.jsx`](../FruitSnacksFrontend/src/components/theme/AnnouncementBar.jsx) — top rolling banner (setting.announcement_bar থেকে)

Product object-এ `theme_id` populated থাকে — colors, floating_assets, typography, button_style সব apply।

### Floating images — section-anchored (rethink)

[`src/lib/theme/`](../FruitSnacksFrontend/src/lib/theme/)-এর `mergeFloating()` theme-এর global `floating_assets[]`-এর উপর product-এর `floating_overrides` (hide/replace/extra) layer করে (dead-ref guard সহ), একবার PDP page-level-এ `theme.floating_assets`-এ inject করে — তারপর প্রতিটা section-এর `<FloatingAssets/>` merged set render করে। পুরোনো full-page `ProductFloatingImages` (z-index trap) সরানো হয়েছে; `globals.css`-এ `prefers-reduced-motion` float anim বন্ধ করে।

---

## Styling

### Tailwind Config

[`tailwind.config.js`](../FruitSnacksFrontend/tailwind.config.js)-এ 5-palette color system:

- **primary** (brand main)
- **secondary**
- **accent**
- **neutral**
- **complementary**

প্রতিটার ৯টা shade (50, 100, 200, ..., 900)। `text-primary-700`, `bg-secondary-100`, etc.

### Shadcn UI

[`src/components/ui/`](../FruitSnacksFrontend/src/components/ui/) — Button, Input, Dialog, Toast ইত্যাদি primitive। `cn()` utility ([`src/lib/utils.js`](../FruitSnacksFrontend/src/lib/utils.js)) Tailwind class merge-এর জন্য।

### Fonts

[`src/utils/font.js`](../FruitSnacksFrontend/src/utils/font.js) — body font + Bangla font (`hind-siliguri` ইত্যাদি) Next.js Font Optimization দিয়ে।

### Path Aliases

[`jsconfig.json`](../FruitSnacksFrontend/jsconfig.json):
```json
{ "compilerOptions": { "baseUrl": "src", "paths": { "@/*": ["*"] } } }
```
`@/components/...`, `@/utils/...`, `@/redux/...` — সব `src/` থেকে।

---

## Common Patterns

### Search Debouncing

[`src/hook/useDebounced.js`](../FruitSnacksFrontend/src/hook/useDebounced.js) — input এ ৪০০ms delay, তারপর fetch।

### Countdown Timer

[`src/helper/CountDownTimer.jsx`](../FruitSnacksFrontend/src/helper/CountDownTimer.jsx) — flash sale, campaign end time।

### Skeleton Loaders

[`src/components/shared/loader/`](../FruitSnacksFrontend/src/components/shared/loader/) — CartTableSkeleton, CartSummarySkeleton, WishlistTableSkeleton, DeliveryInformationSkeleton ইত্যাদি (react-loading-skeleton)।

### Quick View Modal

[`src/components/shared/quickViewModal/QuickViewModal.jsx`](../FruitSnacksFrontend/src/components/shared/quickViewModal/QuickViewModal.jsx) — product card-এ hover/click করে quick preview (cart-edit mode-ও সাপোর্ট করে, `createPortal(…, document.body)`)।

### Chat Widgets (floating, external handoff)

[`src/components/shared/ChatWidgetStacker.jsx`](../FruitSnacksFrontend/src/components/shared/ChatWidgetStacker.jsx) — ৩টা floating button, কাস্টমারকে **external chat**-এ পাঠায় (কোনো in-app messaging/chat DB নেই):
- **WhatsApp** → `wa.me/<owner phone>` (পুরোনো `enable_whatsapp_chat`)
- **Messenger** → `m.me/<chat_messenger_page_id>` (FB Page inbox; `chat_messenger_show` দিয়ে gated)
- **Live chat** → Tawk.to/Crisp embed (`chat_livechat_embed_code`, `chat_livechat_show` দিয়ে gated)

> ⚠️ **key gotcha:** React `dangerouslySetInnerHTML` injected `<script>` execute করে না। তাই live-chat embed parse করে runtime-এ আসল `document.createElement("script")` দিয়ে re-create করা হয়। field name অবশ্যই `chat_*_show` (পুরোনো `chat_*_enabled` ছিল bug)। position `chat_widgets_position` setting থেকে। সব message আমাদের সিস্টেমের বাইরে handle হয়।

### Date Formatting

[`src/components/utils/EnglishDate*`](../FruitSnacksFrontend/src/components/utils/) — short/long/with-time format।

### Number with Comma

[`src/components/utils/numberWithComa.js`](../FruitSnacksFrontend/src/components/utils/numberWithComa.js) — price display (12,500)।

---

## Image Domains

[`next.config.mjs`](../FruitSnacksFrontend/next.config.mjs) — allowed external hosts:
- DigitalOcean Spaces (S3 storage)
- Contabo (alternative S3)
- Cloudinary
- Unsplash

নতুন CDN/host যোগ করতে এখানে।

---

## Connection to Backend

### Endpoint Mapping (Frontend → Backend)

| Frontend Path | Backend Endpoint | Cache Strategy |
|---------------|------------------|----------------|
| `/` (home) | বিভিন্ন (banner, slider, products) | ISR 60-600s |
| `/products/:slug` | `/product/:slug` | no-store (real-time price) |
| `/category/:...slug` | `/filter_product/...` | ISR 60s |
| `/all-products` | `/product` (paginated) | ISR 60s |
| `/cart` | `/cart` (logged-in only) | RTK Query |
| `/checkout` | `/order` (POST) + `/setting/zone` | client-side |
| `/orders/:id` | `/order/:order_id` | client-side |
| `/orders/order-tracking` | `/order/order_tracking` | client-side |
| `/wishlist` | `/wishlist` (DB-backed, D15) + guest localStorage merge | RTK Query |
| `/campaign/:id` | `/campaign/:_id` | ISR |
| `/offer/:id` | `/offer/:_id` | ISR |
| `/user-profile` | `/get_me`, `/order`, etc. | RTK Query |
| `/sign-in`, `/sign-up`, etc. | `/user/login`, etc. | RTK Query mutations |

### Cookie Auth

সব fetch-এ `credentials: "include"` — backend httpOnly cookie `fruit_snacks_token` automatic পাঠানো। JWT manual handling নেই।

---

## Environment Variables

`.env.local`:
```
NEXT_PUBLIC_API_URL=       # Backend root, NO trailing /api/v1
NEXT_PUBLIC_SITE_URL=      # Full site URL for SEO/canonical

# Analytics IDs (.env, NOT NEXT_PUBLIC — server-side only)
META_PIXEL_ID=
GTM_ID=
GA4_ID=
CLARITY_ID=
TIKTOK_PIXEL_ID=

# Optional
GOOGLE_VERIFICATION=       # Google Search Console
META_CAPI_ACCESS_TOKEN=    # Meta CAPI server token
TIKTOK_CAPI_ACCESS_TOKEN=  # TikTok CAPI server token
```

⚠️ Analytics IDs **NEXT_PUBLIC_ ছাড়া** — server-side ([`getSeoConfig.js`](../FruitSnacksFrontend/src/components/lib/getSeoConfig.js)-এ access)।

---

## Build & Deploy

```bash
npm run dev      # Next.js dev server (port 3000, hot reload)
npm run build    # Production build — .next/ folder
npm run start    # Production server (after build)
npm run lint     # ESLint check
```

Vercel-এ deploy easiest। `dist/` static-only না — server runtime দরকার (SSR/ISR-এর জন্য)।

⚠️ `next.config.mjs`-এ TypeScript errors ignored:
```js
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

এটা risky — production-এ type/lint error থাকলেও build pass।

---

## Notable Files

| File | কেন গুরুত্বপূর্ণ |
|------|-----------------|
| [`src/redux/store.js`](../FruitSnacksFrontend/src/redux/store.js) | Redux configuration + SSR safe cart hydration |
| [`src/redux/api/baseApi.js`](../FruitSnacksFrontend/src/redux/api/baseApi.js) | RTK Query single instance |
| [`src/redux/cartLocalstorageMiddleware.js`](../FruitSnacksFrontend/src/redux/cartLocalstorageMiddleware.js) | Cart dual-storage core logic |
| [`src/utils/cartSync.js`](../FruitSnacksFrontend/src/utils/cartSync.js) | Cart login sync + DB load |
| [`src/utils/helper.js`](../FruitSnacksFrontend/src/utils/helper.js) | Price calculation + coupon logic |
| [`src/components/lib/buildPageMeta.js`](../FruitSnacksFrontend/src/components/lib/buildPageMeta.js) | SEO metadata builder |
| [`src/components/lib/getSeoConfig.js`](../FruitSnacksFrontend/src/components/lib/getSeoConfig.js) | Centralized site SEO config |
| [`src/app/layout.js`](../FruitSnacksFrontend/src/app/layout.js) | Root — analytics, providers, metadata |
| [`src/app/(frontend)/products/[slug]/page.js`](../FruitSnacksFrontend/src/app/(frontend)/products/[slug]/page.js) | PDP — slug redirect, JSON-LD, themed sections |
| [`src/components/analyticsScripts/utils/useAnalytics.js`](../FruitSnacksFrontend/src/components/analyticsScripts/utils/useAnalytics.js) | Unified event tracking |
| [`CLAUDE.FILEMAP.md`](../FruitSnacksFrontend/CLAUDE.FILEMAP.md) | প্রতিটি ফিচারের সব ফাইল |
