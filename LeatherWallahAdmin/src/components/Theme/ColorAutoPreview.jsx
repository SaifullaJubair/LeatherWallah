// Lightweight client-side color preview — gives admin a feel of what
// the backend's chroma-js auto-gen will produce for derived shades.
// Backend remains the source of truth on save.

const clamp = (n, min = 0, max = 255) => Math.min(max, Math.max(min, n));

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
};
const rgbToHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("");

// crude approximation of chroma's brighten/darken via channel scaling
const lighten = (hex, amount = 0.4) => {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex({
    r: c.r + (255 - c.r) * amount,
    g: c.g + (255 - c.g) * amount,
    b: c.b + (255 - c.b) * amount,
  });
};
const darken = (hex, amount = 0.3) => {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex({
    r: c.r * (1 - amount),
    g: c.g * (1 - amount),
    b: c.b * (1 - amount),
  });
};
const mix = (a, b, t = 0.08) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  return rgbToHex({
    r: ca.r * (1 - t) + cb.r * t,
    g: ca.g * (1 - t) + cb.g * t,
    b: ca.b * (1 - t) + cb.b * t,
  });
};

const ColorAutoPreview = ({ primary, page_bg, accent }) => {
  if (!primary || !page_bg || !accent) {
    return (
      <p className="text-xs text-gray-400">
        Primary, Page Bg, Accent তিনটাই দিলে auto-generated shades দেখাবে।
      </p>
    );
  }

  const generated = {
    primary_light: lighten(primary, 0.55),
    primary_dark: darken(primary, 0.35),
    heading_text: darken(primary, 0.55),
    body_text: darken(primary, 0.45),
    section_bg: mix(page_bg, primary, 0.08),
  };

  const swatches = [
    { label: "Primary", value: primary, source: "input" },
    { label: "Page bg", value: page_bg, source: "input" },
    { label: "Accent", value: accent, source: "input" },
    { label: "Primary Light", value: generated.primary_light, source: "auto" },
    { label: "Primary Dark", value: generated.primary_dark, source: "auto" },
    { label: "Heading", value: generated.heading_text, source: "auto" },
    { label: "Body", value: generated.body_text, source: "auto" },
    { label: "Section bg", value: generated.section_bg, source: "auto" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {swatches.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 p-2 border rounded-md bg-white"
        >
          <span
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: s.value }}
          />
          <div className="text-xs">
            <div className="font-medium text-gray-700">{s.label}</div>
            <div className="text-gray-400 font-mono text-[10px]">
              {s.value} {s.source === "auto" && <span className="text-blue-500">auto</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ColorAutoPreview;
