import { useEffect, useState } from "react";
import Pagination from "../common/pagination/Pagination";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import { MdDeleteForever } from "react-icons/md";
import { FiEdit } from "react-icons/fi";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import Swal from "sweetalert2-optimized";
import UpdateCustomer from "./UpdateCustomer";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
const CustomerTable = ({
  customers,
  setPage,
  setLimit,
  refetch,
  totalData,
  page,
  limit,
  user,
  isLoading,
}) => {
  const [serialNumber, setSerialNumber] = useState();
  const [customerUpdateModal, setCustomerUpdateModal] = useState(false);
  const [customerUpdateModalData, setCustomerUpdateModalData] = useState({});

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  const handleCustomerUpdateModal = (customer) => {
    setCustomerUpdateModalData(customer);
    setCustomerUpdateModal(true);
  };

  //handle Delete Customer Table Row Function
  const handleDeleteCustomer = (customer) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${customer?.user_name} Customer!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: customer?._id,
        };
        try {
          const response = await fetch(
            `
             ${BASE_URL}/user`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(sendData),
            }
          );
          const result = await response.json();

          if (result?.statusCode === 200 && result?.success === true) {
            refetch();
            Swal.fire({
              title: "Deleted!",
              text: `${customer?.user_name} Customer has been deleted!`,
              icon: "success",
            });
          } else {
            toast.error(result?.message, {
              autoClose: 1000,
            });
          }
        } catch (error) {
          toast.error("Network error or server is down", {
            autoClose: 1000,
          });
          console.error(error);
        }
      }
    });
  };

  return (
    <>
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : (
        <div>
          <div className="rounded-lg border border-gray-200 mt-6">
            {customers?.data?.length > 0 ? (
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        SL No
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        User Name
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        User Phone
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Division
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        District
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        User Status
                      </th>
                      {/* B1 (2026-06-04) — guest vs registered visibility. */}
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Type
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Group
                      </th>
                      <th className="whitespace-nowrap p-4 font-medium text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-center">
                    {customers?.data?.map((customer, i) => (
                      <tr
                        key={customer?._id}
                        className={`divide-x divide-gray-200 ${
                          i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4  py-1.5 font-medium text-gray-900">
                          {serialNumber + i + 1}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 font-medium text-gray-900">
                          {customer?.user_name}
                        </td>

                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {customer?.user_phone}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {customer?.user_division}
                        </td>
                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {customer?.user_district}
                        </td>

                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {customer?.user_status === "active" ? (
                            <button
                              className="bg-bgBtnActive text-btnActiveColor px-[10px] py-[4px] rounded-[8px] cursor-default"
                            >
                              <span>Active</span>
                            </button>
                          ) : (
                            <button
                              className="bg-bgBtnInactive text-btnInactiveColor px-[10px] py-[4px] rounded-[8px] cursor-default"
                            >
                              <span>In-Active</span>
                            </button>
                          )}
                        </td>

                        {/* B1 — Type column (guest / registered). */}
                        <td className="whitespace-nowrap px-4 py-1.5">
                          {(() => {
                            const t = customer?.user_type || "registered";
                            const styles =
                              t === "guest"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700";
                            return (
                              <span
                                className={`inline-block px-2 py-0.5 text-xs font-medium rounded capitalize ${styles}`}
                                title={
                                  t === "guest"
                                    ? "Auto-created during anonymous (FB-ads) checkout"
                                    : "Self-registered customer"
                                }
                              >
                                {t}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-1.5">
                          {(() => {
                            const g = customer?.customer_group || "retail";
                            const styles =
                              g === "vip"
                                ? "bg-purple-100 text-purple-700"
                                : g === "wholesale"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-600";
                            return (
                              <span
                                className={`inline-block px-2 py-0.5 text-xs font-medium rounded capitalize ${styles}`}
                              >
                                {g}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="whitespace-nowrap px-4  py-1.5 text-gray-700">
                          {/* user_* rather than customer_*: these buttons call
                              /user, and user_delete / user_update are what the
                              backend actually checks. */}
                          {user?.role_id?.user_delete === true && (
                            <button className="ml-[8px]">
                              <MdDeleteForever
                                className="cursor-pointer text-red-500 hover:text-red-300"
                                size={25}
                                onClick={() => handleDeleteCustomer(customer)}
                              />
                            </button>
                          )}
                          {user?.role_id?.user_update === true && (
                            <button
                              className="ml-[8px]"
                              onClick={() =>
                                handleCustomerUpdateModal(customer)
                              }
                            >
                              <FiEdit
                                size={25}
                                className="cursor-pointer text-gray-500 hover:text-gray-300"
                              />
                            </button>
                          )}
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

          {/* Customer Status Update Modal */}
          {customerUpdateModal && (
            <UpdateCustomer
              refetch={refetch}
              customerUpdateModalData={customerUpdateModalData}
              setCustomerUpdateModal={setCustomerUpdateModal}
            />
          )}
        </div>
      )}
    </>
  );
};

export default CustomerTable;
