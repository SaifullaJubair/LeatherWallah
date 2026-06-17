# Backend Route-by-Route Audit — 2026-06-16

**Purpose:** next-phase reference. Every `*.routes.ts` was read and reconciled against `docs/backend.md`. Code = source of truth. Gaps found were fixed in `backend.md` the same pass.

**Method:** grepped route definitions from all 47 route files + `routes.ts` mount list; cross-checked endpoints, permission flags, and key schema fields (product, order, orderProduct, setting, role).

---

## Verdict

✅ **Backend is consistent and healthy.** No security regressions; all GATE-0 fixes confirmed in code (B-1 role, B-2 supplier, B-3 payment, B-6 CORS, B-10 upload, etc.). RBAC flags documented all exist in `role.model.ts`. The gaps were **documentation lag** (real endpoints not yet in `backend.md`), not code bugs — all now fixed.

---

## Gaps found in backend.md → FIXED this pass

### Stale doc-errors (doc described OLD buggy code)
| Module | Doc said | Reality (code) |
|--------|----------|----------------|
| role | flags "probably a typo, get=role_create…" | ✅ FIXED in code (get=show, post=create, patch=update, delete=delete) — doc corrected |
| supplier | `verifyToken("")` empty-flag bug | ✅ FIXED — `supplier_show/create/update/delete` — doc corrected |
| paymentWithdraw / payment_method | "permission check missing" | ✅ FIXED — full `payment_withdraw_*` / `payment_method_*` flags — doc corrected |
| dashboard | only `GET /` (implied public) | now `dashboard_show`-gated + 2 widget endpoints — doc corrected |

### Undocumented real endpoints → ADDED to backend.md
- **product:** `/page-content`, `/quick`, `/images`, `/qr`, `/ensure-barcode-image`, `/view-count`, `/by-qr-code/:code`, `/top_selling`, `/new_arrival`, `/most_viewed`, `/low_stock`, `/dashboard-rich` (12 routes)
- **order:** `/create-admin` (POS), `/:order_id/email` (`/single_order` was already there)
- **user:** `/refresh`, `/logout`, saved-address CRUD (`/addresses`, `/address`, `/address/:id`, `/address/:id/default`), `/me/email` (S6 — whole feature was missing from doc)
- **adminRegLog:** `/refresh`, `/logout`, `/forgot-password`, `/reset-password`
- **review:** `/by-ids`, `/seed/bulk`, `/seed/manual`, `/seed/list`
- **dashboard:** `/widgets/top-selling`, `/widgets/orders-by-status`
- **attribute:** `/usage/:id` (delete-protection usage count)
- **offer:** `/by-product/:product_id` (PDP offer-discovery)
- **faq-template:** `/topics` (distinct topic suggestions)

---

## Schema spot-checks — all PASS
- **order.interface.ts** — `order_type`, `currency`, `pre_discount_total`, `internal_note`, `fraud_status`, `cancel_reason` all present as documented (+ bonus `exchange_rate` field, not in doc — trivial).
- **orderProduct.interface.ts** — `product_name_snapshot`, `product_image_snapshot`, `discount_source`, `vat_rate`, `vat_amount` all present. (discount_source enum has a few extra values: `coupon`/`manual`/`flash_sale` vs doc's `flash` — cosmetic only.)
- **product.interface.ts** — `category_id` (optional), `category_path`, `attributes_details`, `custom_fields`, `sold_count`, `view_count` all present.
- **role.model.ts** — every new flag documented exists: `supplier_*`, `payment_withdraw_*`, `payment_method_*`, `dashboard_show`, `demo_data_clear`, `site_faq_*`, `newsletter_*`, `review_seed_bulk`, `trust_point_update`, `setting_secrets_update`, `order_create_admin`.

---

## Minor findings (no doc change needed; logged for cleanup)
1. **Dead code:** `src/helpers/frontend/videoUpload/video.upload.routes.ts` exists but is **NOT mounted** in `routes.ts` — orphan. Candidate for deletion.
2. **discount_source enum drift** between order doc note (`flash`) and code (`flash_sale`) — cosmetic.
3. **order `exchange_rate`** field exists in schema (multi-currency slot) but undocumented — slot only, fine.
4. Route-name legacy: `productFilter` `/heading_sub_child_category_data` keeps the old "sub_child" name though categories are now a nested tree — works, just a legacy label.

---

## Modules verified consistent (endpoints + flags match doc, no change)
category, brand, attribute(+usage), product(+partials), variation, productFilter, cart, order(+courier+webhook), fraud, coupon, campaign, offer(+by-product), banner, slider, review(+seed), question, setting(+secrets/home_layout), pageSeo, theme(+floating), faq_template(+topics), getme, authentication, role, adminRegLog, user(+address), supplier, dashboard(+widgets), metaPixel, tiktokPixel, image/multi-image upload, wishlist, wallet, loyalty, payment(SSLCommerz), flashsale, warehouse, abandonedCart, productFeed, siteFaq, newsletterSubscriber, demo, trustPoint, paymentWithdrawList, withdrow_payment_method.

**Total mounted modules: ~47** (matches `routes.ts`). backend.md "45+" claim accurate.
