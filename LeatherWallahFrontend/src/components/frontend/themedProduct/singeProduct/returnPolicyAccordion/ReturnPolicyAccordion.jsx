"use client";
import { useState } from "react";
import { FiChevronDown, FiRotateCcw } from "react-icons/fi";
import useGetSettingData from "@/components/lib/getSettingData";
import CustomLoader from "@/components/shared/loader/CustomLoader";

const ReturnPolicyAccordion = () => {
  const { data: settingsData, isLoading } = useGetSettingData();
  const footerData = settingsData?.data[0];
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
            <FiRotateCcw size={13} />
          </div>
          <span
            className={`text-sm font-semibold transition-colors ${open ? "text-primary" : "text-gray-700"}`}
          >
            Return & Refund Policy
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
        className={`overflow-hidden transition-all duration-400 ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-5 pb-5">
          {isLoading ? (
            <CustomLoader />
          ) : (
            <div
              className="prose prose-sm max-w-none text-gray-600 leading-relaxed prose-headings:text-gray-800"
              dangerouslySetInnerHTML={{ __html: footerData?.return_policy }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicyAccordion;
