"use client";
// Themed "এগুলোও পছন্দ হতে পারে" — clean 4-up grid (no swiper, no video).
// Brand-new file so Turbopack emits a fresh chunk (the old RelatedProducts
// chunk was being served stale). Hides itself (and its heading) when empty.
import Link from "next/link";
import Image from "next/image";
import useGetRelatedProducts from "@/components/lib/getRelatedProduct";
import { lineThroughPrice, productPrice } from "@/utils/helper";
import useGetSettingData from "@/components/lib/getSettingData";

export default function RelatedProductsThemed({ product_slug }) {
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data?.[0]?.currency_symbol || "৳";
  const { data: relatedProduct, isLoading } = useGetRelatedProducts({
    product_slug,
  });

  if (isLoading) return null;
  // exclude the current product itself, then take 4
  const items = (relatedProduct?.data || [])
    .filter((p) => p?.product_slug !== product_slug)
    .slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="py-10 md:py-14" style={{ background: "var(--section-bg)" }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <span
            className="w-1.5 h-7 rounded-full"
            style={{ background: "var(--brand-primary)" }}
          />
          <h2
            className="text-xl md:text-2xl font-bold"
            style={{
              color: "var(--heading-color)",
              fontWeight: "var(--brand-heading-weight, 700)",
            }}
          >
            এগুলোও পছন্দ হতে পারে
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {items.map((p, i) => {
            const price = productPrice(p);
            const lt = lineThroughPrice(p);
            const off =
              lt && price ? Math.round(((lt - price) / lt) * 100) : 0;
            return (
              <Link
                key={p?._id || i}
                href={`/products/${p?.product_slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all block"
              >
                <div className="relative w-full aspect-square overflow-hidden bg-gray-50">
                  {off > 0 && (
                    <span
                      className="absolute top-2 left-2 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ background: "var(--brand-primary)" }}
                    >
                      -{off}%
                    </span>
                  )}
                  <Image
                    fill
                    src={p?.main_image || "/assets/images/placeholder.jpg"}
                    alt={p?.product_name || "Product"}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p
                    className="text-xs md:text-sm font-medium line-clamp-2 leading-snug mb-1.5"
                    style={{ color: "var(--heading-color)" }}
                  >
                    {p?.product_name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--brand-primary)" }}
                    >
                      {currencySymbol}
                      {price}
                    </span>
                    {lt && (
                      <span className="text-[11px] line-through text-gray-400">
                        {currencySymbol}
                        {lt}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
