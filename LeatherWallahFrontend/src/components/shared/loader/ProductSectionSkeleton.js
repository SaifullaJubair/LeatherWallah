"use client";
// Loader/SkeletonLoader.js
import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

const ProductSectionSkeleton = ({ count = 10 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-y-6 ">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="shadow-md   ">
          {/* <Skeleton className=" h-[280px] md:h-[480px] lg:h-[550px] xl:h-[620px]" /> */}
          <Skeleton className=" relative w-full aspect-[2/3] overflow-hidden flex-grow" />
          <div className="p-1 m-2 flex flex-col  ">
            {" "}
            <Skeleton height={20} className="mb-4" width="80%" />
            <Skeleton height={15} width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSectionSkeleton;
