"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const getUnReviewDashBoardProduct = (id) => {
  return useQuery({
    queryKey: [`/api/v1/review/unreview_product?customer_id=${id}`],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/review/unreview_product?customer_id=${id}`
      );
      const data = await res.json();
      return data;
    },
  });
};

export default getUnReviewDashBoardProduct;
