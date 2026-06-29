// Per-product floating accent images, placed across the whole PDP height with
// percentage-based positioning (responsive-safe). Each image carries:
//   asset_url, vertical ("10".."85" or "" = auto), side (left/right),
//   layer (behind=z-0 / front=z-5), size (sm/md/lg).
// Rendered ONCE inside the themed PDP wrapper, absolutely positioned over the
// full page. Behind-layer images sit under the content (sunrise/peek effect);
// front-layer float over it but never block clicks (pointer-events:none).
// Mobile: shown smaller + dimmer (not hidden) so the theme still reads.

const SIZE = {
  sm: "w-14 md:w-20",
  md: "w-20 md:w-28",
  lg: "w-28 md:w-44",
};

// Auto vertical slots used when admin leaves `vertical` empty — spreads images
// down the page so they don't pile up.
const AUTO_SLOTS = ["12", "30", "48", "66", "84"];

export default function ProductFloatingImages({ images = [] }) {
  const list = (images || []).filter((im) => im?.asset_url);
  if (list.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {list.map((im, i) => {
        const vertical = im.vertical || AUTO_SLOTS[i % AUTO_SLOTS.length];
        const side = im.side === "right" ? "right" : "left";
        const front = im.layer === "front";
        return (
          <img
            key={i}
            src={im.asset_url}
            alt=""
            loading="lazy"
            className={`absolute select-none brand-anim-float-slow ${SIZE[im.size] || SIZE.md} opacity-60 md:opacity-100`}
            style={{
              top: `${vertical}%`,
              [side]: "0px",
              // behind content → z 0 (under the page sections), front → above.
              zIndex: front ? 5 : 0,
              // nudge slightly off-screen so they "peek" from the edges
              transform: side === "left" ? "translateX(-25%)" : "translateX(25%)",
            }}
          />
        );
      })}
    </div>
  );
}
