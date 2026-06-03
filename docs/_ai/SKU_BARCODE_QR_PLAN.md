# SKU / Barcode / QR Code — Full Implementation Plan

> **Status:** Planned, NOT implemented yet.
> **Owner:** FruitSnacks resale platform (clone-per-client architecture).
> **Goal:** Bring SKU + Barcode + QR Code to industry-standard ecommerce maturity
> (Shopify / WooCommerce / BigCommerce level), without over-engineering for the
> single-shop scale this codebase serves.

---

## 0. Why this doc exists

Current state audit (2026-05-29) showed all three identifiers (SKU, Barcode, QR)
exist as schema fields in `product.model.ts` and `variation.model.ts`, but the
end-to-end wiring is half-built or dead:

- Backend `barcode` save line is commented out — admin-entered barcodes never persist
- QR payload defaults to `product_slug` (string), not a full URL — scanning doesn't open the storefront
- No uniqueness check on SKU / barcode
- No frontend display anywhere
- No order-snapshot of these values (historical traceability gone if a product is renamed/deleted)

This doc lays out the proper end-to-end architecture so a future implementation
session can ship it cleanly in one or two phases.

---

## 1. Mental model — what each identifier is for

### 🏷️ SKU (Stock Keeping Unit)
**Internal merchant code.** Shopify-style: short, human-readable, owner-controlled.
Used for:
- Owner / staff communication ("send 50 of FS-MNG-250 to warehouse B")
- CSV import/export / accounting reconciliation
- Inventory adjustments (admin types SKU → system finds product)
- Supplier purchase orders ("we ordered 200 FS-MNG-250 from supplier X")

**Format suggestion:** `<PREFIX>-<CATEGORY>-<VARIANT>` e.g. `FS-MNG-250G`, `FS-PNP-500G-RED`
**Cardinality:** 1 SKU per product (simple) OR 1 SKU per variation (variable).

### 🏪 Barcode (UPC/EAN/ITF/Custom)
**Physical-world unique identifier.** Used at:
- POS counter scanner → instantly identify product, add to cart with price
- Warehouse receiving / stocktake → scan to update inventory
- Outbound courier handoff → scan to confirm right product going out

**Industry standard formats:**
- **UPC-A** (12 digits) — North America retail
- **EAN-13** (13 digits) — Europe + most of Asia incl. Bangladesh local retail
- **ITF-14** (14 digits) — outer cartons / wholesale boxes
- **Code 128** (alphanumeric) — internal warehouse / custom

For a Bangladesh fruit-snack shop selling D2C online, **Code 128 + auto-prefix**
is the practical pick — owner doesn't need to buy GS1 prefixes. But the system
should accept any of these (free string field with optional format validator).

**Cardinality:** 1 barcode per SKU. Each variation has its OWN barcode (a 250g
and 500g pack must scan as different items).

### 📱 QR Code
**Customer-facing engagement tool.** Used for:
- Product label / packaging → customer phone scan → opens PDP → reorder / share
- Marketing materials (poster, leaflet, Facebook ad) → scan → landing page
- "Verified authentic" trust signal → scan to see product details + reviews
- Future: variation-specific QR → opens PDP pre-selected to the right variation
- Future: campaign QR → opens with coupon auto-applied

QR encodes a **full URL** (not just an ID), so any phone camera resolves to a
browser page without any custom app.

**Cardinality:** 1 QR per product (URL = PDP). Optionally 1 QR per variation
(URL with `?variant=<id>` query string) — Phase 2.

### 🔑 The three coexist, they don't compete
A well-set-up SKU=`FS-MNG-250`, barcode=`880123456789`, QR=`https://shop.com/p/dried-mango-250g`
all point to the same product but serve **different audiences**:
- SKU → owner / staff
- Barcode → physical-world automation
- QR → customer phones

---

## 2. Target maturity level

We're targeting **mature single-shop ecommerce**, NOT enterprise inventory.
Concretely the system should:

✅ **Required (Phase 1):**
- Per-product SKU + per-variation SKU, unique within the shop
- Auto-generate fallback (admin can override) — never empty
- Per-product Barcode + per-variation Barcode, unique within the shop
- QR auto-generated to full PDP URL, regenerable on slug change
- Order line items snapshot SKU + barcode at placement (historical record)
- Admin search by SKU OR barcode → exact-match jump to product
- Admin print-ready barcode label (single + bulk)
- Admin print-ready QR label (single + bulk)
- Storefront PDP shows SKU (small, near price) — common B2C pattern

