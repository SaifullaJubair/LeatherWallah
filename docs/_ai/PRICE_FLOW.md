# Price Flow — FruitSnacks Complete Reference

**Last updated:** 2026-06-09 (session 35)
**Purpose:** Future-session reference so we never re-derive this from scratch. Documents every layer, every file, every field name, and the exact logic used.

---

## 1. Big Picture: কোথায় কোন layer বসে

Price এর 3টা আলাদা context আছে:

| Context | কোথায় | কোন function | কোন layer handle করে |
|---------|--------|-------------|---------------------|
| **Product card / home strip** | FE browser | `productPrice()`, `lineThroughPrice()` in `helper.js` | flash > campaign > variation_discount > variation > product_discount > product |
| **PDP single product** | FE browser | `singleProductPrice()`, `singleProductLineThroughPrice()` in `helper.js` | same chain |
| **Cart total** | FE browser (optimistic) | `useCartCalculations` → `applyCartLayers()` in `applyCartLayers.js` | base price + tier + group + coupon |
| **Checkout / Order placement** | BE server (authoritative) | `recomputeOrderTotals()` in `order.recompute.ts` | base + variation + flash + tier + group + campaign + coupon + VAT + shipping |
| **Flash sale slider** | FE browser | `getFlashPrice()` inside `FlashProductSlider.jsx` | variation_price → flash % / fixed |

> **Server always wins.** FE calculation = cart UI-র জন্য। চেকআউটে server সব recompute করে FE number overwrite করে।

---

## 2. Database-এ কোন field কোথায় থাকে

### Product-level (products collection)

| Field | Type | মানে |
|-------|------|------|
| `product_price` | Number | Regular / MRP — এটাই সব calculation-এর base |
| `product_discount_price` | Number (optional) | Admin-set discount price। Valid হলে normal কেনার দাম |
| `is_variation` | Boolean | true হলে individual product price নয়, variation দেখতে হবে |
| `tier_prices[]` | Array `{min_qty, price}` | Bulk discount — qty X হলে per-unit কমে |
| `group_prices[]` | Array `{group, price}` | Wholesale / VIP-র আলাদা price |
| `delivery_mode` | enum | `inherit` / `free` / `flat` / `qty_threshold` |
| `vat_percentage_override` | Number | 0 হলে global settings.vat_percentage use হয় |

### Variation-level (variations collection + embedded in products)

| Field | Type | মানে |
|-------|------|------|
| `variation_price` | Number | এই variation-এর regular price (এটাই undiscounted base) |
| `variation_discount_price` | Number (optional) | এই variation-এর discounted price (normal কেনার দাম) |
| `variation_price_delta` | Number | নতুন combination system — base + delta (legacy-তে নেই) |
| `variation_quantity` | Number | Stock |

### Flash sale (flashsales collection)

Flash sale-এ product direct থাকে না — product_id reference থাকে:

```
flashsales: {
  title, start_at, end_at, status: "active"|"in-active",
  products: [
    { product_id: ObjectId, flash_price: Number, flash_price_type: "fixed"|"percent", active: Boolean }
  ]
}
```

**flash_price_type বোঝা:**
- `"percent"` → flash_price = X% off the base price
- `"fixed"` → flash_price = flat টাকা off (NOT final price, টাকা বাদ যাবে)

### Campaign (campaigns collection)

```
campaigns: {
  campaign_status: "active"|"in-active",
  campaign_products: [
    { campaign_product_id: ObjectId (product), campaign_product_price: Number, campaign_price_type: "fixed"|"percent", campaign_product_status }
  ]
}
```

---

## 3. Flash Sale — সব layer-এ কিভাবে handle হয়

### Flash sale data কিভাবে product-এ আসে

#### Home strips-এ (trending, new arrivals, bestsellers, most viewed, ecommerce choice, just for you)

**File:** `FruitSnacksBackend/src/app/product/product.services.ts`

```
Strip service run করে (e.g. findTopSellingProductsServices)
  → DB থেকে products নিয়ে আসে
  → findActiveFlashMapForProducts(productIds) call করে
    → একটাই DB query: FlashSaleModel.find({ status:"active", start_at≤now, end_at≥now, products.product_id: in[...] })
    → Return করে Map<product_id_string, { flash_sale_product_price, flash_price_type, flash_sale_title, flash_sale_end_time }>
  → প্রতিটা product-এ flash_sale_details inject করে:
    { flash_sale_product: { flash_sale_product_price, flash_price_type, flash_sale_title, flash_sale_end_time } }
```

