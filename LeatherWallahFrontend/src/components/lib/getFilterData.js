import { BASE_URL } from "../utils/baseURL";

export async function getFilterData(slug) {
  const res = await fetch(
    `${BASE_URL}/filter_product/side_filtered_data/${slug}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
