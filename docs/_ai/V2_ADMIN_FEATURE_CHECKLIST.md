# FruitSnacks Admin — V2 Rebuild Feature Checklist

> **Purpose:** complete feature inventory of the LIVE FruitSnacks admin panel so the V2 Next.js
> App Router rebuild (in `ecommerce-core/ecommerce-core-web`) loses NOTHING — every page, every
> smart-UX nicety, every reusable component, with exact reference file paths under
> `c:\Coding\Perosnal\FruitSnacks\FruitSnacksAdmin`. Generated 2026-06-25 (session 56) by a
> read-only exploration agent. See [[v2-branch-and-staging-model]] for the rebuild strategy.
>
> Source app: React 18 + Vite + React Router 6 + TanStack Query 5 + RHF + Tailwind, SPA port 3001,
> cookie auth `fruit_snacks_token`.
> Router: `src/routes/Route.jsx` · Nav: `src/shared/SideNavBar/SideNavBar.jsx` · Auth:
> `src/context/AuthProvider.jsx` · Settings ctx: `src/context/SettingProvider.jsx` · Layout:
> `src/layout/DashboardLayout.jsx` · Private gate: `src/routes/privateRoute/PrivateRoute.jsx`.
> **RBAC pattern:** every page gated twice — sidebar visibility (`user?.role_id?.<flag>`) + in-page
> re-check. Real enforcement = backend `verifyToken("<flag>")`; FE checks are UX-only. Flags:
> `src/data/permissionData.js`.
> Sidebar groups: **Catalog, Orders, Marketing, Customers, Content, Inventory, Settings, Staff** + Dashboard.

---

## A. DASHBOARD

### A1. Dashboard (revenue + stats)
- **What:** KPI cards, revenue charts (Recharts), recent orders. Real data only.
- **Route:** `/` · **File:** `src/pages/DashBoardPage/DashBoard.jsx`
- **RBAC:** `dashboard_show`
- **V2 improve:** date-range picker, comparison-to-previous-period, export. Charts historically used dummy data (Sprint-2 audit) — wire to real aggregation endpoints.

---

## B. CATALOG

### B1. Category (nested tree manager)
- **What:** Drill-down nested-tree CRUD (replaces retired flat/sub/child pages). Add child under any node, edit, delete (leaf-only, no products), toggle status, set category-default attributes.
- **Route:** `/category` · **File:** `src/pages/CategoryPage/CategoryPage.jsx`
- **Sub-components:**
  - Tree view + per-node actions — `src/components/Category/CategoryTree.jsx` (`CategoryTreeNode`)
  - Add (modal) — `src/components/Category/AddCategory.jsx`
  - Update — `src/components/Category/UpDateCategory.jsx` *(misspelled)*
  - Category-default attribute picker — `src/components/Category/AttributeDefaultsSelector.jsx`
  - Reusable tree **picker** (used by product form) — `src/components/Category/CategoryTreePicker.jsx`
- **Smart UX:** auto-slug `src/utils/generateSlug.js`; logo upload + S3 key tracking; "category defaults" auto-applied by product form.
- **RBAC:** `category_show / category_post / category_update / category_delete`
- **V2 improve:** drag-to-reorder + drag-to-reparent tree (currently only add-child); bulk move; normalize `UpDateCategory.jsx`.

### B2. Brand
- **What:** Brand CRUD + status toggle + **Duplicate** action.
- **Route:** `/brand-category` *(URL≠backend `/brand`≠component `BrandPage`)* · **File:** `src/pages/BrandPage/BrandPage.jsx`
- **Sub:** `src/components/Brand/BrandTable.jsx`, `AddBrandCategory.jsx`, `UpdateBrandCategory.jsx`, **`DuplicateBrandCategory.jsx`**
- **Smart UX:** **Duplicate/clone** → prefilled create form; auto-slug.
- **RBAC:** `brand_show / brand_post / brand_update / brand_delete`

### B3. Attribute (variation source-of-truth)
- **What:** Attributes + values (name, hex `attribute_value_code`, weight grams, display_type swatch/button, status, `tracks_weight`).
- **Route:** `/attribute` · **File:** `src/pages/AttributePage/AttributePage.jsx`
- **Sub:** `src/components/Attribute/AddAttribute.jsx`, `UpdateAttribute.jsx`, value viewer `src/components/Attribute/viewAttributeValue/ViewAttributeValue.jsx`, **operational table `src/components/Attribute/AttributeTable.jsx`** (list + search + pagination + edit/delete + view-values, like ProductList)
- **Smart UX:** native color input + hex swatch; auto-slug; **Add/Update modals reused inline in the product wizard** (StepOneVariation `onCreated`).
- **RBAC:** `attribute_show / attribute_post / attribute_update / attribute_delete`

