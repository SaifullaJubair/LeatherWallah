import FloatingAssets from "../FloatingAssets";

export default function BenefitsSection({ product, theme }) {
  const items = product?.benefits || [];
  if (items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden py-8 md:py-12"
      style={{ background: "var(--page-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="benefits" />
      <div className="max-w-5xl mx-auto px-4 relative">
        <h2
          className="text-2xl md:text-3xl font-bold mb-5"
          style={{
            color: "var(--heading-color)",
            fontFamily: "var(--brand-font)",
            fontWeight: "var(--brand-heading-weight)",
          }}
        >
          {product?.product_name} এর উপকারিতা 🍎
        </h2>
        <ul className="grid md:grid-cols-2 gap-2">
          {items.map((b, i) => (
            <li
              key={i}
              className="flex items-center gap-2 p-3 rounded"
              style={{
                background: "var(--brand-primary-light)",
                color: "var(--body-color)",
              }}
            >
              <span style={{ color: "var(--accent-color)" }}>✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
