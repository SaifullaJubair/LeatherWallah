"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/components/utils/baseURL";
import { useUserLoginMutation } from "@/redux/feature/auth/authApi";
import { syncCartAfterLogin } from "@/utils/cartSync";
import { syncWishlistAfterLogin } from "@/utils/wishlistSync";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import {
  FiX,
  FiShield,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiPhone,
  FiLogIn,
  FiArrowRight,
} from "react-icons/fi";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ─── OTP Input ────────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange, disabled }) => {
  const digits = (value || "").split("").concat(Array(4).fill("")).slice(0, 4);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[index] = val.slice(-1);
    onChange(next.join(""));
    if (val && index < 3)
      document.getElementById(`acct-otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0)
      document.getElementById(`acct-otp-${index - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    onChange(pasted.padEnd(4, "").slice(0, 4));
    if (pasted.length >= 4) document.getElementById(`acct-otp-3`)?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          id={`acct-otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-11 sm:w-13 sm:h-13 text-center text-base font-bold border-2 rounded-xl outline-none transition-all duration-200 disabled:opacity-50
            ${digit ? "border-primary bg-primary/5 text-primary scale-105" : "border-gray-200 focus:border-primary focus:bg-gray-50"}`}
        />
      ))}
    </div>
  );
};

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ steps, current }) => (
  <div className="flex items-center justify-center gap-1 mb-6">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center gap-1">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
            ${
              current > i
                ? "bg-green-500 text-white"
                : current === i
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {current > i ? <FiCheckCircle size={14} /> : i + 1}
          </div>
          <span
            className={`text-[9px] font-medium whitespace-nowrap transition-colors
            ${current === i ? "text-primary" : current > i ? "text-green-500" : "text-gray-400"}`}
          >
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={`w-8 h-0.5 mb-4 rounded transition-all duration-500
            ${current > i ? "bg-green-500" : "bg-gray-200"}`}
          />
        )}
      </div>
    ))}
  </div>
);

