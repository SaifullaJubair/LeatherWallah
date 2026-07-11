// Curated leather/footwear colour palettes for the Theme form. Each preset
// supplies the 3 base colors the form asks for (primary / page_bg / accent);
// the backend derives the remaining shades on save. Click-to-apply in the form.
//
// Picked for warm, premium, high-contrast looks that read well on a product
// page — the tones a leather catalogue actually lives in (tans, browns,
// oxbloods, charcoals) rather than a generic rainbow. The first one is the
// live site's own burgundy + gold, so "Reset to suggested" lands on brand.
export const PALETTE_PRESETS = [
  { name: "Burgundy Gold", primary: "#6B1A1F", page_bg: "#FAF7F2", accent: "#D4AF37" },
  { name: "Tan Leather", primary: "#A0522D", page_bg: "#FDF8F3", accent: "#C9A227" },
  { name: "Espresso", primary: "#3E2723", page_bg: "#FAF7F4", accent: "#D7A86E" },
  { name: "Cognac", primary: "#8D4004", page_bg: "#FFF8F1", accent: "#E0B252" },
  { name: "Oxblood", primary: "#4A0E12", page_bg: "#FBF5F5", accent: "#C0A062" },
  { name: "Charcoal", primary: "#2F3438", page_bg: "#F7F8F9", accent: "#C9A227" },
  { name: "Camel", primary: "#B07D3E", page_bg: "#FFFBF4", accent: "#4E3620" },
  { name: "Walnut", primary: "#5C4033", page_bg: "#FAF6F2", accent: "#CBA35C" },
  { name: "Chestnut", primary: "#7B3F00", page_bg: "#FFF8F0", accent: "#D9B382" },
  { name: "Forest Green", primary: "#1F4D36", page_bg: "#F5F9F6", accent: "#C9A227" },
  { name: "Midnight Navy", primary: "#1B2A41", page_bg: "#F6F8FB", accent: "#C8A96A" },
  { name: "Olive Suede", primary: "#4F5D2F", page_bg: "#F9FAF3", accent: "#C08B4E" },
  { name: "Slate Grey", primary: "#4A5568", page_bg: "#F7F9FB", accent: "#B8935A" },
  { name: "Sand Beige", primary: "#8C7355", page_bg: "#FDFBF6", accent: "#3E2C1C" },
  { name: "Ivory Cream", primary: "#6D5D4B", page_bg: "#FFFDF8", accent: "#B8860B" },
];
