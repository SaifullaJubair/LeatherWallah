// FE pricing layers — mirrors `order.recompute.ts` so the customer sees the
// same total at the cart that the server will compute at checkout. Pure /
// sync / no fetches. If the two ever diverge it's a real bug — the server
// number wins regardless, but UX-wise the cart should never lie.
//
// Layers handled here:
//   1. Base unit price (delegated to productPrice() which already covers
//      flash > campaign > variation > base discount)
//   2. Tier price (qty-based, best-price-wins)
//   3. Customer-group price (wholesale / vip, best-price-wins)
//   4. Coupon (fixed / percent, all-products or specific-products)
//      - Per-product coupons fold into line price first.
//      - Cart-level coupons apply to the post-line subtotal.
//      - coupon_max_amount caps percent coupons.
//
// NOT handled here (require server context / async):
//   - Loyalty redeem        (needs user balance + settings.loyalty_*)
//   - VAT                   (per-line override + settings, applied post-discount)
//   - Shipping recompute    (zone + per-product delivery_mode + free rules)
//   - Coupon per-user usage caps + total-available caps (need DB)
//   - Advance payment       (settings-driven)
//   - Campaign              NOT mirrored here. productPrice() reads
//     product.campaign_details from the hydrated cart cache, which can go
//     stale between page load and checkout. The BE recompute pulls the
//     campaign fresh from DB at order placement and OVERWRITES the line
//     price. Result: cart UI may show campaign price for ~minutes after a
//     campaign ends; checkout corrects to the non-campaign price. Owner
//     accepted this trade-off; do not add a campaign layer here without
//     also solving the staleness problem.
//
// Keep the call signature stable — if the resolver / coupon shape changes
// in the BE, mirror the change here and ship FE+BE together.

import { productPrice } from "./helper";

// Discount a single line by a product-level coupon (if it targets this product).
// Returns the unit price after coupon, or the original price if not eligible.
const applyProductCoupon = (unitPrice, productId, coupon) => {
  if (!coupon || !unitPrice) return unitPrice;
  if (coupon.coupon_product_type !== "specific") return unitPrice;
  const targetsThis = coupon.coupon_specific_product?.some(
    (p) => String(p?.product_id) === String(productId),
  );
  if (!targetsThis) return unitPrice;

  if (coupon.coupon_type === "fixed") {
    return Math.max(unitPrice - (coupon.coupon_amount || 0), 0);
  }
  if (coupon.coupon_type === "percent") {
    const raw = Math.round((unitPrice * (coupon.coupon_amount || 0)) / 100);
    const cap = coupon.coupon_max_amount || Infinity;
    const off = Math.min(raw, cap);
    return Math.max(unitPrice - off, 0);
  }
  return unitPrice;
};

// Apply an all-products coupon (or specific-products coupon's already-applied
// subtotal) at the cart level. Percent caps at coupon_max_amount.
const applyCartCoupon = (subTotal, coupon) => {
  if (!coupon || subTotal <= 0) return subTotal;
  // Specific-product coupons fold in at line level — don't double-apply.
  if (coupon.coupon_product_type === "specific") return subTotal;
  // BOGO handled by applyBogoCoupon — never touched by cart-level layer.
  if (coupon.coupon_type === "bogo") return subTotal;

  if (coupon.coupon_type === "fixed") {
    return Math.max(subTotal - (coupon.coupon_amount || 0), 0);
  }
  if (coupon.coupon_type === "percent") {
    const raw = Math.round((subTotal * (coupon.coupon_amount || 0)) / 100);
    const cap = coupon.coupon_max_amount || Infinity;
    const off = Math.min(raw, cap);
    return Math.max(subTotal - off, 0);
  }
  return subTotal;
};

// 11β BLOCKER 1 — FE mirror of BE recompute BOGO branch (order.recompute.ts).
// Input shape:
//   cartLines = [{ productId, unitFinal (post layers 1-3), quantity }, ...]
// Coupon scope: `coupon_specific_product` (if set) — else whole cart.
// Skip lines where unitFinal <= 0 (campaign zero) so BOGO can't double-apply.
// Discount = cheapest qualifying unitFinal × bogo_get_qty × pct/100.
// Returns 0 if the cart doesn't satisfy buy_qty + get_qty.
const applyBogoCoupon = (cartLines, coupon) => {
  if (!coupon || coupon.coupon_type !== "bogo") return 0;
  const buyQty = Math.max(1, Number(coupon.bogo_buy_qty) || 1);
  const getQty = Math.max(1, Number(coupon.bogo_get_qty) || 1);
  const pct = Math.max(
    0,
    Math.min(100, Number(coupon.bogo_get_discount_pct) || 0),
  );
  const targetIds = Array.isArray(coupon.coupon_specific_product)
    ? coupon.coupon_specific_product
        .map((p) => String(p?.product_id || ""))
        .filter(Boolean)
    : [];
  const eligible = cartLines.filter((ln) => {
    if (Number(ln.unitFinal) <= 0) return false;
    if (targetIds.length === 0) return true;
    return targetIds.includes(String(ln.productId));
  });
  const totalEligibleQty = eligible.reduce(
    (s, ln) => s + Number(ln.quantity || 0),
    0,
  );
  if (totalEligibleQty < buyQty + getQty || eligible.length === 0) return 0;
  const cheapest = eligible.reduce((min, ln) =>
    Number(ln.unitFinal) < Number(min.unitFinal) ? ln : min,
  );
  return Math.round((Number(cheapest.unitFinal) * getQty * pct) / 100);
};

