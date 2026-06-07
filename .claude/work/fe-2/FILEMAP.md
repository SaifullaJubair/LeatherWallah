# FruitSnacksFrontend — Full File Map
**Generated:** 2026-06-07  
**Base path:** `FruitSnacksFrontend/src/`

---

## app/ — Routes (Next.js 14 App Router)

```
app/
├── layout.js                                      ROOT layout — meta, providers, fonts
├── globals.css
├── error.js
├── not-found.js
├── robots.js
├── sitemap.js
├── favicon.ico / favicon-full.ico
├── fonts/ GeistVF.woff, GeistMonoVF.woff
├── theme-preview/page.js                          Dev-only theme preview
│
├── (auth)/                                        Auth group — no navbar/footer
│   ├── sign-in/page.jsx
│   ├── sign-up/page.jsx
│   ├── forget-password/page.jsx
│   ├── set-password/page.jsx
│   └── change-password/page.jsx
│
├── (frontend)/                                    Main storefront group
│   ├── layout.js                                  Navbar + Footer + AnnouncementBar
│   ├── page.js                                    HOME → Home.jsx
│   ├── shop/page.jsx                              SHOP (filter page)
│   ├── category/[...slug]/page.js                 CATEGORY (catch-all, nested)
│   ├── products/[slug]/page.js                    PDP (standard)
│   ├── products-themed/[slug]/page.js             PDP (themed variant)
│   ├── products-original/[slug]/page.js           PDP (original/legacy)
│   ├── all-products/page.jsx                      All products listing
│   ├── all-ecommerce-product/page.jsx             Ecommerce choice listing
│   ├── all-trending-products/page.js              All trending products
│   ├── all-brands/page.jsx                        All brands page
│   ├── all-brands/brand-product/[id]/page.jsx     Products by brand
│   ├── new-arrival/page.jsx                       New arrivals listing
│   ├── latest-product/page.js                     Latest products
│   ├── top-product/page.jsx                       Top products
│   ├── flash-sale/ (no page — handled via home section)
│   ├── campaign/page.jsx                          All campaigns
│   ├── campaign/[id]/page.jsx                     Single campaign
│   ├── offer/page.jsx                             All offers
│   ├── offer/[id]/page.jsx                        Single offer
│   ├── offer-orders/[userId]/[offerId]/page.jsx   Offer order invoice
│   ├── checkout/page.jsx                          Checkout
│   ├── wishlist/page.jsx                          Wishlist
│   ├── compare/page.js                            Compare products
│   ├── orders/[orderId]/page.js                   Order detail
│   ├── orders/order-success/page.js               Order success
│   ├── orders/order-tracking/page.js              Track order (form)
│   ├── orders/order-tracking/[id]/page.js         Track order (result)
│   ├── q/[code]/page.js                           QR shortlink redirect
│   ├── verify/page.jsx                            Phone verify
│   ├── about-us/page.jsx
│   ├── cancel-policy/page.jsx
│   ├── privacy-policy/page.jsx
│   ├── refund-policy/page.jsx
│   ├── return-policy/page.jsx
│   ├── shipping-information/page.jsx
│   └── terms-condition/page.jsx
│
└── (user-profile)/                                Protected user dashboard
    ├── layout.js
    └── user-profile/page.jsx
```

---

## components/ — All UI Components

### Home sections (`components/frontend/home/`)
```
Home.jsx                                  Main home server component — reads home_section_array
SectionRenderer.jsx                       Client renderer — maps section.id → component

banner/
  Banner.jsx                              Hero slider (server) → GET /slider
  BannerItem.jsx
  BannerSwiperRight.jsx
  MobileBanner.jsx

flashSale/
  FlashSale.jsx                           Flash sale section → GET /flash_sale
  FlashClockCounter.jsx
  FlashProductSlider.jsx

trendingProduct/
  TrendingProduct.jsx                     → GET /product/trending_product
  TrendingSlider.jsx

latestProducts/
  LatestProducts.jsx                      → GET /product/new_arrival?page=1&limit=8
  LatestProductGrid.jsx

popularProducts/
  PopularProducts.jsx                     → GET /product/top_selling?page=1&limit=8

categoryWiseProduct/
  CategoryWiseProduct.jsx                 → GET /product/just_for_you_product

promotionalBanner/
  PromotionalBanner.jsx                   Static/hardcoded promo banners

featureService/
  FeatureService.jsx                      Static service badges

brandStory/
  BrandStory.jsx                          Static brand story section

reviewsCarousel/
  ReviewsCarousel.jsx                     Reviews carousel (client-side fetch)

siteFaqSection/
  SiteFaqSection.jsx                      Static FAQ section

newsletterForm/
  NewsletterForm.jsx                      → POST /newsletter

featureCategories/
  FeatureCategories.jsx                   Featured categories
newFeatureCategories/
  NewFeatureCategories.jsx
  NewFeatureCategorySwiper.jsx

eCommerceChoice/
  ECommerceChoice.jsx                     → getECommerceChoiceProducts

onlyForYouProduct/
  OnlyForYouProduct.jsx

adsSection/
  AdsSection.jsx

sliderAd/
  SliderAd.jsx
  SliderAddSection.jsx
```

