"use client";
import { isVideo } from "@/utils/helper";
import { useState, useRef, useCallback, useEffect } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { BsPlayCircleFill } from "react-icons/bs";
import { TbZoomIn, TbZoomPan } from "react-icons/tb";
import "swiper/css";
import "swiper/css/pagination";

const ZOOM = 2.8;
const LENS = 130;

const ProductPhotoSelect = ({ product, variationProduct }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showMag, setShowMag] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);
  const prevVarId = useRef(null);

  // ✅ Variation change হলে user selection reset — variation এর image দেখাবে
  useEffect(() => {
    if (prevVarId.current !== variationProduct?._id) {
      setSelectedImage(null);
      setSelectedVideo(null);
      prevVarId.current = variationProduct?._id;
    }
  }, [variationProduct?._id]);

  // M14 (2026-06-04) — when buyer picks a variation, the gallery now
  // surfaces the variation's full image set (variation_images[] from product
  // form Batch 2) plus any legacy single variation_image / variation_video.
  // Falls back to product.main_image when a variation has no media of its
  // own, and product.other_images[] are always appended last so buyers still
  // see the full catalog of supporting shots.
  //
  // S2 audit note (2026-06-04) — `product.video_link` (admin-set YouTube /
  // Vimeo URL, mutually exclusive with uploaded main_video) is intentionally
  // NOT rendered here. Embedding requires a sanitized iframe player which is
  // a Layer 4 task (see deferred backlog). Until then, video_link is ignored
  // on the PDP and only main_video / variation_video play inline.
  const variationGallery =
    variationProduct?.variation_images?.filter(Boolean) || [];
  const primaryVariationImage =
    variationProduct?.variation_image || variationGallery[0] || null;

  // ✅ Main media priority:
  // User-selected → Variation video → Variation primary image → Product main
  const mainMedia = selectedVideo
    ? selectedVideo
    : selectedImage
      ? selectedImage
      : variationProduct
        ? variationProduct?.variation_video ||
          primaryVariationImage ||
          product?.main_image
        : product?.main_video || product?.main_image;

  const isVid = isVideo(mainMedia);

  // ✅ Thumbnail builder
  const thumbs = [];
  if (variationProduct) {
    if (variationProduct?.variation_video)
      thumbs.push({ src: variationProduct.variation_video, vid: true });
    // Multi-image gallery: each variation image becomes its own thumb so the
    // buyer can step through them like the parent product gallery.
    const seen = new Set();
    const pushVarImg = (src) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      thumbs.push({ src, varImg: true });
    };
    pushVarImg(primaryVariationImage);
    variationGallery.forEach(pushVarImg);
  } else {
    if (product?.main_video)
      thumbs.push({ src: product.main_video, vid: true });
    if (product?.main_image)
      thumbs.push({ src: product.main_image, main: true });
  }
  product?.other_images?.forEach((o) => {
    if (o?.other_image) thumbs.push({ src: o.other_image });
  });

  const isActive = (t, idx) => {
    if (selectedVideo) return t.src === selectedVideo;
    if (selectedImage) return t.src === selectedImage;
    return idx === 0; // first thumb active by default
  };

  // Mobile media — when a variation is active, the swiper leads with its
  // video + every variation_images[] entry, then product.other_images. This
  // mirrors desktop thumbs so the buyer sees the same set on both layouts.
  const mobileSrcs = (
    variationProduct
      ? [
          variationProduct?.variation_video,
          primaryVariationImage,
          ...variationGallery,
        ]
      : [product?.main_video || product?.main_image]
  )
    .concat(product?.other_images?.map((o) => o.other_image) || [])
    .filter(Boolean)
    // Drop duplicates (legacy variation_image is often the same URL as
    // variation_images[0]).
    .filter((src, i, arr) => arr.indexOf(src) === i);

  // Magnifier handlers
  const onEnter = useCallback(() => {
    if (isVid) return;
    const el = containerRef.current;
    if (el) {
      setImgSize({ w: el.offsetWidth, h: el.offsetHeight });
      setShowMag(true);
    }
  }, [isVid]);

  const onMove = useCallback(
    (e) => {
      if (isVid || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
    },
    [isVid],
  );

  const onLeave = useCallback(() => setShowMag(false), []);

  const half = LENS / 2;
  const cx = Math.max(half, Math.min(pos.x, imgSize.w - half));
  const cy = Math.max(half, Math.min(pos.y, imgSize.h - half));
  const bx = -(cx * ZOOM - half);
  const by = -(cy * ZOOM - half);

  return (
    <PhotoProvider>
      {/* DESKTOP */}
      <div className="hidden md:flex gap-3 relative">
        {/* Vertical Thumbs */}
        {thumbs.length > 1 && (
          <div className="flex flex-col gap-1.5 w-[64px] shrink-0 max-h-[480px] overflow-y-auto scrollbar-thin pr-0.5">
            {thumbs.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (t.vid) {
                    setSelectedVideo(t.src);
                    setSelectedImage(null);
                  } else if (t.varImg || t.main) {
                    setSelectedImage(null);
                    setSelectedVideo(null);
                  } else {
                    setSelectedImage(t.src);
                    setSelectedVideo(null);
                  }
                }}
                className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                  isActive(t, i)
                    ? "border-primary shadow-md shadow-primary/20 scale-105"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                {isVideo(t.src) ? (
                  <>
                    <video
                      src={t.src}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <BsPlayCircleFill className="text-white" size={16} />
                    </div>
                  </>
                ) : (
                  <img
                    src={t.src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="flex-1">
          <div
            ref={containerRef}
            onMouseEnter={onEnter}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            className="relative w-full aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden cursor-crosshair select-none group"
          >
            {isVid ? (
              <video
                src={mainMedia}
                loop
                controls
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <PhotoView src={mainMedia}>
                <img
                  src={mainMedia}
                  alt="product"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  draggable={false}
                />
              </PhotoView>
            )}

            {/* Lens indicator */}
            {showMag && !isVid && (
              <div
                className="absolute pointer-events-none border-2 border-primary/80 rounded-sm"
                style={{
                  width: LENS,
                  height: LENS,
                  left: cx - half,
                  top: cy - half,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.05)",
                }}
              />
            )}

            {/* Hint badge */}
            {!isVid && (
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <TbZoomIn size={11} />
                Hover to zoom
              </div>
            )}

            {/* Click to fullscreen */}
            {!isVid && (
              <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <TbZoomPan size={14} />
              </div>
            )}
          </div>
        </div>

        {/* Zoom Preview Panel */}
        {showMag && !isVid && (
          <div
            className="absolute top-0 z-50 rounded-xl overflow-hidden border border-gray-200 pointer-events-none"
            style={{
              left: `calc(100% + 18px)`,
              width: LENS * ZOOM,
              height: LENS * ZOOM,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              backgroundImage: `url(${mainMedia})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${imgSize.w * ZOOM}px ${imgSize.h * ZOOM}px`,
              backgroundPosition: `${bx}px ${by}px`,
            }}
          />
        )}
      </div>

      {/* MOBILE */}
      <div className="md:hidden">
        <div className="relative rounded-xl overflow-hidden">
          <Swiper
            modules={[Pagination, Autoplay]}
            autoplay={{ delay: 4000, disableOnInteraction: true }}
            pagination={{ clickable: true }}
            loop={mobileSrcs.length > 1}
          >
            {mobileSrcs.map((src, i) => (
              <SwiperSlide key={i}>
                <div className="relative w-full aspect-[4/5] bg-gray-50">
                  {isVideo(src) ? (
                    <video
                      src={src}
                      loop
                      controls
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PhotoView src={src}>
                      <img
                        src={src}
                        alt={`p-${i}`}
                        className="w-full h-full object-cover"
                      />
                    </PhotoView>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        {thumbs.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-thin">
            {thumbs.map((t, i) => (
              <div
                key={i}
                className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 border-gray-200"
              >
                {isVideo(t.src) ? (
                  <>
                    <video
                      src={t.src}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <BsPlayCircleFill className="text-white" size={13} />
                    </div>
                  </>
                ) : (
                  <img
                    src={t.src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PhotoProvider>
  );
};

export default ProductPhotoSelect;
