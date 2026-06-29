"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FiShield, FiX, FiArrowRight } from "react-icons/fi";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";

const UnverifiedBanner = () => {
  const [phone, setPhone] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  const { data: userInfo } = useUserInfoQuery();
  const isLoggedIn = !!userInfo?.data?._id;
  const loggedInPhone = userInfo?.data?.user_phone;

  useEffect(() => {
    if (pathname?.includes("/order-success")) return;
    const saved = localStorage.getItem("unverified_guest_phone");
    if (!saved) return;

    if (isLoggedIn) {
      // same number দিয়ে login করেছে → clear করো
      const normalize = (p) => p?.replace(/\D/g, "").slice(-10);
      if (normalize(loggedInPhone) === normalize(saved)) {
        localStorage.removeItem("unverified_guest_phone");
      }
      // যেকোনো ক্ষেত্রে login করা থাকলে banner দেখাবে না
      setPhone(null);
      return;
    }

    setPhone(saved);
  }, [pathname, isLoggedIn, loggedInPhone]);

  useEffect(() => {
    if (sessionStorage.getItem("banner_dismissed")) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("banner_dismissed", "true");
  };

  if (!phone || dismissed) return null;

  const encodedPhone = encodeURIComponent(phone);

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-2.5 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <FiShield size={14} className="text-amber-600" />
          </div>
          <p className="text-xs text-amber-800 font-medium truncate">
            আপনার account তৈরি আছে! পাসওয়ার্ড সেট করুন order track করতে।
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/set-password?phone=${encodedPhone}`}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Set Password <FiArrowRight size={11} />
          </Link>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-full transition-colors"
          >
            <FiX size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnverifiedBanner;
