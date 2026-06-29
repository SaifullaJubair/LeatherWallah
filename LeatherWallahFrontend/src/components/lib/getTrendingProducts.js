"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const useGetTrendingProducts = () => {
  return useQuery({
    queryKey: [`/api/v1/product/trending_product`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/trending_product`);
      const data = await res.json();
      return data;
    },
  });
};

export default useGetTrendingProducts;
