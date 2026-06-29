// import { toast } from "react-toastify";
import { MdDeleteForever } from "react-icons/md";
import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import UpdateStaff from "./UpdateStaff";
import Pagination from "./../common/pagination/Pagination";
import TableLoadingSkeleton from "./../common/loadingSkeleton/TableLoadingSkeleton";

const AllStaffTable = ({
  refetch,
  staffData,
  roleData,
  isLoading,
  user,
  isLoadingStaff,
  limit,
  page,
  setPage,
  setLimit,
  totalData,
}) => {
  const [updateModal, setUpdateModal] = useState(false);
  const [updateModalValue, setUpdateModalValue] = useState(false);
  //   console.log(staffData);
  const updateStaffModal = (item) => {
    setUpdateModal(true);
    setUpdateModalValue(item);
  };

  // get token
  // const token = getCookie(authKey);

  // delete a Staff
  // const handleDelete = (item) => {
  //   Swal.fire({
  //     title: "Are you sure?",
  //     text: `You won't be able to revert this ${item?.user_name} user!`,
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#3085d6",
  //     cancelButtonColor: "#d33",
  //     confirmButtonText: "Yes, delete it!",
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       const sendData = {
  //         _id: item?._id,
  //       };
  //       try {
  //         const response = await fetch(
  //           `${BASE_URL}/admin_reg_log`,
  //           {
  //             method: "DELETE",
  //             headers: {
  //               "Content-Type": "application/json",
  //               credentials: "include",
  //             },
  //             body: JSON.stringify(sendData),
  //           }
  //         );
  //         const result = await response.json();
  //         // console.log(result);
  //         if (result?.statusCode === 200 && result?.success === true) {
  //           refetch();
  //           Swal.fire({
  //             title: "Deleted!",
  //             text: `${item?.user_name} staff has been deleted!`,
  //             icon: "success",
  //           });
  //         } else {
  //           toast.error(result?.message, {
  //             autoClose: 1000,
  //           });
  //         }
  //       } catch (error) {
  //         toast.error("Network error or server is down", {
  //           autoClose: 1000,
  //         });
  //         console.log(error);
  //       }
  //     }
  //   });
  // };

  return (
    <>
      {isLoadingStaff ? (
        <TableLoadingSkeleton />
      ) : (
        <div>
          {/* Table for showing data */}
          {staffData?.length > 0 ? (
            <div className="mt-5 overflow-x-auto rounded">
              <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
                {" "}
                <thead className=" bg-[#fff9ee] ">
                  <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                    <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                      User Name
                    </th>

                    <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                      User Phone
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                      User Role
                    </th>
                    <th className="whitespace-nowrap px-4 py-2.5   text-gray-800 ">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-center ">
                  {staffData?.map((item, i) => (
                    <tr
                      key={item?._id}
                      className={`divide-x divide-gray-200 ${
                        i % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-2 font-semibold">
                        {item?.admin_name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2 font-semibold capitalize">
                        {item?.admin_phone ? item?.admin_phone : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-semibold capitalize">
                        {item?.role_id?.role_name
                          ? item?.role_id?.role_name
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-semibold capitalize">
                        {item?.admin_status}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 space-x-1 flex items-center justify-center gap-4">
                        {/* <MdDeleteForever
                          onClick={() => handleDelete(item)}
                          className="cursor-pointer text-red-500 hover:text-red-300"
                          size={25}
                        /> */}
                        {user?.role_id?.user_update === true && (
                          <FiEdit
                            onClick={() => updateStaffModal(item)}
                            className="cursor-pointer text-gray-500 hover:text-gray-300"
                            size={25}
                          />
                        )}
                      </td>
                      {/* <td className="whitespace-nowrap px-4 py-2 space-x-1 flex items-center justify-center gap-4">
                    {user?.role_id?.staff_delete ||
                    user?.role_id?.staff_update ? (
                      <>
                        {user?.role_id?.staff_delete && (
                          <MdDeleteForever
                            onClick={() => handleDelete(item)}
                            className="cursor-pointer text-red-500 hover:text-red-300"
                            size={25}
                          />
                        )}
                        {user?.role_id?.staff_update && (
                          <FiEdit
                            onClick={() => updateStaffModal(item)}
                            className="cursor-pointer text-gray-500 hover:text-gray-300"
                            size={25}
                          />
                        )}
                      </>
                    ) : (
                      <small>Access Denied</small>
                    )}
                  </td> */}
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
              limit={limit}
              page={page}
              setPage={setPage}
              setLimit={setLimit}
              totalData={totalData}
            />
          )}

          {/* Update Sub Category */}
          {updateModal && (
            <UpdateStaff
              setUpdateModal={setUpdateModal}
              updateModalValue={updateModalValue}
              refetch={refetch}
              roleData={roleData}
              isLoading={isLoading}
              user={user}
            />
          )}
        </div>
      )}
    </>
  );
};

export default AllStaffTable;
