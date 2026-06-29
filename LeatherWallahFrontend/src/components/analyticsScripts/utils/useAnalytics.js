"use client";
// scr/components/analyticsScripts/utils/useAnalytics.js
import { useCallback } from "react";
import { sendServerEvent } from "./metaPixel/metaServerEvent";
import { sendTikTokServerEvent } from "./tiktokPixel/TiktokServerEvent";
import useGetSettingData from "@/components/lib/getSettingData";
import { generateEventId } from "./metaPixel/useMetaPixel";
import { getCurrencyCode } from "@/utils/currency";

// ── helpers ────────────────────────────────────────────
const fbq = (...args) => {
  if (typeof window !== "undefined" && window.fbq) window.fbq(...args);
};

const ttq = (...args) => {
  if (typeof window !== "undefined" && window.ttq) window.ttq.track(...args);
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

// ── Main Hook ──────────────────────────────────────────
const useAnalytics = () => {
  const { data: settingsData } = useGetSettingData();
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
      const price = toNumber(
        product?.product_discount_price || product?.product_price,
      );

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
      const price = toNumber(
        variationProduct
          ? variationProduct?.variation_discount_price ||
              variationProduct?.variation_price
          : product?.product_discount_price || product?.product_price,
      );
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
  const trackPurchase = useCallback(
    async (orderData, userData = {}) => {
      const eventId = generateEventId();
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

        if (metaCapiEnabled) {
          await sendServerEvent({
            event_name: "Purchase",
            event_id: eventId,
            user_data: userData,
            custom_data: {
              content_ids: contentIds,
              content_type: "product",
              currency,
              value,
              num_items: numItems,
              order_id: orderId, // Phase 1B B6 — server-side dedup key
            },
          });
        }
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
      const price = toNumber(
        variationProduct
          ? variationProduct?.variation_discount_price ||
              variationProduct?.variation_price
          : product?.product_discount_price || product?.product_price,
      );
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
