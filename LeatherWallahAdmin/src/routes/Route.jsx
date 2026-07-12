import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import AttributePage from "../pages/AttributePage/AttributePage";
import BrandPage from "../pages/BrandPage/BrandPage";
import AddCampaignPage from "../pages/CampaignPage/AddCampaignPage/AddCampaignPage";
import CampaignListPage from "../pages/CampaignPage/CampaignListPage/CampaignListPage";
import CategoryPage from "../pages/CategoryPage/CategoryPage";
import AddProductPage from "../pages/ProductPage/AddProductPage/AddProductPage";
import ProductListTablePage from "../pages/ProductPage/ProductListTablePage/ProductListTablePage";
import ReviewPage from "../pages/ReviewPage/ReviewPage";
import PendingReviewsPage from "../pages/ReviewPage/PendingReviewsPage";
import SeedReviewPage from "../pages/ReviewPage/SeedReviewPage";
import SignInPage from "../pages/SignInPage/SignInPage";
import ForgetPasswordPage from "../pages/ForgetPasswordPage/ForgetPasswordPage";
import AddStaffRolePage from "../pages/StaffAndRolePage/AddStaffRolePage/AddStaffRolePage";
import AllStaffPage from "../pages/StaffAndRolePage/AllStaffPage/AllStaffPage";
import StaffRoleTablePage from "../pages/StaffAndRolePage/StaffRoleTablePage/StaffRoleTablePage";
import NotFound from "../shared/NotFound/NotFound";

import ProductUpdatePage from "../pages/ProductPage/ProductUpdatePage/ProductUpdatePage";
import SupplierPage from "../pages/Supplier/SupplierPage";

import YourCoupon from "../pages/CouponPage/YourCouponPage.jsx/YourCoupon";

import BannerPage from "../pages/Banner/BannerPage";
import SettingPage from "../pages/SettingPage/SettingPage";

import PrivateRoute from "./privateRoute/PrivateRoute";

import AddCoupon from "../components/Coupon/AddCoupon";
import ViewAllOrderInfo from "../components/Order/ViewAllOrderInfo";
import OrderPage from "../pages/OrderPage/OrderPage";
import CreateOrderPage from "../pages/CreateOrderPage/CreateOrderPage";

import OfferTablePage from "../pages/OfferPage/OfferTablePage/OfferTablePage";

import AddOfferPage from "../pages/OfferPage/AddOfferPage/AddOfferPage";
import QuestionPage from "../pages/QuestionPage/QuestionPage";

import CustomerPage from "../pages/AllCustomerPage/CustomerPage";
import DashBoard from "../pages/DashBoardPage/DashBoard";
import FraudCheckPage from "../pages/Fraudcheckpage/Fraudcheckpage";
import ProfilePage from "../pages/MyProfilePage/ProfilePage";
import PageSeoPage from "../pages/pageSeoPage/PageSeoPage";
import PathaoOrderPage from "../pages/PathaoOrderPage/PathaoOrderPage";
import SteadfastOrderPage from "../pages/SteadfastOrderPage/SteadfastOrderPage";
import ThemeListPage from "../pages/ThemePage/ThemeListPage";
import ThemeAddPage from "../pages/ThemePage/ThemeAddPage";
import ThemeUpdatePage from "../pages/ThemePage/ThemeUpdatePage";
import ThemePreviewPage from "../pages/ThemePage/ThemePreviewPage";
import FaqTemplateListPage from "../pages/FaqTemplatePage/FaqTemplateListPage";
import TrustPointPage from "../pages/TrustPointPage/TrustPointPage";
import ProductPageContentEditPage from "../pages/ProductPage/ProductPageContentEditPage/ProductPageContentEditPage";
import FlashSalePage from "../pages/FlashSalePage/FlashSalePage";
import WarehousePage from "../pages/WarehousePage/WarehousePage";
import WishlistPage from "../pages/WishlistPage/WishlistPage";
import AbandonedCartPage from "../pages/AbandonedCartPage/AbandonedCartPage";
import LoyaltyPage from "../pages/LoyaltyPage/LoyaltyPage";
import LowStockPage from "../pages/LowStockPage/LowStockPage";
import WalletPage from "../pages/WalletPage/WalletPage";
import SiteFaqPage from "../pages/SiteFaqPage/SiteFaqPage";
import NewsletterPage from "../pages/NewsletterPage/NewsletterPage";

