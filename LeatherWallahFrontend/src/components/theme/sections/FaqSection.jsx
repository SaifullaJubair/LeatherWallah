"use client";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import FloatingAssets from "../FloatingAssets";

export default function FaqSection({ product, theme }) {
  const items = product?.faqs || [];
  const [openIdx, setOpenIdx] = useState(null);
  if (items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden py-8 md:py-12"
      style={{ background: "var(--section-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="faq" />
      <div className="max-w-3xl mx-auto px-4 relative">
        <h2
          className="text-2xl md:text-3xl font-bold mb-5"
          style={{
            color: "var(--heading-color)",
            fontFamily: "var(--brand-font)",
            fontWeight: "var(--brand-heading-weight)",
          }}
        >
          সাধারণ কিছু প্রশ্ন 🤔
        </h2>

        <div className="space-y-2">
          {items.map((f, i) => (
            <div key={i} className="bg-white rounded shadow-sm">
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-3 text-left"
                style={{ color: "var(--body-color)" }}
              >
                <span className="font-medium">{f.question}</span>
                <FaChevronDown
                  className={`transition-transform ${openIdx === i ? "rotate-180" : ""}`}
                  style={{ color: "var(--brand-primary)" }}
                />
              </button>
              {openIdx === i && (
                <div
                  className="px-3 pb-3 text-sm"
                  style={{ color: "var(--body-color)" }}
                >
                  {f.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
