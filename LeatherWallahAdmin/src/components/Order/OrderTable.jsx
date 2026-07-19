import { Link } from "react-router-dom";
import Pagination from "../common/pagination/Pagination";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import { useContext, useEffect, useState } from "react";
import { FaPrint, FaRegEye } from "react-icons/fa";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import Swal from "sweetalert2-optimized";
import { GoEye } from "react-icons/go";
import OrderStatus from "./OrderStatus";
import PrintableInvoice from "../common/printableInvoice/PrintableInvoice";
import { SettingContext } from "../../context/SettingProvider";

const OrderTable = ({
  ordersData,
  limit,
  page,
  setPage,
  setLimit,
  isLoading,
  totalData,
  user,
  loading,
  refetch,
}) => {
  const [serialNumber, setSerialNumber] = useState();
  const [buttonloading, setButtonLoading] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { settingData, loading: settingLoading } = useContext(SettingContext);
  const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);

  const handlePrintClick = async (order) => {
    try {
      const response = await fetch(`${BASE_URL}/order/admin/${order._id}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        setSelectedOrder(result?.data?.order);
        setSelectedOrderProducts(result?.data?.order_products);
        setPrintModalOpen(true);
      }
    } catch (error) {
      toast.error("Failed to fetch order details for printing");
    }
  };

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  const [viewOrderStatusValueModal, setViewOrderStatusValueModal] =
    useState(false);
  const [orderStatusValue, setOrderStatusValue] = useState({});

  const handleorderStatusValue = (orderStatus) => {
    setViewOrderStatusValueModal(true);
    setOrderStatusValue(orderStatus);
  };

  const handleOrderStatus = async (order_status, _id, order_products) => {
    try {
      const sendData = {
        _id: _id,
        order_status: order_status,
        order_updated_by: user?._id,
      };
      const today =
        new Date().toISOString().split("T")[0] +
        " " +
        new Date().toLocaleTimeString();
      if (order_status === "on_hold") sendData.on_hold_time = today;
      if (order_status === "confirmed") sendData.confirmed_time = today;
      if (order_status === "processing") sendData.processing_time = today;
      if (order_status === "shipped") sendData.shipped_time = today;
      if (order_status === "delivered") {
        sendData.delivered_time = today;
        sendData.order_products = order_products;
      }
      if (order_status === "completed") sendData.completed_time = today;
      // Order Unification Phase A — capture a reason when cancelling/returning.
      if (order_status === "cancel") {
        sendData.cancel_time = today;
        const { value: reason, isDismissed } = await Swal.fire({
          title: "Cancel order?",
          input: "textarea",
          inputLabel: "Reason for cancellation (optional)",
          inputPlaceholder: "e.g. customer requested / out of stock / fraud",
          showCancelButton: true,
          confirmButtonText: "Confirm Cancel",
          confirmButtonColor: "#d33",
        });
        if (isDismissed) return; // admin backed out — abort the status change
        if (reason) sendData.cancel_reason = reason;
      }
      if (order_status === "return") {
        sendData.return_time = today;
        const { value: reason, isDismissed } = await Swal.fire({
          title: "Mark as returned?",
          input: "textarea",
          inputLabel: "Reason for return (optional)",
          inputPlaceholder: "e.g. wrong item / damaged / customer changed mind",
          showCancelButton: true,
          confirmButtonText: "Confirm Return",
          confirmButtonColor: "#d33",
        });
        if (isDismissed) return;
        if (reason) sendData.return_reason = reason;
      }
      const response = await fetch(`${BASE_URL}/order`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Status Update successfully",
          { autoClose: 1000 },
        );
        refetch();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        refetch();
      }
    } catch (error) {
      toast.error(error?.message, { autoClose: 1000 });
      refetch();
    } finally {
      refetch();
    }
  };

  // ============================================================
  // STEADFAST — Backend এর courier route এ call করবে
  // ============================================================
  const handleOrderSendSteadFast = async (order) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Invoice: ${order?.invoice_id} — SteadFast এ পাঠাতে চান?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, send it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setButtonLoading(true);

        // Backend courier route এ call — backend থেকেই Steadfast API hit হবে
        const response = await fetch(
          `${BASE_URL}/courier/steadfast/send/${order?._id}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (data?.success === true) {
          Swal.fire({
            title: "Sent!",
            text: `SteadFast এ Order পাঠানো হয়েছে! Tracking: ${data?.data?.tracking_code || ""}`,
            icon: "success",
          });
          refetch();
        } else {
          throw new Error(
            data?.message || "Failed to send order to SteadFast.",
          );
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message || "Something went wrong.",
          icon: "error",
        });
        toast.error(error.message, { autoClose: 1000 });
      } finally {
        setButtonLoading(false);
        refetch();
      }
    });
  };

  // ============================================================
  // PATHAO — Backend এর courier route এ call করবে
  // ============================================================
  const handleOrderSendPathao = async (order) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Invoice: ${order?.invoice_id} — Pathao তে পাঠাতে চান?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, send it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        setButtonLoading(true);

        // Backend courier route এ call — backend থেকেই Pathao API hit হবে
        const response = await fetch(
          `${BASE_URL}/courier/pathao/send/${order?._id}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();

        if (data?.success === true) {
          Swal.fire({
            title: "Sent!",
            text: `Pathao তে Order পাঠানো হয়েছে! Consignment: ${data?.data?.consignment_id || ""}`,
            icon: "success",
          });
          refetch();
        } else {
          throw new Error(data?.message || "Failed to send order to Pathao.");
        }
      } catch (error) {
        Swal.fire({
          title: "Error!",
          text: error.message || "Something went wrong.",
          icon: "error",
        });
        toast.error(error.message, { autoClose: 1000 });
      } finally {
        setButtonLoading(false);
        refetch();
      }
    });
  };

  if (loading) {
    return <TableLoadingSkeleton />;
  }

  return (
    <>
      {isLoading || loading ? (
        <TableLoadingSkeleton />
      ) : (
        <div className="">
          <div className="mt-5 overflow-x-auto rounded ">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
              <thead className="bg-[#fff9ee]">
                <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                  <td className="whitespace-nowrap p-4">SL No</td>
                  <td className="whitespace-nowrap p-4">Print</td>
                  <td className="whitespace-nowrap p-4">Invoice No</td>
                  <td className="whitespace-nowrap p-4">Customer Name</td>
                  <td className="whitespace-nowrap p-4">Customer Phone</td>
                  {user?.role_id?.order_update === true && (
                    <td className="whitespace-nowrap p-4">Order Status</td>
                  )}
                  <td className="whitespace-nowrap p-4">Send Courier</td>
                  <td className="whitespace-nowrap p-4">Total Amount</td>
                  <td className="whitespace-nowrap p-4">Discount Amount</td>
                  <td className="whitespace-nowrap p-4">Shipping Cost</td>
                  <td className="whitespace-nowrap p-4">Grand Total Amount</td>
                  <td className="whitespace-nowrap p-4">Shipping Location</td>
                  <td className="whitespace-nowrap p-4">State</td>
                  <td className="whitespace-nowrap p-4">City</td>
                  <td className="whitespace-nowrap p-4">Address</td>
                  <td className="whitespace-nowrap p-4">View Details</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {ordersData?.map((order, index) => (
                  <tr
                    key={order?._id}
                    className={`divide-x divide-gray-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                    }`}
                  >
                    <td className="whitespace-nowrap p-4">
                      {serialNumber + index + 1}
                    </td>

                    <td className="whitespace-nowrap p-4">
                      <button
                        onClick={() => handlePrintClick(order)}
                        className="flex items-center justify-center text-gray-800 hover:text-blue-700"
                      >
                        <FaPrint />
                        <span className="ml-2">Print</span>
                      </button>
                    </td>

                    <td className="whitespace-nowrap p-4">
                      <Link
                        to={`/all-order-info/${order?._id}`}
                        className="underline font-medium text-blue-600"
                      >
                        {order?.invoice_id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.customer_id?.user_name}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.customer_phone}
                    </td>

                    {user?.role_id?.order_update === true &&
                      order?.order_status !== "cancel" &&
                      order?.order_status !== "return" &&
                      order?.order_status !== "completed" && (
                        <td className="whitespace-nowrap p-1">
                          <select
                            onChange={(e) =>
                              handleOrderStatus(
                                e.target.value,
                                order?._id,
                                order?.order_products,
                              )
                            }
                            value={order?.order_status}
                            className="block w-full px-1 py-1 text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer"
                          >
                            <option value={order?.order_status}>
                              {order?.order_status}
                            </option>
                            {order?.order_status === "pending" && (
                              <>
                                <option value="on_hold">On Hold</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancel">Cancel</option>
                              </>
                            )}
                            {order?.order_status === "on_hold" && (
                              <>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancel">Cancel</option>
                              </>
                            )}
                            {order?.order_status === "confirmed" && (
                              <>
                                <option value="processing">Processing</option>
                                <option value="cancel">Cancel</option>
                              </>
                            )}
                            {order?.order_status === "processing" && (
                              <>
                                <option value="shipped">Shipped</option>
                                <option value="cancel">Cancel</option>
                              </>
                            )}
                            {order?.order_status === "shipped" && (
                              <>
                                <option value="delivered">Delivered</option>
                                <option value="return">Return</option>
                              </>
                            )}
                            {order?.order_status === "delivered" && (
                              <>
                                <option value="completed">Completed</option>
                                <option value="return">Return</option>
                              </>
                            )}
                          </select>
                        </td>
                      )}

                    {/* ====== COURIER BUTTONS COLUMN ====== */}
                    <td className="whitespace-nowrap p-4">
                      {buttonloading ? (
                        <MiniSpinner />
                      ) : order?.courier_type === "steadfast" &&
                        order?.steadfast_consignment_id ? (
                        // Steadfast এ আগেই পাঠানো হয়েছে
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                            ✓ SteadFast Sent
                          </span>
                          {order?.steadfast_tracking_code && (
                            <span className="text-xs text-gray-400">
                              {order?.steadfast_tracking_code}
                            </span>
                          )}
                        </div>
                      ) : order?.courier_type === "pathao" &&
                        order?.consignment_id ? (
                        // Pathao তে আগেই পাঠানো হয়েছে
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            ✓ Pathao Sent
                          </span>
                          <span className="text-xs text-gray-400">
                            {order?.consignment_id}
                          </span>
                        </div>
                      ) : (
                        user?.role_id?.order_update === true &&
                        order?.order_status == "pending" && (
                          <div className="flex gap-2 justify-center">
                            <button
                              className="h-[40px] rounded-[8px] py-[10px] px-[14px] bg-blue-500 hover:bg-blue-400 duration-200 text-white text-sm"
                              onClick={() => handleOrderSendPathao(order)}
                            >
                              Send Pathao
                            </button>
                            <button
                              className="h-[40px] rounded-[8px] py-[10px] px-[14px] bg-red-500 hover:bg-red-400 duration-200 text-white text-sm"
                              onClick={() => handleOrderSendSteadFast(order)}
                            >
                              Send SteadFast
                            </button>
                          </div>
                        )
                      )}
                    </td>

                    <td className="whitespace-nowrap p-4">
                      {order?.sub_total_amount}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.discount_amount}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.shipping_cost}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.grand_total_amount}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.shipping_location}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.billing_state}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.billing_city}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {order?.billing_address}
                    </td>

                    <td className="whitespace-nowrap flex justify-center items-center p-4">
                      <Link
                        to={`/all-order-info/${order?._id}`}
                        className="text-gray-500 hover:text-gray-900"
                      >
                        <FaRegEye size={23} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {printModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-auto">
                <PrintableInvoice
                  order={selectedOrder}
                  orderProducts={selectedOrderProducts}
                  settingData={settingData}
                />
                <div className="p-4 flex justify-end">
                  <button
                    onClick={() => setPrintModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

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
      )}

      {viewOrderStatusValueModal && (
        <OrderStatus
          setViewOrderStatusValueModal={setViewOrderStatusValueModal}
          orderStatusValue={orderStatusValue}
        />
      )}
    </>
  );
};

export default OrderTable;
