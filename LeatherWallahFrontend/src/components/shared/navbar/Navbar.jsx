"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import useGetSettingData from "@/components/lib/getSettingData";
import { BASE_URL } from "@/components/utils/baseURL";
import { toast } from "react-toastify";
import { useGetAllProductAndSearchProduct } from "@/components/lib/getAllProductandSearchProduct";
import useDebounced from "@/hook/useDebounced";
import { lineThroughPrice, productPrice } from "@/utils/helper";
import useAnalytics from "@/components/analyticsScripts/utils/useAnalytics";

import {
  FiMenu, FiX, FiSearch, FiHeart, FiShoppingCart, FiUser,
  FiChevronDown, FiHome, FiTruck,
} from "react-icons/fi";
import { BiPurchaseTag } from "react-icons/bi";
import { MdOutlineHome } from "react-icons/md";
import { TbJewishStar, TbLogout2 } from "react-icons/tb";
import { SlUserFollowing } from "react-icons/sl";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";
import { AiOutlineProduct } from "react-icons/ai";
import Contain from "@/components/common/Contain";

// ─── Search Bar ────────────────────────────────────────────────────────────────
const SearchBar = ({ className = "" }) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: settingsData } = useGetSettingData();
  const { trackSearch } = useAnalytics();
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const { data: searchData } = useGetAllProductAndSearchProduct({ page: 1, limit: 8, searchTerm });
  const searchText = useDebounced({ searchQuery: searchValue, delay: 400 });

  useEffect(() => {
    setSearchTerm(searchText);
    if (searchText) {
      // Only fire the analytics event on type — no auto-redirect. The user
      // picks a suggestion, presses Enter, or clicks "View all" to navigate.
      trackSearch(searchText);
    } else if (pathname === "/shop") {
      // Box emptied (backspace or clear) while on the shop page → drop the
      // stale ?search param so the full list returns, no Enter/click needed.
      // Never navigates away from home or any other page.
      const params = new URLSearchParams(window.location.search);
      if (params.has("search")) {
        params.delete("search");
        const qs = params.toString();
        router.replace(`/shop${qs ? `?${qs}` : ""}`, { scroll: false });
      }
    }
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const currencySymbol = settingsData?.data?.[0]?.currency_symbol;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsOpen(false);
    if (searchValue.trim()) router.push(`/shop?search=${encodeURIComponent(searchValue.trim())}`);
    else router.push("/shop");
  };

  const handleClear = () => {
    setSearchValue("");
    setSearchTerm("");
    setIsOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative flex ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-full border-2 border-gray-200 hover:border-primary focus-within:border-primary transition-colors bg-white rounded-full overflow-hidden"
      >
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => { setSearchValue(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products..."
          className="flex-1 px-4 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          autoComplete="off"
        />
        {searchValue && (
          <button type="button" onClick={handleClear} className="px-2 text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={14} />
          </button>
        )}
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 rounded-full"
        >
          <FiSearch size={14} />
          <span className="hidden lg:inline">Search</span>
        </button>
      </form>

      {isOpen && searchValue && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white shadow-2xl border border-gray-100 z-[200] max-h-[70vh] overflow-y-auto rounded-2xl">
          {searchData?.data?.length > 0 ? (
            <>
              <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                {searchData.data.length} results for &quot;{searchValue}&quot;
              </p>
              <div className="divide-y divide-gray-50">
                {searchData.data.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product.product_slug}`}
                    onClick={() => { setIsOpen(false); setSearchValue(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={product.main_image} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-primary transition-colors">{product.product_name}</p>
                      {product.product_category?.category_name && (
                        <p className="text-xs text-gray-400 mt-0.5">{product.product_category.category_name}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">{currencySymbol}{productPrice(product)}</p>
                      {lineThroughPrice(product) && (
                        <p className="text-xs text-gray-400 line-through">{currencySymbol}{lineThroughPrice(product)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100">
                <button onClick={handleSubmit} className="w-full text-center text-sm text-primary font-medium hover:underline py-1">
                  View all results for &quot;{searchValue}&quot; →
                </button>
              </div>
            </>
          ) : searchTerm ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <FiSearch size={28} className="mx-auto mb-2 opacity-30" />
              <p className="font-medium text-sm">No results for &quot;{searchValue}&quot;</p>
              <p className="text-xs mt-1">Try a different keyword</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// ─── Categories mega menu ─────────────────────────────────────────────────────
// One column per root category: root heading (+ logo) → its subcategories →
// "View all" link. Column count scales with how many roots there are so a
// small catalog (2 roots) doesn't look sparse and a large one still fits.
const CategoriesDropdown = ({ menuData }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const isActive = pathname.startsWith("/category");

  const show = () => { clearTimeout(timerRef.current); setOpen(true); };
  const hide = () => { timerRef.current = setTimeout(() => setOpen(false), 150); };

  if (!menuData?.length) return null;

  const rootCount = menuData.length;
  // cap columns so the panel never gets absurdly wide
  const cols = Math.min(rootCount, 4);
  const colClass =
    cols >= 4 ? "sm:grid-cols-4" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  // panel width tracks column count (~200px per column, min 2 for breathing room)
  const panelWidth = Math.max(cols, 2) * 210;

  return (
    <div className="relative shrink-0" onMouseEnter={show} onMouseLeave={hide}>
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
          isActive ? "text-white bg-white/15 font-semibold" : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
      >
        Categories
        <FiChevronDown size={12} className={`text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-2 z-[100]" onMouseEnter={show} onMouseLeave={hide}>
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-[92vw]"
            style={{ width: panelWidth }}
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-secondary-50/60 to-transparent">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Browse Categories</p>
            </div>

            <div className={`grid grid-cols-2 ${colClass} gap-x-2 gap-y-1 p-4`}>
              {menuData.map((item) => {
                const cat = item?.category;
                const rootHref = `/category/${cat?.category_slug}`;
                const subs = item?.sub_categories || [];
                return (
                  <div key={cat?._id} className="min-w-0 flex flex-col">
                    {/* Root heading */}
                    <Link
                      href={rootHref}
                      className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      {cat?.category_logo ? (
                        <img src={cat.category_logo} alt="" className="w-7 h-7 object-cover rounded-md shrink-0" />
                      ) : (
                        <span className="w-7 h-7 rounded-md bg-primary/10 shrink-0" />
                      )}
                      <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors truncate">
                        {cat?.category_name}
                      </span>
                    </Link>

                    {/* Subcategories (+ child level, flat) — capped height so a
                        long list scrolls inside its own column instead of
                        stretching the whole panel. */}
                    {subs.length > 0 && (
                      <div className="mt-0.5 mb-1 pl-2 border-l border-gray-100 ml-3.5 max-h-64 overflow-y-auto bag-scroll">
                        {subs.map((sub) => {
                          const subHref = `/category/${cat?.category_slug}/${sub?.sub_category_slug}`;
                          const children = sub?.child_categories || [];
                          return (
                            <div key={sub?._id}>
                              <Link
                                href={subHref}
                                className="block px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition-colors truncate"
                              >
                                {sub?.sub_category_name}
                              </Link>
                              {children.length > 0 && (
                                <div className="pl-3 border-l border-gray-100 ml-3">
                                  {children.map((child) => (
                                    <Link
                                      key={child?._id}
                                      href={`${subHref}/${child?.child_category_slug}`}
                                      className="block px-2.5 py-1 text-[12px] text-gray-500 hover:text-primary hover:bg-primary/5 rounded-md transition-colors truncate"
                                    >
                                      {child?.child_category_name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* View all */}
                    <Link
                      href={rootHref}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors ml-3.5 mt-auto"
                    >
                      View all <FiChevronDown size={11} className="-rotate-90" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Account Dropdown ──────────────────────────────────────────────────────────
const AccountDropdown = ({ userInfo, onLogout, onClose }) => {
  const menuItems = [
    { href: "/user-profile?tab=dashboard",        icon: MdOutlineHome,     label: "Dashboard" },
    { href: "/user-profile?tab=wishlist",          icon: TbJewishStar,      label: "Wishlist" },
    { href: "/user-profile?tab=purchase-history",  icon: BiPurchaseTag,     label: "Purchase History" },
    { href: "/user-profile?tab=review",            icon: SlUserFollowing,   label: "Reviews" },
    { href: "/user-profile?tab=profile-setting",   icon: IoSettingsOutline, label: "Settings" },
  ];
  return (
    <div className="absolute right-0 top-full mt-2 w-60 bg-white shadow-2xl border border-gray-100 rounded-2xl overflow-hidden z-50">
      {userInfo?.data ? (
        <>
          <div className="px-4 py-3.5 bg-gradient-to-r from-primary to-primary-600 text-white">
            <div className="flex items-center gap-3">
              {userInfo.data.user_image ? (
                <img src={userInfo.data.user_image} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <FaUserCircle size={22} className="text-white/80" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{userInfo.data.user_name}</p>
                <p className="text-xs text-white/70 truncate">{userInfo.data.user_phone}</p>
              </div>
            </div>
          </div>
          <div className="py-1">
            {menuItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-primary hover:text-white transition-colors">
                <Icon size={15} className="shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 py-2.5">
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
              <TbLogout2 size={16} /> Sign Out
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 space-y-2.5">
          <p className="text-sm font-semibold text-gray-700 text-center">Welcome back!</p>
          <Link href="/sign-in" onClick={onClose} className="block w-full text-center py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">Sign In</Link>
          <Link href="/sign-up" onClick={onClose} className="block w-full text-center py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Create Account</Link>
        </div>
      )}
    </div>
  );
};

// ─── Mobile Drawer ─────────────────────────────────────────────────────────────
const MobileDrawer = ({ isOpen, onClose, menuData, userInfo, onLogout, siteData }) => {
  const [expandedCat, setExpandedCat] = useState(null);
  const [expandedSub, setExpandedSub] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isActive = (r) => pathname === r;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div className={`fixed left-0 top-0 h-full w-[290px] bg-white z-50 md:hidden transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-gray-50">
          {siteData?.logo && (
            <Link href="/" onClick={onClose}>
              <img src={siteData.logo} alt="" className="h-9 w-auto object-contain" />
            </Link>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors ml-auto">
            <FiX size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Quick links */}
          <div className="py-3 px-3 border-b border-gray-100">
            {[
              { href: "/",                      label: "Home",         icon: FiHome },
              { href: "/shop",                  label: "All Products", icon: AiOutlineProduct },
              { href: "/orders/order-tracking", label: "Track Order",  icon: FiTruck },
              { href: "/wishlist",              label: "Wishlist",     icon: FiHeart },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href} href={href} onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(href) ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon size={17} className="shrink-0" /> {label}
              </Link>
            ))}
          </div>

          {/* Categories */}
          <div className="py-3 px-3">
            <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Categories</p>
            {menuData?.map((item) => (
              <div key={item?.category?._id}>
                <button
                  onClick={() => setExpandedCat(expandedCat === item.category._id ? null : item.category._id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {item?.category?.category_logo ? (
                    <img src={item.category.category_logo} alt="" className="w-5 h-5 object-contain rounded shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-primary/10 shrink-0" />
                  )}
                  <span className="flex-1 text-left">{item?.category?.category_name}</span>
                  {item?.sub_categories?.length > 0 && (
                    <FiChevronDown size={14} className={`transition-transform shrink-0 text-gray-400 ${expandedCat === item.category._id ? "rotate-180" : ""}`} />
                  )}
                </button>

                {expandedCat === item.category._id && (
                  <div className="ml-4 pl-3 border-l-2 border-gray-100 my-1 space-y-0.5">
                    <Link href={`/category/${item.category.category_slug}`} onClick={onClose} className="block px-3 py-1.5 text-xs text-primary font-semibold hover:underline">
                      View All →
                    </Link>
                    {item.sub_categories.map((sub) => (
                      <div key={sub._id}>
                        <button
                          onClick={() => setExpandedSub(expandedSub === sub._id ? null : sub._id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span>{sub.sub_category_name}</span>
                          {sub?.child_categories?.length > 0 && (
                            <FiChevronDown size={12} className={`transition-transform shrink-0 text-gray-400 ${expandedSub === sub._id ? "rotate-180" : ""}`} />
                          )}
                        </button>
                        {expandedSub === sub._id && sub?.child_categories?.map((child) => (
                          <Link
                            key={child._id}
                            href={`/category/${item.category.category_slug}/${sub.sub_category_slug}/${child.child_category_slug}`}
                            onClick={onClose}
                            className="block px-5 py-1.5 text-xs text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg"
                          >
                            › {child.child_category_name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          {userInfo?.data ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {userInfo.data.user_image
                    ? <img src={userInfo.data.user_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                    : <FaUserCircle className="text-primary w-5 h-5" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{userInfo.data.user_name}</p>
                  <p className="text-xs text-gray-400">{userInfo.data.user_phone}</p>
                </div>
              </div>
              <Link href="/user-profile?tab=dashboard" onClick={onClose} className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium">My Account</Link>
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium">
                <TbLogout2 size={15} /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/sign-in" onClick={onClose} className="flex-1 text-center py-2.5 bg-primary text-white text-sm font-semibold rounded-xl">Sign In</Link>
              <Link href="/sign-up" onClick={onClose} className="flex-1 text-center py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">Register</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Main Navbar ───────────────────────────────────────────────────────────────
const Navbar = ({ menuData: menuDataProp }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { products } = useSelector((state) => state.cart);
  const { data: settingsData } = useGetSettingData();
  const { data: userInfo } = useUserInfoQuery();

  const [accountOpen, setAccountOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wishlistLength, setWishlistLength] = useState(0);
  // Mobile: search is hidden behind an icon (it was a permanent row that ate a
  // lot of vertical space); tapping the icon slides the field down.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const accountRef = useRef(null);
  const siteData = settingsData?.data?.[0];
  const menuData = menuDataProp?.data || menuDataProp || [];

  useEffect(() => {
    const update = () => {
      try { setWishlistLength((JSON.parse(localStorage.getItem("wishlist")) || []).length); } catch {}
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("localStorageUpdated", update);
    return () => { window.removeEventListener("storage", update); window.removeEventListener("localStorageUpdated", update); };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setAccountOpen(false);
    setDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/authentication/logout`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
      if (res.ok) { router.push("/"); window.location.reload(); toast.success("Logged out successfully"); }
    } catch {}
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-primary-900 shadow-md border-b border-accent-700/25">
        <Contain>
          <div className="flex items-center h-[72px] gap-2 lg:gap-4">

            {/* ── Mobile hamburger ── */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/10 transition-colors text-white shrink-0"
            >
              <FiMenu size={21} />
            </button>

            {/* ── Logo ── (transparent — the logo already reads on the dark
                 burgundy navbar, no light container needed) */}
            <Link href="/" className="shrink-0 mr-1">
              {siteData?.logo ? (
                <img src={siteData.logo} alt={siteData?.title || "Logo"} className="h-10 w-auto object-contain" />
              ) : (
                <span className="text-lg font-bold text-white">{siteData?.title || "Leather Wallah"}</span>
              )}
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-1 shrink-0">
              <Link
                href="/shop"
                className={`flex items-center px-3 py-1.5 text-sm font-semibold whitespace-nowrap rounded-lg transition-colors ${
                  pathname === "/shop" ? "text-white bg-white/15" : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                All Products
              </Link>
              <CategoriesDropdown menuData={menuData} />
            </nav>

            {/* ── Search (fills remaining space) ── */}
            <SearchBar className="hidden md:flex flex-1 min-w-0" />

            {/* ── Mobile: spacer ── */}
            <div className="flex-1 md:hidden" />

            {/* ── Right icons ── */}
            <div className="flex items-center gap-0.5">

              {/* Search toggle — mobile only (desktop has the inline search bar) */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen((o) => !o)}
                aria-label="Search"
                aria-expanded={mobileSearchOpen}
                className="md:hidden flex items-center justify-center p-2 text-white/75 hover:text-accent-500 transition-colors"
              >
                {mobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative flex flex-col items-center gap-0.5 p-2 text-white/75 hover:text-accent-500 transition-colors group">
                <FiHeart size={20} className="group-hover:scale-110 transition-transform" />
                {wishlistLength > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent-600 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 leading-none">
                    {wishlistLength}
                  </span>
                )}
                <span className="text-[9px] text-white/50 hidden md:block">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link href="/checkout" className="relative flex flex-col items-center gap-0.5 p-2 text-white/75 hover:text-accent-500 transition-colors group">
                <FiShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                {products?.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent-600 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 leading-none">
                    {products.length}
                  </span>
                )}
                <span className="text-[9px] text-white/50 hidden md:block">Cart</span>
              </Link>

              {/* Account — desktop only */}
              <div className="hidden md:block relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex flex-col items-center gap-0.5 p-2 text-white/75 hover:text-accent-500 transition-colors group"
                >
                  {userInfo?.data?.user_image ? (
                    <img src={userInfo.data.user_image} alt="" className="w-5 h-5 rounded-full object-cover border border-white/30" />
                  ) : (
                    <FiUser size={20} className="group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[9px] text-white/50 whitespace-nowrap">
                    {userInfo?.data ? userInfo.data.user_name?.split(" ")[0] : "Account"}
                  </span>
                </button>
                {accountOpen && (
                  <AccountDropdown userInfo={userInfo} onLogout={handleLogout} onClose={() => setAccountOpen(false)} />
                )}
              </div>

              {/* Account — mobile only */}
              <Link href={userInfo?.data ? "/user-profile?tab=dashboard" : "/sign-in"} className="md:hidden flex items-center justify-center p-2 text-white/75 hover:text-accent-500 transition-colors">
                <FiUser size={20} />
              </Link>
            </div>
          </div>
        </Contain>

        {/* Mobile search — slides down only when toggled, so it doesn't
            permanently eat vertical space under the navbar. */}
        <div
          className={`md:hidden overflow-hidden bg-primary-900 transition-[max-height,opacity] duration-300 ease-out ${
            mobileSearchOpen ? "max-h-24 opacity-100 border-t border-white/10" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-3 py-2">
            <SearchBar className="w-full" />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        menuData={menuData}
        userInfo={userInfo}
        onLogout={handleLogout}
        siteData={siteData}
      />
    </>
  );
};

export default Navbar;
