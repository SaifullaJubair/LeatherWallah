import { useContext, useEffect, useState } from "react";
import AllStaffTable from "../../../components/AllStaff/AllStaffTable";
import AddAllStaff from "../../../components/AllStaff/AddAllStaff";

import { BASE_URL } from "../../../utils/baseURL";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../../context/AuthProvider";
import useGetRole from "../../../hooks/useGetRole";
import useDebounced from "../../../hooks/useDebounced";

const AllStaffPage = () => {
  //Add staff modal open state
  const [openAddStaffModal, setOpenAddStaffModal] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const { user } = useContext(AuthContext);
  const {
    data: staffData,
    isLoading: isLoadingStaff,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/admin_reg_log/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/admin_reg_log/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      return data;
    },
  });
  console.log(staffData);
  // Role data fetch
  const { data: roleData, isLoading } = useGetRole();

  // handle item search function....
  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => {
    setSearchTerm(searchText);
  }, [searchText]);

  // handle item search function....
  const handleSearchValue = (value) => {
    setSearchValue(value);
    setLimit(10);
    setPage(1);
  };

  console.log(1, staffData);
  return (
    <>
      {user?.role_id?.user_show === true && (
        <div className="bg-white rounded py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">All Staff List </h1>
            </div>
            <div>
              {user?.role_id?.user_create === true && (
                <div>
                  <button
                    className="w-[138px] h-[40px] rounded-[8px] py-[10px] px-[14px] bg-primaryColor  text-white text-sm"
                    onClick={() => setOpenAddStaffModal(true)}
                  >
                    Add Staff
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search Category..."
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
          {/* show All Staff Table List Component*/}
          <AllStaffTable
            staffData={staffData?.data}
            totalData={staffData?.totalData}
            refetch={refetch}
            limit={limit}
            page={page}
            setPage={setPage}
            setLimit={setLimit}
            roleData={roleData}
            isLoading={isLoading}
            user={user}
            isLoadingStaff={isLoadingStaff}
          />

          {/* add all Staff modal component */}
          {openAddStaffModal && (
            <AddAllStaff
              setOpenAddStaffModal={setOpenAddStaffModal}
              roleData={roleData}
              refetch={refetch}
              isLoading={isLoading}
              user={user}
            />
          )}
        </div>
      )}
    </>
  );
};

export default AllStaffPage;
