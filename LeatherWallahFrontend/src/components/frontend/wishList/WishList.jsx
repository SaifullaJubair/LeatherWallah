"use client";

import { buildAnalyticsUserData } from "@/utils/buildAnalyticsUserData";
import { useDispatch, useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { fetchCartDetails } from "@/utils/fetchCartDetails";
import { addToCart } from "@/redux/feature/cart/cartSlice";
import WishlistEmpty from "@/components/shared/wishListEmpty/WishListEmpty";
import useGetSettingData from "@/components/lib/getSettingData";
import { lineThroughPrice, productPrice } from "@/utils/helper";
import WishlistTableSkeleton from "@/components/shared/loader/WishlistTableSkeleton";
import { CART_QUERY_KEY } from "../cart/AddToCart";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import { removeFromWishlistRemote } from "@/utils/wishlistSync";
import useAnalytics from "@/components/analyticsScripts/utils/useAnalytics";
import {
  FiHeart, FiShoppingCart, FiTrash2, FiArrowRight,
  FiGrid, FiList, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";

const WISHLIST_QUERY_KEY = "/api/v1/product/wishlist_product";
const PAGE_SIZE = 12;

const WishList = () => {
  const [wishList, setWishList] = useState([]);
  const [view, setView] = useState("card"); // "card" | "list"
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const cartProducts = useSelector((state) => state.cart.products);
  const { data: userInfo } = useUserInfoQuery();
  const { trackAddToCart } = useAnalytics();

  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      setWishList(wishlist);
    } catch {}
  }, []);

  const { data: cartDetails, isLoading } = useQuery({
    queryKey: [
      WISHLIST_QUERY_KEY,
      wishList.map((w) => w.productId + (w.variation_product_id || "")).join(","),
    ],
    queryFn: async () => await fetchCartDetails(wishList),
    enabled: wishList.length > 0,
    staleTime: Infinity,
  });

  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data?.[0]?.currency_symbol;

  const allProducts = cartDetails?.data || [];
  const lastPage = Math.ceil(allProducts.length / PAGE_SIZE);
  const products = useMemo(
    () => allProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allProducts, page],
  );

  const handleRemoveWishlist = (product) => {
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
    toast.error("Removed from wishlist", { autoClose: 1500 });
  };

  const handleAddToCart = (product) => {
    const inCart = cartProducts.find((i) => i?.productId === product?._id);
    if (product?.is_variation) {
      const varInCart = cartProducts.find((i) => i?.variation_product_id === product?.variations?._id);
      if (inCart && varInCart) { toast.error("Already in cart", { autoClose: 1500 }); return; }
    } else if (inCart) {
      toast.error("Already in cart", { autoClose: 1500 }); return;
    }
    dispatch(addToCart({
      productId: product?._id,
      quantity: 1,
      variation_product_id: product?.is_variation ? product?.variations?._id : null,
      product_slug: product?.product_slug || null,
    }));
    toast.success("Added to cart", { autoClose: 1500 });
    queryClient.invalidateQueries({ queryKey: [CART_QUERY_KEY] });
    trackAddToCart(product, product?.is_variation ? product?.variations : null, 1, buildAnalyticsUserData(userInfo));
  };

  if (!isLoading && !wishList?.length) return <WishlistEmpty />;

  const isInCart = (product) =>
    cartProducts.some(
      (c) => c.productId === product?._id &&
        (!product?.is_variation || c.variation_product_id === product?.variations?._id),
    );

  const isInStock = (product) =>
    product?.is_variation
      ? (product?.variations?.variation_quantity || 0) > 0
      : (product?.product_quantity || 0) > 0;

  // Pagination page numbers with ellipsis
  const getPages = () => {
    const pages = [];
    for (let i = 1; i <= lastPage; i++) {
      if (i === 1 || i === lastPage || (i >= page - 1 && i <= page + 1)) pages.push(i);
    }
    const result = [];
    let prev = null;
    for (const p of pages) {
      if (prev && p - prev > 1) result.push("...");
      result.push(p);
      prev = p;
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FiHeart className="text-red-500" size={18} fill="currentColor" />
              <h1 className="text-xl font-bold text-gray-900">My Wishlist</h1>
            </div>
            {!isLoading && (
              <p className="text-xs text-gray-400">
                {wishList.length} {wishList.length === 1 ? "item" : "items"} saved
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setView("card")}
                className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  view === "card" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiGrid size={13} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  view === "list" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FiList size={13} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            <Link
              href="/checkout"
              className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <FiShoppingCart size={13} />
              <span className="hidden sm:inline">Checkout</span>
              <FiArrowRight size={12} />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <WishlistTableSkeleton />
        ) : (
          <>
            {/* ─── CARD VIEW ─── */}
            {view === "card" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-5">
                {products.map((product) => {
                  const price = productPrice(product);
                  const origPrice = lineThroughPrice(product);
                  const discount = origPrice ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
                  const inCart = isInCart(product);
                  const inStock = isInStock(product);
                  const varImg =
                    product?.variations?.variation_images?.[0] ||
                    product?.variations?.variation_image ||
                    null;
                  const displayImg = varImg || product?.main_image;

                  return (
                    <div
                      key={`${product._id}-${product?.variations?._id || "no-var"}`}
                      className="bg-white rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all duration-300 overflow-hidden group"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <Link href={`/products/${product?.product_slug}`}>
                          <Image
                            src={displayImg || "/assets/images/placeholder.jpg"}
                            fill alt={product?.product_name || "Product"}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>
                        {discount > 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            -{discount}%
                          </span>
                        )}
                        <span className={`absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {inStock ? "In Stock" : "Out of Stock"}
                        </span>
                        <button
                          onClick={() => handleRemoveWishlist(product)}
                          className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>

                      <div className="p-2.5">
                        <Link href={`/products/${product?.product_slug}`}>
                          <h3 className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug mb-1.5 hover:text-primary transition-colors min-h-[2rem]">
                            {product?.product_name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-bold text-gray-900">{currencySymbol}{price}</span>
                          {origPrice && <span className="text-[10px] line-through text-gray-400">{currencySymbol}{origPrice}</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {inCart ? (
                            <Link href="/checkout" className="flex-1 flex items-center justify-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
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
                            onClick={() => handleRemoveWishlist(product)}
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
            )}

            {/* ─── LIST VIEW ─── */}
            {view === "list" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                <div className="divide-y divide-gray-50">
                  {products.map((product) => {
                    const price = productPrice(product);
                    const origPrice = lineThroughPrice(product);
                    const discount = origPrice ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
                    const inCart = isInCart(product);
                    const inStock = isInStock(product);
                    const varImg =
                      product?.variations?.variation_images?.[0] ||
                      product?.variations?.variation_image ||
                      null;
                    const displayImg = varImg || product?.main_image;

                    return (
                      <div
                        key={`${product._id}-${product?.variations?._id || "no-var"}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Image */}
                        <Link href={`/products/${product?.product_slug}`} className="shrink-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                            <Image
                              src={displayImg || "/assets/images/placeholder.jpg"}
                              width={56} height={56}
                              alt={product?.product_name || "Product"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${product?.product_slug}`}>
                            <p className="text-sm font-medium text-gray-800 hover:text-primary transition-colors line-clamp-1">
                              {product?.product_name}
                            </p>
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            {product?.brand_id?.brand_name && (
                              <span className="text-[10px] text-gray-400">{product.brand_id.brand_name}</span>
                            )}
                            {product?.is_variation && product?.variations?.variation_name && (
                              <span className="text-[10px] text-primary/70 font-medium">{product.variations.variation_name}</span>
                            )}
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                              {inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="shrink-0 text-right hidden sm:block">
                          <span className="text-sm font-bold text-gray-900">{currencySymbol}{price}</span>
                          {origPrice && (
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-[10px] line-through text-gray-400">{currencySymbol}{origPrice}</span>
                              {discount > 0 && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded-full font-bold">-{discount}%</span>}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {inCart ? (
                            <Link href="/checkout" className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap">
                              <FiShoppingCart size={11} /> In Cart
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={!inStock}
                              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${inStock ? "bg-primary text-white hover:bg-primary/90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                            >
                              <FiShoppingCart size={11} />
                              {inStock ? "Add to Cart" : "N/A"}
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveWishlist(product)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── PAGINATION ─── */}
            {lastPage > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3 mb-5">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, allProducts.length)}
                  </span>{" "}
                  of <span className="font-semibold text-gray-700">{allProducts.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${page === 1 ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white" : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 bg-white"}`}
                  >
                    <FiChevronLeft size={14} />
                  </button>
                  {getPages().map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-medium border transition-all ${page === p ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary hover:bg-primary/5"}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === lastPage}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${page === lastPage ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white" : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 bg-white"}`}
                  >
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {allProducts.length} saved · {cartProducts.length} in cart
              </p>
              <div className="flex items-center gap-3">
                <Link href="/shop" className="text-sm text-primary font-medium hover:underline">
                  Continue Shopping
                </Link>
                <Link
                  href="/checkout"
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <FiShoppingCart size={13} />
                  Go to Checkout
                  <FiArrowRight size={12} />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishList;
