# Bugs ও Improvement Opportunities

> এই ফাইলটি FruitSnacks codebase-এ পাওয়া bugs, security issues, code quality problems এবং সম্ভাব্য improvement-গুলোর তালিকা।
> তিনটি সাব-প্রজেক্ট (Backend, Admin, Frontend) — প্রতিটির আলাদা সেকশন।

**Severity legend:**
- 🔴 **Critical** — security/data integrity issue, এখনই ঠিক করা উচিত
- 🟠 **High** — কাজ ভেঙে যেতে পারে বা ভুল behavior দিতে পারে
- 🟡 **Medium** — clean-up বা future-proofing
- 🟢 **Low** — cosmetic বা minor improvement

---

# Backend Issues

## 🔴 Critical — Security ও Data Integrity

### B-1. Role routes-এ permission flag এলোমেলো assign করা
**File:** [`FruitSnacksBackend/src/app/role/role.routes.ts:13-17`](../FruitSnacksBackend/src/app/role/role.routes.ts)

```ts
router.route("/")
  .get(verifyToken("role_create"), findAllDashboardRole)     // ❌ get-এ create?
  .post(verifyToken("role_update"), postRole)                // ❌ post-এ update?
  .patch(verifyToken("role_delete"), updateRole)             // ❌ patch-এ delete?
  .delete(verifyToken("role_show"), deleteARole);            // ❌ delete-এ show?
```

**সমস্যা:** প্রতিটা HTTP method-এ ভুল permission flag check হয়। ফলে যার `role_show` permission আছে সে role delete করতে পারে, যার `role_create` আছে সে শুধু role দেখতে পারে।

**সমাধান:** Mapping ঠিক করতে হবে:
```ts
.get(verifyToken("role_show"), findAllDashboardRole)
.post(verifyToken("role_create"), postRole)
.patch(verifyToken("role_update"), updateRole)
.delete(verifyToken("role_delete"), deleteARole);
```

---

### B-2. Supplier routes-এ empty permission flag
**File:** [`FruitSnacksBackend/src/app/supplier/supplier.routes.ts:14-21`](../FruitSnacksBackend/src/app/supplier/supplier.routes.ts)

```ts
.post(verifyToken(""), postSupplier)
.patch(verifyToken(""), updateSupplier)
.delete(verifyToken(""), deleteASupplierInfo);
router.route("/dashboard").get(verifyToken(""), findAllDashboardSupplier);
```

**সমস্যা:** `verifyToken("")` পাস হলে token verify হবে কিন্তু permission check হবে না — যেকোনো logged-in admin (এমনকি যার কোনো permission নেই) supplier create/update/delete করতে পারবে।

**সমাধান:** Supplier-এর জন্য permission flag-গুলো `role.interface.ts`-এ যোগ করতে হবে (`supplier_create`, `supplier_update`, `supplier_show`, `supplier_delete`), তারপর routes-এ apply করতে হবে।

---

### B-3. PaymentWithdraw ও PaymentMethod routes-এ কোনো auth নেই
**File:** [`FruitSnacksBackend/src/app/paymentWithdrawList/paymentWithdrawList.routes.ts`](../FruitSnacksBackend/src/app/paymentWithdrawList/paymentWithdrawList.routes.ts) ও [`FruitSnacksBackend/src/app/withdrow_payment_method/withdrow_payment_method.routes.ts`](../FruitSnacksBackend/src/app/withdrow_payment_method/withdrow_payment_method.routes.ts)

```ts
// paymentWithdrawList
.post(postPaymentWithdrawList)           // ❌ কোনো verifyToken নেই
.patch(updatePaymentWithdrawList)        // ❌
.delete(deleteAPaymentWithdrawListInfo); // ❌

// withdrow_payment_method
.post(...uploadHelper, postPaymentMethod)    // ❌
.patch(...uploadHelper, updatePaymentMethod) // ❌
.delete(deleteAPaymentMethodInfo);            // ❌
```

**সমস্যা:** যে কেউ (logged out user-ও) payment method create, update, delete করতে পারে। Withdraw request post করতে পারে। এটা serious security hole।

**সমাধান:** verifyToken middleware যোগ করতে হবে, পাশাপাশি `payment_method_*` ও `payment_withdraw_*` permission flag যোগ করতে হবে।

---

### B-4. JWT secret weak হলে session compromise
**File:** [`FruitSnacksBackend/src/middlewares/verify.token.ts:32`](../FruitSnacksBackend/src/middlewares/verify.token.ts)

```ts
const decoded = await promisify(jwt.verify)(cokieToken, process.env.ACCESS_TOKEN);
```

**সমস্যা:** `ACCESS_TOKEN` .env-এ আছে — buyer যদি weak secret সেট করে বা পুরোনো leak হওয়া secret use করে, সব session hijack possible।

**সমাধান:** Deployment-এর সময় `crypto.randomBytes(64).toString('hex')` দিয়ে strong secret generate করতে হবে এবং documentation-এ এই কথা স্পষ্ট করতে হবে। আরও ভালো হয় cookie-এ refresh token + short-lived access token pattern।

---

### B-5. Cookie configuration weak
**File:** [`FruitSnacksBackend/src/index.ts`](../FruitSnacksBackend/src/index.ts) (cookieParser setup) এবং login controllers

**সমস্যা:** Cookie সেট করার সময় `httpOnly`, `secure`, `sameSite` properties কী সেট করা হয়েছে confirm করা দরকার। CSRF protection কোনো নেই।

**সমাধান:** Cookie options-এ:
```ts
{ httpOnly: true, secure: true, sameSite: "strict", maxAge: 7*24*60*60*1000 }
```
CSRF token মেকানিজম যোগ করা।

---

### B-6. CORS allowlist hardcoded
**File:** [`FruitSnacksBackend/src/index.ts:19-37`](../FruitSnacksBackend/src/index.ts)

**সমস্যা:** ১৬টা ডোমেইন হার্ডকোড করা — buyer যখন নতুন domain-এ deploy করবে, কোডে এসে edit করতে হবে। ভুল করে কেউ wildcard বা সব origin allow করে দিলে security issue।

