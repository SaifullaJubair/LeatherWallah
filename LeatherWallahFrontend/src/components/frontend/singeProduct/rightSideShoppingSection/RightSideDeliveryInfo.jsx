import { cities } from "@/data/cites";
import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import Select from "react-select";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiHome,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

// ✅ Custom react-select styles
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "var(--color-primary, #e11d48)" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(225,29,72,0.15)" : "none",
    "&:hover": { borderColor: "#9ca3af" },
    padding: "1px 2px",
    fontSize: "0.813rem",
    minHeight: "38px",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.813rem",
    backgroundColor: state.isSelected
      ? "var(--color-primary, #e11d48)"
      : state.isFocused
        ? "#fff1f2"
        : "white",
    color: state.isSelected ? "white" : "#374151",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const RightSideDeliveryInfo = ({
  register,
  userInfo,
  errors,
  setDivision,
  setDistrictId,
  setDivisionID,
  setDistrict,
  setIsOpenDistrict,
  isOpenDistrict,
  division,
  district,
  watch,
  loading,
  isAccordionOpen,
  setIsAccordionOpen,
  customer_phone,
  setUserPhone,
  setUserPhoneLogin,
  zoneLoading,
  zoneData,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
        <Skeleton height={14} width="50%" className="mb-3" />
        <Skeleton height={36} className="mb-2" />
        <Skeleton height={36} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-3 shadow-sm">
      {/* Accordion Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <FiHome size={12} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-gray-800">
            Delivery Information
          </span>
        </div>
        <div
          className={`transition-transform duration-300 ${isAccordionOpen ? "rotate-180" : "rotate-0"}`}
        >
          <FiChevronDown size={16} className="text-gray-500" />
        </div>
      </button>

      {/* Accordion Body */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${isAccordionOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
          {/* Name */}
          <div className="pt-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              <FiUser size={11} />
              Full Name
            </label>
            <input
              {...register("customer_name", { required: "Name is required" })}
              type="text"
              readOnly={!!userInfo?.data}
              defaultValue={userInfo?.data?.user_name}
              placeholder="Your full name"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-gray-400 bg-white read-only:bg-gray-50 read-only:text-gray-600"
            />
            {errors.customer_name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.customer_name?.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              <FiPhone size={11} />
              Phone Number
            </label>
            {userInfo?.data?.user_phone ? (
              <input
                {...register("customer_phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^(?:\+88|88)?(01[3-9]\d{8})$/,
                    message: "Invalid phone number",
                  },
                })}
                onChange={() => setUserPhoneLogin(true)}
                type="number"
                defaultValue={userInfo?.data?.user_phone}
                placeholder="Phone number"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              />
            ) : (
              <PhoneInput
                className=" custom-phone-input w-full text-sm rounded-lg border border-gray-200 bg-white px-3 py-2"
                placeholder="01XXXXXXXXX"
                value={customer_phone}
                defaultCountry="BD"
                international
                countryCallingCodeEditable={false}
                countries={["BD"]}
                onChange={setUserPhone}
              />
            )}
            {errors.customer_phone && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.customer_phone?.message}
              </p>
            )}
          </div>

          {/* District + Thana in 2 columns */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                <FiMapPin size={11} />
                District
              </label>
              <Select
                placeholder="Select..."
                options={cities}
                value={division ? { city_name: division } : null}
                getOptionLabel={(x) => x?.city_name}
                getOptionValue={(x) => x?.city_id}
                onChange={(opt) => {
                  setIsOpenDistrict(false);
                  setDistrict(undefined);
                  setDistrictId(undefined);
                  setDivision(opt?.city_name);
                  setDivisionID(opt?.city_id); // ✅ এটা set হলেই useGetZoneData auto fetch করবে
                  setTimeout(() => setIsOpenDistrict(true), 50);
                }}
                styles={selectStyles}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
              />
            </div>
            {(isOpenDistrict || zoneLoading) && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  <FiMapPin size={11} />
                  Thana
                </label>
                <Select
                  placeholder="Select..."
                  options={zoneData?.data}
                  value={district ? { zone_name: district } : null}
                  getOptionLabel={(x) => x?.zone_name}
                  getOptionValue={(x) => x?.zone_id}
                  isLoading={zoneLoading}
                  onChange={(opt) => {
                    setDistrict(opt?.zone_name);
                    setDistrictId(opt?.zone_id);
                  }}
                  styles={selectStyles}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                />
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              <FiHome size={11} />
              Full Address
            </label>
            <input
              {...register("address", { required: "Address is required" })}
              type="text"
              defaultValue={userInfo?.data?.user_address}
              placeholder="House, road, area..."
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-gray-400"
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.address?.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSideDeliveryInfo;
