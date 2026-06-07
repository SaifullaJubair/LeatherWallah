/* FruitSnacks — mock data */
const CUR = "৳";

const CATEGORIES = [
  { name: "খেজুর", en: "DATES", slug: "khejur", count: 18, tone: "tone-honey" },
  { name: "বাদাম", en: "NUTS", slug: "badam", count: 24, tone: "tone-green" },
  { name: "শুকনো ফল", en: "DRIED FRUITS", slug: "dried-fruit", count: 16, tone: "tone-honey" },
  { name: "মিক্স প্যাক", en: "MIXED PACKS", slug: "mix-pack", count: 12, tone: "tone-green" },
  { name: "গিফট বক্স", en: "GIFT BOXES", slug: "gift-box", count: 9, tone: "tone-honey" },
  { name: "বীজ ও দানা", en: "SEEDS", slug: "seeds", count: 14, tone: "tone-green" },
];

// helper to build a product
function P(o) {
  return Object.assign({
    rating: null, badges: [], is_variation: false, low_stock: false, qty: null, tone: "tone-honey",
  }, o);
}

const PRODUCTS = {
  bestsellers: [
    P({ id: "p1", name: "প্রিমিয়াম ইরানি খেজুর — ৫০০ গ্রাম", cat: "DATES", ph: "ইরানি খেজুর · প্যাক শট", price: 350, was: 500, rating: { avg: 4.8, count: 234 }, badges: ["best"], is_variation: true, var: "৩টি সাইজ", tone: "tone-honey" }),
    P({ id: "p2", name: "কাঁচা কাজু বাদাম — গ্রেড A", cat: "NUTS", ph: "কাজু বাদাম · প্যাক শট", price: 720, was: 850, rating: { avg: 4.9, count: 188 }, badges: ["sale"], low_stock: true, qty: 4, tone: "tone-green" }),
    P({ id: "p3", name: "শুকনো এপ্রিকট — তুর্কি", cat: "DRIED FRUITS", ph: "এপ্রিকট · প্যাক শট", price: 480, was: null, rating: { avg: 4.7, count: 96 }, tone: "tone-honey" }),
    P({ id: "p4", name: "মিক্সড নাটস বক্স — ৪ পদ", cat: "MIXED PACKS", ph: "মিক্সড নাটস · প্যাক শট", price: 650, was: 800, rating: { avg: 4.8, count: 312 }, badges: ["sale"], is_variation: true, var: "৫০০গ / ১কেজি", tone: "tone-green" }),
  ],
  trending: [
    P({ id: "p5", name: "মেডজুল খেজুর — জাম্বো", cat: "DATES", ph: "মেডজুল খেজুর · প্যাক শট", price: 920, was: 1100, rating: { avg: 5.0, count: 142 }, badges: ["sale"], tone: "tone-honey" }),
    P({ id: "p6", name: "রোস্টেড পেস্তা — লবণ ছাড়া", cat: "NUTS", ph: "পেস্তা · প্যাক শট", price: 1150, was: null, rating: { avg: 4.6, count: 73 }, low_stock: true, qty: 6, tone: "tone-green" }),
    P({ id: "p7", name: "ড্রাই ফ্রুট এনার্জি মিক্স", cat: "MIXED PACKS", ph: "এনার্জি মিক্স · প্যাক শট", price: 540, was: 600, rating: { avg: 4.7, count: 205 }, badges: ["sale"], tone: "tone-honey" }),
    P({ id: "p8", name: "কাঠবাদাম (আমন্ড) — ক্যালিফোর্নিয়া", cat: "NUTS", ph: "আমন্ড · প্যাক শট", price: 680, was: 790, rating: { avg: 4.9, count: 268 }, badges: ["sale"], is_variation: true, var: "৩টি সাইজ", tone: "tone-green" }),
  ],
  fresh: [
    P({ id: "p9", name: "শীতকালীন ড্রাই ফ্রুট বক্স", cat: "GIFT BOXES", ph: "গিফট বক্স · প্যাক শট", price: 1450, was: null, badges: ["new"], tone: "tone-honey" }),
    P({ id: "p10", name: "অর্গানিক আখরোট — হাফ", cat: "NUTS", ph: "আখরোট · প্যাক শট", price: 890, was: null, rating: { avg: 4.5, count: 31 }, badges: ["new"], tone: "tone-green" }),
    P({ id: "p11", name: "সানফ্লাওয়ার ও কুমড়োর বীজ", cat: "SEEDS", ph: "বীজ মিক্স · প্যাক শট", price: 320, was: 380, rating: { avg: 4.6, count: 54 }, badges: ["new", "sale"], tone: "tone-honey" }),
    P({ id: "p12", name: "আজওয়া খেজুর — সৌদি", cat: "DATES", ph: "আজওয়া খেজুর · প্যাক শট", price: 1850, was: null, badges: ["new"], low_stock: true, qty: 3, is_variation: true, var: "২৫০গ / ৫০০গ", tone: "tone-honey" }),
  ],
  flash: [
    P({ id: "f1", name: "মিক্সড নাটস বক্স — ফ্যামিলি", cat: "MIXED PACKS", ph: "ফ্যামিলি বক্স · প্যাক শট", price: 560, was: 800, rating: { avg: 4.8, count: 312 }, badges: ["sale"], low_stock: true, qty: 5, tone: "tone-green" }),
    P({ id: "f2", name: "ইরানি খেজুর — ১ কেজি", cat: "DATES", ph: "খেজুর ১কেজি · প্যাক শট", price: 640, was: 950, rating: { avg: 4.7, count: 158 }, badges: ["sale"], low_stock: true, qty: 8, tone: "tone-honey" }),
    P({ id: "f3", name: "কাজু + আমন্ড কম্বো", cat: "NUTS", ph: "কম্বো · প্যাক শট", price: 990, was: 1400, rating: { avg: 4.9, count: 97 }, badges: ["sale"], low_stock: true, qty: 2, tone: "tone-green" }),
    P({ id: "f4", name: "অফিস স্ন্যাক জার — ৫ পদ", cat: "MIXED PACKS", ph: "স্ন্যাক জার · প্যাক শট", price: 720, was: 1000, rating: { avg: 4.6, count: 64 }, badges: ["sale"], tone: "tone-honey" }),
  ],
};

