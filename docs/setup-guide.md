# FruitSnacks — সম্পূর্ণ সেটআপ গাইড (নতুন প্রজেক্টে ক্লোন ও কাস্টমাইজ)

> এই গাইড অনুসরণ করে আপনি FruitSnacks codebase clone করে নিজের নতুন brand-এ চালাতে পারবেন।
> Total সময়: প্রথমবার ~৪-৬ ঘন্টা (account setup সহ), শুধু code part ~৩০ মিনিট।

---

## 📋 যা যা আগে থেকে দরকার (Prerequisites)

### আপনার কম্পিউটারে install থাকতে হবে:

| Software | Version | কেন দরকার | Download Link |
|----------|---------|-----------|---------------|
| **Node.js** | ১৮ বা তার উপরে | সব ৩টা project চালানোর জন্য | https://nodejs.org |
| **Git** | যেকোনো recent | Code clone করার জন্য | https://git-scm.com |
| **VS Code** | যেকোনো recent | Code edit করার জন্য (recommended) | https://code.visualstudio.com |
| **MongoDB Compass** | latest | Database visually দেখার জন্য (optional) | https://www.mongodb.com/products/compass |

### Account তৈরি করতে হবে (সেটআপ-এর আগে):

#### বাধ্যতামূলক:
1. **MongoDB Atlas** account — Database hosting → https://www.mongodb.com/cloud/atlas/register
2. **DigitalOcean** account — File storage (ছবি/ভিডিও) → https://cloud.digitalocean.com/registrations/new
3. **Domain name** কেনা — Namecheap, GoDaddy, Hostinger যেকোনো জায়গা থেকে

#### বাংলাদেশী মার্কেটের জন্য:
4. **Pathao Merchant** account — কুরিয়ার → https://merchant.pathao.com
5. **Steadfast Merchant** account — কুরিয়ার → https://steadfast.com.bd
6. **BulkSMS BD** account — OTP SMS → https://bulksmsbd.net

#### মার্কেটিং-এর জন্য (পরে set করা যাবে):
7. **Meta Business** account + Pixel → https://business.facebook.com
8. **TikTok Business** account + Pixel → https://business.tiktok.com
9. **Google Analytics 4 + GTM** → https://analytics.google.com
10. **Microsoft Clarity** (free) → https://clarity.microsoft.com

#### Deployment-এর জন্য:
11. **Vercel** account (free tier দিয়ে শুরু করা যায়) — Frontend ও Admin host করতে
12. **Railway/Render/DigitalOcean Droplet** — Backend host করতে

---

# 🚀 PART 1 — Local Machine-এ চালানো (Development Setup)

আগে নিজের কম্পিউটারে সব ঠিকঠাক কাজ করছে নিশ্চিত করি, তারপর deploy করব।

## Step 1: Code নিজের জায়গায় আনুন

### Option A: নতুন project হিসেবে copy করুন (recommended)

```bash
# FruitSnacks ফোল্ডার পুরো কপি করুন
# Windows-এ:
xcopy "C:\Coding\Perosnal\FruitSnacks" "C:\Coding\MyNewShop" /E /I /H

# Linux/Mac-এ:
cp -r ~/FruitSnacks ~/MyNewShop
```

### Option B: Git থেকে clone করুন (যদি repo থাকে)

```bash
git clone <your-repo-url> MyNewShop
cd MyNewShop
```

## Step 2: পুরোনো `.env` ফাইলগুলো remove করুন

⚠️ **খুবই গুরুত্বপূর্ণ:** পুরোনো deployment-এর credentials থাকা ৩টা .env ফাইল delete বা rename করতে হবে — না করলে আপনার নতুন business ভুল credentials দিয়ে চলবে।

```bash
cd MyNewShop

# Backend
del FruitSnacksBackend\.env
# অথবা rename করে রাখুন reference হিসেবে
ren FruitSnacksBackend\.env .env.old

# Admin
del FruitSnacksAdmin\.env
# অথবা
ren FruitSnacksAdmin\.env .env.old

# Frontend
del FruitSnacksFrontend\.env
del FruitSnacksFrontend\.env.local
# অথবা
ren FruitSnacksFrontend\.env .env.old
ren FruitSnacksFrontend\.env.local .env.local.old
```

## Step 3: Dependencies install করুন

