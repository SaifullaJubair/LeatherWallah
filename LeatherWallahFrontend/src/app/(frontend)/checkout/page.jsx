// src/app/(frontend)/checkout/page.jsx
// S1 (2026-06-04) — was /cart, renamed to /checkout. The underlying
// AddToCart component already does the full checkout flow (delivery info +
// payment + place order). The old /checkout route + CheckoutProduct.jsx
// were dead duplicates and have been removed.
import AddToCart from "@/components/frontend/cart/AddToCart";

import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("checkout");
}
const CheckoutPage = () => {
  return (
    <div>
      <AddToCart />
    </div>
  );
};

export default CheckoutPage;