### Product pages (`components/frontend/singeProduct/` ← typo, means "single")
```
SingleProduct.jsx                         Standard PDP wrapper
productDescription/ProductDescription.jsx
productDetails/ProductPhotoSelect.jsx
productHighLightSection/
  ProductHighlightSection.jsx
  ChartModal.jsx
  ModalAxisSelector.jsx
productReviewAccordion/
  CustomerReviewSection.jsx
  ProductReviewAccordion.jsx
  ReviewAndReply.jsx
  UploadReviewImage.jsx
  WriteProductReview.jsx
qnaAccordion/QnAAccordion.jsx
relatedProducts/RelatedProducts.jsx
returnPolicyAccordion/ReturnPolicyAccordion.jsx
rightSideShoppingSection/
  RightSideShoppingSection.jsx
  RightSideProductSummary.jsx
  RightSideDeliveryInfo.jsx
  MobileDeliveryInfoAccordion.jsx
sellerProduct/
  RecentProducts.jsx
  RecentProductCard.jsx
```

### Themed PDP (`components/frontend/themedProduct/`)
```
singeProduct/                             ← same structure as singeProduct/ above
  SingleProduct.jsx
  VariationPicker.jsx
  PdpPriceMeta.jsx
  ViewCountFire.jsx
  OverflowValuesModal.jsx
  productDescription/ productDetails/ productHighLightSection/
  productReviewAccordion/ qnaAccordion/ relatedProducts/
  returnPolicyAccordion/ rightSideShoppingSection/ sellerProduct/

theme/
  ThemeStyleInjector.jsx                  Injects CSS vars from product theme
  AnnouncementBar.jsx
  FloatingAssets.jsx
  HeroGallery.jsx
  ProductFloatingImages.jsx
  ProductThemedSections.jsx
  WhatsAppOrderButton.jsx
  DescriptionCard.jsx
  sections/
    BenefitsSection.jsx
    BenefitsUseCasesSection.jsx
    FaqSection.jsx
    HeroEnrichment.jsx
    NutritionSection.jsx
    OfferBanner.jsx
    OfferDiscoveryBanner.jsx
    RelatedProductsThemed.jsx
    ReviewsSection.jsx
    UseCasesSection.jsx
    VideoSection.jsx
```

### Theme components (root-level, older/duplicate)
```
components/theme/
  AnnouncementBar.jsx                     ⚠️ DUPLICATE of themedProduct/theme/
  FloatingAssets.jsx
  ProductThemedSections.jsx
  ThemeStyleInjector.jsx
  WhatsAppOrderButton.jsx
  sections/ BenefitsSection, FaqSection, HeroEnrichment, NutritionSection, UseCasesSection
```

### Shop / Filter
```
components/frontend/shop/Shop.jsx         /shop page — category + product grid
components/categoryview/
  CategoryViewSection.jsx                 /category/[...slug] filter page
  CategoryViewCard.jsx
  FilterSection.jsx
  PriceRangFilter.jsx
```

### Cart & Checkout
```
components/frontend/cart/
  AddToCart.jsx                           Full checkout flow (delivery + payment + order)
  CartSummary.jsx
  CartTable.jsx
  CouponSection.jsx
  oldaddtocarttest.jsx                    ⚠️ DEAD FILE — delete

components/frontend/checkout/
  AbandonedCartCapture.jsx               Abandoned cart tracking
  AdvancePayPicker.jsx
  DeliveryInformation.jsx
  LoyaltyRedeemPanel.jsx
  OrderSummaryTable.jsx
  PaymentInitModal.jsx
  PaymentMethodPicker.jsx
```

### Auth
```
components/frontend/auth/
  SignIn/LoginForm.jsx
  SignUp/SignUpForm.jsx
  ForgetPassword/ForgetPasswordForm.jsx
  changePassword/ChangePassword.jsx
  setPassword/SetPassword.jsx + SetPasswordModal.jsx
  verify/VerifyForm.jsx
  accountModal/AccountModal.jsx
  LoginToSeller/LoginToSellerApply.jsx
```

