"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PhotoProvider, PhotoView } from "react-photo-view";
// CSS co-located with its only consumers. Importing it in the root layout made
// every route (incl. the homepage, which has no lightbox) render-block on 18.5 KiB.
import "react-photo-view/dist/react-photo-view.css";
import { toast } from "react-toastify";
import Link from "next/link";

import {
  MdOutlineHome, MdOutlineRateReview,
} from "react-icons/md";
import {
  FiShoppingBag, FiHeart, FiUser, FiSettings,
  FiLogOut, FiMoreHorizontal, FiX, FiExternalLink,
} from "react-icons/fi";
import { FaGift, FaWallet, FaMapMarkedAlt, FaShippingFast } from "react-icons/fa";
import { RiCoupon3Fill } from "react-icons/ri";

import Dashboard from "./Dashboard";
import PurchaseHistory from "./PurchaseHistory";
import UserDashboardWishList from "./UserDashboardWishList";
import LoyaltyHistory from "./LoyaltyHistory";
import WalletHistory from "./WalletHistory";
import Addresses from "./Addresses";
import MyCoupons from "./MyCoupons";
import DashBoardReview from "./ReviewDashBoard";
import ShowProfileDetails from "./ShowProfileDetails";

import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import { LoaderOverlay } from "@/components/shared/loader/LoaderOverlay";
import { BASE_URL } from "@/components/utils/baseURL";

// ── Sidebar nav items ──────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { name: "dashboard",       icon: MdOutlineHome,     label: "Dashboard" },
  { name: "purchase-history",icon: FiShoppingBag,     label: "Purchase History" },
  { name: "wishlist",        icon: FiHeart,            label: "Wishlist" },
  { name: "addresses",       icon: FaMapMarkedAlt,     label: "Addresses" },
  { name: "order-tracking",  icon: FaShippingFast,     label: "Order Tracking", href: "/orders/order-tracking", external: true },
  { name: "coupons",         icon: RiCoupon3Fill,      label: "My Coupons" },
  { name: "loyalty",         icon: FaGift,             label: "Loyalty Points" },
  { name: "wallet",          icon: FaWallet,           label: "Wallet" },
  { name: "review",          icon: MdOutlineRateReview,label: "Reviews" },
  { name: "profile-setting", icon: FiSettings,         label: "Profile Setting" },
];

// ── Mobile bottom bar (5 items) ────────────────────────────────────
const BOTTOM_ITEMS = [
  { name: "dashboard",        icon: MdOutlineHome,  label: "Home" },
  { name: "purchase-history", icon: FiShoppingBag,  label: "Orders" },
  { name: "wishlist",         icon: FiHeart,         label: "Wishlist" },
  { name: "profile-setting",  icon: FiUser,          label: "Profile" },
  { name: "__more__",         icon: FiMoreHorizontal,label: "More" },
];

// Tabs that appear in "More" sheet
const MORE_TABS = SIDEBAR_ITEMS.filter(
  (i) => !BOTTOM_ITEMS.some((b) => b.name === i.name) && i.name !== "__more__",
);
const MORE_NAMES = MORE_TABS.map((i) => i.name);