**সমাধান:** Environment variable থেকে allowlist load করা:
```ts
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];
```

---

## 🟠 High — কাজ ভেঙে যেতে পারে

### B-7. Mongoose strictQuery deprecated warning
**File:** [`FruitSnacksBackend/src/server.ts:6`](../FruitSnacksBackend/src/server.ts)

```ts
mongoose.set("strictQuery", false);
```

**সমস্যা:** Mongoose 7+ এ এটা ডিফল্ট behavior, future version-এ remove হতে পারে।

**সমাধান:** Mongoose version অনুযায়ী এই line review করা।

---

### B-8. Pathao token caching শুধু in-memory
**File:** [`FruitSnacksBackend/src/app/order/pathao.service.ts`](../FruitSnacksBackend/src/app/order/pathao.service.ts)

**সমস্যা:** Multi-instance deployment (PM2 cluster বা horizontal scaling) হলে প্রতিটা instance আলাদা token cache রাখবে — frequent token request হবে, Pathao API rate limit hit করতে পারে।

**সমাধান:** Redis বা MongoDB-তে token store করা।

---

### B-9. Order creation-এ race condition possible
**File:** [`FruitSnacksBackend/src/app/order/order.service.ts`](../FruitSnacksBackend/src/app/order/order.service.ts) (assumed location)

**সমস্যা:** যদি Mongoose session/transaction ঠিকভাবে use না হয়, একই product-এ দুটো simultaneous order এসে stock negative হতে পারে। Mongoose অনেক জায়গায় `findOneAndUpdate` + `$inc` ছাড়া simple read-modify-write pattern follow করেছে।

**সমাধান:** Stock decrement-এর জন্য সবসময় atomic operation:
```ts
await ProductModel.findOneAndUpdate(
  { _id: product_id, product_quantity: { $gte: order_quantity } },
  { $inc: { product_quantity: -order_quantity } }
);
```
এবং null check করা — যদি match না করে মানে stock নেই।

---

### B-10. Image upload-এ file type validation দুর্বল
**File:** [`FruitSnacksBackend/src/helpers/image.upload.ts:48-56`](../FruitSnacksBackend/src/helpers/image.upload.ts)

```ts
fileFilter: (req, file, cb) => {
  cb(null, true);  // ❌ সব file accept করে
},
```

**সমস্যা:** যেকোনো file type accept হয় — মেলিশিয়াস .exe, .js, .php upload হতে পারে। যদিও S3-এ static serve হয় তবুও risk।

**সমাধান:** MIME type ও extension whitelist করা:
```ts
const allowed = /\.(jpg|jpeg|png|webp|gif|mp4|mov|webm|pdf)$/i;
if (!allowed.test(file.originalname)) cb(new Error("Unsupported file type"));
else cb(null, true);
```

---

### B-11. Local `uploads/` ফোল্ডার-এ race condition
**File:** [`FruitSnacksBackend/src/helpers/image.upload.ts:40-46`](../FruitSnacksBackend/src/helpers/image.upload.ts)

**সমস্যা:** Multer ফাইল `uploads/` directory-তে save করে, তারপর S3-এ upload, তারপর `fs.unlinkSync` দিয়ে delete। যদি concurrent request আসে এবং একই filename হয় (UUID থাকলেও collision possible), বা upload fail করলে orphan files জমা হবে।

**সমাধান:** 
- Direct memory storage ব্যবহার করা (`multer.memoryStorage()`) — disk ছাড়াই S3-এ পাঠানো
- অথবা startup-এ `uploads/` cleanup cron যোগ করা

---

### B-12. Cron job production-এ duplicate run
**File:** [`FruitSnacksBackend/src/index.ts:114`](../FruitSnacksBackend/src/index.ts)

```ts
cron.schedule("55 23 * * *", () => { ... });
```

**সমস্যা:** PM2 cluster mode-এ N instances হলে cron N বার চলবে — campaign deactivation কয়েকবার হবে (idempotent তাই data issue নেই কিন্তু wasteful)।

**সমাধান:** আলাদা worker process বানানো বা node-cron-এর সাথে distributed lock (Redis-based)।

---

### B-13. Campaign expire-এ product-level update-এ slowness
**File:** [`FruitSnacksBackend/src/index.ts:96-104`](../FruitSnacksBackend/src/index.ts)

```ts
for (const campaignProduct of campaign?.campaign_products) {
  await ProductModel.findByIdAndUpdate(
    productId, { $unset: { product_campaign_id: 1 } }, { new: true }
  );
}
```

**সমস্যা:** Sequential `await` in loop — ১০০০ products হলে ১০০০ DB round-trip। আবার `new: true` লাগে না এখানে।

**সমাধান:**
```ts
await ProductModel.updateMany(
  { _id: { $in: productIds } },
  { $unset: { product_campaign_id: 1 } }
);
```

---

### B-14. Order route ordering সমস্যা
**File:** [`FruitSnacksBackend/src/app/order/order.routes.ts:53`](../FruitSnacksBackend/src/app/order/order.routes.ts)

```ts
// ⚠️ এই route সবার নিচে রাখতে হবে — নইলে /steadfast, /pathao, /dashboard
// সব /:order_id হিসেবে match হয়ে যাবে এবং Cast Error দেবে
router.route("/:order_id").get(getAOrderWithOrderProducts);
```

**সমস্যা:** Comment-এই বলা আছে — এটা fragile। কেউ পরে accidentally উপরে নিয়ে গেলে সব break।

**সমাধান:** Specific routes-এ prefix যোগ করা যেমন `/details/:order_id` যাতে collision না হয়।

---

### B-15. `customer_id` কে কোথাও `users`, কোথাও `admins` model রেফারেন্স
**File:** [`FruitSnacksBackend/src/app/order/order.model.ts:84`](../FruitSnacksBackend/src/app/order/order.model.ts) এবং [`FruitSnacksBackend/src/app/order/order.interface.ts:31`](../FruitSnacksBackend/src/app/order/order.interface.ts)

