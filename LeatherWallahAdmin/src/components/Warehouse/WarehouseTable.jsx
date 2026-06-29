import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";
import UpdateWarehouse from "./UpdateWarehouse";
import { BASE_URL } from "../../utils/baseURL";
import Pagination from "../common/pagination/Pagination";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";

const WarehouseTable = ({
  warehouses,
  setPage,
  setLimit,
  refetch,
  totalData,
  page,
  limit,
  user,
  isLoading,
}) => {
  const [serialNumber, setSerialNumber] = useState(0);
  useEffect(() => {
    setSerialNumber((page - 1) * limit);
  }, [page, limit]);

  const [warehouseUpdateModal, setWarehouseUpdateModal] = useState(false);
  const [warehouseUpdateData, setWarehouseUpdateData] = useState({});
  const openUpdate = (w) => {
    setWarehouseUpdateData(w);
    setWarehouseUpdateModal(true);
  };

  const handleDelete = (w) => {
    Swal.fire({
      title: "Delete this warehouse?",
      text: `"${w?.name}" will be removed permanently.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        const r = await fetch(`${BASE_URL}/warehouse/${w._id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const result = await r.json();
        if (result?.statusCode === 200 && result?.success === true) {
          refetch();
          Swal.fire({
            title: "Deleted!",
            text: `${w?.name} has been removed.`,
            icon: "success",
          });
        } else {
          toast.error(result?.message || "Delete failed", { autoClose: 1500 });
        }
      } catch (e) {
        toast.error(e?.message || "Network error", { autoClose: 1500 });
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
            {warehouses?.data?.length > 0 ? (
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                      <th className="whitespace-nowrap p-4 font-medium">SL</th>
                      <th className="whitespace-nowrap p-4 font-medium">Name</th>
                      <th className="whitespace-nowrap p-4 font-medium">Code</th>
                      <th className="whitespace-nowrap p-4 font-medium">City</th>
                      <th className="whitespace-nowrap p-4 font-medium">Default</th>
                      <th className="whitespace-nowrap p-4 font-medium">Status</th>
                      <th className="whitespace-nowrap p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-center">
                    {warehouses.data.map((w, idx) => (
                      <tr
                        key={w._id}
                        className="divide-x divide-gray-200 hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap p-4 text-gray-700">
                          {serialNumber + idx + 1}
                        </td>
                        <td className="whitespace-nowrap p-4 font-medium text-gray-800">
                          {w.name}
                        </td>
                        <td className="whitespace-nowrap p-4 text-gray-600">
                          {w.code || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="whitespace-nowrap p-4 text-gray-600">
                          {w.city || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="whitespace-nowrap p-4">
                          {w.is_default ? (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
                              Default
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                              w.status === "active"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-4">
                          <div className="flex items-center justify-center gap-3">
                            {user?.role_id?.site_setting_update === true && (
                              <button
                                onClick={() => openUpdate(w)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <FiEdit size={18} />
                              </button>
                            )}
                            {user?.role_id?.site_setting_update === true && (
                              <button
                                onClick={() => handleDelete(w)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <MdDeleteForever size={20} />
                              </button>
                            )}
                          </div>
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

          <Pagination
            setPage={setPage}
            setLimit={setLimit}
            totalData={totalData}
            page={page}
            limit={limit}
          />
        </div>
      )}

      {warehouseUpdateModal && (
        <UpdateWarehouse
          setWarehouseUpdateModal={setWarehouseUpdateModal}
          warehouseUpdateData={warehouseUpdateData}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default WarehouseTable;