### B4. Product List (operational dashboard) ⭐
- **What:** Rich table from `/product/dashboard-rich`, rows pre-annotated (`_variation_count`, `_stock_total`, `_is_low_stock`, `_flags`, `_has_theme`, `_has_page_content`). Search + 8 filter selects + pagination.
- **Route:** `/product/product-list` · **File:** `src/pages/ProductPage/ProductListTablePage/ProductListTablePage.jsx`
- **Smart UX (column-cell quick-edit modals — owner-loved):**
  - image cell → `src/components/ProductList/ProductImagesModal.jsx` (drag-reorder)
  - video → `ProductVideoModal.jsx` · price → `ProductPriceModal.jsx` · stock → `ProductStockModal.jsx`
  - "N var" badge → `ProductVariationsModal.jsx` (bulk variation edit, paste support)
  - sold/views → `ProductAnalyticsSeedModal.jsx`
  - **Inline toggles** (status, trending ⭐) via `PATCH /product/quick` (whitelisted partial — avoids full-rebuild trap) with **in-flight Set guard** (`togglingIds`); optimistic toast.
  - `timeAgo()`; flag badges; SweetAlert delete.
- **RBAC:** `product_show / product_update / product_delete / product_create`
- **V2 improve:** no bulk-select/bulk-actions; no catalog CSV export; no column visibility.

### B5. Add/Edit Product (the big wizard) ⭐⭐⭐
- **What:** Single-page collapsible-section form (not a stepper). One `useForm()`. Shared add/update via `ProductForm.jsx mode="add"|"update"`.
- **Routes:** `/product/product-create`, `/product/product-update/:id`
- **Pages:** `src/pages/ProductPage/AddProductPage/AddProductPage.jsx`, `…/ProductUpdatePage/ProductUpdatePage.jsx`
- **Core:** `src/components/ProductNew/ProductForm.jsx` (≈2300 lines) + wrapper `src/components/ProductNew/AddProduct.jsx`
- **Sections (each collapsible w/ ⓘ info-modal):**
  1. **Basic Info** — name, **CategoryTreePicker** (`includeInactive`), Brand select, Unit, Trending, Quill description, **Media** (main image, **video Upload-OR-Link toggle**, multi other-images, size-chart). Read-only **InternalCodesPanel** (`sections/InternalCodesPanel.jsx`) + **QrBlock** (`sections/QrBlock.jsx`).
  2. **Product Type** — simple/variable (+combo on update) → **BundleItemsBlock** (`sections/BundleItemsBlock.jsx`, AsyncSelect).
  3. **Pricing & Stock** — simple (`stepOne/StepOnePrice.jsx`) OR matrix (`stepOne/StepOneVariation.jsx` + `StepOneVariationTable.jsx`).
  4. **Advanced — Logistics** — `stepOne/StepOneAdvanced.jsx variant="logistics"`.
  5. **Advanced — Bulk & Group Pricing** — `StepOneAdvanced variant="bulk"`.
  6. **Advanced — Custom Spec Rows** — `sections/CustomFieldsBlock.jsx`.
  7. **Advanced — SEO** — meta + **keyword tag input**.
  - Info content: `sections/sectionInfoContent.jsx` via `sections/SectionInfoModal.jsx`; `sections/ToggleSwitch.jsx`.
- **Smart UX (crown jewel — capture ALL):**
  - **sessionStorage draft autosave (create-only)** — debounced 1s, 30-min TTL, meaningfulness guard, **"Draft restored" toast (Discard/Keep)**, drops dead attribute ids on restore (`DRAFT_KEY="fs_product_draft_create"`).
  - **Category-default attribute suggestion** — `/category/defaults/:id` (AbortController race-safe); empty form auto-applies + green banner; non-empty shows amber **Apply/Dismiss** banner.
  - **Variation matrix** (`StepOneVariation.jsx`): multi-keep-open Select; per-attribute "axis?"/"show in filter?" toggles; **inline "+ Add value"** (PATCHes attribute live, dedupe, auto-tick); **"+ Create attribute"** opens AddAttribute modal inline; **predicted combination count** banner (500 cap); hex swatch labels; multi-weight-axis sum warning; axis-off SweetAlert.
  - **`SortableValueChips.jsx`** — **@dnd-kit drag-reorder** picked values (= PDP/filter/matrix order) + ✕.
  - Matrix table auto-sums weight for new rows; per-row image picker modal (`stepOne/VariationImageModal.jsx`, reuses image pool no re-upload); per-row badge + **IconPicker**.
  - **Video Upload-OR-Link** single-mode toggle.
  - **Publish gating** — Save&Publish disabled when picked category/brand/attribute inactive; tooltip lists reasons (Draft stays enabled).
  - **QrBlock** — regen QR, download PNG, **print label** (`window.print()` popup), **copy URL w/ execCommand fallback**, clickable URL.
  - Post-save CTA → "✨ Configure Hero Content →" deep-links page-content. Sticky bottom save bar.
