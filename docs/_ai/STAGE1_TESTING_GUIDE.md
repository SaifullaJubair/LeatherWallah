# Stage 1 টেস্টিং গাইড

**লক্ষ্য:** V1 pass-through রিলিজের end-to-end manual টেস্টিং। কাভার করে — backend Phase A (variation/attribute/filter/nested-category) + B (order/stock/price integrity) + C (payment) + D (auth hardening) + E (promo engine) + F (additive product fields) + H (warehouse/customer-group/VAT) + G (small modules), এবং প্রতিটার সাথে wired admin + storefront UI।

এই গাইড ধরে নেয় তুমি তিনটা app লোকালি Atlas `test` DB-র বিপরীতে চালাচ্ছ (দেখো [fruitsnacks-local-dev-setup memory](../../../../.claude/projects/c--Coding-Perosnal-FruitSnacks/memory/fruitsnacks-local-dev-setup.md))। শুধু সেই step গুলো লেখা যেগুলো আসলেই wired — V2-এ deferred items গুলো নিচে আলাদা section-এ, per-phase check-এ না।

---

## প্রস্তুতি (Setup)

### ১. তিনটা app চালু করো
```bash
# Terminal 1 — backend (port 5000)
cd FruitSnacksBackend
NODE_ENV=development npm run dev

# Terminal 2 — admin (port 3001)
cd FruitSnacksAdmin
npm run dev

# Terminal 3 — frontend storefront (port 3000)
cd FruitSnacksFrontend
npm run dev
```

### ২. কানেকশন স্যানিটি-চেক
- http://localhost:3000 খোলো — storefront homepage লোড হওয়ার কথা (BE থেকে data ফেচ হয়)।
- http://localhost:3001 খোলো — admin sign-in পেজ।
- ব্রাউজারে `GET http://localhost:5000/api/v1/setting` → `success: true` সহ JSON আসার কথা।

### ৩. সাইন-ইন
- **Admin (super-admin `test` DB-তে):** phone `+8801700000000`, password `123456`। সাইডবার পূর্ণ অবস্থায় dashboard-এ ল্যান্ড করবে।
- **Storefront test user:** storefront sign-up (`/sign-up`) দিয়ে একটা বানাও → OTP verify (settings-এ SMS off থাকলে OTP BE কনসোলে লগ হয়)। verify-এর পর password set + sign-in। যে phone ব্যবহার করেছ সেটা টুকে রাখো — পরে আবার লাগবে।

### ৪. প্রতিটা major test-এর আগে reset
- Order/stock টেস্ট `product_quantity` ও stock flag গুলো dirty করে। admin-এ এক-দু'টা product বেছে → fresh run-এর আগে known qty (যেমন 100) সেট করে নাও।
- Loyalty/wallet টেস্ট user-এর balance dirty করে। আগে-পরে note করো।

---

## Phase-by-phase tests

### Phase A — Variation / Attribute / Filter / Nested Category

**Scope:** নতুন attribute-driven variation engine end-to-end কাজ করছে কিনা confirm (admin attribute + product variation বানায়, storefront attribute facet দিয়ে ফিল্টার করে, PDP spec table render করে)।

**Admin:**
1. **Attributes** → `/attribute` → "Add Attribute" (যেমন "Size") + values ("S", "M", "L") যোগ করো। Save।
2. **Category** → `/category` → nested tree picker কাজ করছে confirm (root → child → leaf)। পরের step-এর জন্য একটা leaf category বেছে নাও বা বানাও।
3. **Product → Add Product** (`/product/product-create`):
   - tree থেকে leaf category পিক করো (পুরনো ৩-dropdown chain না — সেটা retired)।
   - "Product Variation" ON করো → "Size" attribute assign করো → variant axis হিসেবে mark করো → প্রতিটা value-র জন্য variation matrix-এ row আসবে।
   - base price set করো; প্রতি variation row-এ `variation_price_delta` set করা যাবে (base-এর উপর যোগ হবে)।
   - Save।
4. সংরক্ষিত product **Update Product** খোলো → `product_attributes[]` + `variant_axes[]` round-trip-এ টিকেছে কিনা confirm।

