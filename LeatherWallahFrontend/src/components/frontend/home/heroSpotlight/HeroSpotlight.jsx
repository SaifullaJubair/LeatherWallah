"use client";

import Image from "next/image";
import Link from "next/link";
import { FiHeart, FiShoppingCart, FiEye } from "react-icons/fi";
import { motion, useReducedMotion } from "framer-motion";

import useGetTrendingProducts from "@/components/lib/getTrendingProducts";
import useGetSettingData from "@/components/lib/getSettingData";
import { productPrice, lineThroughPrice } from "@/utils/helper";
import QuickViewModal from "@/components/shared/quickViewModal/QuickViewModal";
import Contain from "@/components/common/Contain";
import Reveal from "../boutique/reveal";
import { GlowBlob, MotionButton } from "../boutique/bits";
import useBoutiqueProductActions from "../boutique/useBoutiqueProductActions";

/**
 * Hero Spotlight — one star product, big and cinematic. Boutique preset section.
 *
 * Source: the FIRST trending product (admin controls it via the existing
 * trending flag — no separate picker). Auto-hides if there are no trending
 * products (edge-audit H2). Sits BELOW the banner/slider hero, not a
 * replacement (owner decision).
 */
export default function HeroSpotlight() {
  const { data, isLoading } = useGetTrendingProducts();
  const { data: settingsData } = useGetSettingData();
  const currency = settingsData?.data?.[0]?.currency_symbol || "৳";
  const reduce = useReducedMotion();

  const products = data?.data?.data || [];
  const product = products[0];

  const actions = useBoutiqueProductActions(product);

  if (isLoading) {
    return (
      <div className="py-10">
        <Contain>
          <div className="h-[60vh] rounded-3xl bg-gray-100 animate-pulse" />
        </Contain>
      </div>
    );
  }
  if (!product) return null; // H2 — nothing to spotlight

  const price = productPrice(product);
  const orig = lineThroughPrice(product);
  const href = `/products/${product.product_slug}`;

  // Hero has no inline variation picker, so for a variation product Cart / Buy
  // open QuickView (to choose a pack size); a simple product acts directly.
  const onCart = () =>
    product.is_variation ? actions.setQuickView(true) : actions.handleAddToCart(null);
  const onBuyNow = () =>
    product.is_variation ? actions.setQuickView(true) : actions.buyNow(null);

  return (
    <section className="py-6 md:py-12">
      <Contain>
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center rounded-3xl overflow-hidden bg-gradient-to-br from-[#FFF4EC] to-[#FFF9F2] p-6 sm:p-10 lg:p-16">
          {/* Ambient depth (decorative) */}
          <GlowBlob tone="warm" className="w-72 h-72 -top-16 -left-10" />
          <GlowBlob tone="green" className="w-64 h-64 -bottom-20 right-0" />

          {/* Copy */}
          <div className="relative z-10 order-2 lg:order-1 flex flex-col gap-5">
            <Reveal as="span" className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
              ★ Today's Featured Pick
            </Reveal>
            {product.badge_text && (
              <Reveal as="span" delay={0.04} className="self-start rounded-full bg-primary-500/10 text-primary-600 px-4 py-1.5 text-sm font-semibold">
                {product.badge_text}
              </Reveal>
            )}
            <Reveal as="h2" delay={0.05} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900">
              {product.product_name}
            </Reveal>
            {product.short_description && (
              <Reveal as="p" delay={0.1} className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl">
                {product.short_description}
              </Reveal>
            )}
            <Reveal delay={0.15} className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-primary-600 tabular-nums">
                {currency}
                {price}
              </span>
              {orig && orig > price && (
                <span className="text-lg text-gray-400 line-through tabular-nums">
                  {currency}
                  {orig}
                </span>
              )}
            </Reveal>
            {/* Quick actions — icon-only on mobile, icon+label on sm+ */}
            <Reveal delay={0.2} className="flex items-center gap-2.5 pt-2">
              <MotionButton
                onClick={onCart}
                aria-label="Add to cart"
                title="Add to cart"
                className="inline-flex items-center justify-center gap-2 h-12 w-12 sm:w-auto sm:px-4 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-primary-600 hover:border-primary-400 transition-colors text-sm font-medium"
              >
                <FiShoppingCart className="shrink-0" />
                <span className="hidden sm:inline">Cart</span>
              </MotionButton>
              <MotionButton
                onClick={actions.toggleWishlist}
                aria-label="Wishlist"
                title="Wishlist"
                className={`inline-flex items-center justify-center gap-2 h-12 w-12 sm:w-auto sm:px-4 rounded-full border transition-colors text-sm font-medium ${
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
                className="inline-flex items-center justify-center gap-2 h-12 w-12 sm:w-auto sm:px-4 rounded-full border border-gray-200 bg-white text-gray-600 hover:text-primary-600 hover:border-primary-400 transition-colors text-sm font-medium"
              >
                <FiEye className="shrink-0" />
                <span className="hidden sm:inline">View</span>
              </MotionButton>
            </Reveal>

            {/* Primary — Buy now (highlight) + View details (outline) */}
            <Reveal delay={0.25} className="flex flex-wrap items-center gap-3">
              <MotionButton
                onClick={onBuyNow}
                className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-full font-semibold transition-colors shadow-lg shadow-primary-500/25"
              >
                Order Now
              </MotionButton>
              <Link
                href={href}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full font-semibold border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
              >
                View Details
              </Link>
            </Reveal>
          </div>

          {/* Image — gentle float (decorative; halts under reduced-motion) */}
          <Reveal delay={0.1} y={32} className="relative z-10 order-1 lg:order-2">
            <motion.div
              animate={reduce ? undefined : { y: [0, -12, 0] }}
              transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="block relative aspect-square w-full max-w-lg mx-auto"
            >
              <Link href={href} className="block relative w-full h-full">
                <Image
                  src={product.main_image || "/assets/images/placeholder.jpg"}
                  alt={product.product_name}
                  fill
                  priority
                  className="object-cover rounded-2xl shadow-xl"
                  sizes="(max-width: 1024px) 90vw, 45vw"
                />
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </Contain>

      {actions.quickView && (
        <QuickViewModal product={product} onClose={() => actions.setQuickView(false)} />
      )}
    </section>
  );
}
