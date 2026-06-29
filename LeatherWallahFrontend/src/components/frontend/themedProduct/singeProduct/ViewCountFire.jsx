/**
 * ViewCountFire — F2. Fire-and-forget POST /product/view-count once per
 * product per browser session. The endpoint just $inc's a counter, no auth.
 *
 * sessionStorage dedupe keeps refreshes / quick back-forward from inflating
 * the count. (BE has no per-IP throttling — that's intentional; storefront
 * is the source of truth for what counts as a "view".)
 */

"use client";
import { useEffect } from "react";
import { BASE_URL } from "@/components/utils/baseURL";

const SESSION_KEY = "pdp_viewed_ids";

const ViewCountFire = ({ productId }) => {
  useEffect(() => {
    if (!productId) return;
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const seen = raw ? JSON.parse(raw) : [];
      if (Array.isArray(seen) && seen.includes(String(productId))) return;
      fetch(`${BASE_URL}/product/view-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
        keepalive: true,
      }).catch(() => {});
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify([...seen, String(productId)]),
      );
    } catch (_) {
      // sessionStorage blocked (private mode); skip dedupe and fire once.
      fetch(`${BASE_URL}/product/view-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [productId]);

  return null;
};

export default ViewCountFire;
