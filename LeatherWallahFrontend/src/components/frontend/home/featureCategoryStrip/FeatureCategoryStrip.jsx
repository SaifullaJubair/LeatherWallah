"use client";

// Home "Featured Collections" — editorial-split layout: a lede block on the
// left (kicker + serif heading + blurb + View-all) and the collection cards on
// the right. Client component so it can slot into the client SectionRenderer.
//
// Count-aware, never breaks:
//   1–3 collections → static grid on the right (columns track the count)
//   4+  collections → smooth Swiper slider on the right (autoplay + arrows)
// The left lede keeps the section balanced even with only one or two cards.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiArrowRight } from "react-icons/fi";
import { getMenu } from "@/components/lib/getMenu";
import useGetSettingData from "@/components/lib/getSettingData";
import { titleFont } from "@/utils/font";

// Hard ceiling for the home featured strip, regardless of the admin limit.
const FEATURE_CAP = 6;
// Above this many cards we switch from static grid to a slider.
const SLIDER_THRESHOLD = 3;

// One collection card — shared by the grid and the slider so both match.
const CategoryCard = ({ category }) => (
  <Link
    href={`/category/${category?.category_slug}`}
    className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-[0_1px_3px_rgba(16,12,10,0.08)] hover:shadow-[0_10px_30px_rgba(107,26,31,0.22)] transition-shadow duration-300"
  >
    {category?.category_logo && (
      <Image
        src={category.category_logo}
        alt={category?.category_name || "Category"}
        fill
        className="object-cover opacity-95 group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    )}
    {/* Bottom gradient so the label stays readable */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 p-5">
      <p className="text-white/55 text-[10px] uppercase tracking-[0.18em] font-semibold mb-1.5">
        Collection
      </p>
      <h3
        className="text-white font-bold text-lg sm:text-xl leading-tight mb-3"
        style={{ fontFamily: titleFont.style.fontFamily }}
      >
        {category?.category_name}
      </h3>
      <span className="inline-flex items-center gap-1.5 text-[11px] text-white font-semibold bg-white/16 group-hover:bg-accent group-hover:text-primary-900 group-hover:border-accent px-3.5 py-1.5 rounded-full transition-colors border border-white/25 backdrop-blur-sm">
        Shop Now <FiArrowRight size={11} />
      </span>
    </div>
  </Link>
);

const FeatureCategoryStrip = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: settingsData } = useGetSettingData();
  // Admin-configurable limit (Site Settings → Home Layout), hard-capped at 6.
  const limit = settingsData?.data?.[0]?.feature_categories_limit ?? FEATURE_CAP;

  useEffect(() => {
    let alive = true;
    getMenu()
      .then((menu) => {
        if (!alive) return;
        const feature = (menu?.data || []).filter(
          (item) => item?.category?.feature_category_show === true,
        );
        setCats(feature);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    // Soft neutral skeleton (not the deep-burgundy band) so the loading flash
    // is easy on the eyes; same width as the loaded band + the hero banner.
    return (
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] py-12 md:py-16 mx-auto bg-secondary-50/40">
          <div className="max-w-[92%] xl:max-w-6xl mx-auto px-2">
            <div className="grid lg:grid-cols-[0.85fr_2fr] gap-8 lg:gap-10">
              <div className="space-y-3">
                <div className="h-3 w-24 bg-secondary-100/60 rounded animate-pulse" />
                <div className="h-9 w-52 bg-secondary-100/60 rounded-lg animate-pulse" />
                <div className="h-16 w-full bg-secondary-100/40 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-secondary-100/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const shown = cats.slice(0, Math.min(Math.max(1, limit), FEATURE_CAP));
  if (!shown.length) return null;

  const useSlider = shown.length > SLIDER_THRESHOLD;
  // Static grid columns track the count so 1–3 fill evenly (no half-empty row).
  const gridCols =
    shown.length === 1
      ? "grid-cols-1 max-w-xs"
      : shown.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    // Outer wrapper sits on the warm page canvas and gives the dark band room
    // to breathe (small side gutter so the rounded band never touches the edge),
    // roughly the hero banner's width.
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[28px] py-12 md:py-16 mx-auto bg-gradient-to-br from-primary-800 via-primary-900 to-[#1a0405] shadow-[0_20px_60px_-24px_rgba(36,6,8,0.55)]">
        {/* Ambient gold glow so the dark ground has depth, not a flat wash */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-96 h-96 rounded-full bg-accent-700/10 blur-3xl" />
        <div className="relative max-w-[92%] xl:max-w-6xl mx-auto px-2">
          <div className="grid lg:grid-cols-[0.85fr_2fr] gap-8 lg:gap-10 items-center">

          {/* ── Left: editorial lede ── (gold = #C9A227, the brand gold used on
               the footer rule; the tailwind "accent" ramp is a light tan, too
               pale to read as gold on this dark ground, so set it directly). */}
          <div className="flex flex-col">
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] font-bold mb-4 text-accent-300">
              Curated
              <span className="h-px flex-1 bg-accent-300/40" />
            </p>
            <h2
              className="text-3xl sm:text-4xl leading-[1.08] tracking-tight text-white mb-4"
              style={{ fontFamily: titleFont.style.fontFamily }}
            >
              Featured{" "}
              <span className="italic text-accent-300">Collections</span>
            </h2>
            <p className="text-white/65 text-[15px] leading-relaxed max-w-[34ch] mb-6">
              Handpicked lines, each built around a single leather craft — explore
              what defines the season.
            </p>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors w-fit text-accent-300 hover:text-accent-200"
            >
              View all collections
              <FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* ── Right: cards (grid ≤3, slider >3) ── */}
          {useSlider ? (
            <div className="relative px-4">
              <Swiper
                modules={[Navigation, Autoplay, Keyboard]}
                slidesPerView={1.4}
                spaceBetween={16}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 18 },
                  1024: { slidesPerView: 3, spaceBetween: 20 },
                }}
                navigation={{ nextEl: ".feat-next", prevEl: ".feat-prev" }}
                autoplay={{ delay: 3600, pauseOnMouseEnter: true, disableOnInteraction: false }}
                keyboard={{ enabled: true }}
                loop={shown.length > 3}
              >
                {shown.map(({ category }) => (
                  <SwiperSlide key={category?._id}>
                    <CategoryCard category={category} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                aria-label="Previous collections"
                className="feat-prev absolute left-0 top-[42%] -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 -translate-x-1"
              >
                <FaAngleLeft className="text-sm" />
              </button>
              <button
                aria-label="Next collections"
                className="feat-next absolute right-0 top-[42%] -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 translate-x-1"
              >
                <FaAngleRight className="text-sm" />
              </button>
            </div>
          ) : (
            <div className={`grid ${gridCols} gap-4`}>
              {shown.map(({ category }) => (
                <CategoryCard key={category?._id} category={category} />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCategoryStrip;