**Helper file:** `FruitSnacksBackend/src/app/flashsale/flashsale.services.ts` → `findActiveFlashMapForProducts()`

#### PDP-তে (single product page)

**File:** `FruitSnacksBackend/src/app/product/product.services.ts` → `findAProductDetailsServices()`

```
findAProductDetailsServices(slug)
  → findActiveFlashWithMetaForProduct(product._id) call করে
  → যদি flash active থাকে:
      product.active_flash = { title, start_at, end_at, product_entry: { flash_price, flash_price_type } }
      product.flash_sale_details = {  ← legacy FE shape (dual-write)
        flash_sale_product: {
          flash_sale_product_price: entry.flash_price,
          flash_price_type: entry.flash_price_type,
          flash_sale_title: title,
          flash_sale_end_time: end_at
        }
      }
```

দুটো shape লেখা হয় কারণ:
- `active_flash` = নতুন clean shape, PdpPriceMeta.jsx use করে
- `flash_sale_details` = পুরনো FE shape, helper.js + ProductHighlightSection use করে

#### Campaign PDP-তে

```
findAProductDetailsServices(slug)
  → CampaignModel.findOne({ campaign_status:"active", "campaign_products.campaign_product_id": productId })
  → যদি found:
      product.campaign_details = {
        campaign_product: {
          campaign_product_price,
          campaign_price_type,
          campaign_name,
          campaign_end_date,
          campaign_id
        }
      }
```

#### Flash Sale Storefront Section-এর জন্য (home page slider)

**File:** `FruitSnacksBackend/src/app/flashsale/flashsale.services.ts` → `findActiveFlashSaleStorefrontService()`
**Route:** `GET /api/v1/flash-sale/active`

```
FlashSaleModel.findOne({ status:"active", start_at≤now, end_at≥now })
  → active entries filter
  → ProductModel.find({ _id: in[productIds], product_status:"active" }).populate("brand_id")
  → প্রতিটা product-এর জন্য return:
    {
      flash_price,
      flash_price_type,
      flash_sale_product: { _id, product_name, product_slug, main_image, is_variation, product_price, product_discount_price, brand, variations[0_only] },
      rating, reviews
    }
  → Outer shape: { flash_sale_title, flash_sale_start_time, flash_sale_end_time, flash_sale_products[] }
```

**FE consumer:** `FlashSale.jsx` (server component) → `FlashProductSlider.jsx` (client)

---

## 4. FE Price Calculation — helper.js

**File:** `FruitSnacksFrontend/src/utils/helper.js`

### 4A. `productPrice(product)` — Card display price

```
Priority chain (highest wins):

1. FLASH SALE active? → product.flash_sale_details.flash_sale_product আছে?
   base = is_variation? v0.variation_price : product.product_price  ← undiscounted original
   return calculatePrice(base, fp.flash_sale_product_price, fp.flash_price_type)

2. CAMPAIGN active? → product.campaign_details.campaign_product আছে?
   price = is_variation? v0.variation_discount_price || v0.variation_price : product.product_discount_price || product.product_price
   return calculatePrice(price, cp.campaign_product_price, cp.campaign_price_type)

3. VARIATION? → v0.variation_discount_price || v0.variation_price

4. BASE → product.product_discount_price || product.product_price
```

⚠️ **Critical rule:** Flash base = `variation_price` (undiscounted), NOT `variation_discount_price`। Campaign base = discounted price (flash একটু আলাদা কারণ flash সবচেয়ে বড় promotion)।

### 4B. `lineThroughPrice(product)` — Strikethrough price on cards

```
Flash active?  → v0.variation_price || product.product_price  (always undiscounted original)
Campaign active? → same
Normal discount?
  v0.variation_discount_price আছে? → v0.variation_price
  product.product_discount_price আছে? → product.product_price
No discount → null (strikethrough দেখাবে না)
```

### 4C. `singleProductPrice(product)` — PDP price (first variation)

```
Same chain as productPrice(), কিন্তু সব variation[] array access করে
Flash base = variation_price (NOT discount) ← session 35-এ fix
Campaign base = variation_price (NOT discount) ← session 35-এ fix
```

### 4D. `singleProductLineThroughPrice(product)` — PDP strikethrough

```
Flash active? → variations[0].variation_price || product.product_price
Campaign active? → same
Normal discount? → variations[0].variation_price || product.product_price
None → null
```

### 4E. `calculatePrice(originalPrice, discount, type)` — Core math

```
type = "percent" → Math.round(original - (original × discount / 100))
type = "fixed"   → original - discount
otherwise        → original (no change)
```

---

