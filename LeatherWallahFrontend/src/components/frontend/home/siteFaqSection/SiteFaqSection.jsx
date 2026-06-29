"use client";

import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@/components/utils/baseURL";
import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { titleFont } from "@/utils/font";

const FaqItem = ({ faq }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800 pr-4">
          {faq.question}
        </span>
        {open ? (
          <FiChevronUp className="shrink-0 text-primary-500" />
        ) : (
          <FiChevronDown className="shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-white border-t border-gray-50">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
};

const SiteFaqSection = ({ settings }) => {
  const title = settings?.site_faq_section_title || "Frequently Asked Questions";

  const { data, isLoading } = useQuery({
    queryKey: ["site_faq_active"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/site-faq/active`);
      if (!res.ok) return { data: [] };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const faqs = data?.data ?? [];

  if (!isLoading && !faqs.length) return null;

  return (
    <div className="py-4 md:py-10">
      <div className="max-w-[98%] mx-auto">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-6 md:mb-10"
          style={{ fontFamily: titleFont.style.fontFamily }}
        >
          {title}
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq._id} faq={faq} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteFaqSection;
