/**
 * Low-stock list (Phase B4, A3b).
 *
 * Backend: GET /product/low_stock → { products: [...], variations: [...] }
 *   - simple products at/under product_alert_quantity (alert > 0 filter on BE)
 *   - variations at/under variation_alert_quantity (parent product_id populated)
 * Click-through opens /product/product-update/:id.
 */

import { useContext } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/AuthProvider";
import { BASE_URL } from "../../utils/baseURL";
import { LoaderOverlay } from "../../components/common/loader/LoderOverley";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import { FiAlertTriangle, FiEdit } from "react-icons/fi";

const StockBadge = ({ qty, alert }) => {
  const ratio = alert > 0 ? qty / alert : 0;
  const out = qty <= 0;
  const styles = out
    ? "bg-red-100 text-red-700"
    : ratio <= 0.5
      ? "bg-amber-100 text-amber-700"
      : "bg-yellow-100 text-yellow-700";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${styles}`}
    >
      {qty} {out && "(OUT)"}
    </span>
  );
};

const LowStockPage = () => {
  const { user } = useContext(AuthContext);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/v1/product/low_stock"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/low_stock`, {
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error: ${res.status} - ${t}`);
      }
      return res.json();
    },
  });

  if (isLoading) return <LoaderOverlay />;

  const products = data?.data?.products || [];
  const variations = data?.data?.variations || [];

  return (
    <>
      {user?.role_id?.product_show === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl flex items-center gap-2">
                <FiAlertTriangle className="text-amber-500" />
                Low Stock
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Items whose stock has fallen to or below their alert threshold.
                Computed live at query time — always accurate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {/* Simple products */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Products{" "}
                <span className="text-gray-400 font-normal">
                  ({products.length})
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-gray-200">
              {products.length > 0 ? (
                <div className="overflow-x-auto rounded-t-lg">
                  <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="bg-[#fff9ee]">
                      <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                        <th className="p-3 font-medium">Product</th>
                        <th className="p-3 font-medium">Current</th>
                        <th className="p-3 font-medium">Alert at</th>
                        <th className="p-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-center">
                      {products.map((p) => (
                        <tr
                          key={p._id}
                          className="divide-x divide-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3 text-left">
                            <div className="flex items-center gap-2">
                              {p?.main_image && (
                                <img
                                  src={p.main_image}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded border border-gray-200"
                                />
                              )}
                              <div>
                                <div className="font-medium text-gray-800">
                                  {p.product_name}
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                  {p.product_slug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap p-3">
                            <StockBadge
                              qty={Number(p.product_quantity) || 0}
                              alert={Number(p.product_alert_quantity) || 0}
                            />
                          </td>
                          <td className="whitespace-nowrap p-3 text-gray-600">
                            {p.product_alert_quantity}
                          </td>
                          <td className="whitespace-nowrap p-3">
                            <Link
                              to={`/product/product-update/${p._id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primaryColor text-white rounded hover:bg-blue-500"
                            >
                              <FiEdit size={12} /> Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <NoDataFound />
              )}
            </div>
          </section>

          {/* Variations */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Variations{" "}
                <span className="text-gray-400 font-normal">
                  ({variations.length})
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-gray-200">
              {variations.length > 0 ? (
                <div className="overflow-x-auto rounded-t-lg">
                  <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                    <thead className="bg-[#fff9ee]">
                      <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                        <th className="p-3 font-medium">Parent product</th>
                        <th className="p-3 font-medium">Variation</th>
                        <th className="p-3 font-medium">Current</th>
                        <th className="p-3 font-medium">Alert at</th>
                        <th className="p-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-center">
                      {variations.map((v) => {
                        const parent = v?.product_id || {};
                        return (
                          <tr
                            key={v._id}
                            className="divide-x divide-gray-200 hover:bg-gray-50"
                          >
                            <td className="p-3 text-left">
                              <div className="flex items-center gap-2">
                                {parent?.main_image && (
                                  <img
                                    src={parent.main_image}
                                    alt=""
                                    className="w-10 h-10 object-cover rounded border border-gray-200"
                                  />
                                )}
                                <div className="font-medium text-gray-800">
                                  {parent?.product_name || (
                                    <span className="text-gray-300">
                                      (deleted)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap p-3 text-gray-700">
                              {v.variation_name}
                            </td>
                            <td className="whitespace-nowrap p-3">
                              <StockBadge
                                qty={Number(v.variation_quantity) || 0}
                                alert={Number(v.variation_alert_quantity) || 0}
                              />
                            </td>
                            <td className="whitespace-nowrap p-3 text-gray-600">
                              {v.variation_alert_quantity}
                            </td>
                            <td className="whitespace-nowrap p-3">
                              {parent?._id && (
                                <Link
                                  to={`/product/product-update/${parent._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primaryColor text-white rounded hover:bg-blue-500"
                                >
                                  <FiEdit size={12} /> Edit
                                </Link>
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
          </section>
        </div>
      )}
    </>
  );
};

export default LowStockPage;
