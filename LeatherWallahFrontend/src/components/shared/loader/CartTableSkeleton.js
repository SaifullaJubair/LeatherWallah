import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const CartTableSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <Skeleton width={120} height={14} />
      </div>

      <div className="divide-y divide-gray-50">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex gap-3 p-4">
            {/* Thumbnail */}
            <Skeleton width={64} height={64} borderRadius={12} className="shrink-0" />

            {/* Info */}
            <div className="flex-1">
              <Skeleton width="70%" height={14} />
              <Skeleton width="35%" height={11} className="mt-1" />

              <div className="flex items-center justify-between mt-3">
                <Skeleton width={60} height={14} />
                <Skeleton width={90} height={28} borderRadius={8} />
                <Skeleton width={56} height={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartTableSkeleton;
