"use client";
import { useEffect, useState } from "react";
import ReactSlider from "react-slider";
import { numberWithCommas } from "../utils/numberWithComa";

// Fix #24 — was hardcoded `max=5000` even though backend already returns
// `filterData.maxPriceRange` (variation-aware after Fix #22c). The two min/max
// readouts were also non-interactive `<span>` boxes — admins/customers
// expected to type a value. This rewrite:
//   - honours the backend max (falls back to 5000 only if missing)
//   - turns the readouts into number inputs, clamped to [1, maxRange]
//   - keeps the slider and the inputs in sync (slider drag → input updates,
//     input blur → slider thumb moves)
const PriceRangeFilter = ({ onChange, filterData, initialMin, initialMax }) => {
  const maxRange =
    Number(filterData?.maxPriceRange) > 0
      ? Number(filterData.maxPriceRange)
      : 5000;
  // Fix #26 — seed from parent's URL-driven initial values so a refresh
  // restores the slider position. Falls back to [1, maxRange] when not pinned.
  const [priceRange, setPriceRange] = useState(() => [
    Number.isFinite(initialMin) && initialMin > 0 ? initialMin : 1,
    Number.isFinite(initialMax) && initialMax > 0
      ? Math.min(initialMax, maxRange)
      : maxRange,
  ]);

  // Re-sync when backend maxRange becomes known (initial mount may run before
  // filterData has loaded) — but never lower the user's chosen max past their
  // pick.
  useEffect(() => {
    setPriceRange((prev) => [prev[0], Math.min(prev[1], maxRange)]);
  }, [maxRange]);

  const apply = (range) => {
    setPriceRange(range);
    onChange({ min: range[0], max: range[1] });
  };

  const handleSliderChange = (newRange) => apply(newRange);

  const handleInputChange = (idx) => (e) => {
    const raw = Number(e.target.value);
    if (Number.isNaN(raw)) return;
    const next = [...priceRange];
    next[idx] = raw;
    // Live update on type — don't clamp aggressively so admin can type "1500"
    // through "1", "15", "150", "1500" without each digit being rewritten.
    setPriceRange(next);
  };

  const handleInputBlur = (idx) => () => {
    const next = [...priceRange];
    // Clamp on blur: min ∈ [1, max-1], max ∈ [min+1, maxRange].
    if (idx === 0) {
      next[0] = Math.max(1, Math.min(next[0] || 1, next[1] - 1));
    } else {
      next[1] = Math.max(next[0] + 1, Math.min(next[1] || maxRange, maxRange));
    }
    apply(next);
  };

  return (
    <div className="flex flex-col gap-5 items-center ">
      <ReactSlider
        min={1}
        max={maxRange}
        step={1}
        value={priceRange}
        onChange={handleSliderChange}
        className="w-full"
        trackClassName="track"
        thumbClassName="thumb"
      />
      <div className="flex items-center justify-between gap-2 mt-2 w-full">
        <input
          type="number"
          min={1}
          max={priceRange[1] - 1}
          value={priceRange[0]}
          onChange={handleInputChange(0)}
          onBlur={handleInputBlur(0)}
          className="w-20 px-2 py-1 border border-primary rounded text-base lg:text-lg text-center focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Minimum price"
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          min={priceRange[0] + 1}
          max={maxRange}
          value={priceRange[1]}
          onChange={handleInputChange(1)}
          onBlur={handleInputBlur(1)}
          className="w-24 px-2 py-1 border border-primary rounded text-base lg:text-lg text-center focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Maximum price"
        />
        <span className="sr-only">{numberWithCommas(priceRange[1])}</span>
      </div>
    </div>
  );
};

export default PriceRangeFilter;
