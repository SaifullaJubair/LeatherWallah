import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const WishlistTableSkeleton = () => {
  return (
    <div className="mt-6 bg-white shadow-lg p-4">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr className="text-gray-900">
              <th className="p-4">#</th>
              <th className="p-4">Image</th>
              <th className="p-4">Product</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock Status</th>
              <th className="p-4">Action</th>
              <th className="p-4">Remove</th>
            </tr>
          </thead>

          <tbody className="divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr
                key={index}
                className="divide-y divide-gray-100 text-center bg-white"
              >
                <td className="p-4">
                  <Skeleton width={20} />
                </td>
                <td className="p-4">
                  <Skeleton height={60} width={60} />
                </td>
                <td className="p-4">
                  <Skeleton height={15} width="80%" />
                  <Skeleton height={10} width="50%" />
                </td>
                <td className="p-4">
                  <Skeleton height={15} width={60} />
                </td>
                <td className="p-4">
                  <Skeleton height={20} width={80} />
                </td>
                <td className="p-4">
                  <Skeleton height={30} width={100} />
                </td>
                <td className="p-4">
                  <Skeleton circle height={30} width={30} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WishlistTableSkeleton;
