"use client";
import { useState } from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { FiChevronDown, FiMessageSquare } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ReviewAndReply from "./ReviewAndReply";
import { BASE_URL } from "@/components/utils/baseURL";
import { useQuery } from "@tanstack/react-query";
import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";

// Star renderer
const StarRating = ({ rating, size = 14 }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-amber-400">
          {i <= full ? (
            <FaStar size={size} />
          ) : half && i === full + 1 ? (
            <FaStarHalfAlt size={size} />
          ) : (
            <FaRegStar size={size} className="text-gray-300" />
          )}
        </span>
      ))}
    </div>
  );
};

// Rating bar
const RatingBar = ({ label, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-right text-gray-500">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-gray-400">{count}</span>
    </div>
  );
};

const ProductReviewAccordion = ({ product }) => {
  const productId = product?._id;
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [open, setOpen] = useState(false);

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: [`/api/v1/review/${productId}?page=${page}&limit=${limit}`],
    queryFn: async () => {
      if (!productId) return [];
      const res = await fetch(
        `${BASE_URL}/review/${productId}?page=${page}&limit=${limit}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!productId,
  });

  const rating = parseFloat(product?.avarage_review_ratting || 0).toFixed(1);
  const totalReviews =
    reviewsData?.totalData || product?.total_review_ratting || 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors text-left group"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${open ? "bg-primary text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}
          >
            <FiMessageSquare size={13} />
          </div>
          <span
            className={`text-sm font-semibold transition-colors ${open ? "text-primary" : "text-gray-700"}`}
          >
            Customer Reviews
          </span>
          {totalReviews > 0 && (
            <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              ★ {rating} · {totalReviews}
            </span>
          )}
        </div>
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${open ? "bg-primary/10 rotate-180" : "bg-gray-100"}`}
        >
          <FiChevronDown
            size={13}
            className={open ? "text-primary" : "text-gray-500"}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${open ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-5 pb-5">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="flex gap-6 items-center py-4 bg-amber-50/50 rounded-xl px-4 mb-5 border border-amber-100">
                <div className="text-center shrink-0">
                  <div className="text-4xl font-black text-gray-800">
                    {rating}
                  </div>
                  <StarRating rating={parseFloat(rating)} size={12} />
                  <p className="text-[10px] text-gray-500 mt-1">
                    {totalReviews} reviews
                  </p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count =
                      reviewsData?.data?.filter(
                        (r) => Math.round(r.review_rating) === star,
                      )?.length || 0;
                    return (
                      <RatingBar
                        key={star}
                        label={`${star} ★`}
                        count={count}
                        total={reviewsData?.data?.length || 1}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Review list */}
              {reviewsData?.data?.length > 0 ? (
                <>
                  <ReviewAndReply reviewsData={reviewsData} />
                  {reviewsData?.totalData > limit && (
                    <PaginationWithPageBtn
                      page={page}
                      setPage={setPage}
                      rows={limit}
                      totalData={reviewsData?.totalData}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FiMessageSquare
                    size={32}
                    className="mx-auto mb-2 opacity-30"
                  />
                  <p className="text-sm">No reviews yet. Be the first!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewAccordion;
