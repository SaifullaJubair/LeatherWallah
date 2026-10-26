"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

/**
 * All 64 districts, flat, across every division — the checkout's actual
 * first dropdown.
 *
 * Division is skipped in the picker (owner decision, 2026-10-27: one fewer
 * screen to tap through). It isn't lost from the order — the backend still
 * resolves and snapshots geo_division_id/name from whichever district the
 * customer picks (see docs/_ai/GEO_LOCATION_SELF_HOSTED_PLAN.md).
 */
const useGetAllDistricts = () => {
  return useQuery({
    queryKey: ["/api/v1/geo/districts"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/geo/districts`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export default useGetAllDistricts;