```ts
// interface:
customer_id: Types.ObjectId | IAdminInterface;  // ❌

// model:
customer_id: { type: Schema.Types.ObjectId, ref: "users", required: true };  // ✅
```

**সমস্যা:** Interface বলছে `IAdminInterface` কিন্তু model রেফারেন্স `users`। Type mismatch — populate-এ ভুল হতে পারে।

**সমাধান:** Interface-এ `customer_id: Types.ObjectId | IUserInterface` করতে হবে।

---

## 🟡 Medium — Code Quality ও Future-proofing

### B-16. Backup files repository-এ আছে
- [`FruitSnacksBackend/src/app/product/product.interface copy.ts`](../FruitSnacksBackend/src/app/product/product.interface copy.ts)
- [`FruitSnacksBackend/src/app/setting/setting.interface copy.ts`](../FruitSnacksBackend/src/app/setting/setting.interface copy.ts)
- [`FruitSnacksBackend/src/app/setting/setting.model copy.ts`](../FruitSnacksBackend/src/app/setting/setting.model copy.ts)
- [`FruitSnacksBackend/src/app/order/order.controller copy.ts`](../FruitSnacksBackend/src/app/order/order.controller copy.ts)
- [`FruitSnacksBackend/src/app/user/user.controllers copy.ts`](../FruitSnacksBackend/src/app/user/user.controllers copy.ts)

**সমাধান:** Git থাকলে এসব backup file-এর দরকার নেই — সব delete করা।

---

### B-17. Authentication module-এর interface বেশ পাতলা
**File:** [`FruitSnacksBackend/src/app/authentication/authentication.interface.ts`](../FruitSnacksBackend/src/app/authentication/authentication.interface.ts)

```ts
interface IAuthenticationInterface {
  otp_phone_user?: string;
  otp_phone_password?: string;
  otp_phone_body?: string;
}
```

**সমস্যা:** নাম "authentication" কিন্তু আসলে SMS provider config। misleading নাম এবং সব field optional — কোনটা required সেটা স্পষ্ট না।

**সমাধান:** Rename করা `smsProviderConfig` বা মিশিয়ে `setting` module-এ নিয়ে আসা (যেখানে অলরেডি SMS config field আছে — duplicate)।

---

### B-18. Setting module-এ একই data দুই জায়গায়
**Files:** [`FruitSnacksBackend/src/app/setting/setting.interface.ts`](../FruitSnacksBackend/src/app/setting/setting.interface.ts) (sms_provider_*) এবং [`FruitSnacksBackend/src/app/authentication/authentication.model.ts`](../FruitSnacksBackend/src/app/authentication/authentication.model.ts)

**সমস্যা:** Setting collection-এ SMS provider fields আছে, কিন্তু আবার আলাদা authentication collection-এ একই data। duplication → inconsistency risk।

**সমাধান:** Authentication module-এর data setting-এ merge করা, authentication module remove করা।

---

### B-19. Hardcoded `"Bangladesh"` default
**Files:**
- [`FruitSnacksBackend/src/app/adminRegLog/admin.model.ts:23`](../FruitSnacksBackend/src/app/adminRegLog/admin.model.ts)
- [`FruitSnacksBackend/src/app/user/user.model.ts:12`](../FruitSnacksBackend/src/app/user/user.model.ts)

```ts
admin_country: { type: String, default: "Bangladesh" }
```

**সমস্যা:** Buyer অন্য দেশে deploy করলে এই default ভুল। আরও বেশি Bangladesh-specific assumption pricing (BDT) ও courier (Pathao/Steadfast — only BD) এ আছে।

**সমাধান:** Setting থেকে default country নেওয়া (`SettingModel.country` field যোগ করে)।

---

### B-20. Mongoose connection — auto-reconnect handling নেই
**File:** [`FruitSnacksBackend/src/server.ts`](../FruitSnacksBackend/src/server.ts)

**সমস্যা:** DB connection drop হলে কী হবে? Reconnection logic, error event listener নেই — silent failure সম্ভব।

**সমাধান:**
```ts
mongoose.connection.on("disconnected", () => console.error("DB disconnected"));
mongoose.connection.on("error", (err) => console.error("DB error", err));
```

---

### B-21. `process.env` validation নেই
**File:** [`FruitSnacksBackend/src/helpers/image.upload.ts:22-33`](../FruitSnacksBackend/src/helpers/image.upload.ts)

```ts
const region = process.env.S3_REGION!;  // ❌ undefined হলে runtime crash
```

**সমস্যা:** Required env variable মিসিং হলে runtime-এ অস্পষ্ট error হবে। Startup-এ catch হলে ভালো।

**সমাধান:** Startup-এ env validation:
```ts
const required = ["MONGO_URI", "ACCESS_TOKEN", "S3_REGION", ...];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}
```

বা zod/envalid library ব্যবহার।

---

### B-22. Hardcoded credentials কমেন্টে rest
**File:** [`FruitSnacksBackend/src/helpers/image.upload.ts:18, 29`](../FruitSnacksBackend/src/helpers/image.upload.ts)

```ts
// accessKeyId: "DO00UEML8FLHCBP94G6M", // তোমার DO Access Key
// secretAccessKey: "yMPeWzDhxgAL81luOgSE/Hzx+n0IabVbYJqAwSIxYS0",
```

**সমস্যা:** Comment-এ পুরোনো deployment-এর S3 credentials আছে। Git history-তে এই credentials থেকে থাকবে — repo public হলে compromise।

**সমাধান:** এই comment-গুলো delete করতে হবে। Old credentials rotate করতে হবে।

---

### B-23. `sendResponse` data null vs undefined inconsistent
**File:** [`FruitSnacksBackend/src/shared/sendResponse.ts:13-19`](../FruitSnacksBackend/src/shared/sendResponse.ts)

```ts
data: data.data || null || undefined,
totalData: data.totalData || null || undefined,
```

