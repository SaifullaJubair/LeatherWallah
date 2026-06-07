/* FruitSnacks V2 — "Berry & Bronze" mock data (English) */
const CUR = "৳";

/* ---- Categories ---- */
const CATEGORIES = [
  { name: "Dried Fruits", slug: "dried-fruit", count: 16, tone: "t-plum" },
  { name: "Nuts & Seeds", slug: "nuts-seeds", count: 24, tone: "t-bronze" },
  { name: "Mixed Collection", slug: "mix", count: 12, tone: "t-coral" },
  { name: "Gift Boxes", slug: "gift-box", count: 9, tone: "t-plum" },
  { name: "Premium Range", slug: "premium", count: 14, tone: "t-bronze" },
  { name: "Healthy Snacks", slug: "healthy", count: 18, tone: "t-coral" },
];

/* ---- Nested 3-level mega menu ---- */
const MEGA = {
  SHOP: {
    promo: { eyebrow: "LIMITED EDITION", title: "Winter Collection", sub: "Save up to 25%", tone: "t-plum", ph: "Winter Collection" },
    parents: [
      { name: "Dried Fruits", subs: [
        { name: "Mango Range", kids: ["Slices", "Cubes", "Whole", "Strips"] },
        { name: "Apricot Range", kids: ["Turkish", "Soft", "Pitted"] },
        { name: "Date Range", kids: ["Medjool", "Ajwa", "Iranian", "Mariami"] },
        { name: "Berry Range", kids: ["Cranberry", "Blueberry", "Goji"] },
      ]},
      { name: "Nuts & Seeds", subs: [
        { name: "Cashew Range", kids: ["Raw", "Roasted", "Salted"] },
        { name: "Almond Range", kids: ["California", "Mamra", "Sliced"] },
        { name: "Pistachio Range", kids: ["Salted", "Saffron", "Shelled"] },
        { name: "Seed Mixes", kids: ["Sunflower", "Pumpkin", "Chia"] },
      ]},
      { name: "Mixed Boxes", subs: [
        { name: "Office Jars", kids: ["3-piece", "5-piece"] },
        { name: "Energy Mixes", kids: ["Trail", "Protein", "Kids"] },
      ]},
      { name: "Gift Sets", subs: [
        { name: "Festive Hampers", kids: ["Eid", "Wedding", "Corporate"] },
        { name: "Mini Editions", kids: ["Tasting", "Sampler"] },
      ]},
      { name: "Healthy Snacks", subs: [
        { name: "No-Sugar", kids: ["Bars", "Bites"] },
        { name: "Roasted", kids: ["Chana", "Makhana"] },
      ]},
      { name: "Premium Collection", subs: [
        { name: "Single Origin", kids: ["Iran", "Turkey", "California"] },
        { name: "Atelier Reserve", kids: ["Numbered", "Seasonal"] },
      ]},
    ],
  },
  COLLECTIONS: {
    promo: { eyebrow: "GIFTING", title: "Eid Gift Boxes", sub: "Wrapped & ribboned", tone: "t-bronze", ph: "Eid Gift Boxes" },
    parents: [
      { name: "Seasonal Edits", subs: [
        { name: "Winter Wonders", kids: ["7-piece", "Velvet Box"] },
        { name: "Ramadan Selection", kids: ["Iftar Box", "Date Tray"] },
      ]},
      { name: "By Occasion", subs: [
        { name: "Weddings", kids: ["Favours", "Hampers"] },
        { name: "Corporate", kids: ["Bulk", "Branded"] },
      ]},
      { name: "Atelier Reserve", subs: [
        { name: "Numbered Boxes", kids: ["No. 01", "No. 02"] },
        { name: "Tasting Flights", kids: ["Trio", "Quintet"] },
      ]},
    ],
  },
};

/* helper to build a product */
function P(o) {
  return Object.assign({
    rating: null, badges: [], is_variation: false, low_stock: false, qty: null,
    tone: "t-bronze", growth: null, varlabel: null,
  }, o);
}