- **RBAC:** `product_create` (add) / `product_update` (edit). Update sub-tree mirrored in `src/components/Product/UpdateProduct/UpdateStepOne/…` + `UpdateStepThree/…`.
- **V2 improve:** split the 2300-line form into composable RHF groups; shared `cleanFormData()` (loop repeated ~25×); add `URL.revokeObjectURL` (leak); add update-mode dirty-guard/unsaved-changes prompt; reconsider single-page vs wizard for onboarding.

### B6. Product Page Content editor (themed PDP builder) ⭐⭐
- **What:** Tabbed editor for the dynamic PDP — theme, hero, description, custom spec, video, benefits, use-cases, size-guide, nutrition, brand-promise, FAQs, floating images, variation weights, OG/social.
- **Route:** `/product/page-content/:id` · **Page:** `src/pages/ProductPage/ProductPageContentEditPage/ProductPageContentEditPage.jsx`
- **Core:** `src/components/ProductPageContent/ProductPageContentForm.jsx`
- **Tabs + completeness badges:** `src/components/ProductPageContent/PageContentLayout.jsx` driven by `pageContentMeta.js` (`isComplete()` predicates → live ✓ badges; URL `?tab=` survives reload).
- **Sub:** `IconTextRepeater.jsx`, `SizeGuideEditor.jsx`, `PasteTableButton.jsx`, `FaqPickerModal.jsx`, `ProductFloatingTab.jsx` (per-product floating override; deferred S3 upload), `VariationWeightEditor.jsx`, `faqPlaceholders.js`, `PageContentActions`.
- **Smart UX (owner-loved):**
  - **Paste-a-table → label/value rows** — `PasteTableButton.jsx` + `src/utils/parsePastedTable.js` (auto-detects Tab/pipe/colon/2-space/comma; strips markdown dividers; skips headers; Bangla headers). In nutrition rows, info-tiles, custom-spec. Append/Replace.
  - **Size-guide paste-grid** — `SizeGuideEditor.jsx` + `src/utils/parsePastedGrid.js` (multi-column ChatGPT/Excel paste; row1=headers; pad/truncate).
  - **FAQ template picker** — `FaqPickerModal.jsx`: category-lineage-scoped templates; **auto-fills `{{placeholders}}`** from product fields/custom_fields/nutrition (case/space-insensitive); unresolved-token warning; placeholder chips.
  - **IconPicker** everywhere (curated + ~3.6k Lucide/FA, search, categories).
  - Per-section **side-image** uploader + show/hide + main-image fallback.
  - **Char-counter countdowns** (amber last 5).
  - **Deferred floating-image upload** (blobs until Save; abort save on upload fail; revoke blob URLs on unmount).
  - Sticky Save + "open live".
- **RBAC:** `product_update`
- **V2 improve:** "last save wins" with product form on shared fields (description, custom_fields) — optimistic-lock/merge or single source; virtualize mounted tabs; add live PDP preview pane like the theme builder.

### B7. Low Stock
- **Route:** `/low-stock` · **File:** `src/pages/LowStockPage/LowStockPage.jsx` · **RBAC:** under `product_show`
- **V2 improve:** inline restock; CSV export; reorder-suggestion column.

---

## C. ORDERS

### C1. Order List (status tabs)
- **What:** All orders; Processing/Delivered/Cancelled/Returned/Offer are **filter tabs** (not routes). Search, pagination, status update.
- **Route:** `/order` (`?tab=`) · **File:** `src/pages/OrderPage/OrderPage.jsx`
- **Sub:** `src/components/Order/OrderTable.jsx`, `DefaultRow.jsx`, `PendingRow.jsx`, `SteadfastRow.jsx`, `PathaoRow.jsx`, `OrderStatus.jsx`, `BulkSendBar.jsx`. **8 tabs:** Pending/Steadfast/Pathao/Delivered/Cancelled/All/POS/Offer.
- **Smart UX:** bulk-select + bulk courier dispatch (`BulkSendBar.jsx`, `handleBulkSendToSteadfast`/`handleBulkSendToPathao`/bulk Pathao sync); inline status dropdown; **single-send SweetAlert confirm**; **sync before/after status toast**; **Pathao manual-portal link** when status≠Pending; **PendingRow "Fraud" button** pre-fills phone → fraud-check page.
- **RBAC:** `order_show / order_update`
- **V2 improve:** deep-audit A2.2 BLOCKER (verify 9-status transitions); add date-range + payment-method filters; CSV export.

