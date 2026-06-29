// Renders the badge + short description + below-hero icon rows that
// supplement the existing SingleProduct hero. These additions appear above
// the order section but below the main product photo + name.

import FloatingAssets from "../FloatingAssets";

export default function HeroEnrichment({ product, theme }) {
  const hasAny =
    product?.badge_text ||
    product?.short_description ||
    (product?.short_features?.length || 0) > 0 ||
    (product?.process_steps?.length || 0) > 0;

  if (!hasAny) return null;

  return (
    <section
      className="relative overflow-hidden mt-6"
      style={{ background: "var(--page-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="hero" />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 relative">
        {product?.badge_text && (
          <span
            className="inline-block text-xs px-3 py-1 rounded-full mb-3"
            style={{
              background: "var(--brand-primary-light)",
              color: "var(--brand-primary-dark)",
            }}
          >
            {product.badge_text}
          </span>
        )}

        {product?.short_description && (
          <p
            className="text-lg md:text-xl mb-5"
            style={{ color: "var(--body-color)" }}
          >
            {product.short_description}
          </p>
        )}

        {/* Short features + process steps as 2-column on md+ */}
        {((product?.short_features || []).length > 0 ||
          (product?.process_steps || []).length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {(product?.short_features || []).length > 0 && (
              <div
                className="rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
                style={{ background: "var(--section-bg)" }}
              >
                {product.short_features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {f.icon_url ? (
                      <img
                        src={f.icon_url}
                        alt=""
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--brand-primary)" }}
                      />
                    )}
                    <span
                      className="text-xs"
                      style={{ color: "var(--body-color)" }}
                    >
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(product?.process_steps || []).length > 0 && (
              <div
                className="rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
                style={{ background: "var(--section-bg)" }}
              >
                {product.process_steps.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {p.icon_url ? (
                      <img
                        src={p.icon_url}
                        alt=""
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--brand-primary-dark)" }}
                      >
                        {i + 1}
                      </span>
                    )}
                    <span
                      className="text-xs"
                      style={{ color: "var(--body-color)" }}
                    >
                      {p.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
