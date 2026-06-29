import { Link } from "react-router-dom";
import OfferTable from "../../../components/Offers/OfferTable";
import { useState } from "react";
import { useContext } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../../context/AuthProvider";
import useDebounced from "../../../hooks/useDebounced";
import { BASE_URL } from "../../../utils/baseURL";

const OfferTablePage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const { user } = useContext(AuthContext);

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

  // Fetch Single Offer  data
  const {
    data: offerTypes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/offer/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/offer/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`
          );
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
  });

  return (
    <>
      {user?.role_id?.offer_show === true && (
        <div>
          <div>
            <div className="flex justify-between mt-6">
              <div>
                <h1 className="text-2xl">Your Offers</h1>
              </div>
            </div>
            {user?.role_id?.offer_create === true && (
              <div className="flex justify-end">
                <Link to="/add-offer">
                  <button className="rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200 text-white text-smm">
                    Add Offer
                  </button>
                </Link>
              </div>
            )}

            {/* search Offer... */}
            <div className="mt-3">
              <input
                type="text"
                defaultValue={searchTerm}
                onChange={(e) => handleSearchValue(e.target.value)}
                placeholder="Search Offer Product..."
                className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              />
            </div>
            {/* show Offer table */}
            <OfferTable
              offerTypes={offerTypes}
              setLimit={setLimit}
              setPage={setPage}
              page={page}
              limit={limit}
              totalData={offerTypes?.totalData}
              refetch={refetch}
              user={user}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default OfferTablePage;
