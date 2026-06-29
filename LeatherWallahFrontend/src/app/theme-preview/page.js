"use client";
// Standalone theme preview — embedded in an <iframe> from the admin Theme form
// / preview page. Reads the palette + typography from query params, derives the
// full color set (mirrors the backend chroma logic), injects CSS vars, then
// renders a realistic FULL themed PDP using DUMMY data so admins see exactly how
// a complete product page looks with this theme BEFORE assigning it.
//
// IMPORTANT (see /edge-audit): this page is intentionally self-contained — NO
// Redux, NO auth, NO live network calls, NO analytics. It must never import the
// real <SingleProduct> / <ProductThemedSections> Reviews+Related (those use
// Redux + fetch and would crash / fire real calls inside this provider-less
// iframe). Instead it composes the PURE themed sections directly + renders
// dummy Reviews / Related itself.
//
// URL: /theme-preview?primary=%23E67E22&page_bg=%23FFF8F0&accent=%23F1C40F
//        &heading_font=hind-siliguri&heading_weight=700&button_radius=8px
//
// Phase 2 — optional `&slug=<product_slug>` makes the preview render a REAL
// product (fetched from the public /product/:slug endpoint, no auth) with the
// chosen theme from the query params. The product's OWN theme_id is ignored on
// purpose — the whole point is "how would THIS theme look on this product". On
// any fetch error / empty slug we fall back to the rich DUMMY product so the
// preview never breaks. Still NO Redux / cart / order / analytics.
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaStar, FaLock, FaHeart, FaCheck } from "react-icons/fa";
import { BsCart, BsCartCheckFill } from "react-icons/bs";
import { HiMinus, HiOutlinePlus } from "react-icons/hi";
import { BASE_URL } from "@/components/utils/baseURL";
import { variantAxisAttributes } from "@/utils/helper";
import ThemeStyleInjector from "@/components/frontend/themedProduct/theme/ThemeStyleInjector";
import VideoSection from "@/components/frontend/themedProduct/theme/sections/VideoSection";
import BenefitsUseCasesSection from "@/components/frontend/themedProduct/theme/sections/BenefitsUseCasesSection";
import NutritionSection from "@/components/frontend/themedProduct/theme/sections/NutritionSection";
import FaqSection from "@/components/frontend/themedProduct/theme/sections/FaqSection";
import OfferBanner from "@/components/frontend/themedProduct/theme/sections/OfferBanner";
import DescriptionCard from "@/components/frontend/themedProduct/theme/DescriptionCard";

// ── color derivation (mirrors admin ColorAutoPreview + backend chroma) ──
const clamp = (n, min = 0, max = 255) => Math.min(max, Math.max(min, n));
const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
};
const rgbToHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0")).join("");
const lighten = (hex, amt) => {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex({ r: c.r + (255 - c.r) * amt, g: c.g + (255 - c.g) * amt, b: c.b + (255 - c.b) * amt });
};
const darken = (hex, amt) => {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex({ r: c.r * (1 - amt), g: c.g * (1 - amt), b: c.b * (1 - amt) });
};
const mix = (a, b, t) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  return rgbToHex({ r: ca.r * (1 - t) + cb.r * t, g: ca.g * (1 - t) + cb.g * t, b: ca.b * (1 - t) + cb.b * t });
};

const buildTheme = (sp) => {
  const primary = sp.get("primary") || "#1B5E20";
  const page_bg = sp.get("page_bg") || "#F8F6F0";
  const accent = sp.get("accent") || "#E6B547";
  return {
    colors: {
      primary,
      page_bg,
      accent,
      primary_light: lighten(primary, 0.55),
      primary_dark: darken(primary, 0.35),
      heading_text: darken(primary, 0.55),
      body_text: darken(primary, 0.45),
      section_bg: mix(page_bg, primary, 0.08),
      button_text: "#FFFFFF",
    },
    typography: {
      heading_font: sp.get("heading_font") || sp.get("font") || "hind-siliguri",
      body_font: sp.get("body_font") || sp.get("font") || "hind-siliguri",
      heading_weight: sp.get("heading_weight") || "700",
    },
    button_style: { border_radius: sp.get("button_radius") || "8px" },
    floating_assets: [],
  };
};

