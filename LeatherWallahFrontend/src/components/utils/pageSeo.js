// src/components/utils/pageSeo.js
// ✅ SEO for every static page in one place
// To rebrand, change only the values in this file
// ⚠️ Do NOT hardcode the site name in descriptions — buildPageMeta injects siteName

export const PAGE_SEO = {
  home: {
    // English fallback — admin overrides via /page-seo "home" entry
    // for actual product-line copy (replaces this for each clone).
    title: "Premium Leather Footwear | Fast Cash on Delivery",
    description:
      "Shop our premium genuine-leather footwear collection. Fast home delivery and cash on delivery across Bangladesh.",
    path: "",
  },
  allProducts: {
    title:
      "All Products | Shop Genuine Leather Footwear | Oxfords, Loafers & Boots",
    description:
      "Explore our full leather footwear collection. Buy premium Oxfords, loafers, sneakers and boots at the best prices, with home delivery across Bangladesh.",
    path: "all-products",
    noIndex: true,
  },
  allTrending: {
    title: "Trending Products | Best-Selling Leather Shoes",
    description:
      "Discover our most popular, trending leather footwear. Customer-favourite Oxfords, loafers and boots, all in one place.",
    path: "all-trending-products",
    noIndex: true,
  },
  newArrival: {
    title: "New Arrival Leather Collection | Latest Shoes & Boots",
    description:
      "Just landed — the newest leather footwear designs. Pick your favourite from our latest Oxfords, loafers, sneakers and boots.",
    path: "new-arrival",
    noIndex: true,
  },
  topProduct: {
    title: "Top Rated Leather Footwear | Premium Quality Selection",
    description:
      "Our best-selling, top-rated leather footwear. Browse our finest-quality Oxfords, loafers and boots.",
    path: "top-product",
    noIndex: true,
  },
  latestProduct: {
    title: "Latest Leather Footwear | Just Launched Collection",
    description:
      "New and exclusive leather footwear built with the finest blend of style and craftsmanship. See our latest Oxfords and boots.",
    path: "latest-product",
    noIndex: true,
  },
  aboutUs: {
    title: "About Our Brand | Trusted Leather Footwear Shop in BD",
    description:
      "A trusted name for genuine-leather footwear in Bangladesh. Learn about the quality and craftsmanship behind our shoes and boots.",
    path: "about-us",
  },
  privacyPolicy: {
    title: "Privacy Policy | Security & Data Protection",
    description:
      "Protecting your personal information is our highest priority. Read the details of our privacy policy here.",
    path: "privacy-policy",
  },
  returnPolicy: {
    title: "Return & Exchange Policy | Easy & Fast Returns",
    description:
      "Easy returns and exchanges if anything is wrong when your order arrives. Read the details of our return policy.",
    path: "return-policy",
  },
  refundPolicy: {
    title: "Refund Policy | Secure Refund Process",
    description:
      "Find detailed information about our refund policy and the money-back process here.",
    path: "refund-policy",
  },
  cancelPolicy: {
    title: "Order Cancellation Policy | Shopping Terms",
    description:
      "Learn the rules and terms for cancelling an order in detail.",
    path: "cancel-policy",
  },
  shippingInfo: {
    title: "Shipping & Delivery Information | Fast Home Delivery",
    description:
      "Fast delivery across Bangladesh! Find all the details on shipping charges, delivery times and courier services here.",
    path: "shipping-information",
  },
  termsCondition: {
    title: "Terms & Conditions | Shopping Rules",
    description:
      "Read the detailed rules and terms for shopping on our website.",
    path: "terms-condition",
  },
  // ── Private pages — noindex ────────────────────────────
  signIn: {
    title: "Login to Your Account",
    description: "",
    path: "sign-in",
    noIndex: true,
  },
  signUp: {
    title: "Create a New Account",
    description: "",
    path: "sign-up",
    noIndex: true,
  },
  checkout: {
    title: "Checkout",
    description: "",
    path: "checkout",
    noIndex: true,
  },
  "order-tracking": {
    title: "Order Tracking",
    description: "Track your order status — enter your invoice ID to see live delivery progress.",
    path: "orders/order-tracking",
    noIndex: true,
  },
  wishlist: {
    title: "Your Wishlist | Favourite Leather Footwear",
    description: "",
    path: "wishlist",
    noIndex: true,
  },
  verify: {
    title: "Verify Your Account",
    description: "",
    path: "verify",
    noIndex: true,
  },
  changePassword: {
    title: "Change Your Password",
    description: "",
    path: "change-password",
    noIndex: true,
  },
  forgetPassword: {
    title: "Reset Your Password",
    description: "",
    path: "forget-password",
    noIndex: true,
  },
  setPassowrd: {
    title: "Set Your Password",
    description: "",
    path: "set-password",
    noIndex: true,
  },
  offer: {
    title: "Special Offers & Discounts",
    description:
      "Grab the latest deals, bundles and discounts. Limited-time offers with cash on delivery.",
    path: "offer",
    noIndex: false, // public offers page — should be indexed
  },
  orders: {
    title: "Order History | Track Your Orders",
    description: "",
    path: "orders",
    noIndex: true,
  },
  orderSuccess: {
    title: "Order Successful | Thank You!",
    description: "",
    path: "order-success",
    noIndex: true,
  },
  shop: {
    title: "Shop All Products",
    description:
      "Browse our full product collection. Quality items at the best price with fast cash on delivery.",
    path: "shop",
    noIndex: false, // main product-listing page — must be indexed
  },
};

/**
 * Need to add more pages
 * all-brands page
 * all-brands/brand-product
 * all-brands/brand-product/[id]
 * all-ecommerce-product
 * campaign
 * campaign/[id]
 * checkout
 * compare
 * offer/[id]
 * orders/order-tracking/page.js
 * orders/order-tracking/[id]/page.jsx
 * verify  Page
 * src/app/(user-profile)/user-profile/page.jsx
 */
