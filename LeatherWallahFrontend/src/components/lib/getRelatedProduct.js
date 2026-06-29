"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const useGetRelatedProducts = ({ product_slug }) => {
  return useQuery({
    queryKey: [`/api/v1/product/related_product?product_slug=${product_slug}`],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/product/related_product?product_slug=${product_slug}`
      );
      const data = await res.json();
      return data;
    },
  });
};

export default useGetRelatedProducts;