**Frontend:**
1. PDP `/products/<slug>` খোলো → spec table-এ "Size" তোমার দেওয়া values সহ থাকবে।
2. gallery-তে variation switch করো → price block delta অনুযায়ী reflect (base + delta) করবে।
3. একটা category listing পেজ খোলো → সেই category-র জন্য filter facet UI wired থাকলে attribute সেখানে দেখাবে।

**DB/Backend verify:**
- Mongo `products` doc → `product_attributes: [{attribute_id, value_ids[]}]` + `variant_axes: [{attribute_id, is_mandatory}]` populated।
- Mongo `variations` doc → `combination: [valueId, ...]` + `price_delta` + `is_active`।

**Edge case:**
- Category ছাড়াই product বানানোর চেষ্টা — এখন allow হবে (Phase L `category_id` optional করেছে)। Subtree filter narrow করবে না; expected।
- Variation-এর `combination` invalid value_id-তে edit → save reject (BE assigned attribute-এর বিরুদ্ধে validate করে)।

---

### Phase B — Order / Stock / Price Integrity

**Scope:** Server placement-এর সময় DB থেকে সব total recompute করে আর placement transaction-এর ভিতরে atomically stock decrement করে। Confirm — tampering reject হয়, OOS cleanly abort হয়, cancel/return idempotently restock করে।

**Setup:** একটা test product বেছে নাও, `product_quantity` note করো (`Q0` ধরো), ছোট রাখো (যেমন 5) যাতে OOS test দ্রুত হয়।

**Storefront (B1 price tamper):**
1. cart-এ product যোগ → checkout → **Place Order** চাপার আগে DevTools Network খোলো → JSON request body edit করো → `product_unit_final_price` (ধরো) 380 থেকে 5 করো → resend।
2. Order তবু place হবে, কিন্তু admin order detail চেক করো — `grand_total_amount`-এ **server-recomputed** value (380 × qty) দেখাবে, 5 না। (Owner rule: server wins, never rejects।)

**Storefront (B2 OOS at placement):**
1. DB-তে `Q0 = 5`, DevTools-এ edit করে 9999 quantity-র order place করো।
2. BE error দেবে যেমন `"Out of stock"`; `product_quantity` 5-এই থাকবে (transaction aborted)।

**Admin (B2 cancel restock):**
1. 2 unit-এর সাধারণ order place করো → stock `Q0 − 2` হবে।
2. **Order List → view order** → status `cancel` (বা `return`) করো।
3. Stock `Q0`-তে ফিরবে। আবার cancel করো — stock `Q0`-তে থাকবে (`stock_restored` flag double-restock ঠেকায়)।

**Admin (B4 low-stock):**
1. admin-এ একটা product-এর `product_alert_quantity` 10, `product_quantity = 8` সেট করে save।
2. Sidebar → **Products → Low Stock** (`/low-stock`) → product red/amber stock badge সহ দেখাবে।
3. **Edit** চাপো → ProductUpdate-এ যাবে। `product_quantity = 50` → save → Low Stock revisit → product আর list-এ নেই।

**DB/Backend verify:**
- `orders` doc → `grand_total_amount`, `sub_total_amount`, `discount_amount`, `vat_amount` server recompute-এর মান, client value না।
- `orders.stock_restored` flag প্রথম cancel-এর পর `true`, দ্বিতীয় cancel-এ `$inc` ঘটবে না।

**Edge case:**
- B3: meta_pixel_enabled flag set থাকা অবস্থায় order place → BE log-এ Meta CAPI Purchase event দেখো → `currency` settings থেকে (`getCurrencyCode()`) আসবে, hardcoded "BDT" না। (শুধু pixel access token + settings wired থাকলে verifiable; না থাকলে শুধু confirm করো order clean place হয়েছে।)

---

### Phase C — Payment Methods

**Scope:** চারটা gateway (COD, manual MFS, bank transfer, SSLCommerz) + advance/partial pay (C3)। C1 SSLCommerz live-এর জন্য `.env`-এ sandbox creds + ngrok লাগে — সেই অংশ এখানে শুধু mock-tested।

#### C-foundation + C2: Manual MFS

