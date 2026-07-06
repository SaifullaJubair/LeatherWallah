"use client";

import { useState } from "react";
import { BASE_URL } from "@/components/utils/baseURL";
import { titleFont } from "@/utils/font";

const NewsletterForm = ({ settings }) => {
  const mode = settings?.newsletter_collect_mode || "email";
  const title =
    settings?.newsletter_section_title || "Stay in the Loop";
  const subtitle =
    settings?.newsletter_section_subtitle ||
    "Get exclusive deals and updates delivered to you.";

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^[0-9+\-\s]{7,15}$/.test(v.trim());

  const validate = () => {
    if (!value.trim()) return "Please enter your contact info.";
    if (mode === "email" && !isEmail(value))
      return "Please enter a valid email address.";
    if (mode === "sms" && !isPhone(value))
      return "Please enter a valid phone number.";
    if (mode === "both" && !isEmail(value) && !isPhone(value))
      return "Please enter a valid email or phone number.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const channel =
        mode === "both"
          ? isEmail(value) ? "email" : "sms"
          : mode === "email" ? "email" : "sms";

      const res = await fetch(`${BASE_URL}/newsletter-subscriber/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: value, channel, source: "home" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Subscription failed. Try again.");
      }
      setDone(true);
      setValue("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const placeholder =
    mode === "email"
      ? "Enter your email address"
      : mode === "sms"
      ? "Enter your phone number"
      : "Email address or phone number";

  return (
    // Deep-burgundy band on the warm canvas, matching the Featured Collections
    // section so the two premium blocks bookend the storefront.
    <div className="py-8 md:py-12 px-3 sm:px-5">
      <div className="relative overflow-hidden rounded-[28px] py-12 md:py-16 max-w-[1400px] mx-auto bg-gradient-to-br from-primary-800 via-primary-900 to-[#1a0405] shadow-[0_20px_60px_-24px_rgba(36,6,8,0.55)]">
        {/* Ambient gold glow for depth */}
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-96 h-96 rounded-full bg-accent-700/10 blur-3xl" />
        <div className="relative max-w-[98%] mx-auto text-center px-4">
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold mb-3 text-accent-300">
            Newsletter
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-white mb-2"
            style={{ fontFamily: titleFont.style.fontFamily }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-white/60 text-sm mb-7 max-w-md mx-auto">{subtitle}</p>
          )}
          {done ? (
            <p className="font-medium text-sm text-accent-300">
              Thank you for subscribing!
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto"
            >
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                placeholder={placeholder}
                className="flex-1 border border-white/15 bg-white/10 text-white placeholder:text-white/45 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 whitespace-nowrap text-primary-900 bg-accent hover:bg-accent-400 shadow-[0_4px_14px_rgba(212,175,55,0.35)]"
              >
                {loading ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          {error && (
            <p className="mt-3 text-red-300 text-xs">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterForm;
