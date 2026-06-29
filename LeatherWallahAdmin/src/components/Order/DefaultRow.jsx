// OrderPage/components/DefaultRow.jsx
import { Link } from "react-router-dom";

const ORDER_STATUS_COLOR = {
  pending: "bg-orange-100 text-orange-700",
  on_hold: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-teal-100 text-teal-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancel: "bg-red-100 text-red-700",
  return: "bg-rose-100 text-rose-700",
};

const DefaultRow = ({ order, index, page, limit }) => {
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
      <td className="whitespace-nowrap p-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLOR[order.order_status] || "bg-gray-100 text-gray-600"}`}
        >
          {order.order_status}
        </span>
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
