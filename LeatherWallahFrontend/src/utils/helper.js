import { useMemo } from "react";
import { applyCartLayers } from "./applyCartLayers";
// export const productPrice = (product) => {
//   if (product?.flash_sale_details?.flash_sale_product) {
//     return product?.flash_sale_details?.flash_sale_product
//       ?.flash_sale_product_price;
//   } else if (product?.campaign_details) {
//     return product?.campaign_details?.campaign_product?.campaign_product_price;
//   } else if (product?.is_variation) {
//     return product?.variations?.variation_discount_price
//       ? product?.variations?.variation_discount_price
//       : product?.variations?.variation_price;
//   } else {
//     return product?.product_discount_price
//       ? product?.product_discount_price
//       : product?.product_price;
//   }
// };

export const productPrice = (product) => {
  // variations is always an array — use first entry for card-level display
  const v0 = Array.isArray(product?.variations)
    ? product.variations[0]
    : product?.variations;

  // Flash sale overrides everything — base is always undiscounted original price
  if (product?.flash_sale_details?.flash_sale_product) {
    const fp = product.flash_sale_details.flash_sale_product;
    // Percent flash applies off the post-discount price (variation_discount_price
    // ?? variation_price), matching the BE resolver's `final_price` base — NOT
    // the undiscounted price. Otherwise a product with both a discount and a
    // percent flash shows a higher price than the BE charges.
    const flashBase = product?.is_variation && v0
      ? v0.variation_discount_price || v0.variation_price
      : product?.product_discount_price || product?.product_price;
    // Flash "fixed" = ABSOLUTE target price (the flash_price IS the new price),
    // NOT a subtraction — mirrors BE product.price.resolver.ts. (Admin labels
    // this field "Flash price".) "percent" = % off the base. NOTE: this differs
    // from campaign "fixed" which is a subtraction (applyCampaign) — that's why
    // we don't route flash through calculatePrice for the fixed case.
    if (fp?.flash_price_type === "percent" && flashBase)
      return calculatePrice(flashBase, fp.flash_sale_product_price, "percent");
    return fp.flash_sale_product_price;
  }

  // Campaign discount — base must be the REGULAR (undiscounted) price so the
  // cart matches the PDP and the BE recompute authority. BE resolver uses
  // `product_price` (product.price.resolver.ts) and applyCampaign(unit_regular)
  // (order.recompute.ts), so campaign is applied on the list price, NOT on the
  // already-discounted price. Mirrors the flash branch above.
  // (Bug fix 2026-06-19: was `product_discount_price || product_price` →
  // cart showed e.g. ৳450 while BE charged ৳750 — shown < charged.)
  if (product?.campaign_details?.campaign_product) {
    const cp = product.campaign_details.campaign_product;
    const campaignBase =
      product?.is_variation && v0 ? v0.variation_price : product?.product_price;
    if (cp?.campaign_price_type && campaignBase)
      return calculatePrice(campaignBase, cp.campaign_product_price, cp.campaign_price_type);
    return cp.campaign_product_price;
  }

  // Base price for normal (non-promo): variation discount → variation → product discount → product
  if (product?.is_variation && v0)
    return v0.variation_discount_price || v0.variation_price;

  return product?.product_discount_price || product?.product_price;
};

export const lineThroughPrice = (product) => {
  const v0 = Array.isArray(product?.variations)
    ? product.variations[0]
    : product?.variations;

  // Flash sale or campaign — always show original as line-through
  if (product?.flash_sale_details?.flash_sale_product)
    return v0?.variation_price || product?.product_price || null;
  if (product?.campaign_details?.campaign_product)
    return v0?.variation_price || product?.product_price || null;

  // Normal discount
  if (v0?.variation_discount_price) return v0.variation_price || null;
  if (product?.product_discount_price) return product?.product_price || null;

  return null;
};

// এই function টা replace করো
export const singleProductLineThroughPrice = (product) => {
  // Flash sale active থাকলে
  if (product?.flash_sale_details?.flash_sale_product) {
    return product?.variations?.[0]?.variation_price || product?.product_price;
  }
  // Campaign active থাকলে
  if (product?.campaign_details?.campaign_product) {
    return product?.variations?.[0]?.variation_price || product?.product_price;
  }
  // Normal discount থাকলে
  if (
    product?.variations?.[0]?.variation_discount_price ||
    product?.product_discount_price
  ) {
    return product?.variations?.[0]?.variation_price || product?.product_price;
  }
  return null;
};
export const calculatePrice = (originalPrice, discount, type) => {
  if (type === "percent") {
    const roundPrice = Math.round(
      originalPrice - (originalPrice * discount) / 100,
    );
    return roundPrice;
  } else if (type === "fixed") {
    return originalPrice - discount;
  }
  return originalPrice;
};

