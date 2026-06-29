import { useEffect, useState } from "react";
import Select from "react-select";
import { BASE_URL } from "../../utils/baseURL";

// Phase B — two-multiselect block shared by AddCategory + UpDateCategory.
// Lets admin set default_variant_attributes + default_filter_attributes for a
// category. Fetches the live attribute pool + (when editing under a parent)
// shows the inherited list so admin knows what's already coming from above.
//
// Emits values via onChange({ default_variant_attributes, default_filter_attributes }).
const AttributeDefaultsSelector = ({
  initialVariantIds = [],
  initialFilterIds = [],
  parentId = null,
  onChange,
}) => {
  const [attributes, setAttributes] = useState([]);
  const [inherited, setInherited] = useState(null);
  const [loading, setLoading] = useState(true);

  const [variantSel, setVariantSel] = useState([]);
  const [filterSel, setFilterSel] = useState([]);

  // Load attribute pool once (active only — inactive ones shouldn't be picked
  // as new defaults; if a previously-saved one is now inactive we still render
  // it from initialVariantIds via the fallback below).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/attribute`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!cancelled) {
          setAttributes(
            (json?.data || []).filter(
              (a) => a?.attribute_status !== "in-active",
            ),
          );
        }
      } catch (_e) {
        if (!cancelled) setAttributes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // If there's a parent, fetch its resolved defaults so we can show "Inheriting
  // from parent: [Size, Color]" hint.
  useEffect(() => {
    if (!parentId) {
      setInherited(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/category/defaults/${parentId}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!cancelled) setInherited(json?.data || null);
      } catch (_e) {
        if (!cancelled) setInherited(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parentId]);

  // Seed selections from initial ids once attributes are loaded.
  useEffect(() => {
    if (!attributes.length) return;
    const byId = new Map(attributes.map((a) => [String(a._id), a]));
    const hydrate = (ids) =>
      (ids || [])
        .map((id) => byId.get(String(id)))
        .filter(Boolean)
        .map((a) => ({ value: String(a._id), label: a.attribute_name }));
    setVariantSel(hydrate(initialVariantIds));
    setFilterSel(hydrate(initialFilterIds));
    // intentionally only seed on attribute-load — parent control owns state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes]);

  // Push updates upward.
  useEffect(() => {
    if (!onChange) return;
    onChange({
      default_variant_attributes: variantSel.map((o) => o.value),
      default_filter_attributes: filterSel.map((o) => o.value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantSel, filterSel]);

  const options = attributes.map((a) => ({
    value: String(a._id),
    label: a.attribute_name,
  }));

  const renderInheritList = (list) =>
    list && list.length
      ? list.map((a) => a.attribute_name).join(", ")
      : "none";

  return (
    <div className="mt-6 border-t pt-4">
      <h4 className="font-semibold text-gray-800 mb-1">
        Category Default Attributes
      </h4>
      <p className="text-[11px] text-gray-500 mb-3">
        These attributes will be auto-suggested when admins create products
        under this category. Saved choices merge with parent-category defaults.
      </p>

      {parentId && inherited && (
        <div className="text-[12px] bg-blue-50 border border-blue-100 text-blue-800 rounded p-2 mb-3">
          <div>
            <strong>Inheriting variant axes from parent:</strong>{" "}
            {renderInheritList(inherited.default_variant_attributes)}
          </div>
          <div>
            <strong>Inheriting filter attributes from parent:</strong>{" "}
            {renderInheritList(inherited.default_filter_attributes)}
          </div>
          <div className="mt-1 italic">
            Your selections below will be MERGED with these.
          </div>
        </div>
      )}

      <label className="block text-xs font-medium text-gray-700 mb-1">
        Default Variant Attributes (e.g. Size, Color)
      </label>
      <Select
        isMulti
        options={options}
        value={variantSel}
        onChange={(v) => setVariantSel(v || [])}
        isLoading={loading}
        placeholder="Choose variant axes..."
        classNamePrefix="rs"
      />

      <label className="block text-xs font-medium text-gray-700 mb-1 mt-4">
        Default Filter Attributes (sidebar facets on storefront)
      </label>
      <Select
        isMulti
        options={options}
        value={filterSel}
        onChange={(v) => setFilterSel(v || [])}
        isLoading={loading}
        placeholder="Choose sidebar filters..."
        classNamePrefix="rs"
      />
    </div>
  );
};

export default AttributeDefaultsSelector;