### C2. Order Detail
- **What:** Items, customer, courier status (Steadfast+Pathao colour-coded), payment card, **edit delivery modal**, print label/invoice, refresh courier.
- **Route:** `/all-order-info/:id` · **File:** `src/components/Order/ViewAllOrderInfo.jsx`
- **Sub:** `Order/PaymentInfoCard.jsx`, `common/printLabel/PrintLabel.jsx`, `common/printableInvoice/PrintableInvoice.jsx`, inline `DeliveryInfoModal`.
- **Smart UX:** editable delivery modal (`PATCH /order/delivery-info/:id`); printable invoice + label; live courier refresh; **9-status forward dropdown** (`NEXT_STATUS_OPTIONS`, cancel/return prompt reason); **AdminNotesCard** (read-only cancel/return reason + editable `internal_note`, `PATCH /order`); **delivery "Overridden" badge** when delivery info ≠ customer original; **courier-locked guard** (blocks cancel/return if already with Steadfast/Pathao → directs to courier cancel flow).
- **RBAC:** `order_show / order_update`

### C3. Create POS Order ⭐
- **What:** Full POS — product grid + cart/customer/delivery/discount/payment/summary, walk-in or existing customer, change/due calc, print receipt.
- **Route:** `/order/create` · **File:** `src/pages/CreateOrderPage/CreateOrderPage.jsx`
- **Sub:** `POSReceipt.jsx`, `ProductQuickViewModal.jsx`
- **Smart UX:** debounced search+filters; card → quick-view variation modal; **customer search dropdown + auto-fill address/division/district** (`resolveCustomerDivDistrict`); flat/percent discount + live "saving" badge; **paid → live Change-Back/Still-Due**; inside/outside-Dhaka shipping auto-calc; `window.print()` receipt; cart variation dropdown + qty steppers.
- **RBAC:** `order_create_admin`
- **V2 improve:** shipping hardcoded (60/120, Dhaka "47") — read from settings; barcode-scanner; hold/park order; multi payment (COD-only now).

### C4/C5. Steadfast / Pathao Orders
- **Routes:** `/steadfast-order`, `/pathao-order` · **Files:** `src/pages/SteadfastOrderPage/…`, `src/pages/PathaoOrderPage/…`
- **Sub:** `Order/SteadfastOrderTable.jsx`+`SteadfastRow.jsx`, `Order/PathaoOrderTable.jsx`+`PathaoRow.jsx`; hook `src/hooks/useGetOrderStatusSteadFast.jsx`
- **RBAC:** `order_show`

### C6. Fraud Check
- **Route:** `/fraud-check` · **File:** `src/pages/Fraudcheckpage/Fraudcheckpage.jsx` · **RBAC:** `order_show`

### C7. Abandoned Carts
- **Route:** `/abandoned-cart` · **File:** `src/pages/AbandonedCartPage/AbandonedCartPage.jsx` (+ `src/components/AbandonedCart/`) · **RBAC:** `order_show`
- **V2 improve:** one-click recovery SMS/email; recovery-rate metric.

---

## D. MARKETING

### D1. Flash Sale
- **Route:** `/flash-sale` · **File:** `src/pages/FlashSalePage/FlashSalePage.jsx` · **Sub:** `src/components/FlashSale/FlashSaleTable.jsx`, `AddFlashSale.jsx`, `UpdateFlashSale.jsx`
- **RBAC:** `offer_show / offer_create / offer_update` (flash shares offer flags)

### D2. Offers
- **Routes:** `/offer-list`, `/add-offer` · **Files:** `src/pages/OfferPage/OfferTablePage/…`, `…/AddOfferPage/…`
- **Sub:** `src/components/Offers/OfferDescription/…`, `Offers/VariationDesCription/ProductVariation/…`
- **Smart UX:** product + per-variation picker · **RBAC:** `offer_show / offer_create / offer_update / offer_delete`

### D3. Campaigns
- **Routes:** `/campaign-list`, `/add-campaign` · **Files:** `src/pages/CampaignPage/CampaignListPage/…`, `…/AddCampaignPage/…`
- **Sub:** `src/components/Campaign/AddCampaign/AddCampaign.jsx`, `CampaignProductTable.jsx`, `VariationModal.jsx`, `CampaignTable.jsx`, `UpdateCampaignModal.jsx`, `CampaignDescription/…`, `…/AddProductVariation.jsx`, `…/UpdateVariationDes/UpdateVariation.jsx`; hook `useGetCampaign.jsx`
- **RBAC:** `campaign_show / campaign_create / campaign_update / campaign_delete`