const IMG =
  "https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=600&q=80";

// Realistic dummy product WITH weight variations + full page content so every
// themed section + the variation picker renders with content.
const DUMMY_PRODUCT = {
  product_name: "শুকনো আম (Sample Mango)",
  product_slug: "sample",
  main_image: IMG,
  main_video: "", // keep empty so VideoSection self-hides unless you want it
  product_sku: "FS-MANGO-SAMPLE",
  badge_text: "প্রিমিয়াম কোয়ালিটি",
  hero_corner_badge: "নতুন",
  short_description: "১০০% প্রাকৃতিক — চিনি ছাড়া, প্রিজারভেটিভ ছাড়া।",
  avarage_review_ratting: 4.7,
  total_review_ratting: 128,
  short_features: [
    { icon_key: "lu:Leaf", text: "No Sugar" },
    { icon_key: "lu:ShieldCheck", text: "No Preservative" },
    { icon_key: "lu:Wheat", text: "Rich in Fiber" },
    { icon_key: "fa:FaChild", text: "Kids Friendly" },
  ],
  process_steps: [
    { icon_key: "fa:FaHandHoldingHeart", text: "তাজা ফল বাছাই" },
    { icon_key: "fa:FaSun", text: "প্রাকৃতিকভাবে শুকানো" },
    { icon_key: "lu:Leaf", text: "পুষ্টিগুণ অক্ষুন্ন" },
    { icon_key: "fa:FaBoxOpen", text: "পরীক্ষিত ও প্যাকেটজাত" },
  ],
  benefits: [
    "রোগ প্রতিরোধ ক্ষমতা বাড়ায়",
    "হজমে সাহায্য করে",
    "ভিটামিনে ভরপুর",
    "তাৎক্ষণিক এনার্জি দেয়",
  ],
  use_cases: [
    { icon_key: "fa:FaBriefcase", text: "অফিস স্ন্যাকস" },
    { icon_key: "lu:GraduationCap", text: "স্কুল টিফিন" },
    { icon_key: "fa:FaDumbbell", text: "জিম-পরবর্তী" },
    { icon_key: "fa:FaPlane", text: "ভ্রমণসঙ্গী" },
  ],
  // Custom spec rows → DescriptionCard renders these as the spec table.
  description:
    "<p>আমাদের <strong>শুকনো আম</strong> ১০০% প্রাকৃতিক প্রক্রিয়ায় তৈরি — কোনো চিনি, রং বা প্রিজারভেটিভ ছাড়াই। প্রতিটি টুকরো রোদে শুকানো, পুষ্টিগুণে ভরপুর।</p>",
  custom_fields: [
    { label: "উৎপত্তি", value: "রাজশাহী, বাংলাদেশ", icon_key: "lu:MapPin" },
    { label: "ওজন", value: "২৫০g / ৫০০g / ১kg", icon_key: "lu:Weight" },
    { label: "শেলফ লাইফ", value: "৬ মাস", icon_key: "lu:Calendar" },
    { label: "উপাদান", value: "১০০% আম", icon_key: "lu:Leaf" },
  ],
  nutrition: {
    per_serving: "প্রতি ১০০g",
    rows: [
      { label: "ক্যালরি", value: "৩১০ kcal" },
      { label: "প্রোটিন", value: "৩.৫ g" },
      { label: "ফাইবার", value: "৭ g" },
      { label: "চিনি", value: "৬৫ g" },
    ],
    info_tiles: [
      { icon_key: "lu:Leaf", label: "উপাদান", value: "১০০% প্রাকৃতিক" },
      { icon_key: "lu:Calendar", label: "শেলফ লাইফ", value: "৬ মাস" },
    ],
  },
  faqs: [
    { question: "চিনি মেশানো আছে?", answer: "না, ১০০% প্রাকৃতিক।" },
    { question: "কতদিন সংরক্ষণ করা যায়?", answer: "৬ মাস পর্যন্ত।" },
    { question: "ডেলিভারি কত দিনে?", answer: "ঢাকায় ১-২ দিন, ঢাকার বাইরে ৩-৪ দিন।" },
  ],
};

