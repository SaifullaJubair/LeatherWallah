/**
 * LoyaltyRedeemPanel — F1b.
 *
 * Phase G3 cart-side redeem. Visible only when:
 *   - settings.loyalty_enabled
 *   - settings.loyalty_redeem_rate > 0
 *   - the buyer is logged in and has a positive loyalty_points balance
 *
 * Server clamps the redemption (recomputeOrderTotals) by:
 *   - the user's actual balance
 *   - settings.loyalty_max_redeem_percent × post-coupon subtotal
 * So this UI is just convenience + preview — server still wins.
 *
 * Outputs (controlled by parent): redeemPoints (number).
 */

"use client";

const LoyaltyRedeemPanel = ({
  settings,
  userInfo,
  subTotal,
  discountAmount,
  redeemPoints,
  setRedeemPoints,
}) => {
  if (!settings?.loyalty_enabled) return null;
  const redeemRate = Number(settings?.loyalty_redeem_rate) || 0;
  if (redeemRate <= 0) return null;

  // userInfo shape (RTK Query get_me): { data: { ..., loyalty_points } } or
  // flat depending on the endpoint — defensive read.
  const balance = Math.max(
    0,
    Math.floor(
      Number(userInfo?.data?.loyalty_points ?? userInfo?.loyalty_points) || 0,
    ),
  );
  if (balance <= 0) return null;

  const maxPct = Number(settings?.loyalty_max_redeem_percent) || 100;
  const postCouponBase = Math.max(
    0,
    (Number(subTotal) || 0) - (Number(discountAmount) || 0),
  );
  const maxAmountByPct = Math.round((postCouponBase * maxPct) / 100);
  const maxPointsByPct = Math.floor(maxAmountByPct / redeemRate);
  const maxRedeemable = Math.min(balance, maxPointsByPct);

  const points = Math.max(0, Math.floor(Number(redeemPoints) || 0));
  const clamped = Math.min(points, maxRedeemable);
  const discountValue = Math.round(clamped * redeemRate);

  return (
    <div className="bg-white shadow-sm p-5 mt-3 rounded">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-800 flex items-center gap-2">
            🎁 Use loyalty points
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            You have{" "}
            <span className="font-semibold text-gray-700">{balance} pts</span>{" "}
            ·{" "}
            <span className="text-gray-400">
              redeem up to {maxRedeemable} pts on this order (
              {maxPct}% cap)
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Points to redeem
          </label>
          <input
            type="number"
            min={0}
            max={maxRedeemable}
            step={1}
            value={redeemPoints || ""}
            onChange={(e) => setRedeemPoints(e.target.value)}
            placeholder="0"
            className="w-32 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setRedeemPoints(maxRedeemable)}
          disabled={maxRedeemable === 0}
          className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Use max
        </button>
        {clamped > 0 && (
          <div className="px-3 py-2 text-sm bg-emerald-50 border border-emerald-100 rounded text-emerald-700">
            −৳{discountValue} off
          </div>
        )}
      </div>

      {points > maxRedeemable && maxRedeemable > 0 && (
        <p className="text-[11px] text-amber-600 mt-2">
          Server will cap at {maxRedeemable} pts (max allowed on this order).
        </p>
      )}
    </div>
  );
};

export default LoyaltyRedeemPanel;
