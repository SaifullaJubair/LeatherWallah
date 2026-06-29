import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FaMoneyBillWave,
  FaDollarSign,
  FaEuroSign,
  FaPoundSign,
  FaYenSign,
  FaEdit,
  FaGlobe,
} from "react-icons/fa";
import { BiRupee } from "react-icons/bi";
import { BsCurrencyBitcoin } from "react-icons/bs";

const CurrencySymbol = ({ refetch, getInitialCurrencyData }) => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      currency_symbol: getInitialCurrencyData?.currency_symbol || "",
      currency_code: getInitialCurrencyData?.currency_code || "",
      // M28: spelled-out name ("টাকা" / "Dollar") for prose contexts.
      currency_name: getInitialCurrencyData?.currency_name || "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currencySymbol = watch("currency_symbol");
  const currencyCode = watch("currency_code");
  const currencyName = watch("currency_name");

  // Common currency examples (M28: + name field for spelled-out display)
  const currencyExamples = [
    { symbol: "$", code: "USD", name: "Dollar", label: "US Dollar", icon: FaDollarSign },
    { symbol: "€", code: "EUR", name: "Euro", label: "Euro", icon: FaEuroSign },
    { symbol: "£", code: "GBP", name: "Pound", label: "British Pound", icon: FaPoundSign },
    { symbol: "¥", code: "JPY", name: "Yen", label: "Japanese Yen", icon: FaYenSign },
    { symbol: "₹", code: "INR", name: "Rupee", label: "Indian Rupee", icon: BiRupee },
    { symbol: "₿", code: "BTC", name: "Bitcoin", label: "Bitcoin", icon: BsCurrencyBitcoin },
    {
      symbol: "৳",
      code: "BDT",
      name: "টাকা",
      label: "Bangladeshi Taka",
      icon: FaMoneyBillWave,
    },
  ];

  useEffect(() => {
    if (getInitialCurrencyData) {
      setValue(
        "currency_symbol",
        getInitialCurrencyData?.currency_symbol || "",
      );
      setValue("currency_code", getInitialCurrencyData?.currency_code || "");
      setValue("currency_name", getInitialCurrencyData?.currency_name || "");
    }
  }, [getInitialCurrencyData, setValue]);

  const handleCancel = () => {
    setIsEditing(false);
    setValue("currency_symbol", getInitialCurrencyData?.currency_symbol || "");
    setValue("currency_code", getInitialCurrencyData?.currency_code || "");
    setValue("currency_name", getInitialCurrencyData?.currency_name || "");
  };

  const handleDataPost = async (data) => {
    // Validate inputs
    if (!data.currency_symbol || !data.currency_code) {
      toast.error("Currency symbol and code are required");
      return;
    }

    setLoading(true);
    try {
      const sendData = {
        _id: getInitialCurrencyData?._id,
        currency_symbol: data?.currency_symbol,
        currency_code: data?.currency_code?.toUpperCase(),
        // M28: name is optional — backend defaults "টাকা" if blank.
        currency_name: data?.currency_name || "",
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
        toast.success(result?.message || "Currency updated successfully");
        refetch();
        setLoading(false);
        setIsEditing(false);
      } else {
        toast.error(result?.message || "Something went wrong");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message || "Network error occurred");
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setValue("currency_symbol", example.symbol);
    setValue("currency_code", example.code);
    setValue("currency_name", example.name);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                <FaMoneyBillWave className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Currency Configuration
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Set your store&apos;s currency symbol and code
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/30 transition-all duration-200 flex items-center space-x-2"
              >
                <FaEdit className="text-lg" />
                <span>Edit Currency</span>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleDataPost)} className="p-6">
          <div className="space-y-6">
            {/* Current Currency Display (when not editing) */}
            {!isEditing && getInitialCurrencyData?.currency_symbol && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">
                      Current Currency
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl font-bold text-green-700">
                        {getInitialCurrencyData?.currency_symbol}
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-gray-800">
                          {getInitialCurrencyData?.currency_code}
                        </div>
                        <p className="text-sm text-gray-500">
                          {currencyExamples.find(
                            (c) =>
                              c.code === getInitialCurrencyData?.currency_code,
                          )?.name || "Custom Currency"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-6xl opacity-10">
                    <FaMoneyBillWave className="text-green-800" />
                  </div>
                </div>
              </div>
            )}

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Currency Symbol */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Currency Symbol
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (e.g., $, €, £, ৳)
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <FaMoneyBillWave
                      className={`text-lg ${isEditing ? "text-green-500" : "text-gray-400"}`}
                    />
                  </div>
                  <input
                    {...register("currency_symbol", { required: isEditing })}
                    type="text"
                    maxLength={3}
                    disabled={!isEditing}
                    placeholder="৳"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200
                      ${
                        isEditing
                          ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-gray-400"
                          : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                      }`}
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-400">
                    Prefix display: ৳500
                  </p>
                )}
              </div>

              {/* Currency Code */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Currency Code
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (ISO 4217)
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <FaGlobe
                      className={`text-lg ${isEditing ? "text-green-500" : "text-gray-400"}`}
                    />
                  </div>
                  <input
                    {...register("currency_code", {
                      required: isEditing,
                      pattern: {
                        value: /^[A-Za-z]{3}$/,
                        message: "Currency code must be 3 letters",
                      },
                    })}
                    type="text"
                    maxLength={3}
                    disabled={!isEditing}
                    placeholder="BDT"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 uppercase
                      ${
                        isEditing
                          ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-gray-400"
                          : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                      }`}
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-400">
                    Payment gateways: BDT 500
                  </p>
                )}
              </div>

              {/* Currency Name (M28 — spelled-out, e.g. "টাকা") */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Currency Name
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (spelled out)
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <FaMoneyBillWave
                      className={`text-lg ${isEditing ? "text-green-500" : "text-gray-400"}`}
                    />
                  </div>
                  <input
                    {...register("currency_name")}
                    type="text"
                    maxLength={20}
                    disabled={!isEditing}
                    placeholder="টাকা"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200
                      ${
                        isEditing
                          ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white hover:border-gray-400"
                          : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                      }`}
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-400">
                    Prose contexts: 500 টাকা
                  </p>
                )}
              </div>
            </div>

            {/* Quick Select Examples (only when editing) */}
            {isEditing && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Quick Select Common Currencies
                </p>
                <div className="flex flex-wrap gap-2">
                  {currencyExamples.map((example) => {
                    const Icon = example.icon;
                    return (
                      <button
                        key={example.code}
                        type="button"
                        onClick={() => handleExampleClick(example)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200
                          ${
                            currencyCode === example.code
                              ? "bg-green-100 border-green-300 text-green-700"
                              : "bg-white border-gray-200 hover:border-green-300 hover:bg-green-50"
                          }`}
                      >
                        <Icon className="text-lg" />
                        <span className="font-medium">{example.symbol}</span>
                        <span className="text-sm text-gray-600">
                          {example.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preview Card — M28: shows all 3 modes side by side */}
            {(currencySymbol || currencyCode || currencyName) && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-700 mb-3">
                  Live Preview — all 3 display modes
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-500 mb-1">Symbol mode</p>
                    <p className="text-xl font-bold text-purple-700">
                      {currencySymbol || "৳"}500
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-500 mb-1">Code mode</p>
                    <p className="text-xl font-bold text-purple-700">
                      {currencyCode?.toUpperCase() || "BDT"} 500
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <p className="text-xs text-gray-500 mb-1">Name mode</p>
                    <p className="text-xl font-bold text-purple-700">
                      500 {currencyName || "টাকা"}
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
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <MiniSpinner />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {getInitialCurrencyData?._id ? "Update" : "Save"}{" "}
                        Currency
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
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/30 transition-all duration-200"
              >
                Edit Currency
              </button>
            )}
          </div>
        </form>

        {/* Info Section */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">i</span>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">
                About Currency Configuration
              </p>
              <p>
                The currency symbol appears before product prices (e.g.,
                $99.99). The currency code (ISO 4217) is used for international
                formatting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrencySymbol;
