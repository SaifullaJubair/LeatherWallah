"use client";
import { useState } from "react";
import { FiChevronDown, FiFileText, FiList } from "react-icons/fi";

const AccordionItem = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors text-left group"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${open ? "bg-primary text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}
          >
            {icon}
          </div>
          <span
            className={`text-sm font-semibold transition-colors ${open ? "text-primary" : "text-gray-700"}`}
          >
            {title}
          </span>
        </div>
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${open ? "bg-primary/10 rotate-180" : "bg-gray-100"}`}
        >
          <FiChevronDown
            size={13}
            className={open ? "text-primary" : "text-gray-500"}
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
};

const ProductDescription = ({ product }) => {
  return (
    <div className="divide-y divide-gray-50">
      {/* Description */}
      {product?.description && (
        <AccordionItem
          title="Product Details"
          icon={<FiFileText size={13} />}
          defaultOpen={true}
        >
          <div
            className="prose prose-sm max-w-none text-gray-600 leading-relaxed
              prose-headings:text-gray-800 prose-strong:text-gray-800
              prose-ul:space-y-1 prose-li:text-gray-600"
            dangerouslySetInnerHTML={{ __html: product?.description }}
          />
        </AccordionItem>
      )}

      {/* Specifications — driven by Phase-1 product_attributes (single source
          of truth shared with the filter sidebar, so the spec table and the
          facets can never desync). Backend populates attribute_id; we filter
          its values to the chosen value_ids. */}
      {product?.product_attributes?.length > 0 && (
        <AccordionItem
          title="Specifications"
          icon={<FiList size={13} />}
          defaultOpen={false}
        >
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <tbody>
                {product.product_attributes.map((pa, i) => {
                  const attr = pa?.attribute_id;
                  if (!attr) return null;
                  const chosenIds = new Set(
                    (pa?.value_ids || []).map((v) => String(v)),
                  );
                  const labels = (attr.attribute_values || [])
                    .filter((v) => chosenIds.has(String(v._id)))
                    .map((v) => v?.attribute_value_name)
                    .filter(Boolean);
                  if (labels.length === 0) return null;
                  return (
                    <tr
                      key={attr._id || i}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-700 border-r border-gray-100 w-[40%]">
                        {attr.attribute_name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {labels.join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AccordionItem>
      )}
    </div>
  );
};

export default ProductDescription;