const BUNDLES = [
  { tag: "৩-পণ্য বান্ডল", name: "রমজান স্পেশাল বক্স", price: 1200, was: 1500, save: 300, ph: "রমজান বান্ডল · ফ্ল্যাট-লে" },
  { tag: "৫-পণ্য বান্ডল", name: "অফিস স্ন্যাক কিট", price: 1650, was: 2100, save: 450, ph: "অফিস কিট · ফ্ল্যাট-লে" },
  { tag: "৩-পণ্য বান্ডল", name: "গিফট হ্যাম্পার — প্রিমিয়াম", price: 2400, was: 3000, save: 600, ph: "গিফট হ্যাম্পার · ফ্ল্যাট-লে" },
];

const REVIEWS = [
  { text: "খেজুরগুলো এত তাজা যে মনে হলো এইমাত্র গাছ থেকে এসেছে। প্যাকেজিংও দারুণ যত্নশীল।", name: "রুবিনা আক্তার", loc: "ধানমন্ডি, ঢাকা", init: "রু" },
  { text: "অর্ডার করার পরদিনই পেয়ে গেছি। কাজু বাদামের মান বাজারের চেয়ে অনেক ভালো।", name: "তানভীর হাসান", loc: "চট্টগ্রাম", init: "তা" },
  { text: "মিক্সড নাটস বক্সটা অফিসের জন্য পারফেক্ট। কোনো প্রিজার্ভেটিভের গন্ধ নেই, একদম খাঁটি।", name: "নুসরাত জাহান", loc: "উত্তরা, ঢাকা", init: "নু" },
  { text: "গিফট বক্স পাঠিয়েছিলাম আত্মীয়ের বাসায় — সবাই খুব প্রশংসা করেছে। আবার অর্ডার করবো।", name: "সাকিব রহমান", loc: "সিলেট", init: "সা" },
];

const FAQS = [
  { q: "ডেলিভারি কত দিনে পাবো?", a: "ঢাকার ভেতরে ২৪ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ২-৩ কর্মদিবসের মধ্যে আপনার অর্ডার পৌঁছে যাবে। ৫০০৳ এর বেশি অর্ডারে ঢাকার ভেতর ডেলিভারি সম্পূর্ণ ফ্রি।" },
  { q: "পেমেন্ট অপশন কী কী?", a: "আমরা বিকাশ, নগদ, রকেট, ভিসা ও মাস্টারকার্ড এবং ক্যাশ অন ডেলিভারি গ্রহণ করি। সব অনলাইন পেমেন্ট SSL এনক্রিপশনের মাধ্যমে সুরক্ষিত।" },
  { q: "প্রোডাক্ট পছন্দ না হলে রিটার্ন করা যাবে?", a: "অবশ্যই। ডেলিভারির ৭ দিনের মধ্যে অক্ষত প্যাকেজিং সহ যেকোনো পণ্য রিটার্ন বা এক্সচেঞ্জ করতে পারবেন, কোনো প্রশ্ন ছাড়াই।" },
  { q: "কীভাবে অর্ডার ট্র্যাক করবো?", a: "অর্ডার কনফার্ম হলে আপনার ফোনে একটি ট্র্যাকিং লিংক পাঠানো হবে। চাইলে উপরের 'অর্ডার ট্র্যাক করুন' লিংক থেকেও স্ট্যাটাস দেখতে পারবেন।" },
  { q: "COD এ কি অর্ডার করা যায়?", a: "হ্যাঁ, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। পণ্য হাতে পেয়ে যাচাই করে তারপর পেমেন্ট করতে পারবেন।" },
  { q: "প্রোডাক্ট কতদিন ভালো থাকবে?", a: "প্রতিটি প্যাকে উৎপাদন ও মেয়াদের তারিখ উল্লেখ থাকে। সাধারণত শুকনো ফল ও বাদাম এয়ারটাইট কন্টেইনারে ৬-৯ মাস পর্যন্ত তাজা থাকে।" },
];

const ANNOUNCE = [
  "৫০০৳ অর্ডারে ফ্রি ডেলিভারি ঢাকার ভেতর",
  "নতুন কালেকশন: শীতকালীন ড্রাই ফ্রুট বক্স",
  "আজই অর্ডার করুন, কাল পৌঁছে যাবে",
];

const SEARCH_PLACEHOLDERS = ["খেজুর খুঁজুন...", "মিক্সড নাটস...", "গিফট প্যাক..."];
const RECENT = ["খেজুর", "মিক্সড বাদাম", "গিফট প্যাক"];
const POPULAR = ["অফিস স্ন্যাক", "আজ ডেলিভারি", "৫০০৳ নিচে", "কিডস টিফিন"];

const ALL_PRODUCTS = [].concat(
  PRODUCTS.bestsellers, PRODUCTS.trending, PRODUCTS.fresh, PRODUCTS.flash
);

Object.assign(window, {
  CUR, CATEGORIES, PRODUCTS, BUNDLES, REVIEWS, FAQS,
  ANNOUNCE, SEARCH_PLACEHOLDERS, RECENT, POPULAR, ALL_PRODUCTS,
});