// ─── Password Field ───────────────────────────────────────────────────────────
const PasswordField = ({
  id,
  label,
  register,
  name,
  rules,
  errors,
  show,
  onToggle,
  placeholder,
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <div className="relative">
      <FiLock
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder || "Enter password"}
        {...register(name, rules)}
        className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
      </button>
    </div>
    {errors?.[name] && (
      <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
    )}
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────
/**
 * mode:
 *   "full"     — unverified guest: OTP → Password → Login  (3 steps)
 *   "login"    — verified but not logged in: Login only    (1 step)
 */
const AccountModal = ({
  isOpen,
  onClose,
  mode = "full", // "full" | "login"
  userPhone,
  userName,
  orderId,
  onSuccess, // callback after complete
}) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { products: cartProducts } = useSelector((s) => s.cart);

  // step: 0=OTP, 1=Password, 2=Login  (for full)
  //       0=Login                      (for login)
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [userLogin] = useUserLoginMutation();

  const {
    register: regPw,
    handleSubmit: handlePw,
    watch,
    formState: { errors: pwErrors },
    reset: resetPw,
  } = useForm();
  const {
    register: regLogin,
    handleSubmit: handleLogin,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm();
  const password = watch("user_password");

  const steps =
    mode === "full" ? ["Verify OTP", "Set Password", "Login"] : ["Login"];

  // Timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Auto-send OTP on open (full mode only)
  useEffect(() => {
    if (isOpen && mode === "full" && !otpSent && userPhone) {
      sendOTP();
    }
  }, [isOpen]);

  const sendOTP = async () => {
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

  const handleSetPassword = async (data) => {
    if (otp.length !== 4) {
      toast.error("Enter the 4-digit OTP");
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
          user_password: data.user_password,
        }),
      });
      const result = await res.json();
      if (result?.success) {
        // Clear unverified flag from localStorage
        localStorage.removeItem("unverified_guest_phone");
        toast.success("Password set successfully!");
        resetPw();
        setStep(2); // go to login
      } else {
        toast.error(result?.message || "Failed to set password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDoLogin = async (data) => {
    setLoading(true);
    try {
      const res = await userLogin({
        user_phone: userPhone,
        user_password: data.login_password,
      });
      if (res?.data?.statusCode === 200 && res?.data?.success) {
        await syncCartAfterLogin(cartProducts, dispatch);
        await syncWishlistAfterLogin();
        setLoggedIn(true);
        resetLogin();
        toast.success("Logged in successfully!");
        onSuccess?.(); // notify parent
      } else {
        toast.error(res?.error?.data?.message || "Login failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setOtp("");
    setOtpSent(false);
    setLoggedIn(false);
    resetPw();
    resetLogin();
    onClose?.();
  };

  if (!isOpen) return null;

  // ── Logged in success screen ────────────────────────────────────────────────
  if (loggedIn) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              You're all set!
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Account secured and logged in successfully.
            </p>
            <div className="flex flex-col gap-2">
              {orderId && (
                <button
                  onClick={() => {
                    handleClose();
                    router.push(
                      `/user-profile?tab=purchase-history&order_id=${orderId}`,
                    );
                  }}
                  className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  View Invoice <FiArrowRight size={14} />
                </button>
              )}
              <button
                onClick={() => {
                  handleClose();
                  router.push("/user-profile?tab=purchase-history");
                }}
                className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                View All Orders
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              {mode === "login" ? (
                <FiLogIn size={16} />
              ) : (
                <FiShield size={16} />
              )}
            </div>
            <div className="py-4">
              <h3 className="font-bold text-xl  text-white leading-tight">
                {mode === "login" ? "Welcome Back!" : "Secure Your Account"}
              </h3>
              <p className="text-white/75 pt-1 text-xs">
                {mode === "login"
                  ? "Login to track your orders"
                  : "Set a password to access your account anytime"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {mode === "full" && <StepIndicator steps={steps} current={step} />}

          {/* Phone display */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-4">
            <FiPhone size={14} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500">Phone</span>
            <span className="text-xs font-bold text-gray-800 ml-auto">
              {userPhone}
            </span>
          </div>

          {/* ── STEP 0: OTP (full mode) ─────────────────────────────────── */}
          {mode === "full" && step === 0 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-center text-gray-500 mb-3">
                  {loading && !otpSent
                    ? "Sending OTP..."
                    : "Enter the 4-digit code sent to your phone"}
                </p>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading && !otpSent}
                />
                <div className="text-center mt-2.5">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={timer > 0}
                    className={`text-xs transition-colors ${timer > 0 ? "text-gray-400 cursor-not-allowed" : "text-primary hover:underline"}`}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (otp.length !== 4) {
                    toast.error("Enter 4-digit OTP");
                    return;
                  }
                  // ✅ Backend এ OTP verify করো আগে
                  setLoading(true);
                  try {
                    const res = await fetch(`${BASE_URL}/user/verifyOTP`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_phone: userPhone,
                        user_otp: otp,
                      }),
                    });
                    const data = await res.json();
                    if (data?.success) {
                      setStep(1); // ✅ OTP valid — next step
                    } else {
                      toast.error(data?.message || "Invalid OTP");
                    }
                  } catch {
                    toast.error("Something went wrong");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || otp.length !== 4}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <MiniSpinner />
                ) : (
                  <>
                    <span>Continue</span>
                    <FiArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 1: Set Password (full mode) ───────────────────────── */}
          {mode === "full" && step === 1 && (
            <form onSubmit={handlePw(handleSetPassword)} className="space-y-3">
              <PasswordField
                id="pw"
                label="New Password"
                register={regPw}
                name="user_password"
                rules={{
                  required: "Password required",
                  minLength: { value: 6, message: "Min 6 characters" },
                }}
                errors={pwErrors}
                show={showPw}
                onToggle={() => setShowPw(!showPw)}
                placeholder="Minimum 6 characters"
              />
              <PasswordField
                id="cpw"
                label="Confirm Password"
                register={regPw}
                name="confirm_password"
                rules={{
                  required: "Required",
                  validate: (v) => v === password || "Passwords do not match",
                }}
                errors={pwErrors}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                placeholder="Re-enter password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <MiniSpinner />
                ) : (
                  <>
                    <FiShield size={14} />
                    <span>Set Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2 (full) or STEP 0 (login): Login ─────────────────── */}
          {((mode === "full" && step === 2) || mode === "login") && (
            <form onSubmit={handleLogin(handleDoLogin)} className="space-y-3">
              {mode === "full" && (
                <p className="text-xs text-center text-green-600 font-medium bg-green-50 rounded-lg py-2 px-3">
                  ✓ Password set! Now login to access your account.
                </p>
              )}
              {mode === "login" && (
                <p className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
                  You already have an account. Log in to track your orders.
                </p>
              )}
              <PasswordField
                id="lpw"
                label="Password"
                register={regLogin}
                name="login_password"
                rules={{ required: "Password required" }}
                errors={loginErrors}
                show={showLoginPw}
                onToggle={() => setShowLoginPw(!showLoginPw)}
                placeholder="Enter your password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <MiniSpinner />
                ) : (
                  <>
                    <FiLogIn size={14} />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full mt-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;