// Tier price (qty-based). Picks the largest min_qty tier the buyer qualifies
// for whose price beats the current unit price.
const applyTierPrice = (unitPrice, quantity, tiers) => {
  if (!Array.isArray(tiers) || tiers.length === 0) return unitPrice;
  const sorted = [...tiers]
    .filter((t) => Number(t?.min_qty) > 0 && Number(t?.price) > 0)
    .sort((a, b) => b.min_qty - a.min_qty);
  for (const t of sorted) {
    if (quantity >= Number(t.min_qty) && Number(t.price) < unitPrice) {
      return Number(t.price);
    }
  }
  return unitPrice;
};

// Customer-group price (wholesale / vip). Best-price-wins.
const applyGroupPrice = (unitPrice, group, groupPrices) => {
  if (!group || group === "retail" || !Array.isArray(groupPrices)) {
    return unitPrice;
  }
  const match = groupPrices.find((g) => g?.group === group);
  if (match && Number(match.price) > 0 && Number(match.price) < unitPrice) {
    return Number(match.price);
  }
  return unitPrice;
};

/**
 * Compute cart totals client-side using the same layer sequence as the BE
 * recompute. Server is still the authority at checkout — this just keeps the
 * cart UI honest in the meantime.
 *
 * @param {Object} args
 * @param {Array}  args.cartData       Hydrated product docs (each may carry .variations object for the picked variant)
 * @param {Array}  args.products       Cart-slice rows from Redux (productId + variation_product_id + quantity)
 * @param {Object} [args.couponData]   Applied coupon doc (or null)
 * @param {string} [args.customerGroup] "retail" | "wholesale" | "vip"
 * @returns {{
 *   shopSubtotals: number,       // Σ originalLinePrice (pre any coupon)
 *   shopGrandTotals: number,     // Σ finalLinePrice (post coupon, no shipping)
 *   totalDiscount: number,       // shopSubtotals - shopGrandTotals
 *   adjustedPrices: Record<string, number>, // per-line final UNIT price
 * }}
 */
export const applyCartLayers = ({
  cartData = [],
  products = [],
  couponData = null,
  customerGroup = "retail",
}) => {
  if (!cartData.length) {
    return {
      shopSubtotals: 0,
      shopGrandTotals: 0,
      totalDiscount: 0,
      adjustedPrices: {},
    };
  }

  const adjustedPrices = {};
  let originalSubtotal = 0;
  let subtotalAfterLineCoupons = 0;
  // 11β — collect post-layers-1/2/3 line snapshots for BOGO scan after the loop.
  const bogoLines = [];

  for (const product of cartData) {
    const variationId = product?.variations?._id;
    const quantity =
      products?.find(
        (item) =>
          item?.productId === product?._id &&
          (!variationId || item?.variation_product_id === variationId),
      )?.quantity || 1;

    // 1. Base unit price (already includes flash > campaign > variation > base).
    let unit = productPrice(product) || 0;

    // 2. Tier price — beats base if qty meets threshold.
    unit = applyTierPrice(unit, quantity, product?.tier_prices);

    // 3. Customer-group price — beats tier if buyer qualifies.
    unit = applyGroupPrice(unit, customerGroup, product?.group_prices);

    // Track the "pre-coupon" total separately so totalDiscount math is honest.
    originalSubtotal += unit * quantity;

    // 4. Coupon (product-level, applied to this line only).
    const lineFinal = applyProductCoupon(unit, product?._id, couponData);
    subtotalAfterLineCoupons += lineFinal * quantity;

    const priceKey = variationId
      ? `${product?._id}-${variationId}`
      : String(product?._id);
    adjustedPrices[priceKey] = lineFinal;

    // 11β — snapshot for BOGO. Use the post-product-coupon final unit so the
    // M3 "skip zero-priced lines" check is honest.
    bogoLines.push({
      productId: product?._id,
      unitFinal: lineFinal,
      quantity,
    });
  }

  // 5. Coupon (cart-level — fixed/percent only). BOGO returns subTotal as-is.
  let shopGrandTotals = applyCartCoupon(subtotalAfterLineCoupons, couponData);

  // 6. BOGO discount layer — subtracted from grand total when active.
  if (couponData?.coupon_type === "bogo") {
    const bogoDiscount = applyBogoCoupon(bogoLines, couponData);
    shopGrandTotals = Math.max(shopGrandTotals - bogoDiscount, 0);
  }

  return {
    shopSubtotals: originalSubtotal,
    shopGrandTotals,
    totalDiscount: Math.max(originalSubtotal - shopGrandTotals, 0),
    adjustedPrices,
  };
};
