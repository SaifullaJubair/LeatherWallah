# Clone-Now Fixes & Improvements (no big-bone surgery)

**Date:** 2026-05-25
**Context:** The product ships **clone-per-client** now (multi-tenant SaaS is future — see [SAAS_FUTURE_PLAN.md](SAAS_FUTURE_PLAN.md)). This doc lists what we can **fix / improve / add right now** on the current codebase **without** ripping out the core structure (variation engine, category model, etc. stay as-is). These are isolated bug-fixes + additive features that make each clone better today and carry forward to SaaS later.

> The big structural changes (attribute-linked variation engine, self-referencing category, backend price-resolver) are deliberately NOT here — they're "main bone" work, tracked in [BACKEND_AUDIT.md](BACKEND_AUDIT.md) and done as dedicated phases. This doc = safe, incremental wins.

Severity: 🔴 important · 🟡 should · 🟢 nice. Effort: S/M/L.

---

## A. Pure bug-fixes (no schema change) — do anytime

1. **🔴 S — `specifications` populate bug.** `product.services.ts (~4214)` populates `specifications.specification_id` with `model: "attributes"` — should be `"specifications"`. Breaks spec display. One-line fix.
2. **🟡 S — Product UPDATE drops `attributes_details`.** The full multipart `PATCH /product` rebuild doesn't carry `attributes_details`, so editing a variation product can wipe its attribute metadata. Add the field to the update payload assembly. (We already split page-content to `/product/page-content`; this is the *full-edit* path — see [[product-update-route-is-full-rebuild]].)
3. **🟡 S — Coupon date-range not validated server-side.** Coupon relies only on `status` toggle; add `coupon_start_date`/`coupon_end_date` check in `check_coupon`. Add optional min-order-value too.
4. **🟢 S — OTP/JWT hardening (low-risk parts):** verify OTP expiry on all paths; put `_id` in user/admin JWT (not just phone); shorten 365d expiry to ~30d. (Bigger refresh-token work deferred.)

## B. Additive product fields (schema add, back-compat, no rewrite) — like ZatiqEasy

These are **new optional fields** on the existing product/variation schema — no restructuring. Each adds value now and is reused in SaaS.

5. **🟡 S — `product.video_link` (YouTube URL).** ZatiqEasy stores a YouTube link instead of/along with uploaded video — cheap (no S3), easy embed. Add field + render on PDP (we already have a VideoSection).
6. **🟡 S — `product.condition`** (`new` | `used` | `refurbished`). Needed for electronics/marketplace clones. Simple enum field + show on PDP.
7. **🟡 S — `product.sold_count` / `initial_product_sold` + `view_count`.** "৫৩ জন কিনেছে" social proof + view counter. Add fields; increment view on PDP fetch, sold on order. Strong conversion lever.
8. **🟡 S — `product.weight_kg` + `dimensions_l/w/h_cm` at product level.** Currently only `variation_weight_grams`. Product-level physical dims help courier calc for non-variation products (furniture/electronics).
9. **🟢 S — `product.unit_name`** ("pc"/"kg"/"litre") shown with price.
10. **🟡 M — `custom_fields` as free key-value on product.** ZatiqEasy: `{ "Brand": "Premium", "Material": "Polyester" }` — admin "Add a new field". MUCH simpler than the heavy ref-based `specifications`. We already built the same label/value repeater pattern for nutrition — reuse it for product specs. (Keep `specifications` for back-compat; `custom_fields` is the friendly path.)

## C. Settings / config — make hardcoded things DB-driven (SaaS-ready, no rewrite)

These turn hardcoded assumptions into `setting` toggles — small wins now, essential for SaaS later. (Aligns with "write multi-tenant-ready" — [[architecture-clone-now-saas-ready]].)

11. **🔴 M — Currency from settings, not hardcoded "BDT".** `order.controller.ts:260,381` hardcodes BDT; `setting` already has `currency_symbol`/`currency_code` — just use them. Non-BD clone then only changes a setting.
12. **🟡 S — SMS reads from `setting` (with .env fallback).** `middlewares/send.otp.phone.ts` + `utils/send.order.sms.ts` ignore `setting.sms_*` and always use `.env`. Read settings first → admin SMS screen becomes real, clone swaps sender-id without code edit.
13. **🟡 M — Shop-settings toggles (ZatiqEasy pattern):** add to `setting`: `maintain_stock`, `show_sold_count`, `allow_image_download`, `show_email_field_checkout`, `enable_promo_at_checkout`, `show_popularity_filter`, `vat_tax_percentage`, `verify_phone_on_order` (OTP at checkout). Each gates existing behavior. Frontend reads them.
14. **🟡 M — Delivery zones beyond inside/outside Dhaka.** ZatiqEasy supports zone/district/upazila-level specific charges + weight-based extra + per-product override + COD toggle. We have only inside/outside Dhaka flat. Extend `setting` (and optional per-product `delivery_charge`) — additive.

## D. New small modules (additive, don't touch existing) — high value

15. **🔴 M — Wishlist backend module.** Currently localStorage-only. Add CRISM `wishlist` ({ user_id, items:[{product_id,variation_id}] }) + GET/POST/DELETE + sync. Pure addition, expected by storefront.
16. **🟡 L — Online payment gateway (at least one).** Biggest commercial gap. Add to order: `payment_method`, `payment_status`, `transaction_id`, `paid_amount`, `advance_amount`. Integrate **SSLCommerz** (covers cards + bKash + Nagad + Rocket in one) and/or **"Self MFS"** (ZatiqEasy's clever low-cost option: merchant's own bKash/Nagad number, customer pays manually, admin verifies). Also enables **advance/partial payment** (pay X% online, rest COD) — common BD pattern. This is L effort but additive (COD still default).
17. **🟡 M — Facebook Product Feed XML.** ZatiqEasy exposes `/api/facebook-product-feed.xml` for FB/Instagram catalog shopping. A read-only endpoint over existing products. Big marketing value, low risk.
18. **🟢 M — Order: richer status + payment-aware states + admin order create.** ZatiqEasy order detail lets admin add products, edit discount/VAT/delivery, recompute total, mark fraud, send to courier, partial payment. We can incrementally enrich order statuses (add On-Hold/Confirmed/Completed/Payment states) and an admin "create order" (POS-ish) without rewriting order core.

## E. Admin UX polish (frontend-only, no backend) — quick wins

19. **🟢 S — Customer list improvements:** district column, `orders_count` + "New customer" badge, search by name/phone, column toggle, Export CSV. (ZatiqEasy customer page.) Our customer data exists; just a better admin list.
20. **🟢 S — Dashboard widgets:** Quick Actions (Add Product/New Order/Categories/Themes/Settings), Low-Stock list, Top-Selling, Orders-by-status donut, revenue chart. Pure admin dashboard build.
21. **🟢 S — Product list:** inline qty edit, drag-reorder (serial), "X variants" expandable row, Type column.

---

## Suggested order for clone-now work
Quick bug-fixes first (A1–A3), then the cheap additive product fields (B5–B9) + currency/SMS settings (C11–C12) since they're S-effort high-value. Then wishlist (D15) and FB feed (D17). Payment gateway (D16) when a client actually needs online payment. Admin UX polish (E) anytime as filler.

**Nothing here blocks the big-bone phases** — when we later do the variation-engine / category / price-resolver rewrites (BACKEND_AUDIT phases), these additive fields and settings carry straight over and into SaaS.
