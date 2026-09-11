// Shared order-status constants for the admin Order module.
//
// These used to live inside ViewAllOrderInfo.jsx only, which is why the Order
// List had no way to advance a status — the map simply wasn't reachable from
// there. Keeping ONE copy here means the list and the detail page can never
// drift apart.
//
// NEXT_STATUS_OPTIONS MUST stay in sync with ALLOWED_STATUS_TRANSITIONS in
// backend `order.service.ts`. The server is the real guard (it rejects an
// illegal jump with 400); this map only drives which options the UI offers.

export const NEXT_STATUS_OPTIONS = {
  pending: ["on_hold", "confirmed", "cancel"],
  on_hold: ["confirmed", "cancel"],
  confirmed: ["processing", "cancel"],
  processing: ["shipped", "cancel"],
  shipped: ["delivered", "return"],
  delivered: ["completed", "return"],
  // terminal — no onward transitions
  completed: [],
  cancel: [],
  return: [],
};

export const ORDER_STATUS_COLOR = {
  pending: "bg-orange-100 text-orange-700",
  on_hold: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-teal-100 text-teal-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancel: "bg-red-100 text-red-700",
  return: "bg-rose-100 text-rose-700",
};

// Statuses where handing the parcel to a courier still makes sense. Past
// `processing` the parcel is already out (or the order is dead), so offering
// "Send Pathao/Steadfast" there would create a second consignment.
export const COURIER_SENDABLE_STATUSES = ["pending", "confirmed", "processing"];

// An order whose parcel is already with a courier must not be cancelled or
// returned from the admin tables: the courier still holds the goods, and
// restocking now would drift inventory. Use the courier cancel/sync flow.
export const isCourierLocked = (order) =>
  (order?.courier_type === "steadfast" && !!order?.steadfast_consignment_id) ||
  (order?.courier_type === "pathao" && !!order?.consignment_id);

// Which tab a status lands in, so the UI can tell the admin where a row went
// after its status changed (rows filter out of the current tab immediately).
export const TAB_FOR_STATUS = {
  pending: "Pending",
  delivered: "Delivered",
  cancel: "Cancelled",
};
export const tabHintForStatus = (status) => TAB_FOR_STATUS[status] || "All";

// `+8801712345678` / `8801712345678` / `01712345678` → `01712345678`
// PendingRow strips the country code before hitting /fraud-check; the other
// tables must strip it the same way or the fraud page looks up nothing.
export const normalizePhoneForFraud = (phone) =>
  String(phone || "").replace(/^\+?88/, "");
