"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const getReviewInDashBoard = (id, page, limit) => {
  return useQuery({
    queryKey: [`/api/v1/review?review_user_id=${id}`],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/review?review_user_id=${id}&page=${page}&limit=${limit}`
      );
      const data = await res.json();
      return data;
    },
  });
};

export default getReviewInDashBoard;
