/**
 * Leather-footwear demo dataset (pure data — NO database or S3 calls here).
 *
 * The seed runner (seed-demo.ts) turns this declaration into real documents:
 * resolves images to S3, assigns publisher ids, builds variation combinations
 * from the seeded attribute value ids, and stamps is_demo=true on everything.
 *
 * Every image is a { slug, url } pair: `slug` becomes the deterministic S3 key
 * (demo/leather/<slug>.<ext>) so re-runs reuse the same upload; `url` is the
 * one-time stock-photo source (only fetched if the S3 object is absent).
 *
 * Stock photos: Unsplash (free to use, hot-link source only used on first seed;
 * after that the shop serves its own S3 copy).
 *
 * NOTE: the `nutrition` field is repurposed here as a generic product-spec table
 * (material / sole / origin / warranty). The schema is just label/value rows, so
 * it renders as a "Specifications" block on the PDP without any code change.
 */

export interface DemoImage {
  slug: string;
  url: string;
}

export interface DemoAttributeValue {
  name: string;
  slug: string;
  code?: string; // hex for swatch, or size label
  weight_grams?: number; // when the attribute tracks weight
}

export interface DemoAttribute {
  name: string;
  slug: string;
  display_type: "swatch" | "button" | "dropdown";
  tracks_weight: boolean;
  values: DemoAttributeValue[];
}

export interface DemoCategory {
  name: string;
  slug: string;
  serial: number;
  logo?: DemoImage; // category_logo (S3)
  children?: DemoCategory[];
}

export interface DemoReview {
  name: string;
  rating: number;
  text: string;
  verified: boolean;
}

export interface DemoProduct {
  name: string;
  slug: string;
  // Which seeded category (by slug) this product lives in. Leaf preferred.
  category_slug: string;
  price: number;
  discount_price?: number;
  quantity: number;
  unit: string;
  short_description: string;
  description: string;
  badge_text?: string;
  hero_corner_badge?: string;
  main_image: DemoImage;
  other_images?: DemoImage[];
  // Small "why us" tiles under the hero (icon-less text chips).
  short_features?: string[];
  // Social share / OG meta. og_image reuses main_image when omitted.
  og_title?: string;
  og_description?: string;
  // Variation axis = which seeded attribute (by slug) drives combinations.
  // Omit for a simple (non-variation) product. Each listed value (by slug)
  // becomes one variation row with the given price/qty. SINGLE-AXIS.
  variation?: {
    attribute_slug: string;
    rows: {
      value_slug: string;
      price: number;
      quantity: number;
      discount_price?: number;
      image?: DemoImage; // optional per-variation image
    }[];
  };
  // MULTI-AXIS variation (e.g. Size × Color). `axes` lists the attribute slugs
  // in the order they should appear on the picker; `rows` enumerates every
  // combination explicitly (value_slugs must line up with `axes` order). This
  // mirrors what the Admin combination matrix produces, so variation_name is
  // built as "Value / Value" and `combination` is the SORTED value-id array.
  multi_variation?: {
    axes: string[]; // attribute slugs, picker order
    rows: {
      value_slugs: string[]; // one per axis, same order as `axes`
      price: number;
      quantity: number;
      discount_price?: number;
      image?: DemoImage; // optional per-combination image
    }[];
  };
  // ── page-content ──
  benefits?: string[];
  use_cases?: { text: string }[];
  // Repurposed as a Specifications table (label/value rows).
  nutrition?: {
    per_serving?: string;
    rows: { label: string; value: string }[];
    info_tiles?: { label: string; value: string }[];
  };
  faqs?: { question: string; answer: string }[];
  reviews?: DemoReview[];
}

