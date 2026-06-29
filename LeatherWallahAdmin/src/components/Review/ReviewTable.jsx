import { BiShow } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";
import Pagination from "./../common/pagination/Pagination";
import { useEffect, useState } from "react";
import ReviewDescription from "./ReviewDescription";
import { FiEdit } from "react-icons/fi";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import ReviewUpdate from "./ReviewUpdate";

const ReviewTable = ({
  reviewsData,
  limit,
  page,
  setPage,
  setLimit,
  isLoading,
  totalData,
  refetch,
  user,
}) => {
  const [serialNumber, setSerialNumber] = useState();
  //review DesCription State
  const [desCription, setDesCription] = useState(false);
  const [desCriptionDATA, setDesCriptionDATA] = useState({});
  const [openQuestionAnsModal, setOpenQuestionAnsModal] = useState(false);
  const [openQuestionAnsModalData, setOpenQuestionAnsModalData] = useState({});

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  const handleReviewAns = (reviews) => {
    setOpenQuestionAnsModal(true);
    setOpenQuestionAnsModalData(reviews);
  };
  const handleDescription = (data) => {
    setDesCription(true);
    setDesCriptionDATA(data);
  };
  return (
    <>
      {isLoading ? (
        <TableLoadingSkeleton />
      ) : (
        <div className="">
          {/* Make the table wrapper horizontally scrollable */}
          <div className="mt-5 overflow-x-auto rounded ">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm border rounded">
              <thead className="bg-[#fff9ee]">
                <tr className="divide-x divide-gray-300  font-semibold text-center text-gray-900">
                  <td className="whitespace-nowrap p-4 ">SL No</td>
                  <td className="whitespace-nowrap p-4 ">Reviewer Name</td>
                  <td className="whitespace-nowrap p-4 ">Reviewer Phone</td>
                  <td className="whitespace-nowrap p-4 ">Reviewer Product</td>
                  <td className="whitespace-nowrap p-4 ">Review Ratting</td>
                  <td className="whitespace-nowrap p-4 ">Reviewer Question</td>
                  <td className="whitespace-nowrap p-4 ">Review Answer</td>
                  <td className="whitespace-nowrap p-4 ">Review Status</td>
                  {user?.role_id?.review_update === true && (
                    <td className="whitespace-nowrap p-4 ">Action</td>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {reviewsData?.map((reviews, index) => (
                  <tr
                    key={reviews?._id}
                    className={`divide-x divide-gray-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-tableRowBGColor"
                    }`}
                  >
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {serialNumber + index + 1}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {reviews?.review_user_id?.user_name}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {reviews?.review_user_id?.user_phone}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {reviews?.review_product_id?.product_name}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {reviews?.review_ratting}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 ">
                      <button onClick={() => handleDescription(reviews)}>
                        <BiShow size={22} />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="overflow-y-auto scrollbar-thin px-2">
                        <p className="h-10 w-full">
                          {reviews?.review_answer || "No Review"}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {reviews?.review_status == "active"
                        ? "Active"
                        : "In-active"}
                    </td>
                    {user?.role_id?.review_update === true && (
                      <td className="whitespace-nowrap p-4">
                        <button
                          className="ml-[8px]"
                          onClick={() => handleReviewAns(reviews)}
                        >
                          <FiEdit
                            size={25}
                            className="cursor-pointer text-gray-500 hover:text-gray-300"
                          />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* pagination */}
          {totalData > 2 && (
            <Pagination
              page={page}
              setPage={setPage}
              limit={limit}
              setLimit={setLimit}
              totalData={totalData}
            />
          )}
        </div>
      )}
      {desCription && (
        <ReviewDescription
          desCriptionDATA={desCriptionDATA}
          setDesCription={setDesCription}
        />
      )}
      {openQuestionAnsModal && (
        <ReviewUpdate
          setOpenQuestionAnsModal={setOpenQuestionAnsModal}
          openQuestionAnsModalData={openQuestionAnsModalData}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default ReviewTable;
