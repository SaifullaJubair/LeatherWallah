import { useEffect, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";
import UpdateFlashSale from "./UpdateFlashSale";
import { BASE_URL } from "../../utils/baseURL";
import Pagination from "../common/pagination/Pagination";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const isLive = (fs) => {
  if (fs?.status !== "active") return false;
  const now = Date.now();
  const s = new Date(fs?.start_at).getTime();
  const e = new Date(fs?.end_at).getTime();
  return now >= s && now <= e;
};

const FlashSaleTable = ({
  flashSales,
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

  const [updateModal, setUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({});
  const openUpdate = (fs) => {
    setUpdateData(fs);
    setUpdateModal(true);
  };

  const handleDelete = (fs) => {
    Swal.fire({
      title: "Delete this flash sale?",
      text: `"${fs?.title}" will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        const res = await fetch(`${BASE_URL}/flash-sale/${fs._id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const result = await res.json();
        if (result?.statusCode === 200 && result?.success === true) {
          refetch();
          Swal.fire({
            title: "Deleted!",
            text: `${fs?.title} has been removed.`,
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
            {flashSales?.data?.length > 0 ? (
              <div className="overflow-x-auto rounded-t-lg">
                <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                  <thead className="ltr:text-left rtl:text-right bg-[#fff9ee]">
                    <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                      <th className="whitespace-nowrap p-4 font-medium">SL</th>
                      <th className="whitespace-nowrap p-4 font-medium">Title</th>
                      <th className="whitespace-nowrap p-4 font-medium">Window</th>
                      <th className="whitespace-nowrap p-4 font-medium">Products</th>
                      <th className="whitespace-nowrap p-4 font-medium">Status</th>
                      <th className="whitespace-nowrap p-4 font-medium">Live now</th>
                      <th className="whitespace-nowrap p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-center">
                    {flashSales.data.map((fs, idx) => (
                      <tr
                        key={fs._id}
                        className="divide-x divide-gray-200 hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap p-4 text-gray-700">
                          {serialNumber + idx + 1}
                        </td>
                        <td className="whitespace-nowrap p-4 font-medium text-gray-800">
                          {fs.title}
                        </td>
                        <td className="whitespace-nowrap p-4 text-gray-600 text-xs">
                          <div>{fmt(fs.start_at)}</div>
                          <div className="text-gray-400">→ {fmt(fs.end_at)}</div>
                        </td>
                        <td className="whitespace-nowrap p-4 text-gray-700">
                          {Array.isArray(fs.products) ? fs.products.length : 0}
                        </td>
                        <td className="whitespace-nowrap p-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                              fs.status === "active"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {fs.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-4">
                          {isLive(fs) ? (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
                              ● Live
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap p-4">
                          <div className="flex items-center justify-center gap-3">
                            {user?.role_id?.offer_update === true && (
                              <button
                                onClick={() => openUpdate(fs)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <FiEdit size={18} />
                              </button>
                            )}
                            {user?.role_id?.offer_delete === true && (
                              <button
                                onClick={() => handleDelete(fs)}
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

      {updateModal && (
        <UpdateFlashSale
          setFlashSaleUpdateModal={setUpdateModal}
          flashSaleUpdateData={updateData}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default FlashSaleTable;
