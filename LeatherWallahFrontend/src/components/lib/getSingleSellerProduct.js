"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const useGetSingleSellerProduct = ({ panel_owner_id }) => {
  return useQuery({
    queryKey: [
      `/api/v1/product/product_details_owner_some_product?panel_owner_id=${panel_owner_id}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/product/product_details_owner_some_product?panel_owner_id=${panel_owner_id}`
      );
      const data = await res.json();
      return data;
    },
  });
};

export default useGetSingleSellerProduct;
