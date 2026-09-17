"use client";
// scr/components/analyticsScripts/utils/useAnalytics.js
import { useCallback } from "react";
import { sendServerEvent } from "./metaPixel/metaServerEvent";
import { sendTikTokServerEvent } from "./tiktokPixel/TiktokServerEvent";
import useGetSettingData from "@/components/lib/getSettingData";
import { generateEventId } from "./metaPixel/useMetaPixel";
import { getCurrencyCode } from "@/utils/currency";
import { calculatePrice } from "@/utils/helper";

// ── helpers ────────────────────────────────────────────
// The Meta/TikTok pixel <Script>s can still be loading (afterInteractive /
// lazyOnload) when settings resolve via a fast, cached react-query call —
// so a bare `if (window.fbq)` check silently drops the call: the CAPI
// (server) leg still fires, but the browser leg never does, breaking dedup.
// Meta's own shim solves this for calls made after fbq() exists, by queuing
// them internally — the gap is only the window before fbq/ttq exist AT ALL.
// Retry briefly (idle-CPU heartbeats are ~100ms) instead of dropping.
const waitFor = (check, run, args, attempts = 20) => {
  if (typeof window === "undefined") return;
  if (check()) {
    run(...args);
    return;
  }
  if (attempts <= 0) return;
  setTimeout(() => waitFor(check, run, args, attempts - 1), 100);
};

const fbq = (...args) => {
  waitFor(
    () => typeof window.fbq === "function",
    (...a) => window.fbq(...a),
    args,
  );
};

const ttq = (...args) => {
  waitFor(
    () => typeof window.ttq?.track === "function",
    (...a) => window.ttq.track(...a),
    args,
  );
};

// ── GTM dataLayer push ─────────────────────────────────
const pushDataLayer = (eventData) => {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);
  }
};

const toStringIds = (ids) => {
  if (!ids) return [];
  if (Array.isArray(ids)) return ids.map((id) => String(id));
  return [String(ids)];
};

const toNumber = (val) => parseFloat(val) || 0;

// Mirrors helper.js `productPrice()` — flash sale, then campaign, then
// variation/product discount — but takes the CALLER'S variation (the one
// the buyer actually picked) instead of always reading variations[0].
// `productPrice()` can't be reused as-is: it hardcodes variations[0] for
// card-level display, which is wrong once a non-default variation is in
// the cart. Keeping this in sync with helper.js's branch order matters —
// the BE resolver (product.price.resolver.ts) is the real authority.
const resolveEventPrice = (product, variation) => {
  const v0 = variation || (Array.isArray(product?.variations)
    ? product.variations[0]
    : product?.variations);

  if (product?.flash_sale_details?.flash_sale_product) {
    const fp = product.flash_sale_details.flash_sale_product;
    const flashBase = product?.is_variation && v0
      ? v0.variation_discount_price || v0.variation_price
      : product?.product_discount_price || product?.product_price;
    if (fp?.flash_price_type === "percent" && flashBase)
      return toNumber(calculatePrice(flashBase, fp.flash_sale_product_price, "percent"));
    return toNumber(fp.flash_sale_product_price);
  }

  if (product?.campaign_details?.campaign_product) {
    const cp = product.campaign_details.campaign_product;
    const campaignBase =
      product?.is_variation && v0 ? v0.variation_price : product?.product_price;
    if (cp?.campaign_price_type && campaignBase)
      return toNumber(calculatePrice(campaignBase, cp.campaign_product_price, cp.campaign_price_type));
    return toNumber(cp.campaign_product_price);
  }

  if (product?.is_variation && v0)
    return toNumber(v0.variation_discount_price || v0.variation_price);

  return toNumber(product?.product_discount_price || product?.product_price);
};

