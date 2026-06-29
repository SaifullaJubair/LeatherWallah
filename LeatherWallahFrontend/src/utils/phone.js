/**
 * phone.js — Bangladesh phone normalization (F1.3, 2026-06-20).
 *
 * Frontend mirror of the backend `src/utils/phone.ts` `normalizeBdPhone`.
 *
 * WHY: the logged-in checkout used `user_phone.slice(3, 14)`, which only works
 * if the stored phone is E.164 `+8801XXXXXXXXX` (14 chars). Legacy/odd shapes
 * (`01XXXXXXXXX`, `8801…`) produced garbage. Guests already submit E.164 from
 * the PhoneInput, so orders ended up holding two formats. This helper boils any
 * BD mobile shape down to E.164 so the FE submits ONE consistent format,
 * symmetric with the backend (which also normalizes on receipt).
 *
 * Conservative: inputs that don't look like a recognizable BD mobile number are
 * returned trimmed-but-unchanged so a clone deployed for a shop with foreign
 * customers never gets garbled phones.
 */

const BD_OPERATOR_PREFIXES = ["13", "14", "15", "16", "17", "18", "19"];

const digitsOnly = (s) => String(s).replace(/\D+/g, "");

/**
 * Convert any BD mobile shape to E.164 (`+8801XXXXXXXXX`).
 *   "+8801711123456" → "+8801711123456"
 *   "8801711123456"  → "+8801711123456"
 *   "01711123456"    → "+8801711123456"
 *   "1711123456"     → "+8801711123456"
 *   "+11234567890"   → "+11234567890" (foreign — left alone, just trimmed)
 */
export const normalizeBdPhone = (input) => {
  if (!input) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";

  const digits = digitsOnly(trimmed);

  // 13-digit "8801XXXXXXXXX" → prepend "+"
  if (digits.length === 13 && digits.startsWith("880")) {
    const op = digits.substring(3, 5);
    if (BD_OPERATOR_PREFIXES.includes(op)) return `+${digits}`;
  }
  // 11-digit "01XXXXXXXXX" → prepend "+880"
  if (digits.length === 11 && digits.startsWith("0")) {
    const op = digits.substring(1, 3);
    if (BD_OPERATOR_PREFIXES.includes(op)) return `+880${digits.substring(1)}`;
  }
  // 10-digit "1XXXXXXXXX" (no leading 0/country code) → prepend "+880"
  if (digits.length === 10 && digits.startsWith("1")) {
    const op = digits.substring(0, 2);
    if (BD_OPERATOR_PREFIXES.includes(op)) return `+880${digits}`;
  }
  // Not a recognizable BD mobile — return trimmed original (clone-safe).
  return trimmed;
};
