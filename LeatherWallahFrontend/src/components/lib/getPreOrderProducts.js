import { BASE_URL } from "../utils/baseURL";

export async function getPreOrderProducts() {
  const res = await fetch(`${BASE_URL}/pre_order`, {
    next: {
      revalidate: 300,
    },
  });

  if (!res.ok) {
    throw new Error("Pre-order fetching error!");
  }

  return res.json();
}