// ─────────────────────────── Categories (nested) ───────────────────────────
export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    name: "Men's Footwear",
    slug: "mens-footwear",
    serial: 1,
    logo: { slug: "cat-mens", url: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=600&q=80" },
    children: [
      { name: "Formal Shoes", slug: "formal-shoes", serial: 1, logo: { slug: "cat-formal", url: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80" } },
      { name: "Loafers", slug: "loafers", serial: 2, logo: { slug: "cat-loafers", url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&q=80" } },
    ],
  },
  {
    name: "Casual & Accessories",
    slug: "casual-accessories",
    serial: 2,
    logo: { slug: "cat-casual", url: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&q=80" },
    children: [
      { name: "Sneakers", slug: "sneakers", serial: 1, logo: { slug: "cat-sneakers", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" } },
      { name: "Leather Accessories", slug: "leather-accessories", serial: 2, logo: { slug: "cat-acc", url: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80" } },
    ],
  },
];

// ─────────────────────────── Attributes ────────────────────────────────────
// "Shoe Size" is a button selector (UK/EU sizing); it does not track weight.
export const DEMO_ATTRIBUTES: DemoAttribute[] = [
  {
    name: "Shoe Size",
    slug: "shoe-size",
    display_type: "button",
    tracks_weight: false,
    values: [
      { name: "EU 39", slug: "eu-39", code: "39" },
      { name: "EU 40", slug: "eu-40", code: "40" },
      { name: "EU 41", slug: "eu-41", code: "41" },
      { name: "EU 42", slug: "eu-42", code: "42" },
      { name: "EU 43", slug: "eu-43", code: "43" },
      { name: "EU 44", slug: "eu-44", code: "44" },
    ],
  },
  {
    // Colour swatch — used by the multi-axis demo product (Size × Colour). The
    // `code` is a hex value so the storefront renders a colour dot swatch.
    name: "Shoe Color",
    slug: "shoe-color",
    display_type: "swatch",
    tracks_weight: false,
    values: [
      { name: "Tan Brown", slug: "tan-brown", code: "#8B5A2B" },
      { name: "Jet Black", slug: "jet-black", code: "#1C1C1C" },
    ],
  },
];

// ─────────────────────────── Banner + Slider ───────────────────────────────
export const DEMO_BANNERS: { title: string; serial: number; image: DemoImage }[] = [
  {
    title: "Handcrafted Genuine Leather Footwear",
    serial: 1,
    image: {
      slug: "banner-handcrafted",
      url: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=1600&q=80",
    },
  },
  {
    title: "Premium Formal Shoes Collection",
    serial: 2,
    image: {
      slug: "banner-formal",
      url: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=1600&q=80",
    },
  },
];

export const DEMO_SLIDERS: { serial: number; image: DemoImage }[] = [
  {
    serial: 1,
    image: {
      slug: "slider-loafer",
      url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1600&q=80",
    },
  },
  {
    serial: 2,
    image: {
      slug: "slider-sneaker",
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80",
    },
  },
];

// Shared review pool snippets reused across products (each product picks a few).
const REVIEWS_A: DemoReview[] = [
  { name: "Rakib Hasan", rating: 5, text: "Excellent build quality and the leather feels premium. Very comfortable for all-day wear.", verified: true },
  { name: "Sadia Akter", rating: 5, text: "Bought these for my husband — great packaging and fast delivery. Will order again.", verified: true },
  { name: "Tanvir Ahmed", rating: 4, text: "Good quality leather, fits true to size. Wish the price was a little lower.", verified: false },
];
const REVIEWS_B: DemoReview[] = [
  { name: "Nusrat Jahan", rating: 5, text: "Genuine leather, exactly as described. Highly recommend to everyone.", verified: true },
  { name: "Imran Khan", rating: 5, text: "Stitching is clean and the sole is sturdy. Worth every taka.", verified: true },
  { name: "Faria Islam", rating: 4, text: "Nice shoes, received on time. Comfortable after a short break-in.", verified: false },
];

// ─────────────────────────── Products ──────────────────────────────────────
export const DEMO_PRODUCTS: DemoProduct[] = [
  // 1) Variation product — Oxford Formal Shoes (sizes)
  {
    name: "Classic Oxford Leather Shoes",
    slug: "classic-oxford-leather-shoes",
    category_slug: "formal-shoes",
    price: 4500,
    quantity: 0, // variation product — stock lives on rows
    unit: "Pair",
    short_description: "Timeless full-grain leather Oxford shoes, handcrafted for a sharp formal look.",
    description:
      "Crafted from 100% genuine full-grain leather with a classic cap-toe Oxford design. Goodyear-welted construction, cushioned insole, and a durable rubber sole — built to last and polished to impress.",
    badge_text: "Best Seller",
    hero_corner_badge: "New",
    short_features: ["100% Genuine Leather", "Goodyear Welted", "Free Home Delivery"],
    og_title: "Classic Oxford Leather Shoes — Handcrafted | Leather Wallah",
    og_description:
      "Timeless full-grain leather Oxford shoes. Goodyear-welted, cushioned insole, durable sole. Premium quality, cash on delivery across Bangladesh.",
    main_image: {
      slug: "oxford-main-v2",
      url: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=900&q=80",
    },
    other_images: [
      {
        slug: "oxford-2",
        url: "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=900&q=80",
      },
    ],
    variation: {
      attribute_slug: "shoe-size",
      rows: [
        { value_slug: "eu-40", price: 4500, quantity: 15 },
        { value_slug: "eu-41", price: 4500, quantity: 20 },
        { value_slug: "eu-42", price: 4500, discount_price: 4200, quantity: 25 },
        { value_slug: "eu-43", price: 4500, quantity: 18 },
        { value_slug: "eu-44", price: 4500, quantity: 10 },
      ],
    },
    benefits: ["Premium full-grain leather", "All-day comfort", "Durable Goodyear welt", "Timeless formal style"],
    use_cases: [
      { text: "Office & business" },
      { text: "Weddings & events" },
      { text: "Formal occasions" },
    ],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Full-grain leather" },
        { label: "Sole", value: "Rubber (anti-slip)" },
        { label: "Lining", value: "Genuine leather" },
        { label: "Construction", value: "Goodyear welted" },
      ],
      info_tiles: [
        { label: "Warranty", value: "6 months" },
        { label: "Origin", value: "Handmade in BD" },
      ],
    },
    faqs: [
      { question: "Is this genuine leather?", answer: "Yes, it is 100% genuine full-grain leather — both the upper and the lining." },
      { question: "How do I care for these shoes?", answer: "Wipe with a soft dry cloth and apply leather conditioner every few weeks. Avoid prolonged water exposure." },
    ],
    reviews: REVIEWS_A,
  },

  // 2) Variation product — Penny Loafers (sizes)
  {
    name: "Premium Penny Loafers",
    slug: "premium-penny-loafers",
    category_slug: "loafers",
    price: 3800,
    quantity: 0,
    unit: "Pair",
    short_description: "Slip-on penny loafers in soft suede-touch leather — effortless smart-casual style.",
    description:
      "Handmade penny loafers with a supple leather upper and a flexible lightweight sole. Slip-on comfort that pairs equally well with chinos or a suit.",
    badge_text: "Premium",
    short_features: ["Soft Leather Upper", "Slip-On Comfort", "Lightweight Sole"],
    og_title: "Premium Penny Loafers — Smart-Casual Leather | Leather Wallah",
    og_description:
      "Handmade penny loafers with a supple leather upper and lightweight flexible sole. Slip-on comfort for any occasion.",
    main_image: {
      slug: "loafer-main",
      url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=80",
    },
    other_images: [
      { slug: "loafer-2", url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=80" },
      { slug: "loafer-3", url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80" },
    ],
    variation: {
      attribute_slug: "shoe-size",
      rows: [
        { value_slug: "eu-40", price: 3800, quantity: 12 },
        { value_slug: "eu-41", price: 3800, discount_price: 3500, quantity: 18 },
        { value_slug: "eu-42", price: 3800, quantity: 20 },
        { value_slug: "eu-43", price: 3800, quantity: 14 },
      ],
    },
    benefits: ["Effortless slip-on", "Breathable leather", "Lightweight & flexible", "Versatile styling"],
    use_cases: [{ text: "Smart-casual outfits" }, { text: "Daily office wear" }, { text: "Evening outings" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Soft genuine leather" },
        { label: "Sole", value: "TPR lightweight" },
        { label: "Closure", value: "Slip-on" },
      ],
      info_tiles: [{ label: "Warranty", value: "3 months" }],
    },
    faqs: [
      { question: "Do these run true to size?", answer: "Yes, they fit true to standard EU sizing. If you are between sizes, we suggest sizing up." },
    ],
    reviews: REVIEWS_B,
  },

  // 3) Simple product (no variation) — Leather Belt
  {
    name: "Genuine Leather Belt",
    slug: "genuine-leather-belt",
    category_slug: "leather-accessories",
    price: 1200,
    discount_price: 950,
    quantity: 100,
    unit: "Piece",
    short_description: "Full-grain leather belt with a brushed alloy buckle — a wardrobe essential.",
    description:
      "A classic 35mm full-grain leather belt with a sturdy brushed-alloy pin buckle. Cut from a single hide for durability — no bonded or split leather.",
    badge_text: "Wardrobe Essential",
    short_features: ["Full-Grain Leather", "Alloy Buckle", "Single-Hide Cut"],
    og_title: "Genuine Leather Belt — Full-Grain | Leather Wallah",
    og_description:
      "Classic 35mm full-grain leather belt with a brushed-alloy buckle. Durable single-hide cut, no bonded leather.",
    main_image: {
      slug: "belt-main",
      url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=900&q=80",
    },
    other_images: [
      { slug: "belt-2", url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80" },
    ],
    benefits: ["Durable full-grain leather", "Rust-resistant buckle", "Goes with formal & casual", "Single-hide strength"],
    use_cases: [{ text: "With formal trousers" }, { text: "With jeans" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Material", value: "Full-grain leather" },
        { label: "Width", value: "35 mm" },
        { label: "Buckle", value: "Brushed alloy" },
      ],
      info_tiles: [{ label: "Origin", value: "Handmade in BD" }],
    },
    faqs: [
      { question: "Can the belt be trimmed to fit?", answer: "Yes, the belt can be trimmed at the tail end to your exact waist size." },
    ],
    reviews: REVIEWS_A,
  },

  // 4) Simple product — Leather Sneakers
  {
    name: "Minimalist Leather Sneakers",
    slug: "minimalist-leather-sneakers",
    category_slug: "sneakers",
    price: 3200,
    quantity: 60,
    unit: "Pair",
    short_description: "Premium leather sneakers with a cushioned footbed — everyday comfort.",
    description:
      "Premium leather sneakers in a clean minimalist silhouette. Cushioned memory-foam footbed and a flexible rubber outsole make them perfect for all-day everyday wear.",
    badge_text: "Everyday Comfort",
    short_features: ["Genuine Leather", "Memory-Foam Footbed", "Flexible Outsole"],
    og_title: "Minimalist Leather Sneakers — Everyday Comfort | Leather Wallah",
    og_description:
      "Premium leather sneakers with a memory-foam footbed and flexible rubber outsole. All-day everyday comfort.",
    main_image: {
      slug: "sneaker-main-v2",
      url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&q=80",
    },
    other_images: [
      { slug: "sneaker-2-v2", url: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&q=80" },
    ],
    benefits: ["All-day cushioning", "Breathable leather", "Versatile minimalist look", "Durable outsole"],
    use_cases: [{ text: "Everyday casual" }, { text: "Walking & travel" }, { text: "Weekend outings" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Genuine leather" },
        { label: "Footbed", value: "Memory foam" },
        { label: "Outsole", value: "Rubber (flexible)" },
      ],
      info_tiles: [{ label: "Warranty", value: "3 months" }],
    },
    faqs: [
      { question: "Are these suitable for daily walking?", answer: "Yes, the memory-foam footbed and flexible outsole are designed for all-day comfort." },
      { question: "How do I clean white leather sneakers?", answer: "Wipe with a damp cloth and mild soap, then air dry. Avoid machine washing." },
    ],
    reviews: REVIEWS_B,
  },

  // 5) Simple product — Chelsea Boots
  {
    name: "Suede Chelsea Boots",
    slug: "suede-chelsea-boots",
    category_slug: "mens-footwear",
    price: 5200,
    discount_price: 4800,
    quantity: 45,
    unit: "Pair",
    short_description: "Ankle-high suede Chelsea boots with elastic side panels — refined and easy to wear.",
    description:
      "Handcrafted Chelsea boots in soft suede leather with signature elastic side gussets for an easy pull-on fit. A stacked heel and durable sole make them a year-round staple.",
    badge_text: "Editor's Pick",
    short_features: ["Soft Suede", "Elastic Side Panels", "Pull-On Fit"],
    og_title: "Suede Chelsea Boots — Refined Leather | Leather Wallah",
    og_description:
      "Handcrafted suede Chelsea boots with elastic side gussets and a stacked heel. Easy pull-on fit, year-round staple.",
    main_image: {
      slug: "chelsea-main-v2",
      url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&q=80",
    },
    other_images: [
      { slug: "chelsea-2", url: "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=900&q=80" },
    ],
    benefits: ["Easy pull-on design", "Soft premium suede", "Stacked durable heel", "Year-round wear"],
    use_cases: [{ text: "Smart-casual" }, { text: "Autumn & winter" }, { text: "Evening events" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Suede leather" },
        { label: "Sole", value: "Stacked heel, rubber base" },
        { label: "Closure", value: "Elastic side gusset" },
      ],
      info_tiles: [{ label: "Warranty", value: "6 months" }],
    },
    faqs: [
      { question: "How should I protect suede?", answer: "Apply a suede protector spray before first wear and brush regularly with a suede brush." },
      { question: "Do these fit true to size?", answer: "Yes — for a snug fit choose your usual size; for thicker socks consider sizing up." },
    ],
    reviews: REVIEWS_A,
  },

  // 6) Simple product — Leather Wallet
  {
    name: "Bifold Leather Wallet",
    slug: "bifold-leather-wallet",
    category_slug: "leather-accessories",
    price: 1500,
    quantity: 50,
    unit: "Piece",
    short_description: "Slim bifold wallet in full-grain leather with RFID-blocking card slots.",
    description:
      "A slim bifold wallet handcrafted from full-grain leather. Features six card slots, two cash compartments, and RFID-blocking protection — ages beautifully with use.",
    badge_text: "RFID Protected",
    short_features: ["Full-Grain Leather", "RFID Blocking", "Slim Profile"],
    og_title: "Bifold Leather Wallet — RFID Protected | Leather Wallah",
    og_description:
      "Slim bifold wallet in full-grain leather with six card slots and RFID-blocking protection. Ages beautifully.",
    main_image: {
      slug: "wallet-main",
      url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=900&q=80",
    },
    other_images: [
      { slug: "wallet-2", url: "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=900&q=80" },
    ],
    benefits: ["Premium full-grain leather", "RFID card protection", "Slim everyday carry", "Ages with character"],
    use_cases: [{ text: "Everyday carry" }, { text: "Travel" }, { text: "Gift item" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Material", value: "Full-grain leather" },
        { label: "Card Slots", value: "6" },
        { label: "Protection", value: "RFID blocking" },
      ],
      info_tiles: [{ label: "Origin", value: "Handmade in BD" }],
    },
    faqs: [
      { question: "Does it really block RFID?", answer: "Yes, an internal shielding layer blocks RFID scanning of contactless cards." },
      { question: "How many cards does it hold?", answer: "Six dedicated card slots plus two cash compartments." },
    ],
    reviews: REVIEWS_B,
  },

  // 6) MULTI-AXIS variation product — Monk Strap in Size × Colour. Each of the
  //    four combinations has its own price, discount, stock and image so the
  //    QuickView / PDP picker can be exercised end-to-end.
  {
    name: "Double Monk Strap Shoes",
    slug: "double-monk-strap-shoes",
    category_slug: "formal-shoes",
    price: 5200, // base — real prices live on the combination rows
    quantity: 0,
    unit: "Pair",
    short_description: "Handcrafted double monk strap shoes in full-grain leather — pick your size and colour.",
    description:
      "A refined double monk strap silhouette in 100% full-grain leather. Available in Tan Brown and Jet Black across multiple sizes, each pair Goodyear-welted with a cushioned insole and leather sole.",
    badge_text: "New Arrival",
    hero_corner_badge: "New",
    short_features: ["Full-Grain Leather", "Goodyear Welted", "Two Colours"],
    og_title: "Double Monk Strap Shoes — Size & Colour Options | Leather Wallah",
    og_description:
      "Handcrafted double monk strap leather shoes in Tan Brown & Jet Black. Multiple sizes, cushioned insole, cash on delivery across Bangladesh.",
    main_image: {
      slug: "monk-main",
      url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=900&q=80",
    },
    other_images: [
      { slug: "monk-2", url: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=80" },
    ],
    multi_variation: {
      axes: ["shoe-size", "shoe-color"],
      rows: [
        {
          value_slugs: ["eu-40", "tan-brown"],
          price: 5200,
          discount_price: 4900,
          quantity: 12,
          image: { slug: "monk-40-tan", url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=80" },
        },
        {
          value_slugs: ["eu-40", "jet-black"],
          price: 5200,
          quantity: 8,
          image: { slug: "monk-40-black", url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=80" },
        },
        {
          value_slugs: ["eu-42", "tan-brown"],
          price: 5400,
          discount_price: 5000,
          quantity: 15,
          image: { slug: "monk-42-tan", url: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=900&q=80" },
        },
        {
          value_slugs: ["eu-42", "jet-black"],
          price: 5400,
          quantity: 5,
          image: { slug: "monk-42-black", url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80" },
        },
      ],
    },
    benefits: ["100% full-grain leather", "Goodyear-welted durability", "Two colour options", "Cushioned all-day comfort"],
    use_cases: [{ text: "Office & formal" }, { text: "Weddings" }, { text: "Everyday smart-casual" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Material", value: "Full-grain leather" },
        { label: "Construction", value: "Goodyear welted" },
        { label: "Sole", value: "Leather with rubber heel" },
      ],
      info_tiles: [{ label: "Origin", value: "Handmade in BD" }],
    },
    faqs: [
      { question: "Do the colours run true?", answer: "Yes — Tan Brown is a warm mid-brown and Jet Black is a deep true black." },
      { question: "How do I pick my size?", answer: "Select your EU size and colour above; stock and price update per combination." },
    ],
    reviews: REVIEWS_A,
  },

  // ── Extra demo products so each category strip looks full (8 more) ──

  // 8) Formal — Wingtip Brogues (sizes)
  {
    name: "Wingtip Brogue Shoes",
    slug: "wingtip-brogue-shoes",
    category_slug: "formal-shoes",
    price: 4800,
    quantity: 0,
    unit: "Pair",
    short_description: "Classic wingtip brogues with decorative broguing — sharp formal character.",
    description:
      "Full-grain leather wingtip brogues featuring signature medallion broguing, a cushioned insole and a durable stacked sole. A statement formal shoe with timeless detail.",
    badge_text: "Best Seller",
    short_features: ["Full-Grain Leather", "Hand-Brogued", "Cushioned Insole"],
    main_image: { slug: "brogue-main", url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=80" },
    other_images: [{ slug: "brogue-2", url: "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=900&q=80" }],
    variation: {
      attribute_slug: "shoe-size",
      rows: [
        { value_slug: "eu-40", price: 4800, quantity: 14 },
        { value_slug: "eu-41", price: 4800, discount_price: 4500, quantity: 16 },
        { value_slug: "eu-42", price: 4800, quantity: 20 },
        { value_slug: "eu-43", price: 4800, quantity: 12 },
      ],
    },
    benefits: ["Timeless brogue detail", "Premium leather", "All-day comfort", "Durable stacked sole"],
    use_cases: [{ text: "Office & business" }, { text: "Formal events" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Full-grain leather" },
        { label: "Sole", value: "Stacked leather" },
        { label: "Construction", value: "Goodyear welted" },
      ],
      info_tiles: [{ label: "Warranty", value: "6 months" }],
    },
    faqs: [{ question: "Is broguing hand-finished?", answer: "Yes, the medallion and wing detailing are hand-punched by our artisans." }],
    reviews: REVIEWS_B,
  },

  // 9) Formal — Derby Shoes (sizes)
  {
    name: "Leather Derby Shoes",
    slug: "leather-derby-shoes",
    category_slug: "formal-shoes",
    price: 4300,
    quantity: 0,
    unit: "Pair",
    short_description: "Open-lacing Derby shoes in smooth calf leather — comfortable and versatile.",
    description:
      "Smooth calf-leather Derby shoes with an open-lacing system for an adjustable, roomy fit. A softer, more relaxed formal option that pairs well from office to dinner.",
    short_features: ["Calf Leather", "Open Lacing", "Roomy Fit"],
    main_image: { slug: "derby-main", url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=80" },
    other_images: [{ slug: "derby-2", url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80" }],
    variation: {
      attribute_slug: "shoe-size",
      rows: [
        { value_slug: "eu-41", price: 4300, quantity: 18 },
        { value_slug: "eu-42", price: 4300, quantity: 22 },
        { value_slug: "eu-43", price: 4300, discount_price: 3999, quantity: 15 },
      ],
    },
    benefits: ["Adjustable open lacing", "Soft calf leather", "Everyday formal comfort"],
    use_cases: [{ text: "Office wear" }, { text: "Dinner & events" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Calf leather" },
        { label: "Closure", value: "Open lacing" },
        { label: "Sole", value: "Rubber" },
      ],
      info_tiles: [{ label: "Warranty", value: "3 months" }],
    },
    faqs: [{ question: "Derby vs Oxford — what's the difference?", answer: "Derbys have open lacing (more room and adjustability); Oxfords have closed lacing for a sleeker look." }],
    reviews: REVIEWS_A,
  },

  // 10) Loafers — Tassel Loafers (sizes)
  {
    name: "Suede Tassel Loafers",
    slug: "suede-tassel-loafers",
    category_slug: "loafers",
    price: 3600,
    quantity: 0,
    unit: "Pair",
    short_description: "Soft suede tassel loafers — a refined slip-on with playful detail.",
    description:
      "Premium suede tassel loafers with a hand-stitched apron and lightweight flexible sole. Effortless slip-on style with a touch of personality.",
    badge_text: "Premium",
    short_features: ["Soft Suede", "Tassel Detail", "Slip-On"],
    main_image: { slug: "tassel-main", url: "https://images.unsplash.com/photo-1614253429340-98120bd6d753?w=900&q=80" },
    other_images: [{ slug: "tassel-2", url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=80" }],
    variation: {
      attribute_slug: "shoe-size",
      rows: [
        { value_slug: "eu-40", price: 3600, quantity: 10 },
        { value_slug: "eu-41", price: 3600, discount_price: 3300, quantity: 14 },
        { value_slug: "eu-42", price: 3600, quantity: 16 },
      ],
    },
    benefits: ["Refined tassel detail", "Breathable suede", "Lightweight slip-on"],
    use_cases: [{ text: "Smart-casual" }, { text: "Evening outings" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Suede leather" },
        { label: "Closure", value: "Slip-on" },
        { label: "Sole", value: "TPR lightweight" },
      ],
      info_tiles: [{ label: "Warranty", value: "3 months" }],
    },
    faqs: [{ question: "How do I care for suede loafers?", answer: "Brush regularly with a suede brush and apply a protector spray before first wear." }],
    reviews: REVIEWS_B,
  },

  // 11) Loafers — Horsebit Loafers (sizes)
  {
    name: "Classic Horsebit Loafers",
    slug: "classic-horsebit-loafers",
    category_slug: "loafers",
    price: 4100,
    quantity: 0,
    unit: "Pair",
    short_description: "Leather horsebit loafers with a polished metal bit — timeless luxury style.",
    description:
      "Genuine leather horsebit loafers finished with a signature polished metal bit across the vamp. A classic dress-loafer that elevates any smart outfit.",
    short_features: ["Genuine Leather", "Metal Horsebit", "Leather Lining"],
    main_image: { slug: "horsebit-main", url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80" },
    other_images: [{ slug: "horsebit-2", url: "https://images.unsplash.com/photo-1582897085656-c636d006a246?w=900&q=80" }],
    variation: {
      attribute_slug: "shoe-size",
      rows: [
        { value_slug: "eu-41", price: 4100, quantity: 12 },
        { value_slug: "eu-42", price: 4100, quantity: 18 },
        { value_slug: "eu-43", price: 4100, discount_price: 3800, quantity: 10 },
      ],
    },
    benefits: ["Signature horsebit detail", "Premium leather lining", "Dress-loafer versatility"],
    use_cases: [{ text: "Business casual" }, { text: "Formal events" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Genuine leather" },
        { label: "Hardware", value: "Polished metal bit" },
        { label: "Lining", value: "Leather" },
      ],
      info_tiles: [{ label: "Warranty", value: "6 months" }],
    },
    faqs: [{ question: "Will the metal bit tarnish?", answer: "The bit is treated for shine retention; an occasional soft-cloth polish keeps it bright." }],
    reviews: REVIEWS_A,
  },

  // 12) Sneakers — High-Top (simple)
  {
    name: "Leather High-Top Sneakers",
    slug: "leather-high-top-sneakers",
    category_slug: "sneakers",
    price: 3900,
    discount_price: 3500,
    quantity: 40,
    unit: "Pair",
    short_description: "Premium leather high-tops with ankle support and a cushioned footbed.",
    description:
      "Full-grain leather high-top sneakers with padded ankle collars and a memory-foam footbed. A bold everyday silhouette with all-day comfort.",
    badge_text: "Everyday Comfort",
    short_features: ["Full-Grain Leather", "Padded Collar", "Memory-Foam Footbed"],
    main_image: { slug: "hightop-main", url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&q=80" },
    other_images: [{ slug: "hightop-2", url: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&q=80" }],
    benefits: ["Supportive ankle collar", "All-day cushioning", "Durable leather upper"],
    use_cases: [{ text: "Everyday casual" }, { text: "Street style" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Full-grain leather" },
        { label: "Footbed", value: "Memory foam" },
        { label: "Outsole", value: "Rubber" },
      ],
      info_tiles: [{ label: "Warranty", value: "3 months" }],
    },
    faqs: [{ question: "Do high-tops give good ankle support?", answer: "Yes, the padded collar wraps the ankle for extra support and comfort." }],
    reviews: REVIEWS_B,
  },

  // 13) Sneakers — Canvas & Leather (simple)
  {
    name: "Canvas Leather Trainers",
    slug: "canvas-leather-trainers",
    category_slug: "sneakers",
    price: 2800,
    quantity: 55,
    unit: "Pair",
    short_description: "Lightweight canvas trainers with leather trims — breezy everyday wear.",
    description:
      "Breathable canvas trainers accented with genuine leather trims and a cushioned insole. Lightweight and easy to style for warm-weather everyday wear.",
    short_features: ["Breathable Canvas", "Leather Trims", "Lightweight"],
    main_image: { slug: "trainer-main", url: "https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=900&q=80" },
    other_images: [{ slug: "trainer-2", url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&q=80" }],
    benefits: ["Breathable & light", "Leather-trim durability", "Easy everyday styling"],
    use_cases: [{ text: "Casual daily wear" }, { text: "Summer outings" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Canvas + leather trim" },
        { label: "Insole", value: "Cushioned" },
        { label: "Outsole", value: "Vulcanised rubber" },
      ],
      info_tiles: [{ label: "Warranty", value: "1 month" }],
    },
    faqs: [{ question: "Are these machine washable?", answer: "Spot-clean only — the leather trims should not be machine washed." }],
    reviews: REVIEWS_A,
  },

  // 14) Accessories — Card Holder (simple)
  {
    name: "Slim Leather Card Holder",
    slug: "slim-leather-card-holder",
    category_slug: "leather-accessories",
    price: 800,
    discount_price: 650,
    quantity: 120,
    unit: "Piece",
    short_description: "Minimal full-grain card holder — four slots for everyday essentials.",
    description:
      "A slim full-grain leather card holder with four card slots and a central pocket. Pocket-friendly minimalist carry that patinas beautifully over time.",
    badge_text: "Everyday Carry",
    short_features: ["Full-Grain Leather", "4 Card Slots", "Slim Profile"],
    main_image: { slug: "cardholder-main", url: "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=900&q=80" },
    other_images: [{ slug: "cardholder-2", url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=900&q=80" }],
    benefits: ["Ultra-slim carry", "Premium full-grain leather", "Ages with character"],
    use_cases: [{ text: "Everyday carry" }, { text: "Gift item" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Material", value: "Full-grain leather" },
        { label: "Card Slots", value: "4" },
        { label: "Pockets", value: "1 central" },
      ],
      info_tiles: [{ label: "Origin", value: "Handmade in BD" }],
    },
    faqs: [{ question: "How many cards does it hold?", answer: "Four cards in the slots plus a couple more folded in the central pocket." }],
    reviews: REVIEWS_B,
  },

  // 15) Men's Footwear — Desert Boots (simple)
  {
    name: "Suede Desert Boots",
    slug: "suede-desert-boots",
    category_slug: "mens-footwear",
    price: 4600,
    quantity: 38,
    unit: "Pair",
    short_description: "Classic suede desert boots with a crepe sole — rugged yet refined.",
    description:
      "Timeless suede desert boots featuring a two-eyelet lace-up and a comfortable crepe rubber sole. A versatile between-seasons staple that works with denim or chinos.",
    badge_text: "Editor's Pick",
    short_features: ["Soft Suede", "Crepe Sole", "Two-Eyelet Lace"],
    main_image: { slug: "desert-main", url: "https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=900&q=80" },
    other_images: [{ slug: "desert-2", url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&q=80" }],
    benefits: ["Cushioned crepe sole", "Soft breathable suede", "Between-seasons versatility"],
    use_cases: [{ text: "Casual daily wear" }, { text: "Autumn & spring" }],
    nutrition: {
      per_serving: "Specifications",
      rows: [
        { label: "Upper Material", value: "Suede leather" },
        { label: "Sole", value: "Crepe rubber" },
        { label: "Closure", value: "Two-eyelet lace" },
      ],
      info_tiles: [{ label: "Warranty", value: "3 months" }],
    },
    faqs: [{ question: "Is a crepe sole durable?", answer: "Crepe soles are comfortable and grippy; re-soling is easy when they eventually wear down." }],
    reviews: REVIEWS_A,
  },
];

// Theme seeded for the demo (leather-friendly warm palette) + floating accents.
// Each floating asset is anchored to a PDP section; the storefront renders them
// as soft animated images. position/align/section/animation mirror the theme
// floating_assets schema (theme.model.ts floatingAssetSchema).
export const DEMO_THEME = {
  theme_name: "Demo Premium Leather",
  theme_slug: "demo-premium-leather",
  theme_for: "leather",
  primary: "#7A4E2D", // rich leather brown
  page_bg: "#FAF6F1",
  accent: "#B08D57", // warm tan
  floating: [
    {
      slug: "float-1",
      url: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=300&q=80",
      position: "left",
      align: "top",
      section: "hero",
      animation_type: "float",
      animation_speed: "slow",
      size: "md",
      opacity: 0.85,
    },
    {
      slug: "float-2",
      url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=300&q=80",
      position: "right",
      align: "middle",
      section: "benefits",
      animation_type: "sway",
      animation_speed: "normal",
      size: "sm",
      opacity: 0.8,
    },
    {
      slug: "float-3",
      url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
      position: "right",
      align: "bottom",
      section: "reviews",
      animation_type: "float",
      animation_speed: "slow",
      size: "sm",
      opacity: 0.75,
    },
  ] as const,
};
