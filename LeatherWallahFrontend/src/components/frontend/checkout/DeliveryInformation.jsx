import { cities } from "@/data/cites";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import Select from "react-select";
import { FaMapMarkedAlt, FaStar } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import "react-phone-number-input/style.css";

// Brand-matched react-select styling so City/Zone dropdowns line up with the
// text inputs (same height, radius, burgundy focus). menuPortal z-index kept
// at 999 exactly as before so the menu still renders above the sticky column.
const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 999 }),
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 12,
    fontSize: 15,
    backgroundColor: state.isFocused ? "#ffffff" : "rgba(240,233,232,0.2)",
    borderColor: state.isFocused ? "#6B1A1F" : "#EAC9CB",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(107,26,31,0.10)" : "none",
    "&:hover": { borderColor: state.isFocused ? "#6B1A1F" : "#D89A9D" },
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: 15 }),
  option: (base, state) => ({
    ...base,
    fontSize: 14,
    backgroundColor: state.isSelected
      ? "#6B1A1F"
      : state.isFocused
        ? "rgba(107,26,31,0.06)"
        : "#fff",
    color: state.isSelected ? "#fff" : "#3E2723",
  }),
};

const DeliveryInformation = ({
  register,
  userInfo,
  errors,
  districtsData,
  setUserPhoneLogin,
  customer_phone,
  setUserPhone,
  setDivision,
  setDistrictId,
  setDivisionID,
  division,
  district,
  setDistrict,
  setIsOpenDistrict,
  isOpenDistrict,
  refetchZone,
  zoneLoading,
  zoneData,
  // S6 (2026-06-04) — saved-addresses picker. Both props are optional;
  // anonymous (FB-ads) checkout flows never receive them.
  savedAddresses = [],
  onPickSavedAddress,
  // C13 — toggle from Admin → Storefront Behaviour settings.
  showEmailField = true,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-secondary-100/70 shadow-[0_1px_3px_rgba(62,39,35,0.06)] overflow-hidden">
      {/* Header — numbered step 2 with gold accent rail */}
      <div className="relative px-5 py-4 border-b border-secondary-100/60 bg-gradient-to-r from-secondary-50/50 to-transparent flex items-center justify-between">
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-accent-700 to-accent-800" />
        <div className="flex items-center gap-2.5">
          <FiMapPin size={15} className="text-primary shrink-0" />
          <h2 className="text-[15px] font-serif font-semibold text-secondary tracking-tight flex items-center gap-2">
            Delivery Details
          </h2>
        </div>
        {savedAddresses?.length > 0 && (
          <span className="text-[10px] text-gray-400 hidden sm:block">
            Pick a saved address
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">

      {/* S6 — Saved address picker */}
      {savedAddresses?.length > 0 && (
        <div className="border border-gray-100 rounded-lg p-2.5 mb-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
            <FaMapMarkedAlt size={12} className="text-primary" />
            Saved addresses
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {savedAddresses.map((addr) => (
              <button
                key={addr._id}
                type="button"
                onClick={() => onPickSavedAddress?.(addr)}
                className={`shrink-0 text-left text-xs px-3 py-2 rounded-lg border transition min-w-[180px] max-w-[220px] bg-white hover:border-primary ${
                  addr.is_default
                    ? "border-primary"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="font-semibold text-gray-800 truncate">
                    {addr.label || addr.recipient_name || "Address"}
                  </span>
                  {addr.is_default && (
                    <FaStar size={9} className="text-primary shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2">
                  {addr.address_line}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3.5">

        <div>
          <label htmlFor="customer_name" className="block text-xs font-semibold text-secondary/80 mb-1.5 uppercase tracking-wide">
            Name <span className="text-primary">*</span>
          </label>

          <input
            id="customer_name"
            {...register("customer_name", { required: "Name is required" })}
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            className="w-full border border-secondary-100 rounded-xl px-3.5 py-2.5 text-[15px] outline-none bg-secondary-50/20 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
          />
          {errors.customer_name && (
            <p className="text-red-600 text-xs mt-1 ml-0.5" role="alert">
              {errors.customer_name?.message}
            </p>
          )}
        </div>
        <div className="">
          <label htmlFor="customer_phone" className="block text-xs font-semibold text-secondary/80 mb-1.5 uppercase tracking-wide">
            Phone Number <span className="text-primary">*</span>
          </label>

          {userInfo?.data?.user_phone ? (
            <div>
              <input
                id="customer_phone"
                {...register("customer_phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^(?:\+88|88)?(01[3-9]\d{8})$/,
                    message: "Invalid Bangladeshi phone number",
                  },
                })}
                onChange={() => setUserPhoneLogin(true)}
                type="tel"
                autoComplete="tel"
                defaultValue={userInfo?.data?.user_phone}
                placeholder="01XXXXXXXXX"
                className="w-full border border-secondary-100 rounded-xl px-3.5 py-2.5 text-[15px] outline-none bg-secondary-50/20 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
              />
              {errors.customer_phone && (
                <p className="text-red-600 text-xs mt-1 ml-0.5" role="alert">
                  {errors.customer_phone?.message}
                </p>
              )}
            </div>
          ) : (
            <PhoneInput
              className="custom-phone-input w-full border border-secondary-100 rounded-xl bg-secondary-50/20 px-3.5 py-2.5 text-[15px] text-black placeholder:text-gray-400 focus-within:bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all"
              placeholder="01XXXXXXXXX"
              id="customer_phone"
              value={customer_phone}
              defaultCountry="BD"
              international
              countryCallingCodeEditable={false}
              countries={["BD"]}
              onChange={setUserPhone}
              error={
                customer_phone
                  ? !isValidPhoneNumber(customer_phone) &&
                    "Invalid phone number"
                  : "Phone number required"
              }
            />
          )}
        </div>

        {/* City + Zone side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-secondary/80 mb-1.5 uppercase tracking-wide">
              City <span className="text-primary">*</span>
            </label>
            <Select
              id="city"
              name="city"
              placeholder="Select city"
              options={cities}
              value={division ? { city_name: division } : null}
              getOptionLabel={(x) => x?.city_name}
              getOptionValue={(x) => x?.city_id}
              onChange={(selectedOption) => {
                refetchZone();
                setIsOpenDistrict(false);
                setDistrict();
                setDistrictId();
                setDivisionID(selectedOption?.city_id);
                setDivision(selectedOption?.city_name);
                setTimeout(() => setIsOpenDistrict(true), 100);
              }}
              menuPortalTarget={document.body}
              styles={selectStyles}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-secondary/80 mb-1.5 uppercase tracking-wide">
              Zone <span className="text-primary">*</span>
            </label>
            <Select
              id="Zone"
              name="Zone"
              placeholder="Select zone"
              options={zoneData?.data}
              value={district ? { zone_name: district } : null}
              isDisabled={!isOpenDistrict && !zoneLoading}
              isLoading={zoneLoading}
              getOptionLabel={(x) => x?.zone_name}
              getOptionValue={(x) => x?.zone_id}
              onChange={(selectedOption) => {
                setDistrict(selectedOption?.zone_name);
                setDistrictId(selectedOption?.zone_id);
              }}
              menuPortalTarget={document.body}
              styles={selectStyles}
            />
          </div>
        </div>
        <div className="">
          <label
            htmlFor="address"
            className="block text-xs font-semibold text-secondary/80 mb-1.5 uppercase tracking-wide"
          >
            Address <span className="text-primary">*</span>
          </label>

          <input
            id="address"
            {...register("address", {
              required: "Fill the address",
            })}
            type="text"
            autoComplete="street-address"
            placeholder="House, road, area…"
            className="w-full border border-secondary-100 rounded-xl px-3.5 py-2.5 text-[15px] outline-none bg-secondary-50/20 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
          />
          {errors.address && (
            <p className="text-red-600 text-xs mt-1 ml-0.5" role="alert">
              {errors.address?.message}
            </p>
          )}
        </div>

        {showEmailField && (
          <div className="">
            <label
              htmlFor="customer_email"
              className="block text-xs font-semibold text-secondary/80 mb-1.5 uppercase tracking-wide"
            >
              Email <span className="text-gray-400 normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <input
              id="customer_email"
              {...register("customer_email")}
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              className="w-full border border-secondary-100 rounded-xl px-3.5 py-2.5 text-[15px] outline-none bg-secondary-50/20 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-400"
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default DeliveryInformation;
