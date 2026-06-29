"use client";
import { FaGift } from "react-icons/fa";

const LoyaltyHistory = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[240px]">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-1">
        <FaGift className="text-rose-400 text-3xl" />
      </div>
      <p className="text-base font-semibold text-gray-700">Coming Soon</p>
      <p className="text-sm text-gray-400 max-w-xs">
        Loyalty points feature is under development. Stay tuned!
      </p>
    </div>
  );
};

export default LoyaltyHistory;
