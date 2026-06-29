import { useEffect, useState } from "react";
import Pagination from "../common/pagination/Pagination";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";

const STEP_BADGE = {
  cart: "bg-gray-100 text-gray-600",
  shipping: "bg-amber-100 text-amber-700",
  payment: "bg-red-100 text-red-700",
};

const ageMinutes = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 60000);
};

const ageLabel = (m) => {
  if (m === null) return "—";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
};

const AbandonedCartTable = ({
  carts,
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

  const rows = carts?.data || [];

  return (
    <div>
      <div className="rounded-lg border border-gray-200 mt-6">
        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-t-lg">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
              <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                  <th className="whitespace-nowrap p-4 font-medium">SL</th>
                  <th className="whitespace-nowrap p-4 font-medium">Customer</th>
                  <th className="whitespace-nowrap p-4 font-medium">Phone</th>
                  <th className="whitespace-nowrap p-4 font-medium">Items</th>
                  <th className="whitespace-nowrap p-4 font-medium">Total</th>
                  <th className="whitespace-nowrap p-4 font-medium">Step</th>
                  <th className="whitespace-nowrap p-4 font-medium">Age</th>
                  <th className="whitespace-nowrap p-4 font-medium">Recovered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {rows.map((r, i) => {
                  const m = ageMinutes(r?.updatedAt || r?.createdAt);
                  return (
                    <tr
                      key={r._id}
                      className="divide-x divide-gray-200 hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap p-3 text-gray-700">
                        {serialNumber + i + 1}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-800 font-medium">
                        {r?.customer_name || (
                          <span className="text-gray-300 italic">guest</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-600">
                        {r?.customer_phone || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-700">
                        {Array.isArray(r?.items) ? r.items.length : 0}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-700 font-medium">
                        ৳{Number(r?.cart_total) || 0}
                      </td>
                      <td className="whitespace-nowrap p-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded capitalize ${
                            STEP_BADGE[r?.step] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r?.step || "cart"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-500 text-xs">
                        {ageLabel(m)}
                      </td>
                      <td className="whitespace-nowrap p-3">
                        {r?.recovered ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700">
                              ✓ recovered
                            </span>
                            {r?.recovered_order_id && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                {String(r.recovered_order_id).slice(-6)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
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

export default AbandonedCartTable;
