"use client";
// Nutrition (left) + "আমাদের প্রতিশ্রুতি" trust grid (right) — 2-column, side
// by side per the theme reference. Trust supports 2×3 (up to 6) compact tiles
// with icon + title + optional subtitle. Each card stays the same height.
import { FaInfoCircle } from "react-icons/fa";
import {
  FaShieldHeart,
  FaTruckFast,
  FaSeedling,
  FaAward,
  FaBoxArchive,
  FaThumbsUp,
} from "react-icons/fa6";
import FloatingAssets from "../FloatingAssets";
import DynamicIcon from "@/lib/icons/DynamicIcon";

const TRUST_ICONS = [
  FaSeedling,
  FaShieldHeart,
  FaAward,
  FaBoxArchive,
  FaTruckFast,
  FaThumbsUp,
];

// Soft subtitles used when admin hasn't supplied one (theme reference shows
// every trust tile with a short supporting line). Cycles if more than 6.
const TRUST_FALLBACK_SUBS = [
  "কোনো কৃত্রিম উপাদান নয়",
  "১০০% নিরাপদ",
  "প্রিমিয়াম কোয়ালিটি",
  "ফ্রেশ ও বিশুদ্ধ",
  "সারাদেশে দ্রুত পৌঁছে",
  "আমাদের অঙ্গীকার",
];

// Filler tiles to complete the 6-cell grid when admin only set 4 trust cards.
// These render only if the real trust list has fewer than 6 items.
const TRUST_EXTRA = [
  { title: "ফ্রেশ ও বিশুদ্ধ", description: "সরাসরি ফার্ম থেকে" },
  { title: "গ্রাহক সন্তুষ্টি", description: "আমাদের অঙ্গীকার" },
];

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
              পুষ্টি তথ্য {n?.per_serving ? `(${n.per_serving})` : ""}
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

        {/* ── RIGHT: আমাদের প্রতিশ্রুতি (trust 3×2 grid, compact tiles) ── */}
        {trust.length > 0 && (
          <div className="flex flex-col">
            <Heading>আমাদের প্রতিশ্রুতি</Heading>
            <div
              className="rounded-2xl shadow-sm p-5 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 flex-1 content-around"
              style={{ background: "#fff" }}
            >
              {[...trust, ...TRUST_EXTRA].slice(0, 6).map((t, i) => {
                const TrustIcon = TRUST_ICONS[i % TRUST_ICONS.length];
                const subtitle =
                  t.description ||
                  t.subtitle ||
                  TRUST_FALLBACK_SUBS[i % TRUST_FALLBACK_SUBS.length];
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
                      ) : t.icon_key ? (
                        <DynamicIcon name={t.icon_key} size={26} />
                      ) : (
                        <TrustIcon size={26} />
                      )}
                    </span>
                    <div>
                      <p
                        className="text-sm md:text-base font-bold leading-tight"
                        style={{ color: "var(--heading-color)" }}
                      >
                        {t.title}
                      </p>
                      <p
                        className="text-[11px] md:text-xs mt-1 leading-snug"
                        style={{ color: "var(--body-color)", opacity: 0.75 }}
                      >
                        {subtitle}
                      </p>
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
