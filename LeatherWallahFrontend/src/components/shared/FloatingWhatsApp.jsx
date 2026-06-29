"use client";
// C13 HIGH — floating WhatsApp chat button. Must be "use client" so it reads
// enable_whatsapp_chat / whatsapp_number from the 60s-cached client hook
// rather than the 600s SSR revalidate window.
import useGetSettingData from "@/components/lib/getSettingData";
import { FaWhatsapp } from "react-icons/fa";

const FloatingWhatsApp = () => {
  const { data: settingData } = useGetSettingData();
  const setting = settingData?.data?.[0];

  if (!setting?.enable_whatsapp_chat) return null;
  const number = setting?.whatsapp_number;
  if (!number) return null;

  const cleanNumber = String(number).replace(/\D/g, "");
  const href = `https://wa.me/${cleanNumber}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
    >
      <FaWhatsapp size={26} className="text-white" />
    </a>
  );
};

export default FloatingWhatsApp;
