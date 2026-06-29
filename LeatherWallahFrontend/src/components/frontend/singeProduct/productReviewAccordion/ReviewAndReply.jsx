"use client";
import useGetSettingData from "@/components/lib/getSettingData";
import React, { useState } from "react";
import { FaRegUser, FaStar } from "react-icons/fa";

const ReviewAndReply = ({ singleProduct, reviewsData }) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const { data: settingData, isLoading: settingLoading } = useGetSettingData();
  // console.log(reviewsData);
  return (
    <div className="mt-4">
      {reviewsData?.data?.map((review) => (
        <div className="mb-6" key={review?._id}>
          <div className="flex items-start space-x-4">
            {/* User Image or Avatar */}
            {review?.review_user_id?.user_image ? (
              <img
                src={review?.review_user_id?.user_image}
                alt={review?.review_user_id?.user_name}
                className="w-12 h-12  object-cover"
              />
            ) : (
              <div className="w-12 h-12  bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-700">
                  {review?.review_user_id?.user_name?.charAt(0) || (
                    <FaRegUser />
                  )}
                </span>
              </div>
            )}

            {/* User Information */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {review?.review_user_id?.user_name}
                  </p>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, index) => (
                      <FaStar
                        key={index}
                        className={`h-4 w-4 ${
                          index < review?.review_ratting
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(review?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          {/* Review Message */}
          <p className="mt-2 text-gray-700">{review?.review_description}</p>

          {/* Review Image if Available */}
          {review?.review_image && (
            <img
              src={review?.review_image}
              alt="Review"
              className="mt-2 w-48 h-32 object-cover  "
            />
          )}

          {review?.review_answer && (
            <div className="my-4 ml-6 bg-[#F2F2F2]  p-2.5 flex gap-3  ">
              <div className="w-12 h-12  bg-gray-300 flex items-center justify-center">
                {settingLoading || !settingData?.data?.[0]?.favicon ? (
                  <>
                    <div className="w-12 h-12  bg-gray-300 flex items-center justify-center">
                      <span className="text-xl font-semibold text-gray-700">
                        A
                      </span>
                    </div>
                  </>
                ) : (
                  <img
                    src={settingData?.data?.[0]?.favicon}
                    alt={settingData?.data?.[0]?.title}
                    className="w-12 h-12  object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">RESPONSE FROM ADMIN</p>
                <p className="text-sm text-gray-500">{review?.review_answer}</p>
              </div>
            </div>
          )}
          {/* Horizontal Line */}
          <hr className="my-4 border-t border-gray-200" />
        </div>
      ))}
    </div>
  );
};

export default ReviewAndReply;