// Weight variations for the interactive picker (price changes on click).
const DUMMY_VARIATIONS = [
  { label: "২৫০ গ্রাম", price: 380, mrp: 450 },
  { label: "৫০০ গ্রাম", price: 720, mrp: 850 },
  { label: "১ কেজি", price: 1350, mrp: 1600 },
];

const DUMMY_TRUST = [
  { icon_key: "lu:Leaf", title: "১০০% প্রাকৃতিক", subtitle: "কৃত্রিম কিছু নয়" },
  { icon_key: "lu:ShieldCheck", title: "নিরাপদ", subtitle: "প্রিজারভেটিভ মুক্ত" },
  { icon_key: "fa:FaTruckFast", title: "দ্রুত ডেলিভারি", subtitle: "সারাদেশে" },
];

const DUMMY_REVIEWS = [
  { name: "রিয়াদ হাসান", rating: 5, text: "অসাধারণ স্বাদ! একদম তাজা আর প্রাকৃতিক। আবার অর্ডার করবো।" },
  { name: "নুসরাত জাহান", rating: 5, text: "বাচ্চারা খুব পছন্দ করেছে। চিনি ছাড়া হওয়ায় নিশ্চিন্তে দিতে পারি।" },
  { name: "তানভীর আহমেদ", rating: 4, text: "মান ভালো, দ্রুত ডেলিভারি পেয়েছি। প্যাকেজিংও সুন্দর।" },
];

