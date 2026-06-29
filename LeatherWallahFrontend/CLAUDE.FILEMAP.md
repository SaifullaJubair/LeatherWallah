# Feature Filemap

Complete mapping of every feature to its files. Use this to find all relevant files before working on any feature — read these files directly instead of searching.

---

## Cart

**Page:**
- [src/app/(frontend)/cart/page.jsx](src/app/(frontend)/cart/page.jsx)

**Components:**
- [src/components/frontend/cart/AddToCart.jsx](src/components/frontend/cart/AddToCart.jsx)
- [src/components/frontend/cart/CartTable.jsx](src/components/frontend/cart/CartTable.jsx)
- [src/components/frontend/cart/CartSummary.jsx](src/components/frontend/cart/CartSummary.jsx)
- [src/components/frontend/cart/CouponSection.jsx](src/components/frontend/cart/CouponSection.jsx)

**Redux:**
- [src/redux/feature/cart/cartSlice.js](src/redux/feature/cart/cartSlice.js)
- [src/redux/cartLocalstorageMiddleware.js](src/redux/cartLocalstorageMiddleware.js)

**Utils:**
- [src/utils/cartSync.js](src/utils/cartSync.js)
- [src/utils/cartUtils.js](src/utils/cartUtils.js)
- [src/utils/fetchCartDetails.js](src/utils/fetchCartDetails.js)

**Skeletons:**
- [src/components/shared/loader/CartTableSkeleton.js](src/components/shared/loader/CartTableSkeleton.js)
- [src/components/shared/loader/CartSummarySkeleton.js](src/components/shared/loader/CartSummarySkeleton.js)

---

## Checkout

**Page:**
- [src/app/(frontend)/checkout/page.jsx](src/app/(frontend)/checkout/page.jsx)

**Components:**
- [src/components/frontend/checkout/CheckoutProduct.jsx](src/components/frontend/checkout/CheckoutProduct.jsx)
- [src/components/frontend/checkout/DeliveryInformation.jsx](src/components/frontend/checkout/DeliveryInformation.jsx)
- [src/components/frontend/checkout/OrderSummaryTable.jsx](src/components/frontend/checkout/OrderSummaryTable.jsx)

**Skeleton:**
- [src/components/shared/loader/DeliveryInformationSkeleton.js](src/components/shared/loader/DeliveryInformationSkeleton.js)

**Data (address):**
- [src/data/divisions.js](src/data/divisions.js)
- [src/data/districts.js](src/data/districts.js)
- [src/data/cites.js](src/data/cites.js)

**Lib:**
- [src/components/lib/getShippingConfiguration.js](src/components/lib/getShippingConfiguration.js)
- [src/components/lib/getZoneData.js](src/components/lib/getZoneData.js)

---

## Authentication

**Pages:**
- [src/app/(auth)/sign-in/page.jsx](src/app/(auth)/sign-in/page.jsx)
- [src/app/(auth)/sign-up/page.jsx](src/app/(auth)/sign-up/page.jsx)
- [src/app/(auth)/forget-password/page.jsx](src/app/(auth)/forget-password/page.jsx)
- [src/app/(auth)/change-password/page.jsx](src/app/(auth)/change-password/page.jsx)
- [src/app/(auth)/set-password/page.jsx](src/app/(auth)/set-password/page.jsx)
- [src/app/(frontend)/verify/page.jsx](src/app/(frontend)/verify/page.jsx)

**Components:**
- [src/components/frontend/auth/SignIn/LoginForm.jsx](src/components/frontend/auth/SignIn/LoginForm.jsx)
- [src/components/frontend/auth/SignUp/SignUpForm.jsx](src/components/frontend/auth/SignUp/SignUpForm.jsx)
- [src/components/frontend/auth/verify/VerifyForm.jsx](src/components/frontend/auth/verify/VerifyForm.jsx)
- [src/components/frontend/auth/ForgetPassword/ForgetPasswordForm.jsx](src/components/frontend/auth/ForgetPassword/ForgetPasswordForm.jsx)
- [src/components/frontend/auth/setPassword/SetPassword.jsx](src/components/frontend/auth/setPassword/SetPassword.jsx)
- [src/components/frontend/auth/setPassword/SetPasswordModal.jsx](src/components/frontend/auth/setPassword/SetPasswordModal.jsx)
- [src/components/frontend/auth/changePassword/ChangePassword.jsx](src/components/frontend/auth/changePassword/ChangePassword.jsx)
- [src/components/frontend/auth/accountModal/AccountModal.jsx](src/components/frontend/auth/accountModal/AccountModal.jsx)

