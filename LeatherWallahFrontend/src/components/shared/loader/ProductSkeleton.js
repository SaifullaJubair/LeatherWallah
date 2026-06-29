import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ProductSkeleton = () => {
  return (
    <div className="bg-white   my-4 shadow-md border-primary-100 border h-80 sm:h-96">
      <div className="p-2">
        <Skeleton height={190} />
      </div>
      <div className="p-3 flex flex-col  gap-6 h-40 sm:h-44 md:h-48">
        <div>
          {" "}
          <Skeleton height={20} className="mb-4" width="80%" />
          <Skeleton height={15} width="60%" />
        </div>
        <div>
          {" "}
          <Skeleton height={20} className="mb-4" width="40%" />
          <Skeleton height={15} width="30%" />
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
