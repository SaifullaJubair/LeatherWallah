"use client";
// Benefits — soft white card, two-column checkmark list with circular brand
// check badges, optional product image on the right (per theme mockups).
import { FaCheck } from "react-icons/fa6";
import FloatingAssets from "../FloatingAssets";

export default function BenefitsSection({ product, theme }) {
  const items = product?.benefits || [];
  if (items.length === 0) return null;

  const sideImage = product?.main_image;

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: "var(--page-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="benefits" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="flex items-center gap-2 mb-6">
          <span
            className="w-1.5 h-7 rounded-full"
            style={{ background: "var(--brand-primary)" }}
          />
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{
              color: "var(--heading-color)",
              fontWeight: "var(--brand-heading-weight, 700)",
            }}
          >
            {product?.product_name} এর উপকারিতা
          </h2>
        </div>

        <div
          className="rounded-2xl shadow-sm overflow-hidden grid md:grid-cols-2 gap-0"
          style={{ background: "#fff" }}
        >
          {/* Checkmark list */}
          <ul className="p-6 md:p-8 space-y-3.5 self-center">
            {items.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: 24,
                    height: 24,
                    background: "var(--brand-primary)",
                    color: "var(--button-text, #fff)",
                  }}
                >
                  <FaCheck size={12} />
                </span>
                <span
                  className="text-sm md:text-base leading-snug"
                  style={{ color: "var(--body-color)" }}
                >
                  {b}
                </span>
              </li>
            ))}
          </ul>

          {/* Image */}
          {sideImage && (
            <div
              className="relative min-h-[220px] hidden md:block"
              style={{ background: "var(--section-bg)" }}
            >
              <img
                src={sideImage}
                alt={product?.product_name || ""}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
