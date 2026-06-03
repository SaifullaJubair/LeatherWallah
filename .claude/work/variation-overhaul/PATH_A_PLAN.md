# Path A — Variation Save Scalability Overhaul

**Goal:** Restore the 500+ variation cap by batching DB calls (Q4) and parallelizing S3 uploads (Q5). Side-quest: 2 small bugs (QR copy + Category crash) while in the area.

**Locked:** 2026-05-31. Owner-approved after the 288-variation timeout incident.

---

## Why this plan exists

Current per-variation hot loop (inside the parent Mongo transaction):

```ts
for (const variation of variation_details) {
  await resolveVariationAxisValues(...)   // 1 DB query
  await buildVariationAxisCodes(...)      // 1 DB query (sibling SKUs)
  await generateUniqueBarcode(...)        // 1-2 DB queries (collision retry)
  for (const file of matchingFiles) {
    await uploadToSpaces(file)            // 1 sequential S3 PUT
  }
  await VariationModel.create(...)        // 1 DB query
}
```

**For 200 variations:** ~800 DB round-trips + up to 200 sequential S3 calls inside one Mongo transaction → 60s transaction timeout → `Transaction with txnNumber 2 has been aborted`.

This plan removes the per-row work by hoisting DB queries to bulk operations and parallelizing the S3 work.

---

## Scope

### IN scope

| # | Task | File(s) |
|---|------|---------|
| Q4-1 | Pre-generate ALL variation barcode numbers in-memory | `product.controllers.ts` (postProduct + updateProduct) |
| Q4-2 | ONE bulk `$in` query to detect barcode collisions across all rows | `product.codes.ts` (new `generateUniqueBarcodesBatch`) |
| Q4-3 | Pre-generate ALL variation SKUs in-memory via a shared axis-code map | `product.codes.ts` (new `buildVariationAxisCodesBatch`) |
| Q4-4 | ONE bulk `$in` query to detect SKU collisions | same |
| Q4-5 | Replace per-row `VariationModel.create()` with `insertMany()` | `product.controllers.ts` |
| Q5-1 | Parallel S3 uploads via `Promise.all` chunks of 10 (variation images + videos + other_images) | `product.controllers.ts`, `image.upload.ts` (new helper) |
| Q5-2 | Use the same parallel-chunk pattern for parent `other_images` array | `product.controllers.ts` |
| C-1 | Restore variation cap to **500** after measurements pass | `product.controllers.ts` + `StepOneVariation.jsx` |
| B-1 | Admin product update page — QR link clickable (`target="_blank"`) + copy-to-clipboard button | `QrBlock.jsx` |
| B-2 | Fix `CategoryViewSection.jsx:88` crash on legacy 3-level URL | `CategoryViewSection.jsx` (investigate undefined access) |

### OUT of scope (deferred)

- Variations outside the parent transaction (true atomicity tradeoff — keep for Phase F if Q4+Q5 still insufficient)
- Lazy barcode NUMBER generation (Option Q3) — Q4 makes this unnecessary
- Manual slug override field — defer; auto-Banglish is acceptable, owner can manual-edit slug later via DB if needed
- Phase A/B/C/E proper plan (already in `PLAN.md`)

---

## Detailed task plan

### Q4-1 + Q4-2: Batch barcode generation

**New helper in `product.codes.ts`:**

```ts
/**
 * Generate N unique barcodes in one DB roundtrip.
 *
 * 1. Generate N+buffer candidates in-memory (10% buffer to absorb the rare
 *    collisions on a 1-trillion-keyspace 12-digit number)
 * 2. ONE query: `find({ variation_barcode: { $in: candidates } })`
 * 3. Filter out collisions, replace with fresh candidates if N short
 * 4. Return N unique barcodes
 *
 * Probability of needing a second roundtrip with 10% buffer + 1T keyspace +
 * 100k existing barcodes: ~0.001%. Acceptable; fallback retries once.
 */
export const generateUniqueBarcodesBatch = async (
  count: number,
  kind: "product" | "variation",
): Promise<string[]>
```

**Usage in postProduct/updateProduct (replaces the per-row call):**

```ts
const barcodes = await generateUniqueBarcodesBatch(variation_details.length, "variation");
variation_details.forEach((v, i) => { v.variation_barcode = barcodes[i]; });
```

### Q4-3 + Q4-4: Batch SKU generation

**Strategy:**
- `buildVariationAxisCodes` currently does ONE DB lookup of sibling SKUs per call.
- Refactor: fetch the sibling SKU set ONCE, share across all rows.

**New helper:**
```ts
export const buildVariationAxisCodesBatch = async (
  rows: { combination: string[] }[],
  product_variant_axes: AxisDef[],
): Promise<string[][]>  // [row][position] codes
```

Single DB call to fetch all existing axis codes for this product's siblings, then build all row codes in-memory.

### Q4-5: insertMany

Replace:
```ts
for (...) { await VariationModel.create(row); }
```
with:
```ts
await VariationModel.insertMany(allRows, { session, ordered: false });
```

`ordered: false` lets MongoDB parallelize inserts internally and not stop on first error.

### Q5-1: Parallel S3 uploads

**New helper in `image.upload.ts`:**