## 5. Cart Layer — applyCartLayers.js

**File:** `FruitSnacksFrontend/src/utils/applyCartLayers.js`

```
প্রতিটা cart line-এর জন্য:

Layer 1: unit = productPrice(product)        ← flash/campaign/variation/base
Layer 2: unit = applyTierPrice(unit, qty, tier_prices[])  ← bulk discount
Layer 3: unit = applyGroupPrice(unit, customerGroup, group_prices[])  ← wholesale/vip
Layer 4: lineFinal = applyProductCoupon(unit, productId, coupon)  ← specific-product coupon

subtotal = Σ(lineFinal × qty)

Layer 5: applyCartCoupon(subtotal, coupon)   ← all-products fixed/percent coupon
Layer 6: applyBogoCoupon(bogoLines, coupon)  ← BOGO discount subtract
```

**ব্যবহার:**
```js
const { shopSubtotals, shopGrandTotals, totalDiscount, adjustedPrices } =
  useCartCalculations({ cartData, products, couponData, shippingCharge, customerGroup });
```

---

## 6. BE Recompute — order.recompute.ts (authoritative)

**File:** `FruitSnacksBackend/src/app/order/order.recompute.ts`

```
প্রতিটা order line-এর জন্য DB থেকে fresh:

resolveProductPrice(product, { variation, flashSale })  ← product.price.resolver.ts
  → unit_regular (for snapshot) + unit_final (buyer pays)

  Inside resolver:
    variation আছে?
      legacy (variation_price>0): regular=variation_price, final=variation_discount_price||variation_price
      new (delta): regular=product_price+delta, final=product_discount_price+delta
    no variation:
      regular=product_price, final=product_discount_price||product_price
    flash active?  ← findActiveFlashForProduct() call করে
      "fixed" type: final_price = flash_price (absolute টাকা বাদ)  ← ⚠️ DIFFERENT from FE!
      "percent" type: Math.round(final - final × flash_price/100)   ← ⚠️ DIFFERENT from FE!

BE resolver flash "fixed" = absolute price difference, FE "fixed" = absolute subtract
→ Same result in practice যদি admin correctly set করে

tier price (qty check, best-price-wins)
group price (wholesale/vip, best-price-wins)
campaign (CampaignModel.findById → applyCampaign on unit_regular)

VAT per line (product override > settings default)
Coupon: fixed / percent (with max cap) / BOGO

Shipping: recomputeShippingCost()
  → inside/outside Dhaka zone detection
  → per-product delivery_mode: inherit / free / flat / qty_threshold
  → global free_delivery rule (only for inherit lines)
```

---

## 7. Price Flow — Step-by-step চোখ বন্ধ করে বলতে পারব

### Normal product (কোনো sale নেই):

```
Admin sets:
  product_price = 1000  (MRP)
  product_discount_price = 800  (discounted)

FE card shows:  ৳800  (productPrice → product_discount_price)
FE strikethrough: ৳1000  (lineThroughPrice → product_price)
BE recompute:  final_price = 800  (resolveProductPrice → isValidDiscount)
```

### Variation product (কোনো sale নেই):

```
Admin sets variation:
  variation_price = 600  (regular)
  variation_discount_price = 520  (discounted for this variant)

FE card shows: ৳520  (productPrice → v0.variation_discount_price)
FE strikethrough: ৳600  (lineThroughPrice → v0.variation_price)
BE recompute: final_price = 520  (resolveProductPrice legacy path)
```

### Variation product + Flash sale (20% off):

```
Admin sets variation:
  variation_price = 600
  variation_discount_price = 520

Flash sale:
  flash_price = 20, flash_price_type = "percent"

FE card shows: ৳480  (productPrice → calculatePrice(600, 20, "percent") = 600-120 = 480)
  ← base = variation_price=600 (NOT 520) ← session 35 fix
FE strikethrough: ৳600  (lineThroughPrice → v0.variation_price)
BE recompute:
  resolver: legacy path → regular=600, final=520
  flash: "percent" → Math.round(520 - 520×20/100) = Math.round(520-104) = 416
  ← ⚠️ BE uses final_price as flash base (520), FE uses variation_price (600) → মেলে না!
```

**⚠️ BE vs FE mismatch on flash + variation_discount combo:**
- FE: flash base = `variation_price` (600) → ৳480
- BE: flash base = `final_price` after discount (520) → ৳416

এটা একটা known design gap। FE shows ৳480, checkout confirms ৳416। Owner সিদ্ধান্ত নেননি কোনটা correct। Shopify standard = FE approach (flash on MRP)। Safe fix: BE resolver-এও flash base = regular_price করতে হবে।

