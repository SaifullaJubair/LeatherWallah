"use client";

// Tiny client component that asks "is this product also part of an active
// bundle offer?" — if yes, surface it so a customer buying one unit can hop
// to the offer page and save by buying the set. Self-hides when there's
// nothing to show.
//
// Endpoint: GET /api/v1/offer/by-product/:product_id → array of
// { _id, offer_title, offer_image, offer_end_date, product_count,
//   offer_discount_price, offer_discount_type }
//
// We mount this in ProductThemedSections between Use Cases and Nutrition.
// One product can be in multiple offers — we show all of them stacked
// (rare in practice, but no truncation).

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BASE_URL } from "@/components/utils/baseURL";

const discountLabel = (price, type) => {
  if (!price) return null;
  if (type === "percent") return `${price}% off`;
  if (type === "fixed") return `৳${price} off`;
  return null;
};

export default function OfferDiscoveryBanner({ productId }) {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    fetch(`${BASE_URL}/offer/by-product/${productId}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => {
        if (!cancelled) setOffers(Array.isArray(j?.data) ? j.data : []);
      })
      .catch(() => {
        // Quiet fail — banner is non-critical.
        if (!cancelled) setOffers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!offers.length) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-3">
      {offers.map((o) => {
        const label = discountLabel(o.offer_discount_price, o.offer_discount_type);
        return (
          <Link
            key={o._id}
            href={`/offer/${o._id}`}
            className="block group"
          >
            <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition hover:border-amber-300 hover:shadow-md">
              {o.offer_image ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image
                    src={o.offer_image}
                    alt={o.offer_title || ""}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-lg bg-amber-100" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Bundle Offer
                  </span>
                  {label && (
                    <span className="text-xs font-semibold text-amber-700">
                      {label}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-amber-900">
                  {o.offer_title}
                </p>
                <p className="text-xs text-amber-700">
                  This product is part of a {o.product_count}-item bundle — save more when you buy together.
                </p>
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-amber-700 group-hover:underline">
                View Bundle →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