**Admin (settings):**
1. Settings → **Payment Methods** tab (A1-এ নতুন)।
2. **Edit Settings** চাপো → "Manual MFS" enable → একটা method row যোগ (যেমন name `bKash`, number `017XXXXXXXX`, account_type `personal`, instruction `Send Money only`)। Save।

**Storefront (checkout):**
1. একটা product যোগ → checkout → delivery info ভরো।
2. নতুন **Payment Method** card (F1a) এখন COD-এর পাশে "Mobile Wallet" দেখাবে। সেটা পিক করো → instruction block + তোমার save করা number radio card-এর নিচে দেখাবে (pre-confirm)।
3. **Place Order** চাপো → `PaymentInitModal` `kind="instruction"` সহ খুলবে → numbers list + invoice + amount due।
4. ফেক trxId (`TEST123`), method name `bKash`, তোমার sending number টাইপ করো → **Submit Transaction ID**।

**Admin (verify):**
1. Admin → Order → এইমাত্র placed order খোলো।
2. **Payment** card (A4) → দেখাবে `payment_method: manual_mfs`, `payment_status: pending`, `submitted method: bKash`, `payer number`, `transaction_id: TEST123`।
3. **Mark Paid** চাপো → modal → amount blank রাখো (BE remaining owed ভরে দেবে) → optional note → confirm।
4. Reload → `payment_status: paid`, `paid_amount = grand_total`, `verified_at` + `verify_note` filled।

**DB verify:** `orders` doc → `payment_meta.method_name`, `payment_meta.payer_number`, `payment_meta.verified_by`, `payment_meta.verify_note` সব write হবে।

#### C4: Bank transfer + screenshot upload

1. **Settings → Payment Methods** → Bank Transfer enable → একটা bank account row + instruction যোগ। Save।
2. Storefront checkout → Bank Transfer পিক → pre-confirm-এ bank account details দেখাবে।
3. Order place করো → `PaymentInitModal` খুলবে → trxId form-এ **deposit-slip screenshot** file input visible (শুধু bank_transfer-এ)।
4. যেকোনো image attach → trxId enter → submit।
5. Admin → Order → **Payment** card → screenshot thumbnail + "Open full size" link থাকবে; click করলে S3 URL খুলবে।

#### C3: Advance / partial pay

**Admin (settings):**
1. **Payment Methods** tab → "Advance payment" enable → min% (যেমন 20) সেট → advance leg-এর জন্য কোন methods allowed পিক (যেমন শুধু SSLCommerz — অথবা SSLCommerz creds না থাকলে Manual MFS পিক)। Save।

**Storefront (checkout):**
1. main method হিসেবে **COD** পিক।
2. **Advance Pay** card (F1b) এখন একটা checkbox সহ দেখাবে "Pay X% advance, rest on delivery"।
3. checkbox tick করো → method picker শুধু allowed methods দেখাবে → amount auto-fill হবে `⌈grand_total × minPct / 100⌉`-এ।
4. amount min-এর নিচে set করার চেষ্টা করো → **Place Order**-এ BE clean error দিয়ে reject করবে।
5. valid amount-এ reset → place। BE order place করবে `payment_method: cod` + `advance_amount = X` সহ, তারপর post-commit advance gateway kick off করবে শুধু advance-এর জন্য।

**Admin verify:** Order doc → `advance_amount = X`, প্রথমে `payment_status = unpaid`। যখন advance amount-এর জন্য Mark Paid করবে, status `partial` হবে। যখন delivery COD-rest confirm করবে, দ্বিতীয় Mark Paid (amount = বাকি) → `paid` হবে।

#### C1: SSLCommerz (live test — owner deploy task)

**Mock-mode (ship time-এ কোডে verified; এই গাইডে live action লাগবে না):** ship time-এ কোড 20/20 mock test pass করেছে। সত্যিই live চালাতে:
1. https://developer.sslcommerz.com/registration/ -এ sandbox register করো।
2. `FruitSnacksBackend/.env`-এ `SSLCOMMERZ_STORE_ID` + `SSLCOMMERZ_STORE_PASSWORD` সেট করো।
3. ngrok দিয়ে backend expose → `.env`-এ `BACKEND_PUBLIC_URL` + `FRONTEND_PUBLIC_URL` সেট।
4. Admin → Payment Methods → SSLCommerz enable, sandbox=true রাখো।
5. Storefront checkout → "Cards / SSLCommerz" পিক → order place → browser sandbox gateway-তে redirect → test payment complete → callback verify → order `paid` হবে।

