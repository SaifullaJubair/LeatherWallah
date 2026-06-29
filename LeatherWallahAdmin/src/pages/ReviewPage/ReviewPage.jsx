import { useContext, useEffect, useState } from "react";
import ReviewTable from "../../components/Review/ReviewTable";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../utils/baseURL";

const ReviewPage = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchValue, setSearchValue] = useState("");
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

  const {
    data: reviewsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/review/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/review/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      return data;
    },
  });

  return (
    <>
      {user?.role_id?.review_show === true && (
        <div className="bg-white rounded py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Reviews</h1>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search Reviews..."
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
          {/* show All Question Table List Component*/}
          <ReviewTable
            reviewsData={reviewsData?.data}
            refetch={refetch}
            limit={limit}
            page={page}
            setPage={setPage}
            setLimit={setLimit}
            isLoading={isLoading}
            totalData={reviewsData?.totalData}
            user={user}
          />
        </div>
      )}
    </>
  );
};

export default ReviewPage;
