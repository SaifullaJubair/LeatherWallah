import DragToUpload from "@/components/shared/dragToUpload/DragToUpload";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/components/utils/baseURL";
import Link from "next/link";
import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { toast } from "react-toastify";

const ToBeReviewedTab = ({ products, userId, refetchOrder, refetchReview }) => {
  const [reviews, setReviews] = useState({});
  const [selectedRating, setSelectedRating] = useState({});

  const handleInputChange = (productId, field, value) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));

    if (field === "rating") {
      setSelectedRating((prev) => ({
        ...prev,
        [productId]: value,
      }));
    }
  };

  const submitReview = async (productId) => {
    const reviewData = reviews[productId];
    // console.log(reviewData);
    if (!reviewData || !reviewData.rating || !reviewData.description) {
      toast.warning("Please provide a rating and description.");
      return;
    }

    const formData = new FormData();
    formData.append("review_description", reviewData.description);
    formData.append("review_ratting", reviewData.rating);
    formData.append("review_status", "active");
    formData.append("review_product_id", productId);
    formData.append("review_user_id", userId);

    if (reviewData.image) {
      formData.append("review_image", reviewData.image);
    }

    try {
      const response = await fetch(`${BASE_URL}/review`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result?.success) {
        toast.success("Review submitted successfully!");
        refetchOrder();
        refetchReview();
      } else {
        toast.error(result?.message);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  if (products?.length === 0) {
    return (
      <div className=" max-w-md mx-auto ">
        <img
          src="/assets/images/empty/Empty-pana-blue.png"
          alt="No orders left"
          className="mx-auto sm:w-96 w-80 "
        />
        <h3 className="text-gray-600">
          No Product is available to be reviewed!
        </h3>

        <div className="flex items-center justify-center gap-2 mt-2.5">
          <Link href="/">
            <Button className="w-full">Go Home</Button>
          </Link>

          <Link href="/shop">
            <Button variant="secondary" className="w-full">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {products?.map((product) => (
        <div key={product?._id} className="p-4 border  mb-4">
          <div className="flex gap-2">
            <img
              src={product?.main_image}
              alt={product?.product_name}
              className="w-24 h-24 object-cover"
            />
            <div>
              <Link href={`/products/${product?.product_slug}`}>
                <h4 className="  hover:text-primary">
                  {product?.product_name}
                </h4>
              </Link>
              <p className="text-gray-500  gap-2 inline-flex">
                Category:{" "}
                <Link
                  href={`/category/${product?.category_slug}`}
                  className="text-blue-400 hover:text-blue-500 hover:underline"
                >
                  {product?.category_name}
                </Link>
              </p>
              {product?.brand_name && (
                <p className="text-gray-500">Brand: {product?.brand_name}</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center text-text-default   text-lg gap-2">
              <span>Rating:</span>

              <span className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={` cursor-pointer ${
                      i < (selectedRating[product._id] || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    onClick={() =>
                      handleInputChange(product._id, "rating", i + 1)
                    }
                  >
                    <FaStar />
                  </span>
                ))}
              </span>
              <span className="text-text-light text-base">
                {selectedRating[product._id] === 5
                  ? "Outstanding"
                  : selectedRating[product._id] === 4
                  ? "Very Good"
                  : selectedRating[product._id] === 3
                  ? "Decent"
                  : selectedRating[product._id] === 2
                  ? "Below Average"
                  : selectedRating[product._id] === 1
                  ? "Terrible"
                  : ""}
              </span>
            </label>
          </div>

          <div>
            <label className="block mt-2 text-text-default">
              Write your review:
              <textarea
                maxLength={300}
                rows={3}
                placeholder="write your review here (max 300 characters)..."
                value={reviews[product._id]?.description || ""}
                onChange={(e) => {
                  handleInputChange(product._id, "description", e.target.value);
                  if (e.target.value.length <= 300) {
                    handleInputChange(
                      product?._id,
                      "description",
                      e.target.value
                    );
                  }
                }}
                className="w-full mt-1 border p-2 "
              />
              <span>
                {reviews[product._id]?.description?.length || 0} / 300
              </span>
            </label>
            <label className="block mt-2">
              <DragToUpload
                onFileSelect={(file) =>
                  handleInputChange(product._id, "image", file)
                }
              />
            </label>
          </div>

          <div className="flex items-center justify-end w-full mt-4">
            <Button onClick={() => submitReview(product._id)} className="">
              Submit Review
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToBeReviewedTab;
