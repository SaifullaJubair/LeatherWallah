import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { BASE_URL } from "../../utils/baseURL";
import FlashSaleTable from "../../components/FlashSale/FlashSaleTable";
import AddFlashSale from "../../components/FlashSale/AddFlashSale";

const FlashSalePage = () => {
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

  const [createModal, setCreateModal] = useState(false);

  const {
    data: flashSales = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/flash-sale?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/flash-sale?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Error: ${res.status} ${res.statusText} - ${t}`);
      }
      return res.json();
    },
  });

  // Flash sale routes gate writes on offer_create/_update/_delete; reads are
  // public. Surface the list to anyone with offer_show OR the create flag
  // (so a viewer-only role can still see it without being able to mutate).
  const canSee =
    user?.role_id?.offer_show === true ||
    user?.role_id?.offer_create === true ||
    user?.role_id?.offer_update === true;

  return (
    <>
      {canSee && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Flash Sales</h1>
              <p className="text-xs text-gray-400 mt-1">
                Time-boxed price drops. While active and inside the window, the storefront
                price resolver uses the flash price first.
              </p>
            </div>

            {user?.role_id?.offer_create === true && (
              <div>
                <button
                  className="h-[40px] rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200 text-white text-sm"
                  onClick={() => setCreateModal(true)}
                >
                  Create Flash Sale
                </button>
              </div>
            )}
          </div>

          <div className="mt-3">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search by title, description, status…"
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          {createModal && (
            <AddFlashSale
              setFlashSaleCreateModal={setCreateModal}
              refetch={refetch}
            />
          )}

          <FlashSaleTable
            flashSales={flashSales}
            setPage={setPage}
            setLimit={setLimit}
            refetch={refetch}
            totalData={flashSales?.totalData}
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

export default FlashSalePage;
