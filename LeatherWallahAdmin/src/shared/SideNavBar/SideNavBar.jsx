import { useContext, useEffect, useState } from "react";
import { logo } from "../../utils/imageImport";
import { Link, useLocation } from "react-router-dom";
import {
  // groups
  LayoutDashboard,
  Package,
  ShoppingCart,
  Megaphone,
  Users,
  LayoutTemplate,
  Warehouse,
  Settings,
  ShieldCheck,
  // catalog children
  FolderTree,
  Tags,
  SlidersHorizontal,
  PackagePlus,
  PackageSearch,
  AlertTriangle,
  // orders children
  ClipboardList,
  PlusSquare,
  Truck,
  ShieldAlert,
  ShoppingBag,
  // marketing children
  Zap,
  Tag,
  Ticket,
  Image as ImageIcon,
  // customers children
  User,
  Heart,
  Gift,
  Wallet,
  Star,
  MessageCircleQuestion,
  // content children
  Palette,
  HelpCircle,
  Handshake,
  Mail,
  // inventory children
  Boxes,
  Building2,
  // settings children
  Cog,
  Search,
  // staff children
  UserPlus,
  KeyRound,
} from "lucide-react";
import { ChildMenuItem, DropdownMenu, MenuItem } from "./DropdownAndMenuItem";
import { SettingContext } from "../../context/SettingProvider";
import { LoaderOverlay } from "../../components/common/loader/LoderOverley";
import { AuthContext } from "../../context/AuthProvider";