**সমস্যা:** `null || undefined` মূলত `undefined` — ভুল chain। উদ্দেশ্য কী স্পষ্ট না।

**সমাধান:**
```ts
data: data.data ?? null,
totalData: data.totalData,
```

---

### B-24. Soft delete vs hard delete inconsistent
**সমস্যা:** কোনো module-এ status: "active" / "in-active" দিয়ে soft delete হয়, কোনোটায় actually `findOneAndDelete` কল হয় — pattern inconsistent। Cart-এ hard delete, product-এ soft delete।

**সমাধান:** Project-wide convention ঠিক করতে হবে — সব core entity (product, category, user, admin) soft delete। শুধু transient data (cart, OTP) hard delete।

---

### B-25. Searchable fields array-গুলো module-specific কিন্তু সব same pattern
**সমস্যা:** ৩৭টা মডিউলে প্রায় একই pattern repeat — `export const xxxSearchableField = [...]`। কোনো generic search utility নেই।

**সমাধান:** Generic search helper:
```ts
const buildSearchQuery = (searchTerm, fields) => 
  fields.length ? { $or: fields.map(f => ({ [f]: new RegExp(searchTerm, "i") })) } : {};
```

---

## 🟢 Low — Cosmetic ও Improvements

### B-26. Misspelled folder name `withdrow_payment_method`
**সমাধান:** `withdraw_payment_method` লেখা সঠিক — rename করলে ভালো (কিন্তু onek ফাইল-এ reference আছে, careful migration লাগবে)।

### B-27. Misspelled field `product_warrenty`
**File:** [`FruitSnacksBackend/src/app/product/product.interface.ts:120`](../FruitSnacksBackend/src/app/product/product.interface.ts)

`warrenty` → `warranty`। Database-এ ডকুমেন্ট থাকলে migration লাগবে।

### B-28. Comments-এ inconsistent Bangla/English mix
সমস্ত TODO/comments-এ Bangla ও English mix — কখনো `// তোমার DO Access Key`, কখনো `// Important note`। Team convention ঠিক করা।

### B-29. Console.log production-এ
**Files:** অনেক জায়গায় `console.log`, `console.error` — structured logger (winston, pino) ব্যবহার করলে ভালো।

### B-30. Health check endpoint নেই
GET `/` শুধু "FruitSnacks Server is working!" ফেরায়, কিন্তু DB connection, S3 reachability, courier API uptime check করার জন্য `/health` endpoint নেই।

### B-31. Rate limiting নেই
**সমস্যা:** Login endpoint, OTP send endpoint-এ brute force protection নেই। `express-rate-limit` দিয়ে যোগ করা উচিত।

### B-32. API versioning শুধু path-এ (`/api/v1`) — breaking change হলে kothai noton vesion karte hobe
**সমাধান:** `/api/v2` route আলাদা করার ব্যবস্থা routes.ts-এ tarpor expand হলে clear plan লাগবে।

---

# Admin Issues

## 🔴 Critical

### A-1. `useGetData.jsx` empty placeholder hook
**File:** [`FruitSnacksAdmin/src/hooks/useGetData.jsx`](../FruitSnacksAdmin/src/hooks/useGetData.jsx)

```jsx
const useGetData = () => {
  return <div></div>;  // ❌ JSX returning hook with no logic
};
```

**সমস্যা:** Hook supposed to return data, কিন্তু JSX return করছে। যদি কোথাও import হয়, runtime crash। Dead code।

**সমাধান:** ফাইল delete করা, অথবা implement করা।

---

### A-2. Cookie storage utility unused কিন্তু confusing
**File:** [`FruitSnacksAdmin/src/utils/cookie-storage.js`](../FruitSnacksAdmin/src/utils/cookie-storage.js)

**সমস্যা:** Backend httpOnly cookie ব্যবহার করে — JavaScript থেকে এই cookie access করা যায় না। তাও `setCookie`/`getCookie`/`eraseCookie` utility আছে — কেউ ভুল করে এটা ব্যবহার করলে confusion ও broken auth flow।

**সমাধান:** ফাইল delete করা।

---

## 🟠 High

### A-3. Frontend permission check ≠ security
**Files:** সব Page-এ ও Sidebar-এ `user?.role_id?.permission` check

**সমস্যা:** Frontend permission check শুধু UI hide করে — যেকেউ DevTools-এ ম্যানিপুলেট করে hidden button দেখাতে পারে। মূল security ব্যাকএন্ডের `verifyToken()` middleware-এ। সমস্যা না — কিন্তু developer যদি ভাবে frontend check enough, ভুল হবে। বিশেষত B-2 (supplier) ও B-3 (paymentWithdraw)-এ backend check missing — frontend hide করলেও exploitable।

**সমাধান:** Documentation-এ স্পষ্ট করতে হবে frontend check কেবল UX-এর জন্য।

---

### A-4. Inconsistent data fetching patterns
**সমস্যা:** কোনো কোনো page-এ custom hook (`useGetCategory`), কোনোটায় inline `useQuery` ([`CategoryPage.jsx:34`](../FruitSnacksAdmin/src/pages/CategoryPage/CategoryPage.jsx))। Same endpoint দুই জায়গায় different queryKey-তে cache হলে stale data issue।

**সমাধান:** সব data fetching `src/hooks/` ফোল্ডারে move করা — single source of truth।

---

### A-5. Mutation handling-এ React Query mutation hook ব্যবহার নেই
**সমস্যা:** সব POST/PATCH/DELETE plain `fetch` দিয়ে — loading state manual, error handling repetitive। React Query-এর `useMutation` দিয়ে করলে automatic loading/error state ও cache invalidation easier।

**সমাধান:**
```jsx
const { mutate, isPending } = useMutation({
  mutationFn: async (data) => fetch(...).then(r => r.json()),
  onSuccess: () => { toast.success(...); queryClient.invalidateQueries(...); },
  onError: (e) => toast.error(e.message),
});
```

---

