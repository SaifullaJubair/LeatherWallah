// Permission checkboxes for the staff-role form, grouped to mirror the sidebar.
//
// The list used to be a flat run of modules in the order they were built, so
// granting someone "everything marketing" meant hunting Offer, Campaign, Coupon
// and Banner out of a wall of checkboxes. It now follows the sidebar's own
// sections — pick the section a staff member works in, tick what's inside it.
//
// `section` is the sidebar dropdown the group's pages live under. Keep the two in
// step: if a page moves in SideNavBar.jsx, move its group here too, or the form
// starts lying about where a permission takes effect.
//
// `hint` names the OTHER pages a flag opens, when the flag is named after only
// one of them (order_show also opens the courier screens; site_setting_update
// also opens Warehouses). Without it those pages look like they have no
// permission at all.
//
// Dropped from this list because nothing on the server enforces them and no page
// sits behind them: customer_* (the Customers page reads /user, guarded by
// user_*), offer_order_* (offer orders merged into the orders module),
// specification_* (module retired for the attribute engine), payment_withdraw_*
// (no admin page exists). The flags stay in the role schema for back-compat, so
// existing roles are unaffected — they simply stop being offered as checkboxes.
const permissionsData = [
  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    section: "Dashboard",
    Name: "Dashboard",
    Type: [
      {
        type_name: "View Dashboard (revenue + stats)",
        type_value: "dashboard_show",
      },
    ],
  },

  // ── Catalog ────────────────────────────────────────────────────────────────
  {
    section: "Catalog",
    Name: "Product",
    Type: [
      { type_name: "Product Show", type_value: "product_show" },
      { type_name: "Product Create", type_value: "product_create" },
      { type_name: "Product Update", type_value: "product_update" },
      { type_name: "Product Delete", type_value: "product_delete" },
    ],
  },
  {
    section: "Catalog",
    Name: "Category",
    Type: [
      { type_name: "Category Show", type_value: "category_show" },
      { type_name: "Category Create", type_value: "category_post" },
      { type_name: "Category Update", type_value: "category_update" },
      { type_name: "Category Delete", type_value: "category_delete" },
    ],
  },
  {
    section: "Catalog",
    Name: "Brand",
    Type: [
      { type_name: "Brand Show", type_value: "brand_show" },
      { type_name: "Brand Create", type_value: "brand_post" },
      { type_name: "Brand Update", type_value: "brand_update" },
      { type_name: "Brand Delete", type_value: "brand_delete" },
    ],
  },
  {
    section: "Catalog",
    Name: "Attribute",
    Type: [
      { type_name: "Attribute Show", type_value: "attribute_show" },
      { type_name: "Attribute Create", type_value: "attribute_post" },
      { type_name: "Attribute Update", type_value: "attribute_update" },
      { type_name: "Attribute Delete", type_value: "attribute_delete" },
    ],
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  {
    section: "Orders",
    Name: "Orders",
    hint: "Order Show also opens Steadfast, Pathao, Fraud Check and Abandoned Carts.",
    Type: [
      { type_name: "Order Show", type_value: "order_show" },
      { type_name: "Order Update", type_value: "order_update" },
      { type_name: "Create Order (POS)", type_value: "order_create_admin" },
    ],
  },

  // ── Marketing ──────────────────────────────────────────────────────────────
  {
    section: "Marketing",
    Name: "Offer & Flash Sale",
    hint: "Flash Sale is covered by these — it has no separate permission.",
    Type: [
      { type_name: "Offer Show", type_value: "offer_show" },
      { type_name: "Offer Create", type_value: "offer_create" },
      { type_name: "Offer Update", type_value: "offer_update" },
      { type_name: "Offer Delete", type_value: "offer_delete" },
    ],
  },
  {
    section: "Marketing",
    Name: "Campaign",
    Type: [
      { type_name: "Campaign Show", type_value: "campaign_show" },
      { type_name: "Campaign Create", type_value: "campaign_create" },
      { type_name: "Campaign Update", type_value: "campaign_update" },
      { type_name: "Campaign Delete", type_value: "campaign_delete" },
    ],
  },
  {
    section: "Marketing",
    Name: "Coupon",
    Type: [
      { type_name: "Coupon Show", type_value: "coupon_show" },
      { type_name: "Coupon Create", type_value: "coupon_create" },
      { type_name: "Coupon Update", type_value: "coupon_update" },
      { type_name: "Coupon Delete", type_value: "coupon_delete" },
    ],
  },
  {
    section: "Marketing",
    Name: "Banner",
    Type: [
      { type_name: "Banner Show", type_value: "banner_show" },
      { type_name: "Banner Create", type_value: "banner_create" },
      { type_name: "Banner Update", type_value: "banner_update" },
      { type_name: "Banner Delete", type_value: "banner_delete" },
    ],
  },
  {
    section: "Marketing",
    Name: "Slider",
    Type: [
      { type_name: "Slider Show", type_value: "slider_show" },
      { type_name: "Slider Create", type_value: "slider_create" },
      { type_name: "Slider Update", type_value: "slider_update" },
      { type_name: "Slider Delete", type_value: "slider_delete" },
    ],
  },

  // ── Customers ──────────────────────────────────────────────────────────────
  // The Customers page reads and writes /user, which the backend guards with the
  // user_* flags — so those are the ones that decide what a staff member can do
  // here. There used to be a parallel customer_* set that only hid buttons in the
  // admin UI: tick "Customer Show" alone and the menu appeared but the page 401'd;
  // tick "User Show" alone and the API worked while the menu stayed hidden.
  {
    section: "Customers",
    Name: "Customers & Staff Users",
    hint: "User Show also opens Wishlists, Loyalty Points, Wallet, and the Staff list.",
    Type: [
      { type_name: "User Show", type_value: "user_show" },
      { type_name: "User Create", type_value: "user_create" },
      { type_name: "User Update", type_value: "user_update" },
      { type_name: "User Delete", type_value: "user_delete" },
    ],
  },
  {
    section: "Customers",
    Name: "Review",
    Type: [
      { type_name: "Review Show", type_value: "review_show" },
      { type_name: "Review Update", type_value: "review_update" },
      { type_name: "Seed Review — Bulk Upload", type_value: "review_seed_bulk" },
      { type_name: "Seed Review — Manual Add", type_value: "review_seed_manual" },
    ],
  },
  {
    section: "Customers",
    Name: "Question",
    Type: [
      { type_name: "Question Show", type_value: "question_show" },
      { type_name: "Question Update", type_value: "question_update" },
    ],
  },

  // ── Content ────────────────────────────────────────────────────────────────
  {
    section: "Content",
    Name: "Theme",
    Type: [
      { type_name: "Theme Show", type_value: "theme_show" },
      { type_name: "Theme Create", type_value: "theme_create" },
      { type_name: "Theme Update", type_value: "theme_update" },
      { type_name: "Theme Delete", type_value: "theme_delete" },
    ],
  },
  {
    section: "Content",
    Name: "FAQ Template",
    Type: [
      { type_name: "FAQ Template Show", type_value: "faq_template_show" },
      { type_name: "FAQ Template Create", type_value: "faq_template_create" },
      { type_name: "FAQ Template Update", type_value: "faq_template_update" },
      { type_name: "FAQ Template Delete", type_value: "faq_template_delete" },
    ],
  },
  {
    section: "Content",
    Name: "Site FAQ (Storefront)",
    Type: [
      { type_name: "Site FAQ Show", type_value: "site_faq_show" },
      { type_name: "Site FAQ Create", type_value: "site_faq_post" },
      { type_name: "Site FAQ Update", type_value: "site_faq_update" },
      { type_name: "Site FAQ Delete", type_value: "site_faq_delete" },
    ],
  },
  {
    section: "Content",
    Name: "Brand Promise (Trust Points)",
    Type: [
      { type_name: "Trust Point Show", type_value: "trust_point_show" },
      { type_name: "Trust Point Update", type_value: "trust_point_update" },
    ],
  },
  {
    section: "Content",
    Name: "Newsletter Subscribers",
    Type: [
      { type_name: "Newsletter Show", type_value: "newsletter_show" },
      { type_name: "Newsletter Delete", type_value: "newsletter_delete" },
      { type_name: "Newsletter Export CSV", type_value: "newsletter_export" },
    ],
  },

  // ── Inventory ──────────────────────────────────────────────────────────────
  {
    section: "Inventory",
    Name: "Supplier",
    Type: [
      { type_name: "Supplier Show", type_value: "supplier_show" },
      { type_name: "Supplier Create", type_value: "supplier_create" },
      { type_name: "Supplier Update", type_value: "supplier_update" },
      { type_name: "Supplier Delete", type_value: "supplier_delete" },
    ],
  },
  {
    // Warehouses sits under Inventory in the sidebar but its routes are guarded
    // by site_setting_update, the same flag as Site Settings. Listing it here as
    // well as under Settings is deliberate — the checkbox is the same one either
    // way, and someone granting "inventory access" should see that this page
    // comes with the settings flag rather than find it missing.
    section: "Inventory",
    Name: "Warehouses",
    hint: "Shares the Site Settings permission — ticking it here also grants Site Settings.",
    Type: [
      { type_name: "Update Site Setting", type_value: "site_setting_update" },
    ],
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  {
    section: "Settings",
    Name: "Site Settings",
    hint: "Also opens Warehouses (Inventory).",
    Type: [
      { type_name: "Update Site Setting", type_value: "site_setting_update" },
      // Separate from site_setting_update so a general admin cannot rotate CAPI
      // tokens or read the SMS / email / courier credentials. Owner only.
      {
        type_name: "Update Setting Secrets (CAPI tokens, SMS, courier)",
        type_value: "setting_secrets_update",
      },
    ],
  },
  {
    section: "Settings",
    Name: "Page SEO",
    Type: [
      { type_name: "Page SEO Show", type_value: "page_seo_show" },
      { type_name: "Page SEO Update", type_value: "page_seo_update" },
    ],
  },
  {
    section: "Settings",
    Name: "Payment Methods",
    Type: [
      { type_name: "Payment Method Show", type_value: "payment_method_show" },
      { type_name: "Payment Method Create", type_value: "payment_method_create" },
      { type_name: "Payment Method Update", type_value: "payment_method_update" },
      { type_name: "Payment Method Delete", type_value: "payment_method_delete" },
    ],
  },
  {
    section: "Settings",
    Name: "Demo Data",
    Type: [{ type_name: "Clear Demo Data", type_value: "demo_data_clear" }],
  },

  // ── Staff ──────────────────────────────────────────────────────────────────
  // Staff list itself is gated by user_show (granted under Customers above) —
  // the two share the /user endpoint.
  {
    section: "Staff",
    Name: "Staff Roles",
    Type: [
      { type_name: "Role Show", type_value: "role_show" },
      { type_name: "Role Create", type_value: "role_create" },
      { type_name: "Role Update", type_value: "role_update" },
      { type_name: "Role Delete", type_value: "role_delete" },
    ],
  },
];

// Sidebar order. The form renders sections in this order; anything with an
// unknown `section` falls to the end rather than disappearing.
export const PERMISSION_SECTIONS = [
  "Dashboard",
  "Catalog",
  "Orders",
  "Marketing",
  "Customers",
  "Content",
  "Inventory",
  "Settings",
  "Staff",
];

export default permissionsData;
