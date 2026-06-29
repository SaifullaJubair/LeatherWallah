"use client";
// Use cases — circular brand-tinted icon badges + label in soft cards.
import { FaUtensils } from "react-icons/fa6";
import FloatingAssets from "../FloatingAssets";

export default function UseCasesSection({ product, theme }) {
  const items = product?.use_cases || [];
  if (items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: "var(--section-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="use_cases" />

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
            কোথায় ব্যবহার করবেন?
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {items.map((u, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-3 rounded-xl p-5 transition-transform hover:-translate-y-0.5"
              style={{ background: "#fff" }}
            >
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--brand-primary-light)",
                  color: "var(--brand-primary-dark)",
                }}
              >
                {u.icon_url ? (
                  <img
                    src={u.icon_url}
                    alt=""
                    width={30}
                    height={30}
                    className="object-contain"
                  />
                ) : (
                  <FaUtensils size={22} />
                )}
              </span>
              <span
                className="text-sm font-medium leading-tight"
                style={{ color: "var(--body-color)" }}
              >
                {u.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