**Redux API:**
- [src/redux/feature/auth/authApi.js](src/redux/feature/auth/authApi.js)

---

## Product (Single Product / PDP)

**Page:**
- [src/app/(frontend)/products/[slug]/page.js](src/app/(frontend)/products/[slug]/page.js)

**Components:**
- [src/components/frontend/singeProduct/SingleProduct.jsx](src/components/frontend/singeProduct/SingleProduct.jsx)
- [src/components/frontend/singeProduct/productDetails/ProductPhotoSelect.jsx](src/components/frontend/singeProduct/productDetails/ProductPhotoSelect.jsx)
- [src/components/frontend/singeProduct/productDescription/ProductDescription.jsx](src/components/frontend/singeProduct/productDescription/ProductDescription.jsx)
- [src/components/frontend/singeProduct/rightSideShoppingSection/RightSideShoppingSection.jsx](src/components/frontend/singeProduct/rightSideShoppingSection/RightSideShoppingSection.jsx)
- [src/components/frontend/singeProduct/rightSideShoppingSection/RightSideProductSummary.jsx](src/components/frontend/singeProduct/rightSideShoppingSection/RightSideProductSummary.jsx)
- [src/components/frontend/singeProduct/rightSideShoppingSection/RightSideDeliveryInfo.jsx](src/components/frontend/singeProduct/rightSideShoppingSection/RightSideDeliveryInfo.jsx)
- [src/components/frontend/singeProduct/rightSideShoppingSection/MobileDeliveryInfoAccordion.jsx](src/components/frontend/singeProduct/rightSideShoppingSection/MobileDeliveryInfoAccordion.jsx)
- [src/components/frontend/singeProduct/productHighLightSection/ProductHighlightSection.jsx](src/components/frontend/singeProduct/productHighLightSection/ProductHighlightSection.jsx)
- [src/components/frontend/singeProduct/productHighLightSection/ChartModal.jsx](src/components/frontend/singeProduct/productHighLightSection/ChartModal.jsx)
- [src/components/frontend/singeProduct/relatedProducts/RelatedProducts.jsx](src/components/frontend/singeProduct/relatedProducts/RelatedProducts.jsx)
- [src/components/frontend/singeProduct/sellerProduct/RecentProducts.jsx](src/components/frontend/singeProduct/sellerProduct/RecentProducts.jsx)
- [src/components/frontend/singeProduct/sellerProduct/RecentProductCard.jsx](src/components/frontend/singeProduct/sellerProduct/RecentProductCard.jsx)

**Lib:**
- [src/components/lib/getRelatedProduct.js](src/components/lib/getRelatedProduct.js)
- [src/components/lib/getSingleSellerProduct.js](src/components/lib/getSingleSellerProduct.js)

**Price Logic:**
- [src/utils/helper.js](src/utils/helper.js)

---

## Product Reviews & Q&A (on PDP)

**Components:**
- [src/components/frontend/singeProduct/productReviewAccordion/ProductReviewAccordion.jsx](src/components/frontend/singeProduct/productReviewAccordion/ProductReviewAccordion.jsx)
- [src/components/frontend/singeProduct/productReviewAccordion/CustomerReviewSection.jsx](src/components/frontend/singeProduct/productReviewAccordion/CustomerReviewSection.jsx)
- [src/components/frontend/singeProduct/productReviewAccordion/ReviewAndReply.jsx](src/components/frontend/singeProduct/productReviewAccordion/ReviewAndReply.jsx)
- [src/components/frontend/singeProduct/productReviewAccordion/WriteProductReview.jsx](src/components/frontend/singeProduct/productReviewAccordion/WriteProductReview.jsx)
- [src/components/frontend/singeProduct/productReviewAccordion/UploadReviewImage.jsx](src/components/frontend/singeProduct/productReviewAccordion/UploadReviewImage.jsx)
- [src/components/frontend/singeProduct/qnaAccordion/QnAAccordion.jsx](src/components/frontend/singeProduct/qnaAccordion/QnAAccordion.jsx)
- [src/components/frontend/singeProduct/returnPolicyAccordion/ReturnPolicyAccordion.jsx](src/components/frontend/singeProduct/returnPolicyAccordion/ReturnPolicyAccordion.jsx)

