"use client";
// "পণ্য সম্পর্কে" + "পণ্যের বিবরণ" — a two-column section shown below the hero.
// LEFT  = rich-text product.description (clamped with a "আরও পড়ুন" toggle).
// RIGHT = the product spec sheet (custom_fields) as an always-visible
// icon + label/value table. Each column has its own titled header and self-
// hides when its data is empty, so a product with only one of the two still
// looks balanced. Themed via brand CSS vars.
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import DynamicIcon from "@/lib/icons/DynamicIcon";

// Small titled header bar (brand accent stripe + heading) reused by both cols.
function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-1.5 h-6 rounded-full"
        style={{ background: "var(--brand-primary)" }}
      />
      <h2
        className="text-lg md:text-xl font-bold"
        style={{
          color: "var(--heading-color)",
          fontWeight: "var(--brand-heading-weight, 700)",
        }}
      >
        {children}
      </h2>
    </div>
  );
}

export default function DescriptionCard({ html, customFields = [] }) {
  const [expanded, setExpanded] = useState(false);

  const hasHtml = html && String(html).trim();
  const specRows = (customFields || []).filter((f) => f?.label);
  const hasSpec = specRows.length > 0;
  if (!hasHtml && !hasSpec) return null;

  // Heuristic: only offer the toggle when the content is long enough to bother
  // clamping. Strip tags for a rough length estimate.
  const plainLen = hasHtml
    ? String(html).replace(/<[^>]*>/g, "").trim().length
    : 0;
  const isLong = plainLen > 280;

  return (
    <section className="mb-8">
      {/* Two columns on desktop; stack on mobile. items-stretch makes both
          columns equal height, so a long description clamps to the spec card's
          height (with "আরও পড়ুন") instead of overflowing past it — the two
          cards line up. If only one side has data it spans on its own. */}
      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        {/* LEFT — description */}
        {hasHtml && (
          <div className="flex flex-col">
            <SectionTitle>About This Product</SectionTitle>
            <div
              className="rounded-2xl shadow-sm p-5 md:p-6 flex-1 flex flex-col min-h-0"
              style={{ background: "#fff" }}
            >
              <div
                // `pdp-desc` namespaces the styles below so they affect only
                // this card's rich-text HTML — no global leak. When collapsed,
                // flex-1 + min-h-0 + overflow-hidden clamps the text to the
                // card's (stretched) height rather than a fixed maxHeight, so
                // it matches the spec card next to it.
                className="pdp-desc text-sm md:text-base leading-relaxed transition-all duration-300"
                style={{
                  color: "var(--body-color)",
                  ...(isLong && !expanded
                    ? {
                        flex: "1 1 0%",
                        minHeight: 0,
                        overflow: "hidden",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, #000 60%, transparent)",
                        maskImage:
                          "linear-gradient(to bottom, #000 60%, transparent)",
                      }
                    : {}),
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-3 shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold self-start"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {expanded ? "Show less" : "Read more"}
                  <FaChevronDown
                    size={12}
                    className="transition-transform duration-200"
                    style={{ transform: expanded ? "rotate(180deg)" : "none" }}
                  />
                </button>
              )}
            </div>
          </div>
        )}

        {/* RIGHT — spec sheet (custom_fields), always fully visible */}
        {hasSpec && (
          <div className="flex flex-col">
            <SectionTitle>Specifications</SectionTitle>
            <ul
              className="rounded-2xl shadow-sm divide-y overflow-hidden flex-1"
              style={{ background: "#fff", borderColor: "var(--section-bg)" }}
            >
              {specRows.map((f, i) => (
                <li
                  key={i}
                  // Stack label over value on mobile (a long value otherwise
                  // collides with the label since both sit on one flex row),
                  // back to side-by-side on sm+.
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-5 py-3.5"
                  style={{ borderColor: "var(--section-bg)" }}
                >
                  <span className="flex items-center gap-2.5 min-w-0 flex-1">
                    {f.icon_key && (
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "var(--section-bg)",
                          color: "var(--brand-primary)",
                        }}
                      >
                        <DynamicIcon name={f.icon_key} size={15} />
                      </span>
                    )}
                    <span
                      className="text-sm md:text-base font-medium"
                      style={{ color: "var(--body-color)" }}
                    >
                      {f.label}
                    </span>
                  </span>
                  <span
                    className="text-sm md:text-base font-semibold text-left sm:text-right shrink-0"
                    style={{ color: "var(--heading-color)" }}
                  >
                    {f.value || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Scoped rich-text styling so admin's <ul>/<ol>/<table>/<blockquote>
          actually render with bullets, numbers, borders, etc. — we don't ship
          @tailwindcss/typography. Keep selectors under `.pdp-desc` so this
          can't bleed into other parts of the site. */}
      <style jsx>{`
        .pdp-desc :global(h2) {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
          color: var(--heading-color);
        }
        .pdp-desc :global(h3) {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0.9rem 0 0.4rem;
          color: var(--heading-color);
        }
        .pdp-desc :global(p) {
          margin: 0.5rem 0;
        }
        .pdp-desc :global(strong) {
          font-weight: 700;
          color: var(--heading-color);
        }
        .pdp-desc :global(em) {
          font-style: italic;
        }
        .pdp-desc :global(a) {
          color: var(--brand-primary);
          text-decoration: underline;
        }
        .pdp-desc :global(ul) {
          list-style: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .pdp-desc :global(ol) {
          list-style: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .pdp-desc :global(li) {
          margin: 0.2rem 0;
        }
        /* Nested-list markers by depth. */
        .pdp-desc :global(ul ul) { list-style: circle; }
        .pdp-desc :global(ul ul ul) { list-style: square; }
        .pdp-desc :global(ol ol) { list-style: lower-alpha; }
        .pdp-desc :global(ol ol ol) { list-style: lower-roman; }
        /* List-item alignment fix — move the marker with the text when a list
           item is centre/right/justify aligned (else the bullet stays left). */
        .pdp-desc :global(li:has(> p[style*="text-align: center"])),
        .pdp-desc :global(li[style*="text-align: center"]) {
          text-align: center;
          list-style-position: inside;
        }
        .pdp-desc :global(li:has(> p[style*="text-align: right"])),
        .pdp-desc :global(li[style*="text-align: right"]) {
          text-align: right;
          list-style-position: inside;
        }
        .pdp-desc :global(li:has(> p[style*="text-align: justify"])),
        .pdp-desc :global(li[style*="text-align: justify"]) {
          text-align: justify;
          list-style-position: inside;
        }
        /* Inner <p> inline so the number/bullet stays on the same line as the
           text when a list item is aligned (otherwise it line-breaks). */
        .pdp-desc :global(li:has(> p[style*="text-align: center"]) > p),
        .pdp-desc :global(li:has(> p[style*="text-align: right"]) > p),
        .pdp-desc :global(li:has(> p[style*="text-align: justify"]) > p),
        .pdp-desc :global(li[style*="text-align: center"] > p),
        .pdp-desc :global(li[style*="text-align: right"] > p),
        .pdp-desc :global(li[style*="text-align: justify"] > p) {
          display: inline;
        }
        /* Highlight mark from the editor */
        .pdp-desc :global(mark) {
          border-radius: 2px;
          padding: 0 0.1em;
        }
        .pdp-desc :global(blockquote) {
          margin: 0.75rem 0;
          padding: 0.6rem 0.9rem;
          border-left: 4px solid var(--brand-primary);
          background: var(--section-bg);
          font-style: italic;
          border-radius: 0 6px 6px 0;
        }
        .pdp-desc :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75rem 0;
          font-size: 0.9em;
        }
        .pdp-desc :global(th),
        .pdp-desc :global(td) {
          border: 1px solid var(--brand-primary-light);
          padding: 0.5rem 0.7rem;
          text-align: left;
        }
        .pdp-desc :global(th) {
          background: var(--brand-primary-light);
          font-weight: 700;
          color: var(--brand-primary-dark);
        }
        .pdp-desc :global(tr:nth-child(even) td) {
          background: var(--section-bg);
        }
        .pdp-desc :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5rem 0;
        }
      `}</style>
    </section>
  );
}
