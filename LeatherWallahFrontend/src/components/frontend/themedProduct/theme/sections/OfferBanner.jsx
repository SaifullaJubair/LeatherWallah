"use client";
// Special-offer banner with a live countdown, driven by site settings:
//   setting.offer_enabled  — master on/off
//   setting.offer_text     — heading (falls back to a default)
//   setting.offer_end_at   — countdown target (ISO). Banner hides once passed.
// Themed via brand vars: full-bleed brand-primary background.
import { useEffect, useState } from "react";

// Counts down to a fixed ISO target. `expired` flips true when time runs out.
function useCountdownTo(endAt) {
  const targetMs = endAt ? new Date(endAt).getTime() : 0;
  const [left, setLeft] = useState(() => Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(
      () => setLeft(Math.max(0, targetMs - Date.now())),
      1000,
    );
    return () => clearInterval(id);
  }, [targetMs]);
  const totalSec = Math.floor(left / 1000);
  const days = Math.floor(totalSec / 86400);
  return {
    expired: !targetMs || left <= 0,
    d: days,
    h: String(Math.floor((totalSec % 86400) / 3600)).padStart(2, "0"),
    m: String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0"),
    s: String(totalSec % 60).padStart(2, "0"),
  };
}

export default function OfferBanner({ product, setting }) {
  const enabled = !!setting?.offer_enabled;
  const endAt = setting?.offer_end_at;
  const offerText = setting?.offer_text;
  const { expired, d, h, m, s } = useCountdownTo(endAt);
  const image = product?.main_image;

  // Hide entirely when the offer is off or has already ended.
  if (!enabled || expired) return null;

  const TimeBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <span
        className="flex items-center justify-center rounded-lg font-black text-lg md:text-xl tabular-nums"
        style={{
          width: 46,
          height: 46,
          background: "rgba(255,255,255,0.18)",
          color: "var(--button-text, #fff)",
        }}
      >
        {value}
      </span>
      <span className="text-[10px] mt-1 opacity-80" style={{ color: "var(--button-text, #fff)" }}>
        {label}
      </span>
    </div>
  );

  return (
    <section style={{ background: "var(--brand-primary)" }}>
      {/* Two columns: the offer + timer on the left, the product on the right.
          There used to be a third column of hardcoded perks (Free Delivery /
          Cash on Delivery / Easy Return Policy) — the admin could not edit them,
          so they were a promise the shop had not actually made from here. The
          same three claims already live in the site-wide Brand Promise section,
          which IS admin-driven. */}
      <div className="max-w-6xl mx-auto px-4 py-7 md:py-9 grid md:grid-cols-2 gap-6 items-center">
        {/* Left — offer + timer */}
        <div className="text-center md:text-left">
          <p
            className="text-sm font-semibold mb-1 opacity-90"
            style={{ color: "var(--button-text, #fff)" }}
          >
            Today's Special Offer
          </p>
          <h2
            className="text-2xl md:text-3xl font-black mb-3"
            style={{ color: "var(--button-text, #fff)" }}
          >
            {offerText || "Buy 2 Get 1 Free"}
          </h2>
          <div className="flex gap-2 justify-center md:justify-start">
            {d > 0 && (
              <>
                <TimeBox value={String(d).padStart(2, "0")} label="Days" />
                <span className="text-xl font-black self-start mt-2" style={{ color: "var(--button-text, #fff)" }}>:</span>
              </>
            )}
            <TimeBox value={h} label="Hours" />
            <span className="text-xl font-black self-start mt-2" style={{ color: "var(--button-text, #fff)" }}>:</span>
            <TimeBox value={m} label="Min" />
            <span className="text-xl font-black self-start mt-2" style={{ color: "var(--button-text, #fff)" }}>:</span>
            <TimeBox value={s} label="Sec" />
          </div>
        </div>

        {/* Right — product image */}
        {image && (
          <div className="flex justify-center md:justify-end">
            <img
              src={image}
              alt={product?.product_name || ""}
              className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-2xl shadow-lg ring-4"
              style={{ "--tw-ring-color": "rgba(255,255,255,0.25)" }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
