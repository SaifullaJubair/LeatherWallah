/**
 * AbandonedCartCapture — F3.
 *
 * Fires `POST /abandoned-cart/capture` when the buyer reached checkout-intent
 * but is leaving without placing the order. Capture keyed by `customer_phone`
 * on the BE (upsert; repeat captures update the same row). After successful
 * placement the BE auto-flips the row to `recovered: true`, so we don't need
 * to "uncapture" — placement does that for us.
 *
 * Trigger strategy (mounted inside the checkout form):
 *   - Wait until a phone is present (typed or autofilled from userInfo).
 *   - On phone changing settle: debounce 30s, then send once.
 *   - On window beforeunload / tab hide (pagehide): fire `keepalive` send.
 *   - Re-send if cart/phone/step changes meaningfully.
 *
 * Best-effort: silent fail, no UI surface. Public endpoint (no auth needed).
 */

"use client";
import { useEffect, useRef } from "react";
import { BASE_URL } from "@/components/utils/baseURL";
import { normalizeBdPhone } from "@/utils/phone";

const sendCapture = (body) => {
  if (!body?.customer_phone) return;
  try {
    fetch(`${BASE_URL}/abandoned-cart/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch (_) {
    // silent
  }
};

const buildBody = ({
  phone,
  name,
  email,
  userId,
  orderData,
  step = "cart",
}) => {
  if (!phone || !orderData) return null;
  const items = [];
  for (const shop of orderData?.shop_products || []) {
    for (const p of shop?.order_products || []) {
      items.push({
        product_id: p?.product_id || p?._id,
        variation_id: p?.variation_id || undefined,
        product_name: p?.product_name,
        unit_price:
          Number(p?.product_unit_final_price) ||
          Number(p?.product_unit_price) ||
          0,
        quantity: Number(p?.product_quantity) || 1,
      });
    }
  }
  return {
    user_id: userId || undefined,
    // F1.3 — store in the same E.164 form the order will use, so
    // markAbandonedCartRecoveredByPhone(order.customer_phone) actually matches
    // this row when the buyer returns and places the order.
    customer_phone: normalizeBdPhone(phone) || phone,
    customer_name: name || undefined,
    customer_email: email || undefined,
    items,
    cart_total: Number(orderData?.grand_total_amount) || 0,
    step,
  };
};

const AbandonedCartCapture = ({
  phone,
  name,
  email,
  userId,
  orderData,
  step = "cart",
}) => {
  const lastSentRef = useRef("");

  // Debounced capture as the user types/changes phone or cart.
  useEffect(() => {
    if (!phone) return;
    const body = buildBody({ phone, name, email, userId, orderData, step });
    if (!body || !body.items?.length) return;
    const fingerprint = JSON.stringify({
      p: body.customer_phone,
      n: body.customer_name,
      t: body.cart_total,
      i: body.items.length,
      s: body.step,
    });
    if (fingerprint === lastSentRef.current) return;
    const id = setTimeout(() => {
      sendCapture(body);
      lastSentRef.current = fingerprint;
    }, 30_000);
    return () => clearTimeout(id);
  }, [phone, name, email, userId, orderData, step]);

  // Fire on tab hide / beforeunload — last chance to capture an exit.
  useEffect(() => {
    const handler = () => {
      const body = buildBody({ phone, name, email, userId, orderData, step });
      if (!body || !body.items?.length) return;
      sendCapture(body);
    };
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handler();
    });
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, [phone, name, email, userId, orderData, step]);

  return null;
};

export default AbandonedCartCapture;