const route = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <DashBoard />,
      },
      // ------Task Start------
      {
        path: "/category",
        element: <CategoryPage />,
      },
      {
        path: "/brand-category",
        element: <BrandPage />,
      },
      {
        path: "/attribute",
        element: <AttributePage />,
      },

      // ------Task End------
      // ------Product Start------
      {
        path: "/product/product-create",
        element: <AddProductPage />,
      },
      {
        path: "/product/product-update/:id",
        element: <ProductUpdatePage />,
      },
      {
        path: "/product/product-list",
        element: <ProductListTablePage />,
      },

      // ------Product End-------
      // ------ Offer ----
      {
        path: "/offer-list",
        element: <OfferTablePage />,
      },

      {
        path: "/add-offer",
        element: <AddOfferPage />,
      },
      // ------ Offer End ----
      // ------ Campaign Start----
      {
        path: "/add-campaign",
        element: <AddCampaignPage />,
      },

      {
        path: "/campaign-list",
        element: <CampaignListPage />,
      },
      // ------ Campaign End ----
      // ------Staff And Role----
      {
        path: "/all-staff",
        element: <AllStaffPage />,
      },
      {
        path: "/staff-role",
        element: <StaffRoleTablePage />,
      },
      {
        path: "/create-staff-role",
        element: <AddStaffRolePage />,
      },

      // ------Staff And Role End----
      {
        path: "/review",
        element: <ReviewPage />,
      },
      {
        path: "/review/pending",
        element: <PendingReviewsPage />,
      },
      {
        path: "/review/seed",
        element: <SeedReviewPage />,
      },
      //question.....
      {
        path: "/question",
        element: <QuestionPage />,
      },

      //------Coupon start-----//

      {
        path: "/your-coupon",
        element: <YourCoupon />,
      },
      {
        path: "/add-coupon",
        element: <AddCoupon />,
      },
      //------Coupon End-----//

      //------Flash Sale (Phase E)-----//
      {
        path: "/flash-sale",
        element: <FlashSalePage />,
      },

      //----sell start----//

      {
        path: "/supplier",
        element: <SupplierPage />,
      },

      //....Banner Page Start....//
      {
        path: "/banner",
        element: <BannerPage />,
      },
      // Slider retired — SliderAd is never rendered on the storefront, so this
      // screen edited content no visitor could see. The menu entry went earlier;
      // the route and the slider_* permission checkboxes go now. Backend routes
      // and the two rows already in the database are untouched, in case the
      // section is revived.
      //....Site Settings Page....//
      {
        path: "/settings",
        element: <SettingPage />,
      },
      {
        path: "/settings/:tab",
        element: <SettingPage />,
      },
      //....Site Settings Page....//
      {
        path: "/page-seo",
        element: <PageSeoPage />,
      },
      // Offer orders merged into the main Orders list (order_type=offer tab) — Phase B

      // ......Order.......//
      {
        path: "/order",
        element: <OrderPage />,
      },
      // D18 — POS admin order create
      {
        path: "/order/create",
        element: <CreateOrderPage />,
      },
      {
        path: "/pathao-order",
        element: <PathaoOrderPage />,
      },
      // Cancel / Return / Delivery / Processing order pages removed —
      // these are now filter TABS inside OrderPage, not separate routes.
      {
        path: "/steadfast-order",
        element: <SteadfastOrderPage />,
      },
      {
        path: "/fraud-check",
        element: <FraudCheckPage />,
      },
      {
        path: "/all-order-info/:id",
        element: <ViewAllOrderInfo />,
      },

      // ......Themes.......//
      {
        path: "/theme",
        element: <ThemeListPage />,
      },
      {
        path: "/theme/create",
        element: <ThemeAddPage />,
      },
      {
        path: "/theme/update/:id",
        element: <ThemeUpdatePage />,
      },
      {
        path: "/theme/preview/:id",
        element: <ThemePreviewPage />,
      },

      // ......Warehouses (Phase H).......//
      {
        path: "/warehouse",
        element: <WarehousePage />,
      },

      // ......A3b admin viewer pages........//
      {
        path: "/wishlist",
        element: <WishlistPage />,
      },
      {
        path: "/abandoned-cart",
        element: <AbandonedCartPage />,
      },
      {
        path: "/loyalty",
        element: <LoyaltyPage />,
      },
      {
        path: "/wallet",
        element: <WalletPage />,
      },
      {
        path: "/low-stock",
        element: <LowStockPage />,
      },

      // ......FAQ Templates.......//
      {
        path: "/faq-template",
        element: <FaqTemplateListPage />,
      },

      // ......Brand Promise (Trust Points).......//
      {
        path: "/trust-point",
        element: <TrustPointPage />,
      },

      // ......Product Page Content.......//
      {
        path: "/product/page-content/:id",
        element: <ProductPageContentEditPage />,
      },

      // ......Customers.......//
      {
        path: "/customer",
        element: <CustomerPage />,
      },
      // ......Customers.......//
      {
        path: "/admin/my-profile",
        element: <ProfilePage />,
      },

      // Track D — Site FAQ + Newsletter Subscribers
      {
        path: "/site-faq",
        element: <SiteFaqPage />,
      },
      {
        path: "/newsletter-subscribers",
        element: <NewsletterPage />,
      },
    ],
  },
  {
    path: "/sign-in",
    element: <SignInPage />,
  },
  {
    path: "/forget-password",
    element: <ForgetPasswordPage />,
  },
]);

export default route;
