"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { FiHeart, FiShoppingCart, FiEye } from "react-icons/fi";
import { isHexColor, lineThroughPrice, productPrice } from "@/utils/helper";
import useGetSettingData from "@/components/lib/getSettingData";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/feature/cart/cartSlice";
import QuickViewModal from "@/components/shared/quickViewModal/QuickViewModal";

/**
 * Shared product card used across all sections.
 *
 * Props:
 *   product       — product object from API
 *   badge         — optional string pill in top-right (e.g. "New")
 *   activeFilters — optional { [attrId]: [valueId, ...] } from category page
 *                   used to build filter-aware PDP URLs
 */
const ProductCard = ({ product, badge, activeFilters }) => {
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data?.[0]?.currency_symbol;
  const dispatch = useDispatch();

  const [wishlisted, setWishlisted] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem("wishlist")) || []).some(
        (i) => i.productId === product?._id,
      );
    } catch { return false; }
  });
  const [quickView, setQuickView] = useState(false);

  const price = productPrice(product);
  const origPrice = lineThroughPrice(product);
  const discount = origPrice ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

  // Color swatches
  const colors = Array.isArray(product?.attributes_details)
    ? product.attributes_details.flatMap((a) => a.attribute_values || []).filter((v) => isHexColor(v?.attribute_value_code))
    : (product?.attributes_details?.attribute_values || []).filter((v) => isHexColor(v?.attribute_value_code));

  // ── Card media model (owner request) ──────────────────────────────────
  // Default (no hover): ALWAYS main_image — so the grid is calm and consistent.
  // On hover (desktop): if the product has a main_video file, play it; else
  // rotate through the other_images as a carousel. Mobile has no hover, so it
  // just shows main_image (avoids many autoplaying videos = heavy/data cost).
  //
  // main_video is always an uploaded FILE here (pasted YouTube/Vimeo links live
  // in `video_link`, used only on the PDP), so a plain <video> is safe.
  const mainImage = product?.main_image || "/assets/images/placeholder.jpg";
  const hasVideo = Boolean(product?.main_video);

  // Hover carousel frames (only used when there's no video). Merge the
  // per-variation images (colours/sizes) FIRST — customers care most about
  // seeing the variants — then the generic other_images. De-dupe and drop the
  // main_image (already the base layer), then cap so a product with many
  // variations doesn't make the hover loop endlessly.
  const HOVER_FRAME_CAP = 6;
  const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  // The list/grid API (filter_product) ships a ready-merged `card_hover_images`
  // (variation_images + other_images, de-duped, main_image dropped, capped) so
  // the grid payload stays lean. When that field is absent (e.g. PDP-related
  // contexts that return the full product), fall back to merging client-side
  // from variations.variation_images + other_images.
  const carouselImages = (
    toArr(product?.card_hover_images).length
      ? toArr(product.card_hover_images)
      : [
          ...toArr(product?.variations).flatMap((v) =>
            toArr(v?.variation_images).length
              ? toArr(v.variation_images)
              : v?.variation_image
                ? [v.variation_image]
                : [],
          ),
          ...toArr(product?.other_images).map((o) => o?.other_image),
        ]
  )
    .filter((src) => src && src !== mainImage)
    .filter((src, i, arr) => arr.indexOf(src) === i) // de-dupe
    .slice(0, HOVER_FRAME_CAP);
  const hasCarousel = !hasVideo && carouselImages.length > 0;

  const [hovered, setHovered] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const videoRef = useRef(null);
  const carouselTimer = useRef(null);

  // Drive the hover carousel: on enter, step through other_images; on leave,
  // reset to the first frame so the next hover starts clean.
  useEffect(() => {
    if (!hasCarousel) return;
    if (hovered) {
      carouselTimer.current = setInterval(() => {
        setCarouselIdx((i) => (i + 1) % carouselImages.length);
      }, 900);
    } else {
      setCarouselIdx(0);
    }
    return () => clearInterval(carouselTimer.current);
  }, [hovered, hasCarousel, carouselImages.length]);

  // Play/pause the hover video so it doesn't keep buffering when not hovered.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovered]);

  // Build PDP href — category page can pass activeFilters to pre-select a variant
  const buildHref = () => {
    const base = `/products/${product?.product_slug}`;
    if (!activeFilters || !product?.attributes_details?.length) return base;
    const params = new URLSearchParams();
    for (const [attrId, valueIds] of Object.entries(activeFilters)) {
      if (!Array.isArray(valueIds) || !valueIds.length) continue;
      const attr = product.attributes_details.find((a) => String(a?._id) === String(attrId));
      if (!attr) continue;
      const picked = valueIds.find((vid) =>
        attr.attribute_values?.some((av) => String(av?._id) === String(vid)),
      );
      if (picked) params.set(String(attrId), String(picked));
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const href = buildHref();

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const list = JSON.parse(localStorage.getItem("wishlist")) || [];
      const firstVarId = Array.isArray(product?.variations)
        ? product.variations[0]?._id
        : product?.variations?._id;
      const item = { productId: product?._id, variation_product_id: firstVarId || null };
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

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product?.is_variation) {
      window.location.href = href;
      return;
    }
    dispatch(
      addToCart({
        productId: product?._id,
        variation_product_id: null,
        quantity: 1,
        product_slug: product?.product_slug || null,
        maxStock: product?.product_quantity, // F1.2 — clamp repeat-adds to stock
      }),
    );
    toast.success("Added to cart", { autoClose: 1200 });
  };

  return (
    <>
      <div
        className="group bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(16,12,10,0.08)] hover:border-primary/30 hover:shadow-[0_10px_28px_-6px_rgba(107,26,31,0.22)] transition-all duration-300 overflow-hidden flex flex-col"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >

        {/* ── Image area ── */}
        <Link
          href={href}
          className="block relative overflow-hidden bg-gray-50 aspect-[3/4] shrink-0"
        >

          {/* Base layer — ALWAYS main_image. Stays mounted so the card never
              flashes empty; the video / carousel frame fades in on top. */}
          <Image
            fill
            src={mainImage}
            alt={product?.product_name || "Product"}
            className={`object-cover transition-all duration-500 ${
              (hasVideo || hasCarousel) ? "group-hover:opacity-0" : "group-hover:scale-105"
            }`}
          />

          {/* Hover video (desktop only — hidden on touch where there's no hover).
              Fades in over the base image while hovering. */}
          {hasVideo && (
            <video
              ref={videoRef}
              src={product.main_video}
              loop
              muted
              playsInline
              preload="none"
              className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Hover carousel (no video) — rotates variation + other images on
              hover. The active frame fades in; off-hover it resets to frame 0. */}
          {hasCarousel &&
            carouselImages.map((src, i) => (
              <Image
                key={src}
                fill
                src={src}
                alt={product?.product_name || "Product"}
                className={`object-cover absolute inset-0 transition-opacity duration-500 hidden md:block ${
                  hovered && carouselIdx === i ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

          {/* Discount badge — top left. Overlaid on the image so it never adds
              to the card's body height (the old in-body "Save N%" pill wrapped
              on mobile and stretched the card). */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
              Save {discount}%
            </span>
          )}

          {/* Badge + wishlist — top right, stacked */}
          <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
            {badge && (
              <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                {badge}
              </span>
            )}
            <button
              type="button"
              onClick={handleWishlist}
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                wishlisted
                  ? "bg-red-50 text-red-500"
                  : "bg-white/90 text-gray-400 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
              }`}
            >
              <FiHeart size={12} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Bottom action bar. Touch devices have no hover, so it's always
              visible there; only on lg+ (mouse) screens is it hidden until the
              card is hovered, then slides up. */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex transition-transform duration-300 lg:translate-y-full lg:group-hover:translate-y-0">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-white text-[11px] font-semibold py-2.5 flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              <FiShoppingCart size={12} />
              {product?.is_variation ? "Choose Options" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickView(true); }}
              className="bg-gray-800 text-white px-3 py-2.5 flex items-center justify-center hover:bg-gray-700 transition-colors border-l border-gray-700"
              title="Quick view"
            >
              <FiEye size={13} />
            </button>
          </div>
        </Link>

        {/* ── Info ── whole block is a link so tapping the name, swatches or
            price anywhere in the body opens the product (esp. important on
            touch, where there's no hover action bar to rely on). */}
        <Link href={href} className="p-3 flex flex-col gap-1.5 flex-1">
          <h3 className="text-xs sm:text-sm text-gray-800 font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product?.product_name}
          </h3>

          {/* Color swatches */}
          {colors?.length > 0 && (
            <div className="flex items-center gap-1">
              {colors.slice(0, 5).map((c) => (
                <span
                  key={c?._id}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0"
                  style={{ backgroundColor: c?.attribute_value_code }}
                  title={c?.attribute_value_name}
                />
              ))}
              {colors.length > 5 && (
                <span className="text-[10px] text-gray-400">+{colors.length - 5}</span>
              )}
            </div>
          )}

          {/* Price row — kept to a single line (no wrap) so cards stay the same
              height on mobile. The discount is already shown as the "-N%" badge
              over the image, so no "Save N%" pill is repeated here. */}
          <div className="flex items-baseline gap-2 mt-auto pt-1">
            <span className="text-sm font-bold text-gray-900">
              {currencySymbol}{price}
            </span>
            {origPrice && (
              <span className="text-xs line-through text-gray-400">
                {currencySymbol}{origPrice}
              </span>
            )}
          </div>
        </Link>
        </div>
      </div>

      {quickView && (
        <QuickViewModal product={product} onClose={() => setQuickView(false)} />
      )}
    </>
  );
};

export default ProductCard;
