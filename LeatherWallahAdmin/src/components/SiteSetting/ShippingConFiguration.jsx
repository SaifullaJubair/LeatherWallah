import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import {
  FaTruck,
  FaCity,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaEdit,
  FaInfoCircle,
  FaExchangeAlt,
} from "react-icons/fa";
import { MdOutlineDeliveryDining } from "react-icons/md";

const ShippingConFiguration = ({ refetch, getInitialCurrencyData }) => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      outside_dhaka_shipping_days:
        getInitialCurrencyData?.outside_dhaka_shipping_days || "",
      inside_dhaka_shipping_days:
        getInitialCurrencyData?.inside_dhaka_shipping_days || "",
      outside_dhaka_shipping_charge:
        getInitialCurrencyData?.outside_dhaka_shipping_charge || "",
      inside_dhaka_shipping_charge:
        getInitialCurrencyData?.inside_dhaka_shipping_charge || "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Watch values for calculations
  const insideDays = watch("inside_dhaka_shipping_days");
  const outsideDays = watch("outside_dhaka_shipping_days");
  const insideCharge = watch("inside_dhaka_shipping_charge");
  const outsideCharge = watch("outside_dhaka_shipping_charge");

  useEffect(() => {
    if (getInitialCurrencyData) {
      setValue(
        "outside_dhaka_shipping_days",
        getInitialCurrencyData?.outside_dhaka_shipping_days || "",
      );
      setValue(
        "inside_dhaka_shipping_days",
        getInitialCurrencyData?.inside_dhaka_shipping_days || "",
      );
      setValue(
        "outside_dhaka_shipping_charge",
        getInitialCurrencyData?.outside_dhaka_shipping_charge || "",
      );
      setValue(
        "inside_dhaka_shipping_charge",
        getInitialCurrencyData?.inside_dhaka_shipping_charge || "",
      );
    }
  }, [getInitialCurrencyData, setValue]);

  const handleCancel = () => {
    setIsEditing(false);
    setValue(
      "outside_dhaka_shipping_days",
      getInitialCurrencyData?.outside_dhaka_shipping_days || "",
    );
    setValue(
      "inside_dhaka_shipping_days",
      getInitialCurrencyData?.inside_dhaka_shipping_days || "",
    );
    setValue(
      "outside_dhaka_shipping_charge",
      getInitialCurrencyData?.outside_dhaka_shipping_charge || "",
    );
    setValue(
      "inside_dhaka_shipping_charge",
      getInitialCurrencyData?.inside_dhaka_shipping_charge || "",
    );
  };

  const handleDataPost = async (data) => {
    // Validate inputs
    if (
      !data.outside_dhaka_shipping_days ||
      !data.inside_dhaka_shipping_days ||
      !data.outside_dhaka_shipping_charge ||
      !data.inside_dhaka_shipping_charge
    ) {
      toast.error("All fields are required");
      return;
    }

    // Validate numbers
    if (
      isNaN(data.outside_dhaka_shipping_days) ||
      isNaN(data.inside_dhaka_shipping_days) ||
      isNaN(data.outside_dhaka_shipping_charge) ||
      isNaN(data.inside_dhaka_shipping_charge)
    ) {
      toast.error("Please enter valid numbers");
      return;
    }

    setLoading(true);
    try {
      const sendData = {
        _id: getInitialCurrencyData?._id,
        outside_dhaka_shipping_days: Number(data?.outside_dhaka_shipping_days),
        inside_dhaka_shipping_days: Number(data?.inside_dhaka_shipping_days),
        outside_dhaka_shipping_charge: Number(
          data?.outside_dhaka_shipping_charge,
        ),
        inside_dhaka_shipping_charge: Number(
          data?.inside_dhaka_shipping_charge,
        ),
      };

      const response = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });

      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message || "Shipping configuration updated successfully",
        );
        refetch();
        setIsEditing(false);
      } else {
        toast.error(result?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error?.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate delivery estimate
  const getDeliveryEstimate = (days) => {
    if (!days) return "Not set";
    const numDays = Number(days);
    if (isNaN(numDays)) return "Invalid";
    return `${numDays} ${numDays === 1 ? "day" : "days"}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl">
                <FaTruck className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Shipping Configuration
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage delivery days and charges for Dhaka and outside Dhaka
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 focus:ring-4 focus:ring-orange-500/30 transition-all duration-200 flex items-center space-x-2"
              >
                <FaEdit className="text-lg" />
                <span>Edit Configuration</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Shipping Summary (when not editing) */}
        {!isEditing && getInitialCurrencyData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 border-b border-gray-200">
            {/* Inside Dhaka Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FaCity className="text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Inside Dhaka</h4>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Local Delivery
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Time:</span>
                  <span className="font-medium text-gray-800">
                    <FaClock className="inline mr-1 text-gray-400" />
                    {getDeliveryEstimate(
                      getInitialCurrencyData?.inside_dhaka_shipping_days,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping Charge:</span>
                  <span className="font-medium text-green-600">
                    <FaMoneyBillWave className="inline mr-1" />৳
                    {getInitialCurrencyData?.inside_dhaka_shipping_charge || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Outside Dhaka Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FaMapMarkerAlt className="text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Outside Dhaka</h4>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Nationwide Delivery
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Time:</span>
                  <span className="font-medium text-gray-800">
                    <FaClock className="inline mr-1 text-gray-400" />
                    {getDeliveryEstimate(
                      getInitialCurrencyData?.outside_dhaka_shipping_days,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping Charge:</span>
                  <span className="font-medium text-blue-600">
                    <FaMoneyBillWave className="inline mr-1" />৳
                    {getInitialCurrencyData?.outside_dhaka_shipping_charge || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleDataPost)} className="p-6">
          <div className="space-y-6">
            {/* Inside Dhaka Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center space-x-2 mb-4">
                <FaCity className="text-green-600 text-lg" />
                <h4 className="font-medium text-gray-800">
                  Inside Dhaka Configuration
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Days
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      (Number of days)
                    </span>
                  </label>
                  <div className="relative">
                    <FaClock
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${isEditing ? "text-green-500" : "text-gray-400"}`}
                    />
                    <input
                      {...register("inside_dhaka_shipping_days")}
                      type="number"
                      min="1"
                      step="1"
                      disabled={!isEditing}
                      placeholder="e.g., 3"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 
                        ${
                          isEditing
                            ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Shipping Charge
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      (In BDT)
                    </span>
                  </label>
                  <div className="relative">
                    <FaMoneyBillWave
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${isEditing ? "text-green-500" : "text-gray-400"}`}
                    />
                    <input
                      {...register("inside_dhaka_shipping_charge")}
                      type="number"
                      min="0"
                      step="any"
                      disabled={!isEditing}
                      placeholder="e.g., 60"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 
                        ${
                          isEditing
                            ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Outside Dhaka Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center space-x-2 mb-4">
                <FaMapMarkerAlt className="text-blue-600 text-lg" />
                <h4 className="font-medium text-gray-800">
                  Outside Dhaka Configuration
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Days
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      (Number of days)
                    </span>
                  </label>
                  <div className="relative">
                    <FaClock
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${isEditing ? "text-blue-500" : "text-gray-400"}`}
                    />
                    <input
                      {...register("outside_dhaka_shipping_days")}
                      type="number"
                      min="1"
                      step="1"
                      disabled={!isEditing}
                      placeholder="e.g., 7"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 
                        ${
                          isEditing
                            ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Shipping Charge
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      (In BDT)
                    </span>
                  </label>
                  <div className="relative">
                    <FaMoneyBillWave
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${isEditing ? "text-blue-500" : "text-gray-400"}`}
                    />
                    <input
                      {...register("outside_dhaka_shipping_charge")}
                      type="number"
                      min="0"
                      step="any"
                      disabled={!isEditing}
                      placeholder="e.g., 120"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 
                        ${
                          isEditing
                            ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400"
                            : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Preview (when editing) */}
            {isEditing &&
              (insideDays || outsideDays || insideCharge || outsideCharge) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FaExchangeAlt className="text-purple-600" />
                    <h4 className="font-medium text-purple-700">
                      Delivery Comparison
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-purple-600 font-medium">
                        Inside Dhaka
                      </p>
                      <p className="text-gray-600">
                        <span className="inline-block w-20">Delivery:</span>
                        <span className="font-semibold">
                          {insideDays || "0"} days
                        </span>
                      </p>
                      <p className="text-gray-600">
                        <span className="inline-block w-20">Charge:</span>
                        <span className="font-semibold">
                          ৳{insideCharge || "0"}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-purple-600 font-medium">
                        Outside Dhaka
                      </p>
                      <p className="text-gray-600">
                        <span className="inline-block w-20">Delivery:</span>
                        <span className="font-semibold">
                          {outsideDays || "0"} days
                        </span>
                      </p>
                      <p className="text-gray-600">
                        <span className="inline-block w-20">Charge:</span>
                        <span className="font-semibold">
                          ৳{outsideCharge || "0"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 focus:ring-4 focus:ring-orange-500/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <MiniSpinner />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {getInitialCurrencyData?._id ? "Update" : "Save"}{" "}
                        Configuration
                      </span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-amber-700 focus:ring-4 focus:ring-orange-500/30 transition-all duration-200"
              >
                Edit Configuration
              </button>
            )}
          </div>
        </form>

        {/* Info Section */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <FaInfoCircle className="text-orange-600 text-xs" />
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">
                About Shipping Configuration
              </p>
              <p>
                Set delivery days and charges for Dhaka and outside Dhaka areas.
                Delivery days are estimates and charges will be added to
                customer&apos;s total at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ShippingConFiguration;