**Lib:**
- [src/components/lib/getProductQuestion.js](src/components/lib/getProductQuestion.js)

---

## Product Listings (All Products / Browse)

**Pages:**
- [src/app/(frontend)/all-products/page.jsx](src/app/(frontend)/all-products/page.jsx)
- [src/app/(frontend)/all-ecommerce-product/page.jsx](src/app/(frontend)/all-ecommerce-product/page.jsx)
- [src/app/(frontend)/latest-product/page.js](src/app/(frontend)/latest-product/page.js)
- [src/app/(frontend)/top-product/page.jsx](src/app/(frontend)/top-product/page.jsx)
- [src/app/(frontend)/new-arrival/page.jsx](src/app/(frontend)/new-arrival/page.jsx)
- [src/app/(frontend)/all-trending-products/page.js](src/app/(frontend)/all-trending-products/page.js)
- [src/app/(frontend)/shop/page.jsx](src/app/(frontend)/shop/page.jsx)

**Components:**
- [src/components/frontend/seeAllProduct/AllProduct.jsx](src/components/frontend/seeAllProduct/AllProduct.jsx)
- [src/components/frontend/seeAllProduct/ShowAllProduct.jsx](src/components/frontend/seeAllProduct/ShowAllProduct.jsx)
- [src/components/frontend/seeAllProduct/NewArrivalProduct.jsx](src/components/frontend/seeAllProduct/NewArrivalProduct.jsx)
- [src/components/frontend/topProduct/TopProduct.jsx](src/components/frontend/topProduct/TopProduct.jsx)
- [src/components/frontend/topProduct/ProductInfo.jsx](src/components/frontend/topProduct/ProductInfo.jsx)
- [src/components/frontend/viewAllTrendingProduct/ViewAllTrendingProducts.jsx](src/components/frontend/viewAllTrendingProduct/ViewAllTrendingProducts.jsx)
- [src/components/frontend/viewAllTrendingProduct/AllTrendingProductCard.jsx](src/components/frontend/viewAllTrendingProduct/AllTrendingProductCard.jsx)
- [src/components/frontend/allECommerceProducts/AllECommerceProducts.jsx](src/components/frontend/allECommerceProducts/AllECommerceProducts.jsx)
- [src/components/frontend/allECommerceProducts/AllCategoryProduct.jsx](src/components/frontend/allECommerceProducts/AllCategoryProduct.jsx)
- [src/components/frontend/shop/Shop.jsx](src/components/frontend/shop/Shop.jsx)
- [src/components/frontend/justForYouAll/JustForYouAllProduct.jsx](src/components/frontend/justForYouAll/JustForYouAllProduct.jsx)
- [src/components/frontend/justForYouAll/JustForYouProductDetails.jsx](src/components/frontend/justForYouAll/JustForYouProductDetails.jsx)

**Lib:**
- [src/components/lib/getAllProductandSearchProduct.js](src/components/lib/getAllProductandSearchProduct.js)
- [src/components/lib/getAllNewArrivalProduct.js](src/components/lib/getAllNewArrivalProduct.js)
- [src/components/lib/getJustForProducts.js](src/components/lib/getJustForProducts.js)
- [src/components/lib/getPreOrderProducts.js](src/components/lib/getPreOrderProducts.js)

---

## Category & Filter

**Page:**
- [src/app/(frontend)/category/[...slug]/page.js](src/app/(frontend)/category/[...slug]/page.js)

**Components:**
- [src/components/categoryview/CategoryViewCard.jsx](src/components/categoryview/CategoryViewCard.jsx)
- [src/components/categoryview/CategoryViewSection.jsx](src/components/categoryview/CategoryViewSection.jsx)
- [src/components/categoryview/FilterSection.jsx](src/components/categoryview/FilterSection.jsx)
- [src/components/categoryview/PriceRangFilter.jsx](src/components/categoryview/PriceRangFilter.jsx)

