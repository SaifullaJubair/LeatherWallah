import { splitName } from "./nameSplit";

// S4+S5 Phase 1B — single source of truth for the user_data payload
// sent to Meta + TikTok CAPI from logged-in browsing events
// (ViewContent, AddToCart, AddToWishlist, etc.).
//
// Returns the EMQ-rich shape: ph + fn + ln + em + ct + st + country
// + external_id. Anonymous visitors → returns only `country: "bd"`
// (server-side IP enrichment fills the rest).
//
// Checkout-time userData (Purchase, InitiateCheckout) builds its own
// shape because form-derived district/division WINS over saved
// address — see AddToCart.jsx call sites.

export const buildAnalyticsUserData = (userInfo, extras = {}) => {
  const u = userInfo?.data;
  if (!u) {
    return { country: "bd", ...extras };
  }
  const { fn, ln } = splitName(u.user_name);
  return {
    ph: u.user_phone,
    fn,
    ln,
    em: u.user_email,
    ct: u.user_district,
    st: u.user_division,
    country: "bd",
    external_id: u._id,
    ...extras,
  };
};