### D4. Coupons
- **Routes:** `/your-coupon`, `/add-coupon` · **Files:** `src/pages/CouponPage/YourCouponPage.jsx/YourCoupon.jsx`, `src/components/Coupon/AddCoupon.jsx`
- **Sub:** `src/components/Coupon/YourCouponOfferTable/…`; hook `useGetCouponProduct.jsx`
- **RBAC:** `coupon_show / coupon_create / coupon_update / coupon_delete`

### D5/D6. Banner / Slider
- **Routes:** `/banner`, `/slider` · **Files:** `src/pages/Banner/BannerPage.jsx`, `src/pages/SliderPage/SliderPage.jsx` (+ components)
- **RBAC:** `banner_*`, `slider_*` · **V2 improve:** drag-reorder slides; per-slide schedule.

---

## E. CUSTOMERS

### E1. Customers
- **Route:** `/customer` · **File:** `src/pages/AllCustomerPage/CustomerPage.jsx`
- **Sub:** `src/components/Customers/CustomerTable.jsx`, `AddCustomer.jsx`, `UpdateCustomer.jsx` (react-phone-number-input). ⚠️ **CORRECTION:** forms collect only name/phone/password/status — **NO division/district pickers** (the `src/data/` location files exist but are unused here). **V2 improve:** add address (division/district) fields to customer forms.
- **RBAC:** `customer_show / customer_create / customer_update / customer_delete`

### E2/E3/E4. Wishlists / Loyalty / Wallet (viewers)
- **Routes:** `/wishlist`, `/loyalty`, `/wallet` · **Files:** `src/pages/WishlistPage/…`, `LoyaltyPage/…`, `WalletPage/…` · **RBAC:** `user_show` (+ `user_update` for Loyalty/Wallet adjust)
- **Smart UX (Loyalty/Wallet):** AsyncSelect user search, balance card, history ledger, **adjust form** (delta + reason).

### E5/E6. Reviews / Pending Reviews
- **Routes:** `/review`, `/review/pending` · **Files:** `src/pages/ReviewPage/ReviewPage.jsx`, `…/PendingReviewsPage.jsx`
- **Smart UX:** approve/reject; status toggle · **RBAC:** `review_show / review_update`

### E7. Seed Reviews ⭐ (JSON-paste seeder)
- **What:** 3-tab tool to inject realistic reviews (separate from real; excluded from analytics).
- **Route:** `/review/seed` · **File:** `src/pages/ReviewPage/SeedReviewPage.jsx`
- **Tabs:** Bulk Upload, Manual Add, Seeded list.
- **Smart UX (owner-loved):**
  - **Paste JSON array** → `JSON.parse`, max-500 validation, **Validate (Dry Run)** vs **Upload & Save**, server reports inserted/skipped(dup)/failed.
  - **"Find product ID" AsyncSelect → copies ObjectId to clipboard**.
  - Optional shared image uploaded lazily only on submit.
  - Manual tab: AsyncSelect **multi-product** (same review→many), star select, image, verified flag. Sample JSON/CSV in `<details>`.
- **RBAC:** `review_seed_bulk`, `review_seed_manual`, `review_show` (per-tab)

### E8. Questions
- **Route:** `/question` · **File:** `src/pages/QuestionPage/QuestionPage.jsx` · **RBAC:** `question_show / question_update`

---

## F. CONTENT

### F1. Themes (per-product theme builder) ⭐
- **What:** `themes` collection — 3 base colors (backend → 5 shades), 2-font typography, button roundness, global floating assets, status.
- **Routes:** `/theme`, `/theme/create`, `/theme/update/:id`, `/theme/preview/:id`
- **Files:** `src/pages/ThemePage/ThemeListPage.jsx`, `ThemeAddPage.jsx`, `ThemeUpdatePage.jsx`, `ThemePreviewPage.jsx`
- **Core:** `src/components/Theme/ThemeForm.jsx`
- **Sub:** `ColorAutoPreview.jsx`, `ThemeFloatingManager.jsx` (create-mode buffers files, uploads after id), `ThemeTable.jsx`, `palettePresets.js`; hook `useGetTheme.jsx`; `src/utils/frontendUrl.js`
- **Smart UX:** **curated palette presets** (one-click 3-color) + "reset to suggested"; **auto-slug** (until manually edited); **live storefront-iframe preview** (colors/fonts as query params, debounced 600ms, sticky + fullscreen); Bangla-first fonts.
- **RBAC:** `theme_show / theme_create / theme_update / theme_delete`
- **V2 improve:** the live-iframe preview is the gold standard — extend SAME pattern to page-content + home-layout builder.

