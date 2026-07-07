// Single source of truth for the content/legal pages: their route, the settings
// key that holds the admin-authored HTML, and the sidebar label. Used by the
// shared PolicyPageLayout for its sidebar nav and by each page component.
export const POLICY_PAGES = [
  { slug: "about-us",            settingKey: "about_us",            label: "About Us",            title: "About Us",            subtitle: "The people, craft and promise behind every pair." },
  { slug: "terms-condition",     settingKey: "terms_condition",     label: "Terms & Conditions",  title: "Terms & Conditions",  subtitle: "The terms that govern your use of our store." },
  { slug: "privacy-policy",      settingKey: "privacy_policy",      label: "Privacy Policy",      title: "Privacy Policy",      subtitle: "How we collect, use and protect your data." },
  { slug: "refund-policy",       settingKey: "refund_policy",       label: "Refund Policy",       title: "Refund Policy",       subtitle: "When and how refunds are processed." },
  { slug: "return-policy",       settingKey: "return_policy",       label: "Return Policy",       title: "Return Policy",       subtitle: "How to return or exchange an item." },
  { slug: "cancel-policy",       settingKey: "cancellation_policy", label: "Cancellation Policy", title: "Cancellation Policy", subtitle: "How and when an order can be cancelled." },
  { slug: "shipping-information",settingKey: "shipping_info",       label: "Shipping Information", title: "Shipping Information", subtitle: "Delivery times, charges and coverage." },
];

export const getPolicyBySlug = (slug) =>
  POLICY_PAGES.find((p) => p.slug === slug);
