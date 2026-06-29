import { BASE_URL } from "../utils/baseURL";

// Loads the direct child categories of the current category node, for the
// drill-down chip strip above the product grid. Backend's heading endpoint
// returns `data: [{_id, category_name, category_slug, ...}]` — the tree's
// children of `categoryType`. The old sub/child query params are accepted by
// the backend for signature back-compat but ignored.
export async function getFilterHeadData({ categoryType }) {
  const res = await fetch(
    `${BASE_URL}/filter_product/heading_sub_child_category_data?categoryType=${categoryType}`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error("Filter Heading data Failed to fetch!");
  return res.json();
}
