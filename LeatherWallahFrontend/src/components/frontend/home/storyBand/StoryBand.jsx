"use client";

import Image from "next/image";
import Link from "next/link";
import { FiCheckCircle } from "react-icons/fi";
import Contain from "@/components/common/Contain";
import Reveal from "../boutique/reveal";
import { GlowBlob } from "../boutique/bits";

// Niche-neutral trust pills under the story copy. Sensible defaults; a
// future setting could make these editable, but they read true for any shop.
const TRUST_PILLS = ["100% Genuine Leather", "Handcrafted", "Fast Home Delivery", "Quality Assured"];

/**
 * Story Band — the calm "why us / brand story" beat between product rows.
 * Boutique preset section. Reuses the existing `brand_story_*` settings (same
 * fields the marketplace BrandStory reads) so the admin fills it in ONE place;
 * this is just the premium, animated, full-bleed presentation.
 *
 * Auto-hides when there's no story content (edge-audit H2). Trust points are a
 * separate home section (`trust_strip`) — not duplicated here.
 */
export default function StoryBand({ settings }) {
  const title = settings?.brand_story_title || "";
  const text = settings?.brand_story_text || "";
  const imageUrl = settings?.brand_story_image_url || settings?.brand_story_image || "";
  const ctaLabel = settings?.brand_story_cta_label || "";
  const ctaUrl = settings?.brand_story_cta_url || "";

  if (!text && !imageUrl && !title) return null;

  return (
    <section className="py-6 md:py-14">
      <Contain>
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center rounded-3xl overflow-hidden bg-gradient-to-tr from-[#F4FBF5] to-[#FFF9F2] p-6 sm:p-10 lg:p-16">
          <GlowBlob tone="green" className="w-72 h-72 -top-20 right-10" />
          {/* Image */}
          {imageUrl && (
            <Reveal y={32} className="order-1">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={imageUrl}
                  alt={title || "Our story"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 46vw"
                />
              </div>
            </Reveal>
          )}

          {/* Copy */}
          <div className="relative z-10 order-2 flex flex-col gap-5">
            <Reveal as="span" className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
              About Us
            </Reveal>
            {title && (
              <Reveal as="h2" delay={0.04} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                {title}
              </Reveal>
            )}
            {text && (
              <Reveal as="p" delay={0.08} className="text-gray-600 text-lg sm:text-xl leading-relaxed whitespace-pre-line">
                {text}
              </Reveal>
            )}
            <Reveal delay={0.12} className="flex flex-wrap gap-2 pt-1">
              {TRUST_PILLS.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3.5 py-1.5 text-sm text-gray-700">
                  <FiCheckCircle className="text-green-500 shrink-0" />
                  {p}
                </span>
              ))}
            </Reveal>
            {ctaLabel && ctaUrl && (
              <Reveal delay={0.16}>
                <Link
                  href={ctaUrl}
                  className="inline-block self-start bg-primary-500 hover:bg-primary-600 text-white px-7 py-3.5 rounded-full font-semibold transition-colors"
                >
                  {ctaLabel}
                </Link>
              </Reveal>
            )}
          </div>
        </div>
      </Contain>
    </section>
  );
}