const SideNavBar = () => {
  const { settingData, loading: settingLoading } = useContext(SettingContext);
  const { user, loading } = useContext(AuthContext);
  const { pathname } = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null); // Centralized state to track open dropdown

  useEffect(() => {
    // Retrieve active dropdown from localStorage when the component mounts
    const saveDropDown = localStorage.getItem("activeDropdown");
    if (saveDropDown) {
      setActiveDropdown(saveDropDown);
    }
  }, []);

  // Toggle dropdowns, collapse others when one is opened
  const toggleDropdown = (dropdown) => {
    const newActiveDropdown = activeDropdown === dropdown ? null : dropdown;
    setActiveDropdown(newActiveDropdown);

    localStorage.setItem("activeDropdown", newActiveDropdown);
  };

  // Collapse all dropdowns when a menu item is clicked
  const closeAllDropdowns = () => {
    setActiveDropdown(null);
    localStorage.removeItem("activeDropdown");
  };
  const isActive = (route) =>
    pathname === route
      ? "bg-blueColor-600 text-white font-semibold border-blueColor-100 "
      : "";

  if (settingLoading || loading) {
    return <LoaderOverlay />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-blueColor-800 text-gray-50">
      <div className="flex-grow">
        {/* Logo */}
        <div className="flex items-center justify-center border-b border-blueColor-600 mt-1 pb-3">
          <Link to="/">
            <img src={settingData?.logo} alt="Logo" width={70} height={70} />
          </Link>
        </div>
        {/* Menu — grouped into collapsible sections (single-open accordion) */}
        <ul className="flex flex-col pb-4 space-y-[2px]">
          {/* ── Dashboard (flat, always on top) ─────────────────────────── */}
          {user?.role_id?.dashboard_show === true && (
            <MenuItem
              to="/"
              icon={LayoutDashboard}
              label="Dashboard"
              isActive={isActive("/")}
              onClick={closeAllDropdowns}
            />
          )}

          {/* ── Catalog ──────────────────────────────────────────────────── */}
          {(user?.role_id?.category_show === true ||
            user?.role_id?.brand_show === true ||
            user?.role_id?.attribute_show === true ||
            user?.role_id?.product_show === true) && (
            <DropdownMenu
              label="Catalog"
              icon={Package}
              isOpen={activeDropdown === "catalog"}
              onClick={() => toggleDropdown("catalog")}
            >
              {user?.role_id?.category_show === true && (
                <ChildMenuItem
                  to="/category"
                  icon={FolderTree}
                  label="Category"
                  isActive={isActive("/category")}
                />
              )}
              {user?.role_id?.brand_show === true && (
                <ChildMenuItem
                  to="/brand-category"
                  icon={Tags}
                  label="Brand"
                  isActive={isActive("/brand-category")}
                />
              )}
              {user?.role_id?.attribute_show === true && (
                <ChildMenuItem
                  to="/attribute"
                  icon={SlidersHorizontal}
                  label="Attribute"
                  isActive={isActive("/attribute")}
                />
              )}
              {user?.role_id?.product_show === true && (
                <ChildMenuItem
                  to="/product/product-list"
                  icon={PackageSearch}
                  label="Product List"
                  isActive={isActive("/product/product-list")}
                />
              )}
              {user?.role_id?.product_create === true && (
                <ChildMenuItem
                  to="/product/product-create"
                  icon={PackagePlus}
                  label="Add Product"
                  isActive={isActive("/product/product-create")}
                />
              )}
              {user?.role_id?.product_show === true && (
                <ChildMenuItem
                  to="/low-stock"
                  icon={AlertTriangle}
                  label="Low Stock"
                  isActive={isActive("/low-stock")}
                />
              )}
            </DropdownMenu>
          )}

          {/* ── Orders ───────────────────────────────────────────────────── */}
          {(user?.role_id?.order_show === true ||
            user?.role_id?.order_create_admin === true) && (
            <DropdownMenu
              label="Orders"
              icon={ShoppingCart}
              isOpen={activeDropdown === "orders"}
              onClick={() => toggleDropdown("orders")}
            >
              {user?.role_id?.order_show === true && (
                <ChildMenuItem
                  to="/order"
                  icon={ClipboardList}
                  label="Order List"
                  isActive={isActive("/order")}
                />
              )}
              {/* Processing / Delivered / Cancelled / Returned / Offer are TABS
                  inside the Order List page. */}
              {user?.role_id?.order_create_admin === true && (
                <ChildMenuItem
                  to="/order/create"
                  icon={PlusSquare}
                  label="Create POS Order"
                  isActive={isActive("/order/create")}
                />
              )}
              {user?.role_id?.order_show === true && (
                <>
                  <ChildMenuItem
                    to="/steadfast-order"
                    icon={Truck}
                    label="SteadFast Orders"
                    isActive={isActive("/steadfast-order")}
                  />
                  <ChildMenuItem
                    to="/pathao-order"
                    icon={Truck}
                    label="Pathao Orders"
                    isActive={isActive("/pathao-order")}
                  />
                  <ChildMenuItem
                    to="/fraud-check"
                    icon={ShieldAlert}
                    label="Fraud Check"
                    isActive={isActive("/fraud-check")}
                  />
                  <ChildMenuItem
                    to="/abandoned-cart"
                    icon={ShoppingBag}
                    label="Abandoned Carts"
                    isActive={isActive("/abandoned-cart")}
                  />
                </>
              )}
            </DropdownMenu>
          )}

          {/* ── Marketing ────────────────────────────────────────────────── */}
          {(user?.role_id?.offer_show === true ||
            user?.role_id?.campaign_show === true ||
            user?.role_id?.coupon_show === true ||
            user?.role_id?.banner_show === true ||
            user?.role_id?.slider_show === true) && (
            <DropdownMenu
              label="Marketing"
              icon={Megaphone}
              isOpen={activeDropdown === "marketing"}
              onClick={() => toggleDropdown("marketing")}
            >
              {(user?.role_id?.offer_show === true ||
                user?.role_id?.offer_create === true ||
                user?.role_id?.offer_update === true) && (
                <ChildMenuItem
                  to="/flash-sale"
                  icon={Zap}
                  label="Flash Sale"
                  isActive={isActive("/flash-sale")}
                />
              )}
              {user?.role_id?.offer_show === true && (
                <ChildMenuItem
                  to="/offer-list"
                  icon={Tag}
                  label="Offers"
                  isActive={isActive("/offer-list")}
                />
              )}
              {user?.role_id?.offer_create === true && (
                <ChildMenuItem
                  to="/add-offer"
                  icon={Tag}
                  label="Add Offer"
                  isActive={isActive("/add-offer")}
                />
              )}
              {user?.role_id?.campaign_show === true && (
                <ChildMenuItem
                  to="/campaign-list"
                  icon={Megaphone}
                  label="Campaigns"
                  isActive={isActive("/campaign-list")}
                />
              )}
              {user?.role_id?.campaign_create === true && (
                <ChildMenuItem
                  to="/add-campaign"
                  icon={Megaphone}
                  label="Add Campaign"
                  isActive={isActive("/add-campaign")}
                />
              )}
              {user?.role_id?.coupon_show === true && (
                <ChildMenuItem
                  to="/your-coupon"
                  icon={Ticket}
                  label="Coupons"
                  isActive={isActive("/your-coupon")}
                />
              )}
              {user?.role_id?.coupon_create === true && (
                <ChildMenuItem
                  to="/add-coupon"
                  icon={Ticket}
                  label="Add Coupon"
                  isActive={isActive("/add-coupon")}
                />
              )}
              {user?.role_id?.banner_show === true && (
                <ChildMenuItem
                  to="/banner"
                  icon={ImageIcon}
                  label="Banner"
                  isActive={isActive("/banner")}
                />
              )}
              {/* Slider is deliberately not listed. Nothing on the storefront
                  renders it — SliderAd exists but no page mounts it — so an
                  admin could upload images, get a success toast, and find the
                  site unchanged. Banner already covers the same ground: it is a
                  Swiper, so several active banners auto-rotate in the hero and
                  a single active one is a static image. The /slider route and
                  its API are untouched; only the menu entry is gone. */}
            </DropdownMenu>
          )}

          {/* ── Customers ────────────────────────────────────────────────── */}
          {(user?.role_id?.customer_show === true ||
            user?.role_id?.user_show === true ||
            user?.role_id?.review_show === true ||
            user?.role_id?.review_seed_bulk === true ||
            user?.role_id?.review_seed_manual === true ||
            user?.role_id?.question_show === true) && (
            <DropdownMenu
              label="Customers"
              icon={Users}
              isOpen={activeDropdown === "customers"}
              onClick={() => toggleDropdown("customers")}
            >
              {user?.role_id?.customer_show === true && (
                <ChildMenuItem
                  to="/customer"
                  icon={User}
                  label="Customer"
                  isActive={isActive("/customer")}
                />
              )}
              {user?.role_id?.user_show === true && (
                <>
                  <ChildMenuItem
                    to="/wishlist"
                    icon={Heart}
                    label="Wishlists"
                    isActive={isActive("/wishlist")}
                  />
                  <ChildMenuItem
                    to="/loyalty"
                    icon={Gift}
                    label="Loyalty Points"
                    isActive={isActive("/loyalty")}
                  />
                  <ChildMenuItem
                    to="/wallet"
                    icon={Wallet}
                    label="Wallet"
                    isActive={isActive("/wallet")}
                  />
                </>
              )}
              {user?.role_id?.review_show === true && (
                <>
                  <ChildMenuItem
                    to="/review"
                    icon={Star}
                    label="Reviews"
                    isActive={
                      isActive("/review") && !isActive("/review/pending")
                    }
                  />
                  <ChildMenuItem
                    to="/review/pending"
                    icon={Star}
                    label="Pending Reviews"
                    isActive={isActive("/review/pending")}
                  />
                </>
              )}
              {(user?.role_id?.review_seed_bulk === true ||
                user?.role_id?.review_seed_manual === true) && (
                <ChildMenuItem
                  to="/review/seed"
                  icon={Star}
                  label="Seed Reviews"
                  isActive={isActive("/review/seed")}
                />
              )}
              {user?.role_id?.question_show === true && (
                <ChildMenuItem
                  to="/question"
                  icon={MessageCircleQuestion}
                  label="Questions"
                  isActive={isActive("/question")}
                />
              )}
            </DropdownMenu>
          )}

          {/* ── Content ──────────────────────────────────────────────────── */}
          {(user?.role_id?.theme_show === true ||
            user?.role_id?.faq_template_show === true ||
            user?.role_id?.site_faq_show === true ||
            user?.role_id?.trust_point_show === true ||
            user?.role_id?.newsletter_show === true ||
            user?.role_id?.newsletter_export === true) && (
            <DropdownMenu
              label="Content"
              icon={LayoutTemplate}
              isOpen={activeDropdown === "content"}
              onClick={() => toggleDropdown("content")}
            >
              {user?.role_id?.theme_show === true && (
                <ChildMenuItem
                  to="/theme"
                  icon={Palette}
                  label="Themes"
                  isActive={isActive("/theme")}
                />
              )}
              {user?.role_id?.faq_template_show === true && (
                <ChildMenuItem
                  to="/faq-template"
                  icon={HelpCircle}
                  label="FAQ Templates"
                  isActive={isActive("/faq-template")}
                />
              )}
              {user?.role_id?.site_faq_show === true && (
                <ChildMenuItem
                  to="/site-faq"
                  icon={HelpCircle}
                  label="Site FAQ"
                  isActive={isActive("/site-faq")}
                />
              )}
              {user?.role_id?.trust_point_show === true && (
                <ChildMenuItem
                  to="/trust-point"
                  icon={Handshake}
                  label="Brand Promise"
                  isActive={isActive("/trust-point")}
                />
              )}
              {(user?.role_id?.newsletter_show === true ||
                user?.role_id?.newsletter_export === true) && (
                <ChildMenuItem
                  to="/newsletter-subscribers"
                  icon={Mail}
                  label="Newsletter"
                  isActive={isActive("/newsletter-subscribers")}
                />
              )}
            </DropdownMenu>
          )}

          {/* ── Inventory ────────────────────────────────────────────────── */}
          {(user?.role_id?.site_setting_update === true ||
            user?.role_id?.supplier_show === true) && (
            <DropdownMenu
              label="Inventory"
              icon={Warehouse}
              isOpen={activeDropdown === "inventory"}
              onClick={() => toggleDropdown("inventory")}
            >
              {user?.role_id?.site_setting_update === true && (
                <ChildMenuItem
                  to="/warehouse"
                  icon={Boxes}
                  label="Warehouses"
                  isActive={isActive("/warehouse")}
                />
              )}
              {user?.role_id?.supplier_show === true && (
                <ChildMenuItem
                  to="/supplier"
                  icon={Building2}
                  label="Suppliers"
                  isActive={isActive("/supplier")}
                />
              )}
            </DropdownMenu>
          )}

          {/* ── Settings ─────────────────────────────────────────────────── */}
          {(user?.role_id?.site_setting_update === true ||
            user?.role_id?.page_seo_show === true) && (
            <DropdownMenu
              label="Settings"
              icon={Settings}
              isOpen={activeDropdown === "settings"}
              onClick={() => toggleDropdown("settings")}
            >
              {user?.role_id?.site_setting_update === true && (
                <ChildMenuItem
                  to="/settings"
                  icon={Cog}
                  label="Site Settings"
                  isActive={isActive("/settings")}
                />
              )}
              {user?.role_id?.page_seo_show === true && (
                <ChildMenuItem
                  to="/page-seo"
                  icon={Search}
                  label="Page SEO"
                  isActive={isActive("/page-seo")}
                />
              )}
            </DropdownMenu>
          )}

          {/* ── Staff ────────────────────────────────────────────────────── */}
          {(user?.role_id?.role_show === true ||
            user?.role_id?.user_show === true) && (
            <DropdownMenu
              label="Staff"
              icon={ShieldCheck}
              isOpen={activeDropdown === "staff"}
              onClick={() => toggleDropdown("staff")}
            >
              {user?.role_id?.user_show === true && (
                <ChildMenuItem
                  to="/all-staff"
                  icon={Users}
                  label="All Staff"
                  isActive={isActive("/all-staff")}
                />
              )}
              {user?.role_id?.role_create === true && (
                <ChildMenuItem
                  to="/create-staff-role"
                  icon={UserPlus}
                  label="Add Staff Role"
                  isActive={isActive("/create-staff-role")}
                />
              )}
              {user?.role_id?.role_show === true && (
                <ChildMenuItem
                  to="/staff-role"
                  icon={KeyRound}
                  label="Staff Roles"
                  isActive={isActive("/staff-role")}
                />
              )}
            </DropdownMenu>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SideNavBar;
