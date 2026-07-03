/**
 * fill-showcase-product.ts — enrich ONE demo product into a fully-populated
 * "showcase" PDP so the owner can eyeball every storefront feature at once:
 *   • per-variation images (different leather photo per size)
 *   • product gallery (main + other images)
 *   • YouTube product video (video_link)
 *   • size guide table (columns + rows) + size chart note
 *   • short features, benefits, use-cases, specifications (nutrition), FAQs
 *   • badges (product + per-variation)
 *
 * Idempotent-ish: re-running just overwrites the same fields with fresh values.
 * Images reuse the deterministic demo/leather/<slug> S3 keys, so re-runs don't
 * re-download. Targets the seeded "classic-oxford-leather-shoes" product.
 *
 *   npx ts-node-dev --transpile-only src/scripts/fill-showcase-product.ts
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import ProductModel from "../app/product/product.model";
import VariationModel from "../app/variation/variation.model";
import { resolveDemoImage } from "../seeds/demo/image";

const TARGET_SLUG = "classic-oxford-leather-shoes";

// A distinct verified leather photo per shoe size (Unsplash ids checked visually).
const SIZE_IMAGES: Record<string, { slug: string; url: string }[]> = {
  "eu-40": [
    { slug: "oxford-v-40a", url: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=900&q=80" },
    { slug: "oxford-v-40b", url: "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=900&q=80" },
  ],
  "eu-41": [
    { slug: "oxford-v-41a", url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80" },
    { slug: "oxford-v-41b", url: "https://images.unsplash.com/photo-1614253429340-98120bd6d753?w=900&q=80" },
  ],
  "eu-42": [
    { slug: "oxford-v-42a", url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=80" },
    { slug: "oxford-v-42b", url: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=900&q=80" },
  ],
  "eu-43": [
    { slug: "oxford-v-43a", url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=900&q=80" },
    { slug: "oxford-v-43b", url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80" },
  ],
  "eu-44": [
    { slug: "oxford-v-44a", url: "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=900&q=80" },
    { slug: "oxford-v-44b", url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=900&q=80" },
  ],
};

// Extra gallery images for the product (main gallery, beyond main_image).
const GALLERY = [
  { slug: "oxford-gallery-1", url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80" },
  { slug: "oxford-gallery-2", url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=80" },
  { slug: "oxford-gallery-3", url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=900&q=80" },
];

// A size-chart IMAGE (opens in the "Size Chart" button + modal). Any clear image
// works for the demo; using a shoe photo so the modal shows something real.
const SIZE_CHART_IMG = {
  slug: "oxford-size-chart-v2",
  // A measuring-tape / ruler photo so the demo "size chart" reads like an
  // actual sizing reference rather than another product shot. (Buyer replaces
  // this with their real size-chart graphic from Admin.)
  url: "https://images.unsplash.com/photo-1586942593568-29361efcd571?w=1000&q=80",
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.\n");

  try {
    const product: any = await ProductModel.findOne({ product_slug: TARGET_SLUG });
    if (!product) throw new Error(`Product "${TARGET_SLUG}" not found — run seed:demo first.`);
    console.log(`✓ Found product: ${product.product_name} (${product._id})`);

    // ── 1. Resolve gallery images to S3 ──
    console.log("\nResolving gallery images…");
    const gallery: { other_image: string; other_image_key: string }[] = [];
    for (const g of GALLERY) {
      process.stdout.write(`  • ${g.slug} … `);
      const r = await resolveDemoImage(g.url, g.slug);
      gallery.push({ other_image: r.Location, other_image_key: r.Key });
      console.log("ok");
    }

    // ── 1b. Resolve the size-chart image to S3 ──
    process.stdout.write(`  • ${SIZE_CHART_IMG.slug} … `);
    const sizeChart = await resolveDemoImage(SIZE_CHART_IMG.url, SIZE_CHART_IMG.slug);
    console.log("ok");

    // ── 2. Enrich the product document ──
    product.other_images = gallery;
    product.size_chart = sizeChart.Location;
    product.size_chart_key = sizeChart.Key;

    // Spec sheet shown to the RIGHT of the description (custom_fields).
    product.custom_fields = [
      { label: "Brand", value: "Leather Wallah" },
      { label: "Model", value: "Classic Oxford" },
      { label: "Colour", value: "Tan Brown" },
      { label: "Material", value: "Full-grain leather" },
      { label: "Gender", value: "Men" },
      { label: "Country of Origin", value: "Bangladesh" },
    ];
    product.video_title = "See the Craftsmanship";
    product.video_link = "https://www.youtube.com/watch?v=1La4QzGeaaQ"; // generic leather-shoe making video
    product.badge_text = "Best Seller";
    product.hero_corner_badge = "Handmade";

    product.short_features = [
      { text: "100% Full-Grain Leather" },
      { text: "Goodyear Welted" },
      { text: "Cash on Delivery" },
      { text: "7-Day Easy Return" },
    ];

    product.benefits = [
      { text: "Premium full-grain leather that ages beautifully" },
      { text: "Goodyear-welt construction for years of durability" },
      { text: "Cushioned leather insole for all-day comfort" },
      { text: "Non-slip rubber outsole with a classic stacked heel" },
    ];

    product.use_cases = [
      { text: "Office & business meetings" },
      { text: "Weddings & formal events" },
      { text: "Interviews & presentations" },
      { text: "Dinner & evening outings" },
    ];

    // "nutrition" repurposed as a "Product Highlights" table on the PDP.
    // per_serving left blank so the section falls back to its "Product Highlights"
    // heading (custom_fields carries the "Specifications" quick-facts table).
    product.nutrition = {
      rows: [
        { label: "Upper Material", value: "Full-grain cow leather" },
        { label: "Lining", value: "Genuine leather" },
        { label: "Insole", value: "Cushioned leather" },
        { label: "Outsole", value: "Rubber (anti-slip)" },
        { label: "Construction", value: "Goodyear welted" },
        { label: "Toe Style", value: "Cap-toe Oxford" },
        { label: "Closure", value: "Lace-up" },
      ],
      info_tiles: [
        { label: "Warranty", value: "6 months" },
        { label: "Origin", value: "Handmade in BD" },
        { label: "Care", value: "Wipe + condition" },
      ],
    };

    product.faqs = [
      { question: "Is this genuine leather?", answer: "Yes — 100% full-grain cow leather for both the upper and the lining." },
      { question: "How do I choose my size?", answer: "Use the size guide below. These fit true to standard EU sizing; if you are between sizes, size up." },
      { question: "How should I care for these shoes?", answer: "Wipe with a soft dry cloth after use and apply leather conditioner every few weeks. Avoid prolonged water exposure." },
      { question: "Is Cash on Delivery available?", answer: "Yes, COD is available across Bangladesh. You pay when the parcel arrives." },
      { question: "What is the return policy?", answer: "7-day easy return/exchange if the product is unused and in original condition." },
    ];

    // Size guide table (columns + rows) + note.
    product.size_guide_title = "Size Guide (EU / UK / CM)";
    product.size_guide_note =
      "Measure your foot length in centimetres and match it to the CM column. If you are between two sizes, we recommend choosing the larger size.";
    product.size_guide_columns = ["EU Size", "UK Size", "Foot Length (CM)"];
    product.size_guide_rows = [
      ["40", "6.5", "25.0"],
      ["41", "7.5", "25.7"],
      ["42", "8.5", "26.3"],
      ["43", "9.5", "27.0"],
      ["44", "10", "27.7"],
    ];

    await product.save();
    console.log("✓ Product content enriched (video, gallery, features, benefits, use-cases, specs, FAQs, size guide, badges).");

    // ── 3. Per-variation images + badge ──
    console.log("\nEnriching variations with per-size images…");
    const variations: any[] = await VariationModel.find({ product_id: product._id });
    console.log(`  found ${variations.length} variations`);

    // Map each variation to a size via its name suffix (e.g. "... - EU 42").
    const sizeFromName = (name: string): string | null => {
      const m = name.match(/EU\s*(\d{2})/i);
      return m ? `eu-${m[1]}` : null;
    };

    let enriched = 0;
    for (const v of variations) {
      const sizeSlug = sizeFromName(v.variation_name || "");
      if (!sizeSlug || !SIZE_IMAGES[sizeSlug]) {
        console.log(`  • ${v.variation_name} — no size match, skipped`);
        continue;
      }
      const imgs = SIZE_IMAGES[sizeSlug];
      const urls: string[] = [];
      const keys: string[] = [];
      for (const im of imgs) {
        process.stdout.write(`  • ${v.variation_name} → ${im.slug} … `);
        const r = await resolveDemoImage(im.url, im.slug);
        urls.push(r.Location);
        keys.push(r.Key);
        console.log("ok");
      }
      v.variation_images = urls;
      v.variation_images_keys = keys;
      v.variation_image = urls[0]; // legacy single-image field for older UI paths
      v.variation_image_key = keys[0];
      v.variation_badge_text = sizeSlug === "eu-42" ? "Most Popular" : null;
      await v.save();
      enriched += 1;
    }
    console.log(`✓ ${enriched} variations enriched with per-size images.`);

    console.log("\n✅ Showcase product ready.");
    console.log(`   Open the storefront PDP:  /products/${TARGET_SLUG}`);
  } catch (err: any) {
    console.error("\n❌ fill-showcase-product failed:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected.");
  }
};

run();
