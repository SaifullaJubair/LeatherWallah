import { useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FaRegEye } from "react-icons/fa";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { BASE_URL } from "../../utils/baseURL";
import TableLoadingSkeleton from "../../components/common/loadingSkeleton/TableLoadingSkeleton";
import Pagination from "../../components/common/pagination/Pagination";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

// ✅ Steadfast sub-tabs
const TABS = [
  { label: "All", value: "all" },
  { label: "In Review", value: "in_review" },
  { label: "Pending", value: "pending" },
  { label: "In Transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Partial Delivered", value: "partial_delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Unknown", value: "unknown" },
];

// Status badge color
const statusColor = (status) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "partial_delivered":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "in_review":
      return "bg-blue-100 text-blue-700";
    case "pending":
      return "bg-orange-100 text-orange-700";
    case "in_transit":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const SteadfastOrderPage = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useContext(AuthContext);

  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => {
    setSearchTerm(searchText);
    setPage(1);
  }, [searchText]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchValue("");
    setSearchTerm("");
  };

  // ✅ Fetch Steadfast Orders
  const {
    data: steadfastData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["steadfast-orders", page, limit, searchTerm, activeTab],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/order/steadfast?page=${page}&limit=${limit}&searchTerm=${searchTerm}&steadfast_status=${activeTab}`,
        { credentials: "include" },
      );
      return res.json();
    },
  });

  const orders = steadfastData?.data || [];
  const totalData = steadfastData?.totalData || 0;

  // ✅ Cancel Order Mutation
  const cancelMutation = useMutation({
    mutationFn: async (orderId) => {
      const res = await fetch(`${BASE_URL}/order/steadfast/cancel/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Order cancelled successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // ✅ Handle Cancel with Confirmation
  const handleCancelOrder = async (order) => {
    const confirm = await Swal.fire({
      title: "Cancel Order?",
      html: `
        <p>Invoice: <strong>${order.invoice_id}</strong></p>
        <p class="text-sm text-gray-600 mt-2">
          ⚠️ This order is in "${order.steadfast_status}" status.
          ${order.steadfast_status === "in_review" ? "You can cancel it from here." : "Cannot cancel! Already processed by Steadfast."}
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Cancel!",
    });

    if (confirm.isConfirmed) {
      cancelMutation.mutate(order._id);
    }
  };

  if (!user?.role_id?.order_show) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 font-medium">
        Access Denied!
      </div>
    );
  }

  return (
    <div className="bg-white rounded py-6 px-4 shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Steadfast Orders</h1>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by Invoice, Phone..."
          className="w-full sm:w-[300px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        />
      </div>

      {/* ✅ Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 border-b pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              activeTab === tab.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No orders found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded">
          <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
            <thead className="bg-[#fff9ee]">
              <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                <td className="whitespace-nowrap p-4">SL</td>
                <td className="whitespace-nowrap p-4">Invoice No</td>
                <td className="whitespace-nowrap p-4">Customer</td>
                <td className="whitespace-nowrap p-4">Phone</td>
                <td className="whitespace-nowrap p-4">Tracking Code</td>
                <td className="whitespace-nowrap p-4">Consignment ID</td>
                <td className="whitespace-nowrap p-4">Steadfast Status</td>
                <td className="whitespace-nowrap p-4">Grand Total</td>
                <td className="whitespace-nowrap p-4">Date</td>
                <td className="whitespace-nowrap p-4">Actions</td>
                <td className="whitespace-nowrap p-4">Details</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {orders.map((order, index) => (
                <tr
                  key={order._id}
                  className={`divide-x divide-gray-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                  }`}
                >
                  <td className="whitespace-nowrap p-4">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <Link
                      to={`/all-order-info/${order._id}`}
                      className="underline font-medium text-blue-600"
                    >
                      {order.invoice_id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap p-4">
                    {order?.customer_id?.user_name || "N/A"}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    {order.customer_phone}
                  </td>
                  <td className="whitespace-nowrap p-4 font-mono text-xs">
                    {order.steadfast_tracking_code || "-"}
                  </td>
                  <td className="whitespace-nowrap p-4 text-xs">
                    {order.steadfast_consignment_id || "-"}
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(
                        order.steadfast_status,
                      )}`}
                    >
                      {order.steadfast_status || "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-4">
                    ৳{order.grand_total_amount}
                  </td>
                  <td className="whitespace-nowrap p-4 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-BD")}
                  </td>

                  {/* ✅ CRITICAL: Cancel button শুধু in_review এ দেখাবে */}
                  <td className="whitespace-nowrap p-4">
                    {user?.role_id?.order_update &&
                    order.steadfast_status === "in_review" ? (
                      cancelMutation.isLoading ? (
                        <MiniSpinner />
                      ) : (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="h-[36px] rounded-lg px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-medium"
                        >
                          Cancel
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap p-4">
                    <Link
                      to={`/all-order-info/${order._id}`}
                      className="text-gray-500 hover:text-gray-900 flex justify-center"
                    >
                      <FaRegEye size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalData > 10 && (
        <Pagination
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          totalData={totalData}
        />
      )}
    </div>
  );
};

export default SteadfastOrderPage;
