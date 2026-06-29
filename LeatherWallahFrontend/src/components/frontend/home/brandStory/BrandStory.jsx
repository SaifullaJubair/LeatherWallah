"use client";

import Image from "next/image";
import Link from "next/link";

const BrandStory = ({ settings }) => {
  const title = settings?.brand_story_title || "Our Story";
  const text = settings?.brand_story_text || "";
  const imageUrl = settings?.brand_story_image_url || "";
  const ctaLabel = settings?.brand_story_cta_label || "Learn More";
  const ctaUrl = settings?.brand_story_cta_url || "/about";
  const imagePosition = settings?.brand_story_image_position || "right";

  if (!text && !imageUrl) return null;

  const imageBlock = imageUrl ? (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
      <Image src={imageUrl} alt={title} fill className="object-cover" />
    </div>
  ) : null;

  const textBlock = (
    <div className="flex flex-col justify-center gap-4">
      {title && (
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
          {title}
        </h2>
      )}
      {text && (
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{text}</p>
      )}
      {ctaLabel && ctaUrl && (
        <Link
          href={ctaUrl}
          className="inline-block self-start bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded font-medium transition-colors duration-200"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );

  return (
    <div className="py-4 md:py-10">
      <div className="max-w-[98%] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {imagePosition === "left" ? (
            <>
              {imageBlock}
              {textBlock}
            </>
          ) : (
            <>
              {textBlock}
              {imageBlock}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandStory;
