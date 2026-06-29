import { Button } from "@/components/ui/button";
import { FiLock, FiX, FiTag, FiChevronRight, FiShoppingBag, FiTruck, FiPercent } from "react-icons/fi";
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

  const savings = totalDiscount || 0;
  const belowMin = minOrderAmount > 0 && shopSubtotals < minOrderAmount;
  const shortfall = minOrderAmount - shopSubtotals;

  return (
    <div className="space-y-3 mt-4 lg:mt-0">
      {/* Order summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FiShoppingBag size={14} className="text-primary" />
            Order Summary
          </h2>
        </div>

        <div className="p-4 space-y-3">
          {/* Location row */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1.5">
              <FiTruck size={13} className="text-gray-400" />
              Delivery
            </span>
            <span className="font-medium text-gray-700">
              {division === "Dhaka" ? "Inside Dhaka" : division ? "Outside Dhaka" : "—"}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-800">
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
              <span className="text-green-600 font-medium">-{currencySymbol}{savings}</span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span className="font-medium text-gray-800">
              {shippingCharge > 0 ? `${currencySymbol}${shippingCharge}` : "Free"}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Total</span>
              <span className="text-lg font-bold text-primary">
                {currencySymbol}{shopGrandTotals || 0}
              </span>
            </div>
          </div>

          {/* Min order warning */}
          {belowMin && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 leading-snug">
              Minimum order: {currencySymbol}{minOrderAmount}. Add{" "}
              <span className="font-semibold">{currencySymbol}{shortfall}</span> more.
            </div>
          )}
        </div>
      </div>

      {/* Coupon card */}
      {enablePromoAtCheckout && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <FiTag size={13} className="text-primary" />
            Promo Code
          </h3>
          {couponData ? (
            <div className="flex items-center justify-between p-2.5 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                  {couponData?.coupon_code}
                </span>
                <span className="text-xs text-green-600 font-medium">Applied!</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCoupon(shopProduct?._id)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <FiX size={11} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors placeholder:text-gray-400"
                placeholder="Enter promo code"
                value={couponCode || ""}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon(shopProduct?._id)}
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon(shopProduct?._id)}
                disabled={isApplyingCoupon}
                className="px-3 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {isApplyingCoupon ? "..." : "Apply"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Place order button — desktop only; mobile uses fixed bottom bar */}
      <div className="hidden md:block">
        {loading ? (
          <div className="w-full py-3 flex items-center justify-center bg-primary text-white rounded-2xl">
            <MiniSpinner />
          </div>
        ) : (
          <Button
            className="w-full rounded-2xl h-12 text-sm font-semibold flex items-center justify-center gap-2"
            type="submit"
            variant="default"
            disabled={belowMin}
          >
            <FiLock size={14} />
            Place Order
            <FiChevronRight size={14} />
          </Button>
        )}
        <p className="text-center text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1">
          <FiLock size={9} />
          Secure checkout. Your data is protected.
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
