import { BASE_URL } from "../utils/baseURL";

export async function getBanner() {
  const res = await fetch(`${BASE_URL}/banner`, {
    next: {
      revalidate: 300,
    },
  });

  if (!res.ok) {
    throw new Error("Banner fetching error!");
  }

  return res.json();
}
