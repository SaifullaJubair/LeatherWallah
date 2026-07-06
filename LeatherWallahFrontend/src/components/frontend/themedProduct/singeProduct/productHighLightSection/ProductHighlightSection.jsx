"use client";
import Link from "next/link";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { HiMinus, HiOutlinePlus } from "react-icons/hi";
import { BsCart, BsCartCheckFill } from "react-icons/bs";
import { TbShoppingCartOff } from "react-icons/tb";
import { GoGitCompare } from "react-icons/go";
import { MdLocalShipping, MdVerified } from "react-icons/md";
import { RiSecurePaymentLine } from "react-icons/ri";
import { TbTruckReturn } from "react-icons/tb";
import { IoTimeOutline } from "react-icons/io5";
import { FiAward } from "react-icons/fi";
import { EnglishDateWithTimeShort } from "@/components/utils/EnglishDateWithTimeShort";
import useGetSettingData from "@/components/lib/getSettingData";
import { isHexColor, variantAxisAttributes } from "@/utils/helper";
import { useState } from "react";
import ChartModal from "./ChartModal";

// Each star fills left→right by percentage (Daraz/Amazon style) so a 4.3
// rating shows 4 full stars + a star filled 30% — not rounded to whole stars.
const StarRow = ({ rating }) => {
  const r = Math.max(0, Math.min(5, parseFloat(rating) || 0));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, r - (i - 1)));
        return (
          <span key={i} className="relative inline-block text-sm leading-none">
            <span className="text-gray-200">★</span>
            <span
              className="absolute inset-0 overflow-hidden text-amber-400"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
};

