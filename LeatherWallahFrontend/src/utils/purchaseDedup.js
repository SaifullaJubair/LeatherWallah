// S4+S5 Phase 1B B6 — browser-side Purchase event dedup.
// localStorage guard prevents re-fire on /order-success reload,
// success-URL share between devices, email-link clicks, etc.
//
// Server-side guard (order.meta_purchase_sent / tiktok_purchase_sent)
// is the ultimate guarantee — even if storage is wiped, the CAPI
// service will skip a Purchase event for an order that's already
// been marked sent.
//
// Returns true if the event was just fired (caller should NOT
// re-fire); false if it was a duplicate (already counted).

const KEY = "purchased_order_ids";
const KEEP = 50;

export const firePurchaseOnce = (orderId, fireFn) => {
  if (!orderId) {
    // No id = can't dedup; fire and hope server-side guard catches dupes.
    fireFn();
    return true;
  }
  if (typeof window === "undefined") {
    fireFn();
    return true;
  }
  try {
    const fired = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (fired.includes(orderId)) return false;
    fireFn();
    fired.push(orderId);
    localStorage.setItem(KEY, JSON.stringify(fired.slice(-KEEP)));
    return true;
  } catch {
    // Storage disabled (private mode / quota / iframe). Server guard
    // still protects us; fall through to fire once locally.
    fireFn();
    return true;
  }
};
