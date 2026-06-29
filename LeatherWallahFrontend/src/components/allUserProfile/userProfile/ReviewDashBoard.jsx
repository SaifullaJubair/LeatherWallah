"use client";
import getReviewInDashBoard from "@/components/lib/getReviewInDashboard";
import getUnReviewDashBoardProduct from "@/components/lib/getUnReviewDashBoard";
import CustomLoader from "@/components/shared/loader/CustomLoader";
import { useState } from "react";
import ToBeReviewedTab from "./ToBeReviewedTab";
import ReviewHistory from "./ReviewHistory";

const DashBoardReview = ({ userInfo }) => {
  const id = userInfo?.data?._id;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isActive, setIsActive] = useState(1);
  const {
    data: reviewData,
    isLoading: reviewLoading,
    refetch: refetchReview,
  } = getReviewInDashBoard(id, page, limit);
  const {
    data: orderData,
    isLoading: orderLoading,
    refetch: refetchOrder,
  } = getUnReviewDashBoardProduct(id, page, limit);

  if (reviewLoading || orderLoading) {
    return <CustomLoader />;
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Sub-tab pill switcher */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { id: 1, label: "To Be Reviewed" },
            { id: 2, label: "Review History" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setIsActive(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                isActive === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
      {isActive === 1 && (
        <ToBeReviewedTab
          products={orderData?.data}
          userId={id}
          refetchOrder={refetchOrder}
          refetchReview={refetchReview}
        />
      )}
      {isActive === 2 && (
        <ReviewHistory
          products={reviewData?.data}
          totalData={reviewData?.totalData}
          setPage={setPage}
          setLimit={setLimit}
          page={page}
          limit={limit}
          setIsActive={setIsActive}
        />
      )}
      </div>
    </div>
  );
};

export default DashBoardReview;