**Lib:**
- [src/components/lib/getCategory.js](src/components/lib/getCategory.js)
- [src/components/lib/getFilterData.js](src/components/lib/getFilterData.js)
- [src/components/lib/getFilterHeadData.js](src/components/lib/getFilterHeadData.js)

**Data:**
- [src/data/filter-data.js](src/data/filter-data.js)

---

## Campaign

**Pages:**
- [src/app/(frontend)/campaign/page.jsx](src/app/(frontend)/campaign/page.jsx)
- [src/app/(frontend)/campaign/[id]/page.jsx](src/app/(frontend)/campaign/[id]/page.jsx)

**Components:**
- [src/components/frontend/campaign/Campaign.jsx](src/components/frontend/campaign/Campaign.jsx)
- [src/components/frontend/campaign/campainProduct/CampaignProduct.jsx](src/components/frontend/campaign/campainProduct/CampaignProduct.jsx)
- [src/components/frontend/campaign/campaignClock/CampaignClockCounter.jsx](src/components/frontend/campaign/campaignClock/CampaignClockCounter.jsx)
- [src/components/frontend/campaign/campaignClock/SingleCampaignClockCounter.jsx](src/components/frontend/campaign/campaignClock/SingleCampaignClockCounter.jsx)

**Redux API:**
- [src/redux/feature/campaign/campaignApi.js](src/redux/feature/campaign/campaignApi.js)

**Lib:**
- [src/components/lib/getAllCampaign.js](src/components/lib/getAllCampaign.js)
- [src/components/lib/getCampaignProduct.js](src/components/lib/getCampaignProduct.js)

---

## Offer

**Pages:**
- [src/app/(frontend)/offer/page.jsx](src/app/(frontend)/offer/page.jsx)
- [src/app/(frontend)/offer/[id]/page.jsx](src/app/(frontend)/offer/[id]/page.jsx)
- [src/app/(frontend)/offer-orders/[userId]/[offerId]/page.jsx](src/app/(frontend)/offer-orders/[userId]/[offerId]/page.jsx)

**Components:**
- [src/components/frontend/offer/Offer.jsx](src/components/frontend/offer/Offer.jsx)
- [src/components/frontend/offer/offerProduct/OfferProduct.jsx](src/components/frontend/offer/offerProduct/OfferProduct.jsx)
- [src/components/frontend/offer/offerProduct/productTable/OfferSummary.jsx](src/components/frontend/offer/offerProduct/productTable/OfferSummary.jsx)
- [src/components/frontend/offer/offerProduct/productTable/ProductTable.jsx](src/components/frontend/offer/offerProduct/productTable/ProductTable.jsx)
- [src/components/frontend/offer/offerClockCounter/OfferClockCounter.jsx](src/components/frontend/offer/offerClockCounter/OfferClockCounter.jsx)
- [src/components/frontend/offer/offerClockCounter/SingleOfferClockCounter.jsx](src/components/frontend/offer/offerClockCounter/SingleOfferClockCounter.jsx)
- [src/components/frontend/offerOrders/OfferOrdersInvoice.jsx](src/components/frontend/offerOrders/OfferOrdersInvoice.jsx)

**Lib:**
- [src/components/lib/getAllOffers.js](src/components/lib/getAllOffers.js)
- [src/components/lib/getOfferProducts.js](src/components/lib/getOfferProducts.js)

---

## Flash Sale

**Component (on Home):**
- [src/components/frontend/home/flashSale/FlashSale.jsx](src/components/frontend/home/flashSale/FlashSale.jsx)
- [src/components/frontend/home/flashSale/FlashClockCounter.jsx](src/components/frontend/home/flashSale/FlashClockCounter.jsx)
- [src/components/frontend/home/flashSale/FlashProductSlider.jsx](src/components/frontend/home/flashSale/FlashProductSlider.jsx)

**Lib:**
- [src/components/lib/getFlashSaleProducts.js](src/components/lib/getFlashSaleProducts.js)

**Price Logic:**
- [src/utils/helper.js](src/utils/helper.js)

---

## Orders