প্রতিটা sub-project আলাদাভাবে install করতে হবে। প্রায় ৫-১০ মিনিট সময় লাগবে।

### ৩.১ Backend

```bash
cd FruitSnacksBackend
npm install
```

### ৩.২ Admin

```bash
cd ../FruitSnacksAdmin
npm install
```

### ৩.৩ Frontend

```bash
cd ../FruitSnacksFrontend
npm install
```

✅ সব successfully install হয়েছে কিনা check করুন — কোনো error থাকলে Node.js version verify করুন (১৮+ লাগবে)।

---

# 🗄️ PART 2 — MongoDB Database Setup

## Step 4: MongoDB Atlas-এ Database তৈরি

### ৪.১ Cluster তৈরি

1. https://cloud.mongodb.com -এ login করুন
2. "Build a Database" → **Free tier** (M0) select করুন
3. Region: **Singapore (ap-southeast-1)** select করুন (বাংলাদেশের কাছে, fast)
4. Cluster name: যেকোনো (যেমন: `MyShopCluster`)
5. Create

### ৪.২ Database User তৈরি

1. Sidebar-এ **Database Access** → **Add New Database User**
2. Username + Password set করুন (**লিখে রাখুন!**)
3. Built-in Role: **Atlas admin** (development-এর জন্য)
4. Add User

### ৪.৩ Network Access অনুমতি দিন

1. Sidebar-এ **Network Access** → **Add IP Address**
2. **Allow Access from Anywhere** (`0.0.0.0/0`) select করুন (development-এর জন্য সহজ)
3. ⚠️ Production-এ এটা সংকীর্ণ করতে হবে
4. Confirm

### ৪.৪ Connection String নিন

1. Sidebar-এ **Database** → আপনার cluster → **Connect** button
2. **Connect your application** → **Node.js**
3. Connection string copy করুন — এটা এরকম দেখাবে:
   ```
   mongodb+srv://USERNAME:<password>@myshopcluster.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. `<password>` জায়গায় আপনার password বসান
5. End-এ database নাম যোগ করুন (যেমন `/myshop`):
   ```
   mongodb+srv://USERNAME:YOURPASSWORD@myshopcluster.xxxx.mongodb.net/myshop?retryWrites=true&w=majority
   ```

✏️ এটা লিখে রাখুন — Backend `.env`-এ লাগবে।

---

# 📦 PART 3 — DigitalOcean Spaces (File Storage) Setup

প্রোডাক্টের ছবি, ভিডিও সংরক্ষণের জন্য।

## Step 5: DigitalOcean Spaces তৈরি

### ৫.১ Space তৈরি

1. https://cloud.digitalocean.com → **Spaces** → **Create a Space**
2. Region: **Singapore (sgp1)** select করুন
3. Enable CDN: **Yes**
4. Restrict File Listing: **Yes**
5. Name (unique): যেমন `myshop-storage`
6. Create Space → **$5/month** plan select

### ৫.২ Access Key তৈরি

1. Sidebar-এ **API** → **Spaces Keys** tab
2. **Generate New Key**
3. Name: `myshop-backend`
4. Key ID ও Secret copy করুন — Secret শুধু একবার দেখা যাবে! **লিখে রাখুন!**

### ৫.৩ Information লিখে রাখুন

```
S3_REGION=sgp1
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_ACCESS_KEY=<আপনার Access Key>
S3_SECRET_KEY=<আপনার Secret Key>
S3_BUCKET=myshop-storage  ← আপনার Space নাম
S3_PUBLIC_URL=https://sgp1.cdn.digitaloceanspaces.com
```

---

# 🔧 PART 4 — Environment Files (.env) সেটআপ

এই step-এ FruitSnacks → আপনার নিজের brand-এ change করব।

## Step 6: Backend .env File তৈরি

`FruitSnacksBackend/.env` নামে নতুন ফাইল তৈরি করুন এই content দিয়ে:

```env
# ── Database ───────────────────────────
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.xxxx.mongodb.net/myshop?retryWrites=true&w=majority

# ── Server ─────────────────────────────
PORT=5000

# ── JWT Secret ─────────────────────────
# এটা random হতে হবে — অনলাইনে generator ব্যবহার করুন:
# https://www.random.org/strings/?num=2&len=64&digits=on&loweralpha=on&unique=on&format=html
ACCESS_TOKEN=<৬৪-character random string বসান, যেমন: 7a3f8c2e1b9d4e5f6a8b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f>

