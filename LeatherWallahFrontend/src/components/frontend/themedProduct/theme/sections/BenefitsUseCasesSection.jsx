"use client";
// Benefits + Use-cases shown SIDE BY SIDE (2-column on lg), per the apple
// theme mockup. Left: "উপকারিতা" checkmark list. Right: "কোথায় ব্যবহার করবেন?"
// icon grid. Each is a soft white card with a fruit image accent. Either side
// hides itself if its data is empty; if only one exists it spans full width.
import { FaCheck } from "react-icons/fa6";
import FloatingAssets from "../FloatingAssets";
import DynamicIcon, { hasIcon } from "@/lib/icons/DynamicIcon";

function Heading({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1.5 h-6 rounded-full" style={{ background: "var(--brand-primary)" }} />
      <h2
        className="text-lg md:text-xl font-bold"
        style={{ color: "var(--heading-color)", fontWeight: "var(--brand-heading-weight, 700)" }}
      >
        {children}
      </h2>
    </div>
  );
}

export default function BenefitsUseCasesSection({ product, theme }) {
  const benefits = product?.benefits || [];
  const useCases = product?.use_cases || [];
  // Per-section side image with main_image as fallback so existing products
  // still get an accent visual when admin hasn't uploaded a dedicated one.
  // The admin can fully hide a side image (including the fallback) via the
  // Page Content toggle. Gate is `!== false` so legacy products without the
  // flag keep showing the image.
  const mainImg = product?.main_image;
  const benefitsImg =
    product?.benefits_side_image_show !== false
      ? product?.benefits_side_image || mainImg
      : null;
  const useCasesImg =
    product?.use_cases_side_image_show !== false
      ? product?.use_cases_side_image || mainImg
      : null;
  if (benefits.length === 0 && useCases.length === 0) return null;

  const onlyOne = benefits.length === 0 || useCases.length === 0;

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: "var(--page-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section={["benefits", "use_cases"]} />

      <div
        className={`max-w-6xl mx-auto px-4 relative grid gap-6 items-stretch ${
          onlyOne ? "grid-cols-1" : "lg:grid-cols-2"
        }`}
      >
        {/* ── Benefits ── */}
        {benefits.length > 0 && (
          <div className="flex flex-col">
            <Heading>Why You'll Love It</Heading>
            <div
              className="relative rounded-2xl shadow-sm p-5 md:p-6 overflow-hidden flex-1"
              style={{ background: "#fff" }}
            >
              <ul className="space-y-3 max-w-[60%]">
                {benefits.map((b, i) => {
                  // Back-compat: legacy rows are plain strings; new rows are
                  // { text, icon_url?, icon_key? }. Priority: custom upload >
                  // picked icon > FaCheck. Unlike use_cases the fallback stays:
                  // this is a checkmark bullet on a benefits list, not a
                  // domain-specific glyph, so it's meaningful on any store.
                  const text = typeof b === "string" ? b : b?.text;
                  const iconUrl = typeof b === "string" ? null : b?.icon_url;
                  const iconKey = typeof b === "string" ? null : b?.icon_key;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex items-center justify-center rounded-full shrink-0 overflow-hidden"
                        style={{ width: 22, height: 22, background: "var(--brand-primary)", color: "var(--button-text,#fff)" }}
                      >
                        {iconUrl ? (
                          <img src={iconUrl} alt="" width={14} height={14} className="object-contain" />
                        ) : hasIcon(iconKey) ? (
                          <DynamicIcon name={iconKey} size={12} />
                        ) : (
                          <FaCheck size={11} />
                        )}
                      </span>
                      <span className="text-sm leading-snug line-clamp-3" style={{ color: "var(--body-color)" }}>
                        {text}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {benefitsImg && (
                <img
                  src={benefitsImg}
                  alt=""
                  className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 w-36 h-36 lg:w-44 lg:h-44 object-contain mix-blend-multiply pointer-events-none"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Use cases ── */}
        {useCases.length > 0 && (
          <div className="flex flex-col">
            <Heading>Perfect For</Heading>
            <div
              className="relative rounded-2xl shadow-sm p-5 md:p-6 overflow-hidden flex-1"
              style={{ background: "#fff" }}
            >
              <div className="grid grid-cols-1 gap-3 max-w-[60%]">
                {useCases.map((u, i) => {
                  // Icon priority: custom upload > icon picked in admin > none.
                  // No fallback glyph: this used to rotate through a hardcoded
                  // [briefcase, child, dumbbell, plane] list keyed on the row
                  // INDEX, so a use-case got an icon unrelated to its text — and
                  // wrong outright on a store that doesn't sell food. When there
                  // is no icon, the badge circle is dropped too, otherwise the
                  // row keeps an empty coloured puck.
                  const showBadge = Boolean(u.icon_url) || hasIcon(u.icon_key);
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      {showBadge && (
                        <span
                          className="flex items-center justify-center rounded-full shrink-0"
                          style={{ width: 40, height: 40, background: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
                        >
                          {u.icon_url ? (
                            <img src={u.icon_url} alt="" width={22} height={22} className="object-contain" />
                          ) : (
                            <DynamicIcon name={u.icon_key} size={18} />
                          )}
                        </span>
                      )}
                      <span className="text-sm font-medium leading-tight line-clamp-2" style={{ color: "var(--body-color)" }}>
                        {u.text}
                      </span>
                    </div>
                  );
                })}
              </div>
              {useCasesImg && (
                <img
                  src={useCasesImg}
                  alt=""
                  className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 w-36 h-36 lg:w-44 lg:h-44 object-contain mix-blend-multiply pointer-events-none"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