### A-6. `window.location.reload()` on login
**File:** [`FruitSnacksAdmin/src/pages/SignInPage/SignInPage.jsx:120`](../FruitSnacksAdmin/src/pages/SignInPage/SignInPage.jsx)

```jsx
navigate(form, { replace: true });
window.location.reload();  // ❌
```

**সমস্যা:** Full page reload — AuthProvider আবার fetch করবে, পুরো React state reset। React-এর SPA মডেল ভাঙে।

**সমাধান:** AuthProvider-এ `refetchUser()` exposed করা, login success-এ ওটা call করা।

---

### A-7. Silent error fallback in AuthProvider
**File:** [`FruitSnacksAdmin/src/context/AuthProvider.jsx:34`](../FruitSnacksAdmin/src/context/AuthProvider.jsx)

```jsx
} catch (error) {
  console.log(error);  // ❌ silent fail
}
```

**সমস্যা:** Auth fetch fail হলে শুধু console-এ log — user-এর কাছে কোনো indication নেই কেন redirect হচ্ছে। Backend down হলে blank screen।

**সমাধান:** Error state UI দেখানো, retry button।

---

### A-8. Static permissionData.js drift risk
**Files:** [`src/data/permissionData.js`](../FruitSnacksAdmin/src/data/permissionData.js) ও [`FruitSnacksBackend/src/app/role/role.interface.ts`](../FruitSnacksBackend/src/app/role/role.interface.ts)

**সমস্যা:** ব্যাকএন্ডে নতুন permission যোগ করলে এখানেও যোগ করতে হয় — কেউ ভুলে গেলে অ্যাডমিন UI-তে দেখাবে না।

**সমাধান:** Backend থেকে dynamic permission list API endpoint যোগ করা: `GET /api/v1/role/available-permissions` — admin UI সেটা fetch করে render করবে।

---

### A-9. Commented-out routes ও menu items litter
**Files:** [`Route.jsx`](../FruitSnacksAdmin/src/routes/Route.jsx), [`SideNavBar.jsx`](../FruitSnacksAdmin/src/shared/SideNavBar/SideNavBar.jsx)

**সমস্যা:** অনেক route ও menu item কমেন্ট আউট করা — কিন্তু files (`CancelOrderPage`, `ReturnOrderPage`, `DeliveryOrderPage`, `StadefastProcessingOrderPage`, `OfferOrderListPage`, `QuestionPage`, `SliderPage`, `SpecificationPage`, `ChildCategoryPage`, `SupplierPage`) এখনো বিদ্যমান। Confusing — implemented নাকি WIP নাকি removed?

**সমাধান:** সিদ্ধান্ত নিতে হবে — implement করো অথবা সব delete (page file + commented code)।

---

## 🟡 Medium

### A-10. SettingProvider ও AuthProvider duplicate loading state
**সমস্যা:** দুটোই `loading` state রাখে, App.jsx-এ আবার চেক, SideNavBar-এও। Loading orchestration scattered, race condition possible।

**সমাধান:** Top-level একটা `AppInitializer` component — সব context load হওয়া পর্যন্ত wait করে children render।

---

### A-11. Misspelled component name
**File:** [`FruitSnacksAdmin/src/components/Category/UpDateCategory.jsx`](../FruitSnacksAdmin/src/components/Category/UpDateCategory.jsx)

`UpDate` → `Update`। Same project-এ `UpdateProduct` ফোল্ডার আছে — inconsistent।

---

### A-12. `console.log` production-এ
[`SideNavBar.jsx:67`](../FruitSnacksAdmin/src/shared/SideNavBar/SideNavBar.jsx):
```jsx
console.log(user?.role_id, "page seo show");
```
এবং অনেক জায়গায়। Production build-এ এগুলো থাকবে — performance ও security info leak।

**সমাধান:** Vite config-এ `terserOptions.compress.drop_console: true`, অথবা ESLint rule `no-console` enforce।

---

### A-13. Hard-coded Bangladesh location data
**Files:** [`src/data/division-data.js`](../FruitSnacksAdmin/src/data/division-data.js), `district-data.js`, `city-data.js`, `address-data.js`

**সমস্যা:** Bangladesh-specific location data hard-coded — buyer অন্য দেশে use করতে পারবে না। আবার phone input `defaultCountry="BD"`।

**সমাধান:** Setting থেকে country নিয়ে dynamic location data load — অথবা country-agnostic structure।

---

### A-14. Image preview memory leak (URL.createObjectURL)
**Files:** যেকোনো AddX/UpdateX form

```jsx
setImagePreview(URL.createObjectURL(file));
```

**সমস্যা:** `URL.createObjectURL` দিয়ে create করা URL `URL.revokeObjectURL` দিয়ে cleanup না করলে memory leak — বিশেষত modal বারবার open/close করলে।

**সমাধান:** useEffect cleanup-এ revoke:
```jsx
useEffect(() => () => imagePreview && URL.revokeObjectURL(imagePreview), [imagePreview]);
```

---

### A-15. FormData cleanup repetitive (~25 জায়গায়)
**Files:** সব AddX/UpdateX form

```jsx
for (const [key, value] of formData.entries()) {
  if (value === "undefined" || value === undefined || ...) {
    formData.delete(key);
  }
}
```

**সমাধান:** Utility function `cleanFormData(data)`:
```js
export const cleanFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v == null || v === "" || v === "undefined") return;
    if (v instanceof FileList) {
      if (v.length > 0) fd.append(k, v[0]);
    } else fd.append(k, v);
  });
  return fd;
};
```

---

### A-16. Query key inconsistency
**সমস্যা:** কোনো query-তে `["/api/v1/category"]`, কোনোটায় full URL with params। Params change-এ cache invalidation predictable না।

**সমাধান:** `[endpoint, params]` structured pattern:
```jsx
queryKey: ["/api/v1/category/dashboard", { page, limit, searchTerm }]
```

---

### A-17. Form validation client-side অসম্পূর্ণ
**সমস্যা:** Phone validation আছে SignInPage-এ, কিন্তু অন্যান্য field-এ যেমন email format, URL format, image size validation client-side নেই — শুধু required। Backend reject করলে generic error toast।