export const singleProductPrice = (product) => {
  // Helper function to calculate price based on type

  // Check Flash Sale Details
  // Flash applies to the undiscounted base price (variation_price / product_price),
  // NOT on top of an existing variation_discount_price — matches Shopify/Daraz standard.
  if (product?.flash_sale_details?.flash_sale_product) {
    const flashProduct = product.flash_sale_details.flash_sale_product;
    const priceType = flashProduct?.flash_price_type;
    const discountPrice = flashProduct?.flash_sale_product_price;
    // Percent base = post-discount price (matches BE resolver final_price).
    const originalPrice =
      product?.is_variation && product?.variations?.length > 0
        ? product?.variations?.[0]?.variation_discount_price ||
          product?.variations?.[0]?.variation_price
        : product?.product_discount_price || product?.product_price;

    // Flash "fixed" = absolute price (BE resolver), "percent" = % off base.
    // (Flash "fixed" is NOT a subtraction — unlike campaign "fixed".)
    if (priceType === "percent") {
      return calculatePrice(originalPrice, discountPrice, "percent");
    }
    return discountPrice; // "fixed" → the flash price IS the price
  }

  // Check Campaign Details
  if (product?.campaign_details?.campaign_product) {
    const campaignProduct = product?.campaign_details?.campaign_product;
    const priceType = campaignProduct?.campaign_price_type;
    const discountPrice = campaignProduct?.campaign_product_price;
    const originalPrice =
      product?.is_variation && product?.variations?.length > 0
        ? product?.variations?.[0]?.variation_price
        : product?.product_price;

    if (priceType) {
      return calculatePrice(originalPrice, discountPrice, priceType);
    }
    return discountPrice; // Fallback if no price type is specified
  }

  // Check for Product Variations
  if (product?.is_variation && product?.variations?.length > 0) {
    return product?.variations?.[0]?.variation_discount_price
      ? product?.variations?.[0]?.variation_discount_price
      : product?.variations?.[0]?.variation_price;
  }

  // Default Product Price
  return product?.product_discount_price
    ? product?.product_discount_price
    : product?.product_price;
};

export const updateRecentProducts = (product) => {
  const maxProducts = 5;
  let recentProducts =
    JSON.parse(localStorage.getItem("recent-products")) || [];

  recentProducts = recentProducts.filter(
    (item) => item?.product_slug !== product?.product_slug,
  );

  // ✅ শুধু display এর জন্য দরকারি fields save করো
  const saveProduct = {
    _id: product?._id,
    product_name: product?.product_name,
    product_slug: product?.product_slug,
    main_image: product?.main_image,
    product_price: product?.product_price,
    product_discount_price: product?.product_discount_price,
    is_variation: product?.is_variation,
    // ✅ variation হলে — প্রথম variation এর price আর image save করো
    ...(product?.is_variation &&
      product?.variations?.length > 0 && {
        product_price: product.variations[0]?.variation_price,
        product_discount_price: product.variations[0]?.variation_discount_price,
        main_image:
          product.variations[0]?.variation_image || product?.main_image,
      }),
  };

  recentProducts.unshift(saveProduct);
  recentProducts = recentProducts.slice(0, maxProducts);
  localStorage.setItem("recent-products", JSON.stringify(recentProducts));
};
// Helper function to check color is valid hex code
export const isHexColor = (code) => /^#([0-9A-F]{3}){1,2}$/i.test(code);

// Helper function to check if the URL is a video
export const isVideo = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|avi|mkv|flv|wmv|mpeg|mpg|3gp)$/i.test(url);
};

// Cart calculator — delegates to applyCartLayers (which mirrors the BE
// recompute layer sequence exactly). Adds shippingCharge to the final total
// for the cart UI; the BE will recompute shipping authoritatively at checkout.
// `customerGroup` is optional — pass it when the logged-in user has wholesale
// / vip status to mirror the BE's group-price layer.
export const useCartCalculations = ({
  cartData,
  products,
  couponData,
  shippingCharge,
  customerGroup,
}) =>
  useMemo(() => {
    const layered = applyCartLayers({
      cartData,
      products,
      couponData,
      customerGroup,
    });
    return {
      ...layered,
      shopGrandTotals: layered.shopGrandTotals + (shippingCharge || 0),
    };
  }, [cartData, products, couponData, shippingCharge, customerGroup]);


