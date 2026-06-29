"use client";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useChangePasswordMutation,
  useResendOtpMutation,
} from "@/redux/feature/auth/authApi";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";

// ── OTP Input — 4 boxes ────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const digits = value.split("").concat(Array(4).fill("")).slice(0, 4);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    onChange(newDigits.join(""));
    if (val && index < 3) {
      document.getElementById(`otpInput-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`otpInput-${index - 1}`)?.focus();
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
          id={`otpInput-${index}`}
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

// ── Main Component ─────────────────────────────────────────────────────────────
const ChangePassword = () => {
  const [user_phone, setUser_phone] = useState("");
  const [user_name, setUser_name] = useState("");
  const [otp, setOtp] = useState("");
  const [timerCount, setTimer] = useState(60);
  const [disable, setDisable] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const password = watch("user_password");
  const router = useRouter();

  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [resendOtp] = useResendOtpMutation();

  // Timer
  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((lastTimerCount) => {
        lastTimerCount <= 1 && clearInterval(interval);
        if (lastTimerCount <= 1) setDisable(false);
        if (lastTimerCount <= 0) return lastTimerCount;
        return lastTimerCount - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [disable]);

  // Load phone from localStorage
  useEffect(() => {
    const savedPhone = JSON.parse(localStorage.getItem("forget_user_phone"));
    const savedName = JSON.parse(localStorage.getItem("forget_user_name"));
    if (savedPhone) setUser_phone(savedPhone);
    if (savedName) setUser_name(savedName);
  }, []);

  const handleVerify = async (data) => {
    try {
      if (otp.length !== 4) {
        toast.error("Please enter the 4-digit OTP", {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }
      const res = await changePassword({
        user_phone,
        user_otp: otp,
        user_password: data?.user_password,
      });
      if (res?.data?.success) {
        toast.success(res?.data?.message, { autoClose: 1500 });
        localStorage.removeItem("forget_user_phone");
        localStorage.removeItem("forget_user_name");
        reset();
        router.push("/sign-in");
      } else {
        toast.error(res?.error?.data?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("change password error", error);
    }
  };

  const handleResend = async () => {
    if (disable) return;
    try {
      const res = await resendOtp({ user_phone, user_name });
      if (res.data?.statusCode === 200 && res.data?.success === true) {
        setDisable(true);
        setTimer(60);
        setOtp("");
        toast.info(res?.data?.message);
      } else {
        toast.error(res.error?.data?.message, { autoClose: 2000 });
      }
    } catch (error) {
      console.error("resend otp error", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-600 px-6 py-5 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiShield size={22} />
          </div>
          <h4 className="font-bold text-lg text-white mb-1">
            Change Your Password
          </h4>
          <p className="text-white/80 text-sm">
            We have sent a code to{" "}
            <span className="font-semibold">{user_phone}</span>
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit(handleVerify)} className="space-y-5">
            {/* OTP */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
                Enter OTP
              </label>
              <OTPInput value={otp} onChange={setOtp} />
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={disable}
                  className={`text-xs transition-colors ${
                    disable
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-primary hover:underline cursor-pointer"
                  }`}
                >
                  {disable ? `Resend OTP in ${timerCount}s` : "Resend OTP"}
                </button>
              </div>
            </div>

            {/* New Password */}
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
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || otp.length !== 4}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <MiniSpinner />
              ) : (
                <>
                  <FiCheckCircle size={16} />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
