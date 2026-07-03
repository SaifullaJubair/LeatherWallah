// Build a wa.me link from site_settings.watsapp + product/variant context.
// Phone format: digits only (BD numbers may be stored as +88017... or 017...).

const normalizePhone = (raw) => {
  if (!raw) return "";
  let p = String(raw).replace(/\D/g, "");
  if (p.startsWith("0")) p = "88" + p.slice(1);
  if (!p.startsWith("88")) p = "88" + p;
  return p;
};

export function buildWhatsAppLink({
  whatsappNumber,
  productName,
  variantName,
  price,
}) {
  const phone = normalizePhone(whatsappNumber);
  if (!phone) return null;
  const lines = ["I'd like to place an order:"];
  if (productName) lines.push(`Product: ${productName}`);
  if (variantName) lines.push(`Variant: ${variantName}`);
  if (price) lines.push(`Price: ৳${price}`);
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${phone}?text=${text}`;
}
