"use client";
// Size Guide / Fit Chart — a niche-agnostic table built from admin-defined
// columns + rows (shoes: Size/EU/UK/CM, shirts: Size/Chest/Waist/Length, …).
// Optionally pairs with the add-product size_chart IMAGE (shown via the same
// ChartModal used near the order form). Self-hides when there's no table AND no
// chart image, so food / unsized products never render it.
import { useState } from "react";
import { FaRulerCombined } from "react-icons/fa6";
import FloatingAssets from "../FloatingAssets";
import ChartModal from "../../singeProduct/productHighLightSection/ChartModal";

export default function SizeGuideSection({ product, theme }) {
  const [showChart, setShowChart] = useState(false);

  const columns = Array.isArray(product?.size_guide_columns)
    ? product.size_guide_columns
    : [];
  const rows = Array.isArray(product?.size_guide_rows)
    ? product.size_guide_rows
    : [];
  const note = product?.size_guide_note;
  const title = product?.size_guide_title?.trim() || "Size Chart";
  const chartImage = product?.size_chart;

  const hasTable = columns.length > 0 && rows.length > 0;
  // Data-gate: nothing to show → render nothing (food / unsized products).
  if (!hasTable && !chartImage) return null;

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: "var(--section-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="size_guide" />

      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Section heading */}
        <div className="flex items-center gap-2 mb-6">
          <span
            className="w-1.5 h-7 rounded-full"
            style={{ background: "var(--brand-primary)" }}
          />
          <h2
            className="text-xl md:text-2xl font-bold flex items-center gap-2"
            style={{
              color: "var(--heading-color)",
              fontWeight: "var(--brand-heading-weight, 700)",
            }}
          >
            <FaRulerCombined size={18} style={{ color: "var(--brand-primary)" }} />
            {title}
          </h2>
        </div>

        {/* table (left) + chart image (right) — equal height, side-by-side on
            desktop, stacked on mobile. */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          {/* Table card */}
          {hasTable && (
            <div
              className="rounded-2xl shadow-sm overflow-hidden"
              style={{ background: "#fff" }}
            >
              <div className="overflow-x-auto h-full">
                <table
                  className="w-full text-sm"
                  style={{ color: "var(--body-color)" }}
                >
                  <thead>
                    <tr style={{ background: "var(--brand-primary-light)" }}>
                      {columns.map((c, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-left font-bold whitespace-nowrap"
                          style={{ color: "var(--brand-primary-dark)" }}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr
                        key={ri}
                        style={{
                          background: ri % 2 ? "var(--section-bg)" : "transparent",
                        }}
                      >
                        {columns.map((_, ci) => (
                          <td
                            key={ci}
                            className="px-4 py-3 whitespace-nowrap"
                            style={
                              ci === 0
                                ? { fontWeight: 600, color: "var(--heading-color)" }
                                : undefined
                            }
                          >
                            {row?.[ci] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chart image card */}
          {chartImage && (
            <div
              className="rounded-2xl shadow-sm overflow-hidden flex flex-col"
              style={{ background: "#fff" }}
            >
              <div
                className="px-4 py-3 text-sm font-semibold"
                style={{
                  background: "var(--brand-primary-light)",
                  color: "var(--brand-primary-dark)",
                }}
              >
                Size Chart
              </div>
              <button
                type="button"
                onClick={() => setShowChart(true)}
                className="flex-1 w-full cursor-zoom-in p-3"
                title="Click to enlarge"
              >
                <img
                  src={chartImage}
                  alt="Size chart"
                  className="w-full h-full object-contain max-h-[360px] rounded-lg"
                />
              </button>
            </div>
          )}
        </div>

        {/* Measurement note — highlighted info box, full width below both cards */}
        {note && note.trim() && (
          <div
            className="mt-5 flex items-start gap-3 rounded-xl px-4 py-3.5"
            style={{
              background: "var(--brand-primary-light)",
              borderLeft: "4px solid var(--brand-primary)",
            }}
          >
            <span
              className="mt-0.5 flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 24,
                height: 24,
                background: "var(--brand-primary)",
                color: "var(--button-text,#fff)",
              }}
            >
              <FaRulerCombined size={12} />
            </span>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--brand-primary-dark)" }}
            >
              <span className="font-semibold">How to measure: </span>
              {note}
            </p>
          </div>
        )}

        {chartImage && showChart && (
          <ChartModal
            showChart={showChart}
            setShowChart={setShowChart}
            size_chart={chartImage}
          />
        )}
      </div>
    </section>
  );
}