const DUMMY_RELATED = [
  { name: "শুকনো আনারস", price: 420, img: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=300&q=80" },
  { name: "মিক্সড ড্রাই ফ্রুট", price: 650, img: "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=300&q=80" },
  { name: "খেজুর প্রিমিয়াম", price: 540, img: "https://images.unsplash.com/photo-1593904308074-e1a3f1f0a673?w=300&q=80" },
  { name: "কাজু বাদাম", price: 890, img: "https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=300&q=80" },
];

// ── Phase 2: real-product adapters (pure, no Redux) ──────────────────────────
// Fetch a real product by slug for the preview. Returns null on any failure so
// the caller falls back to the dummy product.
const useRealProduct = (slug) => {
  const [state, setState] = useState({ product: null, loading: !!slug, error: false });
  useEffect(() => {
    if (!slug) {
      setState({ product: null, loading: false, error: false });
      return;
    }
    let alive = true;
    setState({ product: null, loading: true, error: false });
    fetch(`${BASE_URL}/product/${slug}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const p = d?.data;
        if (p && !d?.redirect_slug) setState({ product: p, loading: false, error: false });
        else setState({ product: null, loading: false, error: true });
      })
      .catch(() => alive && setState({ product: null, loading: false, error: true }));
    return () => { alive = false; };
  }, [slug]);
  return state;
};

// Build the hero weight/variation picker rows from a REAL product. Single-axis
// (e.g. weight) is the common case; for multi-axis we just show the first axis
// so the preview stays simple. Each row carries the matching variation's price.
const buildRealVariationRows = (product) => {
  if (!product?.is_variation) return null;
  const axes = variantAxisAttributes(product);
  const axis = axes?.[0];
  if (!axis?.attribute_values?.length) return null;
  return axis.attribute_values.map((val) => {
    // Find a variation whose combination includes this value id.
    const match = (product.variations || []).find(
      (v) => v?.is_active !== false && (v?.combination || []).some((id) => String(id) === String(val._id)),
    );
    const price = match?.variation_discount_price || match?.variation_price || 0;
    const mrp = match?.variation_discount_price ? match?.variation_price : 0;
    return { label: val.attribute_value_name, price, mrp };
  }).filter((r) => r.price > 0);
};

const SectionHeading = ({ children }) => (
  <div className="flex items-center gap-2 mb-5">
    <span className="w-1.5 h-6 rounded-full" style={{ background: "var(--brand-primary)" }} />
    <h2
      className="text-lg md:text-xl font-bold"
      style={{ color: "var(--heading-color)", fontWeight: "var(--brand-heading-weight, 700)" }}
    >
      {children}
    </h2>
  </div>
);

function PreviewBody() {
  const sp = useSearchParams();
  const theme = useMemo(() => buildTheme(sp), [sp]);

  // Phase 2 — optional real product by slug. Falls back to dummy on miss/error.
  const slug = sp.get("slug") || "";
  const { product: realProduct, loading: realLoading } = useRealProduct(slug);

  // The product the preview renders: real when available, else the rich dummy.
  const view = realProduct || DUMMY_PRODUCT;
  const isReal = !!realProduct;

  // Variation rows for the hero picker. Real product → derive from its first
  // axis; non-variation real product → single row at its base price; dummy →
  // the hardcoded weight set.
  const variationRows = useMemo(() => {
    if (isReal) {
      const rows = buildRealVariationRows(realProduct);
      if (rows && rows.length) return rows;
      // Non-variation (or unparsable) real product — one row at base price.
      const base = realProduct?.product_discount_price || realProduct?.product_price || 0;
      const mrp = realProduct?.product_discount_price ? realProduct?.product_price : 0;
      return [{ label: "Default", price: base, mrp }];
    }
    return DUMMY_VARIATIONS;
  }, [isReal, realProduct]);

  // Interactive picker — price preview only (no cart / order / url).
  const [variIdx, setVariIdx] = useState(0);
  const [qty, setQty] = useState(1);
  // Reset selection when the variation set changes (real product loads).
  useEffect(() => { setVariIdx(0); setQty(1); }, [variationRows]);

  const vari = variationRows[Math.min(variIdx, variationRows.length - 1)] || { price: 0, mrp: 0 };
  const price = vari.price;
  const mrp = vari.mrp;
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const total = price * qty;

  const rating = Number(view?.avarage_review_ratting || 0).toFixed(1);

  // Hero display fields (real or dummy).
  const heroName = view?.product_name || "";
  const heroNameMatch = heroName.match(/^(.*?)\s*\((.+)\)\s*$/);
  const heroImg = view?.main_image || IMG;
  const showVariPicker = variationRows.length > 1;

  if (realLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--page-bg,#fff)" }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "var(--brand-primary,#1B5E20)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div
      data-themed-pdp
      className="relative overflow-hidden"
      style={{ background: "var(--page-bg, #fff)", minHeight: "100vh", fontFamily: "var(--brand-font)" }}
    >
      <ThemeStyleInjector theme={theme} />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ════════ HERO ════════ */}
        <section className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8 items-center">
          {/* left — text */}
          <div className="space-y-4 order-2 md:order-1">
            {view?.badge_text && (
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
              >
                {view.badge_text}
              </span>
            )}
            <h1
              className="text-3xl md:text-4xl font-black leading-tight"
              style={{ color: "var(--heading-color)", fontWeight: "var(--brand-heading-weight,700)" }}
            >
              {heroNameMatch ? (
                <>
                  {heroNameMatch[1]}
                  <span className="block text-lg md:text-xl font-semibold opacity-70 mt-1">
                    {heroNameMatch[2]}
                  </span>
                </>
              ) : (
                heroName
              )}
            </h1>
            {view?.short_description && (
              <p style={{ color: "var(--body-color)" }}>{view.short_description}</p>
            )}

            {/* short features */}
            {(view?.short_features || []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {view.short_features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand-primary)" }} />
                    <span className="text-xs" style={{ color: "var(--body-color)" }}>{f.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* price */}
            <div className="flex items-baseline gap-3 flex-wrap pt-2">
              <span className="text-3xl md:text-4xl font-black" style={{ color: "var(--brand-primary)" }}>
                ৳{price}
              </span>
              {mrp > price && <span className="text-lg line-through text-gray-400">৳{mrp}</span>}
              {discountPct > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary-dark)" }}
                >
                  {discountPct}% ছাড়
                </span>
              )}
            </div>

            {/* rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FaStar
                    key={i}
                    size={15}
                    className={i <= Math.round(rating) ? "" : "text-gray-200"}
                    style={i <= Math.round(rating) ? { color: "var(--accent-color)" } : {}}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--body-color)" }}>{rating}</span>
              <span className="text-sm text-gray-400">({view?.total_review_ratting || 0}+ রিভিউ)</span>
            </div>

            {(view?.product_sku || isReal) && view?.product_sku && (
              <p className="text-xs text-gray-400">
                SKU: <code className="font-mono text-gray-500">{view.product_sku}</code>
              </p>
            )}
          </div>

          {/* right — image */}
          <div className="order-1 md:order-2 relative">
            {view?.hero_corner_badge && (
              <span
                className="absolute top-3 left-3 z-10 text-xs font-bold px-3 py-1.5 rounded-full shadow-md"
                style={{ background: "var(--brand-primary)", color: "var(--button-text,#fff)" }}
              >
                {view.hero_corner_badge}
              </span>
            )}
            <img
              src={heroImg}
              alt=""
              className="w-full aspect-square object-cover rounded-2xl shadow-sm"
              style={{ background: "var(--section-bg)" }}
            />
          </div>
        </section>

        {/* ════════ ORDER SECTION (mockup — no real submit) ════════ */}
        <section className="max-w-6xl mx-auto px-4 mb-10">
          <div className="rounded-2xl p-5 md:p-7" style={{ background: "var(--section-bg,#fff)" }}>
            <h2 className="text-xl md:text-2xl font-bold mb-5" style={{ color: "var(--heading-color)" }}>
              অর্ডার করুন এখনই
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* left: variation picker + qty */}
              <div className="space-y-5">
                {showVariPicker && (
                <div>
                  <p className="text-sm font-semibold mb-2" style={{ color: "var(--body-color)" }}>
                    নির্বাচন করুন
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variationRows.map((v, i) => {
                      const active = i === variIdx;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setVariIdx(i); setQty(1); }}
                          className="px-4 py-2 text-sm font-semibold border-2 transition-all"
                          style={{
                            borderRadius: "var(--button-radius,8px)",
                            borderColor: active ? "var(--brand-primary)" : "#e5e7eb",
                            background: active ? "var(--brand-primary)" : "#fff",
                            color: active ? "var(--button-text,#fff)" : "var(--body-color)",
                          }}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* stock */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700">স্টকে আছে</span>
                </div>

                {/* qty + total */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--body-color)" }}>পরিমাণ:</span>
                    <div
                      className="flex items-center overflow-hidden border-2"
                      style={{ borderRadius: "var(--button-radius,8px)", borderColor: "var(--brand-primary-light)" }}
                    >
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2" style={{ color: "var(--brand-primary)" }}>
                        <HiMinus size={14} />
                      </button>
                      <input readOnly value={qty} className="w-12 text-center py-2 text-sm font-bold bg-transparent outline-none" style={{ color: "var(--heading-color)" }} />
                      <button type="button" onClick={() => setQty((q) => q + 1)} className="px-3 py-2" style={{ color: "var(--brand-primary)" }}>
                        <HiOutlinePlus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: "var(--body-color)" }}>মোট:</span>
                    <span className="text-2xl font-black" style={{ color: "var(--brand-primary)" }}>৳{total}</span>
                  </div>
                </div>

                {/* cart + wishlist (visual only) */}
                <div className="flex items-center gap-2">
                  <button type="button" className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold border-2"
                    style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)", borderRadius: "var(--button-radius,8px)" }}>
                    <BsCart size={16} /> কার্টে যোগ করুন
                  </button>
                  <button type="button" className="p-3 border-2" style={{ borderRadius: "var(--button-radius,8px)", borderColor: "#e5e7eb", color: "#9ca3af" }}>
                    <FaHeart size={15} />
                  </button>
                </div>

                <button type="button"
                  className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold"
                  style={{ background: "var(--brand-primary)", color: "var(--button-text,#fff)", borderRadius: "var(--button-radius,8px)" }}>
                  অর্ডার কনফার্ম করুন <FaLock size={13} />
                </button>
                <p className="text-center text-[11px]" style={{ color: "var(--body-color)", opacity: 0.6 }}>
                  আপনার তথ্য ১০০% নিরাপদ এবং গোপনীয়
                </p>
              </div>

              {/* right: delivery form mock */}
              <div className="space-y-3">
                {["আপনার নাম", "মোবাইল নম্বর", "সম্পূর্ণ ঠিকানা"].map((ph, i) => (
                  <input key={i} disabled placeholder={ph}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white/70"
                    style={{ borderColor: "var(--brand-primary-light)", color: "var(--body-color)" }} />
                ))}
                <select disabled className="w-full px-3 py-2.5 text-sm rounded-lg border bg-white/70" style={{ borderColor: "var(--brand-primary-light)" }}>
                  <option>আপনার এলাকা নির্বাচন করুন</option>
                </select>
                <div className="rounded-xl p-4 space-y-2 text-sm bg-white" style={{ color: "var(--body-color)" }}>
                  <div className="flex justify-between"><span>সাবটোটাল</span><span>৳{total}</span></div>
                  <div className="flex justify-between"><span>ডেলিভারি চার্জ</span><span>৳60</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-dashed" style={{ borderColor: "var(--brand-primary-light)" }}>
                    <span className="font-bold" style={{ color: "var(--heading-color)" }}>সর্বমোট</span>
                    <span className="text-xl font-black" style={{ color: "var(--brand-primary)" }}>৳{total + 60}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════ PURE THEMED SECTIONS (no fetch / no redux) ════════ */}
        <VideoSection product={view} theme={theme} />

        <div className="max-w-6xl mx-auto px-4 mt-8">
          <DescriptionCard html={view?.description} customFields={view?.custom_fields} />
        </div>

        <BenefitsUseCasesSection product={view} theme={theme} />
        <NutritionSection product={view} theme={theme} trustPoints={DUMMY_TRUST} />

        {/* ════════ DUMMY REVIEWS (real ReviewsSection does live fetch) ════════ */}
        <section className="py-10 md:py-14" style={{ background: "var(--page-bg)" }}>
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeading>ক্রেতাদের রিভিউ</SectionHeading>
            <div className="grid sm:grid-cols-3 gap-4">
              {DUMMY_REVIEWS.map((r, i) => (
                <div key={i} className="rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar key={s} size={13} className={s <= r.rating ? "" : "text-gray-200"}
                        style={s <= r.rating ? { color: "var(--accent-color)" } : {}} />
                    ))}
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--body-color)" }}>{r.text}</p>
                  <p className="text-xs font-semibold" style={{ color: "var(--heading-color)" }}>— {r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ DUMMY RELATED (real RelatedProductsThemed does live fetch) ════════ */}
        <section className="py-10 md:py-14" style={{ background: "var(--section-bg)" }}>
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeading>সম্পর্কিত পণ্য</SectionHeading>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DUMMY_RELATED.map((p, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm">
                  <img src={p.img} alt="" className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--heading-color)" }}>{p.name}</p>
                    <p className="text-sm font-black mt-1" style={{ color: "var(--brand-primary)" }}>৳{p.price}</p>
                    <button type="button" className="mt-2 w-full py-1.5 text-xs font-bold text-white"
                      style={{ background: "var(--brand-primary)", borderRadius: "var(--button-radius,8px)" }}>
                      কার্টে যোগ করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FaqSection product={view} theme={theme} />
        <OfferBanner
          product={view}
          setting={{ offer_enabled: true, offer_text: "২ টি কিনলে ১ টি ফ্রি", offer_end_at: new Date(Date.now() + 2 * 86400000).toISOString() }}
        />
      </div>
    </div>
  );
}

export default function ThemePreviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading preview…</div>}>
      <PreviewBody />
    </Suspense>
  );
}
