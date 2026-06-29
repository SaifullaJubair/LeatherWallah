import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { FaPrint, FaRegEye } from "react-icons/fa";
import { toast } from "react-toastify";
import Swal from "sweetalert2-optimized";
import OrderStatus from "./OrderStatus";
import { BASE_URL } from "../../utils/baseURL";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import { DateFormate } from "../../utils/DateFormate/DateFormate";
import Pagination from "../common/pagination/Pagination";
import PrintableInvoice from "../common/printableInvoice/PrintableInvoice";
import { SettingContext } from "../../context/SettingProvider";

const SteadfastOrderTable = ({
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
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);

  const { settingData, loading: settingLoading } = useContext(SettingContext);

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  //   handle order status
  const handleOrderStatus = async (order_status, _id, order_products) => {
    try {
      const sendData = {
        _id: _id,
        order_status: order_status,
        order_updated_by: user?._id,
      };
      if (order_status === "processing") {
        const today =
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toLocaleTimeString();
        sendData.processing_time = today;
      }
      if (order_status === "shipped") {
        const today =
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toLocaleTimeString();
        sendData.shipped_time = today;
      }
      if (order_status === "delivered") {
        const today =
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toLocaleTimeString();
        sendData.delivered_time = today;
        sendData.order_products = order_products;
      }
      if (order_status === "cancel") {
        const today =
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toLocaleTimeString();
        sendData.cancel_time = today;
        // sendData.order_products = order_products;
      }
      if (order_status === "return") {
        const today =
          new Date().toISOString().split("T")[0] +
          " " +
          new Date().toLocaleTimeString();
        sendData.return_time = today;
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
          {
            autoClose: 1000,
          }
        );
        refetch();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        refetch();
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      });
      refetch();
    } finally {
      refetch();
    }
  };

  const handlePrintClick = async (order) => {
    try {
      const response = await fetch(`${BASE_URL}/order/${order._id}`, {
        credentials: "include",
      });
      const result = await response.json();

      if (result?.statusCode === 200 && result?.success === true) {
        setSelectedOrder(result?.data?.order);
        setSelectedOrderProducts(result?.data?.order?.order_products);
        setPrintModalOpen(true);
      }
    } catch (error) {
      toast.error("Failed to fetch order details for printing");
    }
  };

  if (loading || settingLoading) {
    return <TableLoadingSkeleton />;
  }

  return (
    <>
      {isLoading || loading ? (
        <TableLoadingSkeleton />
      ) : (
        <div className="">
          {/* Make the table wrapper horizontally scrollable */}
          <div className="mt-5 overflow-x-auto shadow-md">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
              <thead className="bg-[#fff9ee]">
                <tr className="divide-x divide-gray-300  font-semibold text-center text-white">
                  <td className="whitespace-nowrap p-4 ">SL No</td>
                  <td className="whitespace-nowrap p-4 ">Date</td>
                  <td className="whitespace-nowrap p-4 ">Print</td>
                  <td className="whitespace-nowrap p-4 ">CN-ID</td>
                  <td className="whitespace-nowrap p-4 ">Invoice No</td>
                  <td className="whitespace-nowrap p-4 ">Customer Name</td>
                  <td className="whitespace-nowrap p-4 ">Customer Phone</td>
                  {user?.role_id?.order_update === true && (
                    <td className="whitespace-nowrap p-4 ">Order Status</td>
                  )}
                  <td className="whitespace-nowrap p-4 ">Total Amount</td>
                  <td className="whitespace-nowrap p-4 ">Discount Amount</td>
                  <td className="whitespace-nowrap p-4 ">Shipping Cost</td>
                  <td className="whitespace-nowrap p-4 ">Grand Total Amount</td>
                  <td className="whitespace-nowrap p-4 ">Shipping Location</td>
                  <td className="whitespace-nowrap p-4 ">Division</td>
                  <td className="whitespace-nowrap p-4 ">District</td>
                  <td className="whitespace-nowrap p-4 ">Address</td>
                  <td className="whitespace-nowrap p-4 ">View Details</td>
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
                      {" "}
                      {serialNumber + index + 1}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {DateFormate(order?.createdAt)}
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
                    <td className="whitespace-nowrap p-4 font-medium text-green-600">
                      {"#"}
                      {order?.consignment_id || "--"}
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
                      {" "}
                      {order?.customer_id?.user_name}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.customer_phone}
                    </td>
                    {user?.role_id?.order_update === true &&
                      (order?.order_status == "shipped" ||
                        order?.order_status == "delivered") && (
                        <td className="whitespace-nowrap p-1">
                          <select
                            onChange={(e) =>
                              handleOrderStatus(
                                e.target.value,
                                order?._id,
                                order?.order_products
                              )
                            }
                            id="order_status"
                            className="block w-full px-1 py-1 text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer"
                          >
                            <option selected value={order?.order_status}>
                              {order?.order_status}
                            </option>
                            {order?.order_status !== "pending" &&
                              order?.order_status !== "processing" &&
                              order?.order_status !== "shipped" &&
                              order?.order_status !== "delivered" &&
                              order?.order_status !== "cancel" &&
                              order?.order_status !== "return" && (
                                <option value="pending">Pending</option>
                              )}
                            {(order?.order_status == "shipped" ||
                              order?.order_status == "pending") && (
                              <option value="delivered">Delivered</option>
                            )}
                            {order?.order_status !== "cancel" &&
                              order?.order_status !== "return" &&
                              order?.order_status !== "delivered" && (
                                <option value="cancel">Cancel</option>
                              )}
                          </select>
                        </td>
                      )}

                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.sub_total_amount}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.discount_amount}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.shipping_cost}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.grand_total_amount}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.shipping_location}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.billing_division}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.billing_district}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {order?.billing_address}
                    </td>

                    <td className="whitespace-nowrap flex justify-center items-center p-4">
                      <div>
                        <Link
                          to={`/all-order-info/${order?._id}`}
                          className=" text-gray-500 hover:text-gray-900"
                        >
                          <FaRegEye size={23} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* pagination */}
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
    </>
  );
};

export default SteadfastOrderTable;
