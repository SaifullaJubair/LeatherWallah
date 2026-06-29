import { BASE_URL } from "../utils/baseURL";

export async function getJustForYouProducts() {
  const res = await fetch(`${BASE_URL}/product/just_for_you_product`, {
    next: {
      revalidate: 300,
    },
  });

  if (!res.ok) {
    throw new Error("Just for you product fetching error!");
  }

  return res.json();
}
