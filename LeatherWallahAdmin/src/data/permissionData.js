const permissionsData = [
  // E20: Dashboard — revenue data; default false so limited staff can't see it
  {
    Name: "Dashboard",
    Type: [
      { type_name: "View Dashboard (revenue + stats)", type_value: "dashboard_show" },
    ],
  },

  {
    Name: "Page Seo Update",
    Type: [
      { type_name: " Show Page Seo", type_value: "page_seo_show" },
      { type_name: " Update Page Seo", type_value: "page_seo_update" },
    ],
  },
  {
    Name: "Site Setting Update",
    Type: [
      { type_name: " Update Site Setting", type_value: "site_setting_update" },
      // S4+S5 Phase 1A — separate from site_setting_update so general
      // admins cannot rotate CAPI tokens or read SMS/email/courier
      // credentials. Owner / superadmin only by default.
      {
        type_name: "Update Setting Secrets (CAPI tokens, SMS, courier)",
        type_value: "setting_secrets_update",
      },
    ],
  },
  {
    Name: "Review Show And Update",
    Type: [
      {
        type_name: "Review Update",
        type_value: "review_update",
      },
      {
        type_name: "Review Show",
        type_value: "review_show",
      },
      {
        type_name: "Seed Review Bulk Upload",
        type_value: "review_seed_bulk",
      },
      {
        type_name: "Seed Review Manual Add",
        type_value: "review_seed_manual",
      },
    ],
  },

  {
    Name: "Question Show And Update",
    Type: [
      {
        type_name: "Question Update",
        type_value: "question_update",
      },

      {
        type_name: "Question Show",
        type_value: "question_show",
      },
    ],
  },

  {
    Name: "Order Show And Update",
    Type: [
      {
        type_name: "Order Update",
        type_value: "order_update",
      },
      {
        type_name: "Order Show",
        type_value: "order_show",
      },
      // D18: POS admin order create
      {
        type_name: "Create Order (POS)",
        type_value: "order_create_admin",
      },
    ],
  },
  // {
  //   Name: "Offer Order Show And Update",
  //   Type: [
  //     {
  //       type_name: "Offer Order Update",
  //       type_value: "offer_order_update",
  //     },

  //     {
  //       type_name: "Offer Order Show",
  //       type_value: "offer_order_show",
  //     },
  //   ],
  // },

  {
    Name: "Category Create and Update Permission",
    Type: [
      {
        type_name: "Category Show",
        type_value: "category_show",
      },
      {
        type_name: "Create Category",
        type_value: "category_post",
      },
      {
        type_name: "Update Category",
        type_value: "category_update",
      },
      {
        type_name: "Delete Category",
        type_value: "category_delete",
      },
    ],
  },
  {
    Name: "Brand Category Create And Update",
    Type: [
      {
        type_name: "Brand Category Create",
        type_value: "brand_post",
      },
      {
        type_name: "Brand Category Update",
        type_value: "brand_update",
      },
      {
        type_name: "Brand Category Show",
        type_value: "brand_show",
      },
      {
        type_name: "Brand Category Delete",
        type_value: "brand_delete",
      },
    ],
  },

  {
    Name: "Attribute Create And Update",
    Type: [
      {
        type_name: "Attribute Create",
        type_value: "attribute_post",
      },
      {
        type_name: "Attribute Update",
        type_value: "attribute_update",
      },
      {
        type_name: "Attribute Show",
        type_value: "attribute_show",
      },
      {
        type_name: "Attribute Delete",
        type_value: "attribute_delete",
      },
    ],
  },

  // Specification module retired (replaced by the attribute engine) — flags
  // stay in role schema for back-compat but are intentionally NOT grantable.
  // {
  //   Name: "Specification Create And Update",
  //   Type: [
  //     {
  //       type_name: "Specification Create",
  //       type_value: "specification_post",
  //     },
  //     {
  //       type_name: "Specification Update",
  //       type_value: "specification_update",
  //     },
  //     {
  //       type_name: "Specification Show",
  //       type_value: "specification_show",
  //     },
  //     {
  //       type_name: "Specification Delete",
  //       type_value: "specification_delete",
  //     },
  //   ],
  // },

  {
    Name: "Product  Create And Update",
    Type: [
      {
        type_name: "Product Create",
        type_value: "product_create",
      },
      {
        type_name: "Product Update",
        type_value: "product_update",
      },
      {
        type_name: "Product Show",
        type_value: "product_show",
      },
      {
        type_name: "Product Delete",
        type_value: "product_delete",
      },
    ],
  },

  // NOTE: offer_* flags also gate Flash Sale (flashsale.routes.ts uses offer_create/update/delete)
  {
    Name: "Offer Create And Update (also gates Flash Sale)",
    Type: [
      {
        type_name: "Offer Create",
        type_value: "offer_create",
      },
      {
        type_name: "Offer Update",
        type_value: "offer_update",
      },
      {
        type_name: "Offer Show",
        type_value: "offer_show",
      },
      {
        type_name: "Offer Delete",
        type_value: "offer_delete",
      },
    ],
  },

  {
    Name: "Campaign Create And Update",
    Type: [
      {
        type_name: "Campaign Create",
        type_value: "campaign_create",
      },
      {
        type_name: "Campaign Update",
        type_value: "campaign_update",
      },
      {
        type_name: "Campaign Show",
        type_value: "campaign_show",
      },
      {
        type_name: "Campaign Delete",
        type_value: "campaign_delete",
      },
    ],
  },

  {
    Name: "User Create And Update",
    Type: [
      {
        type_name: "User Create",
        type_value: "user_create",
      },
      {
        type_name: "User Update",
        type_value: "user_update",
      },
      {
        type_name: "User Show",
        type_value: "user_show",
      },
      {
        type_name: "User Delete",
        type_value: "user_delete",
      },
    ],
  },

  {
    Name: "Role Create And Update",
    Type: [
      {
        type_name: "Role Create",
        type_value: "role_create",
      },
      {
        type_name: "Role Update",
        type_value: "role_update",
      },
      {
        type_name: "Role Show",
        type_value: "role_show",
      },
      {
        type_name: "Role Delete",
        type_value: "role_delete",
      },
    ],
  },

  {
    Name: "Coupon Create And Update",
    Type: [
      {
        type_name: "Coupon Create",
        type_value: "coupon_create",
      },
      {
        type_name: "Coupon Update",
        type_value: "coupon_update",
      },
      {
        type_name: "Coupon Show",
        type_value: "coupon_show",
      },
      {
        type_name: "Coupon Delete",
        type_value: "coupon_delete",
      },
    ],
  },

  {
    Name: "Banner Create And Update",
    Type: [
      {
        type_name: "Banner Create",
        type_value: "banner_create",
      },
      {
        type_name: "Banner Update",
        type_value: "banner_update",
      },
      {
        type_name: "Banner Show",
        type_value: "banner_show",
      },
      {
        type_name: "Banner Delete",
        type_value: "banner_delete",
      },
    ],
  },

  {
    Name: "Slider Create And Update",
    Type: [
      {
        type_name: "Slider Create",
        type_value: "slider_create",
      },
      {
        type_name: "Slider Update",
        type_value: "slider_update",
      },
      {
        type_name: "Slider Show",
        type_value: "slider_show",
      },
      {
        type_name: "Slider Delete",
        type_value: "slider_delete",
      },
    ],
  },

  {
    Name: "Theme Create And Update",
    Type: [
      { type_name: "Theme Show", type_value: "theme_show" },
      { type_name: "Theme Create", type_value: "theme_create" },
      { type_name: "Theme Update", type_value: "theme_update" },
      { type_name: "Theme Delete", type_value: "theme_delete" },
    ],
  },

  {
    Name: "Demo Data",
    Type: [
      { type_name: "Clear Demo Data", type_value: "demo_data_clear" },
    ],
  },

  {
    Name: "FAQ Template Create And Update",
    Type: [
      { type_name: "FAQ Template Show", type_value: "faq_template_show" },
      { type_name: "FAQ Template Create", type_value: "faq_template_create" },
      { type_name: "FAQ Template Update", type_value: "faq_template_update" },
      { type_name: "FAQ Template Delete", type_value: "faq_template_delete" },
    ],
  },

  {
    Name: "Brand Promise (Trust Points)",
    Type: [
      { type_name: "Trust Point Show", type_value: "trust_point_show" },
      { type_name: "Trust Point Update", type_value: "trust_point_update" },
    ],
  },

  {
    Name: "Customer Create And Update",
    Type: [
      {
        type_name: "Customer Create",
        type_value: "customer_create",
      },
      {
        type_name: "Customer Update",
        type_value: "customer_update",
      },
      {
        type_name: "Customer Show",
        type_value: "customer_show",
      },
      {
        type_name: "Customer Delete",
        type_value: "customer_delete",
      },
    ],
  },

  // M2: Supplier (previously used empty flag — any logged-in admin could CRUD)
  {
    Name: "Supplier Create And Update",
    Type: [
      { type_name: "Supplier Show", type_value: "supplier_show" },
      { type_name: "Supplier Create", type_value: "supplier_create" },
      { type_name: "Supplier Update", type_value: "supplier_update" },
      { type_name: "Supplier Delete", type_value: "supplier_delete" },
    ],
  },

  // M3: Payment Withdraw (previously had NO auth — anyone could submit)
  {
    Name: "Payment Withdraw Create And Update",
    Type: [
      { type_name: "Withdraw Show", type_value: "payment_withdraw_show" },
      { type_name: "Withdraw Create", type_value: "payment_withdraw_create" },
      { type_name: "Withdraw Update", type_value: "payment_withdraw_update" },
      { type_name: "Withdraw Delete", type_value: "payment_withdraw_delete" },
    ],
  },

  // M3: Payment Method (previously had NO auth — anyone could create/edit)
  {
    Name: "Payment Method Create And Update",
    Type: [
      { type_name: "Payment Method Show", type_value: "payment_method_show" },
      { type_name: "Payment Method Create", type_value: "payment_method_create" },
      { type_name: "Payment Method Update", type_value: "payment_method_update" },
      { type_name: "Payment Method Delete", type_value: "payment_method_delete" },
    ],
  },

  // Track D: Site FAQ (Storefront home FAQ section)
  {
    Name: "Site FAQ (Storefront)",
    Type: [
      { type_name: "Site FAQ Show", type_value: "site_faq_show" },
      { type_name: "Site FAQ Create", type_value: "site_faq_post" },
      { type_name: "Site FAQ Update", type_value: "site_faq_update" },
      { type_name: "Site FAQ Delete", type_value: "site_faq_delete" },
    ],
  },

  // Track D: Newsletter Subscribers
  {
    Name: "Newsletter Subscribers",
    Type: [
      { type_name: "Newsletter Show", type_value: "newsletter_show" },
      { type_name: "Newsletter Delete", type_value: "newsletter_delete" },
      { type_name: "Newsletter Export CSV", type_value: "newsletter_export" },
    ],
  },
];

export default permissionsData;
