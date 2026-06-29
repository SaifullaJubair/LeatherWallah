import { BASE_URL } from "../utils/baseURL";

export async function getCampaignProduct(id) {
  const res = await fetch(`${BASE_URL}/campaign/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("product data fetching error!");
  }

  return res.json();
}
