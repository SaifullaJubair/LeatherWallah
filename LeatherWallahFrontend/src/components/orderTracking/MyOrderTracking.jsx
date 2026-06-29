"use client";
import { useEffect, useState } from "react";
import Stepper from "./Stepper";
import { EnglishDateWithTimeShort } from "../utils/EnglishDateWithTimeShort";
import {
  FaTruck,
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaRegCreditCard,
  FaRupeeSign,
  FaCalendarAlt,
  FaChevronDown,
  FaExternalLinkAlt,
  FaCity,
  FaMapPin,
  FaMoneyBillWave,
  FaTag,
  FaShippingFast,
  FaStore,
  FaBoxes,
  FaRoad,
  FaHourglassHalf,
  FaCheckDouble,
  FaExclamationTriangle,
  FaGlobe,
} from "react-icons/fa";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import useGetSettingData from "@/components/lib/getSettingData";
import { currencyOf } from "@/utils/currency";

// Status configurations
const STATUS_LABEL = {
  // order statuses
  pending:   "Order Placed",
  on_hold:   "On Hold",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped:   "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancel:    "Cancelled",
  return:    "Returned",
  // courier statuses
  in_review: "In Review",
  hold: "On Hold",
  delivered_approval_pending: "Delivery Pending Approval",
  partial_delivered_approval_pending: "Partial Delivery Pending",
  cancelled_approval_pending: "Cancellation Pending",
  unknown_approval_pending: "Unknown — Pending",
  partial_delivered: "Partially Delivered",
  cancelled: "Cancelled",
  unknown: "Unknown",
};

const STATUS_GRADIENT = {
  pending:   "from-orange-500 to-amber-500",
  on_hold:   "from-yellow-500 to-amber-600",
  confirmed: "from-teal-500 to-cyan-500",
  processing: "from-blue-400 to-indigo-500",
  shipped:   "from-cyan-500 to-blue-500",
  delivered: "from-emerald-500 to-teal-500",
  completed: "from-emerald-600 to-green-500",
  cancel:    "from-rose-500 to-pink-500",
  return:    "from-rose-400 to-red-500",
  // courier statuses (kept for courier badge reuse)
  partial_delivered: "from-amber-500 to-orange-500",
  cancelled: "from-rose-500 to-pink-500",
  in_review: "from-blue-500 to-indigo-500",
  hold: "from-purple-500 to-pink-500",
  unknown: "from-gray-400 to-gray-500",
};

// Courier status configurations
const COURIER_STATUS_CONFIG = {
  steadfast: {
    label: {
      in_review: "In Review",
      pending: "Pickup Pending",
      hold: "On Hold",
      delivered: "Delivered",
      partial_delivered: "Partially Delivered",
      cancelled: "Cancelled",
      delivered_approval_pending: "Delivery Pending",
      partial_delivered_approval_pending: "Partial Delivery Pending",
      cancelled_approval_pending: "Cancellation Pending",
      unknown_approval_pending: "Unknown — Pending",
      unknown: "Unknown",
    },
    color: {
      delivered: "bg-emerald-100 text-emerald-700",
      partial_delivered: "bg-amber-100 text-amber-700",
      cancelled: "bg-red-100 text-red-700",
      in_review: "bg-blue-100 text-blue-700",
      pending: "bg-orange-100 text-orange-700",
      hold: "bg-purple-100 text-purple-700",
      unknown: "bg-gray-100 text-gray-500",
    },
  },
  pathao: {
    label: {
      Delivered: "Delivered",
      "Partial Delivery": "Partial Delivery",
      Cancelled: "Cancelled",
      "In Transit": "In Transit",
      "Out for Delivery": "Out for Delivery",
      Return: "Return",
      "Delivery Failed": "Delivery Failed",
      "On Hold": "On Hold",
      "Pickup Requested": "Pickup Requested",
      "Pickup Scheduled": "Pickup Scheduled",
      "Picked Up": "Picked Up",
      "Arrived at Hub": "Arrived at Hub",
    },
    color: {
      Delivered: "bg-emerald-100 text-emerald-700",
      "Partial Delivery": "bg-amber-100 text-amber-700",
      Cancelled: "bg-red-100 text-red-700",
      "In Transit": "bg-purple-100 text-purple-700",
      "Out for Delivery": "bg-orange-100 text-orange-700",
      Return: "bg-red-50 text-red-500",
      "Delivery Failed": "bg-red-50 text-red-500",
      "On Hold": "bg-purple-50 text-purple-500",
      "Pickup Requested": "bg-blue-100 text-blue-700",
      "Pickup Scheduled": "bg-blue-100 text-blue-700",
      "Picked Up": "bg-indigo-100 text-indigo-700",
      "Arrived at Hub": "bg-indigo-100 text-indigo-700",
    },
  },
};

