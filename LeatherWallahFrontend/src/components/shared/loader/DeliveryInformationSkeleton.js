import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const DeliveryInformationSkeleton = () => {
  return (
    <div className="bg-white shadow-md p-4">
      <div>
        <p className="text-xl mb-3">Delivery Information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Name
          </label>
          <Skeleton height={38} className="mt-2" />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Phone Number
          </label>
          <Skeleton height={38} className="mt-2" />
        </div>

        {/* Division */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Division
          </label>
          <Skeleton height={38} className="mt-2" />
        </div>

        {/* District (Skeleton only shown when division is selected) */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            District
          </label>
          <Skeleton height={38} className="mt-2" />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Address
          </label>
          <Skeleton height={38} className="mt-2" />
        </div>
      </div>
    </div>
  );
};

export default DeliveryInformationSkeleton;
