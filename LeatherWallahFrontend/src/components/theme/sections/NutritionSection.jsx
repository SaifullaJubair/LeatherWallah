import FloatingAssets from "../FloatingAssets";

const FIELD_LABELS_BN = {
  calories: "ক্যালরি",
  protein: "প্রোটিন",
  carbohydrate: "কার্বোহাইড্রেট",
  fiber: "ফাইবার",
  sugar: "চিনি",
  fat: "ফ্যাট",
  vitamin_a: "ভিটামিন A",
  vitamin_c: "ভিটামিন C",
  iron: "আয়রন",
  calcium: "ক্যালসিয়াম",
};

export default function NutritionSection({ product, theme }) {
  const n = product?.nutrition;
  if (!n) return null;

  const rows = Object.entries(FIELD_LABELS_BN)
    .map(([key, label]) => [label, n[key]])
    .filter(([, v]) => v);

  if (rows.length === 0 && !n.origin && !n.shelf_life) return null;

  return (
    <section
      className="relative overflow-hidden py-8 md:py-12"
      style={{ background: "var(--page-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="nutrition" />
      <div className="max-w-3xl mx-auto px-4 relative">
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <h2
            className="text-xl md:text-2xl font-bold mb-3"
            style={{
              color: "var(--heading-color)",
              fontFamily: "var(--brand-font)",
              fontWeight: "var(--brand-heading-weight)",
            }}
          >
            পুষ্টি তথ্য {n.per_serving ? `(${n.per_serving})` : ""}
          </h2>
          {rows.length > 0 && (
            <table className="w-full text-sm" style={{ color: "var(--body-color)" }}>
              <tbody>
                {rows.map(([label, val]) => (
                  <tr key={label} className="border-b last:border-0">
                    <td className="py-2">{label}</td>
                    <td className="py-2 text-right font-medium">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(n.origin || n.shelf_life || (n.certifications || []).length > 0) && (
            <div
              className="mt-4 pt-3 border-t text-sm space-y-1"
              style={{ color: "var(--body-color)" }}
            >
              {n.origin && <div>🌱 উৎপাদন: {n.origin}</div>}
              {n.shelf_life && <div>📦 শেলফ লাইফ: {n.shelf_life}</div>}
              {(n.certifications || []).length > 0 && (
                <div>✅ {n.certifications.join(", ")}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