const PRODUCTS = {
  bestsellers: [
    P({ id: "p1", name: "Premium Iranian Dates", cat: "Dates", ph: "Iranian Dates", price: 350, was: 500, rating: { avg: 4.8, count: 234 }, badges: ["best"], is_variation: true, varlabel: "3 sizes", tone: "t-plum" }),
    P({ id: "p2", name: "Raw Cashew Nuts — Grade A", cat: "Nuts", ph: "Cashew Nuts", price: 720, was: 850, rating: { avg: 4.9, count: 188 }, badges: ["sale"], low_stock: true, qty: 4, tone: "t-bronze" }),
    P({ id: "p3", name: "Turkish Dried Apricots", cat: "Dried Fruits", ph: "Dried Apricots", price: 480, rating: { avg: 4.7, count: 96 }, tone: "t-coral" }),
    P({ id: "p4", name: "Mixed Nuts Box — 4 Kinds", cat: "Mixed", ph: "Mixed Nuts", price: 650, was: 800, rating: { avg: 4.8, count: 312 }, badges: ["sale"], is_variation: true, varlabel: "2 sizes", tone: "t-plum" }),
  ],
  trending: [
    P({ id: "p5", name: "Medjool Dates — Jumbo", cat: "Dates", ph: "Medjool Dates", price: 920, was: 1100, rating: { avg: 5.0, count: 142 }, badges: ["sale"], growth: 31, tone: "t-plum" }),
    P({ id: "p6", name: "Roasted Pistachios — Unsalted", cat: "Nuts", ph: "Pistachios", price: 1150, rating: { avg: 4.6, count: 73 }, low_stock: true, qty: 6, growth: 23, tone: "t-bronze" }),
    P({ id: "p7", name: "Dry Fruit Energy Mix", cat: "Mixed", ph: "Energy Mix", price: 540, was: 600, rating: { avg: 4.7, count: 205 }, badges: ["sale"], growth: 18, tone: "t-coral" }),
    P({ id: "p8", name: "Almonds — California", cat: "Nuts", ph: "Almonds", price: 680, was: 790, rating: { avg: 4.9, count: 268 }, badges: ["sale"], is_variation: true, varlabel: "3 sizes", growth: 12, tone: "t-bronze" }),
  ],
  foryou: [
    P({ id: "y1", name: "Pistachio Saffron Mix", cat: "Premium", ph: "Pistachio Saffron", price: 850, rating: { avg: 4.9, count: 64 }, badges: ["new"], tone: "t-bronze" }),
    P({ id: "y2", name: "Royal Date Selection", cat: "Gift Boxes", ph: "Royal Date Box", price: 1200, rating: { avg: 4.8, count: 121 }, badges: ["best"], is_variation: true, varlabel: "2 sizes", tone: "t-plum" }),
    P({ id: "y3", name: "Organic Walnuts — Halves", cat: "Nuts", ph: "Walnuts", price: 890, rating: { avg: 4.5, count: 31 }, tone: "t-coral" }),
    P({ id: "y4", name: "Cranberry & Goji Berries", cat: "Dried Fruits", ph: "Berry Mix", price: 620, was: 720, rating: { avg: 4.7, count: 88 }, badges: ["sale"], tone: "t-bronze" }),
  ],
  editor: [
    P({ id: "e1", name: "Ajwa Dates — Saudi", cat: "Premium", ph: "Ajwa Dates", price: 1850, rating: { avg: 5.0, count: 142 }, badges: ["editor"], is_variation: true, varlabel: "2 sizes", tone: "t-plum" }),
    P({ id: "e2", name: "Macadamia — Salted", cat: "Nuts", ph: "Macadamia", price: 1480, rating: { avg: 4.9, count: 57 }, badges: ["editor"], tone: "t-bronze" }),
    P({ id: "e3", name: "Single-Origin Figs", cat: "Dried Fruits", ph: "Figs", price: 980, rating: { avg: 4.8, count: 73 }, badges: ["editor"], tone: "t-coral" }),
    P({ id: "e4", name: "Atelier Reserve Box", cat: "Gift Boxes", ph: "Reserve Box", price: 2400, rating: { avg: 5.0, count: 41 }, badges: ["editor"], is_variation: true, varlabel: "Numbered", tone: "t-plum" }),
  ],
  fresh: [
    P({ id: "n1", name: "Winter Dry Fruit Box", cat: "Gift Boxes", ph: "Gift Box", price: 1450, badges: ["new"], tone: "t-plum" }),
    P({ id: "n2", name: "Chia & Flax Seed Mix", cat: "Seeds", ph: "Seed Mix", price: 420, badges: ["new"], tone: "t-coral" }),
    P({ id: "n3", name: "Honey-Roasted Cashews", cat: "Nuts", ph: "Honey Cashews", price: 760, badges: ["new"], low_stock: true, qty: 5, tone: "t-bronze" }),
    P({ id: "n4", name: "Blueberries — Freeze-Dried", cat: "Dried Fruits", ph: "Blueberries", price: 1120, badges: ["new"], tone: "t-plum" }),
  ],
  flash: [
    P({ id: "f1", name: "Mixed Nuts Box — Family", cat: "Mixed", ph: "Family Box", price: 560, was: 800, rating: { avg: 4.8, count: 312 }, badges: ["sale"], low_stock: true, qty: 5, tone: "t-bronze" }),
    P({ id: "f2", name: "Iranian Dates — 1 kg", cat: "Dates", ph: "Dates 1kg", price: 640, was: 950, rating: { avg: 4.7, count: 158 }, badges: ["sale"], low_stock: true, qty: 8, tone: "t-plum" }),
    P({ id: "f3", name: "Cashew + Almond Combo", cat: "Nuts", ph: "Combo Pack", price: 990, was: 1400, rating: { avg: 4.9, count: 97 }, badges: ["sale"], low_stock: true, qty: 2, tone: "t-coral" }),
    P({ id: "f4", name: "Office Snack Jar — 5 Kinds", cat: "Mixed", ph: "Snack Jar", price: 720, was: 1000, rating: { avg: 4.6, count: 64 }, badges: ["sale"], tone: "t-bronze" }),
  ],
};

