# Client Sprint 4 — FruitSnacks (Future feature backlog)

**Created:** 2026-06-05 (session 24, end-of-session parking)
**Status:** BACKLOG — not started. Sprint 2 + Sprint 3 must complete first.
**Predecessors:** [CLIENT_SPRINT_2.md](CLIENT_SPRINT_2.md), [CLIENT_SPRINT_3.md](CLIENT_SPRINT_3.md)

---

## Purpose

Capture features owner mentioned/agreed-to during session 24 planning but explicitly deferred to a future sprint. Avoid losing them across context resets. NONE of these are committed scope — they're parked candidates.

---

## Parked items (alphabetical)

### 1. Address autocomplete (BD divisions/districts/upazilas/postcode)

- Checkout form auto-completes address as user types
- Eliminates Pathao/Steadfast zone-pick friction
- Data source: BD-Govt postcode dataset OR Pathao API geocoding
- Effort: ~5-8h (depends on data source)

### 2. OTP-only login UX (phone, 1-step)

- Bypass password — user enters phone → OTP → in
- Lower friction for repeat customers
- Couples with H Auth from Sprint 2 (which already hashes OTP)
- Effort: ~4-6h
- Caveat: anonymous checkout still primary path; OTP login optional convenience

### 3. Cart abandonment popup (exit-intent / idle-trigger)

- 30s idle in cart with no checkout → popup with coupon/incentive
- Exit-intent mouse-leave (desktop) → "wait! 10% off"
- Email/phone capture if guest
- Backend already has `abandonedCart` module — UI side missing
- Effort: ~4-5h

### 4. Age-gate modal (18+ products)

- Site-wide or per-category gate
- LocalStorage flag once acknowledged
- Defer unless owner adds restricted SKUs (not relevant for fruit snacks today)
- Effort: ~2h
- Status: DEFER unless product line changes

### 5. Multi-language (Bangla / English toggle)

- Site-wide language switcher in topbar
- i18n keys for all hardcoded strings
- Product copy already DB-driven — main work is UI strings
- Major effort: ~20-30h
- Status: DEFER probable — single-market

### 6. Multi-currency

- Settings-controlled currency display
- Backend already has `currency_code/symbol` settings
- Pricing stays in BDT internally; display converts
- Effort: ~6-8h
- Status: DEFER unless owner targets international clones

### 7. B2B wholesale tier

- Logged-in business customer sees different pricing
- New `user_type: business` + per-product `wholesale_price`
- Min quantity rules, NET-30 invoicing optional
- Effort: ~12-15h (medium feature)
- Status: PARK — strong SaaS angle later

### 8. Subscription products (auto-reorder)

- Customer subscribes to product every 30/45/60 days
- Recurring order generation cron + recurring payment (post-COD-only era)
- New `subscription` module
- Effort: ~15-20h
- Status: PARK — needs payment-gateway first

### 9. Gift wrapping option at checkout

- Checkbox + ৳50 fee + optional gift message
- Order field for gift_message / is_gift
- Effort: ~3-4h (small feature)

### 10. Scheduled delivery (pick delivery date/time slot)

- Customer picks preferred delivery date in checkout
- Settings for available slots / blackout dates
- Order field for `preferred_delivery_date`
- Effort: ~4-6h
- Couples with courier integration

### 11. Store pickup point (alternative to delivery)

- Checkout option: "Deliver to home" vs "Pickup from store"
- Pickup = ৳0 shipping
- Couples with D18 POS work from Sprint 2
- Effort: ~3-4h

### 12. Loyalty point redeem on checkout

- Already have wallet + loyalty modules — verify if redeem flow on checkout works
- May be partially built; audit needed before estimating
- Effort: ~2-4h (audit) + ~3-5h (if missing)

### 13. Refer-a-friend (invite-link, both reward)

- Logged-in user generates unique invite link
- Friend signs up via link → both get wallet credit
- New `referral` module
- Effort: ~6-8h

---

## Other deferred items (carry-forward from earlier sprints)

From Sprint 2 / Sprint 3 backlog:

- **D16 SSLCommerz full E2E payment** — defer until owner approves payment update
- **11γ Combo product** — full new feature
- **11δ Offer-in-normal-cart** — bigger feature
- **C13 Tier C 3 operational toggles** (site_under_maintenance / block_search_indexing / order_cancel_window_hours)
- **Item 4 Floating images rethink** — BLOCKED on owner sketch
- **PDP refinement pass** (post-H1, after home redesign live)
- **Admin section reorder UI for home_section_array variants** (per-section variant select — current scope is enabled/order only, not variant)
- **searchAnalytics auto-derive popular keywords** (from S.D4 deferred)
- **Real personalization for Just-for-You** (from ST.D3 deferred — view+purchase history)
- **Trending view_count_30d algorithmic** (from ST.D1 deferred — currently admin-flag)
- **Instagram feed grid** (Tier 3 from H1 research)
- **Recipe / Blog module** (big SEO-content build, separate sprint)
- **Recently viewed widget**
- **App download badges** (when mobile app exists)

---

## Sprint 4 priority hint (when sprint kicks off)

Top conversion-impact (build first):
1. Cart abandonment popup (#3) — recovers lost orders, small build
2. Address autocomplete (#1) — checkout friction killer
3. Loyalty redeem on checkout (#12) — likely partial; audit first
4. Scheduled delivery (#10) — operational win
5. Refer-a-friend (#13) — growth lever

Defer until business case:
- Subscriptions (#8) — needs payment-gateway
- Multi-language/currency (#5, #6) — single-market for now
- B2B (#7) — SaaS-tier feature
- Age-gate (#4) — N/A for fruit snacks

---

## Resume notes

This is a **parking lot**, not a plan. Sprint 4 actual plan = written fresh when owner triggers it (after Sprint 2 + Sprint 3 ship + owner live-tested). At that time:
1. Re-read this list with current business context
2. Owner picks 5-8 items to actually scope
3. Per-item plan-edge-audit before code (per [[cross-doc-sync-rule]])