---

### Phase D — Auth Hardening

**Scope:** Token payload-এ `_id` আছে, lifetime ঠিক (admin 7d, user access 30d, refresh 90d), refresh token access হিসেবে ব্যবহার করা যাবে না, OTP bcrypt-hashed brute-force cap সহ।

**Admin (D1 token shape):**
1. Admin sign-in → DevTools Application → Cookies → `fruit_snacks_token`।
2. JWT body decode করো (jwt.io-তে paste): expected `kind: "access"`, `who: "admin"`, `_id`, `role_id`, `exp` ~7 দিন পরে।

**Admin (D2 refresh):**
- refresh flow wired (`POST /admin_reg_log/refresh` ও `POST /user/refresh`) কিন্তু V1-এ frontend auto-refresh interceptor নেই (V2-তে deferred)। manual test:
  1. curl বা REST client দিয়ে existing cookie সহ `POST http://localhost:5000/api/v1/admin_reg_log/refresh` hit → নতুন access + refresh cookies ফিরবে।
  2. refresh token-কে access হিসেবে পাঠানোর চেষ্টা করো (access cookie-তে refresh value সেট) → reject হবে ("wrong kind")।

**Storefront (D3 OTP):**
1. নতুন phone দিয়ে sign-up → OTP trigger → 60s cooldown enforce: 60s-এর ভিতরে "Resend" চাপো → reject হবে।
2. পরপর 6টা ভুল OTP enter → 6th attempt attempt-cap error দিয়ে block হবে।
3. সঠিক OTP দাও (SMS off হলে BE console log থেকে পড়ো) → verify → password set-এ যাও।

**DB verify:** `users` doc → `forgot_otp` `$2`-prefixed bcrypt hash (raw digit না), `otp_sent_at`, `otp_attempts` populated।

**Admin (D4 self password-reset):**
1. Admin sign-in পেজ → **Forgot password** flow → admin phone enter → BE OTP পাঠায় (বা log করে)।
2. OTP + new password enter → success → new password দিয়ে sign-in → কাজ করবে।
3. (Optional) `123456`-এ ফিরিয়ে আনো যাতে অন্য dev-দের জানা credential থাকে।

---

### Phase E — Promo Engine

**Scope:** Flash sale, tier pricing, coupon hardening, wallet ledger। (BOGO admin-side fields BE-তে আছে কিন্তু storefront cart-wiring V2-এ।)

**Admin (Flash Sale CRUD, A3a):**
1. Sidebar → **Flash Sale** (Marketing cluster) → Create।
2. Title "Today Flash" → start = now − 1 min, end = now + 1 hour → status active → একটা product row যোগ `flash_price_type: fixed`, `flash_price: 99` সহ → save।
3. Table → row-এর পাশে "Live now" badge দেখাবে (কারণ now ∈ [start, end] AND status=active)।

**Storefront (PDP F2 countdown):**
1. flash-sale product-এর PDP খোলো → price block-এর ঠিক নিচে **Flash Countdown** badge end time-এ tick করবে।
2. Cart-এ যোগ → cart line flash price reflect করবে (BE resolver recompute-এ apply করে)।
3. একটা test order place → admin order detail → unit price 99, regular price না।

**Admin (tier_prices A2a, F2 hint):**
1. একটা product → ProductUpdate → "Advanced — Logistics, Tax & Pricing" expand → দুটো tier row যোগ: `min_qty=5, price=300` ও `min_qty=10, price=250`। Save।
2. Storefront PDP → tier hint chips দেখাবে ("5+ → ৳300", "10+ → ৳250")।
3. Cart-এ 10 unit যোগ → checkout → server lowest-applicable tier (250) apply করবে, grand total সেটা reflect করবে।

