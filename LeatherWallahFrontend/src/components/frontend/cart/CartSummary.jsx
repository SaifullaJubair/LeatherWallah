import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FiLock, FiX, FiTag, FiChevronRight, FiChevronDown, FiShoppingBag, FiTruck, FiPercent } from "react-icons/fi";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import useGetSettingData from "@/components/lib/getSettingData";

const CartSummary = ({
  totalDiscount,
  shippingCharge,
  userInfo,
  shopSubtotals,
  shopGrandTotals,
  couponData,
  shopProduct,
  setCouponCode,
  couponCode,
  panelOwnerIds,
  isApplyingCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  handleShowCouponInput,
  division,
  loading,
  enablePromoAtCheckout = true,
  minOrderAmount = 0,
}) => {
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data?.[0]?.currency_symbol ?? "";

  // Promo starts collapsed to keep the sticky column short so Place Order
  // stays visible without scrolling. Auto-open if a coupon is already applied.
  const [promoOpen, setPromoOpen] = useState(false);

  const savings = totalDiscount || 0;
  const belowMin = minOrderAmount > 0 && shopSubtotals < minOrderAmount;
  const shortfall = minOrderAmount - shopSubtotals;

  return (
    <div className="space-y-3 mt-4 lg:mt-0">
      {/* Order summary card — compact header keeps the sticky column short */}
      <div className="bg-white rounded-2xl border border-secondary-100/70 shadow-[0_1px_3px_rgba(62,39,35,0.06)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-secondary-100/60 bg-secondary-50/30">
          <FiTruck size={13} className="text-primary" />
          <h2 className="text-[13px] font-semibold text-secondary tracking-tight">
            Order Summary
          </h2>
        </div>

        <div className="p-4 space-y-2.5">
          {/* Location row */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              <FiTruck size={13} className="text-gray-400" />
              Delivery
            </span>
            <span className="font-medium text-secondary/90">
              {division === "Dhaka" ? "Inside Dhaka" : division ? "Outside Dhaka" : "—"}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-secondary/90 tabular-nums">
              {currencySymbol}{shopSubtotals || 0}
            </span>
          </div>

          {/* Discount */}
          {savings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <FiPercent size={12} />
                Discount
              </span>
              <span className="text-green-600 font-medium tabular-nums">-{currencySymbol}{savings}</span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span className="font-medium text-secondary/90 tabular-nums">
              {shippingCharge > 0 ? `${currencySymbol}${shippingCharge}` : (
                <span className="text-green-600 font-semibold">Free</span>
              )}
            </span>
          </div>

          {/* Gold hairline before total */}
          <div className="relative pt-3 mt-1">
            <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-600/40 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-serif font-semibold text-secondary">Total</span>
              <span className="text-xl font-bold text-primary tabular-nums">
                {currencySymbol}{shopGrandTotals || 0}
              </span>
            </div>
          </div>

          {/* Min order warning */}
          {belowMin && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 leading-snug">
              Minimum order: {currencySymbol}{minOrderAmount}. Add{" "}
              <span className="font-semibold tabular-nums">{currencySymbol}{shortfall}</span> more.
            </div>
          )}
        </div>
      </div>

      {/* Coupon — collapsed by default (keeps the column short). Applied coupon
          always shows; otherwise a compact toggle reveals the input. */}
      {enablePromoAtCheckout && (
        couponData ? (
          <div className="bg-white rounded-2xl border border-secondary-100/70 shadow-[0_1px_3px_rgba(62,39,35,0.06)] p-3.5">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2">
                <FiTag size={12} className="text-primary" />
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg tracking-wide">
                  {couponData?.coupon_code}
                </span>
                <span className="text-xs text-green-600 font-semibold">Applied!</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCoupon(shopProduct?._id)}
                aria-label="Remove promo code"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <FiX size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-secondary-100/70 shadow-[0_1px_3px_rgba(62,39,35,0.06)]">
            <button
              type="button"
              onClick={() => setPromoOpen((v) => !v)}
              aria-expanded={promoOpen}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-secondary/90 hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <FiTag size={13} className="text-primary" />
                Have a promo code?
              </span>
              <FiChevronDown
                size={15}
                className={`text-gray-400 transition-transform ${promoOpen ? "rotate-180" : ""}`}
              />
            </button>
            {promoOpen && (
              <div className="px-4 pb-4 flex gap-2">
                <input
                  type="text"
                  aria-label="Promo code"
                  autoFocus
                  className="flex-1 text-[15px] border border-secondary-100 rounded-xl px-3.5 py-2.5 outline-none bg-secondary-50/20 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
                  placeholder="Enter code"
                  value={couponCode || ""}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon(shopProduct?._id)}
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon(shopProduct?._id)}
                  disabled={isApplyingCoupon}
                  className="px-4 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary-700 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {isApplyingCoupon ? "…" : "Apply"}
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Place order button — desktop only; mobile uses fixed bottom bar */}
      <div className="hidden md:block">
        {loading ? (
          <div className="w-full h-14 flex items-center justify-center bg-primary text-white rounded-2xl">
            <MiniSpinner />
          </div>
        ) : (
          <button
            type="submit"
            disabled={belowMin}
            className="group w-full h-14 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2.5 text-white bg-gradient-to-b from-primary to-primary-700 shadow-[0_6px_18px_-4px_rgba(107,26,31,0.45)] hover:shadow-[0_8px_22px_-4px_rgba(107,26,31,0.55)] hover:from-primary-600 hover:to-primary-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <FiLock size={15} />
            Place Order
            <FiChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
        <p className="text-center text-[11px] text-gray-400 mt-2.5 flex items-center justify-center gap-1.5">
          <FiLock size={10} className="text-accent-700" />
          Secure checkout · Cash on delivery available
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
