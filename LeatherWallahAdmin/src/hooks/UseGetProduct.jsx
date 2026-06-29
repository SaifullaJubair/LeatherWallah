import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const UseGetProduct = (page, rows, searchTerm) => {
  return useQuery({
    queryKey: [
      `/api/v1/offer/dashboard/add_offer_product?page=${page}&limit=${rows}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/offer/dashboard/add_offer_product?page=${page}&limit=${rows}&searchTerm=${searchTerm}`
      );
      const data = await res.json();
      return data;
    },
  });
};

export default UseGetProduct;
