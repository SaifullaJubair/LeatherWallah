import { BASE_URL } from "@/components/utils/baseURL";

export const fetchCartDetails = async (cartProducts) => {
  if (!cartProducts?.length) return { data: [] };

  const products = cartProducts.map((item) => ({
    product_id: item.productId,
    variation_id: item.variation_product_id || null,
    quantity: item.quantity,
  }));

  try {
    const response = await fetch(`${BASE_URL}/product/cart_product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products }),
    });
    if (!response.ok) throw new Error("Failed to fetch cart details");
    return await response.json();
  } catch (error) {
    console.error("fetchCartDetails error:", error);
    return { data: [] };
  }
};
