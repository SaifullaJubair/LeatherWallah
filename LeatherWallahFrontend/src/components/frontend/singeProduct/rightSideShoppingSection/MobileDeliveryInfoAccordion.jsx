// MobileDeliveryInfoAccordion.jsx
"use client";
import { useState } from "react";
import { FiChevronDown, FiTruck } from "react-icons/fi";
import { MdAttachMoney, MdOutlineLocalShipping } from "react-icons/md";
import { TbTruckReturn } from "react-icons/tb";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { GoShieldSlash } from "react-icons/go";

const InfoBadge = ({ icon, title, subtitle, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${colors[color]}`}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-semibold">{title}</p>
        {subtitle && (
          <p className="text-[10px] opacity-70 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

const AccordionWrapper = ({ title, icon, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors group"
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
        className={`overflow-hidden transition-all duration-400 ${open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
};

const MobileDeliveryInfoAccordion = ({ product, settingData }) => {
  const minDays = Math.min(
    settingData?.data[0]?.outside_dhaka_shipping_days || 0,
    settingData?.data[0]?.inside_dhaka_shipping_days || 0,
  );
  const maxDays = Math.max(
    settingData?.data[0]?.outside_dhaka_shipping_days || 0,
    settingData?.data[0]?.inside_dhaka_shipping_days || 0,
  );

  return (
    <AccordionWrapper title="Shipping & Delivery" icon={<FiTruck size={13} />}>
      <div className="grid grid-cols-2 gap-2">
        <InfoBadge
          icon={<MdOutlineLocalShipping size={16} />}
          title="Standard Delivery"
          subtitle={`${minDays}–${maxDays} business days`}
          color="blue"
        />
        <InfoBadge
          icon={<MdAttachMoney size={16} />}
          title="Cash on Delivery"
          subtitle="Pay when you receive"
          color="green"
        />
        <InfoBadge
          icon={<TbTruckReturn size={16} />}
          title={
            product?.product_return
              ? `${product?.product_return} Days Return`
              : "Return Not Available"
          }
          color="amber"
        />
        {product?.product_warrenty ? (
          <InfoBadge
            icon={<IoShieldCheckmarkOutline size={16} />}
            title={`${product?.product_warrenty} Warranty`}
            color="purple"
          />
        ) : (
          <InfoBadge
            icon={<GoShieldSlash size={16} />}
            title="No Warranty"
            color="amber"
          />
        )}
      </div>
    </AccordionWrapper>
  );
};

export default MobileDeliveryInfoAccordion;
