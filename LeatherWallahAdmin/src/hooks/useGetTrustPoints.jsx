import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

// Singleton "Brand Promise" list. Returns { data: { points: [...] } }.
export const useGetTrustPoints = () =>
  useQuery({
    queryKey: ["/api/v1/trust-point"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/trust-point`, {
        credentials: "include",
      });
      return res.json();
    },
  });