```ts
/**
 * Upload N files to S3 in parallel chunks. Default chunk size 10 matches the
 * S3 default connection pool — going higher risks throttling/ECONNRESET.
 *
 * Returns results in the SAME ORDER as input (critical: row index → file map).
 */
export const uploadFilesInChunks = async (
  files: Express.Multer.File[],
  chunkSize = 10,
): Promise<Array<{ Location: string; Key: string }>>
```

Apply in:
- Variation image loop (postProduct + updateProduct, variation_images + variation_video)
- Parent `other_images` loop

**Caution:** Maintain order. The current code uses `matchingFiles` filter per-row — we'll preserve indexing via a map.

### Q5-2: Same chunk helper for parent other_images

Already a flat array — straightforward swap.

### C-1: Cap restoration

After local measurement (see Testing section), restore cap to 500 (was 300):
- Backend `product.controllers.ts` two places
- Admin `StepOneVariation.jsx` threshold + label

### B-1: QR clickable + copy button

In `QrBlock.jsx` (admin product update page):
- Wrap QR URL display in `<a target="_blank" rel="noopener">`
- Add small copy button beside it; uses `navigator.clipboard.writeText` + toast confirmation

### B-2: CategoryViewSection crash

Investigate `CategoryViewSection.jsx:88` — `Cannot read properties of undefined (reading '0')`. URL `/category/test/sub-categroy/child-category` is legacy 3-level. The component probably reads `data.subCategories[0]` or similar without the optional chain. Fix with safe access + empty state.

---

## Estimated effort

| Task | Time |
|------|------|
| Q4-1 + Q4-2 (batch barcodes) | 20 min |
| Q4-3 + Q4-4 (batch SKUs) | 20 min |
| Q4-5 (insertMany) | 10 min |
| Q5-1 (S3 chunk helper + variation use) | 15 min |
| Q5-2 (parent other_images) | 5 min |
| C-1 (cap restore + verify) | 5 min |
| B-1 (QR clickable + copy) | 10 min |
| B-2 (Category crash) | 15 min |
| Build verify + lint | 5 min |
| **Total** | **~1h 45min** |

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `insertMany` partial failure mid-batch | Low | Med | `ordered: false` + transaction wraps so all-or-nothing still holds |
| S3 parallel uploads hit Contabo rate limit | Low | Med | Chunk size 10 is well under typical limits; retry on 503 |
| Bulk barcode `$in` hits Mongo BSON size limit (16MB) | Very low | Low | 500 × 12-byte string = 6KB; safe |
| Reordering issue in parallel uploads | Med | High | `Promise.all` preserves array order; verify with unit math |
| Existing transaction context lost during insertMany | Low | High | Explicitly pass `session` to insertMany |
| QR copy button silently fails in non-HTTPS | Med | Low | `navigator.clipboard` requires HTTPS or localhost; fallback to manual selection |
| CategoryViewSection fix may mask deeper data-shape mismatch | Med | Med | Investigate first, fix root cause if visible; surface to PLAN.md if structural |

---

## Acceptance criteria

- [ ] 200-variation product (no images) saves in < 5 sec
- [ ] 500-variation product (no images) saves in < 15 sec
- [ ] 200-variation product with 200 images saves in < 60 sec
- [ ] Existing 1-variation flow unchanged behavior
- [ ] All variation barcodes unique post-save (DB query check)
- [ ] All variation SKUs unique post-save (DB query check)
- [ ] QR link opens in new tab, copy button shows toast on success
- [ ] `/category/test/sub-categroy/child-category` no longer throws — either renders or shows graceful empty state

---

---

## ✅ Edge-audit modifications applied (locked 2026-06-01)

### BLOCKERS addressed
1. **Pass `session` to collision-check queries** — snapshot isolation prevents race-condition partial inserts when 2 admins save concurrently.
2. **`insertMany({ ordered: true })`** — surfaces partial-failure cleanly via thrown error (vs silent partial save with ordered:false).
3. **B-2 scope-limited:** fix CategoryViewSection defensively (`slug?.[0] || ""`). Next 16 `await params` migration deferred — separate task, broader scope.

### HIGH bugs absorbed
- **NEW Q5-3:** `processVariationImages` internal loop now also uses parallel chunk helper.
- **Q4-3 explicit:** batch axis-code helper grows `takenPerPosition` Set incrementally as it processes rows in-memory (DB call once upfront).
- **Q5 invariant:** post-chunk `result.length === files.length` assertion catches order bugs.
- **B-1 fallback:** `navigator.clipboard.writeText` with `execCommand` fallback for non-HTTPS.
- **NEW Cleanup-1:** dedupe schema indexes in variation.model.ts + product.model.ts (silences Mongoose startup warnings).

### Acceptance criteria added
- Post-save DB count check: `Variation.count({product_id}) === expected.length`
- Admin warning when total upload file count > 500

---

## Test plan (after implementation)

1. **Smoke:** Single-variation product create + update — confirm baseline unchanged
2. **Scale:** Create 200/300/500-variation products without images — measure save time
3. **Scale + media:** 100-variation product with variation images — confirm parallel uploads
4. **Race:** Two admin sessions create products simultaneously — confirm no barcode/SKU collision
5. **QR:** Click QR link → opens new tab to public PDP; click copy → clipboard contains URL
6. **Category:** Visit problem URL → no crash
7. **Migration:** Old products with sequential-generated barcodes still work
8. **Print label:** Lazy barcode image still works post-bulk-insert