**সমাধান:** React Hook Form-এর `pattern`, image size pre-upload check।

---

## 🟢 Low

### A-18. Legacy demo data files
[`src/data/category-data.js`](../FruitSnacksAdmin/src/data/category-data.js), `product-data.js`, `feature-data.js`, `filter-data.js`, `slider-data.js`, `offer-data.js`, `single-data.js`, `country-data.js` — সব hard-coded demo data যা DB থেকে আসা শুরু করার পর আর প্রয়োজন নেই। Delete করা যায়।

### A-19. `provider/` ফোল্ডার প্রায় খালি
[`src/provider/`](../FruitSnacksAdmin/src/provider/) — সম্ভবত legacy structure। চেক করে delete করা।

### A-20. `NoDataFound` ও `NotFound` duplicate concept
[`src/shared/NoDataFound/`](../FruitSnacksAdmin/src/shared/NoDataFound/), [`src/shared/NotFound/`](../FruitSnacksAdmin/src/shared/NotFound/) — একটায় merge করা যায়।

### A-21. Tailwind class repetition
Same button style বারবার copy-paste:
```jsx
className="rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200 text-white text-sm"
```

**সমাধান:** Tailwind `@apply` দিয়ে custom class বা React `<PrimaryButton>` component wrapper।

### A-22. URL path-এ inconsistent naming
Sidebar `/brand-category` কিন্তু backend `/brand`, component `BrandPage`। `/sub-category` (admin) vs `/sub_category` (backend)। Renaming standardize করা ভালো।

### A-23. activeDropdown state localStorage-এ
[`SideNavBar.jsx:39-50`](../FruitSnacksAdmin/src/shared/SideNavBar/SideNavBar.jsx) — ঠিক আছে কিন্তু URL-based (current pathname থেকে infer) হলে আরও clean।

---

# Frontend Issues

## 🔴 Critical

### F-1. TypeScript ও ESLint errors production build-এ ignore করা
**File:** [`FruitSnacksFrontend/next.config.mjs`](../FruitSnacksFrontend/next.config.mjs) এবং FruitSnacksFrontend/CLAUDE.md-এ মেনশন:
> "Production build (TypeScript errors are ignored via eslint config)"

**সমস্যা:** Type errors বা lint errors থাকলেও build pass করে। Production-এ runtime crash হতে পারে।

**সমাধান:** Errors fix করে এই flags remove করা।

---

### F-2. `campaignApi.js`-এ deprecated Bearer token pattern
**File:** [`FruitSnacksFrontend/src/redux/feature/campaign/campaignApi.js`](../FruitSnacksFrontend/src/redux/feature/campaign/campaignApi.js)

```js
import { getFromLocalStorage } from "@/utils/local-storage";
import { authKey } from "@/contants/storageKey";
const token = getFromLocalStorage(authKey);  // ❌ module load time, undefined হবে SSR-এ

addCampaign: build.mutation({
  query: (data) => ({
    url: `/campaign`, method: "POST",
    headers: { authorization: `Bearer ${token}` },  // ❌ JWT cookie-এ, Bearer না
    ...
  }),
```

**সমস্যা:**
- ব্যাকএন্ড httpOnly cookie ব্যবহার করে, Bearer token না
- `getFromLocalStorage` module-load time-এ call হয় — SSR-এ undefined
- Frontend storefront-এ campaign create/update/delete দরকার নেই (admin panel আলাদা)

**সমাধান:** এই ফাইল delete করা, অথবা যদি কোথাও use হয় check করে storefront pattern-এ rewrite।

---

### F-3. `Providers.jsx`-এ CartLoader DB cart দিয়ে localStorage overwrite করে
**File:** [`FruitSnacksFrontend/src/components/providers/Providers.jsx`](../FruitSnacksFrontend/src/components/providers/Providers.jsx)

```jsx
const CartLoader = () => {
  const { data: userInfo } = useUserInfoQuery();
  useEffect(() => {
    if (userInfo?.data?._id) {
      loadCartFromDB(dispatch);  // ❌ localStorage cart overwrite
    }
  }, [userInfo?.data?._id, dispatch]);
};
```

**সমস্যা:** Login-এর পরে page refresh হলে — localStorage-এ যদি product থাকে, DB cart fetch-এ সেটা overwrite হয়। `syncCartAfterLogin` শুধু login button-click-এ call, page refresh-এ না।

**সমাধান:** `loadCartFromDB`-এর আগে localStorage non-empty কিনা check, non-empty হলে sync endpoint call।

---

## 🟠 High

### F-4. `tag-types.js`-এ list ও object mismatch — silent bug
**File:** [`FruitSnacksFrontend/src/redux/tag-types.js`](../FruitSnacksFrontend/src/redux/tag-types.js)

```js
export const tagTypes = { user, auth, ..., site_setting };  // pc_builder নেই
export const tagTypesList = [
  tagTypes.user, ..., tagTypes.pc_builder,  // ❌ undefined হয়ে list-এ ঢুকবে
  tagTypes.site_setting,
];
```

**সমস্যা:** Silent bug — `undefined` array-তে যায়, কিন্তু RTK Query কোনো error দেয় না।

**সমাধান:**
```js
export const tagTypesList = Object.values(tagTypes);
```

---

### F-5. Cart middleware infinite loop guard fragile
**File:** [`FruitSnacksFrontend/src/redux/cartLocalstorageMiddleware.js:71`](../FruitSnacksFrontend/src/redux/cartLocalstorageMiddleware.js)

```js
if (isLoggedIn && action.type !== setCartFromDB.type) {
  syncCartToDB(cart.products);
}
```

**সমস্যা:** Future-এ আরও DB-sync triggering action যোগ হলে miss হবে। RTK Query cache check by-name (`endpointName === "userInfo"`) — endpoint rename হলে break।

**সমাধান:** `meta.skipSync` flag pattern; অথবা RTK Query-র listener middleware।

---