**Pages:**
- [src/app/(frontend)/orders/order-success/page.js](src/app/(frontend)/orders/order-success/page.js)
- [src/app/(frontend)/orders/order-tracking/page.js](src/app/(frontend)/orders/order-tracking/page.js)
- [src/app/(frontend)/orders/order-tracking/[id]/page.js](src/app/(frontend)/orders/order-tracking/[id]/page.js)
- [src/app/(frontend)/orders/[orderId]/page.js](src/app/(frontend)/orders/[orderId]/page.js)

**Components:**
- [src/components/order/OrderSuccess.jsx](src/components/order/OrderSuccess.jsx)
- [src/components/orderTracking/OrderTracking.jsx](src/components/orderTracking/OrderTracking.jsx)
- [src/components/orderTracking/MyOrderTracking.jsx](src/components/orderTracking/MyOrderTracking.jsx)
- [src/components/orderTracking/OrderTrackingForm.jsx](src/components/orderTracking/OrderTrackingForm.jsx)
- [src/components/orderTracking/Stepper.jsx](src/components/orderTracking/Stepper.jsx)
- [src/components/frontend/orders/orderInvoice/OrderInvoice.jsx](src/components/frontend/orders/orderInvoice/OrderInvoice.jsx)

**Lib:**
- [src/components/lib/getAllOrders.js](src/components/lib/getAllOrders.js)

---

## Wishlist

**Page:**
- [src/app/(frontend)/wishlist/page.jsx](src/app/(frontend)/wishlist/page.jsx)

**Components:**
- [src/components/frontend/wishList/WishList.jsx](src/components/frontend/wishList/WishList.jsx)
- [src/components/allUserProfile/userProfile/UserDashboardWishList.jsx](src/components/allUserProfile/userProfile/UserDashboardWishList.jsx)
- [src/components/shared/wishListEmpty/WishListEmpty.jsx](src/components/shared/wishListEmpty/WishListEmpty.jsx)

**Skeleton:**
- [src/components/shared/loader/WishlistTableSkeleton.js](src/components/shared/loader/WishlistTableSkeleton.js)

---

## User Profile / Dashboard

**Page:**
- [src/app/(user-profile)/user-profile/page.jsx](src/app/(user-profile)/user-profile/page.jsx)
- [src/app/(user-profile)/layout.js](src/app/(user-profile)/layout.js)

**Components:**
- [src/components/allUserProfile/userProfile/UserProfile.jsx](src/components/allUserProfile/userProfile/UserProfile.jsx)
- [src/components/allUserProfile/userProfile/Dashboard.jsx](src/components/allUserProfile/userProfile/Dashboard.jsx)
- [src/components/allUserProfile/userProfile/NavButton.js](src/components/allUserProfile/userProfile/NavButton.js)
- [src/components/allUserProfile/userProfile/ProfileSetting.jsx](src/components/allUserProfile/userProfile/ProfileSetting.jsx)
- [src/components/allUserProfile/userProfile/ShowProfileDetails.jsx](src/components/allUserProfile/userProfile/ShowProfileDetails.jsx)
- [src/components/allUserProfile/userProfile/PurchaseHistory.jsx](src/components/allUserProfile/userProfile/PurchaseHistory.jsx)
- [src/components/allUserProfile/userProfile/ReviewDashBoard.jsx](src/components/allUserProfile/userProfile/ReviewDashBoard.jsx)
- [src/components/allUserProfile/userProfile/ReviewHistory.jsx](src/components/allUserProfile/userProfile/ReviewHistory.jsx)
- [src/components/allUserProfile/userProfile/ToBeReviewedTab.jsx](src/components/allUserProfile/userProfile/ToBeReviewedTab.jsx)
- [src/components/allUserProfile/userProfile/OfferHistory.jsx](src/components/allUserProfile/userProfile/OfferHistory.jsx)
- [src/components/allUserProfile/userProfile/UserDashboardWishList.jsx](src/components/allUserProfile/userProfile/UserDashboardWishList.jsx)

**Lib:**
- [src/components/lib/getReviewInDashboard.js](src/components/lib/getReviewInDashboard.js)
- [src/components/lib/getUnReviewDashBoard.js](src/components/lib/getUnReviewDashBoard.js)

---

## Brands

