# Frontend Deep Audit (logic-level) — findings — 2026-06-18

Page-by-page deep-read of the FruitSnacks **Frontend** (Next.js 14 App Router storefront) — full components + redux slices + helpers, not just page files — vs `docs/frontend.md`, run by 4 parallel agents. Mirrors `BACKEND_DEEP_AUDIT_FINDINGS.md` + `ADMIN_DEEP_AUDIT_FINDINGS.md`. RAW findings; doc-fixes + bug-tickets tracked separately.

Legend: ❌ DOC WRONG · ⚠️ DOC MISSING · 🐛 REAL CODE BUG/SMELL · 💰 price-flow · 🌱 multi-niche debt · ✅ confirmed.
Severity: BLOCKER / HIGH / MEDIUM / SMELL.

**FIX STATUS:** s47 (2026-06-19, browser-verified via Playwright) — **✅ F1.1 CAMPAIGN HALF FIXED on `dev`** (BE `5e97db7` findCartProductServices campaign enrich; FE `09fdb86` helper.js campaign base → regular product_price + cart staleTime 60s). Cart now shows campaign price + sends real campaign_id; was ৳450 shown vs ৳750 charged. **⏳ F1.1 FLASH HALF STILL OPEN** — flash "fixed"=absolute (resolver.ts:112) vs subtraction (helper.js:102) + percent base differs on variations → core-resolver change, separate ticket. **⏳ F4.1/F3.1 STILL OPEN** (reviews carousel 400 → needs public featured-reviews endpoint) + remaining HIGH/MEDIUM/SMELL.

---

## ⭐ TOP FINDINGS (cross-agent triage) — updated as agents land

- **🔴 F1.1 (BLOCKER) — cart shows regular price but backend charges flash price; campaign discount silently LOST.** `findCartProductServices` (`product.services.ts:208-317`) doesn't attach `flash_sale_details`/`campaign_details` (unlike strip/PDP services). So cart/checkout shows variation/base price, but `order.recompute.ts:304-316` charges flash price (shown ≠ charged), and `campaign_id` is always null → campaign branch never fires → campaign discount neither shown nor charged. **Biggest finding of the FE audit — real money/trust bug.**
- **🔴 F4.1 (BLOCKER) — home ReviewsCarousel `auto_featured` (default) mode permanently empty.** Fetches `GET /review?...review_rating=5&has_photo=true` → routes to `findUserReview` which throws 400 (needs review_user_id); those query params don't exist in backend → `[]` → section returns null → never renders. Needs a public "featured reviews" endpoint.
- **F4.2 (HIGH) — ReviewsCarousel wrong field names** (`review_rating` vs `review_ratting`, `review_photo` vs `review_image`, `product_id` vs `review_product_id`) → even manual_pick shows 0 stars / no photo / no product name / "Customer".
- **F1.3 (HIGH) — COD phone stored in 2 formats** (guest E.164 `+8801…` vs logged-in `01…`) → courier-create + SMS + phone-keyed lookup risk.
- **🔴 F3.4 (HIGH) — 3 default-ON home sections render NOTHING on a fresh clone.** `trust_strip`(order1), `feature_categories`(order2), `offers_block`(order5) ship `enabled:true` in HOME_SECTION_DEFAULTS but SECTION_COMPONENTS has no mapping → silent null → top of home blank. Components exist on disk but orphaned. Fix: wire them OR flip defaults to enabled:false.
- **F3.3 (HIGH) — `/shop?sort=popular|rating|latest` is page-local client sort, not catalog sort** ("popular ≠ popular" still real). `/filter_product` has no `$sort` stage; component re-sorts only current page's ~20 rows. Fix: pass sort to backend + add `$sort` stage.
- **F1.5 (MEDIUM) — `৳` hardcoded** on order-success + PDF invoice (missed M28 currency sweep) → non-BDT clone shows wrong symbol.
- **F4.3/F4.4 (MEDIUM) — dead OTP `/verify` flow** — `useVerifyMutation` hits non-existent `/user/update_user_status`; `/verify` page unreachable (nothing writes its localStorage keys); signup is auto-verified (no OTP). Doc claims signup is OTP-gated (stale).
- **F2.1 + F2.2 (SMELL, big) — two large DEAD component trees.** `src/components/theme/{ProductThemedSections,FloatingAssets,WhatsAppOrderButton,ThemeStyleInjector,sections}` (live PDP imports only the `themedProduct/theme/` copies; only `AnnouncementBar.jsx` is live) AND the entire non-themed `src/components/frontend/singeProduct/**` tree (~20 components, imported nowhere). Page comment claims a `/products-original/[slug]` fallback route that **does not exist**. Biggest maintenance hazard — future devs may edit dead copies. Doc (`frontend.md`) points at these dead paths (F2.7/F2.8/F2.9).
- **F2.15 (multi-niche debt, CONFIRMED) — hardcoded "food" section enum** in FloatingAssets + all section callers (explicit MULTI-NICHE-DEBT comment). Real remaining debt.
- **F2.16 (GOOD NEWS) — custom_fields IS rendered** now (`DescriptionCard.jsx:33-143` spec table). The "saved-but-not-rendered" gap is CLOSED — update MULTI_NICHE_PLAN.

