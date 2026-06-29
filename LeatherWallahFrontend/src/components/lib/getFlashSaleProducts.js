import { BASE_URL } from "../utils/baseURL";

export async function getFlashSaleProducts() {
  try {
    const res = await fetch(`${BASE_URL}/flash-sale/active`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
