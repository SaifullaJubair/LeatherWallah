"use client";

import { motion, useReducedMotion } from "framer-motion";
import Reveal from "./reveal";

/**
 * Shared visual bits for the boutique home — keeps the 3 sections consistent
 * (one rhythm, one type scale) per ui-ux-pro-max §6 hierarchy + §4 consistency.
 */

// Eyebrow + heading + optional subtitle, center or left aligned.
export function SectionHeading({ eyebrow, title, subtitle, align = "center" }) {
  const alignCls = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col gap-2 ${alignCls} mb-8 md:mb-12`}>
      {eyebrow && (
        <Reveal as="span" className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
          {eyebrow}
        </Reveal>
      )}
      <Reveal as="h2" delay={0.05} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight max-w-2xl">
        {title}
      </Reveal>
      {subtitle && (
        <Reveal as="p" delay={0.1} className="text-gray-500 text-base sm:text-lg max-w-xl">
          {subtitle}
        </Reveal>
      )}
    </div>
  );
}

/**
 * Soft ambient color blob behind hero/feature content. Pure decoration — fully
 * skipped under prefers-reduced-motion and aria-hidden. Gives depth without
 * heavy imagery (§4 effects-match-style). `tone` = "warm" | "green".
 */
export function GlowBlob({ tone = "warm", className = "" }) {
  const reduce = useReducedMotion();
  const color = tone === "green" ? "rgba(47,158,68,0.18)" : "rgba(232,89,12,0.16)";
  const base = (
    <div
      aria-hidden
      className={`pointer-events-none absolute -z-0 rounded-full blur-3xl ${className}`}
      style={{ background: color }}
    />
  );
  if (reduce) return base;
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute -z-0 rounded-full blur-3xl ${className}`}
      style={{ background: color }}
      animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/**
 * MotionButton — a button with a subtle press-scale (§7 scale-feedback) that
 * respects reduced-motion. Drop-in replacement for <button>.
 */
export function MotionButton({ children, className = "", ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <button className={className} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      className={className}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

// Subtle curved divider between sections (SVG wave). Decorative, aria-hidden.
// `flip` mirrors it so consecutive dividers don't look repetitive.
export function WaveDivider({ flip = false, color = "#FFF9F2" }) {
  return (
    <div aria-hidden className="w-full overflow-hidden leading-[0] -mb-px" style={{ transform: flip ? "scaleX(-1)" : "none" }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-10 md:h-16">
        <path d="M0,40 C240,80 480,0 720,32 C960,64 1200,16 1440,48 L1440,80 L0,80 Z" fill={color} />
      </svg>
    </div>
  );
}
