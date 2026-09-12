// /orders/order-tracking/[id]/page.jsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BASE_URL } from "@/components/utils/baseURL";
import MyOrderTracking from "@/components/orderTracking/MyOrderTracking";
import { FaTruck } from "react-icons/fa";
import { toast } from "react-toastify";

const OrderTrackingPage = () => {
  const { id } = useParams(); // invoice_id

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchOrderByInvoice();
  }, [id]);

  const fetchOrderByInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      // ১. invoice_id দিয়ে order আনো
      const res = await fetch(`${BASE_URL}/order/order_tracking`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: id }),
      });
      const result = await res.json();

      const orderInfo = result?.data?.order_info;
      const orderProducts = result?.data?.order_products;

      // An unknown invoice still answers 200 with success:true and
      // `data: { order_info: null }`, so checking `result.data` alone let a
      // null order through to MyOrderTracking, which threw and handed the
      // visitor the generic "something went wrong" boundary. Anyone mistyping
      // an invoice from an SMS saw a broken site instead of "not found".
      if (!result?.success || !orderInfo) {
        setError("Order not found. Please check your Invoice ID.");
        return;
      }

      // ২. Courier status sync based on courier type
      if (orderInfo?.courier_type) {
        try {
          let syncRes;

          if (
            orderInfo.courier_type === "steadfast" &&
            orderInfo?.steadfast_consignment_id
          ) {
            // Steadfast sync
            syncRes = await fetch(
              `${BASE_URL}/courier/steadfast/sync/${orderInfo?._id}`,
              {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
              },
            );
          } else if (
            orderInfo.courier_type === "pathao" &&
            orderInfo?.pathao_consignment_id
          ) {
            // Pathao sync
            syncRes = await fetch(
              `${BASE_URL}/courier/pathao/sync/${orderInfo?._id}`,
              {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          if (syncRes) {
            const syncData = await syncRes.json();

            // sync সফল হলে updated status merge করো
            if (syncData?.success) {
              if (orderInfo.courier_type === "steadfast") {
                orderInfo.steadfast_status = syncData?.data?.steadfast_status;
              } else if (orderInfo.courier_type === "pathao") {
                orderInfo.pathao_status = syncData?.data?.pathao_status;
                orderInfo.pathao_tracking_code =
                  syncData?.data?.pathao_tracking_code;
                orderInfo.pathao_delivery_fee =
                  syncData?.data?.pathao_delivery_fee;
                orderInfo.pathao_delivery_time =
                  syncData?.data?.pathao_delivery_time;
              }
              orderInfo.order_status = syncData?.data?.order_status;
            }
          }
        } catch (syncError) {
          console.error("Courier sync failed:", syncError);
          // sync fail হলে পুরনো data দিয়েই চলবে, error দেখাবে না
        }
      }

      setOrder({ order_info: orderInfo, order_products: orderProducts });
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Fetching order details...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <FaTruck size={28} className="text-red-300" />
        </div>
        <p className="text-gray-700 font-medium">{error}</p>
        <p className="font-mono text-sm text-gray-400">Invoice: {id}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={fetchOrderByInvoice}
            className="px-5 py-2 text-sm bg-primary text-white rounded hover:opacity-90"
          >
            Try Again
          </button>
          {/* Retrying a wrong invoice just fails again, so offer the form
              where a different number can be typed. */}
          <Link
            href="/orders/order-tracking"
            className="px-5 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Track another order
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      <MyOrderTracking
        order={order?.order_info}
        productOrder={order?.order_products}
      />
    </div>
  );
};

export default OrderTrackingPage;
