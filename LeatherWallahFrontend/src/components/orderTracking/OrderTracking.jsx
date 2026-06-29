"use client";
import { useState } from "react";
import { FiTruck, FiArrowLeft } from "react-icons/fi";
import MyOrderTracking from "./MyOrderTracking";
import OrderTrackingForm from "./OrderTrackingForm";

const OrderTracking = () => {
  const [order, setOrder] = useState();

  return (
    <div className="py-8 max-w-3xl mx-auto">
      {order?.data ? (
        <div>
          <button
            onClick={() => setOrder(undefined)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
          >
            <FiArrowLeft size={14} />
            Track another order
          </button>
          <MyOrderTracking
            order={order?.data?.order_info}
            productOrder={order?.data?.order_products}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
            <FiTruck size={16} className="text-primary" />
            <h1 className="text-sm font-semibold text-gray-700">Track Your Order</h1>
          </div>

          <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
            {/* Illustration */}
            <div className="shrink-0">
              <img
                src="/assets/images/empty/tracking.png"
                alt="Order tracking"
                className="w-36 h-36 object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            {/* Form side */}
            <div className="flex-1 w-full">
              <h2 className="text-base font-semibold text-gray-800 mb-1">
                Where is my order?
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-1">
                Enter your Invoice ID to see the latest status of your order.
                You can find it in the confirmation SMS or your order receipt.
              </p>
              <OrderTrackingForm setOrder={setOrder} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
