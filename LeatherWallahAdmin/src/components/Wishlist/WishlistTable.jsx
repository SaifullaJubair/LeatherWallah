import { useEffect, useState } from "react";
import Pagination from "../common/pagination/Pagination";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const GROUP_BADGE = {
  retail: "bg-gray-100 text-gray-600",
  wholesale: "bg-amber-100 text-amber-700",
  vip: "bg-purple-100 text-purple-700",
};

const WishlistTable = ({
  wishlist,
  setPage,
  setLimit,
  totalData,
  page,
  limit,
  isLoading,
}) => {
  const [serialNumber, setSerialNumber] = useState(0);
  useEffect(() => {
    setSerialNumber((page - 1) * limit);
  }, [page, limit]);

  if (isLoading) return <TableLoadingSkeleton />;

  const rows = wishlist?.data || [];

  return (
    <div>
      <div className="rounded-lg border border-gray-200 mt-6">
        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-t-lg">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
              <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                  <th className="whitespace-nowrap p-4 font-medium">SL</th>
                  <th className="whitespace-nowrap p-4 font-medium">User</th>
                  <th className="whitespace-nowrap p-4 font-medium">Phone</th>
                  <th className="whitespace-nowrap p-4 font-medium">Group</th>
                  <th className="whitespace-nowrap p-4 font-medium">Product</th>
                  <th className="whitespace-nowrap p-4 font-medium">Variation</th>
                  <th className="whitespace-nowrap p-4 font-medium">Notify</th>
                  <th className="whitespace-nowrap p-4 font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {rows.map((r, i) => {
                  const u = r?.user_id || {};
                  const p = r?.product_id || {};
                  const v = r?.variation_id;
                  const g = u?.customer_group || "retail";
                  return (
                    <tr
                      key={r._id}
                      className="divide-x divide-gray-200 hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap p-3 text-gray-700">
                        {serialNumber + i + 1}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-800 font-medium">
                        {u?.user_name || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-600">
                        {u?.user_phone || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded capitalize ${
                            GROUP_BADGE[g] || GROUP_BADGE.retail
                          }`}
                        >
                          {g}
                        </span>
                      </td>
                      <td className="p-3 text-gray-800 max-w-xs">
                        <div className="flex items-center gap-2 justify-center">
                          {p?.main_image && (
                            <img
                              src={p.main_image}
                              alt=""
                              className="w-10 h-10 object-cover rounded border border-gray-200"
                            />
                          )}
                          <div className="text-left">
                            <div className="font-medium truncate">
                              {p?.product_name || (
                                <span className="text-gray-300">
                                  (deleted product)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              ৳{p?.product_discount_price || p?.product_price || 0}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-600 text-xs">
                        {v?.variation_name || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3">
                        {r?.notify_back_in_stock ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                            yes
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-500 text-xs">
                        {fmt(r?.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <NoDataFound />
        )}
      </div>

      <Pagination
        setPage={setPage}
        setLimit={setLimit}
        totalData={totalData}
        page={page}
        limit={limit}
      />
    </div>
  );
};

export default WishlistTable;
