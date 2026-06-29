"use client";
// src/components/analyticsScripts/utils/metaPixel/useMetaPixel.js
import { useCallback } from "react";
import useGetSettingData from "@/components/lib/getSettingData";
import { getCurrencyCode } from "@/utils/currency";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Unique event_id generate করো — browser + server deduplication এর জন্য
export const generateEventId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// fbq safely call করো
const fbq = (...args) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
};

// ✅ content_ids সব সময় String array
const toStringIds = (ids) => {
  if (!ids) return [];
  if (Array.isArray(ids)) return ids.map((id) => String(id));
  return [String(ids)];
};

// ✅ value সব সময় Number
const toNumber = (val) => parseFloat(val) || 0;

const useMetaPixel = () => {
  // M28 (2026-06-04) — currency code from settings (BDT fallback in helper).
  const { data: settingsData } = useGetSettingData();
  const currency = getCurrencyCode(settingsData);

  // PageView
  const trackPageView = useCallback(() => {
    fbq("track", "PageView");
  }, []);

  // ViewContent — product details page
  const trackViewContent = useCallback((product, eventId) => {
    fbq(
      "track",
      "ViewContent",
      {
        content_ids: toStringIds([product?._id]),
        content_name: product?.product_name,
        content_type: "product",
        currency,
        value: toNumber(
          product?.product_discount_price || product?.product_price,
        ),
      },
      { eventID: eventId },
    );
  }, [currency]);

  // AddToCart
  const trackAddToCart = useCallback(
    (product, variationProduct, quantity, eventId) => {
      const price = variationProduct
        ? variationProduct?.variation_discount_price ||
          variationProduct?.variation_price
        : product?.product_discount_price || product?.product_price;

      fbq(
        "track",
        "AddToCart",
        {
          content_ids: toStringIds([variationProduct?._id || product?._id]),
          content_name: product?.product_name,
          content_type: "product",
          currency,
          value: toNumber(price) * quantity,
          num_items: quantity,
        },
        { eventID: eventId },
      );
    },
    [currency],
  );

  // Purchase
  const trackPurchase = useCallback((orderData, eventId) => {
    fbq(
      "track",
      "Purchase",
      {
        content_ids: toStringIds(
          orderData?.order_products?.map((p) => p?.product_id),
        ),
        content_type: "product",
        currency,
        value: toNumber(orderData?.grand_total_amount),
        num_items: orderData?.order_products?.length || 0,
      },
      { eventID: eventId },
    );
  }, [currency]);

  // Login
  const trackLogin = useCallback((eventId) => {
    fbq("track", "Login", {}, { eventID: eventId });
  }, []);

  // CompleteRegistration
  const trackCompleteRegistration = useCallback((eventId) => {
    fbq("track", "CompleteRegistration", {}, { eventID: eventId });
  }, []);

  // ✅ InitiateCheckout — form fill শুরু করলে একবার fire
  const trackInitiateCheckout = useCallback((orderData, eventId) => {
    fbq(
      "track",
      "InitiateCheckout",
      {
        content_ids: toStringIds(orderData?.content_ids),
        content_type: "product",
        currency,
        value: toNumber(orderData?.value),
        num_items: orderData?.num_items || 1,
      },
      { eventID: eventId },
    );
  }, [currency]);

  // ✅ Search — user search করলে fire
  const trackSearch = useCallback((searchString, eventId) => {
    fbq(
      "track",
      "Search",
      {
        search_string: searchString,
        currency,
      },
      { eventID: eventId },
    );
  }, [currency]);

  // ✅ AddToWishlist — wishlist এ add করলে fire
  const trackAddToWishlist = useCallback(
    (product, variationProduct, eventId) => {
      const price = variationProduct
        ? variationProduct?.variation_discount_price ||
          variationProduct?.variation_price
        : product?.product_discount_price || product?.product_price;

      fbq(
        "track",
        "AddToWishlist",
        {
          content_ids: toStringIds([variationProduct?._id || product?._id]),
          content_name: product?.product_name,
          content_type: "product",
          currency,
          value: toNumber(price),
        },
        { eventID: eventId },
      );
    },
    [currency],
  );

  return {
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackPurchase,
    trackLogin,
    trackCompleteRegistration,
    trackInitiateCheckout,
    trackSearch,
    trackAddToWishlist,
  };
};

export default useMetaPixel;
