"use client";

import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

export const useGetAllProductAndSearchProduct = ({
  page,
  limit,
  searchTerm,
}) => {
  return useQuery({
    queryKey: [
      `/api/v1/filter_product/search_product?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/filter_product/search_product?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`
          );
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
  });
};
