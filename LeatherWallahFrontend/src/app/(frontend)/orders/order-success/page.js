// src/app/(frontend)/orders/order-success/page.jsx
import { buildPageMeta } from "@/components/lib/buildPageMeta";
import { Suspense } from "react";
import Contain from "@/components/common/Contain";
import OrderSuccessContent from "@/components/order/OrderSuccess";

export async function generateMetadata() {
  return buildPageMeta("orderSuccess");
}

const OrderSuccessPage = () => {
  return (
    <Suspense
      fallback={
        <Contain>
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </Contain>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
};

export default OrderSuccessPage;
