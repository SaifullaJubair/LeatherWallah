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
import { useEffect, useState } from "react";
import ChartModal from "./ChartModal";
import ModalAxisSelector from "./ModalAxisSelector";
import DynamicIcon from "@/lib/icons/DynamicIcon";

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
  variationProduct,
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
  axisAttrs: axisAttrsProp,
  availabilityMap,
  canAddToCart = true,
  maxQuantity,
  handleAddToCart,
  handleAddToCompare,
  isCompare,
  showSoldCount = true,
  showStockCountOnPdp = false,
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

      {/* SKU — M9 (2026-06-04). Shows variation SKU when a variation is
          selected, else parent product SKU. Hidden when neither is set so
          older docs without SKU don't show an empty label. */}
      {(variationProduct?.variation_sku || product?.product_sku) && (
        <div className="text-[11px] text-gray-400 font-mono tracking-wide">
          SKU: {variationProduct?.variation_sku || product?.product_sku}
        </div>
      )}

      {/* Rating + Orders */}
      {(product?.avarage_review_ratting > 0 ||
        product?.total_review_ratting > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <StarRow rating={rating} />
          <span className="text-xs font-semibold text-gray-600">{rating}</span>
          <span className="text-xs text-gray-400">
            ({product?.total_review_ratting || 0} reviews)
          </span>
          {showSoldCount && product?.total_order_count > 0 && (
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
        {lineThoughPrice > 0 && lineThoughPrice > productPrice && (
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

      {/* Phase C — Variations driven by attribute.display_type. Variant axes
          only; spec-only attributes still render on the Specifications table. */}
      {product?.is_variation && (
        <VariationPicker
          axes={axisAttrsProp || variantAxisAttributes(product)}
          selectedVariations={selectedVariations}
          onSelect={handleSelectVariation}
          availabilityMap={availabilityMap}
          variations={product?.variations}
        />
      )}

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
              {showStockCountOnPdp && stock <= 10 && (
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
              সর্বোচ্চ {stock}টি যোগ করা যাবে
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
        {stock <= 0 || !canAddToCart ? (
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
        {stock <= 0 || !canAddToCart ? (
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

// ─────────────────────────────────────────────────────────────────────────────
// Phase C — variant axis picker (display_type-driven).
//
// One block per axis. Renders inline up to a per-device cap (8 mobile /
// 16 desktop) for swatch + button; the rest spills into the ModalAxisSelector.
// Dropdown display_type always opens the modal (search-first UX). OOS chips
// are greyed + clickable (CM9) showing an OOS tooltip; aria-label on every
// chip (CM10); availability map (CM6) is O(1) lookup per chip.
// ─────────────────────────────────────────────────────────────────────────────
const isHex = (v) =>
  typeof v === "string" && /^#?[A-Fa-f0-9]{3,8}$/.test(v.trim());

// A4 (2026-06-04) — given the would-be selection (current axes + new value
// V on axis A), return the matching active variation row. Used to surface
// per-variation badge (text + icon) on the chip before the user picks.
const findVariationForValue = (variations, currentSel, axisId, val) => {
  if (!Array.isArray(variations) || variations.length === 0) return null;
  const next = { ...currentSel, [String(axisId)]: val };
  const ids = Object.values(next)
    .map((v) => v?._id && String(v._id))
    .filter(Boolean);
  if (!ids.length) return null;
  const target = new Set(ids);
  return (
    variations.find((v) => {
      if (v?.is_active === false) return false;
      const combo = v?.combination;
      if (!Array.isArray(combo) || combo.length !== target.size) return false;
      for (const id of combo) {
        if (!target.has(String(id))) return false;
      }
      return true;
    }) || null
  );
};

const VariationPicker = ({
  axes = [],
  selectedVariations = {},
  onSelect,
  availabilityMap,
  variations = [],
}) => {
  // Single open-modal at a time (which axis's modal).
  const [openAxisId, setOpenAxisId] = useState(null);
  // Desktop / mobile cap. Resolve once per mount; resize edge case isn't worth
  // a listener for a one-time cap decision (modal always available beyond it).
  const [cap, setCap] = useState(16);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => setCap(window.innerWidth < 768 ? 8 : 16);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  if (!axes?.length) return null;

  return (
    <>
      {axes.map((attr) => {
        const axisId = String(attr.attribute_id);
        const selectedValue = selectedVariations?.[axisId];
        const displayType = attr.display_type || "button";
        const values = attr.attribute_values || [];
        const useDropdownModal = displayType === "dropdown";
        const inlineValues = useDropdownModal ? [] : values.slice(0, cap);
        const overflowCount = useDropdownModal
          ? values.length
          : Math.max(0, values.length - inlineValues.length);

        return (
          <div key={axisId} className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {attr.attribute_name}:{" "}
              <span className="text-primary normal-case font-bold">
                {selectedValue?.attribute_value_name ||
                  `Select ${attr.attribute_name}`}
              </span>
            </p>

            {useDropdownModal ? (
              <button
                type="button"
                onClick={() => setOpenAxisId(axisId)}
                aria-label={`Choose ${attr.attribute_name}`}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-left text-gray-700 hover:border-primary"
              >
                {selectedValue?.attribute_value_name ||
                  `Select ${attr.attribute_name}…`}
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {inlineValues.map((val) => {
                  const valKey = String(val._id);
                  const selected = String(selectedValue?._id) === valKey;
                  const code = val?.attribute_value_code;
                  const renderAsSwatch =
                    displayType === "swatch" || isHex(code);
                  const avail = availabilityMap?.get(valKey) || {};
                  const inStock = avail.hasInStock !== false;
                  const click = () => onSelect?.(val, axisId);

                  if (renderAsSwatch) {
                    const hex = isHex(code) ? code : null;
                    return (
                      <div key={valKey} className="relative group/tip">
                        <button
                          type="button"
                          onClick={click}
                          aria-label={val.attribute_value_name}
                          aria-pressed={selected}
                          className={`transition-all duration-150 w-8 h-8 rounded-full border-2 ${
                            selected
                              ? "ring-2 ring-primary ring-offset-2 border-white scale-110"
                              : "border-gray-300 hover:scale-105"
                          } ${!inStock ? "opacity-40" : ""}`}
                          style={{
                            backgroundColor: hex || "#e5e7eb",
                          }}
                        />
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-10">
                          {val.attribute_value_name}
                          {!inStock ? " · Out of stock" : ""}
                        </span>
                      </div>
                    );
                  }
                  // A4 (2026-06-04) — look up the variation that would result
                  // from picking THIS value (combined with current other axis
                  // selections) so its badge can render under the chip.
                  const matchedVar = findVariationForValue(
                    variations,
                    selectedVariations,
                    axisId,
                    val,
                  );
                  return (
                    <button
                      key={valKey}
                      type="button"
                      onClick={click}
                      aria-label={val.attribute_value_name}
                      aria-pressed={selected}
                      title={!inStock ? "Out of stock" : undefined}
                      className={`relative px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        selected
                          ? "bg-primary text-white border-primary shadow-md"
                          : "border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
                      } ${!inStock ? "opacity-50" : ""}`}
                    >
                      {val.attribute_value_name}
                      {!inStock && (
                        <span className="ml-1 text-[9px] text-amber-700">
                          ⊘
                        </span>
                      )}
                      {(matchedVar?.variation_badge_text ||
                        matchedVar?.variation_badge_icon_key) && (
                        <span
                          className={`flex items-center justify-center gap-0.5 text-[9px] font-bold mt-0.5 ${
                            selected ? "text-white" : "text-primary"
                          }`}
                        >
                          {matchedVar?.variation_badge_icon_key && (
                            <DynamicIcon
                              name={matchedVar.variation_badge_icon_key}
                              size={9}
                            />
                          )}
                          {matchedVar?.variation_badge_text}
                        </span>
                      )}
                    </button>
                  );
                })}

                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenAxisId(axisId)}
                    aria-label={`Show ${overflowCount} more ${attr.attribute_name} options`}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-primary text-primary hover:bg-primary/5"
                  >
                    +{overflowCount} আরো
                  </button>
                )}
              </div>
            )}

            <ModalAxisSelector
              open={openAxisId === axisId}
              onClose={() => setOpenAxisId(null)}
              axis={attr}
              selectedValueId={selectedValue?._id}
              availabilityMap={availabilityMap}
              onSelect={(v) => {
                onSelect?.(v, axisId);
                setOpenAxisId(null);
              }}
            />
          </div>
        );
      })}
    </>
  );
};