### Navbar & Footer
```
components/shared/navbar/
  Navbar.jsx                              Main navbar (client, ~1053 lines)
  TopNavbar.jsx
  SecondNavbar.jsx
  BottomNavbar.jsx
  MobileNavbar.jsx
  MobileMenu.jsx
  NavManu.jsx
  SearchBar.jsx
  MobileNavBarUserDashBoard.jsx
  MobileNavBarUserDashBoardClient.jsx

components/shared/footer/Footer.jsx
components/shared/ChatWidgetStacker.jsx
components/shared/FloatingWhatsApp.jsx
```

### Shared UI
```
components/shared/
  pagination/Pagination.jsx
  quickViewModal/QuickViewModal.jsx
  noDataFound/NoDataFound.jsx
  notFound/NotFound.jsx
  wishListEmpty/WishListEmpty.jsx
  loader/
    CustomLoader.js, Spinner.js, MiniSpinner.js, LoaderOverlay.js
    ProductSkeleton.js, ProductSectionSkeleton.js
    CartSummarySkeleton.js, CartTableSkeleton.js
    DeliveryInformationSkeleton.js, WishlistTableSkeleton.js
  dynamicFavicon/DynamicFavicon.jsx
  dragToUpload/DragToUpload.jsx

components/common/
  Contain.jsx                             Max-width wrapper
  NotFoundData.js
  ImageUploader.jsx
  breadCrum/BreadCrum.jsx
  paginationWithPageBtn/PaginationWithPageBtn.js
  unverifiedBanner/UnverifiedBanner.jsx

components/ui/                            shadcn-style UI primitives
  button.jsx, card.jsx, dialog.jsx, input.jsx, checkbox.jsx
  accordion.jsx, collapsible.jsx, avatar.jsx, aspect-ratio.jsx
  context-menu.jsx, navigation-menu.jsx
```

### User Profile
```
components/allUserProfile/userProfile/
  UserProfile.jsx
  Dashboard.jsx
  ShowProfileDetails.jsx
  ProfileSetting.jsx
  Addresses.jsx
  PurchaseHistory.jsx
  ReviewDashBoard.jsx
  ReviewHistory.jsx
  ToBeReviewedTab.jsx
  UserDashboardWishList.jsx
  WalletHistory.jsx
  LoyaltyHistory.jsx
  OfferHistory.jsx
  NavButton.js
```

### Other feature components
```
components/frontend/
  allBrand/AllBrand.jsx
  allECommerceProducts/AllECommerceProducts.jsx + AllCategoryProduct.jsx
  campaign/Campaign.jsx + campaignClock/ + campainProduct/
  offer/Offer.jsx + offerClockCounter/ + offerProduct/
  offerOrders/OfferOrdersInvoice.jsx
  wishList/WishList.jsx
  searchForm/SearchForm.jsx
  seeAllProduct/AllProduct.jsx + NewArrivalProduct.jsx + ShowAllProduct.jsx
  justForYouAll/JustForYouAllProduct.jsx + JustForYouProductDetails.jsx
  viewAllTrendingProduct/ViewAllTrendingProducts.jsx + AllTrendingProductCard.jsx
  topBrand/TopBrand.jsx
  topCategory/TopCategory.jsx
  topProduct/TopProduct.jsx + ProductInfo.jsx

components/compare/ComparisonTable.jsx + MainCompare.jsx
components/order/OrderSuccess.jsx
components/orderTracking/OrderTracking.jsx + OrderTrackingForm.jsx + MyOrderTracking.jsx + Stepper.jsx
```

### Analytics
```
components/analyticsScripts/
  googleAnalytics/GoogleTagManager.jsx
  metaPixel/MetaPixelScript.jsx
  microsoftClarity/MicrosoftClarity.jsx
  tiktokPixel/TikTokPixelScript.jsx
  utils/
    useAnalytics.js
    AnalyticsAdvancedMatching.jsx
    FbclidCapture.jsx
    gtm/useGTM.js
    metaPixel/metaServerEvent.js + useMetaPixel.js
    tiktokPixel/TiktokServerEvent.js + useTikTokPixel.js
```

---

## components/lib/ — Server-side data fetchers (used in page.js files)

