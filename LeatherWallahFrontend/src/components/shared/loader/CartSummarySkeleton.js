import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const CartSummarySkeleton = () => {
  return (
    <div className="space-y-3 mt-4 md:mt-0">
      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <Skeleton width={120} height={14} />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton width={70} height={13} />
              <Skeleton width={60} height={13} />
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <Skeleton width={40} height={15} />
            <Skeleton width={80} height={20} />
          </div>
        </div>
      </div>

      {/* Coupon card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <Skeleton width={90} height={14} className="mb-3" />
        <div className="flex gap-2">
          <Skeleton height={38} borderRadius={12} className="flex-1" />
          <Skeleton width={60} height={38} borderRadius={12} />
        </div>
      </div>

      {/* Place order button */}
      <Skeleton height={48} borderRadius={16} />
    </div>
  );
};

export default CartSummarySkeleton;
