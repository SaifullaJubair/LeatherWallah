"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

// S4+S5 Phase 1A (edge-audit H5) — staleTime capped at 60s to mirror
// the SSR revalidate window. Earlier 10-min stale meant an admin
// rotating a pixel ID would not take effect on already-loaded clients
// for up to 10 minutes; 60s aligns the two layers.
const useGetSettingData = () => {
  return useQuery({
    queryKey: [`/api/v1/setting`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/setting`);
      const data = await res.json();
      return data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};

export default useGetSettingData;
