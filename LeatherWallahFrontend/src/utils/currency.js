/**
 * currency.js — M28: client-side currency formatter reading from settings.
 *
 * WHY: storefront had ~50 hardcoded "৳" / "BDT" literals across price cards,
 * PDP metadata, analytics events, JSON-LD, order history, etc. Clone buyers in
 * other countries had to grep + replace. This utility centralizes the lookup
 * so every price display reads from `setting.currency_symbol` /
 * `currency_code` / `currency_name` (M28 added to backend setting model).
 *
 * Three display modes (matches the Admin CurrencySymbol "Live Preview"):
 *   symbol → "৳500"  (prefix, default — most price cards)
 *   code   → "BDT 500" (analytics events, JSON-LD priceCurrency, gateway calls)
 *   name   → "500 টাকা" (prose contexts — SMS/email body, order confirmation)
 *
 * Fallbacks match the backend helper defaults so SSR and CSR agree on the same
 * output when settings are missing (fresh install / unconfigured clone).
 *
 * Usage:
 *   import { formatCurrency, currencyOf } from "@/utils/currency";
 *   formatCurrency(500, "symbol", settings) // "৳500"
 *   formatCurrency(500, "name", settings)   // "500 টাকা"
 *   currencyOf(settings).code               // "BDT" (for analytics events)
 */

const FALLBACK = {
  symbol: "৳",
  code: "BDT",
  name: "টাকা",
};

/**
 * Read currency tri-field from a settings object.
 * Accepts either the raw settings doc OR the API response shape
 * `{ data: [doc] }` since both shapes exist in the codebase.
 */
export const currencyOf = (settings) => {
  // Handle both `settings` (doc) and `settings.data[0]` (RTK Query payload)
  const doc = Array.isArray(settings?.data)
    ? settings.data[0]
    : settings?.data || settings;
  return {
    symbol: doc?.currency_symbol || FALLBACK.symbol,
    code: doc?.currency_code || FALLBACK.code,
    name: doc?.currency_name || FALLBACK.name,
  };
};

/**
 * Format `amount` with the currency in `settings`, in the chosen mode.
 * Returns a string. `amount` is rendered as-is (no rounding) so callers keep
 * control over decimals.
 */
export const formatCurrency = (amount, mode = "symbol", settings) => {
  const cur = currencyOf(settings);
  const value = amount === null || amount === undefined ? "" : amount;
  switch (mode) {
    case "code":
      return `${cur.code} ${value}`;
    case "name":
      return `${value} ${cur.name}`;
    case "symbol":
    default:
      return `${cur.symbol}${value}`;
  }
};

/**
 * Standalone currency code accessor — for places that just need the ISO 4217
 * code (analytics events, JSON-LD priceCurrency, payment gateway calls). Same
 * fallback discipline as the other helpers.
 */
export const getCurrencyCode = (settings) => currencyOf(settings).code;
