"use client";

// src/components/analyticsScripts/utils/gtm/useGTM.js
// GTM dataLayer এ custom events push করার hook
// GA4 এই events গুলো automatically track করবে

import useGetSettingData from "@/components/lib/getSettingData";
import { getCurrencyCode } from "@/utils/currency";

export const useGTM = () => {
  // M28 (2026-06-04) — currency code from settings (BDT fallback inside helper).
  const { data: settingsData } = useGetSettingData();
  const currency = getCurrencyCode(settingsData);
  const pushEvent = (eventName, eventData = {}) => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  };

  // ── E-commerce Events ─────────────────────────────────────────────────────

  // Product দেখলে
  const trackViewItem = (product) => {
    pushEvent("view_item", {
      currency,
      value: product.price,
      items: [
        {
          item_id: product._id,
          item_name: product.product_name,
          price: product.price,
          quantity: 1,
          item_brand: product.brand || "",
          item_category: product.category || "",
        },
      ],
    });
  };

  // Cart এ add করলে
  const trackAddToCart = (product, quantity = 1) => {
    pushEvent("add_to_cart", {
      currency,
      value: product.price * quantity,
      items: [
        {
          item_id: product._id,
          item_name: product.product_name,
          price: product.price,
          quantity,
          item_brand: product.brand || "",
          item_category: product.category || "",
        },
      ],
    });
  };

  // Wishlist এ add করলে
  const trackAddToWishlist = (product) => {
    pushEvent("add_to_wishlist", {
      currency,
      value: product.price,
      items: [
        {
          item_id: product._id,
          item_name: product.product_name,
          price: product.price,
          quantity: 1,
        },
      ],
    });
  };

  // Checkout শুরু করলে
  const trackBeginCheckout = (cartItems, totalValue) => {
    pushEvent("begin_checkout", {
      currency,
      value: totalValue,
      items: cartItems.map((item) => ({
        item_id: item._id,
        item_name: item.product_name,
        price: item.price,
        quantity: item.quantity || 1,
      })),
    });
  };

  // Purchase complete হলে
  const trackPurchase = (order) => {
    pushEvent("purchase", {
      transaction_id: order._id,
      currency,
      value: order.total_amount,
      items:
        order.orderItems?.map((item) => ({
          item_id: item.product_id,
          item_name: item.product_name,
          price: item.price,
          quantity: item.quantity || 1,
        })) || [],
    });
  };

  // Search করলে
  const trackSearch = (searchTerm) => {
    pushEvent("search", {
      search_term: searchTerm,
    });
  };

  // Login করলে
  const trackLogin = (method = "phone") => {
    pushEvent("login", { method });
  };

  // Sign up করলে
  const trackSignUp = (method = "phone") => {
    pushEvent("sign_up", { method });
  };

  // Page view (SPA navigation এর জন্য)
  const trackPageView = (pagePath, pageTitle) => {
    pushEvent("page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
  };

  return {
    trackViewItem,
    trackAddToCart,
    trackAddToWishlist,
    trackBeginCheckout,
    trackPurchase,
    trackSearch,
    trackLogin,
    trackSignUp,
    trackPageView,
    pushEvent, // custom event এর জন্য
  };
};
