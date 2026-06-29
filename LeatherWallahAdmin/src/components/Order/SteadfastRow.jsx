// OrderPage/components/SteadfastRow.jsx
import { Link } from "react-router-dom";
import { FaSync } from "react-icons/fa";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const STEADFAST_STATUS_COLOR = {
  delivered: "bg-green-100 text-green-700",
  partial_delivered: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  in_review: "bg-blue-100 text-blue-700",
  pending: "bg-orange-100 text-orange-700",
  hold: "bg-purple-100 text-purple-700",
  delivered_approval_pending: "bg-green-50 text-green-600",
  partial_delivered_approval_pending: "bg-yellow-50 text-yellow-600",
  cancelled_approval_pending: "bg-red-50 text-red-600",
  unknown_approval_pending: "bg-gray-50 text-gray-500",
  unknown: "bg-gray-100 text-gray-600",
};

const STEADFAST_CANCEL_BLOCKED = [
  "delivered_approval_pending",
  "partial_delivered_approval_pending",
  "cancelled_approval_pending",
  "unknown_approval_pending",
  "delivered",
  "partial_delivered",
  "cancelled",
  "unknown",
  "hold",
];

const SteadfastRow = ({
  order,
  index,
  page,
  limit,
  onSync,
  onCancel,
  syncingOrderId,
  loadingOrderId,
  canUpdate,
}) => {
  const isSyncing = syncingOrderId === order._id;
  const isLoading = loadingOrderId === order._id;
  const canCancel =
    canUpdate && !STEADFAST_CANCEL_BLOCKED.includes(order?.steadfast_status);
  const rowClass = index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor";

  return (
    <tr className={`divide-x divide-gray-200 ${rowClass}`}>
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
      <td className="whitespace-nowrap p-4">{order.customer_phone}</td>
      <td className="whitespace-nowrap p-4 font-mono text-xs">
        {order.steadfast_tracking_code || "-"}
      </td>
      <td className="whitespace-nowrap p-4 text-xs">
        {order.steadfast_consignment_id || "-"}
      </td>
      <td className="whitespace-nowrap p-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${STEADFAST_STATUS_COLOR[order.steadfast_status] || "bg-gray-100 text-gray-600"}`}
        >
          {order.steadfast_status || "-"}
        </span>
      </td>
      <td className="whitespace-nowrap p-4">৳{order.grand_total_amount}</td>
      <td className="whitespace-nowrap p-4 text-xs text-gray-500">
        {new Date(order.createdAt).toLocaleDateString("en-BD")}
      </td>
      <td className="whitespace-nowrap p-4">
        {canUpdate &&
          order.steadfast_consignment_id &&
          (isSyncing ? (
            <MiniSpinner />
          ) : (
            <button
              onClick={() => onSync(order)}
              disabled={!!syncingOrderId}
              className="h-[36px] rounded-lg px-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 mx-auto"
            >
              <FaSync size={11} /> Sync
            </button>
          ))}
      </td>
      <td className="whitespace-nowrap p-4">
        {canCancel ? (
          isLoading ? (
            <MiniSpinner />
          ) : (
            <button
              onClick={() => onCancel(order)}
              disabled={!!loadingOrderId}
              className="h-[36px] rounded-lg px-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-medium"
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
          className="flex justify-center text-gray-500 hover:text-gray-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </Link>
      </td>
    </tr>
  );
};

export default SteadfastRow;
