import { BASE_URL } from "../utils/baseURL";

export async function getCategory() {
  const res = await fetch(`${BASE_URL}/category`, {
    next: {
      revalidate: 600,
    },
  });

  if (!res.ok) {
    throw new Error("category fetching error!");
  }

  return res.json();
}
