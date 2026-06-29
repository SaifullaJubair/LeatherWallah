"use client";
// FAQ — accordion (left) + fruit image (right) 2-column, per the theme mockup.
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import FloatingAssets from "../FloatingAssets";

// An FAQ copied from a template can still carry an unresolved {{placeholder}}
// when the product had no value for it (e.g. {{warranty}} on a product with no
// warranty spec). Hide such an FAQ entirely so the customer never sees a raw
// broken token. Admin is warned at copy-time; this is the storefront safety net.
const hasUnresolvedPlaceholder = (text) => /\{\{[^}]+\}\}/.test(String(text || ""));

export default function FaqSection({ product, theme }) {
  const items = (product?.faqs || []).filter(
    (f) =>
      !hasUnresolvedPlaceholder(f?.question) &&
      !hasUnresolvedPlaceholder(f?.answer),
  );
  const [openIdx, setOpenIdx] = useState(0);
  if (items.length === 0) return null;

  // Per-section side image with sensible fallbacks: admin-uploaded faq_side_image
  // → first other_image → main_image. Admin can fully hide it (including the
  // fallbacks) via the Page Content toggle. Gate is `!== false` so legacy
  // products without the flag keep showing the image.
  const img =
    product?.faq_side_image_show !== false
      ? product?.faq_side_image ||
        product?.other_images?.[0]?.other_image ||
        product?.main_image
      : null;

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: "var(--section-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="faq" />

      <div className="max-w-6xl mx-auto px-4 relative grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Left — accordion */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-7 rounded-full" style={{ background: "var(--brand-primary)" }} />
            <h2
              className="text-xl md:text-2xl font-bold"
              style={{
                color: "var(--heading-color)",
                fontWeight: "var(--brand-heading-weight, 700)",
              }}
            >
              সাধারণ কিছু প্রশ্ন
            </h2>
          </div>

          <div className="space-y-2.5">
            {items.map((f, i) => {
              const open = openIdx === i;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border"
                  style={{ borderColor: open ? "var(--brand-primary-light)" : "transparent" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    style={{ color: "var(--heading-color)" }}
                  >
                    <span className="font-semibold text-sm md:text-base">{f.question}</span>
                    <FaChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      style={{ color: "var(--brand-primary)" }}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "var(--body-color)" }}>
                        {f.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — image */}
        {img && (
          <div className="hidden lg:block sticky top-20">
            <img
              src={img}
              alt={product?.product_name || ""}
              className="w-full h-[360px] object-cover rounded-2xl shadow-sm"
            />
          </div>
        )}
      </div>
    </section>
  );
}