**Admin (Coupon hardening — existing UI):**
1. Coupon page → `coupon_use_per_person = 1` ও `coupon_available = 5` সহ coupon create।
2. Storefront → customer X হিসেবে সেই coupon দিয়ে order place → succeeds।
3. Customer X আবার ব্যবহারের চেষ্টা → BE block ("per-person limit reached")।
4. DB-তে `coupon.coupon_available` decrement দেখো; 0-তে পৌঁছালে BE নতুন ব্যবহার block করবে।

**Wallet (E + V):**
1. Admin sidebar → **Wallet** (Loyalty Points-এর পাশে, V-তে যোগ হয়েছে) → AsyncSelect-এ user বেছে নাও → balance card + empty ledger।
2. +500 reason "test top-up" দিয়ে apply → balance update, ledger row আসবে (`admin_credit`)।
3. −9999 apply → BE reject (insufficient balance)।
4. Storefront → সেই user হিসেবে login → Profile → **Wallet** tab → balance + history admin view-এর সাথে মিলবে (একই `data: {rows, balance}` shape)।

---

### Phase F — Additive product fields + sold_count + view_count + QR + product_type

**Scope:** সব Phase F admin field + এদের পড়া storefront badge + view-count auto-bump।

**Admin (A2a + A2c — product editor):**
1. ProductUpdate খোলো → **Advanced — Logistics, Tax & Pricing** expand → ভরো: video_link (YouTube URL), condition `new`, weight grams, dimensions (l/w/h), VAT override (যেমন 5)।
2. **Product Type & Custom Fields** expand → `product_type` পিক করো। `digital` → download_url + license_key field দেখাবে; `combo` → bundle items product picker; `preorder` → available_from datetime; `subscription` → billing interval। প্রতিটা branch try করো।
3. Custom rows: `{label: "Origin", value: "Rajshahi", icon_key: "lu:MapPin"}` যোগ → save।

**Admin (ProductMetaPanel — A2c):**
1. StepOne form-এর উপরে **ProductMetaPanel** দুটো stat pill দেখাবে: **Sold** (`sold_count`, এখন 0) + **Views** (`view_count`)।
2. **Generate QR** চাপো → BE data-URL ফেরাবে; preview thumbnail + slug payload দেখাবে।

**Storefront (F2 view_count fire):**
1. fresh tab-এ PDP খোলো → admin ProductUpdate reload → **Views** pill 1 বাড়বে।
2. PDP refresh করো (same browser session) → views বাড়বে না (session-storage dedupe)।
3. Incognito window-এ PDP খোলো → views আবার 1 বাড়বে।

**Storefront (F2 sold_count badge):**
- badge render হতে হলে product-এর ন্যূনতম 5 sale লাগে (intentional — single-digit social proof দুর্বল)।
- একই product-এর জন্য 5টা order place করো (small Q0 trick: 5টা separate single-unit order) → PDP reload → price-এর নিচে "5+ ইতিমধ্যে কিনেছেন" badge দেখাবে।

---

### Phase H — Warehouse / customer_group / group_prices / VAT

**Scope:** Multi-warehouse stub (V1-এ শুধু product-level) + customer-tier pricing + site/per-product VAT।

**Admin (Warehouse CRUD — A3a):**
1. Sidebar → **Warehouses** (Settings cluster) → একটা `is_default: true` সহ Create। দ্বিতীয়টা বানাও (সেটাও default) → BE auto প্রথমটা unset করে দেবে (একসাথে শুধু একটাই default)।
2. একটা product → Advanced section → **Warehouse** Select → দ্বিতীয় warehouse পিক → save।

**Admin (customer_group editor — A3a):**
1. Sidebar → **Customer** → একটা row পিক → Edit → `customer_group: wholesale` set। Save।
2. Customer table column "Group" → badge color বদলাবে (retail=gray / wholesale=amber / VIP=purple)।

**Admin (group_prices — A2a):**
1. একটা product খোলো → Advanced section → "Bulk & Group Pricing" → `group: wholesale, price: 300` row যোগ। Save।

