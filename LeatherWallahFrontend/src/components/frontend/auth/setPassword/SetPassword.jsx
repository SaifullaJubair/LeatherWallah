// src/components/frontend/auth/setPassword/SetPassword.jsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { BASE_URL } from "@/components/utils/baseURL";
import Contain from "@/components/common/Contain";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";
import {
  FiShield,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiArrowRight,
  FiLogIn,
  FiRefreshCw,
  FiPhone,
} from "react-icons/fi";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

// ── OTP Input ──────────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange, disabled }) => {
  const digits = (value || "").split("").concat(Array(4).fill("")).slice(0, 4);
  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    onChange(next.join(""));
    if (val && i < 3) document.getElementById(`sp-otp-${i + 1}`)?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      document.getElementById(`sp-otp-${i - 1}`)?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(p.padEnd(4, "").slice(0, 4));
    setTimeout(() => document.getElementById(`sp-otp-3`)?.focus(), 0);
  };
  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`sp-otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-14 h-14 text-center text-xl font-bold border-2 rounded-2xl outline-none transition-all duration-200 disabled:opacity-40
            ${
              d
                ? "border-primary bg-primary/8 text-primary shadow-sm shadow-primary/20"
                : "border-gray-200 bg-white focus:border-primary focus:shadow-sm focus:shadow-primary/10"
            }`}
        />
      ))}
    </div>
  );
};