---

## FE AGENT 1 — Cart / Checkout / Order / Price (DONE)

Scope: cartSlice, applyCartLayers, cartSync, cartUtils, helper.js, fetchCartDetails, cartLocalstorageMiddleware, AddToCart, CartTable, CartSummary, DeliveryInformation, OrderSuccess, OrderInvoice, MyOrderTracking + tracking pages, currency.js + backend cross-check (order.recompute, product.price.resolver, findCartProductServices).

### 🐛 REAL CODE BUGS
- **F1.1 — BLOCKER — cart never shows flash/campaign price; customer charged DIFFERENT (lower) price than displayed.** `findCartProductServices` (`product.services.ts:208-317`) attaches `variations`(singular)+reviews only — NOT `flash_sale_details`/`campaign_details`. So `helper.js productPrice` (`:27,44`) never enters flash/campaign branch → always variation/base. (1) Flash product shows REGULAR price in cart (`CartTable.jsx:151`,`CartSummary.jsx:87`) but `order.recompute.ts:304-316` charges flash → shown≠charged. (2) Campaign: `AddToCart.jsx:367` sends `campaign_id: product?.campaign_details?._id` but campaign_details never present → campaign_id always null → `order.recompute.ts:346` never fires → campaign discount silently lost. Fix: enrich findCartProductServices with flash/campaign maps OR at minimum send real campaign_id.
- **F1.2 — HIGH — `replaceCartItem` Case 2 merges qty additively not Math.max.** `cartSlice.js:91` `+= finalQty` (edit variant to existing line → sums, e.g. 2+3=5), no maxStock clamp in replaceCartItem. addToCart (`:29`) also additive (arguably intended). Fix: clamp to stock or Math.max for edit-merge.
- **F1.3 — HIGH — COD phone in 2 inconsistent formats.** Logged-in: `user_phone.slice(3,14)` → `01XXXXXXXXX` (`AddToCart.jsx:89-97`). Guest: PhoneInput E.164 `+8801…` (`DeliveryInformation.jsx:130-146`). Payload `customer_phone || formData.customer_phone` (`:314`). Courier/SMS/phone-keyed lookup expect consistent format. Fix: normalize to `01XXXXXXXXX` before orderData.
- **F1.4 — MEDIUM — invoice Subtotal double-counts discount.** `OrderInvoice.jsx:239-242` subtotal = Σ product_grand_total_price (already net of line discount), then `:638` shows separate `discount_amount` line → math doesn't reconcile. Fix: render server `order.sub_total_amount` + `discount_amount`, don't re-derive.
- **F1.5 — MEDIUM — hardcoded `৳`/"Cash on Delivery"** in OrderSuccess (`:166,:171`) + OrderInvoice (`:600,613,629,636,651`) despite currency.js. MyOrderTracking does it right. Non-BDT clone breaks. Fix: route through currencyOf/formatCurrency.
- **F1.6 — SMELL — dead duplicate `productPrice` w/ OLD stale shape** in `cartUtils.js:1-16` (reads singular `variations.variation_discount_price` + `flash_sale_details` w/o `.flash_sale_product` guard = the bug helper.js fixed). Imported only by offer ProductTable. Fix: delete / re-export from helper.js.
- **F1.7 — SMELL — misspelled `@/data/cites` + hardcoded 64 BD districts** (`DeliveryInformation.jsx:1`). Multi-country clones can't reconfigure zones without code edit. Multi-niche debt.