### F2. FAQ Templates
- **Route:** `/faq-template` · **File:** `src/pages/FaqTemplatePage/FaqTemplateListPage.jsx`; hook `useGetFaqTemplate.jsx`
- **What:** Reusable categorized FAQ entries with `{{placeholder}}` tokens + optional category scoping — feeds page-content FAQ picker.
- **RBAC:** `faq_template_show / _create / _update / _delete`

### F3. Site FAQ
- **Route:** `/site-faq` · **File:** `src/pages/SiteFaqPage/SiteFaqPage.jsx` · **RBAC:** `site_faq_show / _post / _update / _delete`

### F4. Brand Promise (Trust Points)
- **Route:** `/trust-point` · **File:** `src/pages/TrustPointPage/TrustPointPage.jsx`; hook `useGetTrustPoints.jsx`
- **What:** Site-wide "আমাদের প্রতিশ্রুতি" module (own collection, shown on every PDP).
- **Smart UX:** IconPicker per point · **RBAC:** `trust_point_show / trust_point_update`

### F5. Newsletter Subscribers (CSV export)
- **Route:** `/newsletter-subscribers` · **File:** `src/pages/NewsletterPage/NewsletterPage.jsx`
- **Smart UX:** **Export CSV** — `/newsletter-subscriber/export` Blob download (`handleExport`); status filter; SweetAlert delete.
- **RBAC:** `newsletter_show / newsletter_delete / newsletter_export`

---

## G. INVENTORY

### G1. Warehouses
- **Route:** `/warehouse` · **File:** `src/pages/WarehousePage/WarehousePage.jsx` · **RBAC:** under `site_setting_update` (deep-audit A4.1 BLOCKER — verify in V2).

### G2. Suppliers
- **Route:** `/supplier` · **File:** `src/pages/Supplier/SupplierPage.jsx` (+ `AddSupplier.jsx`, `UpdateSupplier.jsx`)
- **RBAC:** `supplier_show / supplier_create / supplier_update / supplier_delete`

---

## H. SETTINGS

### H1. Site Settings (tabbed hub) ⭐
- **What:** 206-field settings monolith, tab-routed.
- **Routes:** `/settings`, `/settings/:tab` · **Page:** `src/pages/SettingPage/SettingPage.jsx` (left-nav groups the 17 tabs into 4 semantic groups Store/Commerce/Storefront/Integrations + framer-motion; **permission-gated tab visibility** — e.g. demo-data only if `demo_data_clear`) → hub `src/components/SiteSetting/SettingS.jsx` (switch on `:tab`).
- **Tabs → files (all `src/components/SiteSetting/`):** `site-setting`→`SiteSetting/SoftwareInformation.jsx` · `phone-credential`→`PhoneCredential.jsx` (gated `setting_secrets_update`) · `currency`→`CurrencySymbol.jsx` · `shipping`→`ShippingConFiguration.jsx` · `payment-methods`→`PaymentMethodsSettings.jsx` · `vat`→`VatSettings.jsx` · `loyalty`→`LoyaltySettings.jsx` · `sms`→`SmsSettings.jsx` · `email`→`EmailSettings.jsx` · `analytics`→`AnalyticsSettings.jsx` · `announcement-bar`→`AnnouncementBarSettings.jsx` · `offer-banner`→`OfferBannerSettings.jsx` · `storefront-behaviour`→`StorefrontBehaviourTab.jsx` (13 toggles) · **`home-layout`→`HomeLayoutTab.jsx`** ⭐ · `feature-cards`→`SiteSetting/CardInformation.jsx` · `policies`→`SiteSetting/Policies.jsx` · `demo-data`→`DemoDataSettings.jsx` (RBAC `demo_data_clear`).
- **HomeLayoutTab smart UX (owner-loved):** **drag-reorder home sections** (@dnd-kit vertical sortable, 18 sections — never trim, toggle off), per-section enable toggle + expandable config (title/limit/source/layout), dirty Discard/Save, collapsible Topbar/Navbar/Hero/Footer/Chat-widget cards (toggles, selects, JSON-string nav/payment/delivery fields).
- **RBAC:** `site_setting_update` (+ `setting_secrets_update`); public `/setting` strips secrets.
- **V2 improve:** split 206-field monolith into 4 collections (SETTINGS_ARCH_DEBT); structured editors for JSON-string fields; HomeLayout live preview (theme-builder iframe); category-ID-by-paste → pickers.

### H2. Page SEO Management
- **Route:** `/page-seo` · **File:** `src/pages/pageSeoPage/PageSeoPage.jsx`; hook `src/hooks/getPageSeoData.jsx`
- **What:** Per-page meta title/desc/keywords/OG; defaults "FruitSnacks" when DB empty.
- **RBAC:** `page_seo_show / page_seo_update`

