import IconPicker from "../common/IconPicker/IconPicker";

// Controlled, like every other Page Content section (see IconTextRepeater).
// It used to own its own fetch + a Save button per row, which meant the form's
// single top "Save Changes" silently skipped this table — the admin had to
// click each row's Save separately, and if they didn't, their edits were lost.
// The parent now holds the rows and saves them with everything else.
//
// Weight is stored in grams. The g/kg selector is display-only: `_wValue` and
// `_wUnit` are UI state, converted back to grams on save by the parent (see
// variationWeight.js).

const VariationWeightEditor = ({ value, onChange, loading }) => {
  const variations = value || [];

  const updateLocal = (id, patch) =>
    onChange(variations.map((v) => (v._id === id ? { ...v, ...patch } : v)));

  if (loading) return <p className="text-sm text-gray-500">Loading variations...</p>;
  if (!variations.length) {
    return (
      <p className="text-sm text-gray-500 italic">
        এই product এ কোনো variation নেই।
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Variation</th>
            <th className="px-3 py-2 text-left">Weight</th>
            <th className="px-3 py-2 text-left">Badge Text</th>
            <th className="px-3 py-2 text-left">Badge Icon</th>
            <th className="px-3 py-2 text-left">Price</th>
            <th className="px-3 py-2 text-left">Stock</th>
          </tr>
        </thead>
        <tbody>
          {variations.map((v) => (
            <tr key={v._id} className="border-t">
              <td className="px-3 py-2 font-medium">{v.variation_name}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={v._wValue}
                    onChange={(e) => updateLocal(v._id, { _wValue: e.target.value })}
                    className="form-input w-24"
                    placeholder="0"
                  />
                  <select
                    value={v._wUnit}
                    onChange={(e) => updateLocal(v._id, { _wUnit: e.target.value })}
                    className="form-input w-16"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  maxLength={20}
                  value={v.variation_badge_text || ""}
                  onChange={(e) =>
                    updateLocal(v._id, { variation_badge_text: e.target.value })
                  }
                  placeholder="সেরা প্যাক / জনপ্রিয় (optional)"
                  className="form-input"
                />
              </td>
              <td className="px-3 py-2">
                <IconPicker
                  value={v.variation_badge_icon_key || null}
                  onChange={(k) =>
                    updateLocal(v._id, { variation_badge_icon_key: k || null })
                  }
                />
              </td>
              <td className="px-3 py-2 text-gray-700">
                ৳{v.variation_discount_price || v.variation_price}
              </td>
              <td className="px-3 py-2 text-gray-700">{v.variation_quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2">
        Weight DB-তে সবসময় <strong>grams</strong> এ save হয়। UI তে kg ব্যবহার করলে auto convert হবে।
        Pathao courier এ এই weight সরাসরি ব্যবহার হবে (1kg = 1000g)। উপরের{" "}
        <strong>Save Page Content</strong> বাটনেই এই টেবিল save হবে।
      </p>
    </div>
  );
};

export default VariationWeightEditor;
