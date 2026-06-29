import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const useGetCampaign = ({ page, limit, searchTerm }) => {
  return useQuery({
    queryKey: [
      `/api/v1/campaign/dashboard/add_campaign_product?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/campaign/dashboard/add_campaign_product?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      return data;
    },
  });
};

export default useGetCampaign;