/* Category spotlight: 1 feature + 3 standard */
const SPOTLIGHT = {
  category: "Dates",
  feature: P({ id: "sp1", name: "Medjool Reserve — Gift Tin", cat: "Dates", ph: "Medjool Reserve Tin", price: 1650, was: 1950, rating: { avg: 5.0, count: 88 }, badges: ["best"], is_variation: true, varlabel: "3 sizes", tone: "t-plum", note: "A staff favourite — pairs beautifully with afternoon tea." }),
  side: [
    P({ id: "sp2", name: "Iranian Mariami Dates", cat: "Dates", ph: "Mariami Dates", price: 540, was: 640, rating: { avg: 4.8, count: 121 }, badges: ["sale"], tone: "t-bronze" }),
    P({ id: "sp3", name: "Sukkari Dates — Soft", cat: "Dates", ph: "Sukkari Dates", price: 720, rating: { avg: 4.7, count: 64 }, tone: "t-coral" }),
    P({ id: "sp4", name: "Amber Dates — Premium", cat: "Dates", ph: "Amber Dates", price: 1280, rating: { avg: 4.9, count: 53 }, low_stock: true, qty: 4, tone: "t-plum" }),
  ],
};

const BUNDLES = [
  { tag: "3-Piece Edit", name: "Ramadan Special Box", price: 1200, was: 1500, save: 300, ph: "Ramadan Bundle · Flat-lay", tone: "t-plum" },
  { tag: "5-Piece Edit", name: "Office Snack Kit", price: 1650, was: 2100, save: 450, ph: "Office Kit · Flat-lay", tone: "t-bronze" },
  { tag: "3-Piece Edit", name: "Gift Hamper — Premium", price: 2400, was: 3000, save: 600, ph: "Gift Hamper · Flat-lay", tone: "t-coral" },
];

/* Hero slides */
const HERO_SLIDES = [
  { eyebrow: "NEW · FW 2025 COLLECTION", line1: "The Art of", accent: "Indulgence.", sub: "Hand-curated dried fruits and nuts — because every quiet moment deserves something extraordinary.", ph: "Flat-lay · Velvet Dates", tone: "t-plum" },
  { eyebrow: "ATELIER RESERVE", line1: "Sourced by", accent: "Hand.", sub: "From a single grove in Bam to your table — examined, tasted, approved. Nothing reaches you we wouldn't serve our own.", ph: "Flat-lay · Nuts & Berries", tone: "t-bronze" },
  { eyebrow: "LIMITED · WINTER EDIT", line1: "Seasonal", accent: "Wonders.", sub: "A seven-piece curation of winter flavours, wrapped in tissue and tied with ribbon. Available through January only.", ph: "Flat-lay · Winter Box", tone: "t-coral" },
  { eyebrow: "GIFTING, ELEVATED", line1: "Wrapped with", accent: "Devotion.", sub: "Couture gift boxes for the people who buy themselves flowers on Friday. Complimentary luxury wrap on every order.", ph: "Flat-lay · Gift Hamper", tone: "t-plum" },
];

const HERO_CARDS = [
  { eyebrow: "★ BESTSELLER", title: "Royal Date Selection", price: "From ৳ 1,200", ph: "Royal Date Box · Pack shot", tone: "t-bronze", grad: "shimmer" },
  { eyebrow: "JUST DROPPED", title: "Pistachio Saffron Mix", price: "৳ 850", ph: "Pistachio Saffron · Pack shot", tone: "t-plum", grad: "ink" },
];

