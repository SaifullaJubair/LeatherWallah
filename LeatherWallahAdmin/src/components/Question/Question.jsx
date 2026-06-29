import { useEffect, useState } from "react";

import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import Pagination from "../common/pagination/Pagination";
import { FiEdit } from "react-icons/fi";

import QuestionUpdate from "./QuestionUpdate";

const Question = ({
  questionData,
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
  const [openQuestionUpdateModal, setOpenQuestionUpdateModal] = useState(false);
  const [openQuestionUpdateModalData, setOpenQuestionUpdateModalData] =
    useState({});

  useEffect(() => {
    const newSerialNumber = (page - 1) * limit;
    setSerialNumber(newSerialNumber);
  }, [page, limit]);

  const handleQuestionUpdate = (question) => {
    setOpenQuestionUpdateModal(true);
    setOpenQuestionUpdateModalData(question);
  };

  console.log(23, questionData);

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
                  <td className="whitespace-nowrap p-4 ">User Name</td>
                  <td className="whitespace-nowrap p-4 ">User Phone</td>
                  <td className="whitespace-nowrap p-4 ">Question Name</td>
                  <td className="whitespace-nowrap p-4 ">
                    Question Product Name
                  </td>
                  <td className="whitespace-nowrap p-4 ">Question Answer</td>
                  <td className="whitespace-nowrap p-4 ">Question Status</td>
                  {user?.role_id?.question_update === true && (
                    <td className="whitespace-nowrap p-4 ">Action</td>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {questionData?.map((question, index) => (
                  <tr
                    key={question?._id}
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
                      {question?.question_user_id?.user_name}
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {question?.question_user_id?.user_phone || "---"}
                    </td>
                    <td className=" p-4">
                      <div className="overflow-y-auto scrollbar-thin gap-2 px-2">
                        <p className="h-10 w-full">{question?.question_name}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {question?.question_product_id?.product_name || "---"}
                    </td>
                    <td className=" p-4">
                      <div className="overflow-y-auto scrollbar-thin gap-2 px-2">
                        <p className="h-10 w-full">
                          {question?.question_answer || "---"}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-4">
                      {" "}
                      {question?.question_status == "active"
                        ? "Active"
                        : "In-active"}
                    </td>
                    {user?.role_id?.question_update === true && (
                      <td className="whitespace-nowrap p-4">
                        <button
                          className="ml-[8px]"
                          onClick={() => handleQuestionUpdate(question)}
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
          {totalData > 10 && (
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

      {openQuestionUpdateModal && (
        <QuestionUpdate
          setOpenQuestionUpdateModal={setOpenQuestionUpdateModal}
          refetch={refetch}
          openQuestionUpdateModalData={openQuestionUpdateModalData}
        />
      )}
    </>
  );
};

export default Question;
