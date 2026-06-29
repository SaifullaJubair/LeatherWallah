import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import { FiPackage, FiTruck, FiTag, FiCheck } from "react-icons/fi";
import { TbShoppingCartOff } from "react-icons/tb";
import { MdOutlineLocalShipping } from "react-icons/md";
import { RiSecurePaymentLine } from "react-icons/ri";

const RightSideProductSummary = ({
  totalDiscount,
  shippingCharge,
  shopSubtotals,
  shopGrandTotals,
  division,
  loading,
  shopTotal,
  stock,
}) => {
  const rows = [
    {
      label: "Subtotal",
      value: shopSubtotals,
      icon: <FiTag size={12} />,
      muted: true,
    },
    {
      label: "Discount",
      value: `- ৳${totalDiscount}`,
      raw: true,
      icon: <FiCheck size={12} />,
      green: totalDiscount > 0,
    },
    {
      label: "Shipping",
      value: shippingCharge,
      icon: <FiTruck size={12} />,
      muted: true,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 flex items-center gap-2">
        <FiPackage className="text-white/80" size={14} />
        <span className="text-sm font-semibold text-white">Order Summary</span>
        {division && (
          <span className="ml-auto text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
            {division === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"}
          </span>
        )}
      </div>

      {/* Rows */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="text-gray-400">{row.icon}</span>
              {row.label}
            </span>
            <span
              className={`font-medium ${row.green ? "text-emerald-600" : row.muted ? "text-gray-600" : "text-gray-700"}`}
            >
              {row.raw ? row.value : `৳ ${row.value}`}
            </span>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-dashed border-gray-200 pt-2 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">Grand Total</span>
            <span className="text-lg font-extrabold text-primary">
              ৳ {shopGrandTotals}
            </span>
          </div>
        </div>
      </div>

      {/* Trust row */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-center gap-4 py-2 bg-gray-50 rounded-lg mb-3">
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <RiSecurePaymentLine size={12} className="text-emerald-600" />
            Cash on Delivery
          </div>
          <div className="w-px h-3 bg-gray-300" />
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <MdOutlineLocalShipping size={12} className="text-blue-600" />
            Fast Shipping
          </div>
        </div>

        {/* Submit Button */}
        {loading ? (
          <div className="w-full py-3 flex items-center justify-center bg-primary/80 text-white rounded-xl">
            <MiniSpinner />
            <span className="ml-2 text-sm font-medium">Placing order...</span>
          </div>
        ) : stock > 0 ? (
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <FiPackage size={16} />
            Place Order Now
          </button>
        ) : (
          <div className="w-full py-3 flex items-center justify-center gap-2 bg-gray-200 text-gray-500 rounded-xl text-sm font-medium cursor-not-allowed">
            <TbShoppingCartOff size={16} />
            Out of Stock
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-2">
          By ordering, you agree to our terms & conditions
        </p>
      </div>
    </div>
  );
};

export default RightSideProductSummary;
