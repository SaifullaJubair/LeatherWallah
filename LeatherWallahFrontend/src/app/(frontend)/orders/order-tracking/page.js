// src/app/(frontend)/orders/order-tracking/page.js
import Contain from "@/components/common/Contain";
import OrderTracking from "@/components/orderTracking/OrderTracking";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

// S7 (2026-06-04) — switched to DB-driven SEO via buildPageMeta so a clone
// owner can edit the title/description through Admin → Page SEO Management.
export async function generateMetadata() {
  return buildPageMeta("order-tracking");
}

const OrderTrackingPage = () => {
  return (
    <Contain>
      <OrderTracking />
    </Contain>
  );
};

export default OrderTrackingPage;
