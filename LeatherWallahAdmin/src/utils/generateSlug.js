// Phase 1 audit fix — any-ascii phonetic transliteration so Bangla / emoji /
// any non-ASCII slug input produces a URL-safe ASCII slug. Previously the slug
// kept literal Bangla characters which broke URL state in the storefront PDP
// (e.g. attribute_slug="কালার" → URL %-encoded gibberish on share).
//
// Same package + pattern as the product slug generator on backend
// (Phase 0.5 V3). Aligns admin + backend behaviour.
//
// Examples:
//   "Color"            → "color"
//   "Royal Cobalt"     → "royal-cobalt"
//   "কালার"           → "kalara"   (phonetic ASCII)
//   "নীল"             → "nila"
//   "প্রিমিয়াম পাঞ্জাবী" → "primiyama-panjabi"
//
// Empty / unconvertible input → "" (caller decides fallback; usually backend
// rejects empty slug or auto-generates).
import anyAscii from "any-ascii";

export const generateSlug = (input) => {
  if (input === null || input === undefined) return "";
  const str = String(input);
  // Transliterate any non-ASCII → ASCII phonetic, then normalise the standard
  // slug shape (lowercase, dash-separated, no leading/trailing dashes).
  return anyAscii(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
