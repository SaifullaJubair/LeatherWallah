// OrderPage/components/DefaultRow.jsx
//
// Row for the All / Delivered / Cancelled / POS / Offer tabs.
//
// This row used to be read-only: it showed a status badge and an eye icon and
// nothing else, so an order that left "Pending" (e.g. the moment it was
// confirmed) had NO reachable action anywhere in the list — every further step
// meant opening the detail page and coming back. It now carries the same
// actions the Pending tab has, plus the status dropdown from the detail page.
import { Link, useNavigate } from "react-router-dom";
import { FaPrint } from "react-icons/fa";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import {
  NEXT_STATUS_OPTIONS,
  ORDER_STATUS_COLOR,
  COURIER_SENDABLE_STATUSES,
  isCourierLocked,
  normalizePhoneForFraud,
} from "./orderStatus.constants";

const DefaultRow = ({
  order,
  index,
  page,
  limit,
  loadingOrderId,
  canUpdate,
  onStatusChange,
  onCancel,
  onPrint,
  onSendPathao,
  onSendSteadfast,
}) => {
  const rowClass = index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor";
  const navigate = useNavigate();
  const isLoading = loadingOrderId === order._id;

  const status = order?.order_status;
  const nextOptions = NEXT_STATUS_OPTIONS[status] ?? [];
  const courierLocked = isCourierLocked(order);

  // Cancel from here restocks the order, so it is offered only while the goods
  // are still with the shop. Once a courier holds the parcel the cancel must go
  // through the courier tab (owner decision: hide, don't warn).
  const canCancelHere =
    canUpdate && !courierLocked && nextOptions.includes("cancel");

  const canSendCourier =
    canUpdate && !courierLocked && COURIER_SENDABLE_STATUSES.includes(status);

  const handleFraudCheck = () =>
    navigate(`/fraud-check?phone=${normalizePhoneForFraud(order.customer_phone)}`);

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

      {/* Status — badge, plus the advance dropdown when a move is possible */}
      <td className="whitespace-nowrap p-4">
        <div className="flex items-center justify-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLOR[status] || "bg-gray-100 text-gray-600"}`}
          >
            {status}
          </span>
          {canUpdate && nextOptions.length > 0 && (
            <select
              value=""
              disabled={isLoading}
              onChange={(e) => onStatusChange?.(order, e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white cursor-pointer disabled:opacity-50"
              title="Advance order status"
            >
              <option value="" disabled>
                {isLoading ? "Updating…" : "Change →"}
              </option>
              {nextOptions
                // A courier-held parcel can't be cancelled/returned from here.
                .filter(
                  (s) =>
                    !courierLocked || (s !== "cancel" && s !== "return"),
                )
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          )}
        </div>
      </td>

      <td className="whitespace-nowrap p-4">
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
          {order.courier_type || "N/A"}
        </span>
      </td>

      <td className="whitespace-nowrap p-4">৳{order.grand_total_amount}</td>

      <td className="whitespace-nowrap p-4 text-xs text-gray-500">
        {new Date(order.createdAt).toLocaleDateString("en-BD")}
      </td>

      {/* Send Courier */}
      <td className="whitespace-nowrap p-4">
        {isLoading ? (
          <MiniSpinner />
        ) : courierLocked ? (
          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded capitalize">
            ✓ {order.courier_type} sent
          </span>
        ) : canSendCourier ? (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onSendPathao?.(order)}
              disabled={!!loadingOrderId}
              className="h-[36px] rounded-lg px-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-medium"
            >
              Send Pathao
            </button>
            <button
              onClick={() => onSendSteadfast?.(order)}
              disabled={!!loadingOrderId}
              className="h-[36px] rounded-lg px-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-medium"
            >
              Send Steadfast
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Cancel */}
      <td className="whitespace-nowrap p-4">
        {canCancelHere ? (
          <button
            onClick={() => onCancel?.(order)}
            disabled={!!loadingOrderId}
            className="h-[36px] rounded-lg px-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-medium"
          >
            Cancel
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Print */}
      <td className="whitespace-nowrap p-4">
        <button
          onClick={() => onPrint?.(order)}
          className="flex items-center gap-1 mx-auto text-gray-700 hover:text-blue-700"
        >
          <FaPrint /> Print
        </button>
      </td>

      {/* Fraud */}
      <td className="whitespace-nowrap p-4">
        <button
          onClick={handleFraudCheck}
          className="flex items-center justify-center mx-auto text-purple-500 hover:text-purple-700 text-lg"
          title="Fraud Check"
        >
          🔍
        </button>
      </td>

      {/* Details */}
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

export default DefaultRow;
