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
    <div className="py-4 md:py-10 bg-primary-50">
      <div className="max-w-[98%] mx-auto text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2"
          style={{ fontFamily: titleFont.style.fontFamily }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{subtitle}</p>
        )}
        {done ? (
          <p className="text-primary-600 font-medium text-sm">
            Thank you for subscribing!
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto"
          >
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
              placeholder={placeholder}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
        {error && (
          <p className="mt-2 text-red-500 text-xs">{error}</p>
        )}
      </div>
    </div>
  );
};

export default NewsletterForm;
