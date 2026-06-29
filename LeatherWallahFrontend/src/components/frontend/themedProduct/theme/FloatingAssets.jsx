// Renders theme.floating_assets for a given page section.
// Position: left/right rail, opacity + animation per asset.
// Mobile: defaults to hidden (admin can override per-asset).

const SIZE_CLASS = {
  xs: "w-12 md:w-14",
  sm: "w-16 md:w-20",
  md: "w-24 md:w-28",
  lg: "w-32 md:w-44",
};

const animClass = (type, speed) => {
  if (!type || type === "none") return "";
  return `brand-anim-${type}-${speed || "normal"}`;
};

export default function FloatingAssets({ assets = [], section }) {
  if (!Array.isArray(assets) || assets.length === 0) return null;
  // MULTI-NICHE-DEBT: each PDP section component passes a hardcoded food `section`
  // string (hero/order/benefits/use_cases/nutrition/reviews/faq) here. When the PDP
  // section registry + pdp_section_array lands, those section names must come from the
  // active niche's registry so non-food PDPs can anchor floats. See docs/_ai/MULTI_NICHE_PLAN.md §4.
  // section can be a string or array of section names (for combined sections)
  const sections = Array.isArray(section) ? section : [section];
  const filtered = assets.filter(
    (a) => sections.includes(a.section) || a.section === "any",
  );
  if (filtered.length === 0) return null;

  // Smart side distribution: if a section has 2+ assets, force them to alternate
  // sides (left, right, left, right …) so they don't all pile on one side.
  // Single asset honours the admin's chosen position.
  const sideFor = (a, i) =>
    filtered.length > 1
      ? i % 2 === 0
        ? "left"
        : "right"
      : a.position || "left";

  // Vertical anchor inside the section. `align` (top/middle/bottom) is the
  // primary driver; a per-side collision offset keeps two same-align assets
  // on the same side from perfectly overlapping. Legacy assets without align
  // fall back to the old stagger band.
  const ALIGN_BASE = { top: 8, middle: 42, bottom: 72 };

  return (
    <>
      {filtered.map((a, i) => {
        const side = sideFor(a, i);
        const sideClass = side === "left" ? "left-0 md:left-2" : "right-0 md:right-2";
        // Floats are md+ only. On mobile the hero grid stacks with the product
        // image near full width, leaving no clean side gutter — a float there
        // either overlaps the product or hides behind it. So we hide floats on
        // small screens entirely (decorative-only; no content lost). The admin
        // "Show on mobile" toggle was removed to match this.
        const mobileClass = "hidden md:block";
        // how many earlier same-side assets share this slot → collision offset
        const sameSideIdx = filtered
          .slice(0, i)
          .filter((x, j) => sideFor(x, j) === side).length;
        const base =
          a.align && ALIGN_BASE[a.align] != null
            ? ALIGN_BASE[a.align]
            : 10 + (sameSideIdx % 4) * 35; // legacy stagger fallback
        // nudge stacked same-side assets ~8% apart, clamped to stay on-screen
        const top = `${Math.min(base + (a.align ? (sameSideIdx % 3) * 8 : 0), 88)}%`;
        return (
          <img
            key={i}
            src={a.asset_url}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className={`absolute pointer-events-none select-none ${sideClass} ${SIZE_CLASS[a.size] || SIZE_CLASS.md} ${animClass(a.animation_type, a.animation_speed)} ${mobileClass}`}
            style={{
              opacity: typeof a.opacity === "number" ? a.opacity : 1,
              zIndex: i,
              top,
            }}
          />
        );
      })}
    </>
  );
}