---

## I. STAFF / RBAC

### I1. All Staff
- **Route:** `/all-staff` · **File:** `src/pages/StaffAndRolePage/AllStaffPage/AllStaffPage.jsx` (+ `src/components/AllStaff/AddAllStaff.jsx`, `UpdateStaff.jsx`)
- **RBAC:** `user_show / user_create / user_update / user_delete`

### I2/I3. Staff Roles / Add Role
- **Routes:** `/staff-role`, `/create-staff-role` · **Files:** `src/pages/StaffAndRolePage/StaffRoleTablePage/…`, `…/AddStaffRolePage/…`; hook `useGetRole.jsx`
- **What:** Create/edit roles by checking flags from `src/data/permissionData.js` (grouped checkbox matrix). **Must stay in sync with backend `role.interface.ts`/`role.model.ts` manually.**
- **RBAC:** `role_show / role_create / role_update / role_delete`
- **V2 improve:** generate `permissionData` from backend schema (kills 5-place drift); role presets; "select all in group".

---

## J. AUTH / PROFILE (outside dashboard layout)
- **Sign In** — `/sign-in` · `src/pages/SignInPage/SignInPage.jsx` (**V2 improve:** replace `window.location.reload()` with AuthProvider re-fetch).
- **Forget Password** — `/forget-password` · `src/pages/ForgetPasswordPage/ForgetPasswordPage.jsx` (OTP).
- **My Profile** — `/admin/my-profile` · `src/pages/MyProfilePage/ProfilePage.jsx`.
- **404** — `src/shared/NotFound/NotFound.jsx`.

---

## (a) Reusable components → packages/ui candidates

| Component | Path | Reused by |
|---|---|---|
| `IconPicker` (curated + ~3.6k catalog) | `src/components/common/IconPicker/IconPicker.jsx` | repeater, custom-fields, nutrition, trust-points, variation badges |
| `DynamicIcon` + registry/catalog | `src/lib/icons/DynamicIcon.jsx`, `registry.js`, `iconCatalog.js` | IconPicker |
| `PasteTableButton` | `src/components/ProductPageContent/PasteTableButton.jsx` | nutrition, custom-fields |
| `IconTextRepeater` | `src/components/ProductPageContent/IconTextRepeater.jsx` | hero/process/benefits/use-cases |
| `SizeGuideEditor` | `src/components/ProductPageContent/SizeGuideEditor.jsx` | page-content |
| `CustomFieldsBlock` | `src/components/ProductNew/sections/CustomFieldsBlock.jsx` | product form + page-content |
| `SortableValueChips` | `src/components/ProductNew/stepOne/SortableValueChips.jsx` | variation block |
| `ToggleSwitch` | `src/components/ProductNew/sections/ToggleSwitch.jsx` | variation, settings |
| `SectionInfoModal` + content | `src/components/ProductNew/sections/SectionInfoModal.jsx`, `sectionInfoContent.jsx` | product form |
| `CategoryTreePicker` / `CategoryTree` | `src/components/Category/CategoryTreePicker.jsx`, `CategoryTree.jsx` | product form, category |
| `AddAttribute` / `UpdateAttribute` | `src/components/Attribute/AddAttribute.jsx`, `UpdateAttribute.jsx` | attribute page + inline variation |
| `Pagination` | `src/components/common/pagination/Pagination.jsx` | all lists |
| `TableLoadingSkeleton` | `src/components/common/loadingSkeleton/TableLoadingSkeleton.jsx` | all tables |
| `LoaderOverlay` / `MiniSpinner` | `src/components/common/loader/LoderOverley.jsx`, `src/shared/MiniSpinner/MiniSpinner.jsx` | everywhere |
| `ImageUploader` | `src/components/common/ImageUploader.jsx` | forms |
| `PrintLabel` / `PrintableInvoice` | `src/components/common/printLabel/PrintLabel.jsx`, `common/printableInvoice/PrintableInvoice.jsx` | order detail, QrBlock |
| `NoDataFound` | `src/shared/NoDataFound/NoDataFound.jsx` | empty states |
| `DropdownMenu`/`MenuItem`/`ChildMenuItem` | `src/shared/SideNavBar/DropdownAndMenuItem.jsx` | sidebar |
| Color preview / palette presets | `src/components/Theme/ColorAutoPreview.jsx`, `Theme/palettePresets.js` | theme builder |
| Product quick-edit modals | `src/components/ProductList/*.jsx` | product list |
| `useDebounced` | `src/hooks/useDebounced.jsx` | search |
| Parsers | `src/utils/parsePastedTable.js`, `parsePastedGrid.js`, `generateSlug.js` | paste/slug |
| Location data | `src/data/division-data.js`, `district-data.js`, `city-data.js`, `address-data.js` | POS, customers |
| Permission matrix data | `src/data/permissionData.js` | role form |