**Pages:**
- [src/app/(frontend)/all-brands/page.jsx](src/app/(frontend)/all-brands/page.jsx)
- [src/app/(frontend)/all-brands/brand-product/[id]/page.jsx](src/app/(frontend)/all-brands/brand-product/[id]/page.jsx)

**Components:**
- [src/components/frontend/allBrand/AllBrand.jsx](src/components/frontend/allBrand/AllBrand.jsx)
- [src/components/frontend/topBrand/TopBrand.jsx](src/components/frontend/topBrand/TopBrand.jsx)

---

## Compare

**Page:**
- [src/app/(frontend)/compare/page.js](src/app/(frontend)/compare/page.js)

**Components:**
- [src/components/compare/MainCompare.jsx](src/components/compare/MainCompare.jsx)
- [src/components/compare/ComparisonTable.jsx](src/components/compare/ComparisonTable.jsx)

---

## Home Page

**Page:**
- [src/app/(frontend)/page.js](src/app/(frontend)/page.js)
- [src/app/(frontend)/layout.js](src/app/(frontend)/layout.js)

**Components:**
- [src/components/frontend/home/Home.jsx](src/components/frontend/home/Home.jsx)
- [src/components/frontend/home/banner/Banner.jsx](src/components/frontend/home/banner/Banner.jsx)
- [src/components/frontend/home/banner/BannerItem.jsx](src/components/frontend/home/banner/BannerItem.jsx)
- [src/components/frontend/home/banner/BannerSwiperRight.jsx](src/components/frontend/home/banner/BannerSwiperRight.jsx)
- [src/components/frontend/home/banner/MobileBanner.jsx](src/components/frontend/home/banner/MobileBanner.jsx)
- [src/components/frontend/home/featureCategories/FeatureCategories.jsx](src/components/frontend/home/featureCategories/FeatureCategories.jsx)
- [src/components/frontend/home/newFeatureCategories/NewFeatureCategories.jsx](src/components/frontend/home/newFeatureCategories/NewFeatureCategories.jsx)
- [src/components/frontend/home/latestProducts/LatestProducts.jsx](src/components/frontend/home/latestProducts/LatestProducts.jsx)
- [src/components/frontend/home/latestProducts/LatestProductGrid.jsx](src/components/frontend/home/latestProducts/LatestProductGrid.jsx)
- [src/components/frontend/home/popularProducts/PopularProducts.jsx](src/components/frontend/home/popularProducts/PopularProducts.jsx)
- [src/components/frontend/home/trendingProduct/TrendingProduct.jsx](src/components/frontend/home/trendingProduct/TrendingProduct.jsx)
- [src/components/frontend/home/trendingProduct/TrendingSlider.jsx](src/components/frontend/home/trendingProduct/TrendingSlider.jsx)
- [src/components/frontend/home/onlyForYouProduct/OnlyForYouProduct.jsx](src/components/frontend/home/onlyForYouProduct/OnlyForYouProduct.jsx)
- [src/components/frontend/home/categoryWiseProduct/CategoryWiseProduct.jsx](src/components/frontend/home/categoryWiseProduct/CategoryWiseProduct.jsx)
- [src/components/frontend/home/promotionalBanner/PromotionalBanner.jsx](src/components/frontend/home/promotionalBanner/PromotionalBanner.jsx)
- [src/components/frontend/home/sliderAd/SliderAd.jsx](src/components/frontend/home/sliderAd/SliderAd.jsx)
- [src/components/frontend/home/adsSection/AdsSection.jsx](src/components/frontend/home/adsSection/AdsSection.jsx)
- [src/components/frontend/home/featureService/FeatureService.jsx](src/components/frontend/home/featureService/FeatureService.jsx)
- [src/components/frontend/home/eCommerceChoice/ECommerceChoice.jsx](src/components/frontend/home/eCommerceChoice/ECommerceChoice.jsx)

**Lib:**
- [src/components/lib/getBanner.js](src/components/lib/getBanner.js)
- [src/components/lib/getSlider.js](src/components/lib/getSlider.js)
- [src/components/lib/getPopularProducts.js](src/components/lib/getPopularProducts.js)
- [src/components/lib/getTrendingProducts.js](src/components/lib/getTrendingProducts.js)
- [src/components/lib/getECommerceChoiceProducts.js](src/components/lib/getECommerceChoiceProducts.js)

