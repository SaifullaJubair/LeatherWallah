"use client";
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

// ✅ Theme-aware react-select styles (brand-primary focus ring, 44px height)
const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    borderColor: state.isFocused
      ? "var(--brand-primary, #C04137)"
      : "#e5e7eb",
    boxShadow: state.isFocused
      ? "0 0 0 3px var(--brand-primary-light, rgba(225,29,72,0.15))"
      : "none",
    "&:hover": { borderColor: "var(--brand-primary-light, #9ca3af)" },
    padding: "3px 4px",
    fontSize: "0.875rem",
    minHeight: "46px",
    fontFamily: "var(--brand-font)",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    fontFamily: "var(--brand-font)",
    backgroundColor: state.isSelected
      ? "var(--brand-primary, #C04137)"
      : state.isFocused
        ? "var(--brand-primary-light, #fff1f2)"
        : "white",
    color: state.isSelected ? "var(--button-text, #fff)" : "#374151",
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
    <div
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
      style={{ fontFamily: "var(--brand-font)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ background: "var(--brand-primary-light)" }}
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--brand-primary)", color: "var(--button-text, #fff)" }}
        >
          <FiHome size={16} />
        </span>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--heading-color)" }}>
            Enter Order Details
          </p>
          <p className="text-[11px]" style={{ color: "var(--body-color)", opacity: 0.7 }}>
            Cash on Delivery · Fast Shipping
          </p>
        </div>
      </div>

      {/* Body — always open */}
      <div>
        <div className="px-5 py-5 space-y-4">
          {/* Name */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs font-bold mb-1.5"
              style={{ color: "var(--heading-color)" }}
            >
              <FiUser size={12} style={{ color: "var(--brand-primary)" }} />
              Your Name
            </label>
            <input
              {...register("customer_name", { required: "Please enter your name" })}
              type="text"
              readOnly={!!userInfo?.data}
              defaultValue={userInfo?.data?.user_name}
              placeholder="Your full name"
              className="themed-input w-full px-3.5 py-3 text-sm rounded-xl border-2 outline-none transition-all placeholder:text-gray-400 bg-white read-only:bg-gray-50 read-only:text-gray-600"
            />
            {errors.customer_name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span>⚠</span> {errors.customer_name?.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              className="flex items-center gap-1.5 text-xs font-bold mb-1.5"
              style={{ color: "var(--heading-color)" }}
            >
              <FiPhone size={12} style={{ color: "var(--brand-primary)" }} />
              Mobile Number
            </label>
            {userInfo?.data?.user_phone ? (
              <input
                {...register("customer_phone", {
                  required: "Please enter your mobile number",
                  pattern: {
                    value: /^(?:\+88|88)?(01[3-9]\d{8})$/,
                    message: "Please enter a valid number",
                  },
                })}
                onChange={() => setUserPhoneLogin(true)}
                type="number"
                defaultValue={userInfo?.data?.user_phone}
                placeholder="01XXXXXXXXX"
                className="themed-input w-full px-3.5 py-3 text-sm rounded-xl border-2 outline-none transition-all"
              />
            ) : (
              <PhoneInput
                className="themed-phone custom-phone-input w-full text-sm rounded-xl border-2 border-gray-200 bg-white px-3.5 py-2.5"
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

          {/* District + Thana — stack on mobile (the "সিলেক্ট করুন" label wraps
              and breaks when squeezed into 2 narrow columns), 2-up on sm+. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="flex items-center gap-1.5 text-xs font-bold mb-1.5"
                style={{ color: "var(--heading-color)" }}
              >
                <FiMapPin size={12} style={{ color: "var(--brand-primary)" }} />
                District
              </label>
              <Select
                placeholder="Select"
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
                <label
                  className="flex items-center gap-1.5 text-xs font-bold mb-1.5"
                  style={{ color: "var(--heading-color)" }}
                >
                  <FiMapPin size={12} style={{ color: "var(--brand-primary)" }} />
                  Thana / Area
                </label>
                <Select
                  placeholder="Select"
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
            <label
              className="flex items-center gap-1.5 text-xs font-bold mb-1.5"
              style={{ color: "var(--heading-color)" }}
            >
              <FiHome size={12} style={{ color: "var(--brand-primary)" }} />
              Full Address
            </label>
            <input
              {...register("address", { required: "Please enter your address" })}
              type="text"
              defaultValue={userInfo?.data?.user_address}
              placeholder="House, road, area..."
              className="themed-input w-full px-3.5 py-3 text-sm rounded-xl border-2 outline-none transition-all placeholder:text-gray-400"
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
