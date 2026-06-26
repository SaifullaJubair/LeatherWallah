# FruitSnacks Storefront — V2 Rebuild Feature Checklist

> **Purpose:** complete feature inventory of the LIVE FruitSnacks storefront so the V2 Next.js
> App Router rebuild (RSC-first, drop RTK Query, keep Redux for cart only) loses NOTHING — every
> route, home section, PDP section, cart/checkout logic, auth, SEO, analytics, with exact reference
> file paths under `c:\Coding\Perosnal\FruitSnacks\FruitSnacksFrontend`. Generated 2026-06-25
> (session 56) by a read-only exploration agent. See [[v2-branch-and-staging-model]] for strategy;
> pairs with [V2_ADMIN_FEATURE_CHECKLIST.md](V2_ADMIN_FEATURE_CHECKLIST.md).
>
> Stack today: Next 16.2 / React 18, Redux Toolkit + RTK Query + TanStack Query (both wired),
> Tailwind + Shadcn, Swiper, Framer Motion, cookie auth `fruit_snacks_token`, dual-storage cart.
>
> **⭐ Critical V2 note:** most page data is NOT via RTK Query. RTK Query only defines `userInfo`,
> auth mutations, and dead banner/campaign mutations. The real data layer = native `fetch` in
> `src/components/lib/get*.js` (SSR + `revalidate`) + TanStack Query for cart/settings. The cart is
> the only thing Redux genuinely owns. So "drop RTK Query, keep Redux for cart" is already ~90% the
> current shape — V2 formalizes it: RSC `fetch` for everything server-renderable, thin client cart
> slice, React Query (or RSC actions) for cart/coupon/order mutations.

---

## 1. App Shell / Root Layout

### 1.1 Root layout + providers
- **File:** `src/app/layout.js` (RSC) → `src/components/providers/Providers.jsx` (Redux + `CartLoader` + `WishlistLoader`) → `src/components/providers/QueryProviders.jsx` (TanStack).
- **Preserve:** `generateMetadata()` (title template `%s | {siteName}`, robots, OG/Twitter, Google verification from `getSeoConfig()`); **DB-driven favicon** injected manually in `<head>` (NOT Next `icons` — to beat static `/favicon.ico`); **Organization JSON-LD**; `<html lang="bn">`, fonts `src/utils/font.js`; `CartLoader` (local→`syncCartAfterLogin` else `loadCartFromDB`); `WishlistLoader`.
- **Data:** `getSeoConfig()` → `/setting` (revalidate 60s). **Analytics:** GTM/Meta/TikTok/Clarity scripts injected here (§11).
- **V2 improve:** two data libs wired (consolidate); `/setting` double-render (SSR + client) — pass from RSC.

