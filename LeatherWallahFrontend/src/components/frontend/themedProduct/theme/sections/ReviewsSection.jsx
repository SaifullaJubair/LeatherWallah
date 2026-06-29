"use client";
// Themed customer reviews — smooth auto-playing carousel (Swiper). Fetches
// GET /review/:productId. Colors from theme CSS vars. Hides if no reviews.
import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa6";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { BASE_URL } from "@/components/utils/baseURL";
import FloatingAssets from "../FloatingAssets";

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar
          key={i}
          size={13}
          style={{ color: i <= Math.round(value) ? "var(--accent-color)" : "#e5e7eb" }}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection({ product, theme }) {
  const productId = product?._id;
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    if (!productId) return;
    let alive = true;
    fetch(`${BASE_URL}/review/${productId}?page=1&limit=12`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setReviews(d?.data || []))
      .catch(() => alive && setReviews([]));
    return () => {
      alive = false;
    };
  }, [productId]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      style={{ background: "var(--section-bg)" }}
    >
      <FloatingAssets assets={theme?.floating_assets} section="reviews" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <h2
            className="text-xl md:text-2xl font-bold text-center"
            style={{
              color: "var(--heading-color)",
              fontWeight: "var(--brand-heading-weight, 700)",
            }}
          >
            প্রাহকদের ভালোবাসা
          </h2>
        </div>

        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          loop={reviews.length > 3}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          speed={700}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="!pb-10 items-stretch"
        >
          {reviews.map((r, i) => {
            const name =
              r?.reviewer_name || r?.review_user_id?.user_name || "ক্রেতা";
            const initial = name.trim().charAt(0) || "ক";
            return (
              <SwiperSlide key={r._id || i} className="!h-auto">
                <div className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3 h-full min-h-[280px]">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center rounded-full font-bold text-sm shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: "var(--brand-primary-light)",
                        color: "var(--brand-primary-dark)",
                      }}
                    >
                      {initial}
                    </span>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--heading-color)" }}
                      >
                        {name}
                      </p>
                      <Stars value={r.review_ratting} />
                    </div>
                  </div>

                  <p
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: "var(--body-color)" }}
                  >
                    {r.review_description}
                  </p>

                  {/* image only when present — no placeholder block */}
                  {r.review_image && (
                    <img
                      src={r.review_image}
                      alt=""
                      className="w-full h-32 object-cover rounded-xl shrink-0"
                    />
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