### F-6. PDP product fetch dual call (metadata + page)
**File:** [`FruitSnacksFrontend/src/app/(frontend)/products/[slug]/page.js`](../FruitSnacksFrontend/src/app/(frontend)/products/[slug]/page.js)

```js
export async function generateMetadata({ params }) {
  const res = await fetch(`${BASE_URL}/product/${slug}`, { cache: "no-store" });
}
const ProductDetailsPage = async ({ params }) => {
  const productRes = await fetch(`${BASE_URL}/product/${slug}`, { cache: "no-store" });
};
```

**সমস্যা:** Same endpoint দুইবার hit হয় — generateMetadata + page। `cache: "no-store"` দিয়ে dedupe behavior version-dependent।

**সমাধান:** React `cache()` wrapper:
```js
import { cache } from "react";
const getProduct = cache(async (slug) => fetch(...).then(r => r.json()));
```

---

### F-7. `cache: "no-store"` PDP-তে — performance hit
**File:** Same PDP page

**সমস্যা:** প্রতিটা PDP visit-এ backend hit, কোনো ISR/cache layer নেই। High-traffic site-এ DB load।

**সমাধান:** ISR with short revalidate (10s) বা stale-while-revalidate, অথবা Redis/CDN cache পেছনে।

---

### F-8. Hardcoded leather/Bangladesh copy
**Files:** [`getSeoConfig.js:28-39`](../FruitSnacksFrontend/src/components/lib/getSeoConfig.js), [`pageSeo.js`](../FruitSnacksFrontend/src/components/utils/pageSeo.js), [`PromotionalBanner.jsx`](../FruitSnacksFrontend/src/components/frontend/home/promotionalBanner/PromotionalBanner.jsx), [`FeatureService.jsx`](../FruitSnacksFrontend/src/components/frontend/home/featureService/FeatureService.jsx), [`Navbar.jsx`](../FruitSnacksFrontend/src/components/shared/navbar/Navbar.jsx), [`QuickViewModal.jsx`](../FruitSnacksFrontend/src/components/shared/quickViewModal/QuickViewModal.jsx)

```js
seoTitle: `${siteName} – Premium Genuine Leather Products Bangladesh`,
seoKeywords: ["leather wallet", "genuine leather", ...],
```

**সমস্যা:** Code-level fallback default leather copy ধরে আছে — Admin Site Settings / Page SEO override করলে runtime-এ ঠিক। কিন্তু DB empty থাকলে অদ্ভুত copy যাবে।

**সমাধান:** Fallback-গুলো generic বা fruit-snacks-themed-এ পরিবর্তন। CLAUDE.md-এ intentional বলা — buyer choose করবে।

---

### F-9. Two parallel state libraries (Redux + React Query)
**Files:** [`Providers.jsx`](../FruitSnacksFrontend/src/components/providers/Providers.jsx) ও [`QueryProviders.jsx`](../FruitSnacksFrontend/src/components/providers/QueryProviders.jsx)

**সমস্যা:** RTK Query ও TanStack Query — দুটোই server state cache। Overlap, bundle size, এবং confusion।

**সমাধান:** একটাই choose — RTK Query (already standardized) — TanStack Query usage migrate।

---

### F-10. Wishlist backend integration নেই
**Files:** [`tag-types.js`](../FruitSnacksFrontend/src/redux/tag-types.js)-এ `wishlist` tag আছে কিন্তু backend `routes.ts`-এ wishlist module নেই।

**সমস্যা:** Wishlist probably localStorage-only — logged-in user device change করলে wishlist হারিয়ে যাবে।

**সমাধান:** Backend-এ wishlist module যোগ, frontend dual-storage pattern (cart-এর মতো)।

---

### F-11. JSON-LD priceValidUntil 1 year hardcoded
**File:** [`(frontend)/products/[slug]/page.js:159-162`](../FruitSnacksFrontend/src/app/(frontend)/products/[slug]/page.js)

```js
priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
```

**সমস্যা:** প্রতিটা product page-এ "valid 1 year" — কিন্তু campaign থাকলে real expiry আগে। Google Rich Result misleading।

**সমাধান:** Campaign থাকলে `campaign_end_date` use, না থাকলে fallback।

---

## 🟡 Medium

### F-12. Backup/commented code blocks
**Files:** [`(frontend)/layout.js:34-67`](../FruitSnacksFrontend/src/app/(frontend)/layout.js), [`helper.js:1-17`](../FruitSnacksFrontend/src/utils/helper.js), অনেক জায়গায়।

কয়েকশো line commented-out alternative implementations। Git history-তে থাকার কথা — কোডে clutter।

---

### F-13. `helper.js`-এ logic duplication
**File:** [`FruitSnacksFrontend/src/utils/helper.js`](../FruitSnacksFrontend/src/utils/helper.js)

`productPrice` vs `singleProductPrice`, `lineThroughPrice` vs `singleProductLineThroughPrice` — খুব similar logic দুইবার।

**সমাধান:** Generic `getEffectivePrice(product, { variationIndex, lineThrough })` function।

---

### F-14. `revalidate` config inconsistent
**Files:** [`src/components/lib/*.js`](../FruitSnacksFrontend/src/components/lib/)

কোথাও 60s, 300s, 600s, 3600s, কোথাও nothing — কেন কী choice documented নেই।

**সমাধান:** কেন্দ্রীয় constants:
```js
export const REVALIDATE = { STATIC: 3600, CATEGORY: 600, PRODUCT: 60, LIVE: 0 };
```

---

### F-15. `console.error` ও `console.log` production-এ
**Files:** [`getSeoConfig.js:21`](../FruitSnacksFrontend/src/components/lib/getSeoConfig.js), [`cartSync.js:36`](../FruitSnacksFrontend/src/utils/cartSync.js), [`cartLocalstorageMiddleware.js:41`](../FruitSnacksFrontend/src/redux/cartLocalstorageMiddleware.js), অনেক জায়গায়।

**সমাধান:** Next.js compiler config `removeConsole: true` production-এ, অথবা structured logger।