const REVIEWS = [
  { text: "The dates were so fresh they tasted like they came straight off the tree. And the packaging — so thoughtful, like unwrapping a gift.", name: "Rubina Akter", loc: "Dhanmondi, Dhaka", init: "R" },
  { text: "Arrived the very next day after ordering. The cashew quality is far better than the market — I haven't found this anywhere else.", name: "Tanvir Hasan", loc: "Chittagong", init: "T" },
  { text: "The mixed nuts box is perfect for the office. No preservative smell at all — pure, honest flavour through and through.", name: "Nusrat Jahan", loc: "Uttara, Dhaka", init: "N" },
  { text: "I sent a gift box to a relative's home — everyone was full of praise. The packaging left them stunned. I'll be ordering again.", name: "Sakib Rahman", loc: "Sylhet", init: "S" },
];

const FAQS = [
  { q: "What does same-day delivery actually mean?", a: "Order before 2 PM inside Dhaka and your box is hand-packed and dispatched the same day, arriving within hours. Outside Dhaka takes 2–3 working days. Orders above ৳ 1,500 ship free inside Dhaka." },
  { q: "How long until I receive my delivery?", a: "Inside Dhaka, your order arrives within 24 hours; outside Dhaka, within 2–3 working days. Orders above ৳ 1,500 ship completely free inside Dhaka." },
  { q: "How do I return a product?", a: "Within 7 days of delivery, return or exchange any item with its packaging intact — no questions asked. Reach us on WhatsApp and we'll arrange a pickup." },
  { q: "Do you ship outside Bangladesh?", a: "Not yet — we currently deliver within Bangladesh only. International gifting is on our roadmap for 2026; join the atelier list to be the first to know." },
  { q: "How long do the products stay fresh?", a: "Every pack is marked with its production and expiry dates. Generally, dried fruits and nuts stay fresh for 6–9 months in an airtight container." },
  { q: "How does the loyalty program work?", a: "Every ৳ 100 spent earns you 1 Atelier Point. Points unlock early access to limited editions, subscriber-only pricing, and complimentary upgrades on gift wrap." },
];

const ANNOUNCE = [
  "Free premium packaging on orders over ৳ 1,500",
  "New: Winter limited-edition box",
  "Student discount 10% — code: STUDY",
];

const SEARCH_PLACEHOLDERS = ["Search the atelier…", "Medjool dates…", "Pistachio saffron…"];
const RECENT = ["Dates", "Mixed nuts", "Gift box"];
const POPULAR = ["Office snack", "Same-day", "Under ৳500", "Saffron mix"];

/* Short descriptions + attributes per category for Quick View */
const DESC = {
  "Dates": "Hand-picked premium dates — soft, succulent and naturally sweet. No preservatives, ever.",
  "Nuts": "Freshly roasted Grade-A nuts. Crunchy, full of flavour and nutrition, sealed in an airtight pack.",
  "Dried Fruits": "Naturally sun-dried fruit — true taste and colour retained, with no added sugar or dye.",
  "Mixed": "A carefully composed mixed collection — ideal for the office, tiffin or welcoming guests.",
  "Premium": "Atelier Reserve — a limited, single-origin selection of our very finest.",
  "Gift Boxes": "Wrapped in tissue, tied with ribbon — a premium gift box made to be given.",
  "Seeds": "A natural seed blend rich in protein and fibre — your companion for healthy snacking.",
};
const ATTRS = {
  "Dates": [["Origin", "Iran / Saudi"], ["Shelf life", "6–9 months"], ["Packaging", "Airtight"]],
  "Nuts": [["Grade", "Grade A"], ["Roast", "Unsalted"], ["Shelf life", "6 months"]],
  "Dried Fruits": [["Process", "Sun-dried"], ["Sugar", "None added"], ["Shelf life", "9 months"]],
  "Mixed": [["Items", "4–5 kinds"], ["Shelf life", "6 months"], ["Best for", "Office / tiffin"]],
  "Premium": [["Series", "Atelier Reserve"], ["Origin", "Single-origin"], ["Quantity", "Limited"]],
  "Gift Boxes": [["Wrap", "Luxury packaging"], ["Card", "Personal message"], ["Occasion", "Any"]],
  "Seeds": [["Blend", "3 seed types"], ["Process", "Natural"], ["Shelf life", "6 months"]],
};

const ALL_PRODUCTS = [].concat(
  PRODUCTS.bestsellers, PRODUCTS.trending, PRODUCTS.foryou,
  PRODUCTS.editor, PRODUCTS.fresh, PRODUCTS.flash
);

Object.assign(window, {
  CUR, CATEGORIES, MEGA, PRODUCTS, SPOTLIGHT, BUNDLES, HERO_SLIDES, HERO_CARDS,
  REVIEWS, FAQS, ANNOUNCE, SEARCH_PLACEHOLDERS, RECENT, POPULAR, ALL_PRODUCTS,
  DESC, ATTRS,
});