---

## Search

**Component:**
- [src/components/frontend/searchForm/SearchForm.jsx](src/components/frontend/searchForm/SearchForm.jsx)
- [src/components/shared/navbar/SearchBar.jsx](src/components/shared/navbar/SearchBar.jsx)

**Lib:**
- [src/components/lib/getAllProductandSearchProduct.js](src/components/lib/getAllProductandSearchProduct.js)

---

## Navbar

**Components:**
- [src/components/shared/navbar/Navbar.jsx](src/components/shared/navbar/Navbar.jsx)
- [src/components/shared/navbar/TopNavbar.jsx](src/components/shared/navbar/TopNavbar.jsx)
- [src/components/shared/navbar/SecondNavbar.jsx](src/components/shared/navbar/SecondNavbar.jsx)
- [src/components/shared/navbar/BottomNavbar.jsx](src/components/shared/navbar/BottomNavbar.jsx)
- [src/components/shared/navbar/MobileNavbar.jsx](src/components/shared/navbar/MobileNavbar.jsx)
- [src/components/shared/navbar/MobileMenu.jsx](src/components/shared/navbar/MobileMenu.jsx)
- [src/components/shared/navbar/MobileNavBarUserDashBoard.jsx](src/components/shared/navbar/MobileNavBarUserDashBoard.jsx)
- [src/components/shared/navbar/NavManu.jsx](src/components/shared/navbar/NavManu.jsx)
- [src/components/shared/navbar/SearchBar.jsx](src/components/shared/navbar/SearchBar.jsx)

**Lib:**
- [src/components/lib/getMenu.js](src/components/lib/getMenu.js)

---

## Quick View Modal

**Component:**
- [src/components/shared/quickViewModal/QuickViewModal.jsx](src/components/shared/quickViewModal/QuickViewModal.jsx)

---

## Analytics

**Components:**
- [src/components/analyticsScripts/googleAnalytics/GoogleTagManager.jsx](src/components/analyticsScripts/googleAnalytics/GoogleTagManager.jsx)
- [src/components/analyticsScripts/metaPixel/MetaPixelScript.jsx](src/components/analyticsScripts/metaPixel/MetaPixelScript.jsx)
- [src/components/analyticsScripts/microsoftClarity/MicrosoftClarity.jsx](src/components/analyticsScripts/microsoftClarity/MicrosoftClarity.jsx)
- [src/components/analyticsScripts/tiktokPixel/TikTokPixelScript.jsx](src/components/analyticsScripts/tiktokPixel/TikTokPixelScript.jsx)
- [src/components/analyticsScripts/utils/AnalyticsAdvancedMatching.jsx](src/components/analyticsScripts/utils/AnalyticsAdvancedMatching.jsx)

**Hooks / Utils:**
- [src/components/analyticsScripts/utils/useAnalytics.js](src/components/analyticsScripts/utils/useAnalytics.js)
- [src/components/analyticsScripts/utils/gtm/useGTM.js](src/components/analyticsScripts/utils/gtm/useGTM.js)
- [src/components/analyticsScripts/utils/metaPixel/useMetaPixel.js](src/components/analyticsScripts/utils/metaPixel/useMetaPixel.js)
- [src/components/analyticsScripts/utils/metaPixel/metaServerEvent.js](src/components/analyticsScripts/utils/metaPixel/metaServerEvent.js)
- [src/components/analyticsScripts/utils/tiktokPixel/useTikTokPixel.js](src/components/analyticsScripts/utils/tiktokPixel/useTikTokPixel.js)
- [src/components/analyticsScripts/utils/tiktokPixel/TiktokServerEvent.js](src/components/analyticsScripts/utils/tiktokPixel/TiktokServerEvent.js)

---

## SEO / Metadata

**Utils:**
- [src/components/lib/buildPageMeta.js](src/components/lib/buildPageMeta.js)
- [src/components/lib/getSeoConfig.js](src/components/lib/getSeoConfig.js)
- [src/components/lib/getPageSeo.js](src/components/lib/getPageSeo.js)
- [src/components/lib/getServerSettingData.js](src/components/lib/getServerSettingData.js)
- [src/components/lib/getSettingData.js](src/components/lib/getSettingData.js)
- [src/components/utils/pageSeo.js](src/components/utils/pageSeo.js)
- [src/app/sitemap.js](src/app/sitemap.js)
- [src/app/robots.js](src/app/robots.js)