### 💰 PRICE-FLOW VERIFICATION
- **Mismatch #1 (flash + variation_discount_price): REAL.** FE flash base = `variation_price` regular (`helper.js:29-33`); BE applies flash on already-discounted `final_price` (`resolver.ts:84,108-113`). ৳480 shown vs ৳416 charged. But in CART path FE shows no flash at all (F1.1) → practical mismatch is "regular shown, flash charged" (bigger than PDP framing).
- **Mismatch #2 (campaign FE vs BE): STALE — superseded by F1.1.** Cart carries no campaign_details → FE shows no campaign price + BE gets no campaign_id → neither side runs. Real issue = "campaign never applied via cart". `applyCartLayers.js:23-29` comment describes impossible scenario.
- **Mismatch #3 (flash slider vs PDP): FIXED.** Both use variation_price base. No action.
- **Mismatch #4 (strip flash enrichment): present for strips/PDP, MISSING for cart_product (F1.1).**
- **`calculatePrice` parity: CONFIRMED** (FE `helper.js:95-105` == BE `applyCampaign` `order.recompute.ts:39-47`). Caveat: BE flash "fixed" = absolute target price (`resolver.ts:111`) vs FE calculatePrice("fixed") subtracts (`helper.js:101`) — moot in cart, would bite if F1.1 fixed naively.

### ❌ DOC WRONG
- **D1.1 — frontend.md:447-457** discount-priority chain implies flash/campaign apply in cart; only true for strip/PDP. Cart = variation/base only (F1.1).
- **D1.3 — frontend.md:469** `useCartCalculations` signature omits `customerGroup` (real `helper.js:203-209` accepts it for wholesale/vip layer).

### ⚠️ DOC MISSING
- **M1.1** checkout payload shape (`AddToCart.jsx:302-370`): `need_user_create` guest trigger, fbc/fbp, pathao_city_id/zone_id, per-line advisory prices (BE overwrites all).
- **M1.2** guest vs logged-in success branching (`OrderSuccess.jsx:109-114,418`): set-password / login-prompt; need_user_create → BE auto-creates unverified user → set-password.
- **M1.3** `cart_product` returns `variations` as SINGULAR object not array (`product.services.ts:305`); PDP returns array. Load-bearing shape divergence; helper.js:22 handles both.
- **M1.4** syncCartAfterLogin once-per-session via `sessionStorage["cart_synced_<userId>"]` (`cartSync.js:13-18`).
- **M1.5** order-tracking page fires live courier status sync on view (`order-tracking/[id]/page.js:46-101` PATCH `/courier/.../sync/:id`).

### ✅ CONFIRMED
- All authed fetches use `credentials:"include"`; public/guest endpoints (cart_product, check_coupon, POST /order) correctly omit it.
- Server-as-authority real: recompute overwrites all client prices, tamper-resistant.
- Qty stepper clamps to maxStock (except replaceCartItem merge gap F1.2).
- Snapshot-with-live-fallback correct on success/invoice/tracking (`OrderInvoice.jsx:553-561`, populated `order.recompute.ts:411-413`).
- firePurchaseOnce dedupes Purchase pixel; cart cleared + DB cart DELETEd on success.
- Coupon math `applyCartLayers.js` mirrors `order.recompute.ts:464-513` layer-for-layer.

---

## FE AGENT 2 — PDP / Product / Variation / Themed (DONE)

Scope: live PDP (`/products/[slug]` → `themedProduct/**`), theme libs (`src/lib/theme/**`), variation picker, hero gallery, floating assets, all themed sections, QR landing, theme-preview. Cross-checked vs backend product/review/setting/theme.