const TimelineStep = ({ label, time, icon, isLast = false }) => {
  if (!time) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex gap-4 items-start relative"
    >
      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white shadow-lg relative z-10"
        >
          {icon}
        </motion.div>
        {!isLast && (
          <div className="w-0.5 bg-gradient-to-b from-primary/30 to-gray-200 flex-1 mt-2 min-h-[40px]" />
        )}
      </div>
      <motion.div
        whileHover={{ x: 5 }}
        className="pb-6 flex-1 bg-white rounded-lg p-3 shadow-sm border border-gray-100"
      >
        <p className="text-base font-semibold text-gray-800">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <FaCalendarAlt className="text-gray-400 text-xs" />
          <p className="text-xs text-gray-500">
            {EnglishDateWithTimeShort(time)}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TrackingCard = ({ title, children, icon, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    transition={{ duration: 0.3 }}
    className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}
  >
    <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
      <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </motion.div>
);

const StatusBadge = ({ status, size = "md", type = "order" }) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // For courier statuses
  if (type === "courier") {
    return (
      <motion.span
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`inline-block rounded-full font-medium ${sizeClasses[size]} ${
          COURIER_STATUS_CONFIG[type]?.color[status] ||
          "bg-gray-100 text-gray-700"
        }`}
      >
        {COURIER_STATUS_CONFIG[type]?.label[status] || status}
      </motion.span>
    );
  }

  // For order statuses
  return (
    <motion.span
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-block rounded-full font-semibold shadow-md bg-gradient-to-r ${
        STATUS_GRADIENT[status] || "from-gray-400 to-gray-500"
      } text-white ${sizeClasses[size]}`}
    >
      {STATUS_LABEL[status] || status || "Unknown"}
    </motion.span>
  );
};

const CourierTrackingCard = ({ order }) => {
  // M28 (2026-06-04) — currency symbol from settings.
  const { data: settingsData } = useGetSettingData();
  const cur = currencyOf(settingsData);
  const isSteadfast = order?.courier_type === "steadfast";
  const isPathao = order?.courier_type === "pathao";

  if (!isSteadfast && !isPathao) return null;

  const getCourierIcon = () => {
    if (isSteadfast) return <FaTruck className="text-orange-500" />;
    if (isPathao) return <FaRoad className="text-blue-500" />;
    return <FaTruck />;
  };

  const getCourierColor = () => {
    if (isSteadfast) return "orange";
    if (isPathao) return "blue";
    return "primary";
  };

  const getTrackingUrl = () => {
    if (isSteadfast && order?.steadfast_tracking_code) {
      return `https://steadfast.com.bd/t/${order?.steadfast_tracking_code}`;
    }
    if (isPathao && order?.pathao_tracking_code) {
      return `https://pathao.com/track/${order?.pathao_tracking_code}`;
    }
    return null;
  };

  const color = getCourierColor();
  const trackingUrl = getTrackingUrl();

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-gradient-to-r from-${color}-50 to-amber-50 rounded-2xl shadow-xl p-6 border-l-4 border-${color}-400`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 bg-${color}-500 rounded-xl text-white`}>
          {getCourierIcon()}
        </div>
        <h3 className="font-bold text-gray-800 text-lg">
          Courier Tracking -{" "}
          {order?.courier_type?.charAt(0).toUpperCase() +
            order?.courier_type?.slice(1)}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Current Status</p>
          <StatusBadge
            status={
              isSteadfast ? order?.steadfast_status : order?.pathao_status
            }
            type="courier"
            size="md"
          />
        </div>

        <div className="bg-white/60 backdrop-blur rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Consignment ID</p>
          <p className="font-mono font-bold text-gray-800 text-lg">
            {isSteadfast
              ? order?.steadfast_consignment_id
              : order?.pathao_consignment_id || "-"}
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-2">Tracking Code</p>
          <p className="font-mono font-bold text-gray-800 text-lg break-all">
            {isSteadfast
              ? order?.steadfast_tracking_code
              : order?.pathao_tracking_code || "-"}
          </p>
        </div>
      </div>

      {/* Pathao specific delivery info */}
      {isPathao && order?.pathao_delivery_fee && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 mb-1">Delivery Fee</p>
            <p className="font-medium text-gray-800">
              {cur.symbol}{order.pathao_delivery_fee}
            </p>
          </div>
          {order?.pathao_delivery_time && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">Est. Delivery</p>
              <p className="font-medium text-gray-800">
                {order.pathao_delivery_time}
              </p>
            </div>
          )}
        </div>
      )}

      {trackingUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-end"
        >
          <motion.a
            whileHover={{ x: 5 }}
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-${color}-600 hover:text-${color}-700 font-medium shadow-sm`}
          >
            Track on{" "}
            {order?.courier_type?.charAt(0).toUpperCase() +
              order?.courier_type?.slice(1)}{" "}
            <FaExternalLinkAlt size={12} />
          </motion.a>
        </motion.div>
      )}
    </motion.section>
  );
};

const MyOrderTracking = ({ order, productOrder }) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
  });
  // M28 (2026-06-04) — currency symbol from settings (BDT fallback in helper).
  const { data: settingsData } = useGetSettingData();
  const cur = currencyOf(settingsData);

  useEffect(() => {
    const total = productOrder?.reduce(
      (acc, p) => acc + p.product_quantity * p.product_unit_final_price,
      0,
    );
    setTotalAmount(total || 0);
  }, [productOrder]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return "N/A";
    return EnglishDateWithTimeShort(dateString);
  };

  const getShippingLocation = () => {
    if (order?.pathao_city_name && order?.pathao_zone_name) {
      return `${order.pathao_zone_name}, ${order.pathao_city_name}`;
    }
    return order?.shipping_location || "Standard Delivery";
  };

  // Hero Section
  const HeroSection = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary text-white p-8 mb-8 shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-white/80 text-sm mb-2">Order Status</p>
            <h1 className="text-4xl font-bold mb-2 text-white">
              Order #{order?.invoice_id}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={order?.order_status} size="lg" />
              <span className="text-white/80 text-sm flex items-center gap-1">
                <FaCalendarAlt size={12} />
                Placed on {formatOrderDate(order?.pending_time)}
              </span>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 min-w-[160px]">
            <p className="text-white/80 text-sm mb-1">Grand Total</p>
            <p className="text-3xl font-bold">{cur.symbol}{order?.grand_total_amount}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Delivery Address Card
  const DeliveryAddress = () => (
    <TrackingCard title="Delivery Address" icon={<FaMapMarkerAlt size={18} />}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <FaUser className="text-gray-400 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-800">
              {order?.customer_id?.user_name || "Customer"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <FaPhone className="text-gray-400 flex-shrink-0" size={14} />
              <span className="text-sm text-gray-600">
                {order?.customer_phone || order?.customer_id?.user_phone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FaMapPin className="text-gray-400 flex-shrink-0" size={14} />
            <div>
              <span className="text-[10px] text-gray-400 block leading-tight">
                District
              </span>
              <span className="text-sm text-gray-600">
                {order?.billing_state || "N/A"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FaCity className="text-gray-400 flex-shrink-0" size={14} />
            <div>
              <span className="text-[10px] text-gray-400 block leading-tight">
                Thana/Upazila
              </span>
              <span className="text-sm text-gray-600">
                {order?.billing_city || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Pathao Zone Info with Full Address */}

        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-600 font-medium mb-2 flex items-center gap-1">
            <FaRoad size={12} />
            Full Address
          </p>
          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            {order.pathao_zone_name}
          </p>
        </div>
      </div>
    </TrackingCard>
  );

  // Payment Info Card
  const PaymentInfo = () => (
    <TrackingCard
      title="Payment Information"
      icon={<FaRegCreditCard size={18} />}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 flex items-center gap-2">
            <FaMoneyBillWave className="text-gray-400" />
            Payment Method
          </span>
          <span className="font-medium text-gray-800">
            {order?.payment_method || "Cash on Delivery"}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Payment Status</span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              order?.payment_status === "paid"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {order?.payment_status === "paid" ? "Paid" : "Pending"}
          </motion.span>
        </div>

        {order?.coupon_id && (
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <FaTag className="text-green-500" />
              Coupon Applied
            </span>
            <span className="text-xs font-medium text-green-600">
              {order.coupon_id}
            </span>
          </div>
        )}
      </div>
    </TrackingCard>
  );

  // Shipping Info Card
  const ShippingInfo = () => (
    <TrackingCard
      title="Shipping Information"
      icon={<FaShippingFast size={18} />}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Shipping Method</span>
          <span className="font-medium text-gray-800">
            {getShippingLocation()}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Shipping Cost</span>
          <span className="font-medium text-gray-800">
            {cur.symbol}{order?.shipping_cost || 0}
          </span>
        </div>

        {order?.courier_type && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Courier Service</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.courier_type === "steadfast"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {order.courier_type === "steadfast" ? "Steadfast" : "Pathao"}
            </span>
          </div>
        )}
      </div>
    </TrackingCard>
  );

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <HeroSection />

      {/* Stepper */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Order Progress</h2>
        </div>
        <Stepper order={order} />
      </motion.section>

      {/* Courier Tracking Card */}
      <CourierTrackingCard order={order} />

      {/* Address, Payment and Shipping Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DeliveryAddress />
        <PaymentInfo />
        <ShippingInfo />
      </div>

      {/* Timeline */}
      <TrackingCard title="Order Timeline" icon={<FiClock size={18} />}>
        <div className="space-y-2">
          <TimelineStep
            label="Order Placed"
            time={order?.pending_time}
            icon={<FaBoxOpen size={14} />}
          />
          <TimelineStep
            label="Processing"
            time={order?.processing_time}
            icon={<FiClock size={14} />}
          />
          <TimelineStep
            label="Shipped"
            time={order?.shipped_time}
            icon={<FiTruck size={14} />}
          />
          <TimelineStep
            label="Delivered"
            time={order?.delivered_time}
            icon={<FiCheckCircle size={14} />}
            isLast={!order?.cancel_time && !order?.return_time}
          />
          <TimelineStep
            label="Cancelled"
            time={order?.cancel_time}
            icon={<FiXCircle size={14} />}
          />
          <TimelineStep
            label="Returned"
            time={order?.return_time}
            icon={<FiXCircle size={14} />}
          />
        </div>
      </TrackingCard>

      {/* Order Summary */}
      <TrackingCard title="Order Summary" icon={<FiPackage size={18} />}>
        <div className="space-y-4">
          <button
            onClick={() => toggleSection("summary")}
            className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700">
              View Items ({productOrder?.length || 0})
            </span>
            <FaChevronDown
              className={`transform transition-transform duration-300 ${expandedSections.summary ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {expandedSections.summary && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                {productOrder?.length > 0 ? (
                  productOrder?.map((product, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                        <img
                          src={
                            (product?.variation_id
                              ? product?.variation_id?.variation_image
                              : product?.product_id?.main_image) ||
                            product?.product_image_snapshot
                          }
                          alt={
                            product?.product_id?.product_name ||
                            product?.product_name_snapshot
                          }
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/80x80?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {product?.product_id?.product_name ||
                            product?.product_name_snapshot}
                        </p>
                        {product?.variation_id && (
                          <p className="text-xs text-gray-500 mt-1">
                            {product?.variation_id?.variation_name}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-sm text-gray-600">
                            {product?.product_quantity} × {cur.symbol}
                            {product?.product_unit_final_price}
                          </span>
                          <span className="font-bold text-primary">
                            {cur.symbol}
                            {product?.product_quantity *
                              product?.product_unit_final_price}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No products found
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TrackingCard>

      {/* Price Details */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FaRupeeSign className="text-primary" />
          Price Details
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white rounded-xl">
            <span className="text-gray-600">Sub Total</span>
            <span className="font-semibold text-gray-800">
              {cur.symbol}{order?.sub_total_amount || totalAmount}
            </span>
          </div>

          {order?.discount_amount > 0 && (
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
              <span className="text-gray-600 flex items-center gap-2">
                <FaTag className="text-green-500" />
                Discount
              </span>
              <span className="font-semibold text-green-600">
                - {cur.symbol}{order?.discount_amount}
              </span>
            </div>
          )}

          {order?.shipping_cost > 0 && (
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
              <span className="text-gray-600 flex items-center gap-2">
                <FaShippingFast className="text-blue-500" />
                Shipping
              </span>
              <span className="font-semibold text-blue-600">
                + {cur.symbol}{order?.shipping_cost}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl mt-4">
            <span className="font-bold text-gray-800 text-lg">Grand Total</span>
            <span className="font-bold text-primary text-2xl">
              {cur.symbol}{order?.grand_total_amount}
            </span>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default MyOrderTracking;
