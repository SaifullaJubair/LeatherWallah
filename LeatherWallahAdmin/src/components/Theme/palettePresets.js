// Curated colour palettes for the Theme form. Each preset supplies the 3 base
// colors the form asks for (primary / page_bg / accent); the backend derives the
// remaining shades on save. Click-to-apply in the Theme form.
//
// Spread deliberately across the hue wheel, not just browns. A leather/footwear
// catalogue is NOT obliged to be tan — Nike is black/white, Adidas blue, Puma
// red, Dr. Martens black + yellow, Clarks navy. An earlier version of this list
// was 15 shades of brown with a near-identical gold accent on every one, so the
// swatches were indistinguishable in the picker. Each entry below now differs in
// BOTH the primary and the accent.
//
// The first one is the live site's own burgundy + gold, so "Reset to suggested"
// lands on brand.
export const PALETTE_PRESETS = [
  // — brand + classic leather —
  { name: "Burgundy Gold", primary: "#6B1A1F", page_bg: "#FAF7F2", accent: "#D4AF37" },
  { name: "Tan & Cream", primary: "#A0522D", page_bg: "#FDF8F3", accent: "#2E7D6B" },
  { name: "Espresso", primary: "#3E2723", page_bg: "#FAF7F4", accent: "#E08A3C" },

  // — mono / monochrome (the biggest footwear brands live here) —
  { name: "Jet Black", primary: "#161616", page_bg: "#FAFAFA", accent: "#E5484D" },
  { name: "Charcoal Lime", primary: "#2F3438", page_bg: "#F7F8F9", accent: "#A3E635" },
  { name: "Stone Grey", primary: "#57606A", page_bg: "#F6F8FA", accent: "#F59E0B" },

  // — blues —
  { name: "Midnight Navy", primary: "#1B2A41", page_bg: "#F6F8FB", accent: "#F0A202" },
  { name: "Cobalt Blue", primary: "#1D4ED8", page_bg: "#F5F8FF", accent: "#FBBF24" },
  { name: "Teal Slate", primary: "#0F5257", page_bg: "#F3FAFA", accent: "#F2683C" },

  // — greens —
  { name: "Forest Green", primary: "#1F4D36", page_bg: "#F5F9F6", accent: "#D4AF37" },
  { name: "Olive Suede", primary: "#4F5D2F", page_bg: "#F9FAF3", accent: "#E86A33" },

  // — reds / warm brights —
  { name: "Crimson Red", primary: "#B91C1C", page_bg: "#FFF6F5", accent: "#1F2937" },
  { name: "Rust Orange", primary: "#C2410C", page_bg: "#FFF8F3", accent: "#0F766E" },

  // — cool / statement —
  { name: "Royal Purple", primary: "#5B21B6", page_bg: "#F9F6FF", accent: "#F5B301" },
  { name: "Ink & Sand", primary: "#22303C", page_bg: "#FBF8F2", accent: "#C99B5B" },
];
