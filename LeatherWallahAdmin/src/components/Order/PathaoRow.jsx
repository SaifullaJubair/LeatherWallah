// OrderPage/components/PathaoRow.jsx
import { Link } from "react-router-dom";
import { FaSync } from "react-icons/fa";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const PATHAO_STATUS_COLOR = {
  Delivered: "bg-green-100 text-green-700",
  "Partial Delivery": "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
  "Pickup Requested": "bg-blue-100 text-blue-700",
  "In Transit": "bg-purple-100 text-purple-700",
  "Out for Delivery": "bg-orange-100 text-orange-700",
  Return: "bg-red-50 text-red-500",
  "Delivery Failed": "bg-red-50 text-red-500",
  "On Hold": "bg-purple-50 text-purple-500",
  "Pickup Cancel": "bg-red-100 text-red-600",
  "Pickup Cancelled": "bg-red-100 text-red-600",
  "Pickup Failed": "bg-orange-100 text-orange-600",
  "Paid Return": "bg-yellow-100 text-yellow-700",
};

const PathaoRow = ({
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
  const rowClass = index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor";
  const hasConsignment = !!order.consignment_id;

  const cancelBlocked = [
    "Delivered",
    "Partial Delivery",
    "Partially Delivered",
    "Return",
    "Returned",
    "Paid Return",
    "Partially Returned",
    "Pickup Cancel",
    "Pickup Cancelled",
    "Cancelled",
    "Delivery Cancelled",
    "Delivery Failed",
  ].includes(order?.pathao_status);

  const syncBtnClass = hasConsignment
    ? "h-[36px] rounded-lg px-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 mx-auto"
    : "h-[36px] rounded-lg px-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 mx-auto";

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
        {order.tracking_code || "-"}
      </td>

      {/* Consignment ID — না থাকলে warning badge */}
      <td className="whitespace-nowrap p-4 text-xs">
        {hasConsignment ? (
          order.consignment_id
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
            ⚠️ Sync করুন
          </span>
        )}
      </td>

      <td className="whitespace-nowrap p-4">
        {order.pathao_status ? (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${PATHAO_STATUS_COLOR[order.pathao_status] || "bg-gray-100 text-gray-600"}`}
          >
            {order.pathao_status}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </td>

      <td className="whitespace-nowrap p-4">৳{order.grand_total_amount}</td>

      <td className="whitespace-nowrap p-4 text-xs text-gray-500">
        {new Date(order.createdAt).toLocaleDateString("en-BD")}
      </td>

      {/* Sync — সবসময় দেখাবে, consignment নেই হলে yellow */}
      <td className="whitespace-nowrap p-4">
        {canUpdate &&
          (isSyncing ? (
            <MiniSpinner />
          ) : (
            <button
              onClick={() => onSync(order)}
              disabled={!!syncingOrderId}
              className={syncBtnClass}
            >
              <FaSync size={11} /> Sync
            </button>
          ))}
      </td>

      {/* Cancel */}
      <td className="whitespace-nowrap p-4">
        {canUpdate && !cancelBlocked ? (
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

export default PathaoRow;