### 🐛 REAL CODE BUGS
- **F2.1 — SMELL — duplicate theme tree, one 100% dead.** `src/components/theme/{ProductThemedSections,FloatingAssets,WhatsAppOrderButton,ThemeStyleInjector,sections}` are byte-near copies; live PDP imports only `themedProduct/theme/` (`products/[slug]/page.js:8-13`). Zero imports of the `components/theme/` copies. Only `AnnouncementBar.jsx` live (`(frontend)/layout.js:6`). Fix: delete the dead copies, keep/move AnnouncementBar. (`whatsappLink.js`/`formatWeight.js` in `lib/theme/` shared, fine.)
- **F2.2 — SMELL — entire non-themed PDP tree orphaned.** `src/components/frontend/singeProduct/SingleProduct.jsx` + ~20 subcomponents imported nowhere. Page comment (`products/[slug]/page.js:5`) claims fallback at `/products-original/[slug]` — that route DOES NOT EXIST. Fix: delete orphan tree or restore route; fix comment.
- **F2.3 — MEDIUM — `formatWeight.js` dead in PDP slice** — no import anywhere. Confirm intent / remove.
- **F2.4 — MEDIUM — price `||` chain treats 0 as unset.** `applyVariationPriceStock` (`SingleProduct.jsx:221`) `variation_discount_price || variation_price`; zero-priced item falls through / blank. Low likelihood for snacks. Fix: explicit `!= null` if zero prices expected.
- **F2.5 — SMELL — `findVariation` slug arg dead** (`SingleProduct.jsx:329`), `generateSlug` (`:328`) leftover from pre-combination[] era. Fix: drop.
- **F2.6 — SMELL — FloatingAssets `zIndex: i` unclamped** (`FloatingAssets.jsx:72`) can paint a float over price/CTA (pointer-events-none so clicks pass, visual only). theme-preview sets `layer:"behind"` but FloatingAssets never reads `layer`. Fix: clamp to 0 or honor `layer`.

### ❌ DOC WRONG
- **F2.7 — `frontend.md:567` + CLAUDE.md:137-138** cite `src/components/theme/ProductThemedSections.jsx` as PDP renderer; live file is `themedProduct/theme/ProductThemedSections.jsx` (other is orphaned).
- **F2.8 — `frontend.md:572-574`** floating-images stale: `FloatingAssets` renderer lives in `themedProduct/theme/` not `lib/theme/`; `ProductFloatingImages.jsx` NOT removed — still used by `/theme-preview` (`theme-preview/page.js:14,140`). Say "removed from live PDP; retained for admin theme-preview iframe."
- **F2.9 — `frontend.md:402-411`** PDP component table lists dead `singeProduct/...` paths; live renders from `themedProduct/singeProduct/**` + `themedProduct/theme/sections/**`.

### ⚠️ DOC MISSING
- **F2.10 — variation→price/image/URL engine** undocumented: combination[] set-intersection match (`SingleProduct.jsx:196-211`, `helper.js:337-364`), URL sync `?<attr_slug>=<value_slug>` w/ ASCII/ObjectId fallback, first-paint seed-to-first-in-stock-active logic.
- **F2.11 — VariationPicker behaviors** undocumented: display_type swatch/button/dropdown, swatch-no-hex fallback, viewport visible cap 8/14/20 + `+N more` modal, pre-click OOS cue, per-value badge pill.
- **F2.12 — inactive vs OOS:** `is_active:false` removed from picker entirely (`VariationPicker.jsx:84-94`); zero-stock combos shown faded. Deliberate rule, undocumented.
- **F2.13 — PdpPriceMeta / ViewCountFire / float align** missing: flash countdown + sold/view badges + tier + group-price hint (gated by show_sold_count/show_view_count/show_stock_count_on_pdp); view-count POST deduped via sessionStorage; float `align` top/middle/bottom + alternating-side + collision-offset.
- **F2.14 — themed section fields** undocumented (backend-confirmed `product.model.ts:298-321`): badge_text, hero_corner_badge, short_features[], video_title, process_steps[], benefits[], use_cases[], nutrition{rows,info_tiles,per_serving}, faqs[], *_side_image, custom_fields[], meta_*/og_*.

