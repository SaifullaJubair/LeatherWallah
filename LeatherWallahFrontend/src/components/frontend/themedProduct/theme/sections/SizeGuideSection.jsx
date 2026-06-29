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
  const title = product?.size_guide_title?.trim() || "সাইজ চার্ট";
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

      <div className="max-w-4xl mx-auto px-4 relative">
        <div className="flex items-center gap-2 mb-5">
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
            {title}
          </h2>
        </div>

        {/* Table — horizontal scroll on small screens so a wide (5-6 column)
            chart never breaks the layout. */}
        {hasTable && (
          <div
            className="rounded-2xl shadow-sm overflow-x-auto"
            style={{ background: "#fff" }}
          >
            <table className="w-full text-sm" style={{ color: "var(--body-color)" }}>
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
                        // First column is the size label → emphasise it.
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
        )}

        {/* Measurement note */}
        {note && note.trim() && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--body-color)" }}>
            ℹ️ {note}
          </p>
        )}

        {/* Optional chart image — opens the shared ChartModal (same one used by
            the order form's "Size Chart" link). */}
        {chartImage && (
          <button
            type="button"
            onClick={() => setShowChart(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{
              background: "var(--brand-primary-light)",
              color: "var(--brand-primary-dark)",
            }}
          >
            <FaRulerCombined size={14} /> সাইজ চার্ট ছবি দেখুন
          </button>
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
