import { FaStar } from "react-icons/fa";

export const averageRatingStar = (rating) => {
  return Array.from({ length: 5 }).map((_, index) => {
    const starValue = index + 1;

    if (rating >= starValue) {
      // Full star
      return <FaStar className="text-[#FFA20F]" key={index} />;
    } else if (rating >= starValue - 1) {
      // Half star
      return (
        <div key={index} className="relative">
          <FaStar className="text-gray-300" /> {/* Empty star background */}
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{
              width: `${(rating - (starValue - 1)) * 100}%`,
            }}
          >
            <FaStar className="text-[#FFA20F]" /> {/* Partial fill */}
          </div>
        </div>
      );
    } else {
      // Empty star
      return <FaStar className="text-gray-300" key={index} />;
    }
  });
};
