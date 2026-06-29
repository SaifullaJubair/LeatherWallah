import { baseApi } from "./api/baseApi";
import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./feature/cart/cartSlice";
import { cartLocalStorageMiddleware } from "./cartLocalstorageMiddleware";

// SSR safe — server এ localStorage নেই
// Migrates old cart shape (_id key) to new shape (productId key)
const cartLoadState = () => {
  if (typeof window === "undefined") return undefined;
  try {
    const serializedCart = localStorage.getItem("cart");
    if (!serializedCart) return undefined;
    const parsed = JSON.parse(serializedCart);

    // Migrate: old shape used _id instead of productId
    if (parsed?.products?.length) {
      parsed.products = parsed.products
        .map((item) => {
          if (!item.productId && item._id) {
            return { ...item, productId: item._id };
          }
          return item;
        })
        .filter((item) => item.productId); // drop corrupt items with no id at all
      parsed.totalQuantity = parsed.products.reduce((s, p) => s + (p.quantity || 0), 0);
    }

    return parsed;
  } catch (error) {
    return undefined;
  }
};

const cartPreloadedState = cartLoadState();

// Configure the Redux store
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      baseApi.middleware,
      cartLocalStorageMiddleware,
    ),
  preloadedState: {
    cart: cartPreloadedState,
  },
});
