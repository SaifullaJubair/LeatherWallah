import FloatingAssets from "../FloatingAssets";

export default function UseCasesSection({ product, theme }) {
  const items = product?.use_cases || [];
  if (items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden py-8 md:py-12"
      style={{ background: "var(--section-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="use_cases" />
      <div className="max-w-5xl mx-auto px-4 relative">
        <h2
          className="text-2xl md:text-3xl font-bold mb-5"
          style={{
            color: "var(--heading-color)",
            fontFamily: "var(--brand-font)",
            fontWeight: "var(--brand-heading-weight)",
          }}
        >
          কোথায় ব্যবহার করবেন? 🍽️
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map((u, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded shadow-sm flex flex-col items-center text-center"
            >
              {u.icon_url && (
                <img
                  src={u.icon_url}
                  alt=""
                  className="w-12 h-12 object-contain mb-2"
                />
              )}
              <span
                className="text-sm"
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
