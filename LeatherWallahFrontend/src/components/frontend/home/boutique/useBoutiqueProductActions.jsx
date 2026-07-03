"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { addToCart } from "@/redux/feature/cart/cartSlice";

/**
 * Shared add-to-cart + wishlist behaviour for the boutique home sections, kept
 * byte-for-byte consistent with the canonical ProductCard so the storefront
 * behaves the same everywhere (localStorage wishlist — edge-audit B1; variation
 * products open QuickView instead of a blind add — B2).
 *
 * Returns:
 *   wishlisted   — boolean (live, listens to the global localStorage event)
 *   toggleWishlist(e)
 *   handleAddToCart(variationId?)  — add to cart (variationId from a chip, or null)
 *   buyNow(variationId?)           — add then router.push("/checkout")
 *   quickView, setQuickView        — caller renders <QuickViewModal> when true
 */
export default function useBoutiqueProductActions(product) {
  const dispatch = useDispatch();
  const router = useRouter();
  const cartProducts = useSelector((state) => state.cart.products);
  const [quickView, setQuickView] = useState(false);

  const readWishlisted = () => {
    try {
      return (JSON.parse(localStorage.getItem("wishlist")) || []).some(
        (i) => i.productId === product?._id,
      );
    } catch {
      return false;
    }
  };

  const [wishlisted, setWishlisted] = useState(false);

  // Hydrate on mount (avoids SSR/client mismatch — edge-audit H3) and stay in
  // sync if another card toggles the same product.
  useEffect(() => {
    setWishlisted(readWishlisted());
    const onUpdate = () => setWishlisted(readWishlisted());
    window.addEventListener("localStorageUpdated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("localStorageUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const toggleWishlist = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const list = JSON.parse(localStorage.getItem("wishlist")) || [];
      const firstVarId = Array.isArray(product?.variations)
        ? product.variations[0]?._id
        : product?.variations?._id;
      const item = {
        productId: product?._id,
        variation_product_id: firstVarId || null,
      };
      const exists = list.some((i) => i.productId === item.productId);
      const updated = exists
        ? list.filter((i) => i.productId !== item.productId)
        : [...list, item];
      localStorage.setItem("wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("localStorageUpdated"));
      setWishlisted(!exists);
      toast[exists ? "error" : "success"](
        exists ? "Removed from wishlist" : "Added to wishlist",
        { autoClose: 1200 },
      );
    } catch {}
  };

  // Add to cart. `variationId` = the selected variation's _id (boutique chips);
  // null for a simple product. Returns true if it actually added (false if it
  // was already in the cart) so callers like buyNow can still proceed.
  const addToCartWith = (variationId = null) => {
    const already = cartProducts?.some((item) =>
      variationId
        ? item.productId === product?._id &&
          item.variation_product_id === variationId
        : item.productId === product?._id && !item.variation_product_id,
    );
    if (already) {
      toast.info("This item is already in your cart", { autoClose: 1200 });
      return false;
    }
    // F1.2 — clamp to stock (selected variation's qty, else simple product qty).
    const selectedVar = variationId
      ? product?.variations?.find((v) => v?._id === variationId)
      : null;
    const maxStock = variationId
      ? selectedVar?.variation_quantity
      : product?.product_quantity;
    dispatch(
      addToCart({
        productId: product?._id,
        variation_product_id: variationId || null,
        quantity: 1,
        product_slug: product?.product_slug || null,
        maxStock,
      }),
    );
    return true;
  };

  const handleAddToCart = (variationId = null) => {
    if (addToCartWith(variationId)) {
      toast.success("Added to cart", { autoClose: 1200 });
    }
  };

  // "Order Now" — add (if needed) then go straight to checkout.
  const buyNow = (variationId = null) => {
    addToCartWith(variationId); // no-op toast if already there; still proceed
    router.push("/checkout");
  };

  return {
    wishlisted,
    toggleWishlist,
    handleAddToCart,
    buyNow,
    quickView,
    setQuickView,
  };
}
