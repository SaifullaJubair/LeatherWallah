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
  const filtered = assets.filter(
    (a) => a.section === section || a.section === "any",
  );
  if (filtered.length === 0) return null;

  return (
    <>
      {filtered.map((a, i) => {
        const sideClass = a.position === "left" ? "left-0 md:left-2" : "right-0 md:right-2";
        const mobileClass = a.hide_on_mobile === false ? "" : "hidden md:block";
        const top = `${10 + (i % 4) * 20}%`;
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