### 🌱 MULTI-NICHE DEBT
- **F2.15 — hardcoded "food" section enum CONFIRMED present.** `FloatingAssets.jsx:19-23` explicit MULTI-NICHE-DEBT comment; all callers pass hardcoded food section strings (hero/order/benefits/use_cases/nutrition/reviews/faq). Must come from niche registry for non-food.
- **F2.16 — custom_fields RENDERED now — debt RESOLVED for spec-table block.** `DescriptionCard.jsx:33-143` renders custom_fields[] as spec table (icon+label/value), wired `ProductThemedSections.jsx:56-59`, gated into hasContent `:42`. Remaining debt = section-registry only. **Update MULTI_NICHE_PLAN** (lists this as open gap — it's closed).

### ✅ CONFIRMED
- **`reviewer_name` correct** (`ReviewsSection.jsx:83` `r.reviewer_name || r.review_user_id?.user_name`; backend `review.model.ts:49`). Past `review_reviewer_name` bug NOT present. `ReviewAndReply.jsx:15` same correct fallback.
- mergeFloating dead-ref guard works (ignores unmatched hidden_ids/replacement.theme_asset_id, hide-wins, replace swaps image only, empty→[]).
- Variant gallery follows selection w/o lightbox desync (`HeroGallery.jsx:65-67`); main_image kept to avoid reload-flash.
- reduced-motion honored (`globals.css:338`).
- Price layering matches backend: flash>campaign>variation-discount>variation>product (`helper.js:107-155`, `SingleProduct.jsx:215-243`); `active_flash.product_entry.{flash_price,flash_price_type}` matches backend dual-write.
- QR landing correct (`/q/[code]` → `/product/by-qr-code/:code` → 301 → `/products/:slug`, noindex; legacy `/products-themed/[slug]` redirect intact).
- Portals sane (HeroGallery lightbox z-[9999], OverflowValuesModal z-[80], QuickViewModal portal).
- theme_overrides still merged (`ProductThemedSections.jsx:30`) but live page.js passes no overrides → branch effectively dead but harmless (matches "colors only from assigned theme" decision).

---

## FE AGENT 3 — Home / Sections / Shop / Search / Chat (DONE)

Scope: page.js, Home.jsx, SectionRenderer, all strip components + lib fetchers, ChatWidgetStacker, FloatingWhatsApp, ReviewsCarousel/SiteFaqSection/NewsletterForm/BrandStory/PromotionalBanner/CategoryWiseProduct/ECommerceChoice/HeroSpotlight, shop/page.jsx, CategoryViewSection, SearchBar/SearchForm + backend route/service cross-check.

### 🐛 REAL CODE BUGS
- **F3.1 — BLOCKER — ReviewsCarousel auto_featured always empty** (= F4.1, two agents agree). `GET /review?...review_rating=5&has_photo=true` → `findUserReview` throws 400 (needs review_user_id); `findUserReviewServices` (`review.services.ts:52-98`) ignores review_status/rating/has_photo anyway → `[]` → null (`:108`). Mode defaults auto_featured (`:63`). Fix: public "featured active reviews" endpoint.
- **F3.2 — HIGH — ReviewsCarousel field-name mismatches both modes** (= F4.2). reads `review_rating`/`review_photo`/`product_id` vs model `review_ratting`(double-t)/`review_image`/`review_product_id`. `findReviewsByIdsServices` returns raw lean docs no aliasing → 0 stars, no photo, no product name. Fix: read correct names.
- **F3.3 — HIGH — `/shop?sort=popular|rating|latest` page-local client sort not catalog sort.** `/filter_product` aggregation (`product.filter.services.ts:320-545`) has NO `$sort` (only skip/limit, natural order); CategoryViewSection re-sorts only current page's rows (`:176-191`). "Popular"/"Top Rated"/price only reorder ~20 arbitrary rows; even "Latest" page 2+ not continuous. Only trending adds a flag filter (still no ordering). "popular ≠ popular" class bug still present. Fix: pass sort to /filter_product + `$sort` stage; drop page-local re-sort.
- **F3.4 — HIGH — 3 default-ON sections render nothing.** HOME_SECTION_DEFAULTS (`setting.services.ts:317-341`) ships `trust_strip`(1)/`feature_categories`(2)/`offers_block`(5) enabled:true, but SECTION_COMPONENTS (`SectionRenderer.jsx:26-45`) has no mapping → null (`:68`). Fresh clone: top 2 home slots + offers block blank. Orphaned components on disk (FeatureCategories/AdsSection/OnlyForYouProduct/SliderAd/NewFeatureCategories). Fix: wire OR flip defaults to false.
- **F3.5 — SMELL — FlashSale empty-guard never fires; dead-code** (commented out of Home.jsx:26). `products?.length===0` (`:17`) always false (object not array). If re-enabled, empty sale renders empty slider. Fix: `!products?.flash_sale_products?.length`.
- **F3.6 — SMELL — ECommerceChoice currency var misnamed** (`:22` `currencySymbol = settingData?.data[0]` = whole doc; reads `.currency_symbol`). Also `data[0]` no optional chain → throws if data undefined.

### ❌ DOC WRONG
- **D(3.1) — Chat architecture: TWO components, WhatsApp NOT in stacker.** Doc (`frontend.md:628-635`) says one 3-button ChatWidgetStacker incl WhatsApp. Real: WhatsApp = separate `FloatingWhatsApp.jsx` (mounted `layout.js:30`); ChatWidgetStacker only Messenger+live-chat, renders nothing unless Messenger enabled.
- **D(3.2) — strip endpoints stale:** bestsellers/Popular → `/product/top_selling` (doc says popular_product); new_arrivals → `/product/new_arrival`; ecommerce_choice → `/product/top_selling` (dedicated route deprecated); category_wise_strip → `/product/just_for_you_product` grouped by explore_category_show.
- **D(3.3) — `/shop` → `CategoryViewSection`** not `Shop.jsx` (orphaned). No separate "ProductListing engine" — CategoryViewSection is the single listing engine for /shop + /category.
- **D(3.4) — section registry table** lists `feature_service` (NOT in defaults) + omits real default ids trust_strip/feature_categories/offers_block/just_for_you.
- **D(3.5) — getServerSettingData revalidate = 60s** not 600 (`getServerSettingData.js:7`).

### ⚠️ DOC MISSING
- Newsletter `/newsletter-subscriber/subscribe`, FAQ `/site-faq/active`, reviews `/review/by-ids` endpoints not in fetch table.
- Boutique HeroSpotlight/ProductFeatures client-fetch trending feed (`/product/trending_product`), take products[0], auto-hide if none.
- Search dropdown single-tier (products only, `/shop?search=`), not the memory's "4-tier"; SearchForm/SearchBar undocumented.
- Settings-driven copy/modes: reviews_carousel_mode/_title/_ids, newsletter_collect_mode/_section_title/_subtitle, brand_story_*, site_faq_section_title, currency_symbol, chat_widgets_position.

### ✅ CONFIRMED
- **Chat field-name sweep (s44 fix holds):** ChatWidgetStacker reads `chat_messenger_show`/`chat_messenger_page_id`/`chat_livechat_show`/`chat_livechat_embed_code` (correct `_show`); WhatsApp `enable_whatsapp_chat`/`whatsapp_number`. All match setting.model.
- **Live-chat script injection correct:** parses embed → clones each `<script>` into fresh `document.createElement("script")` + appends (the dangerouslySetInnerHTML gotcha handled). Double-inject guard.
- SectionRenderer enabled-filter + order-sort + SERVER_SIDE_IDS skip + unknown-id null. home_section_array stays full 18, no trim.
- Search→shop wiring (`/shop?search=` → `&searchTerm=` → /filter_product honors server-side).
- Graceful-null on BrandStory/SiteFaq/Newsletter/HeroSpotlight/ReviewsCarousel; getServerSettingData failures caught.
- Hardcoded leather/wallet copy (PromotionalBanner.jsx:26-31) = known intentional leftover, not a bug.

---

## FE AGENT 4 — Auth / Dashboard / Wishlist / Reviews / SEO (DONE)

Scope: auth API + 5 auth forms, verify, set/change/forget-password, user-profile shell + tabs, wishlist sync + page, all review display/submit (themed+non-themed), analytics scripts + useAnalytics + advanced matching, root layout, getSeoConfig/buildPageMeta, PDP metadata, compare + backend user/review cross-check.

### 🐛 REAL CODE BUGS
- **F4.1 — BLOCKER — home ReviewsCarousel auto_featured permanently empty** (= F3.1). See F3.1.
- **F4.2 — HIGH — ReviewsCarousel wrong field names** (= F3.2). `review_rating`/`review_photo`/`product_id` vs `review_ratting`/`review_image`/`review_product_id`. Genuine user reviews (populated review_user_id.user_name) show "Customer" because only reviewer_name read. Fix: correct names + `reviewer_name || review_user_id?.user_name`.
- **F4.3 — HIGH — `useVerifyMutation` hits non-existent `/user/update_user_status`** (`authApi.js:73-80`); real route `POST /user/verifyOTP`. VerifyForm.jsx:34 calls it → standalone /verify can never verify.
- **F4.4 — MEDIUM — orphaned `/verify` flow + dead localStorage contract.** VerifyForm reads `sign_up_login_credentials`/`sign_up_user_name`/`sign_up_otp_system` but NOTHING writes them; no `router.push("/verify")` anywhere; backend `postUser` sets user_verified:true immediately → no OTP on signup. /verify + VerifyForm + resend_otp all dead.
- **F4.5 — MEDIUM — Meta Pixel PageView fires twice on first load.** Inline init (`MetaPixelScript.jsx:35`) calls track PageView AND PageViewTracker useEffect (`:11-13`) on mount → duplicate. TikTok unaffected (inline only ttq.load). Fix: skip initial mount in PageViewTracker.
- **F4.6 — SMELL — `WriteProductReview.jsx` non-functional** (no state binding, no submit handler). Only referenced from dead non-themed tree. Flag for deletion.
- **F4.7 — SMELL — logout endpoint mismatch:** UserProfile.jsx:79 posts `/authentication/logout` (admin route); storefront route is `POST /user/logout` (`user.routes.ts:51`). Works only if both clear same cookie. Confirm.

### ❌ DOC WRONG
- **D(4.1) — signup is NOT OTP-gated.** Doc + CLAUDE.md say "sign-up → verify → set-password → sign-in". Code: direct + auto-verified (`user.controllers.ts:113-115`), SignUpForm → /sign-in. OTP only in password-recovery (/forget-password → /change-password) + /set-password wizard.
- **D(4.2) — verify route inconsistency:** doc says POST /user/verifyOTP (correct route) but authApi verify mutation hits non-existent /user/update_user_status (F4.3).
- **D(4.3) — wishlist IS DB-backed.** Doc/CLAUDE.md F-10 say localStorage-only / "no backend wishlist module". Real: full backend wishlist module + FE sync (`wishlistSync.js`: /wishlist/sync,/add,/remove,GET) wired into login + page-load. localStorage = source of truth, DB = additive cross-device. (frontend.md:673 endpoint table contradicts itself — DOES say "DB-backed, D15".)
- **D(4.4) — analytics IDs DB-first.** CLAUDE.md says env-var only. Real: `getSeoConfig.js:72-86` DB→env→null gated by *_enabled toggles. frontend.md:541 correct; CLAUDE.md stale.
- **D(4.5) — user-profile tabs wrong** (`frontend.md:428-437`). Doc: Dashboard/ProfileSetting/PurchaseHistory/Review/OfferHistory/Wishlist/ChangePassword. Real (`UserProfile.jsx:34-45`): Dashboard/PurchaseHistory/Wishlist/Addresses/OrderTracking/MyCoupons/LoyaltyPoints/Wallet/Reviews/ProfileSetting. No OfferHistory/ChangePassword tab; 4 live tabs (Addresses/Coupons/Loyalty/Wallet) omitted.
- **D(4.6) — react-helmet-async claim** (`frontend.md:25`) — no evidence; all metadata via App Router generateMetadata. Likely stale dep claim.

### ⚠️ DOC MISSING
- Guest "no password set" 400 → auto-redirect `/forget-password?phone=` (`LoginForm.jsx:95-110`).
- `/set-password` = full 5-step OTP wizard (check_phone→send→verifyOTP→setNewPassword) w/ already_verified/no_account branches; uses WORKING verify path (raw fetch `SetPassword.jsx:340`) unlike broken mutation.
- Wishlist variant image fallback `variation_images[0]||variation_image||main_image` (`WishList.jsx:195-199,279-283`) — canonical pattern.
- `?tab=` deep-link + mobile bottom-nav + More sheet (`UserProfile.jsx:70-73,94-97`).
- PDP generateMetadata rich (`products/[slug]/page.js:49-120`): meta/og + canonical + Product & BreadcrumbList JSON-LD w/ SKU/stock/aggregateRating. (PDP fetches product twice, known F-6.)
- Advanced Matching hardcodes `country:"bd"` (`AnalyticsAdvancedMatching.jsx:45`) — same class as BDT hardcode.

### ✅ CONFIRMED
- **reviewer_name sweep:** LIVE paths correct (themed ReviewsSection:82-83, ReviewAndReply:14-15 use `reviewer_name || review_user_id?.user_name`). Non-themed `singeProduct/...ReviewAndReply.jsx:25,37` reads only user_name BUT that tree is orphaned (no /products-original route) = dead, not live bug. ReviewsCarousel is the ONE live component on wrong field (F4.2).
- Cookie auth: all user fetches `credentials:"include"`; httpOnly fruit_snacks_token; logged-in = useUserInfoQuery → data._id; /user-profile redirects to /sign-in when no user.
- Analytics DB-driven + gating: scripts mount only when id truthy; DB→env→null gated by *_enabled; CAPI only when pixel_enabled AND capi_enabled; browser+server share eventID for dedup; currency from settings (no hardcode in events).
- set-password vs change-password distinct + functional (no confusion).
- Wishlist DB sync union-merges (local-wins, never clobbers), best-effort never throws.
