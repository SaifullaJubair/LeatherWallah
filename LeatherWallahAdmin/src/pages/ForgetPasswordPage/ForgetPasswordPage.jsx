import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FiMail, FiPhone, FiLock, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";

// OTP input — 6 individual boxes with auto-advance and paste support
const OtpBoxes = ({ value, onChange }) => {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = (value || "").split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = digits.map((d, idx) => (idx === i ? "" : d)).join("");
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? char : d)).join("");
    onChange(next);
    if (char && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6).trimEnd());
    if (pasted.length > 0) refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center my-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
            ${d
              ? "border-blueColor-500 bg-blueColor-50 text-blueColor-700"
              : "border-gray-300 bg-white text-gray-800"
            } focus:border-blueColor-500 focus:ring-2 focus:ring-blueColor-200`}
          style={{ height: "52px" }}
        />
      ))}
    </div>
  );
};

const ForgetPasswordPage = () => {
  const [step, setStep] = useState(1); // 1=identifier, 2=otp+password
  const [channel, setChannel] = useState("phone"); // "phone" | "email"
  const [loading, setLoading] = useState(false);
  const [adminPhone, setAdminPhone] = useState();
  const [adminEmail, setAdminEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();

  const validateIdentifier = () => {
    if (channel === "phone") {
      if (!adminPhone) { toast.error("Phone is required!", { autoClose: 2000 }); return false; }
      if (!formatPhoneNumber(adminPhone) || !isPossiblePhoneNumber(adminPhone) || !isValidPhoneNumber(adminPhone)) {
        toast.error("Mobile number not valid!", { autoClose: 2000 }); return false;
      }
    } else {
      if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        toast.error("Enter a valid email address!", { autoClose: 2000 }); return false;
      }
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateIdentifier()) return;
    setLoading(true);
    try {
      const body = channel === "email"
        ? { admin_email: adminEmail, channel: "email" }
        : { admin_phone: adminPhone, channel: "phone" };

      const res = await fetch(`${BASE_URL}/admin_reg_log/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "OTP sent!", { autoClose: 1500 });
        setOtp("");
        setStep(2);
      } else {
        toast.error(result?.message || "Something went wrong", { autoClose: 2500 });
      }
    } catch {
      toast.error("Network error or server is down", { autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    if (!validateIdentifier()) return;
    if (otp.replace(/\s/g, "").length < 6) {
      toast.error("Enter the complete 6-digit OTP", { autoClose: 2000 }); return;
    }
    if (!data?.admin_password || data.admin_password.length < 6) {
      toast.error("Password must be at least 6 characters", { autoClose: 2000 }); return;
    }
    if (data.admin_password !== data.admin_confirm_password) {
      toast.error("Passwords do not match!", { autoClose: 2000 }); return;
    }
    setLoading(true);
    try {
      const body = channel === "email"
        ? { admin_email: adminEmail, admin_otp: otp, admin_password: data.admin_password, channel: "email" }
        : { admin_phone: adminPhone, admin_otp: otp, admin_password: data.admin_password, channel: "phone" };

      const res = await fetch(`${BASE_URL}/admin_reg_log/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Password reset successfully", { autoClose: 1500 });
        reset();
        navigate("/sign-in", { replace: true });
      } else {
        toast.error(result?.message || "Something went wrong", { autoClose: 2500 });
      }
    } catch {
      toast.error("Network error or server is down", { autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const maskedIdentifier = channel === "email"
    ? adminEmail.replace(/(.{2}).+(@.+)/, "$1***$2")
    : adminPhone?.replace(/(\+\d{2})(\d+)(\d{3})/, "$1*****$3") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blueColor-50 to-gray-100 p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blueColor-600 to-blueColor-700 px-8 py-7 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiLock size={26} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Forgot Password</h2>
            <p className="text-blueColor-200 text-sm mt-1">
              {step === 1 ? "Choose how to receive your OTP" : `OTP sent to your ${channel}`}
            </p>
          </div>

          <div className="px-8 py-7">

            {/* Step 1 — Identifier */}
            {step === 1 && (
              <div className="space-y-5">

                {/* Channel toggle */}
                <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1 gap-1">
                  {[
                    { key: "phone", label: "Phone", icon: FiPhone },
                    { key: "email", label: "Email", icon: FiMail },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setChannel(key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
                        ${channel === key
                          ? "bg-blueColor-600 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Input */}
                {channel === "phone" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                    <div className="border-2 border-gray-200 rounded-xl px-3 py-2 focus-within:border-blueColor-500 transition-colors">
                      <PhoneInput
                        className="w-full outline-none text-sm"
                        placeholder="Enter phone number"
                        value={adminPhone}
                        defaultCountry="BD"
                        international
                        countryCallingCodeEditable={false}
                        onChange={setAdminPhone}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                    <div className="relative">
                      <FiMail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blueColor-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blueColor-600 hover:bg-blueColor-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <MiniSpinner /> : `Send OTP via ${channel === "phone" ? "SMS" : "Email"}`}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Remembered your password?{" "}
                  <button type="button" className="text-blueColor-600 font-semibold hover:underline"
                    onClick={() => navigate("/sign-in")}>
                    Sign in
                  </button>
                </p>
              </div>
            )}

            {/* Step 2 — OTP + new password */}
            {step === 2 && (
              <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-5">

                {/* Sent-to indicator */}
                <div className="flex items-center gap-2 bg-blueColor-50 border border-blueColor-200 rounded-xl px-4 py-3">
                  {channel === "email" ? <FiMail size={15} className="text-blueColor-600 shrink-0" /> : <FiPhone size={15} className="text-blueColor-600 shrink-0" />}
                  <p className="text-xs text-blueColor-700">
                    OTP sent to <strong>{maskedIdentifier}</strong>
                  </p>
                </div>

                {/* OTP boxes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 text-center">
                    Enter 6-digit OTP
                  </label>
                  <OtpBoxes value={otp} onChange={setOtp} />
                </div>

                {/* New password */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                  <input
                    {...register("admin_password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "At least 6 characters" },
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blueColor-500 transition-colors pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    {showPassword ? <FaRegEye size={18} /> : <FaRegEyeSlash size={18} />}
                  </button>
                  {errors.admin_password && (
                    <p className="text-red-500 text-xs mt-1">{errors.admin_password.message}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                  <input
                    {...register("admin_confirm_password", {
                      required: "Please confirm your password",
                      validate: (val) => val === watch("admin_password") || "Passwords do not match",
                    })}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blueColor-500 transition-colors pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <FaRegEye size={18} /> : <FaRegEyeSlash size={18} />}
                  </button>
                  {errors.admin_confirm_password && (
                    <p className="text-red-500 text-xs mt-1">{errors.admin_confirm_password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl bg-blueColor-600 hover:bg-blueColor-700 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <MiniSpinner /> : "Reset Password"}
                </button>

                <div className="flex justify-between text-sm">
                  <button type="button" onClick={() => { setStep(1); reset(); setOtp(""); }}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                    <FiArrowLeft size={13} /> Change {channel}
                  </button>
                  <button type="button" onClick={handleSendOTP} disabled={loading}
                    className="flex items-center gap-1 text-blueColor-600 hover:text-blueColor-700 font-medium disabled:opacity-50">
                    <FiRefreshCw size={12} /> Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgetPasswordPage;