// PDP variation selector helper — Phase C rewrite (CM1 + CM2).
//
// Returns one entry per variant axis with the source attribute_value ids
// intact (so SingleProduct can match against variation.combination[] which
// also holds source ids). Source: `product.product_attributes[]` populated
// with the live attribute doc — NOT the `attributes_details` snapshot whose
// nested value `_id`s are Mongoose autogen subdoc ids that don't line up
// with combination[].
//
// Each emitted entry: {
//   attribute_id,
//   attribute_name,
//   display_type,            // "swatch" | "button" | "dropdown"
//   attribute_values: [{ _id, attribute_value_name, attribute_value_code }, …]
// }
//
// Falls back to the legacy snapshot ONLY for pre-Phase-1 products that have
// no product_attributes wired (extremely old data). On a fresh resale install
// this branch is dead.
export const variantAxisAttributes = (product) => {
  const axes = product?.variant_axes || [];
  const productAttrs = product?.product_attributes || [];

  if (axes.length && productAttrs.length) {
    const axisIds = new Set(axes.map((a) => String(a?.attribute_id)));
    const out = [];
    for (const pa of productAttrs) {
      const attrDoc = pa?.attribute_id; // populated attribute doc
      if (!attrDoc || typeof attrDoc !== "object") continue;
      const attrIdStr = String(attrDoc._id);
      if (!axisIds.has(attrIdStr)) continue;
      const chosenValueIds = new Set(
        (pa.value_ids || []).map((id) => String(id)),
      );
      const values = (attrDoc.attribute_values || [])
        .filter((v) => chosenValueIds.has(String(v._id)))
        .map((v) => ({
          _id: v._id,
          attribute_value_name: v.attribute_value_name,
          attribute_value_code: v.attribute_value_code,
          // Phase E follow-up — surface attribute_value_slug for URL state.
          // Backend now stores ASCII slugs (any-ascii migration); legacy
          // Bangla-literal slugs are filtered out at the consumer side.
          attribute_value_slug: v.attribute_value_slug,
        }));
      if (!values.length) continue;
      out.push({
        attribute_id: attrDoc._id,
        attribute_name: attrDoc.attribute_name,
        attribute_slug: attrDoc.attribute_slug, // for URL state on PDP
        display_type: attrDoc.display_type || "button",
        attribute_values: values,
      });
    }
    if (out.length) return out;
  }

  // Legacy fallback (no Phase-1 product_attributes wiring): return the
  // snapshot rows as-is. Picker will use string-name matching for these.
  // Phase E audit Fix #3 — warn so a regression in the populate chain
  // (any code path that returns a product with axes but unpopulated /
  // missing product_attributes) is visible in browser devtools instead of
  // silently degrading the PDP picker. On fresh resale installs this should
  // never fire; if it does, the populate path was broken upstream.
  if (
    typeof console !== "undefined" &&
    axes.length &&
    productAttrs.length === 0
  ) {
    console.warn(
      "[variantAxisAttributes] Falling back to legacy attributes_details snapshot — " +
        "product_attributes was empty/unpopulated. Variation matching may be unreliable.",
      { productId: product?._id, slug: product?.product_slug },
    );
  }
  const snapshot = product?.attributes_details || [];
  if (!axes.length) return snapshot;
  const axisIds = new Set(axes.map((a) => String(a?.attribute_id)));
  return snapshot.filter((a) => axisIds.has(String(a?.attribute_id)));
};

// Pre-compute availability across all variations so the PDP can grey out
// chips with no stock instead of letting the buyer click into a dead end.
// Returns Map<value_id_string, { hasInStock: boolean, anyActive: boolean }>.
// Built once on mount; O(variations × combinationSize), O(1) chip lookup.
export const buildVariationAvailabilityMap = (product) => {
  const map = new Map();
  const variations = product?.variations || [];
  for (const v of variations) {
    if (!Array.isArray(v?.combination)) continue;
    const inStock = (v?.variation_quantity ?? 0) > 0;
    const active = v?.is_active !== false;
    for (const vid of v.combination) {
      const key = String(vid);
      const prev = map.get(key) || { hasInStock: false, anyActive: false };
      map.set(key, {
        hasInStock: prev.hasInStock || inStock,
        anyActive: prev.anyActive || active,
      });
    }
  }
  return map;
};

// C9 — given current axis selection + a candidate value for one axis, would
// the resulting full combination be active AND in stock? Used by the picker
// to faded-out chips that lead to a dead combo. Returns true (don't fade)
// when the trial combo is incomplete — incomplete combos shouldn't trigger
// the OOS visual cue because the user hasn't finished picking yet.
//
// Works for 1-axis, 2-axis, N-axis products via combination[] set-intersection
// (same algorithm as findVariationByValueIds in SingleProduct.jsx — kept here
// in helper.js so both the picker and any future consumer can reuse it).
export const wouldComboBeInStock = (
  product,
  currentVars,
  attrName,
  candidateVal,
) => {
  if (!product?.is_variation) return true;
  const trial = { ...currentVars, [attrName]: candidateVal };
  const axes = variantAxisAttributes(product) || [];
  // Incomplete combo guard — if user hasn't selected every axis yet, don't
  // pre-emptively fade chips. Surfaces fades only once a full combo can be
  // judged.
  for (const a of axes) {
    if (!trial[a.attribute_name]?._id) return true;
  }
  const ids = Object.values(trial)
    .map((v) => String(v?._id))
    .filter(Boolean);
  if (!ids.length) return true;
  const target = new Set(ids);
  const found = (product.variations || []).find((v) => {
    if (v?.is_active === false) return false;
    const combo = v?.combination;
    if (!Array.isArray(combo) || combo.length !== target.size) return false;
    return combo.every((id) => target.has(String(id)));
  });
  return found ? Number(found.variation_quantity) > 0 : false;
};
