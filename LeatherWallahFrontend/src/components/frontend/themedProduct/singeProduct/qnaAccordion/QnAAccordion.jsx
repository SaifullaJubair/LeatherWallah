"use client";
import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";
import useGetQuestion from "@/components/lib/getProductQuestion";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import Spinner from "@/components/shared/loader/Spinner";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/components/utils/baseURL";
import { EnglishDateWithTimeShort } from "@/components/utils/EnglishDateWithTimeShort";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import Link from "next/link";
import { useState } from "react";
import { set } from "react-hook-form";
import { BsReply } from "react-icons/bs";
import {
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaRegStar,
  FaStar,
} from "react-icons/fa";
import { RiQuestionAnswerLine, RiQuestionnaireLine } from "react-icons/ri";
import { toast } from "react-toastify";

const QnAAccordion = ({ product }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const { data: userInfo, isLoading: userGetLoading } = useUserInfoQuery();
  const {
    data: questionData,
    isLoading: questionLoading,
    refetch,
  } = useGetQuestion(product?._id, limit, page);

  const [qnaOpen, setQnaOpen] = useState(true);
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const handleDataPost = async () => {
    setLoading(true);
    try {
      const sendData = {
        question_name: questionText,
        question_product_id: product?._id,
        question_user_id: userInfo?.data?._id,
        question_status: "active",
        question_product_publisher_id: product?.panel_owner_id,
      };

      const response = await fetch(`${BASE_URL}/question`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : "Child Category created successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setQuestionText("");
        setLoading(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message, {
        autoClose: 1000,
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // console.log(questionData);
  return (
    <div className="my-4">
      <div className="border  ">
        <div
          className="bg-primary/10 px-3 flex items-center justify-between py-2 cursor-pointer "
          onClick={() => setQnaOpen(!qnaOpen)}
        >
          <p className="flex items-center text-gray-700">
            <span className="text-[20px] mr-2">
              <RiQuestionAnswerLine className="text-[18px] text-primary" />
            </span>{" "}
            Questions & Answers ({questionData?.totalData || 0})
          </p>

          {qnaOpen ? (
            <FaChevronUp className="text-[20px] font-light  text-gray-600" />
          ) : (
            <FaChevronDown className="text-[20px] font-light  text-gray-600" />
          )}
        </div>
        <div
          className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
            qnaOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-6">
              <p className="  text-gray-800  font-semibold">
                Questions about this product
              </p>
              {!userGetLoading && userInfo?.data?._id ? (
                <div className="my-2 relative">
                  <textarea
                    name="question"
                    id="question"
                    placeholder="Ask a question"
                    value={questionText}
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        setQuestionText(e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Prevent default enter behavior
                        handleDataPost(); // Submit question
                      }
                    }}
                    className="border-primary-300 outline-primary-600  border w-full px-2 py-2 "
                    rows="3"
                    maxLength="300"
                  />
                  <div className="flex items-center justify-between">
                    {loading ? (
                      <div className="bg-primary text-white px-4 py-2 inline-block">
                        <MiniSpinner />
                      </div>
                    ) : (
                      <button
                        className="bg-primary text-white px-3 py-2 mt-2"
                        onClick={handleDataPost}
                      >
                        Submit
                      </button>
                    )}
                    <div className=" text-sm text-gray-600 absolute bottom-[60px] right-2">
                      {/* {300 - questionText.length} characters left */}
                      {questionText?.length}/300
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center mt-1 gap-2">
                  <span>For asking a question you have to</span>
                  <Link
                    href="/sign-in"
                    className="flex items-center gap-2 underline-offset-4 hover:underline text-blue-500 hover:text-primary"
                  >
                    <FaLock />
                    Login
                  </Link>
                  <span>first.</span>
                </div>
              )}

              {/* my question */}
              {!questionLoading && (
                <>
                  {questionData?.data?.filter(
                    (q) => q?.question_user_id?._id === userInfo?.data?._id
                  )?.length > 0 && (
                    <div className="mt-4">
                      <p className="border-b pl-1 py-2 ">
                        {" "}
                        My Questions (
                        {
                          questionData?.data?.filter(
                            (q) =>
                              q?.question_user_id?._id === userInfo?.data?._id
                          )?.length
                        }
                        )
                      </p>
                      {questionData?.data
                        ?.filter(
                          (q) =>
                            q?.question_user_id?._id === userInfo?.data?._id
                        )
                        ?.map((question) => (
                          <div
                            className=" space-y-2  p-3 border-b"
                            key={question?._id}
                          >
                            <div className="flex items-center gap-4">
                              <RiQuestionnaireLine size={24} />
                              <div>
                                <p className=" font-medium text-gray-700">
                                  {question?.question_name}
                                </p>
                                <p className=" flex items-center gap-3 mt-px text-sm text-gray-500">
                                  <span>
                                    {question?.question_user_id?.user_name}
                                  </span>{" "}
                                  <span>
                                    {" "}
                                    {EnglishDateWithTimeShort(
                                      question?.createdAt
                                    )}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <BsReply size={24} />
                              {question?.question_answer ? (
                                <div className="  text-gray-700">
                                  <p className="font-medium text-gray-700">
                                    {question?.question_answer}
                                  </p>
                                  <p className=" flex items-center gap-3 mt-px text-sm text-gray-500">
                                    <span>Admin</span>{" "}
                                    <span>
                                      {" "}
                                      {EnglishDateWithTimeShort(
                                        question?.updatedAt
                                      )}
                                    </span>
                                  </p>
                                </div>
                              ) : (
                                <span className=" text-sm text-gray-500">
                                  No answer yet
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="mt-4">
                    {questionData?.data?.filter(
                      (q) => q?.question_user_id?._id !== userInfo?.data?._id
                    )?.length > 0 && (
                      <p className="border-b pl-1 py-2 ">
                        {" "}
                        Other Questions & Answers (
                        {
                          questionData?.data?.filter(
                            (q) =>
                              q?.question_user_id?._id !== userInfo?.data?._id
                          )?.length
                        }
                        )
                      </p>
                    )}

                    {questionData?.data
                      ?.filter(
                        (q) => q?.question_user_id?._id !== userInfo?.data?._id
                      )
                      ?.map((question) => (
                        <div
                          className=" space-y-2  p-3 border-b"
                          key={question?._id}
                        >
                          <div className="flex items-center gap-4">
                            <RiQuestionnaireLine size={24} />
                            <div>
                              <p className=" font-medium text-gray-700">
                                {question?.question_name}
                              </p>
                              <p className=" flex items-center gap-3 mt-px text-sm text-gray-500">
                                <span>
                                  {question?.question_user_id?.user_name}
                                </span>{" "}
                                <span>
                                  {" "}
                                  {EnglishDateWithTimeShort(
                                    question?.createdAt
                                  )}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <BsReply size={24} />
                            {question?.question_answer ? (
                              <div className="  text-gray-700">
                                <p className="font-medium text-gray-700">
                                  {question?.question_answer}
                                </p>
                                <p className=" flex items-center gap-3 mt-px text-sm text-gray-500">
                                  <span>Admin</span>{" "}
                                  <span>
                                    {" "}
                                    {EnglishDateWithTimeShort(
                                      question?.updatedAt
                                    )}
                                  </span>
                                </p>
                              </div>
                            ) : (
                              <span className=" text-sm text-gray-500">
                                No answer yet
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  <PaginationWithPageBtn
                    page={page}
                    setPage={setPage}
                    rows={limit}
                    setRows={setLimit}
                    totalData={Math.abs(
                      questionData?.totalData -
                        questionData?.data?.filter(
                          (q) =>
                            q?.question_user_id?._id === userInfo?.data?._id
                        )?.length
                    )}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QnAAccordion;
