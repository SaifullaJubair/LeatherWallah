import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../utils/baseURL";
import CustomerTable from "../../components/Customers/CustomerTable";
import AddCustomer from "../../components/Customers/AddCustomer";

const CustomerPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchValue, setSearchValue] = useState("");
  // B1 (2026-06-04) — Type filter: "" (all) | "guest" | "registered".
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const { user } = useContext(AuthContext);

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

  //Brand Create Modal State
  const [customerCreateModal, setCustomerCreateModal] = useState(false);

  //data fetching of Child Category by Tans Teck Query
  const queryStr = `page=${page}&limit=${limit}&searchTerm=${searchTerm}${
    userTypeFilter ? `&user_type=${userTypeFilter}` : ""
  }`;
  const {
    data: customers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`/api/v1/user?${queryStr}`],
    queryFn: async () => {
      try {
        const res = await fetch(`${BASE_URL}/user?${queryStr}`, {
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.text(); // Get more info about the error
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`
          );
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error; // Rethrow to propagate the error to react-query
      }
    },
  });

  return (
    <>
      {user?.role_id?.customer_show === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">All Customers</h1>
            </div>
            {user?.role_id?.customer_create === true && (
              <div>
                <button
                  className="h-[40px] rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200  text-white text-sm"
                  onClick={() => setCustomerCreateModal(true)}
                >
                  Create Customer
                </button>
              </div>
            )}
          </div>
          {/* search + B1 Type filter chip */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search Customer..."
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
            {/* B1 — guest vs registered filter. "" sends nothing → BE returns all. */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-sm">
              {[
                { v: "", label: "All" },
                { v: "registered", label: "Registered" },
                { v: "guest", label: "Guest" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => {
                    setUserTypeFilter(opt.v);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition ${
                    userTypeFilter === opt.v
                      ? "bg-white text-primaryColor shadow font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {customers?.totalData || 0} customer
              {(customers?.totalData || 0) === 1 ? "" : "s"}
            </span>
          </div>

          {/* Show Customer  table data */}

          <CustomerTable
            customers={customers}
            setPage={setPage}
            setLimit={setLimit}
            setSearchTerm={setSearchTerm}
            refetch={refetch}
            totalData={customers.totalData}
            page={page}
            limit={limit}
            user={user}
            isLoading={isLoading}
          />

          {customerCreateModal && (
            <AddCustomer
              setCustomerCreateModal={setCustomerCreateModal}
              refetch={refetch}
            />
          )}
        </div>
      )}
    </>
  );
};

export default CustomerPage;