// ── Main component ────────────────────────────────────────────────
const UserProfile = () => {
  const [activeNavButton, setActiveNavButton] = useState("dashboard");
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync URL ?tab= → activeNavButton
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveNavButton(tab);
  }, [searchParams]);

  const { data: userInfo, isLoading: userGetLoading, refetch } = useUserInfoQuery();

  const handleLogOut = async () => {
    try {
      const res = await fetch(`${BASE_URL}/authentication/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success("Logged out successfully", { autoClose: 1500 });
        router.push("/");
        window.location.reload();
      }
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const goToTab = (name) => {
    setActiveNavButton(name);
    router.push(`?tab=${name}`, { scroll: false });
    setShowMoreSheet(false);
  };

  useEffect(() => {
    if (!userInfo && !userGetLoading) router.push("/sign-in");
  }, [userInfo, userGetLoading, router]);

  if (userGetLoading) return <LoaderOverlay />;

  const avatarInitial = userInfo?.data?.user_name?.charAt(0)?.toUpperCase() || "U";
  const isMoreActive = MORE_NAMES.includes(activeNavButton);

  return (
    <PhotoProvider>
      <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
        <div className="lg:grid lg:grid-cols-[260px_1fr] gap-6">

          {/* ── Desktop Sidebar ───────────────────────────────────── */}
          <aside className="hidden lg:block self-start sticky top-20">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Avatar + name */}
              <div className="flex flex-col items-center py-6 px-4 bg-gradient-to-b from-primary/5 to-transparent">
                {userInfo?.data?.user_image ? (
                  <PhotoView src={userInfo.data.user_image}>
                    <img
                      src={userInfo.data.user_image}
                      alt={avatarInitial}
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20 cursor-zoom-in"
                    />
                  </PhotoView>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                    <span className="text-2xl font-bold text-primary">{avatarInitial}</span>
                  </div>
                )}
                <p className="mt-3 font-semibold text-gray-900 text-sm text-center leading-tight">
                  {userInfo?.data?.user_name || userInfo?.data?.user_phone || "User"}
                </p>
                {userInfo?.data?.user_phone && userInfo?.data?.user_name && (
                  <p className="text-xs text-gray-400 mt-0.5">{userInfo.data.user_phone}</p>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {/* Nav items */}
              <nav className="p-2">
                {SIDEBAR_ITEMS.map((item) => {
                  const isActive = activeNavButton === item.name;
                  if (item.external) {
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
                      >
                        <item.icon size={17} className="shrink-0 text-gray-400 group-hover:text-primary transition-colors" />
                        <span className="flex-1">{item.label}</span>
                        <FiExternalLink size={12} className="text-gray-300" />
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => goToTab(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                        isActive
                          ? "bg-primary/10 text-primary border-l-[3px] border-primary pl-[9px]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon size={17} className={`shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`} />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-gray-100 mx-2" />

              {/* Logout */}
              <div className="p-2 pb-3">
                <button
                  type="button"
                  onClick={handleLogOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={17} className="shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* ── Tab Content ───────────────────────────────────────── */}
          <main className="min-w-0 mb-6">
            {activeNavButton === "dashboard"        && <Dashboard />}
            {activeNavButton === "purchase-history" && <PurchaseHistory />}
            {activeNavButton === "wishlist"         && <UserDashboardWishList />}
            {activeNavButton === "addresses"        && <Addresses />}
            {activeNavButton === "coupons"          && <MyCoupons />}
            {activeNavButton === "loyalty"          && <LoyaltyHistory />}
            {activeNavButton === "wallet"           && <WalletHistory />}
            {activeNavButton === "review"           && <DashBoardReview userInfo={userInfo} />}
            {activeNavButton === "profile-setting"  && <ShowProfileDetails userInfo={userInfo} refetch={refetch} />}
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg flex md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {BOTTOM_ITEMS.map((item) => {
          const isMore = item.name === "__more__";
          const isActive = isMore ? isMoreActive || showMoreSheet : activeNavButton === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                if (isMore) { setShowMoreSheet((v) => !v); }
                else { goToTab(item.name); setShowMoreSheet(false); }
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] transition-colors ${
                isActive ? "text-primary" : "text-gray-400"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── More Sheet (mobile) ───────────────────────────────────── */}
      {showMoreSheet && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/40 md:hidden"
            onClick={() => setShowMoreSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl shadow-xl md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-sm font-semibold text-gray-700">More</p>
              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <FiX size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 px-3 pb-4">
              {MORE_TABS.map((item) => {
                const isActive = activeNavButton === item.name;
                if (item.external) {
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowMoreSheet(false)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <item.icon size={22} />
                      <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => goToTab(item.name)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon size={22} />
                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Logout in sheet */}
            <div className="border-t border-gray-100 mx-4 mb-3" />
            <button
              type="button"
              onClick={handleLogOut}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mx-auto"
            >
              <FiLogOut size={16} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </PhotoProvider>
  );
};

export default function Page() {
  return (
    <Suspense fallback={<LoaderOverlay />}>
      <UserProfile />
    </Suspense>
  );
}
