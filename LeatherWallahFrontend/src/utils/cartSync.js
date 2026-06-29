import { BASE_URL } from "@/components/utils/baseURL";
import { setCartFromDB } from "@/redux/feature/cart/cartSlice";

/**
 * Login এর পরে localStorage cart DB তে sync করো।
 * LoginForm এ userLogin success এর পরে call করো।
 *
 * @param {Array} localProducts - Redux state এর products array
 * @param {Function} dispatch - Redux dispatch
 */
export const syncCartAfterLogin = async (localProducts, dispatch, userId) => {
  // Once per browser session per user — prevent re-sync on every page reload
  const flagKey = `cart_synced_${String(userId)}`;
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(flagKey)) {
    // Already synced this session — just load from DB instead
    await loadCartFromDB(dispatch);
    return;
  }

  try {
    const products = localProducts.map((item) => ({
      product_id: item.productId,
      variation_id: item.variation_product_id || null,
      quantity: item.quantity,
    }));

    const res = await fetch(`${BASE_URL}/cart/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ products }),
    });

    if (!res.ok) return;

    const data = await res.json();

    if (data?.data?.length) {
      dispatch(setCartFromDB(data.data));
    }

    // Mark synced for this session
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(flagKey, "1");
    }
  } catch (error) {
    console.error("Cart sync error:", error);
  }
};

/**
 * Page load এ (logged in user) DB থেকে cart load করো।
 * Layout বা providers এ একবার call করো।
 *
 * @param {Function} dispatch - Redux dispatch
 */
export const loadCartFromDB = async (dispatch) => {
  try {
    const res = await fetch(`${BASE_URL}/cart`, {
      credentials: "include",
    });

    if (!res.ok) return;

    const data = await res.json();

    if (data?.data?.length) {
      dispatch(setCartFromDB(data.data));
    }
  } catch (error) {
    console.error("Cart load error:", error);
  }
};
