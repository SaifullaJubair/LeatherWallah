"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Reveal — a thin Framer Motion wrapper for the boutique home sections.
 *
 * Animates children in once when they scroll into view (fade + small rise).
 * Respects `prefers-reduced-motion`: when the OS asks for reduced motion we
 * render the element statically (no transform/opacity animation) — same policy
 * as the PDP floating images. (Edge-audit H1.)
 *
 * Props:
 *   as        — element/tag to render (default "div")
 *   delay     — stagger delay in seconds
 *   y         — initial vertical offset in px (default 24)
 *   once      — animate only the first time (default true)
 */
export default function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 24,
  once = true,
  className = "",
  ...rest
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
