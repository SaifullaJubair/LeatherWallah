"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

/**
 * Children of one geo node — the checkout's cascading Division/District/
 * Upazila dropdown. Hits our own `/geo/children`, not Pathao's live API —
 * see docs/_ai/GEO_LOCATION_SELF_HOSTED_PLAN.md for why.
 *
 * `parentId` is the `_id` of the node picked at the level above. Pass
 * `isRoot: true` for the divisions level (the one query that must run with
 * no parent at all) — every other level must stay disabled until it has a
 * real parent id, or it would silently re-fetch the root list instead of
 * waiting, and the dropdown would show divisions where districts belong.
 */
const useGetGeoChildren = (parentId, { isRoot = false } = {}) => {
  return useQuery({
    queryKey: ["/api/v1/geo/children", parentId || "root"],
    queryFn: async () => {
      const qs = parentId ? `?parent=${parentId}` : "";
      const res = await fetch(`${BASE_URL}/geo/children${qs}`);
      const data = await res.json();
      return data;
    },
    enabled: isRoot || !!parentId,
    staleTime: 5 * 60 * 1000,
  });
};

export default useGetGeoChildren;
