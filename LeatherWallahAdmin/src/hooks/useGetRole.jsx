import { useQuery } from "@tanstack/react-query";

import { BASE_URL } from "../utils/baseURL";

const useGetRole = () => {
  return useQuery({
    queryKey: [`/api/v1/role`],
    queryFn: async () => {
      const res = await fetch(
        `${BASE_URL}/role`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      return data?.data;
    },
  });
};

export default useGetRole;
