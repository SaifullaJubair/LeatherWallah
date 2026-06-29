"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const useGetShippingConfiguration = () => {
  return useQuery({
    queryKey: [`/api/v1/shipping_configuration`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/shipping_configuration`);
      const data = await res.json();
      return data;
    },
  });
};

export default useGetShippingConfiguration;
