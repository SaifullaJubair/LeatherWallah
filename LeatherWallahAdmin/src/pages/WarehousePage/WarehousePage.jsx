import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { BASE_URL } from "../../utils/baseURL";
import WarehouseTable from "../../components/Warehouse/WarehouseTable";
import AddWarehouse from "../../components/Warehouse/AddWarehouse";

const WarehousePage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const { user } = useContext(AuthContext);

  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => setSearchTerm(searchText), [searchText]);

  const handleSearchValue = (v) => {
    setSearchValue(v);
    setLimit(10);
    setPage(1);
  };

  const [warehouseCreateModal, setWarehouseCreateModal] = useState(false);

  const {
    data: warehouses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/warehouse?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/warehouse?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error: ${res.status} ${res.statusText} - ${t}`);
      }
      return res.json();
    },
  });

  return (
    <>
      {user?.role_id?.site_setting_update === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Warehouses</h1>
              <p className="text-xs text-gray-400 mt-1">
                Manage stocking locations. The default warehouse is used when a product
                has no explicit warehouse assignment.
              </p>
            </div>

            {user?.role_id?.site_setting_update === true && (
              <div>
                <button
                  className="h-[40px] rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200 text-white text-sm"
                  onClick={() => setWarehouseCreateModal(true)}
                >
                  Create Warehouse
                </button>
              </div>
            )}
          </div>

          <div className="mt-3">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search by name, code, city, status…"
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          {warehouseCreateModal && (
            <AddWarehouse
              setWarehouseCreateModal={setWarehouseCreateModal}
              refetch={refetch}
            />
          )}

          <WarehouseTable
            warehouses={warehouses}
            setPage={setPage}
            setLimit={setLimit}
            refetch={refetch}
            totalData={warehouses?.totalData}
            page={page}
            limit={limit}
            user={user}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
};

export default WarehousePage;