# ── File Storage (DigitalOcean Spaces) ─
S3_REGION=sgp1
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_ACCESS_KEY=<Step 5.2-এ পাওয়া>
S3_SECRET_KEY=<Step 5.2-এ পাওয়া>
S3_BUCKET=myshop-storage
S3_PUBLIC_URL=https://sgp1.cdn.digitaloceanspaces.com

# ── Pathao Courier ─────────────────────
# পরে Pathao merchant account থেকে নিতে হবে
PATHAO_BASE_URL=https://api-hermes.pathao.com
PATHAO_CLIENT_ID=<Pathao থেকে>
PATHAO_CLIENT_SECRET=<Pathao থেকে>
PATHAO_CLIENT_EMAIL=<Pathao account email>
PATHAO_CLIENT_PASSWORD=<Pathao account password>

# ── Steadfast Courier ──────────────────
STEADFAST_CLIENT_ID=<Steadfast থেকে>
STEADFAST_CLIENT_PASSWORD=<Steadfast থেকে>

# ── Fraud Detection (optional) ─────────
FRAUDBD_API_KEY=<FraudBD থেকে, optional>
```

💡 Pathao/Steadfast credentials এখনই না পেলেও ঠিক আছে — placeholder রাখুন। Backend চলবে, শুধু courier feature কাজ করবে না।

## Step 7: Admin .env File তৈরি

`FruitSnacksAdmin/.env` নামে নতুন ফাইল তৈরি করুন:

```env
# Backend URL — শেষে /api/v1 দরকার নেই
VITE_API_URL=http://localhost:5000
```

## Step 8: Frontend .env File তৈরি

`FruitSnacksFrontend/.env.local` নামে নতুন ফাইল তৈরি করুন:

```env
# ── API URLs ──────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ── Analytics (পরে set করতে পারেন) ───
# Admin panel থেকে toggle on/off করা যাবে
META_PIXEL_ID=
GTM_ID=
GA4_ID=
CLARITY_ID=
TIKTOK_PIXEL_ID=

# ── Optional ──────────────────────────
GOOGLE_VERIFICATION=
META_CAPI_ACCESS_TOKEN=
TIKTOK_CAPI_ACCESS_TOKEN=
```

⚠️ Analytics IDs খালি থাকলেও কোনো সমস্যা নেই — script load হবে না শুধু।

---

# 🏃 PART 5 — সার্ভার চালু করুন

## Step 9: ৩টা Terminal-এ ৩টা Server চালু

### Terminal 1: Backend

```bash
cd FruitSnacksBackend
npm run dev
```

✅ Output দেখাবে: `: FruitSnacks server listening on port 5000`
✅ এবং: `: Database is connected Successfully`

❌ যদি error: MongoDB connection fail → MONGO_URI ঠিকঠাক check করুন
❌ যদি error: PORT in use → অন্য কোনো server বন্ধ করুন, বা PORT পরিবর্তন করুন

### Terminal 2: Admin

নতুন terminal খুলুন:

```bash
cd FruitSnacksAdmin
npm run dev
```

✅ Output: `Local: http://localhost:3001`

### Terminal 3: Frontend

আরেকটা terminal:

```bash
cd FruitSnacksFrontend
npm run dev
```

✅ Output: `Local: http://localhost:3000`

## Step 10: Browser-এ চেক করুন

- **Frontend (storefront):** http://localhost:3000
- **Admin (dashboard):** http://localhost:3001
- **Backend test:** http://localhost:5000 → দেখাবে "FruitSnacks Server is working!"

🎉 যদি ৩টাই run করে, **basic setup complete**! এখন data initialize করতে হবে।

---

# 👤 PART 6 — প্রথম Admin Account তৈরি

Database fresh — কোনো admin বা role নেই। MongoDB-তে manual entry লাগবে।

## Step 11: MongoDB Compass দিয়ে প্রথম Role ও Admin তৈরি

### ১১.১ MongoDB Compass install ও connect

1. https://www.mongodb.com/products/compass থেকে download করুন
2. Open করে **New Connection** → আপনার MONGO_URI paste করুন
3. Connect → আপনার database (`myshop`) দেখতে পাবেন

### ১১.২ প্রথম Role তৈরি

