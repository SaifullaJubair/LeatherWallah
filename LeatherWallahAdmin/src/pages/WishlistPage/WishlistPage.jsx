import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { BASE_URL } from "../../utils/baseURL";
import WishlistTable from "../../components/Wishlist/WishlistTable";

const WishlistPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const { user } = useContext(AuthContext);

  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => setSearchTerm(searchText), [searchText]);

  const handleSearchValue = (v) => {
    setSearchValue(v);
    setLimit(20);
    setPage(1);
  };

  const {
    data: wishlist = [],
    isLoading,
  } = useQuery({
    queryKey: [
      `/api/v1/wishlist/admin?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/wishlist/admin?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
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
      {user?.role_id?.user_show === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Customer Wishlists</h1>
              <p className="text-xs text-gray-400 mt-1">
                Read-only view of every customer's saved-for-later items. Useful
                for spotting unfulfilled demand + restock targets.
              </p>
            </div>
          </div>

          <div className="mt-3">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search by user name or phone…"
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          <WishlistTable
            wishlist={wishlist}
            setPage={setPage}
            setLimit={setLimit}
            totalData={wishlist?.totalData}
            page={page}
            limit={limit}
            isLoading={isLoading}
          />
        </div>
      )}
    </>
  );
};

export default WishlistPage;
