/**
 * AdvancePayPicker — F1b.
 *
 * Phase C3 partial / advance pay. Buyer pays X% online to confirm the order;
 * the rest is collected COD on delivery. Visible only when:
 *   - settings.advance_payment_enabled
 *   - the main payment_method is "cod" (advance only makes sense on top of COD —
 *     online methods already charge the full amount)
 *   - settings.advance_payment_methods has at least one allowed method
 *
 * Outputs (controlled by parent):
 *   - advanceEnabled: boolean
 *   - advanceMethod: one of "sslcommerz" | "manual_mfs" | "bank_transfer"
 *   - advanceAmount: number (auto-clamped to ≥ minPct of grand_total)
 *
 * Server re-validates everything (allow-list, minPct) in recomputeOrderTotals;
 * the UI here is just convenience + transparency.
 */

"use client";
import { useEffect, useMemo } from "react";

const METHOD_LABEL = {
  sslcommerz: "SSLCommerz",
  manual_mfs: "Mobile Wallet (bKash / Nagad)",
  bank_transfer: "Bank Transfer",
};

const AdvancePayPicker = ({
  settings,
  paymentMethod, // main method — advance only shown when "cod"
  grandTotal,
  advanceEnabled,
  setAdvanceEnabled,
  advanceMethod,
  setAdvanceMethod,
  advanceAmount,
  setAdvanceAmount,
}) => {
  if (!settings?.advance_payment_enabled) return null;
  if (paymentMethod !== "cod") return null;

  const allowedMethods = (settings?.advance_payment_methods || []).filter(
    (m) => METHOD_LABEL[m],
  );
  if (!allowedMethods.length) return null;

  const minPct = Number(settings?.advance_payment_min_percent) || 20;
  const minAmount = Math.ceil(((Number(grandTotal) || 0) * minPct) / 100);

  // Default amount = minAmount; default method = first allowed.
  useEffect(() => {
    if (advanceEnabled) {
      if (!advanceMethod) setAdvanceMethod(allowedMethods[0]);
      if (!advanceAmount || Number(advanceAmount) < minAmount) {
        setAdvanceAmount(minAmount);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceEnabled, minAmount, allowedMethods.join(",")]);

  return (
    <div className="bg-white shadow-sm p-5 mt-3 rounded">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!advanceEnabled}
          onChange={(e) => setAdvanceEnabled(e.target.checked)}
          className="mt-1.5 accent-primary"
        />
        <div className="flex-1">
          <p className="font-medium text-gray-800">
            Pay {minPct}% advance, rest on delivery
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-pay at least ৳{minAmount} now online; the courier collects the
            rest in cash on delivery.
          </p>
        </div>
      </label>

      {advanceEnabled && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {/* Advance method picker */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Advance method
            </label>
            <div className="flex flex-wrap gap-2">
              {allowedMethods.map((m) => (
                <label
                  key={m}
                  className={`px-3 py-2 text-sm border rounded cursor-pointer ${
                    advanceMethod === m
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="advance_method"
                    value={m}
                    checked={advanceMethod === m}
                    onChange={(e) => setAdvanceMethod(e.target.value)}
                    className="mr-2 accent-primary"
                  />
                  {METHOD_LABEL[m] || m}
                </label>
              ))}
            </div>
          </div>

          {/* Advance amount input */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Advance amount (৳)
            </label>
            <input
              type="number"
              min={minAmount}
              max={Number(grandTotal) || undefined}
              step={1}
              value={advanceAmount || ""}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary/40"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Minimum ৳{minAmount} ({minPct}% of ৳{grandTotal || 0}). Server caps
              at the grand total if you overshoot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancePayPicker;