1. Database → Collections → **roles** collection (যদি না থাকে create করুন)
2. **Add Data** → **Insert Document**
3. JSON View-এ এই content paste করুন:

```json
{
  "role_name": "Super Admin",
  "category_show": true,
  "category_post": true,
  "category_update": true,
  "category_delete": true,
  "sub_category_show": true,
  "sub_category_post": true,
  "sub_category_update": true,
  "sub_category_delete": true,
  "child_category_show": true,
  "child_category_post": true,
  "child_category_update": true,
  "child_category_delete": true,
  "brand_show": true,
  "brand_post": true,
  "brand_update": true,
  "brand_delete": true,
  "attribute_show": true,
  "attribute_post": true,
  "attribute_update": true,
  "attribute_delete": true,
  "specification_show": true,
  "specification_post": true,
  "specification_update": true,
  "specification_delete": true,
  "product_show": true,
  "product_create": true,
  "product_update": true,
  "product_delete": true,
  "offer_show": true,
  "offer_create": true,
  "offer_update": true,
  "offer_delete": true,
  "campaign_show": true,
  "campaign_create": true,
  "campaign_update": true,
  "campaign_delete": true,
  "user_show": true,
  "user_create": true,
  "user_update": true,
  "user_delete": true,
  "role_show": true,
  "role_create": true,
  "role_update": true,
  "role_delete": true,
  "review_show": true,
  "review_update": true,
  "question_show": true,
  "question_update": true,
  "coupon_show": true,
  "coupon_create": true,
  "coupon_update": true,
  "coupon_delete": true,
  "banner_show": true,
  "banner_create": true,
  "banner_update": true,
  "banner_delete": true,
  "slider_show": true,
  "slider_create": true,
  "slider_update": true,
  "slider_delete": true,
  "site_setting_update": true,
  "page_seo_show": true,
  "page_seo_update": true,
  "order_show": true,
  "order_update": true,
  "offer_order_show": true,
  "offer_order_update": true,
  "customer_show": true,
  "customer_create": true,
  "customer_update": true,
  "customer_delete": true,
  "theme_show": true,
  "theme_create": true,
  "theme_update": true,
  "theme_delete": true,
  "faq_template_show": true,
  "faq_template_create": true,
  "faq_template_update": true,
  "faq_template_delete": true
}
```

4. Insert → **\_id** value কপি করে রাখুন (এটা হল আপনার role ID)

### ১১.৩ Password Hash তৈরি

Backend bcrypt দিয়ে password store করে। তাই plain password চলবে না।

**সহজ উপায় — online bcrypt generator:**

1. https://bcrypt-generator.com → password type করুন (যেমন `Admin@123`)
2. **Rounds: 10** select করুন
3. Encrypt → একটা long string পাবেন (যেমন `$2a$10$...`) — এটাই hashed password
4. কপি করে রাখুন

### ১১.৪ Admin User তৈরি

1. Compass-এ **admins** collection → Add Document
2. JSON View-এ:

```json
{
  "admin_name": "Owner",
  "admin_phone": "+8801XXXXXXXXX",
  "admin_password": "<১১.৩-তে generated hashed password>",
  "admin_country": "Bangladesh",
  "admin_status": "active",
  "role_id": { "$oid": "<১১.২-এ পাওয়া role _id>" }
}
```

⚠️ `admin_phone` এ পুরো international format দিন (`+8801XXXXXXXXX`)
⚠️ `role_id`-এ `{ "$oid": "..." }` format রাখুন — শুধু string দিলে হবে না

3. Insert

### ১১.৫ Admin-এ লগইন test

1. Browser-এ http://localhost:3001 → SignIn page
2. Phone: `+8801XXXXXXXXX` (আপনি যা দিয়েছিলেন)
3. Password: `Admin@123` (আপনি বেছেছিলেন, hashed না)
4. Login!

🎉 যদি admin dashboard দেখা যায় — সব ঠিকঠাক কাজ করছে।

---

# 🎨 PART 7 — Branding ও Site Setting Configure

এবার FruitSnacks থেকে আপনার নিজের brand-এ পরিবর্তন করি।

## Step 12: Site Settings (Admin Panel থেকে)

Admin dashboard → **Setting** menu → এই tab-গুলো পূরণ করুন:

### General/Branding tab
- **Site Title:** আপনার দোকানের নাম (যেমন `Khan's Fresh Fruits`)
- **Logo:** আপনার logo upload (PNG, transparent বেস্ট)
- **Favicon:** ছোট icon (.ico বা PNG)
- **Welcome Message:** যেমন "Welcome to Khan's Fresh Fruits"
- **Currency Symbol:** ৳
- **Currency Code:** BDT

### Contact tab
- Contact number, Email
- Address (৩টা line)
- Social: Facebook, Instagram, YouTube, WhatsApp, TikTok URL

### Policy tabs
- About Us, Return Policy, Refund Policy, Cancellation Policy, Privacy Policy, Terms & Conditions, Shipping Information
- Rich text editor দিয়ে content লিখুন

### Shipping tab
- Inside Dhaka shipping charge ও days
- Outside Dhaka shipping charge ও days
- Free delivery toggle (always / min_order / disabled)

### SEO tab
- SEO title (Google-এ যা দেখাবে)
- SEO description
- SEO keywords

### Trust Cards
- ৪টা card (যেমন: "Free Delivery", "Quality Guarantee", "24/7 Support", "Easy Returns")

### Announcement Bar
- Top rolling banner-এ কী কী text দেখাবে

### Analytics tab
- যদি Meta Pixel/TikTok/GTM IDs পেয়ে থাকেন, এখানে toggle on করুন

### SMS Provider tab (পরে BulkSMS account পেলে)
- Provider name, API key, secret, sender ID

### Courier tab
- Pathao enable + credentials
- Steadfast enable + credentials

Save → frontend reload করে দেখুন আপনার logo, title সব update হয়েছে।

## Step 13: Domain ও CORS Update

⚠️ এটা একটু technical — code edit করতে হবে।

**File:** `FruitSnacksBackend/src/index.ts` (line ~১৯-৩৭)

পুরোনো:
```ts
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4173",
    "http://admin.fruitsnacksbd.com",
    // ... fruitsnacksbd.com-এর সব variant
    "https://fruitsnacks-frontend.vercel.app",
  ],
  credentials: true,
};
```

পরিবর্তন করুন আপনার domain-এ:

```ts
const corsOptions = {
  origin: [
    "http://localhost:3000",       // dev
    "http://localhost:3001",       // dev
    "http://localhost:4173",       // vite preview
    "https://yourshop.com",        // আপনার domain
    "https://www.yourshop.com",
    "https://admin.yourshop.com",  // admin subdomain
    "https://www.admin.yourshop.com",
  ],
  credentials: true,
};
```

Backend restart করুন (Ctrl+C → `npm run dev` again)।

## Step 14: Initial Catalog Data যোগ করুন

Admin Panel থেকে:

### ১৪.১ Category
- Sidebar → **Task** → **Category** → Create Category
- Name, slug, logo upload
- Serial 1 দিন
- Status active

কমপক্ষে ১টা category থাকতে হবে — না হলে product create করতে পারবেন না।

### ১৪.২ Sub Category (Optional)
- **Task** → **Sub Category** → Create
- Parent category select করুন

### ১৪.৩ Brand (Optional)
- **Task** → **Brand Category** → Create

### ১৪.৪ Attribute (যদি variation থাকে)
- **Task** → **Attribute** → Create
- যেমন: Name "Size", values: "500g", "1kg", "2kg"

### ১৪.৫ Theme (Dynamic Product Page System)
- **Themes** menu → Add Theme
- Colors choose করুন
- Floating asset (fruit image) upload
- Save → এটা প্রোডাক্ট পেজে apply হবে

### ১৪.৬ FAQ Template (Optional)
- **FAQ Templates** → Add
- Reusable questions/answers

### ১৪.৭ Product Create
- **Products** → **Add Product**
- Name, description, price, images
- Category select
- Theme select (Step 14.5 থেকে)
- Save

🎉 এখন http://localhost:3000 -এ যান, প্রোডাক্ট দেখা যাবে!

---

# 🌐 PART 8 — Production-এ Deploy

Development testing শেষ। এখন আসল domain-এ host করি।

## Step 15: Backend Deploy (Railway recommended)

### ১৫.১ Railway-এ Backend deploy

1. https://railway.app → Sign up
2. **New Project** → **Deploy from GitHub Repo** (অথবা CLI দিয়ে)
3. Repository connect করে FruitSnacksBackend select
4. **Variables** tab-এ আপনার `.env`-এর সব value paste করুন
5. **Settings** → **Generate Domain** → URL পাবেন (যেমন `myshop-backend.railway.app`)
6. Deploy