---

### F-16. `react-helmet-async` redundant
**File:** package.json — `react-helmet-async` listed, কিন্তু Next.js 14 Metadata API ব্যবহৃত। Legacy carry-over।

**সমাধান:** Check করে react-helmet-async কোথাও use না হলে dependency remove।

---

### F-17. SSR cart hydration mismatch potential
**File:** [`store.js`](../FruitSnacksFrontend/src/redux/store.js)

Server-এ `cart` preloadedState `undefined`, client-এ localStorage value — first render-এ mismatch হতে পারে যদি component cart display করে।

**সমাধান:** Cart-dependent UI-তে `mounted` flag pattern (first render-এ skeleton/null, mount-এর পর real)।

---

### F-18. `getServerSettingData` fail fallback minimal
**File:** [`getSeoConfig.js:17-22`](../FruitSnacksFrontend/src/components/lib/getSeoConfig.js)

Backend down হলে generic fallback siteName/logo — site render হবে কিন্তু SEO degraded।

**সমাধান:** Static fallback cache (build time-এ), অথবা error page।

---

### F-19. Image domains restrictive, hardcoded
**File:** [`next.config.mjs`](../FruitSnacksFrontend/next.config.mjs)

DO Spaces, Contabo, Cloudinary, Unsplash whitelisted। Buyer অন্য CDN ব্যবহার করতে চাইলে config edit।

**সমাধান:** Env variable-driven `remotePatterns`।

---

### F-20. Toast position inconsistent
**Files:** Project-wide

`top-center`, `bottom-right`, default — UX inconsistent।

**সমাধান:** Root layout-এ default config।

---

### F-21. Currency hardcoded `BDT`
**Files:** [`useAnalytics.js`](../FruitSnacksFrontend/src/components/analyticsScripts/utils/useAnalytics.js), JSON-LD, PDP

```js
currency: "BDT"
```

সব analytics event ও schema-এ। Buyer অন্য country deploy করলে change।

**সমাধান:** Setting থেকে `currency_code` dynamic।

---

## 🟢 Low

### F-22. Folder/file name typos
- `singeProduct/` → `singleProduct/`
- `src/data/cites.js` → `cities.js`
- `src/contants/` → `constants/` (referenced as `@/contants/storageKey` in `campaignApi.js`)

### F-23. Hardcoded `lang="bn"` in root layout
[`src/app/layout.js:104`](../FruitSnacksFrontend/src/app/layout.js) — `<html lang="bn">`। Bangla deployment-এর জন্য ঠিক, কিন্তু English buyer-এ change লাগবে।

### F-24. Path naming inconsistencies
`/all-products`, `/all-ecommerce-product`, `/all-trending-products`, `/latest-product`, `/top-product`, `/new-arrival`, `/shop` — কোনো convention নেই (hyphen vs no-hyphen, singular vs plural)।

### F-25. Hardcoded date in sitemap
[`sitemap.js:7`](../FruitSnacksFrontend/src/app/sitemap.js): `LAUNCH_DATE = "2025-03-12"`। Buyer-specific launch date config-এ থাকলে cleaner।

### F-26. `useAnalytics` hook very large (~560 lines)
সব tracking একটায় — split: `useCommerceTracking`, `useAuthTracking`, `useSearchTracking`।

### F-27. PDP "Genuine leather, premium quality" auto fallback
[`(frontend)/products/[slug]/page.js:69`](../FruitSnacksFrontend/src/app/(frontend)/products/[slug]/page.js):
```js
const description = product?.meta_description ||
  `${product?.product_name} – ${seo.siteName} এ পাচ্ছেন মাত্র ৳${price ?? ""}। Genuine leather, premium quality। Cash on delivery সারাদেশে।`;
```

FruitSnacks-এ "Genuine leather" inappropriate। 

### F-28. `(user-profile)` layout — manual tab navigation
Next.js parallel routes দিয়ে আরও clean হতো।

### F-29. JSON-LD `dangerouslySetInnerHTML` — minimal XSS review
PDP-তে product_name special characters থাকলে `JSON.stringify` enough sanitization কিনা review।

### F-30. `searchTerm` tag type unused
[`tag-types.js`](../FruitSnacksFrontend/src/redux/tag-types.js)-এ `searchTerm` declared, কিন্তু কোনো API endpoint-এ ব্যবহৃত নেই (verify needed)।

---

# Quick Action Priority

কোন গুলো এখনই ঠিক করা উচিত (deployment-এর আগে):

### Backend (security-critical)
1. **B-3** (PaymentWithdraw auth নেই) — যেকোনো কেউ payment data manipulate করতে পারে
2. **B-1** (Role routes permission mix) — RBAC সম্পূর্ণ ভুল
3. **B-2** (Supplier permission empty) — যেকোনো admin supplier access করতে পারে
4. **B-22** (Hardcoded credentials in comments) — git history থেকে remove + rotate
5. **B-5** (Cookie security) — CSRF + secure cookie
6. **B-10** (File upload validation) — malicious upload prevent

### Frontend (build/runtime risk)
7. **F-1** (TS/ESLint errors ignored) — production build pass করছে invalid code নিয়ে
8. **F-2** (`campaignApi.js` Bearer token) — broken endpoint, delete বা rewrite
9. **F-3** (CartLoader overwrites localStorage) — login refresh-এ cart হারিয়ে যেতে পারে
10. **F-4** (`tagTypesList` undefined entry) — silent RTK bug

### Admin (cleanup before deploy)
11. **A-1** (`useGetData.jsx` broken hook) — delete or implement
12. **A-2** (`cookie-storage.js` unused) — delete to avoid auth confusion
13. **A-8** (permissionData drift) — backend permission API দিয়ে dynamic করা

### Summary
- **Backend:** 32 issues (6 critical security)
- **Admin:** 23 issues (2 critical cleanup)
- **Frontend:** 30 issues (3 critical build/runtime)
- **Total:** 85 issues identified

বাকি issues iterate করতে করতে ঠিক করা যাবে।
