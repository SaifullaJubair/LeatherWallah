import { BASE_URL } from "../utils/baseURL";

export async function getECommerceChoiceProducts() {
  const res = await fetch(`${BASE_URL}/product/top_selling`, {
    next: {
      revalidate: 300,
    },
  });

  if (!res.ok) {
    throw new Error("E-Commerce choice fetching error!");
  }

  return res.json();
}
