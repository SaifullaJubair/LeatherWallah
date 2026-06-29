import { useQuery } from "@tanstack/react-query";
import Question from "../../components/Question/Question";
import { BASE_URL } from "../../utils/baseURL";
import { useContext, useEffect, useState } from "react";
import useDebounced from "../../hooks/useDebounced";
import { AuthContext } from "../../context/AuthProvider";

const QuestionPage = () => {
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
    data: questionData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/question/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/question/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
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
      {user?.role_id?.question_show === true && (
        <div className="bg-white rounded py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">All Question List </h1>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search Supplier..."
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
          {/* show All Question Table List Component*/}
          <Question
            questionData={questionData?.data}
            refetch={refetch}
            limit={limit}
            page={page}
            setPage={setPage}
            setLimit={setLimit}
            isLoading={isLoading}
            totalData={questionData?.totalData}
            user={user}
          />
        </div>
      )}
    </>
  );
};

export default QuestionPage;