**Storefront (F2 group hint):**
1. যে user-কে `wholesale` set করেছ সেই হিসেবে sign-in → PDP → price-এর নিচে **GroupHint** panel render: "Wholesale price for you: ৳300"।
2. Sign out → PDP reload → hint উধাও (retail-এ default)।
3. wholesale user হিসেবে cart-এ যোগ → checkout → BE recompute-এ group price apply → grand total 300 reflect করবে, retail না।

**Admin (VAT — A1 + A2a):**
1. Settings → **Tax / VAT** tab → `vat_percentage = 5` set → save।
2. একটা product খোলো → Advanced section → `vat_percentage_override = 15` set → save।

**Storefront (F1a VAT preview + server recompute):**
1. শুধু VAT-override product সহ cart → checkout → Order Summary card-এ "VAT (5%)" line দেখাবে sub-এর ~5%। Note: "estimated; product-specific overrides may adjust the final amount."
2. Order place → admin order detail PaymentInfoCard → `vat_amount` SERVER-computed value (এই product-এর line-এ 15%, 5% না) → disclaimer যে honest ছিল confirm করে।

---

### Phase G — Small modules (wishlist, abandoned cart, loyalty, product feed, SMS-from-settings)

**Scope:** চারটা user-facing G module + admin viewers (A3b) + RSS product feed + SMS provider settings।

#### G1 Wishlist

**Storefront:**
1. PDP → wishlist icon চাপো → product added (আগের মতোই localStorage-based)।
2. Profile → **WishList** tab → product দেখাবে।
3. Sign out + আবার sign-in → login-এর পর `syncWishlistAfterLogin()` fire → BE `/wishlist/sync` upsert করবে।
4. পেজ reload → FE additively DB rows pull করে + localStorage-এ merge → list-এ local + DB-backed দু'টোই থাকবে।

**Admin (A3b viewer):**
1. Sidebar → **Wishlists** (Customer area) → table-এ সব user-এর wishlist row name/phone/product/group badge সহ দেখাবে।
2. phone বা user_name দিয়ে search → table filter হবে।

#### G2 Abandoned cart

**Storefront:**
1. cart-এ product যোগ → checkout → phone field ভরো → 30 সেকেন্ড অপেক্ষা।
2. BE log খোলো → 1টা `POST /abandoned-cart/capture` fire হবে। (অথবা tab close করো `beforeunload` trigger করতে — সেটাও `keepalive: true` সহ fire হয়।)
3. এখন order place করো → BE post-commit row auto `recovered: true` mark করবে (দ্বিতীয় call লাগবে না)।

**Admin (A3b viewer):**
1. Sidebar → **Abandoned Carts** (Order cluster) → row phone, items count, total, age, status সহ দেখাবে।
2. "Not recovered" filter → শুধু un-placed rows। "Recovered" filter → শুধু order-এ পরিণত rows।

#### G3 Loyalty

**Admin (LoyaltySettings):**
1. Settings → **Loyalty** tab → enable, earn_rate = 1, redeem_rate = 0.01, max_redeem_percent = 50 set → save।

**Storefront (earn):**
1. একটা order place (যেকোনো total) → placement-এর পর BE `earnOnOrder` fire → user-এর `loyalty_points` `Math.floor(grand_total × earn_rate)` দিয়ে increment।
2. Profile → **Loyalty Points** tab → balance card + ledger row `order_earn`।

**Storefront (F1b redeem):**
1. positive balance থাকলে checkout-এ যাও → **Use loyalty points** panel render হবে।
2. redeem-এর জন্য points type করো → live preview "−৳X off" দেখাবে; Order Summary card adjust হবে।
3. Order place → BE clamp + apply → commit-এর পর negative delta + matching `reference_id` (invoice) সহ `order_redeem` ledger row আসবে।

**Admin (A3b adjuster + V Wallet mirror):**
1. Sidebar → **Loyalty Points** → user AsyncSelect → balance + history table।
2. +100 reason "compensation" দিয়ে apply → balance update → ledger-এ `admin_adjust` row।

#### G4 Product feed

1. browser-এ `http://localhost:5000/api/v1/product-feed/feed.xml` খোলো → RSS 2.0 XML `g:` namespace field সহ render হবে।
2. শুধু active products list করছে confirm — availability + price + condition + brand সহ। (owner এই URL Meta/Google-এ share করবে — admin UI লাগবে না।)