const ProductHighlightSection = ({
  product,
  productPrice,
  lineThoughPrice,
  stock,
  quantity,
  setQuantity,
  handleIncrement,
  handleDecrement,
  isWishlisted,
  handleWishlist,
  handleSelectVariation,
  selectedVariations,
  maxQuantity,
  handleAddToCart,
  handleAddToCompare,
  isCompare,
}) => {
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data[0]?.currency_symbol;
  const [showChart, setShowChart] = useState(false);
  const [cartAnim, setCartAnim] = useState(false);

  const rating = parseFloat(product?.avarage_review_ratting || 0).toFixed(1);

  // ✅ Discount percentage — based on actual lineThoughPrice vs productPrice
  const discountPct =
    lineThoughPrice && productPrice && lineThoughPrice > productPrice
      ? Math.round(((lineThoughPrice - productPrice) / lineThoughPrice) * 100)
      : 0;

  const onCartClick = () => {
    handleAddToCart();
    setCartAnim(true);
    setTimeout(() => setCartAnim(false), 1500);
  };

  return (
    <div className="space-y-3.5">
      {/* Brand + Category */}
      <div className="flex items-center gap-2 flex-wrap">
        {product?.brand_id?.brand_name && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {product.brand_id.brand_name}
          </span>
        )}
        {product?.category_id?.category_slug && (
          <Link
            href={`/category/${product.category_id.category_slug}`}
            className="text-[11px] text-primary hover:underline"
          >
            {product.category_id.category_name}
          </Link>
        )}
        {product?.trending_product && (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <FiAward size={10} /> Trending
          </span>
        )}
      </div>

      {/* Name */}
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
        {product?.product_name}
      </h1>

      {/* Rating + Orders */}
      {(product?.avarage_review_ratting > 0 ||
        product?.total_review_ratting > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <StarRow rating={rating} />
          <span className="text-xs font-semibold text-gray-600">{rating}</span>
          <span className="text-xs text-gray-400">
            ({product?.total_review_ratting || 0} reviews)
          </span>
          {product?.total_order_count > 0 && (
            <>
              <span className="text-gray-200">|</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <MdVerified size={11} className="text-blue-500" />
                {product.total_order_count} sold
              </span>
            </>
          )}
        </div>
      )}

      {/* Flash Sale / Campaign */}
      {(product?.flash_sale_details || product?.campaign_details) && (
        <Link
          href={`/campaign/${product?.campaign_details?._id}`}
          className="flex items-center justify-between bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <IoTimeOutline className="text-white shrink-0" size={16} />
            <span className="text-white font-semibold text-xs">
              {product?.flash_sale_details?.flash_sale_title ||
                product?.campaign_details?.campaign_title}
            </span>
          </div>
          <span className="text-white/80 text-[10px] shrink-0">
            Ends:{" "}
            {EnglishDateWithTimeShort(
              product?.flash_sale_details?.flash_sale_end_time ||
                product?.campaign_details?.campaign_end_date,
            )}
          </span>
        </Link>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl md:text-3xl font-black text-gray-900">
          {currencySymbol}
          {productPrice}
        </span>
        {lineThoughPrice && lineThoughPrice > productPrice && (
          <span className="text-base line-through text-gray-400">
            {currencySymbol}
            {lineThoughPrice}
          </span>
        )}
        {discountPct > 0 && (
          <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
            Save {discountPct}%
          </span>
        )}
      </div>

      {/* Short Description */}
      {product?.product_short_description && (
        <p className="text-sm text-gray-500 leading-relaxed">
          {product.product_short_description}
        </p>
      )}

      <div className="border-t border-gray-100" />

      {/* Variations — only the attributes that are variant_axes (spec-only
          attrs show on the Specifications table below, not as chips). */}
      {product?.is_variation &&
        variantAxisAttributes(product)?.map((attr, i) => (
          <div key={i} className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {attr?.attribute_name}:{" "}
              <span className="text-primary normal-case font-bold">
                {selectedVariations[attr?.attribute_name]
                  ?.attribute_value_name || `Select ${attr?.attribute_name}`}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {attr?.attribute_values?.map((val) => {
                const selected =
                  selectedVariations[attr?.attribute_name]
                    ?.attribute_value_name === val?.attribute_value_name;
                const isColor = isHexColor(val?.attribute_value_code);
                return (
                  <div key={val?._id} className="relative group/tip">
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectVariation(val, attr?.attribute_name)
                      }
                      className={`transition-all duration-150
                      ${
                        isColor
                          ? `w-8 h-8 rounded-full border-2 ${selected ? "ring-2 ring-primary ring-offset-2 border-white scale-110" : "border-gray-300 hover:scale-105"}`
                          : `px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${selected ? "bg-primary text-white border-primary shadow-md" : "border-gray-200 text-gray-700 hover:border-primary hover:text-primary"}`
                      }`}
                      style={{
                        backgroundColor: isColor
                          ? val?.attribute_value_code
                          : undefined,
                      }}
                    >
                      {!isColor && val?.attribute_value_name}
                    </button>
                    {isColor && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10">
                        {val?.attribute_value_name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* Size Chart */}
      {product?.size_chart && (
        <>
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="text-xs text-primary underline underline-offset-4 hover:opacity-80"
          >
            📏 Size Chart
          </button>
          {showChart && (
            <ChartModal
              showChart={showChart}
              setShowChart={setShowChart}
              size_chart={product?.size_chart}
            />
          )}
        </>
      )}

      {/* Stock */}
      <div className="flex items-center gap-2">
        {stock > 0 ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-700 font-semibold">
              In Stock
              {stock <= 10 && (
                <span className="text-amber-600 ml-1.5">
                  · Only {stock} left!
                </span>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-red-600 font-semibold">
              Out of Stock
            </span>
          </>
        )}
      </div>

      {/* Qty + Wishlist + Compare */}
      {stock > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Qty stepper */}
          <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 bg-white">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiMinus size={13} className="text-gray-700" />
            </button>
            <input
              type="number"
              readOnly
              value={quantity}
              className="w-12 text-center py-2.5 text-sm font-bold text-gray-800 outline-none no-spin-buttons"
            />
            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= stock}
              className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlinePlus size={13} className="text-gray-700" />
            </button>
          </div>
          {quantity >= stock && stock > 0 && (
            <p className="text-xs text-orange-500 font-medium w-full mt-1">
              Maximum {stock} can be added
            </p>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            className={`p-2.5 rounded-xl border-2 transition-all duration-200 ${isWishlisted ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "border-gray-200 text-gray-400 hover:border-primary hover:text-primary"}`}
          >
            {isWishlisted ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
          </button>

          {/* Compare */}
          <button
            type="button"
            onClick={handleAddToCompare}
            title="Add to Compare"
            className={`p-2.5 rounded-xl border-2 transition-all duration-200 ${isCompare ? "bg-slate-700 border-slate-700 text-white" : "border-gray-200 text-gray-400 hover:border-slate-500 hover:text-slate-600"}`}
          >
            <GoGitCompare size={15} />
          </button>
        </div>
      )}

      {/* Add to Cart — Desktop */}
      <div className="hidden md:block">
        {stock <= 0 ? (
          <button
            type="button"
            disabled
            className="w-full py-3 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed rounded-xl text-sm font-semibold"
          >
            <TbShoppingCartOff size={17} /> Out of Stock
          </button>
        ) : (
          <button
            type="button"
            onClick={onCartClick}
            className="w-full py-3 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
          >
            {cartAnim ? (
              <>
                <BsCartCheckFill size={17} /> Added!
              </>
            ) : (
              <>
                <BsCart size={17} /> Add to Cart
              </>
            )}
          </button>
        )}
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
        {[
          {
            icon: <MdLocalShipping size={16} className="text-blue-600" />,
            label: "Fast Delivery",
            bg: "bg-blue-50",
          },
          {
            icon: (
              <RiSecurePaymentLine size={16} className="text-emerald-600" />
            ),
            label: "Cash on Delivery",
            bg: "bg-emerald-50",
          },
          {
            icon: <TbTruckReturn size={16} className="text-amber-600" />,
            label: "Easy Return",
            bg: "bg-amber-50",
          },
        ].map((b, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-1 p-2 ${b.bg} rounded-lg text-center`}
          >
            {b.icon}
            <span className="text-[9px] font-semibold text-gray-600 leading-tight">
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile Fixed Bottom CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-safe pt-2 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-xl">
        {stock <= 0 ? (
          <button
            type="button"
            disabled
            className="w-full py-3.5 flex items-center justify-center gap-2 bg-gray-200 text-gray-400 cursor-not-allowed rounded-2xl text-sm font-semibold"
          >
            <TbShoppingCartOff size={17} /> Out of Stock
          </button>
        ) : (
          <button
            type="button"
            onClick={onCartClick}
            className="w-full py-3.5 flex items-center justify-center gap-2 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
          >
            <BsCart size={17} />
            Add to Cart · {currencySymbol}
            {productPrice}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductHighlightSection;