| File | Endpoint | Used by |
|------|----------|---------|
| getBanner.js | GET /slider | Banner (home hero) |
| getFlashSaleProducts.js | GET /flash_sale | FlashSale |
| getTrendingProducts.js | GET /product/trending_product | TrendingProduct |
| getAllNewArrivalProduct.js | GET /product/new_arrival | LatestProducts |
| getPopularProducts.js | GET /product/top_selling | PopularProducts |
| getJustForProducts.js | GET /product/just_for_you_product | CategoryWiseProduct |
| getECommerceChoiceProducts.js | GET /product/ecommerce_choice | ECommerceChoice |
| getPreOrderProducts.js | GET /product/pre_order | (pre-order) |
| getFilterData.js | GET /filter-data/{slug} | CategoryViewSection |
| getFilterHeadData.js | GET /category/filter-head/{slug} | CategoryViewSection |
| getCategory.js | GET /category | various |
| getMenu.js | GET /category/tree | Navbar |
| getAllProductandSearchProduct.js | GET /product?search= | search |
| getSingleSellerProduct.js | GET /product/seller/{id} | RecentProducts |
| getRelatedProduct.js | GET /product/related/{id} | RelatedProducts |
| getProductQuestion.js | GET /product/question/{id} | QnAAccordion |
| getCampaignProduct.js | GET /campaign/{id} | Campaign |
| getAllCampaign.js | GET /campaign | Campaign list |
| getAllOffers.js | GET /offer | Offer list |
| getOfferProducts.js | GET /offer/{id} | Single offer |
| getAllOrders.js | GET /order/my-orders | PurchaseHistory |
| getReviewInDashboard.js | GET /review/dashboard | ReviewDashBoard |
| getUnReviewDashBoard.js | GET /review/unreviewd | ToBeReviewedTab |
| getShippingConfiguration.js | GET /setting/shipping | DeliveryInformation |
| getZoneData.js | GET /setting/zones | DeliveryInformation |
| getServerSettingData.js | GET /setting | Home (server) |
| getSettingData.js | GET /setting | (client alias) |
| getSeoConfig.js | GET /setting/seo | layout.js |
| buildPageMeta.js | (utility — builds Next.js metadata) | page.js files |
| getPageSeo.js | GET /page-seo/{page} | static pages |
| getSlider.js | ⚠️ DUPLICATE of getBanner.js | — |

---

## redux/ — State Management

```
redux/
  store.js                               Redux store — baseApi + cartSlice + middleware
  tag-types.js                           RTK Query cache tags
  api/baseApi.js                         RTK Query base (fetchBaseQuery + credentials:include)
  cartLocalstorageMiddleware.js          Auto-sync cart → localStorage + DB on cart actions
  feature/
    auth/authApi.js                      login, register, OTP, userInfo, logout
    banner/bannerApi.js                  hero banners
    campaign/campaignApi.js             ⚠️ uses deprecated Bearer token pattern
    cart/cartSlice.js                    cart state: addToCart, removeFromCart, setCartFromDB
```

---

## utils/ & helper/ — Utility files

```
utils/
  baseURL.js                             process.env.NEXT_PUBLIC_API_URL
  cartSync.js                            syncCartAfterLogin(), loadCartFromDB()
  cartUtils.js                           cart helper functions
  applyCartLayers.js                     cart layer logic
  fetchCartDetails.js                    fetch cart from DB
  fetchData.js                           generic fetch wrapper
  wishlistSync.js                        wishlist sync helpers
  currency.js                            formatCurrency() — reads currency_code from settings
  helper.js
  average.js
  nameSplit.js
  purchaseDedup.js
  buildAnalyticsUserData.js
  font.js

helper/
  CountDownTimer.jsx                     Countdown timer component

hook/
  useDebounced.js                        Debounce hook

lib/
  utils.js                               cn() className utility
  icons/DynamicIcon.jsx                  Dynamic icon renderer
  icons/registry.js                      Icon registry
  theme/
    formatWeight.js
    mergeTheme.js
    whatsappLink.js
```

---

## data/ — Static data files

```
data/
  divisions.js                           BD divisions
  districts.js                           BD districts
  cites.js                               BD cities
  filter-data.js                         Static filter fallback data
  products.js                            ⚠️ LEGACY demo products — DB is source of truth
  preOrderList.js                        ⚠️ LEGACY
  getCategoriesForntend.js               ⚠️ LEGACY
```

---

## ⚠️ Known Issues & Dead Code

| File | Issue |
|------|-------|
| `components/frontend/cart/oldaddtocarttest.jsx` | Dead file — delete |
| `data/products.js`, `data/preOrderList.js`, `data/getCategoriesForntend.js` | Legacy demo data — DB is source of truth |
| `components/lib/getSlider.js` | Duplicate of getBanner.js |
| `components/theme/` (root level) | Duplicate of `components/frontend/themedProduct/theme/` — audit needed |
| `redux/feature/campaign/campaignApi.js` | Uses deprecated Bearer token auth pattern |
| `redux/tag-types.js` | `pc_builder` tag referenced but never defined |
| `components/frontend/singeProduct/` | Typo folder name (should be "singleProduct") |
| `components/utils/pageSeo.js` | Hardcoded leather/BD product copy — buyer overrides via Admin |

---

## Summary Counts
- Routes: **42** page files
- Component files: **~180**
- Lib fetchers: **27**
- Redux slices/apis: **5**
- Util files: **15**