### 1.2 Frontend group layout (chrome)
- **Route group:** `(frontend)` · **File:** `src/app/(frontend)/layout.js` (RSC async).
- **Sub:** `theme/AnnouncementBar.jsx`, `shared/navbar/Navbar.jsx` (+SecondNavbar/BottomNavbar/**MobileNavbar** [⚠️ checklist earlier said `MobileNavBarUserDashBoard` — that file does NOT exist; the real mobile menu is `MobileNavbar.jsx`]/MobileMenu/NavManu/SearchBar/TopNavbar), `common/unverifiedBanner/UnverifiedBanner.jsx`, `shared/FloatingWhatsApp.jsx`, `shared/ChatWidgetStacker.jsx`, `shared/footer/Footer.jsx`.
- **Data:** `getMenu()` → `/category/tree` (revalidate 600s, adapted to legacy 3-level shape), `getServerSettingData()` for announcement bar.
- **V2 improve:** consume `/category/tree` natively (drop legacy-shape adapter).

### 1.3 Floating widgets (preserve)
- **FloatingWhatsApp** (`shared/FloatingWhatsApp.jsx`): if `enable_whatsapp_chat` + `whatsapp_number`.
- **ChatWidgetStacker** (`shared/ChatWidgetStacker.jsx`): FB Messenger SDK (`chat_messenger_show`+`chat_messenger_page_id`, fallback `m.me/`) AND arbitrary live-chat embed (`chat_livechat_show`+`chat_livechat_embed_code` — parses `<script>` + re-creates real nodes so Tawk/Crisp run). Position `chat_widgets_position`.

### 1.4 Error / Not-found
- `src/app/error.js`, `src/app/not-found.js`. **V2 improve:** add route-level `loading.js` skeletons (currently ad-hoc `<Suspense>` + `react-loading-skeleton`).

---

## 2. Home Page + Section Registry

### 2.1 Home (DB-driven order)
- **Route:** `/` · **File:** `src/app/(frontend)/page.js` (RSC) → `src/components/frontend/home/Home.jsx` (RSC async).
- **Logic:** reads `setting.home_section_array` (`{id,order,enabled}`), renders `<Banner/>` server-side then `<SectionRenderer sections settings/>`.
- **Registry:** `src/components/frontend/home/SectionRenderer.jsx` (`"use client"`) — maps id→component, filters enabled, sorts order, skips server ids (`hero`,`flash_sale`). **IDs must match `HOME_SECTION_DEFAULTS` in backend `setting.services.ts`.**
- **SEO:** `buildPageMeta("home")`.
- **V2 improve:** SectionRenderer is `"use client"` + static-imports every section (no `next/dynamic`) → ships all home JS. V2: RSC dispatch, lazy-load only enabled sections.

### 2.2 Home section catalog (id → component → file)
| id | Component | File |
|---|---|---|
| `hero` | Banner (+BannerItem, BannerSwiperRight, MobileBanner) | `home/banner/*` |
| `flash_sale` (off) | FlashSale (+FlashClockCounter, FlashProductSlider) | `home/flashSale/*` |
| `trending_products` | TrendingProduct (+TrendingSlider) | `home/trendingProduct/*` |
| `new_arrivals` | LatestProducts (+LatestProductGrid) | `home/latestProducts/*` |
| `category_wise_strip` | CategoryWiseProduct | `home/categoryWiseProduct/CategoryWiseProduct.jsx` |
| `bestsellers` | PopularProducts | `home/popularProducts/PopularProducts.jsx` |
| `promo_banner` | PromotionalBanner | `home/promotionalBanner/PromotionalBanner.jsx` |
| `feature_service` | FeatureService | `home/featureService/FeatureService.jsx` |
| `brand_story` | BrandStory | `home/brandStory/BrandStory.jsx` |
| `reviews_carousel` | ReviewsCarousel | `home/reviewsCarousel/ReviewsCarousel.jsx` |
| `site_faq` | SiteFaqSection | `home/siteFaqSection/SiteFaqSection.jsx` |
| `newsletter` | NewsletterForm | `home/newsletterForm/NewsletterForm.jsx` |
| `ecommerce_choice` | ECommerceChoice | `home/eCommerceChoice/ECommerceChoice.jsx` |
| `hero_spotlight` (Boutique) | HeroSpotlight | `home/heroSpotlight/HeroSpotlight.jsx` |
| `product_features` (Boutique) | ProductFeatures | `home/productFeatures/ProductFeatures.jsx` |
| `story_band` (Boutique) | StoryBand | `home/storyBand/StoryBand.jsx` |
| unwired (skipped) | trust_strip, feature_categories, offers_block, just_for_you | — |
- **Boutique preset** = few-products storytelling home (ship disabled; small-catalog client enables + disables grids). **Section array must stay FULL set (toggle off, never trim).**
- ⚠️ **Built-but-UNMAPPED sections** (component files exist + functional but NOT in SectionRenderer's map — decide in V2 whether to wire or drop): `home/featureCategories/FeatureCategories.jsx`, `home/newFeatureCategories/NewFeatureCategories.jsx` (+`NewFeatureCategorySwiper.jsx`), `home/onlyForYouProduct/OnlyForYouProduct.jsx` (getJustForYouProducts), `home/sliderAd/SliderAd.jsx` (+`SliderAdSection.jsx`, getSlider), `home/adsSection/AdsSection.jsx` (static banner).
- **Boutique shared utils** (`home/boutique/`): `bits.jsx` (SectionHeading/GlowBlob/BgGradient), `reveal.jsx` (Framer Motion reveal wrapper), `useBoutiqueProductActions.jsx` — used by heroSpotlight/productFeatures/storyBand for consistent styling. Port these as shared boutique primitives.
- **Data:** lib helpers `getBanner`/`getSlider`/`getPopularProducts`/`getTrendingProducts`/`getECommerceChoiceProducts`/`getAllNewArrivalProduct` (native fetch + revalidate).

---

## 3. Catalog / Shop / Search

### 3.1 Shop
- **Route:** `/shop` · **File:** `src/app/(frontend)/shop/page.jsx` → `frontend/shop/Shop.jsx`. `?sort=` routing (home strip "View More" deep-links). Indexable, in sitemap.

### 3.2 Category (nested catch-all) + filters
- **Route:** `/category/[...slug]` · **File:** `src/app/(frontend)/category/[...slug]/page.js` (RSC catch-all, infinite-depth).
- **Components:** `categoryview/CategoryViewSection.jsx` (`useSearchParams` → `<Suspense>`), `CategoryViewCard.jsx`, `FilterSection.jsx`, `PriceRangFilter.jsx`.
- **Data:** `getFilterData(leafSlug)` + `getFilterHeadData({categoryType:leafSlug})` (facets scoped to leaf subtree; heading chips = leaf direct children).
- **SEO:** per-category metadata (title `Leaf – Root`, canonical `category/{slug.join("/")}`). **`params` is a Promise — await it.**

### 3.3 Other listing routes
| Route | File | Component |
|---|---|---|
| `/all-products` | `(frontend)/all-products/page.jsx` | seeAllProduct/AllProduct, ShowAllProduct |
| `/all-ecommerce-product` | `(frontend)/all-ecommerce-product/page.jsx` | allECommerceProducts/* |
| `/latest-product` | `(frontend)/latest-product/page.js` | ⚠️ actually `justForYouAll/JustForYouAllProduct` (NOT NewArrivalProduct) |
| `/new-arrival` | `(frontend)/new-arrival/page.jsx` | NewArrivalProduct |
| `/top-product` | `(frontend)/top-product/page.jsx` | topProduct/TopProduct, ProductInfo |
| `/all-trending-products` | `(frontend)/all-trending-products/page.js` | viewAllTrendingProduct/* |
| `/all-brands`, `/all-brands/brand-product/[id]` | `(frontend)/all-brands/*` | allBrand/AllBrand; brand-product page = inline (⚠️ `topBrand/TopBrand.jsx` is DEAD/unused — don't port). Also dead: `topCategory/` folder (no route) |
| `/compare` | `(frontend)/compare/page.js` | compare/MainCompare, ComparisonTable |
| `/campaign`, `/campaign/[id]` | `(frontend)/campaign/*` | campaign/* (clock counters) |
| `/offer`, `/offer/[id]` | `(frontend)/offer/*` | offer/* (clock, ProductTable, OfferSummary) |
- **Data libs:** `getAllProductandSearchProduct`, `getJustForProducts`, `getPreOrderProducts`, `getAllCampaign`, `getCampaignProduct`, `getAllOffers`, `getOfferProducts`, `getFlashSaleProducts`.

### 3.4 Search
- **Components:** `frontend/searchForm/SearchForm.jsx`, `shared/navbar/SearchBar.jsx` (4-tier dropdown). **Data:** `getAllProductandSearchProduct`. **Analytics:** `trackSearch` (Meta/TikTok/GTM).

### 3.5 Shared card niceties (preserve)
- **QuickViewModal** (`shared/quickViewModal/QuickViewModal.jsx`) — own add-to-cart + variation + price.
- **updateRecentProducts** (`utils/helper.js`) — `localStorage["recent-products"]` max 5, variation-aware; rendered by `themedProduct/.../sellerProduct/RecentProducts.jsx`.
- **Wishlist heart + Compare** via `localStorage["wishlist"]`/`["compare"]` + `window.dispatchEvent("localStorageUpdated")`.

---

## 4. PDP — THE BIG ONE

> Live `/products/[slug]` = THEMED PDP (`components/frontend/themedProduct/`). Non-themed variant = `components/frontend/singeProduct/` (folder misspelled). `/products-themed/[slug]` = dev preview. **V2: rebuild from the themed version.**

### 4.1 PDP route (server shell)
- **Route:** `/products/[slug]` · **File:** `src/app/(frontend)/products/[slug]/page.js` (RSC async).
- **Data (parallel `Promise.all`):** `getSeoConfig()`; `GET /product/{slug}` **`cache:"no-store"`**; `GET /setting` (60s); `GET /trust-point` (60s, own module not settings).
- **Logic:** `redirect_slug` → **301 redirect** (slug-history SEO); `mergeTheme(theme_id)` + `mergeFloating(...)`; `ThemeStyleInjector` page-level CSS vars; variation-aware `totalStock`.
- **SEO (#1 risk — must NOT regress):** `generateMetadata` (per-product meta/og with fallbacks, canonical `products/{slug}`, OG `article`, `robots:noindex` for redirect/not-found); **Product JSON-LD** (image/brand/sku/offers w/ currency+price+priceValidUntil+availability, aggregateRating when reviews); **BreadcrumbList JSON-LD**.
- **V2 improve:** **PDP double-fetches** product (`generateMetadata` + body, both `no-store`) — wrap in `cache()`.

### 4.2 PDP hub (all interactive logic) — keystone port target
- **File:** `src/components/frontend/themedProduct/singeProduct/SingleProduct.jsx` (~1194 lines, `"use client"`). Owns:
  - **Variation selection** (`selectedVariations`, `handleSelectVariation`) + **combination[] set-intersection match** (`findVariationByValueIds`, order-agnostic, Bangla-safe, N-axis).
  - **URL ↔ variation sync** — `/products/:slug?<attr_slug>=<value_slug>` (e.g. `?color=jet-black&size=l`), `router.replace({scroll:false})`, ObjectId fallback for non-ASCII (`safeKey`/`PURE_ASCII_SLUG`); init seeds from URL else **first in-stock active variation**.
  - **Per-variation price/stock** (`applyVariationPriceStock`, flash/campaign aware via `calculatePrice`).
  - **Quantity stock-clamp** (`handleIncrement/Decrement`, `maxQuantity`).
  - **Add to cart** (`handleAddToCart` → `addToCart({...maxStock})`, already-in-cart guard, toast, animation, `trackAddToCart`).
  - **Wishlist** (localStorage + `addToWishlistRemote`/`removeFromWishlistRemote` for logged-in + `trackAddToWishlist`); **Compare** (localStorage).
  - **Buy-Now order form** (`handleOrderProduct` → `POST /order/single_order`, separate from cart): phone validate + `normalizeBdPhone`, Pathao city/zone, shipping by Dhaka/outside, `firePurchaseOnce`→`trackPurchase`, route `/orders/order-success?...&guest=`.
  - **Analytics:** `trackViewContent` on mount, `trackInitiateCheckout` on phone (once); `updateRecentProducts` on mount.
- **Helpers to port (`utils/helper.js`):** `variantAxisAttributes`, `buildVariationAvailabilityMap`, `wouldComboBeInStock`, `singleProductPrice`, `calculatePrice`.

### 4.3 PDP sub-sections (every one)
- **Hero:** name (splits `Name (Subtitle)`), `badge_text`, `hero_corner_badge`, `short_description`, `short_features` (icon/dot), price+line-through+discount%, `PdpPriceMeta` (flash countdown+sold+tier hint), SKU, star rating, CTA scroll + **WhatsAppOrderButton**.
- **HeroGallery** (`themedProduct/theme/HeroGallery.jsx`) — **per-variant gallery auto-switch** (variation image leads → main → others → video); full-screen **lightbox** (Swiper Zoom/Keyboard, pinch/double-tap, ESC, scroll-lock); inline video player + enlarge; `allow_image_download` right-click guard.
- **VariationPicker** (`themedProduct/singeProduct/VariationPicker.jsx`) — **swatch/button/dropdown**: swatch+hex→circle, swatch-no-hex→button (C12), dropdown→native `<select>` (C11); OOS cue (faded+slash swatch, strikethrough button, dead-combo toast C9); visible cap 8/14/20 + "+N more"→`OverflowValuesModal`; variation badge pill (DynamicIcon); only values present in an active combination; aria.
- **PdpPriceMeta**, **ViewCountFire** (`POST /product/view-count` session-deduped), **ChartModal** (size chart), **OverflowValuesModal**.
- **Right-side shopping** (`rightSideShoppingSection/`): RightSideShoppingSection, RightSideProductSummary, RightSideDeliveryInfo, MobileDeliveryInfoAccordion.
- **ProductHighlightSection**, **ProductDescription** (rich HTML).
- **Lower themed sections** (`ProductThemedSections.jsx` registry, render if `hasContent`): VideoSection, DescriptionCard (description + `custom_fields` spec table, self-hides), BenefitsUseCasesSection, SizeGuideSection (size_guide_rows + size_chart), NutritionSection (nutrition + trustPoints), ReviewsSection (`GET /review/{id}`, gated `enable_reviews`), RelatedProductsThemed (`getRelatedProduct`), FaqSection, OfferBanner, OfferDiscoveryBanner (`GET /offer/by-product/{id}`, self-hides).
- **Reviews & Q&A:** `productReviewAccordion/` (CustomerReviewSection, ReviewAndReply, WriteProductReview, UploadReviewImage), `qnaAccordion/QnAAccordion`, `returnPolicyAccordion/ReturnPolicyAccordion`. Data: `getProductQuestion`, `getReviewInDashboard`.
- ⚠️ **RecentProducts ("recently viewed") is a LIVE GAP** — the themed PDP imports `updateRecentProducts` (writes localStorage) but **never renders** the `<RecentProducts/>` component (`themedProduct/singeProduct/sellerProduct/RecentProducts.jsx` exists, unmounted). **V2: wire it.**
- 🧹 **Orphaned dead code (do NOT port):** `themedProduct/theme/ProductFloatingImages.jsx` (replaced by FloatingAssets), `theme/sections/BenefitsSection.jsx` + `UseCasesSection.jsx` (BenefitsUseCasesSection renders both inline), `theme/sections/HeroEnrichment.jsx` (hero now inline in SingleProduct), and the entire OLD `src/components/theme/` dir (live code uses `components/frontend/themedProduct/theme/`). Old non-themed `components/frontend/singeProduct/` = legacy `/products-original` backup.
- **Floating images:** `FloatingAssets.jsx` per themed section (`section="hero"|"order"|...`), merged `theme.floating_assets`, reduced-motion aware.
- **Theme injection:** `ThemeStyleInjector.jsx` (CSS vars `--brand-primary`/`--page-bg`/`--brand-font`/`--button-radius`), `AnnouncementBar.jsx`, `WhatsAppOrderButton.jsx`.

### 4.4 Themed-PDP libs (port)
- `src/lib/theme/mergeTheme.js` (deep-merge overrides + `NEUTRAL_FALLBACK` default green); `mergeFloating.js` (hidden_ids/replacements/extras + dead-ref guard); `formatWeight.js`; `whatsappLink.js`; `src/lib/icons/DynamicIcon.jsx` + `registry.js`.

### 4.5 QR short-link
- **Route:** `/q/[code]` · **File:** `src/app/(frontend)/q/[code]/page.js`. `force-dynamic`, `robots:noindex`. `GET /product/by-qr-code/{code}` → 301 to `/products/{slug}`, friendly dead page.

---

## 5. Cart / Checkout / Order

> **NO standalone `/cart` page.** Cart UI + delivery + place-order = **`AddToCart` inside `/checkout`**.

### 5.1 Checkout (= cart + order flow)
- **Route:** `/checkout` · **File:** `src/app/(frontend)/checkout/page.jsx` (RSC, `buildPageMeta("checkout")`) → `src/components/frontend/cart/AddToCart.jsx` (`"use client"`, the engine).
- **Sub:** `cart/CartTable.jsx`, `cart/CartSummary.jsx`, `cart/CouponSection.jsx`; `checkout/DeliveryInformation.jsx` (incl. **saved-address picker** w/ default auto-apply). Skeletons: `shared/loader/CartTableSkeleton.js` etc.
- 🧹 **Orphaned/parked checkout components (do NOT auto-port — wire only if feature wanted):** `checkout/CheckoutProduct.jsx` (REMOVED — old dead dup, gone), `checkout/OrderSummaryTable.jsx` (exists, unused), `checkout/PaymentInitModal.jsx` + `PaymentMethodPicker.jsx` + `AdvancePayPicker.jsx` + `LoyaltyRedeemPanel.jsx` (built for future non-COD payment, not wired), **`AbandonedCartCapture.jsx`** (sophisticated: debounced 30s + beforeunload/pagehide keepalive + phone-normalize + step-tracking → `POST /abandoned-cart/capture`; **built but NEVER instantiated** — V2: decide wire vs drop; the BE/Admin abandoned-cart side IS live).
- **Data:**
  - **Cart hydration via TanStack Query** — `useQuery(["/api/v1/product/cart_product", cartKey], fetchCartDetails)` → `POST /product/cart_product`. `staleTime:60_000` (F1.1 fix so campaign price can't stale).
  - **Coupon:** `POST /coupon/check_coupon` (gated `enable_promo_at_checkout`).
  - **Saved addresses (logged-in):** `GET /user/addresses` → prefill.
  - **Zones:** `getZoneData(divisionID)`. **Shipping:** `getShippingConfiguration`.
  - **Place order:** `POST /order`. On success: `allRemoveFromCart()`, `PUT /cart` clear, `firePurchaseOnce`→`trackPurchase`, route `/orders/order-success`. Captures `_fbc`/`_fbp` for CAPI.
- **Toggles:** `show_email_field_checkout`, `enable_promo_at_checkout`, `min_order_amount`, inside/outside Dhaka charge+days.
- **Pricing:** `useCartCalculations` → `applyCartLayers` (§9) + shipping.
- **Analytics:** `trackInitiateCheckout` (value>0, num_items=Σqty), `trackPurchase`.

### 5.2 Cart state (Redux — keep)
- `src/redux/feature/cart/cartSlice.js` — `addToCart` (additive merge clamped `maxStock`), `removeFromCart`, `replaceCartItem` (3-case atomic swap), `increment/decrement/updateQuantity` (clamped), `setCartFromDB`, `allRemoveFromCart`. Keyed `productId`+`variation_product_id`.
- `src/redux/cartLocalstorageMiddleware.js` — write `localStorage["cart"]`; if logged-in (via RTK Query `userInfo` cache) debounce 500ms → `PUT /cart`. **V2: re-wire login detection.**
- `src/redux/store.js` — SSR-safe hydration + legacy `_id`→`productId` migration.
- **Sync utils:** `src/utils/cartSync.js` (`syncCartAfterLogin`→`POST /cart/sync` once/session; `loadCartFromDB`→`GET /cart`).

### 5.3 Orders
| Route | File | Component |
|---|---|---|
| `/orders/order-success` | `orders/order-success/page.js` (Suspense) | `order/OrderSuccess.jsx` (`?order_id&invoice_id&guest`; `firePurchaseOnce`) |
| `/orders/order-tracking` | `orders/order-tracking/page.js` | `orderTracking/OrderTracking.jsx`, Form, Stepper |
| `/orders/order-tracking/[id]` | `orders/order-tracking/[id]/page.js` | `MyOrderTracking.jsx`, Stepper |
| `/orders/[orderId]` | `orders/[orderId]/page.js` | `orders/orderInvoice/OrderInvoice.jsx` (jsPDF/react-pdf) |
- **Lib:** `getAllOrders`. **SEO:** order/tracking/success/checkout noindex.

---

## 6. Auth / Customer Dashboard

### 6.1 Auth (group `(auth)`)
| Route | File | Component |
|---|---|---|
| `/sign-in` | `(auth)/sign-in/page.jsx` | auth/SignIn/LoginForm |
| `/sign-up` | `(auth)/sign-up/page.jsx` | auth/SignUp/SignUpForm |
| `/verify` | `(frontend)/verify/page.jsx` | auth/verify/VerifyForm (OTP) |
| `/set-password` | `(auth)/set-password/page.jsx` | auth/setPassword/SetPassword(+Modal) |
| `/forget-password` | `(auth)/forget-password/page.jsx` | auth/ForgetPassword/ForgetPasswordForm |
| `/change-password` | `(auth)/change-password/page.jsx` | auth/changePassword/ChangePassword |
| — | — | auth/accountModal/AccountModal |
- **Flow:** sign-up → `/verify` OTP → set-password → sign-in. Cookie `fruit_snacks_token`.
- **Data (RTK Query `authApi.js`):** `userInfo` (GET `/get_me`), `userRegistration` (POST `/user`), `userLogin` (POST `/user/login`), `resendOtp`, `forgetPassword`, `changePassword` (POST `/user/setNewPassword`), `verify` (PATCH `/user/update_user_status`). All `credentials:"include"`.
- **On login:** `syncCartAfterLogin`+`syncWishlistAfterLogin`+`trackLogin`. On register: `trackCompleteRegistration`.
- **V2 improve:** auth is the one genuine RTK Query area — move to RSC + cookie reads or thin client hook.

### 6.2 Customer dashboard (group `(user-profile)`)
- **Route:** `/user-profile` · **Files:** `src/app/(user-profile)/user-profile/page.jsx` + `(user-profile)/layout.js` (own nav).
- **Components (`src/components/allUserProfile/userProfile/` — ⚠️ NOT under `frontend/`):** UserProfile, Dashboard, NavButton, ProfileSetting, ShowProfileDetails, PurchaseHistory, ReviewDashBoard, ReviewHistory, ToBeReviewedTab, OfferHistory, UserDashboardWishList, **+ LoyaltyHistory, WalletHistory, MyCoupons, Addresses** (4 tabs the checklist had missed — all wired via tab routing).
- **Libs:** `getReviewInDashboard`, `getUnReviewDashBoard`, `getAllOrders`.

### 6.3 Wishlist
- **Route:** `/wishlist` · **File:** `src/app/(frontend)/wishlist/page.jsx` → `frontend/wishList/WishList.jsx`.
- **Logic:** localStorage source + DB union-merge (logged-in) via `src/utils/wishlistSync.js` (`loadWishlistFromDB` GET `/wishlist`, `syncWishlistAfterLogin` POST `/wishlist/sync`, `addToWishlistRemote`/`removeFromWishlistRemote`); `window.dispatchEvent("wishlist:updated")`; noindex.

---

## 7. Content / Static Pages
- **Routes/Files:** `(frontend)/{about-us,privacy-policy,terms-condition,return-policy,refund-policy,cancel-policy,shipping-information}` → `frontend/FooterSection/*`.
- **SEO:** in sitemap (fixed `LAUNCH_DATE`); should call `buildPageMeta(key)`.
- **Misc:** `/theme-preview` (`src/app/theme-preview/page.js`), `/products-themed/[slug]` (preview), `/compare`.

---

## 8. Price Resolver (PRESERVE EXACTLY)
- **`src/utils/helper.js`** — `productPrice(product)`: **flash > campaign > variation-discount > variation > product-discount > product**. Flash "fixed"=absolute, "percent"=% off post-discount base; campaign on **regular** price. Mirrors BE `product.price.resolver.ts`/`order.recompute.ts`. Also `lineThroughPrice`, `singleProductPrice`, `singleProductLineThroughPrice`, `calculatePrice`. **Ship FE+BE together if changed.**
- **`src/utils/cartUtils.js`** — older array-unaware `productPrice` + `calculateSubtotal` + `calculationCouponProductPrice`. (Two impls — `helper.js` canonical; V2 unify.)

---

## 9. Cart Layers (PRESERVE EXACTLY)
- **`src/utils/applyCartLayers.js`** — mirrors BE `order.recompute.ts`. Order: (1) base via `productPrice`, (2) tier price (qty, best-wins), (3) customer-group (retail/wholesale/vip), (4) coupon (product-level→line, cart-level→subtotal, `coupon_max_amount` caps %), (5) BOGO (`applyBogoCoupon`: cheapest eligible × get_qty × pct, skips zero lines). Server-only (NOT here): loyalty, VAT, shipping recompute, advance, coupon usage caps, campaign staleness. Entry: `useCartCalculations`.

---

## 10. SEO Surface Map (#1 risk — map precisely)
| Surface | File |
|---|---|
| Root metadata (title template, OG/Twitter, robots, verification) | `src/app/layout.js` |
| Organization JSON-LD | `src/app/layout.js` (`<body>`) |
| Per-page metadata helper (DB → static fallback) | `src/components/lib/buildPageMeta.js` |
| SEO config (siteName/url/logo/currency/analytics IDs) | `src/components/lib/getSeoConfig.js` |
| Page SEO DB fetch (`/page-seo/{key}`) | `src/components/lib/getPageSeo.js` |
| Static page SEO fallbacks | `src/components/utils/pageSeo.js` |
| PDP metadata + Product + BreadcrumbList JSON-LD + `redirect_slug` 301 + canonical | `src/app/(frontend)/products/[slug]/page.js` |
| Category metadata + canonical (catch-all) | `src/app/(frontend)/category/[...slug]/page.js` |
| Sitemap (static + products `/product?limit=500` + categories `/category/category_sub_child`) | `src/app/sitemap.js` |
| Robots (disallows private + query params; `/shop` `/offer` allowed) | `src/app/robots.js` |
| DB-driven favicon | `src/app/layout.js` `<head>` |
| QR noindex 301 | `src/app/(frontend)/q/[code]/page.js` |
- **Note:** `getSeoConfig` has hardcoded leather/BD fallback copy (buyer overrides via Admin). Sitemap calls **removed** `/category/category_sub_child` — switch to `/category/tree` in V2.

---

## 11. Analytics Surface Map
- **Loaders:** `analyticsScripts/googleAnalytics/GoogleTagManager.jsx` (+NoScript), `metaPixel/MetaPixelScript.jsx`, `tiktokPixel/TikTokPixelScript.jsx`, `microsoftClarity/MicrosoftClarity.jsx`. Gated by `*_enabled` flags.
- **Unified hook:** `analyticsScripts/utils/useAnalytics.js` — `trackViewContent`/`trackAddToCart`/`trackInitiateCheckout`/`trackPurchase`/`trackSearch`/`trackLogin`/`trackCompleteRegistration`/`trackAddToWishlist`. Each fires pixel (`fbq`/`ttq`) + GTM `dataLayer` + optional **CAPI** (deduped by `eventID`). Currency `getCurrencyCode(settings)`.
- **CAPI bridges:** `utils/metaPixel/metaServerEvent.js`→`/meta-pixel/event`; `utils/tiktokPixel/TiktokServerEvent.js`→`/tiktok-pixel/event`. Helpers `useMetaPixel.js` (`generateEventId`), `useTikTokPixel.js`, `gtm/useGTM.js`.
- **Advanced matching:** `utils/AnalyticsAdvancedMatching.jsx` (fbq init + ttq identify, 500ms delay).
- **Attribution:** `utils/FbclidCapture.jsx` (`?fbclid=`→`_fbc` cookie), `utils/buildAnalyticsUserData.js` (EMQ), `utils/purchaseDedup.js` (`firePurchaseOnce` via `localStorage["purchased_order_ids"]`).
- **`_fruit_snacks_uid`:** ✅ IS set at runtime (`getOrCreateAnonymousId` in `utils/metaPixel/metaServerEvent.js` + `utils/tiktokPixel/TiktokServerEvent.js` — 1-yr cookie `anon-{ts}-{rand}`, passed as `external_id` to Meta/TikTok CAPI for anon users). (Earlier checklist claim "not set" was wrong.)
- **IDs:** server env (`META_PIXEL_ID`/`GTM_ID`/`GA4_ID`/`CLARITY_ID`/`TIKTOK_PIXEL_ID`), read in `getSeoConfig`, DB toggle wins.

---

## 12. Redux + Endpoint → Backend-Route Map
**RTK Query (ONLY these — rest is plain `fetch`):**
| Hook | Method+Route | Note |
|---|---|---|
| `userInfo` | GET `/get_me` | |
| `userRegistration` | POST `/user` | |
| `userLogin` | POST `/user/login` | sets cookie |
| `resendOtp` | POST `/user/resend_otp` | |
| `forgetPassword` | POST `/user/forgetPassword` | |
| `changePassword` | POST `/user/setNewPassword` | |
| `verify` | PATCH `/user/update_user_status` | OTP verify |
| banner/campaign mutations | `/banner`,`/campaign` | **DEAD** (`bannerApi.js`/`campaignApi.js`, Bearer — DROP) |

**Plain fetch (real data layer):** cart `POST /product/cart_product`, `GET/PUT /cart`, `POST /cart/sync` · product `GET /product/{slug}` (no-store), `GET /product`, `POST /product/view-count`, `GET /product/by-qr-code/{code}` · category `GET /category/tree`, `/category/category_sub_child` (sitemap, removed?) · order `POST /order`, `POST /order/single_order` · coupon `POST /coupon/check_coupon` · review `GET /review/{id}` · offer `GET /offer/by-product/{id}` · trust `GET /trust-point` · user `GET /user/addresses` · wishlist `GET /wishlist`, `POST /wishlist/{sync,add,remove}` · settings/SEO `GET /setting`, `GET /page-seo/{key}`. Lib helpers `src/components/lib/get*.js` (31 files) wrap these w/ revalidate.
**Cart slice:** `src/redux/feature/cart/cartSlice.js` (only Redux to keep) + `cartLocalstorageMiddleware.js`.

---

## 13. Reusable Components → packages/ui candidates
- **Shell:** navbar/* (Navbar+SecondNavbar/BottomNavbar/MobileNavbar/MobileMenu/MobileNavBarUserDashBoard/NavManu/SearchBar/TopNavbar), footer/Footer, theme/AnnouncementBar, FloatingWhatsApp, ChatWidgetStacker, common/unverifiedBanner, common/Contain, common/breadCrum, common/pagination*, shared/pagination, shared/loader/* (skeletons), shared/noDataFound, shared/notFound, shared/wishListEmpty, shared/dynamicFavicon/DynamicFavicon, shared/quickViewModal/QuickViewModal, shared/dragToUpload.
- **Home:** §2.2 + featureCategories, newFeatureCategories, onlyForYouProduct, sliderAd, adsSection.
- **PDP (themed):** SingleProduct, VariationPicker, OverflowValuesModal, PdpPriceMeta, ViewCountFire, HeroGallery, FloatingAssets, ThemeStyleInjector, WhatsAppOrderButton, DescriptionCard, ProductThemedSections + sections/* (Video, BenefitsUseCases, Benefits, UseCases, SizeGuide, Nutrition, Reviews, Faq, OfferBanner, OfferDiscoveryBanner, RelatedProductsThemed, HeroEnrichment), productDetails/ProductPhotoSelect, productDescription/ProductDescription, productHighLightSection/(ProductHighlightSection, ChartModal), rightSideShoppingSection/*, productReviewAccordion/*, qnaAccordion/QnAAccordion, returnPolicyAccordion/ReturnPolicyAccordion, relatedProducts/RelatedProducts, sellerProduct/(RecentProducts, RecentProductCard).
- **Cart/Checkout:** cart/(AddToCart, CartTable, CartSummary, CouponSection), checkout/(DeliveryInformation, OrderSummaryTable, CheckoutProduct).
- **Catalog:** shop/Shop, seeAllProduct/*, topProduct/*, viewAllTrendingProduct/*, allECommerceProducts/*, justForYouAll/*, categoryview/*, compare/*, allBrand/AllBrand, topBrand/TopBrand, campaign/*, offer/*, searchForm/SearchForm.
- **Orders/Profile:** order/OrderSuccess, orderTracking/*, orders/orderInvoice/OrderInvoice, allUserProfile/userProfile/*, wishList/WishList.
- **Libs:** lib/icons/(DynamicIcon, registry), lib/theme/(mergeTheme, mergeFloating, formatWeight, whatsappLink), lib/utils. **UI primitives:** `src/components/ui/*` (Shadcn).

---

## 14. Client-Logic Niceties to Preserve (owner's checklist)
1. **Price resolver layers** (flash>campaign>variation>base) — `utils/helper.js`.
2. **Cart layers** (tier, group, coupon, BOGO, max-cap) — `utils/applyCartLayers.js` + `useCartCalculations`.
3. **Dual-storage cart sync** — `cartSlice.js` + `cartLocalstorageMiddleware.js` + `cartSync.js` + `store.js` migration + `CartLoader`.
4. **Variation → URL sync** (`?attr_slug=value_slug`, ObjectId fallback, in-stock seed) — `SingleProduct.jsx`.
5. **Combination[] set-intersection match** (N-axis, Bangla-safe) — `SingleProduct.jsx` + `helper.js`.
6. **Swatch/button/dropdown picker** + OOS cue + overflow modal + badge — `VariationPicker.jsx`.
7. **Per-variant gallery auto-switch** + lightbox + video — `HeroGallery.jsx`.
8. **QuickView modal** — `QuickViewModal.jsx`.
9. **Wishlist** (localStorage + DB union-merge) — `wishlistSync.js` + `WishlistLoader`.
10. **Compare** (localStorage) — `compare/*`.
11. **Recently-viewed** (localStorage, variation-aware) — `helper.js` `updateRecentProducts`.
12. **Phone normalize E.164** — `utils/phone.js` `normalizeBdPhone`.
13. **Currency formatter from settings** — `utils/currency.js`.
14. **Purchase dedup** — `purchaseDedup.js`; **fbclid→_fbc** — `FbclidCapture.jsx`.
15. **Floating images** (theme + per-product override, section-anchored, reduced-motion) — `mergeFloating.js` + `FloatingAssets.jsx`.
16. **Two order paths** — buy-now `/order/single_order` vs cart `/order`.
17. **WhatsApp order button + floating chat + Messenger/live-chat embed** — `WhatsAppOrderButton.jsx`, `FloatingWhatsApp.jsx`, `ChatWidgetStacker.jsx`.
18. **View-count fire** (session-deduped) — `ViewCountFire.jsx`; sold/view/stock toggles.
19. **Saved addresses prefill** — `AddToCart.jsx` (`/user/addresses`).
20. **Boutique home preset** — heroSpotlight/productFeatures/storyBand (keep full array, toggle off).
- **No FE abandoned-cart capture** (backend/Sprint-4 parked).

---

## 15. V2-improve list
1. **191 `"use client"` files** — most strips RSC-able; SectionRenderer+sections RSC + `next/dynamic` for interactive bits only.
2. **PDP double-fetch** — `cache()`/RSC dedup.
3. **No route-level skeletons** — add `loading.js`.
4. **Two data libs** (RTK + TanStack) + plain fetch — consolidate to RSC fetch + one client lib + cart Redux.
5. **Two `productPrice` impls** — unify on array-aware.
6. **Settings double-fetched** — pass from RSC.
7. **Inconsistent `revalidate`** — centralize.
8. **Sitemap uses removed `/category/category_sub_child`** — switch to `/category/tree`.
9. **Dead RTK slices** (`bannerApi.js`, `campaignApi.js`) — delete.
10. **`getMenu` legacy-shape adapter** — consume tree natively.
11. **`build` ignores TS+ESLint** (`next.config.mjs`) — enable.
12. **Folder typos:** `singeProduct/`, `cites.js`, `contants/` — fix.
13. **Hardcoded leather/BD fallback copy** — DB/niche-preset-driven for multi-niche.
14. **`_fruit_snacks_uid`** specified, not set — implement if needed.
15. **`cartLocalstorageMiddleware` reads login from RTK cache internals** — re-wire.
16. **SectionRenderer static imports** — lazy-load.

---

### Highest-fidelity port targets
`SingleProduct.jsx` (~1194 LOC keystone), `VariationPicker.jsx`, `HeroGallery.jsx`, `applyCartLayers.js`, `helper.js`, the cart slice+middleware+sync trio, and the SEO files in §10.
