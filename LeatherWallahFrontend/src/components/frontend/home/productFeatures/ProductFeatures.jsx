"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiCheck, FiHeart, FiShoppingCart, FiEye } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import useGetTrendingProducts from "@/components/lib/getTrendingProducts";
import useGetSettingData from "@/components/lib/getSettingData";
import { productPrice, lineThroughPrice } from "@/utils/helper";
import QuickViewModal from "@/components/shared/quickViewModal/QuickViewModal";
import Contain from "@/components/common/Contain";
import Reveal from "../boutique/reveal";
import { SectionHeading, MotionButton } from "../boutique/bits";
import useBoutiqueProductActions from "../boutique/useBoutiqueProductActions";

// Cap big feature rows so a large trending list doesn't make an endless page
// (edge-audit M2). The spotlight already shows products[0], so we start at 1.
const MAX_ROWS = 6;

// A small media carousel for the row: the selected variation's image first, then
// the main image, then the rest of the gallery. Square aspect so every row looks
// consistent (owner feedback: cashew was too tall).
//
// Videos used to autoplay here (variation_video). They are gone — several rows
// decoding video at once made the page feel laggy while scrolling, and it spent
// real mobile data on what is essentially a thumbnail. Video belongs on the
// product page, not in a listing.
function RowMedia({ product, activeVariation, alt }) {
  const slides = useMemo(() => {
    const list = [];
    // Selected variation image wins as the first slide.
    if (activeVariation?.variation_image) {
      list.push(activeVariation.variation_image);
    }
    if (product?.main_image) list.push(product.main_image);
    // gallery_images = full other-image list (boutique field, works for
    // variation products too); fall back to the first-only other_images.
    const gallery = Array.isArray(product?.gallery_images)
      ? product.gallery_images
      : product?.other_images
        ? Array.isArray(product.other_images)
          ? product.other_images
          : [product.other_images]
        : [];
    gallery.forEach((o) => {
      if (o?.other_image) list.push(o.other_image);
    });
    // De-dup, keep order.
    const seen = new Set();
    return list.filter((src) => src && !seen.has(src) && seen.add(src));
  }, [product, activeVariation]);

  if (!slides.length) {
    return (
      <div className="relative aspect-square w-full rounded-2xl bg-gray-100" />
    );
  }
  // A single image needs no carousel — just the image, with a gentle zoom.
  if (slides.length === 1) {
    return (
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md">
        <Image
          src={slides[0]}
          alt={alt}
          fill
          className="object-cover hover:scale-105 transition-transform duration-700"
          sizes="(max-width:768px) 92vw, 46vw"
        />
      </div>
    );
  }

  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      slidesPerView={1}
      loop
      autoplay={{ delay: 3500, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      className="rounded-2xl overflow-hidden shadow-md aspect-square w-full boutique-media-swiper"
    >
      {slides.map((src) => (
        <SwiperSlide key={src}>
          <div className="relative aspect-square w-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width:768px) 92vw, 46vw"
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function FeatureRow({ product, index, currency }) {
  const actions = useBoutiqueProductActions(product);

  // Variation chips — pack sizes. Selecting one swaps media + price (PDP-like).
  const options = Array.isArray(product?.variation_options)
    ? product.variation_options
    : [];
  const hasOptions = product?.is_variation && options.length > 0;
  // Default to the first pack size so price always shows and Buy/Cart always
  // has a valid variation (owner decision). Customer can change the chip.
  const [activeVar, setActiveVar] = useState(hasOptions ? options[0] : null);

  // Price reflects the selected variation when one is picked, else product base.
  const basePrice = productPrice(product);
  const baseOrig = lineThroughPrice(product);
  const price = activeVar
    ? activeVar.variation_discount_price || activeVar.variation_price
    : basePrice;
  const orig = activeVar
    ? activeVar.variation_discount_price
      ? activeVar.variation_price
      : null
    : baseOrig;

  const href = `/products/${product.product_slug}`;
  const imageLeft = index % 2 === 0;

  const benefits = Array.isArray(product.benefits) ? product.benefits.slice(0, 4) : [];
  const tiles = Array.isArray(product?.nutrition?.info_tiles)
    ? product.nutrition.info_tiles.slice(0, 3)
    : [];

  // Label for a chip — last word of the variation name (e.g. "… - ৫০০ গ্রাম").
  const chipLabel = (v) => {
    const n = v?.variation_name || "";
    const parts = n.split(" - ");
    return parts.length > 1 ? parts[parts.length - 1] : n;
  };

  const mediaBlock = (
    <Reveal y={28} className="w-full">
      <Link href={href} className="block relative">
        <RowMedia product={product} activeVariation={activeVar} alt={product.product_name} />
        {product.badge_text && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-primary-600">
            {product.badge_text}
          </span>
        )}
      </Link>
    </Reveal>
  );

  const textBlock = (
    <div className="flex flex-col justify-center gap-4">
      <Reveal as="h3" className="text-2xl sm:text-3xl font-bold text-gray-900">
        {product.product_name}
      </Reveal>
      {product.short_description && (
        <Reveal as="p" delay={0.05} className="text-gray-600 leading-relaxed">
          {product.short_description}
        </Reveal>
      )}

      {benefits.length > 0 && (
        <Reveal delay={0.1} as="ul" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 shrink-0">
                <FiCheck className="text-xs" />
              </span>
              {/* back-compat: legacy string rows vs new {text, icon_*} objects */}
              {typeof b === "string" ? b : b?.text}
            </li>
          ))}
        </Reveal>
      )}

      {tiles.length > 0 && (
        <Reveal delay={0.15} className="flex flex-wrap gap-2">
          {tiles.map((t, i) => (
            <span key={i} className="rounded-xl bg-[#FFF4EC] px-3 py-2 text-xs">
              <span className="font-bold text-primary-600">{t.value}</span>{" "}
              <span className="text-gray-500">{t.label}</span>
            </span>
          ))}
        </Reveal>
      )}

      {/* Variation chips — pick a pack size → media + price swap */}
      {hasOptions && (
        <Reveal delay={0.18} className="flex flex-wrap gap-2">
          {options.map((v) => {
            const selected = activeVar?._id === v._id;
            return (
              <MotionButton
                key={v._id}
                onClick={() => setActiveVar(v)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-primary-400"
                }`}
              >
                {chipLabel(v)}
              </MotionButton>
            );
          })}
        </Reveal>
      )}

      <Reveal delay={0.2} className="flex items-center gap-3 pt-1">
        <span className="text-xl font-bold text-primary-600 tabular-nums">
          {currency}
          {price}
        </span>
        {orig && orig > price && (
          <span className="text-gray-400 line-through tabular-nums">
            {currency}
            {orig}
          </span>
        )}
      </Reveal>

      {/* Quick actions — icon-only on mobile, icon+label on sm+ (saves space on
          small screens, clearer on larger). */}
      <Reveal delay={0.25} className="flex items-center gap-2.5 pt-1">
        <MotionButton
          onClick={() => actions.handleAddToCart(activeVar?._id || null)}
          aria-label="Add to cart"
          title="Add to cart"
          className="inline-flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-4 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-primary-600 hover:border-primary-400 transition-colors text-sm font-medium"
        >
          <FiShoppingCart className="shrink-0" />
          <span className="hidden sm:inline">Cart</span>
        </MotionButton>
        <MotionButton
          onClick={actions.toggleWishlist}
          aria-label="Wishlist"
          title="Wishlist"
          className={`inline-flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-4 rounded-full border transition-colors text-sm font-medium ${
            actions.wishlisted
              ? "bg-red-50 border-red-200 text-red-500"
              : "bg-white border-gray-200 text-gray-500 hover:text-red-500"
          }`}
        >
          <FiHeart className={`shrink-0 ${actions.wishlisted ? "fill-current" : ""}`} />
          <span className="hidden sm:inline">Wishlist</span>
        </MotionButton>
        <MotionButton
          onClick={() => actions.setQuickView(true)}
          aria-label="Quick view"
          title="Quick view"
          className="inline-flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-4 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-primary-600 hover:border-primary-400 transition-colors text-sm font-medium"
        >
          <FiEye className="shrink-0" />
          <span className="hidden sm:inline">View</span>
        </MotionButton>
      </Reveal>

      {/* Primary actions — Buy now (highlight) + View details (outline) */}
      <Reveal delay={0.3} className="flex flex-wrap items-center gap-3">
        <MotionButton
          onClick={() => actions.buyNow(activeVar?._id || null)}
          className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-7 py-3 rounded-full font-semibold transition-colors shadow-lg shadow-primary-500/25"
        >
          Order Now
        </MotionButton>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-semibold border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          View Details
        </Link>
      </Reveal>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14 items-center">
      {/* Mobile always image-first; desktop alternates. */}
      <div className={imageLeft ? "md:order-1" : "md:order-2"}>{mediaBlock}</div>
      <div className={imageLeft ? "md:order-2" : "md:order-1"}>{textBlock}</div>

      {actions.quickView && (
        <QuickViewModal product={product} onClose={() => actions.setQuickView(false)} />
      )}
    </div>
  );
}

export default function ProductFeatures() {
  const { data, isLoading } = useGetTrendingProducts();
  const { data: settingsData } = useGetSettingData();
  const currency = settingsData?.data?.[0]?.currency_symbol || "৳";

  const products = data?.data?.data || [];
  const rows = products.slice(1, 1 + MAX_ROWS);

  if (isLoading) {
    return (
      <div className="py-10">
        <Contain>
          <div className="space-y-10">
            {[0, 1].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </Contain>
      </div>
    );
  }
  if (!rows.length) return null;

  return (
    <section className="py-8 md:py-16">
      <Contain>
        <SectionHeading
          eyebrow="Our Collection"
          title="Handpicked Leather Essentials"
          subtitle="Every piece is carefully selected — genuine leather, expert craftsmanship, built to last."
        />
        <div className="space-y-6 md:space-y-10">
          {rows.map((p, i) => (
            <div
              key={p._id}
              className={`rounded-3xl p-5 sm:p-8 md:p-12 ${
                i % 2 === 1 ? "bg-[#FFF9F2]" : "bg-white shadow-sm ring-1 ring-gray-100"
              }`}
            >
              <FeatureRow product={p} index={i} currency={currency} />
            </div>
          ))}
        </div>
      </Contain>
    </section>
  );
}