## (b) Every smart-UX nicety (don't lose these in V2)

1. **Paste-a-table → label/value** — `parsePastedTable.js` via `PasteTableButton.jsx` (nutrition rows/tiles, custom-spec). Auto-detect Tab/pipe/colon/2-space/comma; skip markdown dividers + Bangla headers; Append/Replace.
2. **Size-guide paste-grid** — `parsePastedGrid.js` via `SizeGuideEditor.jsx`.
3. **JSON-paste review seeder** — `SeedReviewPage.jsx`: paste JSON, Dry-Run vs Save, inserted/skipped/failed, dup auto-skip, lazy image.
4. **"Find product ID → copy ObjectId to clipboard"** AsyncSelect.
5. **Drag-reorder attribute values** — `SortableValueChips.jsx` (@dnd-kit).
6. **Drag-reorder home sections** — `HomeLayoutTab.jsx` (@dnd-kit).
7. **Drag-reorder product images** — `ProductImagesModal.jsx`.
8. **Curated IconPicker** (chips + ~3.6k catalog, search, ESC-close).
9. **Color swatch pickers** — native color input + hex (attributes, theme, swatches).
10. **Curated palette presets** + **live storefront-iframe theme preview** (debounced).
11. **Auto-slug from name** (until manually edited).
12. **Duplicate/clone** — `DuplicateBrandCategory.jsx`.
13. **Inline column-cell quick-edit modals** + **inline status/trending toggles** via `PATCH /product/quick` (in-flight guard).
14. **Inline "+ Add value" / "+ Create attribute"** in product form.
15. **Category-default attribute auto-suggestion** (non-destructive Apply/Dismiss, AbortController).
16. **sessionStorage draft autosave** ("Draft restored" Discard/Keep, meaningfulness guard, deleted-id pruning).
17. **FAQ template picker** with `{{placeholder}}` auto-fill + category-scoped + unresolved-token warning.
18. **Char-counter countdowns** (amber last 5).
19. **Predicted variation-combination count** + 500-cap warning; **weight auto-sum** across axis values.
20. **Video Upload-OR-Link toggle**; **side-image show/hide + main-image fallback**.
21. **QR: regenerate / download PNG / print label popup / copy-URL execCommand fallback / clickable**.
22. **Publish-gating** when category/brand/attribute inactive (Draft stays enabled).
23. **POS:** customer auto-fill address/div/district, live change-back/due, inside/outside-Dhaka shipping, variation quick-view, print receipt.
24. **CSV export** (Blob) — Newsletter.
25. **Completeness ✓ badges** per page-content tab; **URL `?tab=`** survives reload.
26. **Deferred S3 upload** (floating/seed/theme floats) — held until Save, no orphans.
27. **Section ⓘ info-modals** per product-form section.
28. **Bulk courier dispatch bar**; editable delivery-info modal.
29. **Demo-data one-click clear**.

## (c) V2-improve list

1. Split 2300-line `ProductForm.jsx` into composable RHF groups; extract shared `cleanFormData()`.
2. Add `URL.revokeObjectURL` cleanup (leak risk).
3. Move mutations to `useMutation` + invalidation (currently plain `fetch` + manual `refetch()`).
4. Generate `permissionData.js` from backend schema (kill 5-place drift); role presets + group select-all.
5. Replace `window.location.reload()` after login with AuthProvider re-fetch.
6. Product List: bulk-select/actions, catalog CSV export, column visibility.
7. Page-content vs product-form "last save wins" on shared fields — optimistic lock/merge or single source.
8. Add **live PDP preview** to page-content + **live home preview** to HomeLayoutTab (reuse theme-builder iframe).
9. Split 206-field settings monolith into ~4 collections; structured editors for JSON-string fields; pickers for paste-category-ID.
10. Draggable tree reorder/reparent in Category; normalize `UpDateCategory.jsx` / `/brand-category`↔`/brand`↔`BrandPage`.
11. POS: settings-driven shipping/Dhaka-id; barcode scanner; hold/park; multi payment.
12. Verify deep-audit BLOCKERs in rewrite: order-status dropdown (A2.2), warehouse guard (A4.1), reviews carousel/cart-price (FE).
13. Abandoned carts: one-click recovery + metric. Low-stock: inline restock + reorder suggestions.
14. Banner/Slider: drag-reorder + per-slide scheduling.
15. Dashboard: date-range + period comparison + real-aggregation charts.
16. Normalize naming (`UpDate*`→`Update*`); delete dead code (`useGetData.jsx`, `cookie-storage.js`).