🟡 **Nice-to-have (Phase 2):**
- CSV import/export including SKU + barcode
- POS scanner page (admin) — keyboard-emulator scanner support
- Per-variation QR with pre-selected variant
- Campaign QR (URL with coupon code embedded)
- "Verify authentic" landing page (QR → product details + last-known seller)
- Bulk-regenerate (e.g. "regenerate all QRs after we change domains")

🔴 **Out of scope (enterprise only):**
- GS1 prefix registration / DataBar formats
- Multi-shop inventory consolidation
- Serialised barcodes (each pack has a unique barcode — for high-value goods)
- Barcode-driven receiving against a PO

---

## 3. Data model

### 3.1 `Product` (additions / cleanups)

```ts
// product.interface.ts + product.model.ts
{
  // EXISTING (keep)
  product_sku: { type: String, unique: true, sparse: true, index: true },
  barcode:     { type: String, unique: true, sparse: true, index: true },
  barcode_format: {
    type: String,
    enum: ["CODE128", "EAN13", "UPC", "ITF14", "CUSTOM"],
    default: "CODE128"
  },
  barcode_image: { type: String },         // S3 URL — print-ready PNG/SVG
  barcode_image_key: { type: String },     // S3 key for cleanup

  qr_code: { type: String },               // FULL URL, not slug
  qr_code_image: { type: String },         // S3 URL OR data-URL
  qr_code_image_key: { type: String },     // S3 key for cleanup
  qr_code_updated_at: { type: Date },      // for stale-after-slug-change UI hint
}
```

**Indexes:**
```js
ProductSchema.index({ product_sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ barcode: 1 }, { unique: true, sparse: true });
```
`sparse: true` = NULL allowed (multiple products can omit SKU/barcode). Important
for backward-compat — existing docs without these fields don't break the index.

### 3.2 `Variation`

```ts
// variation.interface.ts + variation.model.ts
{
  variation_sku:     { type: String, unique: true, sparse: true, index: true },
  variation_barcode: { type: String, unique: true, sparse: true, index: true },
  variation_barcode_format: { type: String, default: "CODE128" },
  variation_barcode_image: { type: String },
  variation_barcode_image_key: { type: String },

  // Phase 2 — optional per-variation QR
  variation_qr_code: { type: String },         // FULL URL with ?variant=<id>
  variation_qr_code_image: { type: String },
  variation_qr_code_image_key: { type: String },
}
```

### 3.3 `Order` line snapshot

Currently the order stores `product_id` + `variation_id` references. If the
product is deleted or renamed, the historical order shows stale data. Add SKU /
barcode snapshot at placement:

```ts
// order.interface.ts — order_products[] each item
{
  // EXISTING
  product_id, variation_id, product_name, ...

  // ADD
  product_sku_snapshot:     { type: String },
  variation_sku_snapshot:   { type: String },
  product_barcode_snapshot: { type: String },
  variation_barcode_snapshot: { type: String },
}
```

