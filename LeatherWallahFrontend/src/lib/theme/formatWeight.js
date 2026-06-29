// Display helper: convert grams to a readable label.
// 250    -> "250g"
// 1000   -> "1kg"
// 1500   -> "1.5kg"
// 25000  -> "25kg"
export function formatWeight(grams) {
  if (grams === null || grams === undefined || grams === "") return "";
  const n = Number(grams);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n >= 1000) {
    const kg = n / 1000;
    return Number.isInteger(kg) ? `${kg}kg` : `${kg.toFixed(1)}kg`;
  }
  return `${Math.round(n)}g`;
}
