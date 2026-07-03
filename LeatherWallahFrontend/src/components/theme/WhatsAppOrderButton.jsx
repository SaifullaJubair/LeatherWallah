"use client";
import { FaWhatsapp } from "react-icons/fa";
import { buildWhatsAppLink } from "@/lib/theme/whatsappLink";

export default function WhatsAppOrderButton({
  whatsappNumber,
  productName,
  variantName,
  price,
  className = "",
}) {
  const href = buildWhatsAppLink({
    whatsappNumber,
    productName,
    variantName,
    price,
  });
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium border-2 transition-all hover:scale-[1.02] ${className}`}
      style={{
        borderColor: "#25D366",
        color: "#25D366",
        borderRadius: "var(--button-radius, 8px)",
        background: "white",
      }}
    >
      <FaWhatsapp size={18} /> Order on WhatsApp
    </a>
  );
}
