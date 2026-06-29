// import { toast } from "react-toastify";
import { MdDeleteForever } from "react-icons/md";
import { useEffect, useState } from "react";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";

import Pagination from "../common/pagination/Pagination";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import { BASE_URL } from "../../utils/baseURL";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import UpdateSupplier from "./UpdateSupplier";
import { FiEdit } from "react-icons/fi";
const SupplierTable = ({
  refetch,
  supplierData,
  isLoading,
  user,
  page,
  limit,
  setPage,
  setLimit,
  totalData,
}) => {
  const [serialNumber, setSerialNumber] = useState();
  const [updateModal, setUpdateModal] = useState(false);
  const [updateModalValue, setUpdateModalValue] = useState(false);
  //   console.log(supplierData);
  const updateStaffModal = (item) => {
    setUpdateModal(true);
    setUpdateModalValue(item);
  };

  //page serial number
  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  // delete a Staff
  const handleDelete = (item) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to revert this ${item?.supplier_name} supplier!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const sendData = {
          _id: item?._id,
        };
        try {
          const response = await fetch(
            `${BASE_URL}/supplier`,
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
          // console.log(result);
          if (result?.statusCode === 200 && result?.success === true) {
            refetch();
            Swal.fire({
              title: "Deleted!",
              text: `${item?.supplier_name} supplier has been deleted!`,
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
          console.log(error);
        }
      }
    });
  };

  return (
    <div>
      {/* Table for showing data */}
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : supplierData?.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded">
          <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
            {" "}
            <thead className=" bg-[#fff9ee] ">
              <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                  SL
                </th>
                <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                  Supplier Name
                </th>

                <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                  Supplier Phone
                </th>
                <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                  Address
                </th>
                <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                  Status
                </th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center ">
              {supplierData?.map((item, i) => (
                <tr
                  key={item?._id}
                  className={`divide-x divide-gray-200 ${
                    i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-1.5 font-medium text-gray-900">
                    {serialNumber + i + 1}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-semibold">
                    {item?.supplier_name}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2 font-semibold capitalize">
                    {item?.supplier_phone ? item?.supplier_phone : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-semibold capitalize">
                    {item?.supplier_address ? item?.supplier_address : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-semibold capitalize">
                    {item?.supplier_status}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 space-x-1 flex items-center justify-center gap-4">
                    <MdDeleteForever
                      onClick={() => handleDelete(item)}
                      className="cursor-pointer text-red-500 hover:text-red-300"
                      size={25}
                    />
                    <FiEdit
                      onClick={() => updateStaffModal(item)}
                      className="cursor-pointer text-gray-500 hover:text-gray-300"
                      size={25}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <NoDataFound />
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

      {/* Update Sub Category */}
      {updateModal && (
        <UpdateSupplier
          setUpdateModal={setUpdateModal}
          updateModalValue={updateModalValue}
          refetch={refetch}
          user={user}
        />
      )}
    </div>
  );
};

export default SupplierTable;
