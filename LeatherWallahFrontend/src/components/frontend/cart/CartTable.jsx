import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
  updateQuantity,
} from "@/redux/feature/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { productPrice } from "@/utils/helper";
import useGetSettingData from "@/components/lib/getSettingData";
import { PhotoProvider, PhotoView } from "react-photo-view";
// CSS co-located with its only consumers. Importing it in the root layout made
// every route (incl. the homepage, which has no lightbox) render-block on 18.5 KiB.
import "react-photo-view/dist/react-photo-view.css";
import { FiMinus, FiPlus, FiTrash2, FiEye, FiShoppingBag, FiChevronDown } from "react-icons/fi";
import QuickViewModal from "@/components/shared/quickViewModal/QuickViewModal";

const CartTable = ({
  products,
  couponData,
  shopProduct,
  adjustedPrices,
  onRemoveFromCache,
}) => {
  const dispatch = useDispatch();
  const cartReduxProducts = useSelector((state) => state.cart.products);
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data?.[0]?.currency_symbol;

  // Cart quick-edit modal state
  const [editItem, setEditItem] = useState(null); // { product_slug, productId, variationId }

  const handleOpenEditModal = (product) => {
    // Find the Redux cart item to get product_slug
    const reduxItem = cartReduxProducts.find(
      (item) =>
        item.productId === product._id &&
        (product.variations?._id
          ? item.variation_product_id === product.variations._id
          : !item.variation_product_id),
    );
    const slug = reduxItem?.product_slug || product?.product_slug || null;
    if (!slug) return; // no slug = can't open modal
    setEditItem({
      product_slug: slug,
      productId: product._id,
      variationId: product.variations?._id || null,
    });
  };

  const getMaxStock = (product) =>
    product?.variations?._id
      ? product?.variations?.variation_quantity
      : product?.product_quantity;

  const getQuantity = (product) =>
    products?.find(
      (item) =>
        item?.productId === product?._id &&
        (product?.variations?._id
          ? item?.variation_product_id === product?.variations?._id
          : !item?.variation_product_id),
    )?.quantity || 1;

  const calculateProductSubtotal = (product) => {
    const priceKey = product?.variations?._id
      ? `${product._id}-${product.variations._id}`
      : product._id;
    const price =
      couponData?.coupon_product_type === "specific" &&
      couponData?.coupon_specific_product?.some(
        (item) => item?.product_id === product?._id,
      )
        ? adjustedPrices[priceKey]
        : productPrice(product);
    return price * getQuantity(product);
  };

  const handleIncrement = (product) => {
    const maxStock = getMaxStock(product);
    if (getQuantity(product) >= maxStock) return;
    dispatch(
      incrementQuantity({
        productId: product?._id,
        variation_product_id: product?.variations?._id || null,
        maxStock,
      }),
    );
  };

  const handleDecrement = (product) => {
    if (getQuantity(product) <= 1) return;
    dispatch(
      decrementQuantity({
        productId: product?._id,
        variation_product_id: product?.variations?._id || null,
      }),
    );
  };

  const handleQuantityInput = (e, product) => {
    const maxStock = getMaxStock(product);
    const raw = parseInt(e.target.value);
    const clamped = isNaN(raw) ? 1 : Math.max(1, Math.min(raw, maxStock));
    dispatch(
      updateQuantity({
        productId: product?._id,
        variation_product_id: product?.variations?._id || null,
        quantity: clamped,
        maxStock,
      }),
    );
  };

  const handleRemove = (product) => {
    dispatch(
      removeFromCart({
        productId: product?._id,
        variation_product_id: product?.variations?._id || null,
      }),
    );
    onRemoveFromCache?.(product?._id, product?.variations?._id);
  };

  const list = Array.isArray(shopProduct) ? shopProduct : [];
  const itemCount = list.length;

  // Accordion: bag OPEN by default so the buyer sees what they're ordering;
  // they can collapse it to shorten the column. Header toggles open/closed.
  // Order Summary + Total (in CartSummary) always stay visible regardless.
  const [bagOpen, setBagOpen] = useState(true);

  // Thumbnails shown in the collapsed header strip (first few items).
  const previewThumbs = list
    .map(
      (p) =>
        p?.variations?.variation_images?.[0] ||
        p?.variations?.variation_image ||
        p?.main_image,
    )
    .filter(Boolean)
    .slice(0, 3);

  return (
    <>
    <PhotoProvider>
      <div className="bg-white rounded-2xl border border-secondary-100/70 shadow-[0_1px_3px_rgba(62,39,35,0.06)] overflow-hidden">
        {/* Accordion header — click to expand/collapse the item list */}
        <button
          type="button"
          onClick={() => setBagOpen((v) => !v)}
          aria-expanded={bagOpen}
          className="w-full flex items-center gap-2.5 px-4 py-3 border-b border-secondary-100/60 bg-secondary-50/30 hover:bg-secondary-50/60 transition-colors text-left"
        >
          <FiShoppingBag size={13} className="text-primary shrink-0" />
          <h2 className="text-[13px] font-semibold text-secondary tracking-tight shrink-0">
            Your Bag
          </h2>

          {/* When collapsed, show mini thumbnails so the buyer still sees what's inside */}
          {!bagOpen && previewThumbs.length > 0 && (
            <span className="flex items-center -space-x-2 ml-1">
              {previewThumbs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-6 h-6 rounded-md object-cover border border-white ring-1 ring-secondary-100"
                />
              ))}
            </span>
          )}

          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-secondary/70 tabular-nums shrink-0">
            {itemCount} {itemCount === 1 ? "item" : "items"}
            <FiChevronDown
              size={15}
              className={`transition-transform ${bagOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        <div
          className={`divide-y divide-secondary-50/80 overflow-y-auto overscroll-contain bag-scroll ${
            bagOpen ? "max-h-[288px]" : "hidden"
          }`}
        >
          {(Array.isArray(shopProduct) ? shopProduct : []).map((product, index) => {
            const currentQty = getQuantity(product);
            const maxStock = getMaxStock(product);
            const isAtMin = currentQty <= 1;
            const isAtMax = currentQty >= maxStock;

            const variationImg =
              product?.variations?.variation_images?.[0] ||
              product?.variations?.variation_image ||
              null;
            const cartImg = variationImg || product?.main_image;

            const unitPrice = productPrice(product);
            const priceKey = product?.variations?._id
              ? `${product._id}-${product.variations._id}`
              : product._id;
            const hasCoupon =
              couponData?.coupon_product_type === "specific" &&
              couponData?.coupon_specific_product?.some(
                (item) => item?.product_id === product?._id,
              );
            const displayPrice = hasCoupon ? adjustedPrices[priceKey] : unitPrice;
            const subtotal = displayPrice * currentQty;

            return (
              <div
                key={`${product._id}-${product?.variations?._id || "no-var"}`}
                className="flex gap-3 p-3.5 hover:bg-secondary-50/30 transition-colors"
              >
                {/* Image */}
                <PhotoView src={cartImg}>
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-secondary-100/70 cursor-zoom-in bg-secondary-50/40 shadow-[0_1px_2px_rgba(62,39,35,0.05)]">
                    <Image
                      src={cartImg || "/assets/images/placeholder.jpg"}
                      width={64}
                      height={64}
                      alt={product?.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </PhotoView>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${product?.product_slug}`}
                    className="text-sm font-medium text-gray-800 hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {product?.product_name}
                  </Link>
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {product?.brand_id?.brand_name && (
                      <span className="text-xs text-gray-400">
                        {product.brand_id.brand_name}
                      </span>
                    )}
                    {product?.is_variation && product?.variations?.variation_name && (
                      <span className="text-xs text-primary/80 font-medium">
                        {product.variations.variation_name}
                      </span>
                    )}
                  </div>

                  {/* Price + qty row */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-1.5">
                      {hasCoupon ? (
                        <>
                          <span className="text-xs text-gray-400 line-through tabular-nums">
                            {currencySymbol}{unitPrice}
                          </span>
                          <span className="text-sm font-bold text-primary tabular-nums">
                            {currencySymbol}{displayPrice}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-secondary tabular-nums">
                          {currencySymbol}{unitPrice}
                        </span>
                      )}
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDecrement(product)}
                        disabled={isAtMin}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                          isAtMin
                            ? "border-gray-100 text-gray-300 cursor-not-allowed"
                            : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5"
                        }`}
                      >
                        <FiMinus size={11} />
                      </button>
                      <input
                        type="number"
                        className="w-10 h-7 text-center text-sm font-semibold border border-gray-200 rounded-lg outline-none focus:border-primary"
                        value={currentQty}
                        min={1}
                        max={maxStock}
                        onChange={(e) => handleQuantityInput(e, product)}
                      />
                      <button
                        type="button"
                        onClick={() => handleIncrement(product)}
                        disabled={isAtMax}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                          isAtMax
                            ? "border-gray-100 text-gray-300 cursor-not-allowed"
                            : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5"
                        }`}
                      >
                        <FiPlus size={11} />
                      </button>
                    </div>

                    {/* Subtotal + actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-secondary min-w-[56px] text-right tabular-nums">
                        {currencySymbol}{subtotal}
                      </span>
                      <button
                        type="button"
                        title="Edit variant"
                        onClick={() => handleOpenEditModal(product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary/50 hover:bg-primary/10 hover:text-primary transition-all"
                      >
                        <FiEye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary/50 hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {isAtMax && (
                    <p className="text-[10px] text-orange-500 mt-1">Max stock reached</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PhotoProvider>

    {/* Cart quick-edit modal */}
    {editItem && (
      <QuickViewModal
        product={{ product_slug: editItem.product_slug }}
        onClose={() => setEditItem(null)}
        mode="cart-edit"
        initialVariantId={editItem.variationId}
        cartItemOld={{ productId: editItem.productId, variationId: editItem.variationId }}
      />
    )}
    </>
  );
};

export default CartTable;
