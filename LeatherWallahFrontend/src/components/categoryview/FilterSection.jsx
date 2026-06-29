"use client";
import { useState } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import PriceRangeFilter from "./PriceRangFilter";
import { availabilityFilterData, brandFilterData } from "@/data/filter-data";

// Custom checkbox with green tick
const FilterCheckbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group py-1">
    <span
      onClick={onChange}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-150 ${
        checked ? "bg-primary border-primary" : "border-gray-300 group-hover:border-primary bg-white"
      }`}
    >
      {checked && <FiCheck size={10} className="text-white stroke-[3]" />}
    </span>
    <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">{label}</span>
  </label>
);

// Collapsible section
const FilterGroup = ({ title, children, defaultOpen = true, count = 0 }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {count}
            </span>
          )}
        </span>
        <FiChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-80 pb-3" : "max-h-0"}`}>
        <div className="px-4 overflow-y-auto max-h-64">{children}</div>
      </div>
    </div>
  );
};

const FilterSection = ({ slug, selectedFilters, setSelectedFilters, filterData }) => {
  const handleFilterClick = (filterId, childFilterId) => {
    setSelectedFilters((prev) => {
      const map = prev.filters && !Array.isArray(prev.filters) ? prev.filters : {};
      const current = map[filterId] || [];
      const next = current.includes(childFilterId)
        ? current.filter((id) => id !== childFilterId)
        : [...current, childFilterId];
      const updated = { ...map, [filterId]: next };
      for (const k in updated) {
        if (Array.isArray(updated[k]) && !updated[k].length) delete updated[k];
      }
      return { ...prev, filters: updated };
    });
  };

  const handleSetPrice = (value) => {
    setSelectedFilters((prev) => ({ ...prev, min_price: value?.min, max_price: value?.max }));
  };

  const handleSetAvailability = (value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      availability: prev.availability.includes(value)
        ? prev.availability.filter((i) => i !== value)
        : [...prev.availability, value],
    }));
  };

  const handleSetBrands = (value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(value)
        ? prev.brands.filter((i) => i !== value)
        : [...prev.brands, value],
    }));
  };

  return (
    <div className="overflow-hidden">
      {/* Price */}
      <FilterGroup title="Price Range">
        <div className="pt-2">
          <PriceRangeFilter
            onChange={handleSetPrice}
            filterData={filterData}
            initialMin={selectedFilters?.min_price}
            initialMax={selectedFilters?.max_price}
          />
        </div>
      </FilterGroup>

      {/* Availability */}
      {availabilityFilterData?.map((filter, i) => (
        <FilterGroup
          key={i}
          title={filter?.filter_name}
          count={selectedFilters?.availability?.length}
        >
          <div className="space-y-0.5">
            {filter?.child_filters?.map((childFilter) => (
              <FilterCheckbox
                key={childFilter?.child_filter_name}
                checked={selectedFilters?.availability?.includes(childFilter?.value)}
                onChange={() => handleSetAvailability(childFilter?.value)}
                label={childFilter?.child_filter_name}
              />
            ))}
          </div>
        </FilterGroup>
      ))}

      {/* Brands */}
      {filterData?.brands?.length > 0 &&
        brandFilterData?.map((filter, i) => (
          <FilterGroup
            key={i}
            title={filter?.filter_name}
            count={selectedFilters?.brands?.length}
          >
            <div className="space-y-0.5">
              {filterData.brands.map((brand) => (
                <FilterCheckbox
                  key={brand?._id}
                  checked={selectedFilters?.brands?.includes(brand?.brand_slug)}
                  onChange={() => handleSetBrands(brand?.brand_slug)}
                  label={brand?.brand_name}
                />
              ))}
            </div>
          </FilterGroup>
        ))}

      {/* Attributes */}
      {filterData?.attributes?.map((item, i) => {
        const filtersMap = selectedFilters?.filters || {};
        const selectedCount = (filtersMap[item?._id] || []).length;
        return (
          <FilterGroup key={i} title={item?.attribute_name} count={selectedCount} defaultOpen={i < 2}>
            <div className="space-y-0.5">
              {item?.attribute_values?.map((val) => {
                const isChecked = (filtersMap[item?._id] || []).includes(val?._id);
                const isColor = val?.attribute_value_code && /^#[0-9A-Fa-f]{3,6}$/.test(val.attribute_value_code);
                return (
                  <label key={val?._id} className="flex items-center gap-2.5 cursor-pointer group py-1">
                    <span
                      onClick={() => handleFilterClick(item?._id, val?._id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-150 ${
                        isChecked ? "bg-primary border-primary" : "border-gray-300 group-hover:border-primary bg-white"
                      }`}
                    >
                      {isChecked && <FiCheck size={10} className="text-white stroke-[3]" />}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-gray-700 group-hover:text-gray-900">
                      {isColor && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block shrink-0"
                          style={{ backgroundColor: val.attribute_value_code }}
                        />
                      )}
                      {val?.attribute_value_name}
                    </span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>
        );
      })}
    </div>
  );
};

export default FilterSection;
