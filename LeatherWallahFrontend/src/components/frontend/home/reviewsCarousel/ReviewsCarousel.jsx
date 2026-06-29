"use client";

import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@/components/utils/baseURL";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FaStar } from "react-icons/fa";
import { titleFont } from "@/utils/font";

const StarRating = ({ rating = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <FaStar
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-200"}
        size={13}
      />
    ))}
  </div>
);

// F4.2 — DB field names are review_ratting (double-t), review_image,
// review_product_id (populated). The old card read review_rating/review_photo/
// product_id → always 0-star, no photo, no product name.
const ReviewCard = ({ review }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm h-full flex flex-col gap-3">
    <StarRating rating={review?.review_ratting} />
    <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 flex-1">
      &ldquo;{review?.review_description}&rdquo;
    </p>
    <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-50">
      {review?.review_image ? (
        <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
          <Image
            src={review.review_image}
            alt={review?.reviewer_name || "Reviewer"}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <span className="text-primary-600 font-semibold text-sm">
            {(review?.reviewer_name || "?")[0].toUpperCase()}
          </span>
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {review?.reviewer_name || "Customer"}
        </p>
        {review?.review_product_id?.product_name && (
          <p className="text-xs text-gray-400 line-clamp-1">
            {review.review_product_id.product_name}
          </p>
        )}
      </div>
    </div>
  </div>
);

const ReviewsCarousel = ({ settings }) => {
  const mode = settings?.reviews_carousel_mode || "auto_featured";
  const title = settings?.reviews_carousel_title || "What Our Customers Say";
  const manualIdsRaw = settings?.reviews_carousel_ids || "";

  const manualIds = (() => {
    try {
      const parsed = JSON.parse(manualIdsRaw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  })();

  const autoQuery = useQuery({
    queryKey: ["reviews_carousel_auto"],
    queryFn: async () => {
      // F4.1 — public featured-reviews endpoint (active + 5-star + has photo).
      // Was hitting `/review?...review_rating=5&has_photo=true` which routed to
      // findUserReview → 400 (needs review_user_id) → carousel never rendered.
      const res = await fetch(`${BASE_URL}/review/featured?limit=10`);
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: mode === "auto_featured",
    staleTime: 5 * 60 * 1000,
  });

  const manualQuery = useQuery({
    queryKey: ["reviews_carousel_manual", manualIds.join(",")],
    queryFn: async () => {
      if (!manualIds.length) return { data: [] };
      const res = await fetch(
        `${BASE_URL}/review/by-ids?ids=${manualIds.join(",")}`
      );
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: mode === "manual_pick" && manualIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const reviews =
    mode === "manual_pick"
      ? manualQuery.data?.data ?? []
      : autoQuery.data?.data ?? [];

  if (!reviews.length) return null;

  return (
    <div className="py-4 md:py-10 bg-gray-50">
      <div className="max-w-[98%] mx-auto">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-6 md:mb-10"
          style={{ fontFamily: titleFont.style.fontFamily }}
        >
          {title}
        </h2>
        <Swiper
          modules={[Autoplay, Navigation]}
          slidesPerView={1}
          spaceBetween={20}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          navigation
          loop={reviews.length > 3}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-2"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review._id} className="h-auto">
              <ReviewCard review={review} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default ReviewsCarousel;
