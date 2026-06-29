"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { BASE_URL } from "@/components/utils/baseURL";
import {
  FiX,
  FiPhone,
  FiLock,
  FiShield,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";

// ── Step indicator ─────────────────────────────────────────────────────────────
const Steps = ({ step }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {[1, 2].map((s) => (
      <div key={s} className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step >= s ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
          }`}
        >
          {step > s ? <FiCheckCircle size={14} /> : s}
        </div>
        {s < 2 && (
          <div
            className={`w-10 h-0.5 ${step > s ? "bg-primary" : "bg-gray-200"}`}
          />
        )}
      </div>
    ))}
  </div>
);

// ── OTP input — 4 boxes ────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const digits = value.split("").concat(Array(4).fill("")).slice(0, 4);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    onChange(newDigits.join(""));
    if (val && index < 3) {
      document.getElementById(`otp-modal-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`otp-modal-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    onChange(pasted.padEnd(4, "").slice(0, 4));
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`otp-modal-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`w-12 h-12 text-center text-lg font-bold border-2 rounded-lg outline-none transition-all ${
            digit
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 focus:border-primary"
          }`}
        />
      ))}
    </div>
  );
};

// ── Main Modal ─────────────────────────────────────────────────────────────────
const SetPasswordModal = ({ isOpen, onClose, userPhone, userName }) => {
  const [step, setStep] = useState(1); // 1=send OTP, 2=OTP+password
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const password = watch("user_password");

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (isOpen && userPhone && !otpSent) {
      handleSendOTP();
    }
  }, [isOpen, userPhone]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/forgetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_phone: userPhone }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("OTP sent to your phone!");
        setOtpSent(true);
        setTimer(60);
        setStep(2);
      } else {
        toast.error(data?.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/resend_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_phone: userPhone, user_name: userName }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("New OTP sent!");
        setTimer(60);
        setOtp("");
      } else {
        toast.error(data?.message || "Failed to resend OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (formData) => {
    if (otp.length !== 4) {
      toast.error("Please enter the 4-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/setNewPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_phone: userPhone,
          user_otp: otp,
          user_password: formData.user_password,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("Password set successfully! You can now login.");
        reset();
        setOtp("");
        onClose(true); // true = success
      } else {
        toast.error(data?.message || "Failed to set password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onClose(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-600 px-6 py-5 text-white">
          <button
            onClick={() => onClose(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <FiX size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FiShield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Secure Your Account
              </h3>
              <p className="text-white/80 text-sm">
                Set a password to track your orders
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <Steps step={step} />

          {/* Phone display */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 mb-5">
            <FiPhone size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">OTP will be sent to</span>
            <span className="text-sm font-semibold text-gray-800 ml-auto">
              {userPhone}
            </span>
          </div>

          {step === 1 && (
            <div className="text-center py-4">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Sending OTP...</p>
                </div>
              ) : (
                <button
                  onClick={handleSendOTP}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Send OTP
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <form
              onSubmit={handleSubmit(handleSetPassword)}
              className="space-y-4"
            >
              {/* OTP */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Enter OTP
                </label>
                <OTPInput value={otp} onChange={setOtp} />
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={timer > 0}
                    className={`text-xs ${timer > 0 ? "text-gray-400 cursor-not-allowed" : "text-primary hover:underline cursor-pointer"}`}
                  >
                    {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <FiLock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    {...register("user_password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Minimum 6 characters" },
                    })}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FiEyeOff size={15} />
                    ) : (
                      <FiEye size={15} />
                    )}
                  </button>
                </div>
                {errors.user_password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.user_password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    {...register("confirm_password", {
                      required: "Please confirm your password",
                      validate: (val) =>
                        val === password || "Passwords do not match",
                    })}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 4}
                className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <MiniSpinner />
                ) : (
                  <>
                    <FiShield size={16} />
                    Set Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* Skip */}
          <button
            onClick={() => onClose(false)}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordModal;