### ১৫.২ Backend URL আপডেট

এই URL আপনি পরে frontend ও admin-এ ব্যবহার করবেন:
```
https://myshop-backend.railway.app
```

### ১৫.৩ Backend CORS update (Step 13 আবার)

`src/index.ts`-এ production domains যোগ করুন। Backend redeploy করুন।

### বিকল্প: VPS-এ deploy

DigitalOcean Droplet, AWS EC2, Vultr — VPS rent করে নিজে deploy করতে পারেন। তবে PM2, Nginx, SSL সব configure করতে হবে — beginner-friendly না।

## Step 16: Frontend Deploy (Vercel recommended)

### ১৬.১ Vercel-এ Frontend deploy

1. https://vercel.com → Sign up (GitHub দিয়ে easy)
2. **New Project** → import FruitSnacksFrontend repo
3. **Root Directory:** `FruitSnacksFrontend`
4. **Framework Preset:** Next.js (auto-detected)
5. **Environment Variables** tab-এ যোগ করুন:
   ```
   NEXT_PUBLIC_API_URL=https://myshop-backend.railway.app
   NEXT_PUBLIC_SITE_URL=https://yourshop.com
   META_PIXEL_ID=...
   GTM_ID=...
   GA4_ID=...
   CLARITY_ID=...
   TIKTOK_PIXEL_ID=...
   ```
6. **Deploy** → কিছু মিনিট অপেক্ষা
7. URL: `https://yourshop.vercel.app`

### ১৬.২ Custom domain যুক্ত করুন

1. Vercel project → **Settings** → **Domains**
2. আপনার domain (`yourshop.com`) যোগ করুন
3. Vercel আপনাকে DNS records দেবে — সেগুলো আপনার domain registrar (Namecheap/GoDaddy) -এ যোগ করুন
4. কিছু ঘন্টা পর active হবে

## Step 17: Admin Deploy (Vercel)

### ১৭.১ Vercel-এ Admin deploy

1. Vercel-এ আরেকটা **New Project** → import FruitSnacksAdmin
2. **Root Directory:** `FruitSnacksAdmin`
3. **Framework:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variables:**
   ```
   VITE_API_URL=https://myshop-backend.railway.app
   ```
7. Deploy

### ১৭.২ Admin subdomain set

1. Vercel project → Settings → Domains
2. `admin.yourshop.com` add করুন
3. DNS records যোগ করুন

## Step 18: Final CORS Update

Backend-এ যান, `src/index.ts`-এ এখন production URLs সব যোগ করুন:

```ts
origin: [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://yourshop.com",
  "https://www.yourshop.com",
  "https://admin.yourshop.com",
  "https://www.admin.yourshop.com",
  "https://yourshop.vercel.app",        // backup
  "https://admin.yourshop.vercel.app",  // backup
],
```

Railway-এ redeploy করুন।

---

# 🔍 PART 9 — SEO ও Analytics Setup

## Step 19: Google Search Console

1. https://search.google.com/search-console
2. **Add property** → URL `https://yourshop.com`
3. Verify করুন (HTML tag method)
4. Verification meta tag-এর `content="..."` কপি করুন
5. Vercel-এ Frontend project → Environment Variables → `GOOGLE_VERIFICATION=<content value>` যোগ
6. Redeploy
7. Search Console-এ আবার verify করুন

## Step 20: Sitemap Submit

1. Search Console → **Sitemaps** menu
2. Submit করুন: `https://yourshop.com/sitemap.xml`
3. ২৪ ঘন্টার মধ্যে Google crawl করা শুরু করবে

## Step 21: Google Analytics 4 + GTM

### ২১.১ GA4 setup

1. https://analytics.google.com → Admin → Create Property
2. Property name: `yourshop`, Country: Bangladesh, Currency: BDT
3. Data Stream → Web → URL ও Stream name
4. **Measurement ID** copy (যেমন `G-XXXXXXXXXX`)

### ২১.২ GTM setup

1. https://tagmanager.google.com → Create Account
2. Container name: `yourshop`, Platform: Web
3. **GTM ID** copy (যেমন `GTM-XXXXXXX`)

### ২১.৩ Vercel-এ যোগ করুন

