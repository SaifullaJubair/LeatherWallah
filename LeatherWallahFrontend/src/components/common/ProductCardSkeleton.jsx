"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

/**
 * Single product card skeleton — matches ProductCard layout exactly.
 * Use ProductCardGridSkeleton for a full grid.
 *
 * Props:
 *   count — how many skeleton cards to render (default 1)
 */
const ProductCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          {/* Image area — 3:4 aspect */}
          <Skeleton
            className="w-full shrink-0"
            style={{ aspectRatio: "3/4", display: "block" }}
            borderRadius={0}
          />

          {/* Info */}
          <div className="p-3 flex flex-col gap-2 flex-1">
            {/* Title — 2 lines */}
            <Skeleton height={13} width="90%" />
            <Skeleton height={13} width="65%" />

            {/* Color swatches */}
            <div className="flex gap-1 mt-0.5">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} width={14} height={14} circle />
              ))}
            </div>

            {/* Price row */}
            <div className="flex items-center gap-2 mt-auto pt-1">
              <Skeleton height={16} width={60} />
              <Skeleton height={12} width={45} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductCardSkeleton;
