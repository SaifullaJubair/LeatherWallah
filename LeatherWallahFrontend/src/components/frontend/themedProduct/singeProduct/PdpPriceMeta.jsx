/**
 * PdpPriceMeta — F2. Reads product.active_flash, product.tier_prices,
 * product.sold_count, product.group_prices to render PDP price-side UX:
 *
 *   - flash countdown badge (ticks down to end_at; auto-hides when expired)
 *   - sold_count "X already bought" social-proof badge
 *   - tier pricing hint ("5+ at ৳300, 10+ at ৳250")
 *   - group price hint (visible only when logged-in user's customer_group
 *     matches an entry in product.group_prices)
 *
 * Pure display — no mutations. View-count fire lives in a sibling hook.
 */

"use client";
import { useEffect, useState } from "react";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import { FaFire, FaFireAlt, FaShoppingBag, FaEye } from "react-icons/fa";
import { MdLocalOffer } from "react-icons/md";

const pad = (n) => String(n).padStart(2, "0");

const useCountdown = (endAt) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endAt]);
  if (!endAt) return null;
  const target = new Date(endAt).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return { expired: true, d: 0, h: 0, m: 0, s: 0 };
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { expired: false, d, h, m, s };
};

const FlashCountdown = ({ flash, currencySymbol = "৳" }) => {
  const countdown = useCountdown(flash?.end_at);
  if (!flash?.product_entry) return null;
  if (!countdown || countdown.expired) return null;
  const { d, h, m, s } = countdown;
  const entry = flash.product_entry;
  const priceLabel =
    entry.flash_price_type === "percent"
      ? `${entry.flash_price}% OFF`
      : `${currencySymbol}${entry.flash_price}`;
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50">
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-700">
        <FaFire size={14} className="text-rose-600" />
        {flash.title || "Flash Sale"}
      </span>
      <span className="text-xs font-semibold text-rose-600 bg-white px-2 py-0.5 rounded">
        {priceLabel}
      </span>
      <span className="ml-auto flex items-center gap-1 font-mono text-xs text-rose-700">
        {d > 0 && (
          <>
            <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
              {d}
            </span>
            <span>d</span>
          </>
        )}
        <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
          {pad(h)}
        </span>
        <span>:</span>
        <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
          {pad(m)}
        </span>
        <span>:</span>
        <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
          {pad(s)}
        </span>
      </span>
    </div>
  );
};

const SoldBadge = ({ soldCount }) => {
  const n = Number(soldCount) || 0;
  if (n < 1) return null;
  // Only show meaningful counts — single-digit feels weak as social proof.
  if (n < 5) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
      <FaShoppingBag size={11} />
      {n.toLocaleString()}+ already bought
    </span>
  );
};

const ViewBadge = ({ viewCount }) => {
  const n = Number(viewCount) || 0;
  // Same social-proof threshold logic as sold: a tiny number reads weak.
  if (n < 10) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700">
      <FaEye size={11} />
      {n.toLocaleString()} viewing
    </span>
  );
};

const TierHint = ({ tierPrices, currencySymbol = "৳" }) => {
  const tiers = Array.isArray(tierPrices) ? tierPrices : [];
  if (!tiers.length) return null;
  // Sort by min_qty ascending so the hint reads naturally.
  const sorted = [...tiers].sort(
    (a, b) => Number(a.min_qty) - Number(b.min_qty),
  );
  return (
    <div className="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50">
      <p className="text-xs font-bold text-amber-800 mb-1 inline-flex items-center gap-1.5">
        <MdLocalOffer size={13} /> Bulk discount
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((t, i) => (
          <span
            key={i}
            className="text-xs bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-700"
          >
            {t.min_qty}+ &rarr; {currencySymbol}
            {t.price}
          </span>
        ))}
      </div>
    </div>
  );
};

const GroupHint = ({ groupPrices, customerGroup, currencySymbol = "৳" }) => {
  if (!customerGroup || customerGroup === "retail") return null;
  const arr = Array.isArray(groupPrices) ? groupPrices : [];
  const match = arr.find((g) => g.group === customerGroup);
  if (!match) return null;
  return (
    <div className="px-3 py-2 rounded-lg border border-purple-200 bg-purple-50">
      <p className="text-xs font-semibold text-purple-800">
        ⭐ {customerGroup === "vip" ? "VIP" : "Wholesale"} price for you:{" "}
        <span className="font-bold">
          {currencySymbol}
          {match.price}
        </span>
      </p>
    </div>
  );
};

const PdpPriceMeta = ({
  product,
  currencySymbol = "৳",
  showSoldCount = true,
  showViewCount = true,
}) => {
  const { data: userInfo } = useUserInfoQuery();
  const customerGroup =
    userInfo?.data?.customer_group || userInfo?.customer_group || "retail";

  // Nothing to show? Skip entirely so we don't render an empty block.
  const flash = product?.active_flash;
  const tiers = product?.tier_prices;
  const groupPrices = product?.group_prices;
  const soldCount = product?.sold_count;
  const viewCount = product?.view_count;

  const groupMatch =
    customerGroup !== "retail" &&
    Array.isArray(groupPrices) &&
    groupPrices.some((g) => g.group === customerGroup);

  const showAnything =
    flash?.product_entry ||
    (tiers && tiers.length > 0) ||
    (showSoldCount && (Number(soldCount) || 0) >= 5) ||
    (showViewCount && (Number(viewCount) || 0) >= 10) ||
    groupMatch;

  if (!showAnything) return null;

  return (
    <div className="space-y-2 pt-2">
      <FlashCountdown flash={flash} currencySymbol={currencySymbol} />
      {/* Social-proof badges sit on one wrapping row so sold + viewed read as a
          pair rather than two stacked blocks. */}
      {((showSoldCount && (Number(soldCount) || 0) >= 5) ||
        (showViewCount && (Number(viewCount) || 0) >= 10)) && (
        <div className="flex flex-wrap items-center gap-2">
          {showSoldCount && (Number(soldCount) || 0) >= 5 && (
            <SoldBadge soldCount={soldCount} />
          )}
          {showViewCount && (Number(viewCount) || 0) >= 10 && (
            <ViewBadge viewCount={viewCount} />
          )}
        </div>
      )}
      <TierHint tierPrices={tiers} currencySymbol={currencySymbol} />
      <GroupHint
        groupPrices={groupPrices}
        customerGroup={customerGroup}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default PdpPriceMeta;
