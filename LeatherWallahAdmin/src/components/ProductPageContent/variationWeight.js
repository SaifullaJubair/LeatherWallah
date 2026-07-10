// Grams ⇄ display-unit conversion for the variation table.
//
// Shared by VariationWeightEditor (renders the inputs) and
// ProductPageContentForm (converts back on save + diffs against the server
// baseline). Kept out of the component file so Fast Refresh still works there.

// NOTE: deliberately no toFixed(2). It used to round 1234 g to "1.23" kg, which
// converts back to 1230 g — so merely opening the Variations tab and pressing
// the single top Save would silently shave grams off every kg-range variation
// (1999→2000, 12345→12350). That weight feeds the Pathao courier cost. Full
// precision round-trips exactly; the form additionally only sends rows the
// admin actually changed.
export const gramsToDisplay = (g) => {
  if (g === null || g === undefined || g === "") return { value: "", unit: "g" };
  if (g >= 1000) return { value: String(g / 1000), unit: "kg" };
  return { value: String(g), unit: "g" };
};

export const displayToGrams = (value, unit) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return unit === "kg" ? Math.round(n * 1000) : Math.round(n);
};
