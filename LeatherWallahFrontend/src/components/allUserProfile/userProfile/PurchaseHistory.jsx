"use client";

import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";
import useGetAllOrders from "@/components/lib/getAllOrders";
import CustomLoader from "@/components/shared/loader/CustomLoader";
import { EnglishDateWithTimeShort } from "@/components/utils/EnglishDateWithTimeShort";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import Link from "next/link";
import { useState } from "react";
import { FiExternalLink, FiPackage, FiSearch } from "react-icons/fi";
import { FaTruck } from "react-icons/fa";
import useGetSettingData from "@/components/lib/getSettingData";
import { currencyOf } from "@/utils/currency";

const STATUS_STYLE = {
  pending:    "bg-orange-100 text-orange-600",
  on_hold:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-teal-100 text-teal-700",
  processing: "bg-blue-100 text-blue-600",
  shipped:    "bg-purple-100 text-purple-600",
  delivered:  "bg-green-100 text-green-600",
  completed:  "bg-emerald-100 text-emerald-700",
  cancel:     "bg-red-100 text-red-600",
  return:     "bg-rose-100 text-rose-600",
};

const PurchaseHistory = () => {
  const { data: userInfo, isLoading } = useUserInfoQuery();
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allOrders = [], isLoading: orderLoading } = useGetAllOrders({
    customer_id: userInfo?.data?._id,
    page, limit, searchTerm,
  });

  const { data: settingsData } = useGetSettingData();
  const cur = currencyOf(settingsData);

  if (isLoading || orderLoading) return <CustomLoader />;

  const orderRows = allOrders?.data || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FiPackage size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-gray-900">Purchase History</h2>
        </div>
        {/* Search */}
        <div className="relative hidden sm:block">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search invoice…"
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 w-44"
          />
        </div>
      </div>

      {orderRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <FiPackage size={48} className="text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-700">No orders yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4 text-center">
            Your purchase history will appear here once you place your first order.
          </p>
          <Link href="/" className="bg-primary text-white text-xs px-5 py-2 rounded-lg hover:opacity-90 transition">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Invoice</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center">Track</th>
                  <th className="px-5 py-3 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orderRows.map((item, index) => (
                  <tr key={item?._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {(page - 1) * limit + index + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/orders/${item?._id}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {item?.invoice_id}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {item?.createdAt && EnglishDateWithTimeShort(item.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[item?.order_status] || "bg-gray-100 text-gray-600"}`}>
                        {item?.order_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-900 text-right whitespace-nowrap">
                      {cur.symbol}{item?.grand_total_amount}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/orders/order-tracking/${item?.invoice_id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                      >
                        <FaTruck size={10} /> Track
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/orders/${item?._id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        View <FiExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orderRows.length > 0 && (
            <div className="flex justify-end px-5 py-4 border-t border-gray-50">
              <PaginationWithPageBtn
                page={page} setPage={setPage}
                rows={limit} setRows={setLimit}
                totalData={allOrders?.totalData}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PurchaseHistory;
