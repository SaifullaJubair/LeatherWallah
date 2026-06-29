"use client";
import { motion } from "framer-motion";
import {
  FaShoppingBag,
  FaClock,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaBoxOpen,
  FaShippingFast,
  FaHome,
  FaStore,
} from "react-icons/fa";
import { MdPendingActions, MdOutlineVerified } from "react-icons/md";
import { useEffect, useState } from "react";

const Stepper = ({ order }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Define all possible order statuses and their steps
  const orderSteps = [
    {
      id: "pending",
      label: "Order Placed",
      icon: <FaShoppingBag size={18} />,
      description: "Your order has been placed successfully",
      time: order?.pending_time,
      status: "completed",
    },
  ];

  // on_hold — show only if this status was reached
  if (order?.on_hold_time || order?.order_status === "on_hold") {
    orderSteps.push({
      id: "on_hold",
      label: "On Hold",
      icon: <FaClock size={18} />,
      description: "Your order is temporarily on hold",
      time: order?.on_hold_time,
      status:
        order?.order_status === "on_hold"
          ? "current"
          : order?.on_hold_time
            ? "completed"
            : "pending",
    });
  }

  orderSteps.push(
    {
      id: "confirmed",
      label: "Confirmed",
      icon: <MdOutlineVerified size={18} />,
      description: "Order confirmed by seller",
      time: order?.confirmed_time,
      status:
        order?.order_status === "confirmed"
          ? "current"
          : order?.confirmed_time
            ? "completed"
            : "pending",
    },
    {
      id: "processing",
      label: "Processing",
      icon: <FaBoxOpen size={18} />,
      description: "Seller is packing your order",
      time: order?.processing_time,
      status:
        order?.order_status === "processing"
          ? "current"
          : order?.processing_time
            ? "completed"
            : "pending",
    },
    {
      id: "shipped",
      label: "Shipped",
      icon: <FaTruck size={18} />,
      description: "Order has been handed over to courier",
      time: order?.shipped_time,
      status:
        order?.order_status === "shipped"
          ? "current"
          : order?.shipped_time
            ? "completed"
            : "pending",
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: <FaCheckCircle size={18} />,
      description: "Order has been delivered successfully",
      time: order?.delivered_time,
      status:
        order?.order_status === "delivered"
          ? "current"
          : order?.delivered_time
            ? "completed"
            : "pending",
    },
    {
      id: "completed",
      label: "Completed",
      icon: <FaHome size={18} />,
      description: "Order completed",
      time: order?.completed_time,
      status:
        order?.order_status === "completed"
          ? "current"
          : order?.completed_time
            ? "completed"
            : "pending",
    },
  );

  // cancel/return — show only if reached
  if (order?.cancel_time || order?.order_status === "cancel") {
    orderSteps.push({
      id: "cancel",
      label: "Cancelled",
      icon: <FaTimesCircle size={18} />,
      description: "Order has been cancelled",
      time: order?.cancel_time,
      status: "cancelled",
    });
  }

  if (order?.return_time || order?.order_status === "return") {
    orderSteps.push({
      id: "return",
      label: "Returned",
      icon: <FaTimesCircle size={18} />,
      description: "Order has been returned",
      time: order?.return_time,
      status: "cancelled",
    });
  }

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get status color based on step status
  const getStepColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500";
      case "current":
        return "bg-primary";
      case "cancelled":
        return "bg-rose-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStepTextColor = (status) => {
    switch (status) {
      case "completed":
        return "text-emerald-600";
      case "current":
        return "text-primary";
      case "cancelled":
        return "text-rose-600";
      default:
        return "text-gray-400";
    }
  };

  const getStepBgColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50";
      case "current":
        return "bg-primary/5";
      case "cancelled":
        return "bg-rose-50";
      default:
        return "bg-gray-50";
    }
  };

  // Desktop Stepper View
  const DesktopStepper = () => {
    // Calculate progress width properly (only count completed steps, not current)
    const completedSteps = orderSteps.filter(
      (step) => step.status === "completed",
    ).length;

    // Progress should go from first step center to last step center
    // So we need (completedSteps / (totalSteps - 1)) * 100
    const progressPercentage =
      orderSteps.length > 1
        ? (completedSteps / (orderSteps.length - 1)) * 100
        : 0;

    return (
      <div className="relative w-full">
        {/* Container for proper alignment */}
        <div className="flex justify-between items-start">
          {orderSteps.map((step, index) => (
            <div
              key={step.id}
              className="relative flex-1 flex flex-col items-center"
            >
              {/* Progress Line - Only show between icons */}
              {index < orderSteps.length - 1 && (
                <div className="absolute top-8 left-1/2 w-full h-1 bg-gray-200 z-0">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{
                      width: completedSteps > index ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-primary to-primary/60"
                  />
                </div>
              )}

              {/* Step Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center z-10 w-full"
              >
                {/* Step Icon */}
                <div className="relative mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center 
                      ${
                        step.status === "completed"
                          ? "bg-emerald-500"
                          : step.status === "current"
                            ? "bg-primary"
                            : step.status === "cancelled"
                              ? "bg-rose-500"
                              : "bg-gray-300"
                      } 
                      text-white shadow-lg relative z-10 transition-all duration-300
                      ${step.status === "current" ? "ring-4 ring-primary/20" : ""}`}
                  >
                    {step.status === "current" && step.id !== "cancelled" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <FaSpinner size={20} />
                      </motion.div>
                    ) : (
                      step.icon
                    )}
                  </motion.div>

                  {/* Status Badge for current/completed */}
                  {(step.status === "current" ||
                    step.status === "completed") && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center z-10"
                    >
                      <MdOutlineVerified className="text-emerald-500 text-sm" />
                    </motion.div>
                  )}
                </div>

                {/* Step Label */}
                <h4
                  className={`font-semibold text-sm mb-1 ${getStepTextColor(step.status)}`}
                >
                  {step.label}
                </h4>

                {/* Step Description */}
                <p className="text-xs text-gray-500 mb-2 px-2 text-center">
                  {step.description}
                </p>

                {/* Step Time */}
                {step.time && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-mono text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded-full"
                  >
                    {new Date(step.time).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </motion.p>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Mobile Stepper View (Timeline Style)
  const MobileStepper = () => (
    <div className="space-y-4">
      {orderSteps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative flex gap-4 p-4 rounded-xl ${getStepBgColor(step.status)}`}
        >
          {/* Timeline Line */}
          {index < orderSteps.length - 1 && (
            <div
              className={`absolute left-10 top-14 bottom-0 w-0.5 ${
                step.status === "completed" ? "bg-emerald-200" : "bg-gray-200"
              }`}
            />
          )}

          {/* Icon */}
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center 
                ${getStepColor(step.status)} text-white shadow-md`}
            >
              {step.status === "current" && step.id !== "cancelled" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <FaSpinner size={18} />
                </motion.div>
              ) : (
                step.icon
              )}
            </motion.div>

            {/* Status Indicator */}
            {(step.status === "current" || step.status === "completed") && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center">
                <FaCheckCircle className="text-emerald-500 text-xs" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className={`font-semibold ${getStepTextColor(step.status)}`}>
                {step.label}
              </h4>
              {step.time && (
                <span className="text-xs text-gray-400">
                  {new Date(step.time).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{step.description}</p>
            {step.time && (
              <p className="text-xs text-gray-400 mt-2 font-mono">
                {new Date(step.time).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {/* Render different stepper based on screen size */}
      <div className="hidden lg:block">
        <DesktopStepper />
      </div>

      <div className="block lg:hidden">
        <MobileStepper />
      </div>
    </div>
  );
};

export default Stepper;
