"use client";
import { store } from "@/redux/store";
import { Provider } from "react-redux";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadCartFromDB, syncCartAfterLogin } from "@/utils/cartSync";
import { loadWishlistFromDB } from "@/utils/wishlistSync";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";

const CartLoader = () => {
  const dispatch = useDispatch();
  const { data: userInfo } = useUserInfoQuery();
  const localProducts = useSelector((state) => state.cart.products);

  useEffect(() => {
    if (!userInfo?.data?._id) return;

    // Page reload: localStorage에 guest items 있으면 sync-merge가 먼저
    // (syncCartAfterLogin POST /cart/sync → DB merge → setCartFromDB)
    // 없으면 그냥 DB cart overwrite
    if (localProducts.length > 0) {
      syncCartAfterLogin(localProducts, dispatch, userInfo.data._id);
    } else {
      loadCartFromDB(dispatch);
    }
  }, [userInfo?.data?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

// D15 — পরিচিত CartLoader pattern-এর mirror। logged-in user fresh load করলে
// BE থেকে wishlist union-merge করে localStorage-এ বসায়; পরে heart toggle আর
// dashboard remove সরাসরি BE-তেও fire করে (wishlistSync.js-এর remote helpers)।
const WishlistLoader = () => {
  const { data: userInfo } = useUserInfoQuery();

  useEffect(() => {
    if (userInfo?.data?._id) {
      loadWishlistFromDB();
    }
  }, [userInfo?.data?._id]);

  return null;
};

const Providers = ({ children }) => {
  return (
    <Provider store={store}>
      <CartLoader />
      <WishlistLoader />
      {children}
    </Provider>
  );
};

export default Providers;
