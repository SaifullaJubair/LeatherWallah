import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import {
  FaPhone,
  FaLock,
  FaEnvelope,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaEdit,
} from "react-icons/fa";
import { MdMessage } from "react-icons/md";

const PhoneCredential = ({ refetch, initialAuthenticationData }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp_phone_user: initialAuthenticationData?.otp_phone_user || "",
      otp_phone_password: initialAuthenticationData?.otp_phone_password || "",
      otp_phone_body: initialAuthenticationData?.otp_phone_body || "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialAuthenticationData) {
      setValue(
        "otp_phone_user",
        initialAuthenticationData?.otp_phone_user || "",
      );
      setValue(
        "otp_phone_password",
        initialAuthenticationData?.otp_phone_password || "",
      );
      setValue(
        "otp_phone_body",
        initialAuthenticationData?.otp_phone_body || "",
      );
    }
  }, [initialAuthenticationData, setValue]);

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setValue("otp_phone_user", initialAuthenticationData?.otp_phone_user || "");
    setValue(
      "otp_phone_password",
      initialAuthenticationData?.otp_phone_password || "",
    );
    setValue("otp_phone_body", initialAuthenticationData?.otp_phone_body || "");
  };

  const handleDataPost = async (data) => {
    setLoading(true);

    // Validate required fields
    if (
      !data.otp_phone_user ||
      !data.otp_phone_password ||
      !data.otp_phone_body
    ) {
      toast.error("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const url = `${BASE_URL}/authentication`;
      const method = initialAuthenticationData?._id ? "PATCH" : "POST";

      const sendData = initialAuthenticationData?._id
        ? { _id: initialAuthenticationData._id, ...data }
        : data;

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });

      const result = await response.json();

      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ||
            (initialAuthenticationData?._id
              ? "Authentication updated successfully"
              : "Authentication created successfully"),
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
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <FaPhone className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  OTP Phone Credential
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure SMS OTP settings for phone verification
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 flex items-center space-x-2"
              >
                <FaEdit className="text-lg" />
                <span>Edit Credentials</span>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleDataPost)} className="p-6">
          <div className="space-y-6">
            {/* OTP Phone User */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                OTP Phone User
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (SMS gateway username/API key)
                </span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <FaKey
                    className={`text-lg ${isEditing ? "text-blue-500" : "text-gray-400"}`}
                  />
                </div>
                <input
                  {...register("otp_phone_user", { required: isEditing })}
                  type="text"
                  disabled={!isEditing}
                  placeholder="Enter your SMS gateway username"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 
                    ${
                      isEditing
                        ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400"
                        : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    }`}
                />
              </div>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1">
                  Your SMS gateway provider username or API key
                </p>
              )}
            </div>

            {/* OTP Phone Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                OTP Phone Password
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (SMS gateway password/API secret)
                </span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <FaLock
                    className={`text-lg ${isEditing ? "text-blue-500" : "text-gray-400"}`}
                  />
                </div>
                <input
                  {...register("otp_phone_password", { required: isEditing })}
                  type={showPassword ? "text" : "password"}
                  disabled={!isEditing}
                  placeholder="Enter your SMS gateway password"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-all duration-200 
                    ${
                      isEditing
                        ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400"
                        : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    }`}
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                )}
              </div>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1">
                  Keep this password secure. Never share it with anyone.
                </p>
              )}
            </div>

            {/* OTP Phone Body */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                OTP Message Template
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (SMS body with OTP placeholder)
                </span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-3">
                  <MdMessage
                    className={`text-lg ${isEditing ? "text-blue-500" : "text-gray-400"}`}
                  />
                </div>
                <textarea
                  {...register("otp_phone_body", { required: isEditing })}
                  rows={4}
                  disabled={!isEditing}
                  placeholder="e.g. Your OTP code is: {otp}. Please do not share this code."
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 resize-none
                    ${
                      isEditing
                        ? "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400"
                        : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    }`}
                />
              </div>
              {isEditing && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-700 flex items-start space-x-2">
                    <span className="font-medium">Template Variables:</span>
                    <span className="text-blue-600">
                      Use{" "}
                      <code className="bg-white px-1 py-0.5 rounded border border-blue-200">
                        {"{otp}"}
                      </code>{" "}
                      for OTP code
                    </span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Example: &quot;Your verification code is: {123456}. Valid
                    for 5 minutes.&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Current Status Card */}
            {!isEditing && initialAuthenticationData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Current Configuration Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="text-gray-500 block">Username:</span>
                    <span className="font-medium text-gray-800">
                      {initialAuthenticationData?.otp_phone_user
                        ? "••••••••"
                        : "Not set"}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="text-gray-500 block">Password:</span>
                    <span className="font-medium text-gray-800">
                      {initialAuthenticationData?.otp_phone_password
                        ? "••••••••"
                        : "Not set"}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="text-gray-500 block">Template:</span>
                    <span className="font-medium text-gray-800">
                      {initialAuthenticationData?.otp_phone_body
                        ? "Configured"
                        : "Not set"}
                    </span>
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
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <MiniSpinner />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {initialAuthenticationData?._id ? "Update" : "Create"}{" "}
                        Credentials
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
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 transition-all duration-200"
              >
                Edit Credentials
              </button>
            )}
          </div>
        </form>

        {/* Help Section */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">?</span>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">
                Need help with SMS Gateway?
              </p>
              <p>
                Contact your SMS provider to get API credentials. Common
                providers include: Twilio, Nexmo, Greenweb, etc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PhoneCredential;
