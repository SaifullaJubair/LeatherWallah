import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

// Lightweight product list for the Theme Preview product picker (Phase 2).
// Pulls name + slug + _id from the admin dashboard list endpoint so the admin
// can preview any chosen theme on a REAL product. searchTerm is optional.
const useGetProductsForPreview = (searchTerm = "", limit = 50) => {
  return useQuery({
    queryKey: [`/api/v1/product/dashboard/preview-picker`, searchTerm, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: String(limit),
      });
      if (searchTerm) params.set("searchTerm", searchTerm);
      const res = await fetch(`${BASE_URL}/product/dashboard?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      return data;
    },
  });
};

export default useGetProductsForPreview;