Frontend project → Environment Variables:
```
GA4_ID=G-XXXXXXXXXX
GTM_ID=GTM-XXXXXXX
```
Redeploy।

### ২১.৪ Admin থেকে toggle on

Admin Panel → Settings → Analytics → GA4 enabled + GTM enabled → Save।

## Step 22: Meta Pixel

1. https://business.facebook.com → Events Manager → Connect Data Source → Web
2. Pixel name → Create
3. **Pixel ID** copy
4. (Optional) Conversion API token পেতে: Pixel → Settings → Conversions API → Generate Access Token
5. Vercel-এ:
   ```
   META_PIXEL_ID=<Pixel ID>
   META_CAPI_ACCESS_TOKEN=<Token>
   ```
6. Admin Panel → Settings → Analytics → Meta Pixel + Meta CAPI enabled

## Step 23: TikTok Pixel + Microsoft Clarity

একই pattern। Pixel ID/Clarity ID পান, Vercel-এ env যোগ করুন, Admin panel থেকে toggle।

---

# 📦 PART 10 — Courier & SMS Integration

## Step 24: Pathao Merchant

1. https://merchant.pathao.com → Sign up
2. Verification শেষে credentials পাবেন
3. Sandbox-এ test করুন প্রথমে
4. Production-এর জন্য আবার apply করতে হবে
5. Backend `.env`-এ:
   ```
   PATHAO_BASE_URL=https://api-hermes.pathao.com   (sandbox)
   PATHAO_BASE_URL=https://merchant.pathao.com     (production)
   PATHAO_CLIENT_ID=
   PATHAO_CLIENT_SECRET=
   PATHAO_CLIENT_EMAIL=
   PATHAO_CLIENT_PASSWORD=
   ```
6. Railway-এ env update, redeploy

### Webhook URL Pathao-কে দিন
- `https://myshop-backend.railway.app/api/v1/webhook/pathao`

## Step 25: Steadfast Merchant

1. https://steadfast.com.bd → Account
2. API key + secret পাবেন
3. Backend `.env`-এ:
   ```
   STEADFAST_CLIENT_ID=
   STEADFAST_CLIENT_PASSWORD=
   ```
4. Webhook URL: `https://myshop-backend.railway.app/api/v1/webhook/steadfast`

## Step 26: BulkSMS BD (OTP)

1. https://bulksmsbd.net → Sign up
2. Sender ID register করুন
3. API credentials পাবেন
4. Admin Panel → Settings → SMS Provider → fill in credentials → Save
5. Test OTP flow — sign-up করে দেখুন SMS আসছে কিনা

---

# 🎯 PART 11 — Final Checklist (Production-এ Launch করার আগে)

## ✅ Pre-launch Checklist

### Security
- [ ] পুরোনো `.env` files সব delete বা rename করেছেন
- [ ] `ACCESS_TOKEN` (JWT secret) random ও strong
- [ ] MongoDB Network Access production-এ specific IP (Railway-এর IP) limit করেছেন (optional)
- [ ] S3 bucket access key correct, ও non-public files private রেখেছেন
- [ ] Domain-এ HTTPS active (Vercel/Railway auto-handle করে)
- [ ] CORS allowlist থেকে test domain remove করেছেন

### Content
- [ ] Site title, logo, favicon আপনার brand-এর
- [ ] About Us, Privacy, Terms ইত্যাদি policy lekha
- [ ] Trust cards সঠিক
- [ ] Announcement bar message
- [ ] SEO title + description set
- [ ] Welcome message
- [ ] Contact info correct

### Catalog
- [ ] কমপক্ষে ১টা Category তৈরি
- [ ] কমপক্ষে ১টা Theme তৈরি
- [ ] কমপক্ষে ৫টা Product যোগ
- [ ] প্রতিটা Product-এ ছবি, price, description আছে
- [ ] Home page banner upload

### Integrations
- [ ] Pathao/Steadfast credentials কাজ করছে — test order send করে দেখুন
- [ ] BulkSMS দিয়ে OTP কাজ করছে — test registration
- [ ] Google Analytics data আসছে (২৪ ঘন্টা অপেক্ষা)
- [ ] Meta Pixel events Events Manager-এ দেখাচ্ছে
- [ ] Webhook URLs courier দিকে set করেছেন

