"use client";
import { RiCoupon3Fill } from "react-icons/ri";

const MyCoupons = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[240px]">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-1">
        <RiCoupon3Fill className="text-amber-400 text-3xl" />
      </div>
      <p className="text-base font-semibold text-gray-700">No Coupons Yet</p>
      <p className="text-sm text-gray-400 max-w-xs">
        Your available coupons will appear here. Check back soon for exclusive deals!
      </p>
    </div>
  );
};

export default MyCoupons;
