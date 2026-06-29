import {
  addToCart,
  allRemoveFromCart,
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
  updateQuantity,
  setCartFromDB,
  replaceCartItem,
} from "./feature/cart/cartSlice";
import { BASE_URL } from "@/components/utils/baseURL";

const CART_ACTIONS = [
  addToCart.type,
  removeFromCart.type,
  incrementQuantity.type,
  decrementQuantity.type,
  updateQuantity.type,
  allRemoveFromCart.type,
  setCartFromDB.type,
  replaceCartItem.type,
];

// DB sync debounce — rapid clicks এ একবারই call হবে
let syncTimer = null;

const syncCartToDB = (products) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const dbProducts = products.map((item) => ({
        product_id: item.productId,
        variation_id: item.variation_product_id || null,
        quantity: item.quantity,
      }));

      await fetch(`${BASE_URL}/cart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ products: dbProducts }),
      });
    } catch (error) {
      console.error("Cart DB sync error:", error);
    }
  }, 500);
};

export const cartLocalStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  if (CART_ACTIONS.includes(action.type)) {
    const { cart } = store.getState();

    // 1. localStorage এ save করো
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Cart localStorage save error:", error);
    }

    // 2. User logged in কিনা check — RTK Query cache থেকে
    const state = store.getState();
    const queries = state?.api?.queries;
    const userQuery = queries
      ? Object.values(queries).find(
          (q) => q?.endpointName === "userInfo" && q?.status === "fulfilled",
        )
      : null;
    const isLoggedIn = !!userQuery?.data?.data?._id;

    // setCartFromDB action এ DB sync করব না — infinite loop হবে
    if (isLoggedIn && action.type !== setCartFromDB.type) {
      syncCartToDB(cart.products);
    }
  }

  return result;
};