### Testing
- [ ] Sign-up → OTP → verify → Login full flow কাজ করছে
- [ ] Cart-এ product add → checkout → order place full flow
- [ ] Admin-এ login → product create → order received দেখাচ্ছে
- [ ] Pathao-তে send → consignment ID return
- [ ] Mobile-এ সব page properly দেখাচ্ছে (responsive test)
- [ ] Slow internet-এ skeleton loader দেখাচ্ছে

### Backup
- [ ] MongoDB Atlas-এ automated backup enabled
- [ ] S3 bucket-এ versioning enabled (optional)
- [ ] Code GitHub-এ pushed (version control)

---

# 🆘 Troubleshooting (সাধারণ সমস্যা)

## Problem 1: Backend শুরু হচ্ছে না

**Error: `MongoServerError: Authentication failed`**
- MONGO_URI-এর password ঠিকঠাক কিনা check
- Special character থাকলে URL-encode করুন (যেমন `@` → `%40`)

**Error: `EADDRINUSE: address already in use`**
- পোর্ট 5000 অন্য কোনো program ব্যবহার করছে
- Kill করুন: Windows-এ `netstat -ano | findstr :5000` → PID দেখে `taskkill /F /PID <PID>`
- বা `.env`-এ অন্য PORT দিন

## Problem 2: Admin/Frontend-এ "Network Error" দেখাচ্ছে

- Backend চলছে কিনা check করুন
- `VITE_API_URL` (admin) ও `NEXT_PUBLIC_API_URL` (frontend) সঠিক কিনা
- Backend CORS allowlist-এ আপনার URL আছে কিনা
- Browser DevTools → Network tab → request fail হচ্ছে দেখুন

## Problem 3: Login করা যাচ্ছে না

- Phone format `+880` দিয়ে শুরু কিনা
- Password bcrypt hash কিনা MongoDB-তে
- Cookie save হচ্ছে কিনা DevTools → Application → Cookies-এ
- CORS-এ `credentials: true` আছে কিনা

## Problem 4: Image upload হচ্ছে না

- DigitalOcean Spaces credentials সঠিক কিনা
- S3_BUCKET name actual Space name match করছে কিনা
- S3_REGION ও S3_ENDPOINT সঠিক
- Backend logs check করুন S3 error দেখতে

## Problem 5: Pathao-তে send fail

- Sandbox URL দিয়ে test করুন প্রথমে
- Merchant approval আছে কিনা
- Order-এ pathao_city_id, pathao_zone_id সঠিক কিনা
- Product weight (variation_weight_grams) set করা কিনা

## Problem 6: Cookie set হচ্ছে কিন্তু authenticated request ফেল

- Frontend ও Backend আলাদা domain-এ হলে SameSite=None + Secure=true লাগবে (production-এ)
- HTTPS ছাড়া cross-origin cookie কাজ করে না
- Production domains সব HTTPS কিনা confirm

---

# 📞 Support & Next Steps

## যেসব কাজ আগে delivery-এর সময় ছিল

- Source code → ✅ আপনার কাছে
- Documentation → ✅ `docs/` ফোল্ডারে সব আছে
- Known issues → ✅ `docs/issues.md` দেখুন
- Live demo training → আপনার delivery agreement অনুযায়ী

## এই গাইড অনুসরণ করার পর

1. আপনার নিজের brand পুরো ready
2. Admin team-কে train করুন (Staff create + role assign)
3. Marketing চালু করুন (Facebook/TikTok ads)
4. Analytics regularly check
5. কাস্টমার feedback অনুযায়ী improvement

## টেকনিক্যাল আরও information দরকার?

- 📘 [docs/backend.md](backend.md) — Backend deep dive
- 📗 [docs/admin.md](admin.md) — Admin deep dive
- 📕 [docs/frontend.md](frontend.md) — Frontend deep dive
- 🐛 [docs/issues.md](issues.md) — পরিচিত bugs ও improvement (deployment-এর আগে security issues fix করার supurish)
- 📋 [docs/overview.md](overview.md) — সম্পূর্ণ architecture overview
- ⭐ [docs/features.md](features.md) — সব features একসাথে

---

# 🎉 Congratulations!

আপনার নতুন ই-কমার্স ব্যবসা এখন live। প্রথম order আসার আগে নিজে কয়েকটা test order করে full flow দেখে নিন।

**শুভ লঞ্চ! 🚀**
