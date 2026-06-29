// OrderPage/components/PendingRow.jsx
import { Link, useNavigate } from "react-router-dom";
import { FaPrint } from "react-icons/fa";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

const PendingRow = ({
  order,
  index,
  page,
  limit,
  selected,
  onSelect,
  onPrint,
  onSendPathao,
  onSendSteadfast,
  onCancel,
  loadingOrderId,
  canUpdate,
}) => {
  const isLoading = loadingOrderId === order._id;
  const rowClass = index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor";
  const navigate = useNavigate();

  const handleFraudCheck = () => {
    const phone = order.customer_phone.replace(/^\+?88/, "");
    navigate(`/fraud-check?phone=${phone}`);
  };

  return (
    <tr className={`divide-x divide-gray-200 ${rowClass}`}>
      <td className="whitespace-nowrap p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(order._id)}
          className="cursor-pointer"
        />
      </td>
      <td className="whitespace-nowrap p-4">
        {(page - 1) * limit + index + 1}
      </td>
      <td className="whitespace-nowrap p-4">
        <button
          onClick={() => onPrint(order)}
          className="flex items-center gap-1 text-gray-700 hover:text-blue-700"
        >
          <FaPrint /> Print
        </button>
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
      <td className="whitespace-nowrap p-4">৳{order.grand_total_amount}</td>
      <td className="whitespace-nowrap p-4 max-w-[200px] truncate">
        {order.billing_address}, {order.billing_city}
      </td>
      <td className="whitespace-nowrap p-4 text-xs text-gray-500">
        {new Date(order.createdAt).toLocaleDateString("en-BD")}
      </td>
      <td className="whitespace-nowrap p-4">
        {isLoading ? (
          <MiniSpinner />
        ) : canUpdate ? (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onSendPathao(order)}
              disabled={!!loadingOrderId}
              className="h-[36px] rounded-lg px-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-medium"
            >
              Send Pathao
            </button>
            <button
              onClick={() => onSendSteadfast(order)}
              disabled={!!loadingOrderId}
              className="h-[36px] rounded-lg px-3 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-medium"
            >
              Send Steadfast
            </button>
          </div>
        ) : null}
      </td>
      <td className="whitespace-nowrap p-4">
        {canUpdate && (
          <button
            onClick={() => onCancel(order)}
            disabled={!!loadingOrderId}
            className="h-[36px] rounded-lg px-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-medium"
          >
            Cancel
          </button>
        )}
      </td>
      <td className="whitespace-nowrap p-4">
        <button
          onClick={handleFraudCheck}
          className="flex items-center justify-center mx-auto text-purple-500 hover:text-purple-700 text-lg"
          title="Fraud Check"
        >
          🔍
        </button>
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

export default PendingRow;