These are write-once at `postOrder` / `postSingleOrder`, never updated after.
Powers historical reports + warehouse pick-list ("scan barcode X → check it's
on order Y").

### 3.4 `Settings`

```ts
// setting.interface.ts + setting.model.ts
{
  // EXISTING (keep)
  sku_prefix: { type: String, default: "FS" },        // FS-MNG-250
  barcode_auto_generate: { type: Boolean, default: true },
  barcode_default_format: {
    type: String,
    enum: ["CODE128", "EAN13", "UPC", "ITF14"],
    default: "CODE128"
  },
  // QR base URL — used to build `qr_code` payload. If blank, falls back to
  // backend's FRONTEND_PUBLIC_URL env. Owner can override per-deploy.
  qr_storefront_base_url: { type: String },           // e.g. "https://fruitsnacksbd.com"
}
```

---

## 4. Backend services + endpoints

### 4.1 `product.allId.ts` — generator helpers

```ts
// Generates a unique SKU using settings.sku_prefix + category code + sequence.
// e.g. FS-MNG-0042 (MNG = category short code; 0042 = sequential)
export const generateSku = async (categoryName?: string): Promise<string> => {
  const settings = await SettingModel.findOne();
  const prefix = settings?.sku_prefix || "FS";
  const catCode = (categoryName || "PRD").slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  // collision-safe loop
  for (let attempt = 0; attempt < 100; attempt++) {
    const seq = String(await ProductModel.countDocuments() + 1 + attempt).padStart(4, "0");
    const candidate = `${prefix}-${catCode}-${seq}`;
    const exists = await ProductModel.findOne({ product_sku: candidate });
    if (!exists) return candidate;
  }
  throw new ApiError(500, "Could not generate unique SKU");
};

// Generates a unique 12-digit numeric barcode (Code 128 / CSV-safe).
// Format: <2-digit shop prefix><10-digit sequence with check digit>
export const generateBarcode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const seed = Date.now().toString().slice(-10);
    const rand = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    const candidate = `${rand}${seed}`;
    const exists = await ProductModel.findOne({ barcode: candidate });
    if (!exists) return candidate;
  }
  throw new ApiError(500, "Could not generate unique barcode");
};

// Builds the full QR payload URL for a product.
export const buildQrPayload = async (product: IProduct, variation_id?: string): Promise<string> => {
  const settings = await SettingModel.findOne();
  const base = (
    settings?.qr_storefront_base_url ||
    process.env.FRONTEND_PUBLIC_URL ||
    "https://fruitsnacksbd.com"
  ).replace(/\/$/, "");
  const path = `/products-themed/${product.product_slug}`;
  const url = `${base}${path}`;
  return variation_id ? `${url}?variant=${variation_id}` : url;
};
```

### 4.2 Image generation utilities

Add to `src/helpers/code.images.ts` (new file):

```ts
import bwipjs from "bwip-js";       // npm i bwip-js — barcode renderer
import QRCode from "qrcode";        // already in package.json
import { uploadBufferToS3 } from "./image.upload";

// Renders a print-ready PNG barcode (300dpi-ready), uploads to S3, returns
// { Location, Key }. Use bwip-js for proper CODE128/EAN13 rendering — QRCode
// library only handles QR, not 1D barcodes.
export const renderBarcodeImage = async (
  text: string,
  format: "CODE128" | "EAN13" | "UPC" | "ITF14" = "CODE128"
) => {
  const png = await bwipjs.toBuffer({
    bcid: format === "CODE128" ? "code128" : format === "EAN13" ? "ean13" : format.toLowerCase(),
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: "center",
  });
  return uploadBufferToS3(png, `barcodes/${text}.png`, "image/png");
};

// QR image — already covered by QRCode.toDataURL, but the print-ready version
// should be uploaded to S3 (larger size, vector-friendly) instead of stored as
// a data-URL bloat in the document.
export const renderQrImage = async (payload: string, slug: string) => {
  const png = await QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    width: 600,                    // print-ready 5cm at 300dpi
    margin: 2,
  });
  return uploadBufferToS3(png, `qrs/${slug}.png`, "image/png");
};
```

**Dependency:** `npm install bwip-js` in `FruitSnacksBackend/`.

### 4.3 Product controller wiring

In `product.controllers.ts` `postProduct` (uncomment + fix the dead block around
line 540-595):

```ts
// SKU
if (!requestData.product_sku) {
  requestData.product_sku = await generateSku(requestData.category_name);
} else {
  const skuTaken = await ProductModel.findOne({ product_sku: requestData.product_sku });
  if (skuTaken) throw new ApiError(409, `SKU "${requestData.product_sku}" already exists`);
}

// Barcode
const settings = await SettingModel.findOne();
if (!requestData.barcode && settings?.barcode_auto_generate !== false) {
  requestData.barcode = await generateBarcode();
}
if (requestData.barcode) {
  const bcTaken = await ProductModel.findOne({ barcode: requestData.barcode });
  if (bcTaken) throw new ApiError(409, `Barcode "${requestData.barcode}" already exists`);
  const img = await renderBarcodeImage(
    requestData.barcode,
    requestData.barcode_format || "CODE128"
  );
  requestData.barcode_image = img.Location;
  requestData.barcode_image_key = img.Key;
}

// QR — payload + image generation happens after slug is known (post-save)
// because slug may be auto-generated. So we do it as a post-commit step.
```

Post-commit (after `product.save()`):

```ts
const qrPayload = await buildQrPayload(savedProduct);
const qrImage = await renderQrImage(qrPayload, savedProduct.product_slug);
await ProductModel.updateOne(
  { _id: savedProduct._id },
  {
    $set: {
      qr_code: qrPayload,
      qr_code_image: qrImage.Location,
      qr_code_image_key: qrImage.Key,
      qr_code_updated_at: new Date(),
    },
  }
);
```

**On slug update** (in `updateProduct`): regenerate QR (the URL changes).
Mark `qr_code_updated_at` so admin UI can show a "QR is stale, regenerate"
hint if the slug-history shows an old slug.

### 4.4 New / modified endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| `POST` | `/product/qr` | Regenerate single product QR (existing — enhance to use S3 upload + buildQrPayload) | `product_update` |
| `POST` | `/product/barcode` | Regenerate single product barcode image (after format change) | `product_update` |
| `POST` | `/product/bulk-regenerate-qr` | Regenerate ALL QRs (useful when domain changes) — runs in background, returns task id | `product_update` |
| `GET`  | `/product/lookup?sku=X` OR `?barcode=X` | Exact-match lookup → returns full product. Powers POS-style scanner page. | `product_show` |
| `GET`  | `/product/labels/print?ids=a,b,c&type=barcode\|qr` | Returns a PDF with print-ready labels (multiple per page, configurable size). Uses `pdfkit`. | `product_show` |

---

## 5. Admin UI

### 5.1 Product Add / Update form (extends current `ProductForm.jsx`)

Already in place from form-simplification work:
- SKU input + (NEW) "Auto-suggest" button → calls `GET /product/lookup?suggest=1` or generates locally
- Barcode input + "Generate" button (already added, currently local generator)

Add:
- **Barcode format selector** (Code 128 / EAN-13 / UPC / Custom) — small dropdown beside the field
- **Barcode image preview** — show the generated/uploaded barcode as a small thumbnail with "Download" + "Print this label" buttons
- **QR section** in `ProductMetaPanel.jsx` (already partial — enhance):
  - Big QR image preview
  - "Regenerate QR" button (already exists)
  - **"Download PNG"** button (300dpi, ready for label printer)
  - **"Print label"** button (opens a print-friendly page with QR + product name + SKU + barcode below)
  - Stale indicator: "QR points to old slug `<x>` — regenerate to update"

### 5.2 New page: `/admin/labels`

A bulk label printing page. Workflow:
- Admin selects products (multi-select from product list with checkboxes — already a common pattern in other table pages)
- Picks "Print barcodes" / "Print QRs" / "Print combined labels"
- Picks label size (Avery 5160 = 30 per page, Avery 5163 = 10 per page — preset templates)
- Backend returns PDF → opens in new tab → print

### 5.3 New page: `/admin/scan` (POS-style)

A simple page for warehouse / counter use:
- Big input field auto-focused
- Connect a USB barcode scanner (it acts as a keyboard) → scan beeps → input fills → Enter
- Backend `GET /product/lookup?barcode=X` → renders product card (name, image, price, current stock)
- Optionally: "Adjust stock by ___" form (for stocktake)

This is the **killer feature** that justifies barcode setup. Shopify's "POS Lite"
is exactly this. For a small fruit-snack shop with even 1 staff member doing
inventory once a month, this saves hours.

### 5.4 Product list table

- Add a SKU column (sortable, filterable)
- Search bar matches: `product_name | product_sku | barcode | meta_keywords`

---

## 6. Frontend (storefront) UI

### 6.1 PDP (Product Detail Page)

Just below price, small grey text:
```
SKU: FS-MNG-250
```

Optional: floating QR badge in PDP corner (small, 80x80, clickable to expand) —
helps customer scan-share or scan-bookmark on mobile.

### 6.2 Order confirmation email / page

Each line item shows the SKU (so customer can reference it for support).

### 6.3 No barcode on storefront
Barcodes are for warehouse / POS, not customers. Don't show.

---

## 7. Order placement — snapshot logic

In `order.controller.ts` `postOrder` / `postSingleOrder`, when building
`order_products[]`:

```ts
const product = await ProductModel.findById(item.product_id).lean();
const variation = item.variation_id
  ? await VariationModel.findById(item.variation_id).lean()
  : null;

orderProducts.push({
  // ... existing fields
  product_sku_snapshot: product?.product_sku || "",
  product_barcode_snapshot: product?.barcode || "",
  variation_sku_snapshot: variation?.variation_sku || "",
  variation_barcode_snapshot: variation?.variation_barcode || "",
});
```

This snapshot powers the warehouse pick-list page: "Order #12345 — scan these
barcodes to confirm each item is in the box."

---

## 8. Migration plan for existing data

Atlas DB currently has dev/test data only — owner has said "fresh DB, drop &
recreate fine." So:

**For dev (now → live launch):** wipe + reseed. No migration code needed.

**For post-launch (each cloned client deploy):** one-shot script
`src/scripts/backfill-codes.ts` that:
1. Iterates every product where `product_sku` is missing → calls `generateSku()`
2. Iterates every product where `barcode` is missing AND settings allow auto-gen
   → calls `generateBarcode()` + renders image
3. Iterates every product where `qr_code` is missing OR doesn't match current
   slug → regenerates via `buildQrPayload`

Idempotent (skip already-set). Run once per deploy.

---

## 9. Phasing

### Phase 1 — MVP (must-ship before resale)
- Schema indexes (unique sparse) on `product_sku` + `barcode`
- Uncomment + fix backend save logic for barcode
- Implement `generateSku`, `generateBarcode`, `buildQrPayload`, `renderBarcodeImage`, `renderQrImage`
- Wire into `postProduct` + `updateProduct`
- QR payload = FULL URL (fix #1 bug from audit)
- Admin form: barcode format selector, image preview, download button
- Admin `/scan` page (POS-style lookup)
- PDP shows SKU
- Order snapshot fields

**Effort:** 8-10 hours, single session.

### Phase 2 — Polish
- Bulk label print page + PDF rendering (`pdfkit`)
- CSV import/export
- Stale-QR indicator + bulk-regenerate endpoint
- Per-variation QR
- Order pick-list page (scan-to-confirm)

**Effort:** 6-8 hours.

### Phase 3 — Long-tail (per-client demand)
- GS1 / EAN-13 check-digit validation
- "Verify authentic" landing page
- Campaign QRs with embedded coupon
- Stocktake mode (scan + adjust)

**Effort:** demand-driven.

---

## 10. Dependencies

```bash
# Backend
npm install bwip-js                    # barcode image generator
npm install pdfkit                     # PDF for label sheets (Phase 2)

# Already present
qrcode                                 # QR image generator
```

No frontend deps — print pages use browser's native `window.print()`.

---

## 11. Testing checklist (post-implementation)

- [ ] Create product without SKU → auto-generated, unique format `FS-XXX-NNNN`
- [ ] Create product with manually-typed SKU → saved as-is
- [ ] Create 2nd product with same SKU → rejected 409
- [ ] Same for barcode (auto-gen + manual + collision reject)
- [ ] Barcode image renders correctly (open S3 URL in browser)
- [ ] QR payload = `https://<domain>/products-themed/<slug>`
- [ ] Scan QR with phone → opens PDP in browser
- [ ] Rename product (slug changes) → QR regenerates → old QR redirects (slug history)
- [ ] `/admin/scan` page: paste barcode → product loads
- [ ] Place order → `order_products[i].product_sku_snapshot` populated
- [ ] Delete product → order history still shows the SKU/barcode from snapshot
- [ ] `/admin/labels` page: select 5 products → download PDF → barcodes printable

---

## 12. References (industry patterns we're imitating)

- **Shopify** — SKU auto-suggest based on title + category + variant; barcode optional + format selector; bulk-print labels via app store
- **WooCommerce** — SKU unique constraint; barcode plugin renders Code 128 by default; barcode/SKU search in admin
- **BigCommerce** — UPC field separate from SKU; QR generation as a per-product action; print-label module built-in
- **Square POS** — barcode scanner page identical to what we describe in §5.3
- **Faire (wholesale marketplace)** — case barcodes (ITF-14) for outer cartons separate from item barcodes — out-of-scope for our small-shop use case

---

## 13. Decisions log

- **Why CODE128 default, not EAN-13?** EAN-13 requires GS1 prefix purchase (~$250/year). CODE128 is free, alphanumeric, scans on any modern scanner — perfect for online-first small shop. EAN-13 stays as an OPTION for shops that already have GS1 prefixes (e.g. a brand re-listing on Daraz/Foodpanda which sometimes require it).
- **Why URL in QR not just ID?** A URL works with any phone's default camera app — zero friction. ID-only QR needs the shop's app installed first (we don't have one).
- **Why snapshot SKU/barcode in orders?** Historical traceability. Owner may rename `FS-MNG-250` → `FS-MNG-S` six months later; old orders should still show the original. Same reason ecommerce platforms always snapshot product name + price at order time.
- **Why sparse unique index?** Allows products without SKU/barcode (small shops at launch may not bother) while still enforcing uniqueness when they're set. The alternative — required fields — pushes the burden onto every admin.
