import React from "react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import PaginationWithPageBtn from "@/components/common/paginationWithPageBtn/PaginationWithPageBtn";
import { Button } from "@/components/ui/button";

const ReviewHistory = ({
  products,
  totalData,
  page,
  limit,
  setPage,
  setLimit,
  setIsActive,
}) => {
  if (products?.length === 0) {
    return (
      <div className="text-center max-w-md mx-auto mt-2">
        <img
          src="/assets/images/empty/Empty-cuate.png"
          alt="No orders left"
          className="mx-auto sm:w-96 w-80  "
        />
        <h3 className="text-gray-600">No reviews available in your history!</h3>
        <p className="text-gray-500">
          Start reviewing your orders to see your reviews here.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2.5">
          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsActive(1)}
            >
              Go Back
            </Button>
          </div>

          <Link href="/shop">
            <Button variant="outline" className="w-full">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Review History ({totalData})</h2>
      <div className="grid grid-cols-1 gap-6">
        {products?.map((review) => (
          <div
            key={review?._id}
            className="border p-4  shadow-md flex flex-col gap-4"
          >
            {/* Product Details */}
            <div className="flex gap-4">
              <img
                src={review?.review_product_id?.main_image}
                alt={review?.review_product_id?.product_name}
                className="w-24 h-24 object-cover "
              />
              <div>
                <Link
                  href={`/products/${review?.review_product_id?.product_slug}`}
                >
                  <h4 className="text-lg font-semibold hover:text-primary">
                    {review?.review_product_id?.product_name}
                  </h4>
                </Link>
                <p className="text-gray-500">
                  Category:{" "}
                  <Link
                    href={`/category/${review?.review_product_id?.category_id?.category_slug}`}
                    className="text-blue-400 hover:text-blue-500 hover:underline"
                  >
                    {review?.review_product_id?.category_id?.category_name}
                  </Link>
                </p>
                {review?.review_product_id?.brand_id?.brand_name && (
                  <p className="text-gray-500">
                    Brand: {review?.review_product_id?.brand_id?.brand_name}
                  </p>
                )}
              </div>
            </div>

            {/* Review Details */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span>Rating:</span>
                <span className="text-yellow-400 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`${
                        i < review.review_ratting
                          ? "text-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </span>
                <span className="text-gray-600">
                  {review.review_ratting === 5
                    ? "Outstanding"
                    : review.review_ratting === 4
                    ? "Very Good"
                    : review.review_ratting === 3
                    ? "Decent"
                    : review.review_ratting === 2
                    ? "Below Average"
                    : review.review_ratting === 1
                    ? "Terrible"
                    : ""}
                </span>
              </div>
              <div className="flex bg-[#F4F4F4] p-2   mt-1 gap-2">
                {review.review_image && (
                  <img
                    src={review.review_image}
                    alt="Review"
                    className="w-24 h-24 object-cover "
                  />
                )}
                <div className="px-1.5">
                  <p className="text-gray-700">{review.review_description}</p>
                  <p className="text-sm pt-1 text-gray-500">
                    Reviewed on:{" "}
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalData > limit && (
        <div className="flex justify-end mt-6">
          <PaginationWithPageBtn
            page={page}
            setPage={setPage}
            rows={limit}
            setRows={setLimit}
            totalData={totalData}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewHistory;
