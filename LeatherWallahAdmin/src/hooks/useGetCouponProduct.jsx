import { useQuery } from '@tanstack/react-query'
import { BASE_URL } from '../utils/baseURL'

const useGetCouponProduct = (
  productPage,
  productLimit,
  productSearchTerm,
  panel_owner_id
) => {
  return useQuery({
    queryKey: [
      `/api/v1/coupon/specific_product?page=${productPage}&limit=${productLimit}&searchTerm=${productSearchTerm}&panel_owner_id=${panel_owner_id}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/coupon/specific_product?page=${productPage}&limit=${productLimit}&searchTerm=${productSearchTerm}&panel_owner_id=${panel_owner_id}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      return data;
    },
  });
};

export default useGetCouponProduct