#### G5 SMS from settings

**Admin:**
1. Settings → **SMS Provider** tab → provider_name, api_key, sender_id set → enable। Save।
2. OTP send trigger করো (sign-up বা password reset)। BE log চেক: settings creds ব্যবহৃত হবে (settings empty হলে শুধু `.env`-এ fall back)।
3. toggle disable করো → আবার OTP trigger → BE short-circuit, SMS পাঠাবে না; কিন্তু OTP তবু log হবে যাতে manual verify করতে পারো।

---

## End-to-end scenario — full happy-path order

**একটা buyer journey catalog → cart → checkout → admin verify → delivered কভার করে।**

1. **Admin prep:** Settings → COD + Manual MFS enable করো। একটা product বেছে `product_quantity = 10` set। একটা flash sale entry যোগ (price 99, end +30 min) যাতে buyer badge দেখে।
2. **Buyer:** Storefront → flash-sale product-এর PDP-তে যাও → flash countdown + sold badge (যদি ≥5 sale) দেখাবে → 2 unit cart-এ যোগ।
3. **Cart → Checkout:** delivery info ভরো, phone type করো। 30s অপেক্ষা — abandoned-cart capture row লেখা হবে (BE log)।
4. checkout-এ **Manual MFS** পিক → numbers visible। Order place।
5. **Buyer:** `PaymentInitModal` খুলবে → trxId `MFS12345` + method "bKash" type → submit। Modal "Submitted." দেখাবে → "Go to my orders" চাপো।
6. **Admin:** Order list → order খোলো। PaymentInfoCard দেখাবে status `pending`, transaction_id, submitted_at। **Mark Paid** চাপো → amount blank রাখো → confirm। Status `paid`, paid_amount = grand_total, verified_at filled।
7. **Admin:** Order list → order_status `delivered` করো (অথবা courier wired থাকলে Steadfast/Pathao-এর মাধ্যমে push)। Stock placement-এই কমেছিল (Phase B), তাই আর stock action লাগবে না।
8. **DB checks:** `orders` doc-এ full breakdown; `loyalty_transactions`-এ `order_earn` row; step 3-এর abandoned-cart row এখন `recovered: true` + `recovered_order_id` order-এ link করা; product `sold_count` 2 বেড়েছে।

প্রতিটা step intervention ছাড়া কাজ করলে V1 pass-through সুস্থ।

---

## Known issues / V2-এ deferred

এগুলো testing-এ ভাঙবে না — by design wired না (অথবা owner-deploy task):

| Item | কেন deferred | কোথায় যাবে |
|---|---|---|
| Frontend auto-refresh interceptor (D2) | Token 7d/30d; V1-এ manual re-login acceptable। | V2 baseQuery wrapper |
| BOGO storefront cart wiring | Coupon BE field ready, admin rule author করতে পারে; cart-engine rewrite V2 scope। | V2 storefront cart rewrite |
| Variation-level `warehouse_id` UI | Product-level fallback কাজ করে; per-variation stock distribution advanced। | V2 multi-warehouse stock |
| SSLCommerz live end-to-end | কোড mock-verified 20/20; owner sandbox creds in `.env` + ngrok লাগবে। | Owner deploy task (উপরে C1 section দেখো) |
| Theme `theme_overrides` dead-field cleanup | FE এখনো ৩টা ফাইলে defensively read করে। | V2 frontend rebuild |
| RBAC refactor (~100 boolean flag → resource×action map) | Roadmap-এ explicit "schedule separately"। | V2 admin rebuild |
| Combination-stock migration | এখনো legacy `variation_quantity` ব্যবহার। | V2 stock engine |
| Shipping-cost server recompute | B1 এখন client `shipping_cost` trust করে। | Delivery-zone কাজ হলে |
| Doc refresh | Root `docs/*.md` + per-app CLAUDE.md/README — সব Phase-A rewrite-এর পর stale। | V2 শুরুর আগে End-of-Stage-1 cleanup |

**উপরের per-phase section অনুযায়ী কিছু কাজ না করলে সেটা real bug — request payload + response capture করো, fix করব।**
