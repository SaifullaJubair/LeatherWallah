import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import TableLoadingSkeleton from "../../components/common/loadingSkeleton/TableLoadingSkeleton";
import Pagination from "../../components/common/pagination/Pagination";
import ReviewDescription from "../../components/Review/ReviewDescription";
import { BiShow } from "react-icons/bi";
import { MdCheckCircle, MdCancel } from "react-icons/md";

// C13 HIGH 7 — Pending Reviews moderation queue.
// Filters existing /review/dashboard endpoint by status=pending.
// Approve = PATCH review_status:"active", Reject = PATCH review_status:"in-active".

const PendingReviewsPage = () => {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [descModal, setDescModal] = useState(false);
  const [descData, setDescData] = useState({});
  const { user } = useContext(AuthContext);

  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => {
    setSearchTerm(searchText);
  }, [searchText]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      `/api/v1/review/dashboard?status=pending&page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/review/dashboard?status=pending&page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
        { credentials: "include" }
      );
      return res.json();
    },
  });

  const handleAction = async (review, newStatus) => {
    setActionLoading(review._id);
    try {
      const res = await fetch(`${BASE_URL}/review`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: review._id, review_status: newStatus }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success) {
        toast.success(
          newStatus === "active" ? "Review approved" : "Review rejected"
        );
        refetch();
      } else {
        toast.error(result?.message || "Action failed");
      }
    } catch (err) {
      toast.error(err?.message || "Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const serialOffset = (page - 1) * limit;

  return (
    <>
      {user?.role_id?.review_show === true && (
        <div className="bg-white rounded py-6 px-4 shadow">
          <div className="flex items-center justify-between mt-2 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Pending Reviews
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Reviews awaiting approval — approve to publish, reject to hide.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              {data?.totalData ?? 0} pending
            </span>
          </div>

          <div className="flex justify-end mb-3">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setPage(1);
              }}
              placeholder="Search pending reviews..."
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {isLoading ? (
            <TableLoadingSkeleton />
          ) : (
            <div className="overflow-x-auto rounded">
              <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
                <thead className="bg-[#fff9ee]">
                  <tr className="divide-x divide-gray-300 font-semibold text-center text-gray-900">
                    <td className="whitespace-nowrap p-4">SL</td>
                    <td className="whitespace-nowrap p-4">Reviewer</td>
                    <td className="whitespace-nowrap p-4">Phone</td>
                    <td className="whitespace-nowrap p-4">Product</td>
                    <td className="whitespace-nowrap p-4">Rating</td>
                    <td className="whitespace-nowrap p-4">Review</td>
                    {user?.role_id?.review_update === true && (
                      <td className="whitespace-nowrap p-4">Actions</td>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-center">
                  {data?.data?.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-gray-400 text-center"
                      >
                        No pending reviews
                      </td>
                    </tr>
                  )}
                  {data?.data?.map((review, index) => (
                    <tr
                      key={review._id}
                      className={`divide-x divide-gray-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                      }`}
                    >
                      <td className="whitespace-nowrap p-4">
                        {serialOffset + index + 1}
                      </td>
                      <td className="whitespace-nowrap p-4">
                        {review?.review_user_id?.user_name}
                      </td>
                      <td className="whitespace-nowrap p-4">
                        {review?.review_user_id?.user_phone}
                      </td>
                      <td className="whitespace-nowrap p-4 max-w-[180px] truncate">
                        {review?.review_product_id?.product_name}
                      </td>
                      <td className="whitespace-nowrap p-4">
                        {"★".repeat(review?.review_ratting || 0)}
                        {"☆".repeat(5 - (review?.review_ratting || 0))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <button
                          onClick={() => {
                            setDescData(review);
                            setDescModal(true);
                          }}
                        >
                          <BiShow size={22} />
                        </button>
                      </td>
                      {user?.role_id?.review_update === true && (
                        <td className="whitespace-nowrap p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAction(review, "active")}
                              disabled={actionLoading === review._id}
                              title="Approve"
                              className="text-green-600 hover:text-green-800 disabled:opacity-40"
                            >
                              <MdCheckCircle size={26} />
                            </button>
                            <button
                              onClick={() => handleAction(review, "in-active")}
                              disabled={actionLoading === review._id}
                              title="Reject"
                              className="text-red-500 hover:text-red-700 disabled:opacity-40"
                            >
                              <MdCancel size={26} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(data?.totalData ?? 0) > 2 && (
            <Pagination
              page={page}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              totalData={data?.totalData}
            />
          )}
        </div>
      )}

      {descModal && (
        <ReviewDescription
          desCriptionDATA={descData}
          setDesCription={setDescModal}
        />
      )}
    </>
  );
};

export default PendingReviewsPage;