// ── Step Bar ───────────────────────────────────────────────────────────────────
const StepBar = ({ step, steps }) => (
  <div className="flex items-center justify-center gap-0 mb-10">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
            ${
              step > i
                ? "bg-green-500 text-white shadow-md shadow-green-200"
                : step === i
                  ? "bg-primary text-white shadow-md shadow-primary/30 scale-110"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {step > i ? <FiCheckCircle size={15} /> : i + 1}
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wide uppercase transition-colors duration-300
            ${step === i ? "text-primary" : step > i ? "text-green-500" : "text-gray-300"}`}
          >
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={`w-12 h-[2px] mb-5 mx-1 rounded-full transition-all duration-500
            ${step > i ? "bg-green-400" : "bg-gray-100"}`}
          />
        )}
      </div>
    ))}
  </div>
);

// ── Password Input ─────────────────────────────────────────────────────────────
const PasswordInput = ({
  placeholder,
  register,
  name,
  rules,
  errors,
  show,
  onToggle,
}) => (
  <div>
    <div className="relative">
      <FiLock
        size={15}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        {...register(name, rules)}
        className="w-full pl-11 pr-12 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
      </button>
    </div>
    {errors?.[name] && (
      <p className="text-red-500 text-xs mt-1.5">⚠ {errors[name].message}</p>
    )}
  </div>
);

// ── Left Panel — context changes per step ──────────────────────────────────────
const LeftPanel = ({ step }) => {
  const content = [
    {
      icon: "📱",
      title: "Enter Your Phone",
      desc: "Enter your phone number. We'll check whether an account exists.",
    },
    {
      icon: "🔐",
      title: "Verify Number",
      desc: "An OTP will be sent to your phone. Verify it with the code.",
    },
    {
      icon: "✏️",
      title: "Enter the Code",
      desc: "Enter the 4-digit OTP code sent to your phone here.",
    },
    {
      icon: "🛡️",
      title: "Set Password",
      desc: "Create a strong password.",
    },
    {
      icon: "✅",
      title: "All Done!",
      desc: "Your account is secure. Now log in.",
    },
  ];
  const c = content[Math.min(step, content.length - 1)];
  return (
    <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-10 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-12">
          <FiShield size={20} className="text-white/80" />
          <span className="text-white/80 text-sm font-semibold tracking-wider uppercase">
            Account Security
          </span>
        </div>
        <div className="space-y-5">
          <div className="text-5xl transition-all duration-500">{c.icon}</div>
          <div>
            <h2 className="text-2xl text-white font-bold mb-2 leading-tight">{c.title}</h2>
            <p className="text-white/70 text-sm leading-relaxed">{c.desc}</p>
          </div>
        </div>
      </div>
      <div className="relative z-10 space-y-3">
        {[
          "Your data is encrypted",
          "OTP expires in 10 minutes",
          "Login anytime after setting password",
        ].map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 text-white/60 text-xs"
          >
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <FiCheckCircle size={9} />
            </div>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Phone Pill (shows after phone is entered) ──────────────────────────────────
const PhonePill = ({ phone }) => (
  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 mb-7">
    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
      <HiOutlineDeviceMobile size={16} className="text-primary" />
    </div>
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
        Account Phone
      </p>
      <p className="text-sm font-bold text-gray-800">{phone}</p>
    </div>
  </div>
);

// ── Main Content ───────────────────────────────────────────────────────────────
const SetPasswordContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phoneParam = searchParams.get("phone") || "";

  // steps: 0=phone input, 1=send OTP, 2=verify OTP, 3=set password, 4=done
  // special: "already_verified" screen
  const [step, setStep] = useState(phoneParam ? -1 : 0); // -1 = checking
  const [screenType, setScreenType] = useState("flow"); // "flow" | "already_verified" | "no_account"
  const [phone, setPhone] = useState(phoneParam || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const password = watch("user_password");

  // Timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ✅ If phone in URL — auto check on load
  useEffect(() => {
    if (phoneParam) checkPhone(phoneParam);
    else setStep(0); // no phone — show phone input
  }, []);

  // ── Backend phone check ────────────────────────────────────────────────────
  const checkPhone = async (phoneToCheck) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/user/check_phone?phone=${encodeURIComponent(phoneToCheck)}`,
      );
      const data = await res.json();

      if (!data?.data?.exists) {
        setScreenType("no_account");
        setStep(99);
      } else if (data?.data?.verified && data?.data?.has_password) {
        // Already verified + has password
        setScreenType("already_verified");
        setStep(99);
      } else {
        // Unverified or no password — proceed with flow
        setPhone(phoneToCheck);
        setScreenType("flow");
        setStep(1); // go to send OTP
      }
    } catch {
      toast.error("Something went wrong");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 0: Phone submit ───────────────────────────────────────────────────
  const handlePhoneSubmit = async () => {
    if (!phone || !isValidPhoneNumber(phone)) {
      toast.error("Enter a valid phone number");
      return;
    }
    await checkPhone(phone);
  };

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/forgetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_phone: phone }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("OTP sent!");
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

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/verifyOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_phone: phone, user_otp: otp }),
      });
      const data = await res.json();
      if (data?.success) {
        setStep(3);
      } else {
        toast.error(data?.message || "Invalid OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/resend_otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_phone: phone }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success("New OTP sent!");
        setTimer(60);
        setOtp("");
      } else toast.error(data?.message);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Set Password ───────────────────────────────────────────────────
  const handleSetPassword = async (data) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/setNewPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_phone: phone,
          user_otp: otp,
          user_password: data.user_password,
        }),
      });
      const result = await res.json();
      if (result?.success) {
        localStorage.removeItem("unverified_guest_phone");
        sessionStorage.removeItem("banner_dismissed");
        toast.success("Password set successfully!");
        reset();
        setStep(4);
      } else {
        toast.error(result?.message || "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () =>
    router.push(`/sign-in?phone=${encodeURIComponent(phone)}`);

  // ── Checking state ─────────────────────────────────────────────────────────
  if (step === -1 || (loading && step === -1)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Checking account...</p>
        </div>
      </div>
    );
  }

  const stepLabels = ["Phone", "Send OTP", "Verify", "Password", "Done"];
  // current visual step for stepbar (step 0=phone, 1=send, 2=verify, 3=password, 4=done)
  const visualStep = step <= 4 ? step : 0;

  return (
    <Contain>
      <div className="min-h-[85vh] flex items-center justify-center py-10">
        <div className="w-full max-w-6xl">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            {/* Left Panel */}
            <LeftPanel step={visualStep} />

            {/* Right Panel */}
            <div className="p-8 md:p-10">
              {/* Mobile header */}
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <FiShield size={18} className="text-primary" />
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Set Password
                </span>
              </div>

              {/* ── Special: Already Verified ──────────────────────────── */}
              {screenType === "already_verified" && (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center space-y-5">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                    <FiLogIn size={36} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      Password Already Set!
                    </h3>
                    <p className="text-gray-500 text-sm mb-1">
                      You have already set a password.
                    </p>
                    <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1 rounded-lg inline-block mt-1">
                      {phone}
                    </p>
                  </div>
                  <div className="w-full space-y-2 pt-2">
                    <button
                      onClick={goToLogin}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <FiLogIn size={16} /> Login to Account
                    </button>
                    <button
                      onClick={() => router.push("/forget-password")}
                      className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Forgot password? Reset it
                    </button>
                  </div>
                </div>
              )}

              {/* ── Special: No Account ────────────────────────────────── */}
              {screenType === "no_account" && (
                <div className="flex flex-col items-center justify-center h-full py-6 text-center space-y-5">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center">
                    <FiPhone size={36} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      Account Not Found
                    </h3>
                    <p className="text-gray-500 text-sm mb-1">
                      There's no account for this number.
                    </p>
                    <p className="text-xs text-gray-400 font-mono bg-gray-50 px-3 py-1 rounded-lg inline-block mt-1">
                      {phone}
                    </p>
                  </div>
                  <div className="w-full space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setScreenType("flow");
                        setStep(0);
                        setPhone("");
                      }}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <FiArrowRight size={16} /> Try Another Number
                    </button>
                    <button
                      onClick={() => router.push("/sign-up")}
                      className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Create a new account
                    </button>
                  </div>
                </div>
              )}

              {/* ── Normal Flow ────────────────────────────────────────── */}
              {screenType === "flow" && (
                <>
                  <StepBar step={visualStep} steps={stepLabels} />

                  {/* Phone pill — show after step 0 */}
                  {step > 0 && step <= 4 && <PhonePill phone={phone} />}

                  {/* Step 0: Phone Input */}
                  {step === 0 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          Enter Your Phone Number
                        </h3>
                        <p className="text-gray-500 text-sm">
                          We'll check whether an account exists
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                          Phone Number
                        </label>
                        <PhoneInput
                          placeholder="Enter phone number"
                          value={phone}
                          onChange={setPhone}
                          defaultCountry="BD"
                          international
                          countryCallingCodeEditable={false}
                          className="custom-phone-input w-full border border-gray-200 bg-gray-50 px-4 py-2.5 rounded-xl text-sm focus-within:border-primary focus-within:bg-white transition-all"
                        />
                      </div>
                      <button
                        onClick={handlePhoneSubmit}
                        disabled={loading || !phone}
                        className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        {loading ? (
                          <MiniSpinner />
                        ) : (
                          <>
                            <span>Check Account</span>
                            <FiArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 1: Send OTP */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          Send OTP
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                          Your account exists but a password hasn't been set.
                          <br />
                          Click the button below to send an OTP to your phone.
                        </p>
                      </div>
                      <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        {loading ? (
                          <MiniSpinner />
                        ) : (
                          <>
                            <FiShield size={16} />
                            <span>Send OTP to My Phone</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 2: Enter & Verify OTP */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          Verify OTP
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Enter the 4-digit code sent to your phone
                        </p>
                      </div>
                      <OTPInput
                        value={otp}
                        onChange={setOtp}
                        disabled={loading}
                      />
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={timer > 0}
                          className={`text-xs flex items-center gap-1.5 mx-auto transition-colors
                            ${timer > 0 ? "text-gray-300 cursor-not-allowed" : "text-primary hover:text-primary/70"}`}
                        >
                          <FiRefreshCw size={11} />
                          {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                        </button>
                      </div>
                      <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.length !== 4}
                        className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        {loading ? (
                          <MiniSpinner />
                        ) : (
                          <>
                            <span>Verify OTP</span>
                            <FiArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 3: Set Password */}
                  {step === 3 && (
                    <form
                      onSubmit={handleSubmit(handleSetPassword)}
                      className="space-y-5"
                    >
                      <div className="text-center space-y-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          Create Password
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Enter a strong password
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          New Password
                        </label>
                        <PasswordInput
                          placeholder="Minimum 6 characters"
                          register={register}
                          name="user_password"
                          rules={{
                            required: "Password required",
                            minLength: {
                              value: 6,
                              message: "Min 6 characters",
                            },
                          }}
                          errors={errors}
                          show={showPw}
                          onToggle={() => setShowPw(!showPw)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Confirm Password
                        </label>
                        <PasswordInput
                          placeholder="Re-enter your password"
                          register={register}
                          name="confirm_password"
                          rules={{
                            required: "Required",
                            validate: (v) =>
                              v === password || "Passwords do not match",
                          }}
                          errors={errors}
                          show={showConfirm}
                          onToggle={() => setShowConfirm(!showConfirm)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-1"
                      >
                        {loading ? (
                          <MiniSpinner />
                        ) : (
                          <>
                            <FiShield size={16} />
                            <span>Set Password</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Step 4: Done */}
                  {step === 4 && (
                    <div className="text-center space-y-6 py-4">
                      <div className="space-y-3">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                          <FiCheckCircle size={40} className="text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-1">
                            All Done! 🎉
                          </h3>
                          <p className="text-gray-500 text-sm leading-relaxed">
                            Your password has been set successfully.
                            <br />
                            Now log in to view all your orders.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={goToLogin}
                        className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <FiLogIn size={16} /> Login Now
                      </button>
                      <button
                        onClick={() => router.push("/")}
                        className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Go to Home
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Contain>
  );
};

export default function SetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SetPasswordContent />
    </Suspense>
  );
}
