import { BASE_URL } from "../utils/baseURL";

export async function getOfferProducts(id) {
  const res = await fetch(`${BASE_URL}/offer/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("product data fetching error!");
  }

  return res.json();
}
