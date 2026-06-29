"use client";

// src/components/analyticsScripts/utils/tiktokPixel/useTikTokPixel.js
// Meta Pixel এর useMetaPixel এর মতোই — সব browser events এখানে

import { useCallback } from "react";
import { ttq } from "@/components/frontend/tiktokPixel/TikTokPixelScript";
import useGetSettingData from "@/components/lib/getSettingData";
import { getCurrencyCode } from "@/utils/currency";

// ✅ value সব সময় Number
const toNumber = (val) => parseFloat(val) || 0;

const useTikTokPixel = () => {
  // M28 (2026-06-04) — currency code from settings (BDT fallback in helper).
  const { data: settingsData } = useGetSettingData();
  const currency = getCurrencyCode(settingsData);
  // ViewContent — product details page
  const trackViewContent = useCallback((product, eventId) => {
    ttq(
      "track",
      "ViewContent",
      {
        content_id: String(product?._id),
        content_name: product?.product_name,
        content_type: "product",
        currency,
        value: toNumber(
          product?.product_discount_price || product?.product_price,
        ),
      },
      { event_id: eventId },
    );
  }, [currency]);

  // AddToCart
  const trackAddToCart = useCallback(
    (product, variationProduct, quantity, eventId) => {
      const price = variationProduct
        ? variationProduct?.variation_discount_price ||
          variationProduct?.variation_price
        : product?.product_discount_price || product?.product_price;

      ttq(
        "track",
        "AddToCart",
        {
          content_id: String(variationProduct?._id || product?._id),
          content_name: product?.product_name,
          content_type: "product",
          currency,
          value: toNumber(price) * quantity,
          quantity,
        },
        { event_id: eventId },
      );
    },
    [currency],
  );

  // AddToWishlist
  const trackAddToWishlist = useCallback(
    (product, variationProduct, eventId) => {
      ttq(
        "track",
        "AddToWishlist",
        {
          content_id: String(variationProduct?._id || product?._id),
          content_name: product?.product_name,
          content_type: "product",
          currency,
          value: toNumber(
            variationProduct?.variation_discount_price ||
              variationProduct?.variation_price ||
              product?.product_discount_price ||
              product?.product_price,
          ),
        },
        { event_id: eventId },
      );
    },
    [currency],
  );

  // InitiateCheckout
  const trackInitiateCheckout = useCallback((data, eventId) => {
    ttq(
      "track",
      "InitiateCheckout",
      {
        currency,
        value: toNumber(data?.value),
        quantity: data?.num_items || 1,
      },
      { event_id: eventId },
    );
  }, [currency]);

  // Purchase
  const trackPurchase = useCallback((orderData, eventId) => {
    ttq(
      "track",
      "CompletePayment",
      {
        currency,
        value: toNumber(orderData?.grand_total_amount),
        quantity: orderData?.order_products?.length || 1,
        order_id: orderData?.purchase_event_id,
      },
      { event_id: eventId },
    );
  }, [currency]);

  // Search
  const trackSearch = useCallback((searchTerm, eventId) => {
    ttq(
      "track",
      "Search",
      {
        query: searchTerm,
      },
      { event_id: eventId },
    );
  }, []);

  // Login
  const trackLogin = useCallback((eventId) => {
    ttq("track", "Login", {}, { event_id: eventId });
  }, []);

  // CompleteRegistration
  const trackCompleteRegistration = useCallback((eventId) => {
    ttq("track", "CompleteRegistration", {}, { event_id: eventId });
  }, []);

  return {
    trackViewContent,
    trackAddToCart,
    trackAddToWishlist,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
    trackLogin,
    trackCompleteRegistration,
  };
};

export default useTikTokPixel;
