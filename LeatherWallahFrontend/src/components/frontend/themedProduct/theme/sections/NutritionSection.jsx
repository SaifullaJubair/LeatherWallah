"use client";
// Product Details (left) + "Our Promise" trust grid (right) — 2-column, side by
// side per the theme reference. Trust supports 2×3 (up to 6) compact tiles with
// icon + title + optional subtitle. Each card stays the same height.
//
// The left card is keyed on `product.nutrition` — a field name inherited from
// the food catalogue this codebase was cloned from. It is a free-form
// label/value table, and this shop uses it for real spec rows (upper material,
// construction, outsole, card slots, RFID…). The field name is schema and stays;
// nothing user-facing says "nutrition".
import { FaShieldHalved } from "react-icons/fa6";
import { FaInfoCircle } from "react-icons/fa";
import FloatingAssets from "../FloatingAssets";
import DynamicIcon, { hasIcon } from "@/lib/icons/DynamicIcon";

export default function NutritionSection({ product, theme, trustPoints }) {
  const n = product?.nutrition;
  const trust = trustPoints || [];

  // Fully admin-driven: nutrient table rows + info tiles (label/value, optional icon).
  const rows = (n?.rows || []).filter((r) => r?.label || r?.value);
  const infoTiles = (n?.info_tiles || []).filter((t) => t?.label || t?.value);

  const hasNutrition = rows.length > 0 || infoTiles.length > 0;
  if (!hasNutrition && trust.length === 0) return null;

  const Heading = ({ children }) => (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-1.5 h-7 rounded-full" style={{ background: "var(--brand-primary)" }} />
      <h2
        className="text-xl md:text-2xl font-bold"
        style={{ color: "var(--heading-color)", fontWeight: "var(--brand-heading-weight, 700)" }}
      >
        {children}
      </h2>
    </div>
  );

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: "var(--page-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="nutrition" />

      <div className="max-w-6xl mx-auto px-4 relative grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* ── LEFT: Nutrition card ── */}
        {hasNutrition && (
          <div className="flex flex-col">
            <Heading>
              {n?.per_serving?.trim() ? n.per_serving : "Product Details"}
            </Heading>

            <div
              className="rounded-2xl shadow-sm p-5 md:p-6 flex-1 grid md:grid-cols-[1fr_auto] gap-5 md:gap-7"
              style={{ background: "#fff" }}
            >
              {/* nutrient table */}
              {rows.length > 0 && (
                <table className="w-full text-sm self-start" style={{ color: "var(--body-color)" }}>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        style={{ background: i % 2 ? "var(--section-bg)" : "transparent" }}
                      >
                        <td className="py-2 px-3 rounded-l-lg">{row.label}</td>
                        <td
                          className="py-2 px-3 text-right font-bold rounded-r-lg"
                          style={{ color: "var(--brand-primary-dark)" }}
                        >
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* info tiles column */}
              {infoTiles.length > 0 && (
                <div className="md:border-l md:pl-7 space-y-4 self-start" style={{ borderColor: "var(--brand-primary-light)" }}>
                  {infoTiles.map((tile, i) => (
                    <div key={i} className="flex items-start gap-3 min-w-[180px]">
                      <span
                        className="flex items-center justify-center rounded-full shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          background: "var(--brand-primary-light)",
                          color: "var(--brand-primary-dark)",
                        }}
                      >
                        {tile.icon_key ? (
                          <DynamicIcon name={tile.icon_key} size={15} />
                        ) : (
                          <FaInfoCircle size={15} />
                        )}
                      </span>
                      <div>
                        <p
                          className="text-[11px] font-semibold"
                          style={{ color: "var(--body-color)", opacity: 0.7 }}
                        >
                          {tile.label}
                        </p>
                        <p
                          className="text-sm font-bold leading-tight mt-0.5"
                          style={{ color: "var(--heading-color)" }}
                        >
                          {tile.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RIGHT: Our Promise (trust 3×2 grid, compact tiles) ── */}
        {trust.length > 0 && (
          <div className="flex flex-col">
            <Heading>Our Promise</Heading>
            <div
              className="rounded-2xl shadow-sm p-5 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 flex-1 content-around"
              style={{ background: "#fff" }}
            >
              {/* Render exactly the promises the admin entered — no more.
                  This used to pad the grid to 6 with hardcoded TRUST_EXTRA
                  tiles, pick an icon by ROW INDEX out of a fixed list, and
                  invent a subtitle by index when none was given. All three made
                  up content the admin never wrote: a shop with 3 promises
                  silently showed 5, each with an unrelated glyph. Same defect
                  as the use-case icons (see BenefitsUseCasesSection).

                  Icon priority: uploaded > picked > a neutral shield. hasIcon()
                  because DynamicIcon returns null for a key that no longer
                  resolves, which would leave an empty coloured puck. */}
              {trust.slice(0, 6).map((t, i) => {
                const subtitle = t.description || t.subtitle || "";
                return (
                  <div key={i} className="flex flex-col items-center text-center gap-2.5">
                    <span
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 60,
                        height: 60,
                        background: "var(--brand-primary-light)",
                        color: "var(--brand-primary-dark)",
                      }}
                    >
                      {t.icon_url ? (
                        <img src={t.icon_url} alt="" width={30} height={30} className="object-contain" />
                      ) : hasIcon(t.icon_key) ? (
                        <DynamicIcon name={t.icon_key} size={26} />
                      ) : (
                        <FaShieldHalved size={26} />
                      )}
                    </span>
                    <div>
                      <p
                        className="text-sm md:text-base font-bold leading-tight"
                        style={{ color: "var(--heading-color)" }}
                      >
                        {t.title}
                      </p>
                      {subtitle && (
                        <p
                          className="text-[11px] md:text-xs mt-1 leading-snug"
                          style={{ color: "var(--body-color)", opacity: 0.75 }}
                        >
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
