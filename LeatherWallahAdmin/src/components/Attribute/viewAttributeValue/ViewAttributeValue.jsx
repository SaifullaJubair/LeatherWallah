import { useState } from "react";
import { RxCross1 } from "react-icons/rx";

const ViewAttributeValue = ({
  setViewAttributeValueModal,
  attributesValue,
}) => {
  const [previewColor, setPreviewColor] = useState(null);

  // safer color attribute check
  const isColorAttribute =
    attributesValue?.attribute_name?.toLowerCase() === "color" ||
    attributesValue?.attribute_slug === "color" ||
    attributesValue?.attribute_type === "color" ||
    attributesValue?.display_type === "swatch";

  const tracksWeight = attributesValue?.tracks_weight === true;

  // Render the "Value / Preview" cell per attribute type so non-color
  // attributes (weight etc.) actually show their data instead of a blank
  // color swatch (AB-1). Order: color swatch → weight grams → raw code → slug.
  const renderValueCell = (values) => {
    if (isColorAttribute) {
      return (
        <div className="flex items-center justify-center gap-3">
          <div className="relative group">
            <div
              className="w-6 h-6 rounded-full border border-gray-300 shadow-sm cursor-pointer transition hover:scale-110"
              style={{ backgroundColor: values?.attribute_value_code }}
              onClick={() => setPreviewColor(values?.attribute_value_code)}
            ></div>
            <div className="absolute left-1/2 top-[-70px] hidden group-hover:flex -translate-x-1/2 items-center justify-center z-50">
              <div
                className="w-14 h-14 rounded-xl border-2 border-white shadow-xl"
                style={{ backgroundColor: values?.attribute_value_code }}
              ></div>
            </div>
          </div>
          <code className="bg-gray-100 px-2 py-1 rounded text-[10px]">
            {values?.attribute_value_code || "—"}
          </code>
        </div>
      );
    }

    if (tracksWeight || values?.weight_grams_value != null) {
      return (
        <span className="font-medium text-slate-700">
          {values?.weight_grams_value != null
            ? `${values.weight_grams_value} g`
            : "—"}
        </span>
      );
    }

    // Generic fallback for any other attribute type (button / dropdown).
    const fallback =
      values?.attribute_value_code || values?.attribute_value_slug;
    return (
      <code className="bg-gray-100 px-2 py-1 rounded text-[10px]">
        {fallback || "—"}
      </code>
    );
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative bg-white rounded-lg shadow-xl w-[600px] p-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div>
            <h3 className="text-[20px] font-bold text-gray-800 text-center">
              View Attribute Value
            </h3>
            <button
              type="button"
              className="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-100"
              onClick={() => setViewAttributeValueModal(false)}
            >
              <RxCross1 size={20} />
            </button>
          </div>

          {/* Attribute Info */}
          <div className="mt-8 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md text-sm">
            <div className="font-bold">
              Attribute Name:{" "}
              <span className="font-medium text-slate-700">
                {attributesValue?.attribute_name}
              </span>
            </div>

            <div className="font-bold">
              Category Name:{" "}
              <span className="font-medium text-slate-700">
                {attributesValue?.category_id?.category_name || "N/A"}
              </span>
            </div>

            <div className="font-bold">
              Attribute Status:{" "}
              <span
                className={`font-medium ${
                  attributesValue?.attribute_status === "active"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {attributesValue?.attribute_status}
              </span>
            </div>

            <div className="font-bold">
              Display Type:{" "}
              <span className="font-medium text-slate-700 capitalize">
                {attributesValue?.display_type || "button"}
              </span>
            </div>

            {tracksWeight && (
              <div className="font-bold">
                Tracks Weight:{" "}
                <span className="font-medium text-green-600">Yes</span>
              </div>
            )}
          </div>

          {/* Attribute Values Table */}
          <div className="mt-6">
            <span className="font-bold text-gray-700">Attributes Values:</span>

            <div className="mt-3 overflow-x-auto border rounded-lg">
              <table className="w-full text-xs text-center whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-3 border-r">Name</th>
                    <th className="p-3 border-r">Slug</th>
                    <th className="p-3 border-r">
                      {isColorAttribute
                        ? "Color"
                        : tracksWeight
                          ? "Weight"
                          : "Value"}
                    </th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attributesValue?.attribute_values?.length ? (
                    attributesValue.attribute_values.map((values) => (
                      <tr
                        key={values?._id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-3 py-3 border-r font-medium">
                          {values?.attribute_value_name}
                        </td>

                        <td className="px-3 py-3 border-r text-slate-500">
                          {values?.attribute_value_slug || "—"}
                        </td>

                        <td className="px-3 py-3 border-r">
                          {renderValueCell(values)}
                        </td>

                        <td
                          className={`px-3 py-3 font-bold capitalize ${
                            values?.attribute_value_status === "active"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {values?.attribute_value_status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-gray-400 italic"
                      >
                        No values added for this attribute.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Click / Mobile Preview Modal */}
      {previewColor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewColor(null)}
        >
          <div
            className="w-40 h-40 rounded-2xl border-4 border-white shadow-2xl"
            style={{ backgroundColor: previewColor }}
          ></div>
        </div>
      )}
    </>
  );
};

export default ViewAttributeValue;