### Variation product + Campaign:

```
Admin sets variation:
  variation_price = 600
  variation_discount_price = 520

Campaign:
  campaign_product_price = 50, campaign_price_type = "fixed"

FE card shows: ৳470  (productPrice → calculatePrice(520, 50, "fixed") = 520-50)
  ← campaign base = variation_discount_price (520), NOT variation_price
FE strikethrough: ৳600  (lineThroughPrice → v0.variation_price)
BE recompute: applyCampaign(unit_regular=600, 50, "fixed") = 550
  ← BE campaign base = unit_regular (600)
  ← ⚠️ FE shows 470, BE charges 550
```

**⚠️ Campaign base mismatch too.** FE `applyCartLayers.js` comment-এ explicitly noted: "Campaign NOT mirrored here... BE recompute pulls campaign fresh from DB and OVERWRITES the line price."

---

## 8. Flash Sale Slider-এ price (FlashProductSlider.jsx)

**File:** `FruitSnacksFrontend/src/components/frontend/home/flashSale/FlashProductSlider.jsx`

```js
const getFlashPrice = (product, flash_price, flash_price_type) => {
  const basePrice = product?.is_variation
    ? product?.variations?.[0]?.variation_price   // ← undiscounted
    : product?.product_price;
  return calculatePrice(basePrice, flash_price, flash_price_type);
};

// Display price = getFlashPrice(product, item.flash_price, item.flash_price_type)
// Strikethrough = originalPrice (variation_price or product_price)
```

Data আসে: `GET /api/v1/flash-sale/active` → `findActiveFlashSaleStorefrontService()`

---

## 9. Known Mismatches / Future Fix Points

| Issue | Where | FE behavior | BE behavior | Status |
|-------|-------|-------------|-------------|--------|
| Flash + variation_discount_price | resolver.ts vs helper.js | base = variation_price | base = variation_discount_price → then flash | ⚠️ Known gap |
| Campaign FE vs BE | applyCartLayers vs recompute | base = variation_discount_price | base = unit_regular (variation_price) | ⚠️ Known gap, owner accepted |
| Flash slider vs PDP price | FlashProductSlider vs PDP helper | same formula now (session 35 fix) | N/A | ✅ Fixed |
| Home strip flash | product.services.ts enrichment | strip products get flash_sale_details | N/A | ✅ Fixed |

---

## 10. File Reference Summary

| File | কাজ |
|------|-----|
| `FE: src/utils/helper.js` | productPrice, lineThroughPrice, singleProductPrice, calculatePrice |
| `FE: src/utils/applyCartLayers.js` | Cart-side optimistic total (tier + group + coupon) |
| `FE: src/components/frontend/home/flashSale/FlashProductSlider.jsx` | Flash slider card price |
| `BE: src/app/product/product.price.resolver.ts` | Pure sync resolver: base + variation + flash |
| `BE: src/app/order/order.recompute.ts` | Full order recompute: all layers, server-authoritative |
| `BE: src/app/flashsale/flashsale.services.ts` | findActiveFlashMapForProducts (batch strip), findActiveFlashWithMetaForProduct (PDP), findActiveFlashSaleStorefrontService (slider endpoint) |
| `BE: src/app/product/product.services.ts` | PDP flash+campaign inject, home strip flash enrichment |
| `BE: src/app/flashsale/flashsale.routes.ts` | GET /active (storefront) before /:_id (order matters!) |

---

## 11. Quick Cheat Sheet — যেকোনো price problem দেখলে কোথায় যাব

```
Card price ভুল?           → helper.js → productPrice()
Strikethrough ভুল?        → helper.js → lineThroughPrice()
PDP price ভুল?            → helper.js → singleProductPrice()
Cart total ভুল?           → applyCartLayers.js
Checkout total ভুল?       → order.recompute.ts
Flash badge/timer ভুল?   → PDP: PdpPriceMeta.jsx reads active_flash
Flash not showing?        → product.services.ts → findAProductDetailsServices() phase 1
Flash on home strip?      → product.services.ts → strip service + findActiveFlashMapForProducts()
Flash slider missing?     → getFlashSaleProducts.js URL = /flash-sale/active?
                           → flashsale.routes.ts → /active before /:_id?
Flash slider price ভুল?  → FlashProductSlider.jsx → getFlashPrice()
Campaign on PDP?          → product.services.ts → findAProductDetailsServices() phase 2
ECommerceChoice missing?  → SectionRenderer.jsx → ecommerce_choice key wired?
```
