"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { FiHeart, FiShoppingCart, FiTrash2 } from "react-icons/fi";

import { fetchCartDetails } from "@/utils/fetchCartDetails";
import { addToCart } from "@/redux/feature/cart/cartSlice";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import { removeFromWishlistRemote } from "@/utils/wishlistSync";
import CustomLoader from "@/components/shared/loader/CustomLoader";
import WishlistEmpty from "@/components/shared/wishListEmpty/WishListEmpty";
import useGetSettingData from "@/components/lib/getSettingData";
import { lineThroughPrice, productPrice } from "@/utils/helper";

const UserDashboardWishList = () => {
  const [wishList, setWishList] = useState([]);
  const dispatch = useDispatch();
  const cartProducts = useSelector((state) => state.cart.products);
  const { data: userInfo } = useUserInfoQuery();
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data?.[0]?.currency_symbol;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
      setWishList(stored);
    } catch {}
  }, []);

  const { data: cartDetails, isLoading, refetch } = useQuery({
    queryKey: ["/api/v1/product/cart_product"],
    queryFn: async () => await fetchCartDetails(wishList),
  });

  useEffect(() => { refetch(); }, [wishList, refetch]);

  const handleAddToCart = (product) => {
    const cartItem = {
      productId: product?._id,
      quantity: 1,
      variation_product_id: product?.is_variation ? product?.variations?._id : null,
      product_slug: product?.product_slug || null,
    };
    const alreadyInCart = cartProducts.some(
      (c) => c.productId === product?._id &&
        (!product?.is_variation || c.variation_product_id === product?.variations?._id),
    );
    if (alreadyInCart) { toast.error("Already in cart", { autoClose: 1500 }); return; }
    dispatch(addToCart(cartItem));
    toast.success("Added to cart", { autoClose: 1500 });
  };

  const handleRemove = async (product) => {
    const item = {
      productId: product?._id,
      variation_product_id: product?.is_variation ? product?.variations?._id : null,
    };
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem("wishlist")) || []; } catch {}
    const updated = existing.filter(
      (i) => i.productId !== item.productId || i.variation_product_id !== item.variation_product_id,
    );
    setWishList(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    window.dispatchEvent(new Event("localStorageUpdated"));
    removeFromWishlistRemote(item.productId, item.variation_product_id, !!userInfo?.data?._id);
    await refetch();
    toast.error("Removed from wishlist", { autoClose: 1500 });
  };

  if (isLoading) return <CustomLoader />;
  if (!wishList?.length) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <WishlistEmpty />
    </div>
  );

  const products = cartDetails?.data || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <FiHeart size={18} className="text-red-500" fill="currentColor" />
        <h2 className="text-base font-semibold text-gray-900">Wishlist</h2>
        <span className="ml-auto text-xs text-gray-400">{wishList.length} item{wishList.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Product grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map((product, index) => {
          const price    = productPrice(product);
          const origPrice = lineThroughPrice(product);
          const discount = origPrice ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
          const varImg   = product?.variations?.variation_images?.[0] || product?.variations?.variation_image || null;
          const displayImg = varImg || product?.main_image;
          const inStock  = product?.is_variation
            ? (product?.variations?.variation_quantity || 0) > 0
            : (product?.product_quantity || 0) > 0;
          const inCart   = cartProducts.some(
            (c) => c.productId === product?._id &&
              (!product?.is_variation || c.variation_product_id === product?.variations?._id),
          );

          return (
            <div
              key={`${product._id}-${product?.variations?._id || index}`}
              className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-sm transition-all duration-300"
            >
              {/* Image */}
              <Link href={`/products/${product?.product_slug}`} className="block relative aspect-square overflow-hidden bg-white">
                <Image
                  src={displayImg || "/assets/images/placeholder.jpg"}
                  fill alt={product?.product_name || "Product"}
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {discount > 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
                <span className={`absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {inStock ? "In Stock" : "Out"}
                </span>
              </Link>

              {/* Info */}
              <div className="p-2.5">
                <Link href={`/products/${product?.product_slug}`}>
                  <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug hover:text-primary transition-colors min-h-[2rem]">
                    {product?.product_name}
                  </p>
                </Link>
                {product?.is_variation && product?.variations?.variation_name && (
                  <p className="text-[10px] text-primary/70 mt-0.5">{product.variations.variation_name}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-bold text-gray-900">{currencySymbol}{price}</span>
                  {origPrice && <span className="text-[10px] line-through text-gray-400">{currencySymbol}{origPrice}</span>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-2">
                  {inCart ? (
                    <Link
                      href="/checkout"
                      className="flex-1 flex items-center justify-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <FiShoppingCart size={10} /> In Cart
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock}
                      className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg transition-colors ${inStock ? "bg-primary text-white hover:bg-primary/90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                    >
                      <FiShoppingCart size={10} />
                      {inStock ? "Add to Cart" : "Unavailable"}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(product)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
                  >
                    <FiTrash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserDashboardWishList;