// ── Main Hook ──────────────────────────────────────────
const useAnalytics = () => {
  const { data: settingsData, isSuccess: settingsReady } = useGetSettingData();
  const settings = settingsData?.data?.[0];

  const metaEnabled = !!settings?.meta_pixel_enabled;
  const metaCapiEnabled = !!settings?.meta_capi_enabled;
  const tiktokEnabled = !!settings?.tiktok_pixel_enabled;
  const tiktokCapiEnabled = !!settings?.tiktok_capi_enabled;
  const gtmEnabled = !!settings?.gtm_enabled;
  // M28 (2026-06-04) — currency code from settings, fallback "BDT" baked
  // into the helper. Every analytics event below uses this instead of the
  // hardcoded string so a clone client only edits settings, not code.
  const currency = getCurrencyCode(settingsData);

  // ── ViewContent ────────────────────────────────────
  const trackViewContent = useCallback(
    async (product, userData = {}) => {
      const eventId = generateEventId();
      // Flash sale / campaign / variation aware — matches what the buyer
      // actually sees on the PDP, not just the bare product price.
      const price = resolveEventPrice(product);

      if (metaEnabled) {
        fbq(
          "track",
          "ViewContent",
          {
            content_ids: toStringIds([product?._id]),
            content_name: product?.product_name,
            content_type: "product",
            currency,
            value: price,
          },
          { eventID: eventId },
        );

        if (metaCapiEnabled) {
          await sendServerEvent({
            event_name: "ViewContent",
            event_id: eventId,
            user_data: userData,
            custom_data: {
              content_ids: toStringIds([product?._id]),
              content_name: product?.product_name,
              content_type: "product",
              currency,
              value: price,
            },
          });
        }
      }

      if (tiktokEnabled) {
        ttq(
          "ViewContent",
          {
            content_id: String(product?._id),
            content_name: product?.product_name,
            currency,
            value: price,
          },
          { event_id: eventId },
        );
        if (tiktokCapiEnabled) {
          await sendTikTokServerEvent({
            event_name: "ViewContent",
            event_id: eventId,
            user_data: userData,
            properties: {
              content_id: String(product?._id),
              content_name: product?.product_name,
              content_type: "product",
              currency,
              value: price,
            },
          });
        }
      }

      if (gtmEnabled) {
        pushDataLayer({
          event: "view_item",
          ecommerce: {
            currency,
            value: price,
            items: [
              {
                item_id: String(product?._id),
                item_name: product?.product_name,
                price,
              },
            ],
          },
        });
      }
    },
    [
      metaEnabled,
      metaCapiEnabled,
      tiktokEnabled,
      tiktokCapiEnabled,
      gtmEnabled,
    ],
  );

  // ── AddToCart ──────────────────────────────────────
  const trackAddToCart = useCallback(
    async (product, variationProduct, quantity, userData = {}) => {
      const eventId = generateEventId();
      // Flash sale / campaign aware, and uses the SELECTED variation (not
      // variations[0]) — matches what's actually added to the cart.
      const price = resolveEventPrice(product, variationProduct);
      const itemId = String(variationProduct?._id || product?._id);
      const totalValue = price * quantity;

      if (metaEnabled) {
        fbq(
          "track",
          "AddToCart",
          {
            content_ids: [itemId],
            content_name: product?.product_name,
            content_type: "product",
            currency,
            value: totalValue,
            num_items: quantity,
          },
          { eventID: eventId },
        );

        if (metaCapiEnabled) {
          await sendServerEvent({
            event_name: "AddToCart",
            event_id: eventId,
            user_data: userData,
            custom_data: {
              content_ids: [itemId],
              content_name: product?.product_name,
              content_type: "product",
              currency,
              value: totalValue,
              num_items: quantity,
            },
          });
        }
      }

      if (tiktokEnabled) {
        ttq(
          "AddToCart",
          {
            content_id: itemId,
            content_name: product?.product_name,
            currency,
            value: totalValue,
            quantity,
          },
          { event_id: eventId },
        );
        if (tiktokCapiEnabled) {
          await sendTikTokServerEvent({
            event_name: "AddToCart",
            event_id: eventId,
            user_data: userData,
            properties: {
              content_id: itemId,
              content_name: product?.product_name,
              content_type: "product",
              currency,
              value: totalValue,
              quantity,
            },
          });
        }
      }

      if (gtmEnabled) {
        pushDataLayer({
          event: "add_to_cart",
          ecommerce: {
            currency,
            value: totalValue,
            items: [
              {
                item_id: itemId,
                item_name: product?.product_name,
                price,
                quantity,
              },
            ],
          },
        });
      }
    },
    [
      metaEnabled,
      metaCapiEnabled,
      tiktokEnabled,
      tiktokCapiEnabled,
      gtmEnabled,
    ],
  );

  // ── Purchase ───────────────────────────────────────
  // Purchase CAPI is intentionally NOT sent from here. The backend already
  // fires Meta/TikTok Purchase CAPI server-side right after order creation
  // (order.controller.ts), keyed off the SAME `eventId` this function is
  // given (passed in by the caller as `purchase_event_id` on the order
  // payload) — that backend leg is reliable regardless of ad-blockers or
  // client JS failures. Firing CAPI again here duplicated it under a
  // DIFFERENT event_id than the backend's, which Meta/TikTok could not
  // dedupe, causing Purchase overcounting. Only the browser pixel fires
  // here now; it shares `eventId` with the backend CAPI call so Meta/TikTok
  // merge the two into one event.
  const trackPurchase = useCallback(
    async (orderData, userData = {}, eventId = generateEventId()) => {
      const value = toNumber(orderData?.grand_total_amount);
      const contentIds = toStringIds(
        orderData?.order_products?.map((p) => p?.product_id),
      );
      // S4+S5 Phase 1B B2 — num_items should be the SUM of quantities,
      // not the count of distinct product lines. 3 products with qty 2
      // each = 6 num_items, not 3. Meta uses value/num_items for AOV.
      // AddToCart.jsx / SingleProduct.jsx ship order_products with
      // `product_quantity` key (backend convention), some legacy code
      // may still send `quantity` — read either.
      const numItems =
        orderData?.order_products?.reduce(
          (s, p) => s + (p?.product_quantity || p?.quantity || 1),
          0,
        ) || 0;
      const orderId = orderData?._id ? String(orderData._id) : undefined;

      if (metaEnabled) {
        fbq(
          "track",
          "Purchase",
          {
            content_ids: contentIds,
            content_type: "product",
            currency,
            value,
            num_items: numItems,
          },
          { eventID: eventId },
        );
        // Meta CAPI Purchase is NOT sent from here — the backend already
        // sends it server-side (order.controller.ts) using this same
        // eventId as `purchase_event_id`. See comment above trackPurchase.
      }

      if (tiktokEnabled) {
        ttq(
          "CompletePayment",
          {
            currency,
            value,
            quantity: numItems,
          },
          { event_id: eventId },
        );
        if (tiktokCapiEnabled) {
          await sendTikTokServerEvent({
            event_name: "CompletePayment",
            event_id: eventId,
            user_data: userData,
            properties: {
              currency,
              value,
              quantity: numItems,
              order_id: orderId, // Phase 1B B6 — server-side dedup key
            },
          });
        }
      }

      if (gtmEnabled) {
        pushDataLayer({
          event: "purchase",
          ecommerce: {
            transaction_id: orderId,
            currency,
            value,
            items: orderData?.order_products?.map((p) => ({
              item_id: String(p?.product_id),
              item_name: p?.product_name,
              price: toNumber(p?.product_price),
              quantity: p?.product_quantity || p?.quantity || 1,
            })),
          },
        });
      }
    },
    [
      metaEnabled,
      metaCapiEnabled,
      tiktokEnabled,
      tiktokCapiEnabled,
      gtmEnabled,
      currency,
    ],
  );

  // ── InitiateCheckout ───────────────────────────────
  const trackInitiateCheckout = useCallback(
    async (orderData, userData = {}) => {
      const eventId = generateEventId();
      const value = toNumber(orderData?.value);

      if (metaEnabled) {
        fbq(
          "track",
          "InitiateCheckout",
          {
            content_ids: toStringIds(orderData?.content_ids),
            content_type: "product",
            currency,
            value,
            num_items: orderData?.num_items || 1,
          },
          { eventID: eventId },
        );

        if (metaCapiEnabled) {
          await sendServerEvent({
            event_name: "InitiateCheckout",
            event_id: eventId,
            user_data: userData,
            custom_data: {
              content_ids: toStringIds(orderData?.content_ids),
              currency,
              value,
            },
          });
        }
      }

      if (tiktokEnabled) {
        ttq(
          "InitiateCheckout",
          { currency, value, quantity: orderData?.num_items || 1 },
          { event_id: eventId },
        );
        if (tiktokCapiEnabled) {
          await sendTikTokServerEvent({
            event_name: "InitiateCheckout",
            event_id: eventId,
            user_data: userData,
            properties: {
              currency,
              value,
              quantity: orderData?.num_items || 1,
            },
          });
        }
      }

      if (gtmEnabled) {
        pushDataLayer({
          event: "begin_checkout",
          ecommerce: { currency, value },
        });
      }
    },
    [
      metaEnabled,
      metaCapiEnabled,
      tiktokEnabled,
      tiktokCapiEnabled,
      gtmEnabled,
    ],
  );

  // ── Search ─────────────────────────────────────────
  const trackSearch = useCallback(
    (searchString) => {
      const eventId = generateEventId();

      if (metaEnabled)
        fbq(
          "track",
          "Search",
          { search_string: searchString, currency },
          { eventID: eventId },
        );
      if (tiktokEnabled)
        ttq("Search", { query: searchString }, { event_id: eventId });
      if (gtmEnabled)
        pushDataLayer({ event: "search", search_term: searchString });
    },
    [metaEnabled, tiktokEnabled, gtmEnabled],
  );

  // ── Login ──────────────────────────────────────────
  const trackLogin = useCallback(
    async (userData = {}) => {
      const eventId = generateEventId();

      if (metaEnabled) {
        fbq("track", "Login", {}, { eventID: eventId });
        if (metaCapiEnabled) {
          await sendServerEvent({
            event_name: "Login",
            event_id: eventId,
            user_data: userData,
          });
        }
      }

      if (tiktokEnabled) {
        ttq("Login", {}, { event_id: eventId });
        if (tiktokCapiEnabled) {
          await sendTikTokServerEvent({
            event_name: "Login",
            event_id: eventId,
            user_data: userData,
          });
        }
      }

      if (gtmEnabled) pushDataLayer({ event: "login", method: "phone" });
    },
    [
      metaEnabled,
      metaCapiEnabled,
      tiktokEnabled,
      tiktokCapiEnabled,
      gtmEnabled,
    ],
  );

  // ── CompleteRegistration ───────────────────────────
  const trackCompleteRegistration = useCallback(
    async (userData = {}) => {
      const eventId = generateEventId();

      if (metaEnabled) {
        fbq("track", "CompleteRegistration", {}, { eventID: eventId });
        if (metaCapiEnabled) {
          await sendServerEvent({
            event_name: "CompleteRegistration",
            event_id: eventId,
            user_data: userData,
          });
        }
      }

      if (tiktokEnabled) {
        ttq("CompleteRegistration", {}, { event_id: eventId });
        if (tiktokCapiEnabled) {
          await sendTikTokServerEvent({
            event_name: "CompleteRegistration",
            event_id: eventId,
            user_data: userData,
          });
        }
      }

      if (gtmEnabled) pushDataLayer({ event: "sign_up", method: "phone" });
    },
    [
      metaEnabled,
      metaCapiEnabled,
      tiktokEnabled,
      tiktokCapiEnabled,
      gtmEnabled,
    ],
  );

  // ── AddToWishlist ──────────────────────────────────
  const trackAddToWishlist = useCallback(
    (product, variationProduct) => {
      const eventId = generateEventId();
      const price = resolveEventPrice(product, variationProduct);
      const itemId = String(variationProduct?._id || product?._id);

      if (metaEnabled) {
        fbq(
          "track",
          "AddToWishlist",
          {
            content_ids: [itemId],
            content_name: product?.product_name,
            content_type: "product",
            currency,
            value: price,
          },
          { eventID: eventId },
        );
      }

      if (tiktokEnabled) {
        ttq(
          "AddToWishlist",
          {
            content_id: itemId,
            content_name: product?.product_name,
            currency,
            value: price,
          },
          { event_id: eventId },
        );
      }

      if (gtmEnabled) {
        pushDataLayer({
          event: "add_to_wishlist",
          ecommerce: {
            currency,
            value: price,
            items: [
              { item_id: itemId, item_name: product?.product_name, price },
            ],
          },
        });
      }
    },
    [metaEnabled, tiktokEnabled, gtmEnabled],
  );

  return {
    settingsReady,
    trackViewContent,
    trackAddToCart,
    trackPurchase,
    trackInitiateCheckout,
    trackSearch,
    trackLogin,
    trackCompleteRegistration,
    trackAddToWishlist,
  };
};

export default useAnalytics;