---

## Redux Core

- [src/redux/store.js](src/redux/store.js)
- [src/redux/api/baseApi.js](src/redux/api/baseApi.js)
- [src/redux/tag-types.js](src/redux/tag-types.js)
- [src/redux/cartLocalstorageMiddleware.js](src/redux/cartLocalstorageMiddleware.js)
- [src/redux/feature/banner/bannerApi.js](src/redux/feature/banner/bannerApi.js)

---

## App Root

- [src/app/layout.js](src/app/layout.js)
- [src/app/globals.css](src/app/globals.css)
- [src/app/error.js](src/app/error.js)
- [src/app/not-found.js](src/app/not-found.js)
- [src/components/providers/Providers.jsx](src/components/providers/Providers.jsx)
- [src/components/providers/QueryProviders.jsx](src/components/providers/QueryProviders.jsx)
- [src/components/shared/dynamicFavicon/DynamicFavicon.jsx](src/components/shared/dynamicFavicon/DynamicFavicon.jsx)

---

## Shared Utilities

- [src/utils/helper.js](src/utils/helper.js) — price/discount calculations
- [src/utils/fetchData.js](src/utils/fetchData.js) — generic fetch wrapper
- [src/utils/average.js](src/utils/average.js) — rating average calc
- [src/utils/font.js](src/utils/font.js) — font loading
- [src/lib/utils.js](src/lib/utils.js) — cn() tailwind class merge
- [src/hook/useDebounced.js](src/hook/useDebounced.js) — debounce hook
- [src/helper/CountDownTimer.jsx](src/helper/CountDownTimer.jsx) — countdown timer
- [src/components/utils/baseURL.js](src/components/utils/baseURL.js)
- [src/components/utils/numberWithComa.js](src/components/utils/numberWithComa.js)
- [src/components/utils/EnglishDateLong.js](src/components/utils/EnglishDateLong.js)
- [src/components/utils/EnglishDateShort.js](src/components/utils/EnglishDateShort.js)
- [src/components/utils/EnglishDateWithTimeShort.js](src/components/utils/EnglishDateWithTimeShort.js)

---

## Policy Pages

**Pages:**
- [src/app/(frontend)/about-us/page.jsx](src/app/(frontend)/about-us/page.jsx)
- [src/app/(frontend)/privacy-policy/page.jsx](src/app/(frontend)/privacy-policy/page.jsx)
- [src/app/(frontend)/terms-condition/page.jsx](src/app/(frontend)/terms-condition/page.jsx)
- [src/app/(frontend)/return-policy/page.jsx](src/app/(frontend)/return-policy/page.jsx)
- [src/app/(frontend)/refund-policy/page.jsx](src/app/(frontend)/refund-policy/page.jsx)
- [src/app/(frontend)/cancel-policy/page.jsx](src/app/(frontend)/cancel-policy/page.jsx)
- [src/app/(frontend)/shipping-information/page.jsx](src/app/(frontend)/shipping-information/page.jsx)

**Components:**
- [src/components/frontend/FooterSection/AboutUs.jsx](src/components/frontend/FooterSection/AboutUs.jsx)
- [src/components/frontend/FooterSection/PrivacyPolicy.jsx](src/components/frontend/FooterSection/PrivacyPolicy.jsx)
- [src/components/frontend/FooterSection/TermsCondition.jsx](src/components/frontend/FooterSection/TermsCondition.jsx)
- [src/components/frontend/FooterSection/ReturnPolicy.jsx](src/components/frontend/FooterSection/ReturnPolicy.jsx)
- [src/components/frontend/FooterSection/RefundPolicy.jsx](src/components/frontend/FooterSection/RefundPolicy.jsx)
- [src/components/frontend/FooterSection/CancelPolicy.jsx](src/components/frontend/FooterSection/CancelPolicy.jsx)
- [src/components/frontend/FooterSection/Shipping.jsx](src/components/frontend/FooterSection/Shipping.jsx)
- [src/components/shared/footer/Footer.jsx](src/components/shared/footer/Footer.jsx)
