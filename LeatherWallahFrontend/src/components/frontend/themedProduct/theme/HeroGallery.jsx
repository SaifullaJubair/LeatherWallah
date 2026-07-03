"use client";
// Contained product image carousel for the themed hero.
// Sources, in order: selected variation image → product main image →
// other_images[] → main_video / variation_video (shown as a video thumb).
// Clicking a thumb swaps the main view. Clicking the main view (or any thumb)
// opens a full-screen lightbox with pinch / double-tap / button zoom and
// swipe navigation. When the user picks a different variation in the order
// section, variationProduct changes and the active image follows it.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaPlay } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { FiZoomIn, FiMaximize2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Zoom, Keyboard } from "swiper/modules";
import { isVideo } from "@/utils/helper";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/zoom";

export default function HeroGallery({ product, variationProduct }) {
  const variationImg = variationProduct?.variation_image;
  const variationVid = variationProduct?.variation_video;
  const baseImg = variationImg || product?.main_image;

  // Build ordered, de-duplicated media list. Memoized so the array identity
  // is stable per render-input (prevents lightbox index churn).
  //
  // Order: selected-variation image first (so the picked variant leads), then
  // the product main image, then other_images[], then the video. main_image is
  // ALWAYS included even when a variation image leads — otherwise on reload the
  // main image flashes once (before variationProduct is set) and then vanishes
  // from the thumbnails/lightbox entirely. Keeping it in the list means that
  // brief flash now corresponds to a real, reachable thumbnail.
  const media = useMemo(() => {
    const list = [];
    if (variationImg) list.push(variationImg);
    if (product?.main_image && !list.includes(product.main_image))
      list.push(product.main_image);
    (product?.other_images || []).forEach((o) => {
      if (o?.other_image && !list.includes(o.other_image))
        list.push(o.other_image);
    });
    const video = variationVid || product?.main_video;
    if (video && !list.includes(video)) list.push(video);
    return list;
  }, [
    variationImg,
    product?.main_image,
    product?.other_images,
    variationVid,
    product?.main_video,
  ]);

  const [active, setActive] = useState(baseImg);
  // Lightbox: null = closed, otherwise the start index into `media`.
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const lightboxOpen = lightboxIndex !== null;

  // Follow variation change — but NOT while the lightbox is open, or the
  // media list would shift under the open carousel and desync / crash the
  // active slide (audit HIGH #3).
  useEffect(() => {
    if (!lightboxOpen && baseImg) setActive(baseImg);
  }, [baseImg, lightboxOpen]);

  // Lock background scroll while the lightbox is open.
  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  // ESC closes the lightbox (swiper Keyboard handles arrow-key nav).
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  if (!active && media.length === 0) return null;
  const current = active || media[0];

  const openLightbox = () => {
    const idx = media.indexOf(current);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  return (
    <div className="w-full max-w-[520px] mx-auto relative z-10">
      {/* Main view. For an image, clicking anywhere opens the zoom lightbox.
          For a video we DON'T make the whole tile a button — that would swallow
          the native player controls (play/seek/volume). Instead the video plays
          inline and a dedicated "enlarge" button opens the lightbox player. */}
      {isVideo(current) ? (
        <div
          className="group relative block w-full aspect-square rounded-2xl overflow-hidden shadow-sm"
          style={{ background: "var(--section-bg)" }}
        >
          <video
            src={current}
            controls
            muted
            className="w-full h-full object-cover"
          />
          {/* Enlarge → opens the same media in the full-screen lightbox player.
              Separate button so it never blocks the inline video controls. */}
          <button
            type="button"
            onClick={openLightbox}
            aria-label="Zoom in"
            title="Zoom in"
            className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white opacity-80 transition-opacity hover:bg-black/75 hover:opacity-100"
          >
            <FiMaximize2 size={14} /> Zoom
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openLightbox}
          aria-label="Zoom image"
          className="group relative block w-full aspect-square rounded-2xl overflow-hidden shadow-sm cursor-zoom-in"
          style={{ background: "var(--section-bg)" }}
        >
          <img
            src={current}
            alt={product?.product_name || "product"}
            className="w-full h-full object-cover transition-opacity duration-200"
          />

          {/* Zoom affordance — appears on hover (desktop) / always faint (mobile) */}
          <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-70 transition-opacity group-hover:opacity-100">
            <FiZoomIn size={16} />
          </span>

          {/* Corner badge is admin-driven via product.hero_corner_badge, rendered
              once by SingleProduct on the hero image wrapper — no hardcoded label
              here. */}
        </button>
      )}

      {/* Thumbnails — single row, horizontal scroll (never wraps). */}
      {media.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {media.map((src, i) => {
            const isVid = isVideo(src);
            const isActive = current === src;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(src)}
                onDoubleClick={() => setLightboxIndex(i)}
                className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all"
                style={{
                  borderColor: isActive ? "var(--brand-primary)" : "transparent",
                }}
              >
                {isVid ? (
                  <>
                    <video
                      src={src}
                      muted
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <FaPlay size={12} className="text-white" />
                    </span>
                  </>
                ) : (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Full-screen zoom lightbox */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {lightboxOpen && (
              <motion.div
                key="hero-lightbox"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
                onClick={() => setLightboxIndex(null)}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Close"
                  className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <IoClose size={24} />
                </button>

                {/* Stop backdrop-close when interacting with the carousel */}
                <div
                  className="h-full w-full max-w-4xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Swiper
                    modules={[Navigation, Zoom, Keyboard]}
                    initialSlide={lightboxIndex}
                    navigation
                    zoom={{ maxRatio: 3 }}
                    keyboard={{ enabled: true }}
                    className="h-full w-full"
                  >
                    {media.map((src, i) => (
                      <SwiperSlide
                        key={i}
                        className="flex h-full items-center justify-center p-4"
                      >
                        {isVideo(src) ? (
                          // Video isn't wrapped in swiper-zoom-container — the
                          // Zoom module mis-handles <video> (audit HIGH #2).
                          // h-[80vh] (not just max-h) so a small-resolution clip
                          // still fills the lightbox instead of rendering as a
                          // tiny native-size box; w-auto keeps aspect ratio.
                          <video
                            src={src}
                            controls
                            autoPlay
                            className="h-[80vh] max-h-[80vh] w-auto max-w-full rounded-lg bg-black"
                          />
                        ) : (
                          <div className="swiper-zoom-container">
                            <img
                              src={src}
                              alt={`${product?.product_name || "product"} ${i + 1}`}
                              className="max-h-[85vh] max-w-full object-contain"
                            />
                          </div>
                        )}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
