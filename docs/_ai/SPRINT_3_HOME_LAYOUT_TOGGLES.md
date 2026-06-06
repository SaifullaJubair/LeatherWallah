# Sprint 3 — Home Layout Control (toggle catalog)

**Created:** 2026-06-05 (session 24, end-of-session planning)
**Purpose:** Owner-configurable home page — every section toggleable, variant-selectable, content-editable from Admin. SaaS-ready (each clone customizes home without code change).
**Sibling:** [CLIENT_SPRINT_3.md](CLIENT_SPRINT_3.md) — H1 home redesign uses these toggles as its admin control surface.

---

## 🔒 Owner decisions LOCKED (session 24)

| # | Decision | Why |
|---|---|---|
| **L1 (REVISED)** | **Drag-drop section reorder via `home_section_array`** | Original L1 = flat fixed-order. REVISED end-of-session 24: owner wants admin section reorder (common e-commerce pattern). Storage = single JSON field on settings doc holding ordered array of section configs. Field-level toggles (title, limit, etc) stay flat for simplicity. |
| **L2** | **Chat = WhatsApp + Messenger + Live-chat embed (3 options stackable)** | Owner picks any/all. WhatsApp from C13, Messenger = new field, live-chat = embed code paste. |
| **L3** | **Hero = 3 variants** (single / carousel / split) | Owner picks via dropdown. Single = DTC. Carousel = current. Split = Pickaboo (slider + 2 stacked banners). |
| **L4** | **Category nav = 3 modes** (simple-dropdown / mega-menu / hamburger-drawer) | Owner picks. Auto-default = simple ≤10 categories, mega >10. Hamburger mobile-only auto. |
| **L5** | **All 7 product strips toggleable** + per-strip limit (4/8/12) + editable title | Maximum owner control. Owner can show 0 or all. |
| **L6** | **4 content blocks** all included: Brand story / Reviews carousel / Site FAQ / Newsletter | Each individually toggleable. Each needs small new module (or settings field). |
| **L7** | **Footer extras** = Payment methods strip + Delivery partners strip + Mini newsletter | App badges deferred (no app yet). |
| **L8** | **Reorder scope = all body sections** | Topbar + navbar + hero + footer FIXED top-bottom positions. Everything between (trust strip → newsletter) reorderable. ~14 reorderable sections. |
| **L9** | **Default order = DTC-research-optimized** | Fresh clone ships with conversion-optimized order: Hero → Trust → Featured Cat → Flash Sale → Bestsellers → Bundle Offers → New Arrivals → Brand Story → Reviews → Trending → Just for You → Promo Banner → Site FAQ → Newsletter. Owner can drag to any other order. |

---

## Full toggle catalog — section by section

Format: `field_name (type, default) — behaviour`

### 0. Top utility bar

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 0.1 | `topbar_show` | bool | true | OFF = entire topbar hidden |
| 0.2 | `topbar_announcement_text` | string | "" | Single line, scrolling if > viewport |
| 0.3 | `topbar_show_track_order` | bool | true | Track Order quick link |
| 0.4 | `topbar_show_hotline` | bool | true | Reads existing `contact` field |

### 1. Navbar

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 1.1 | `nav_category_mode` | enum: `simple\|mega\|hamburger\|auto` | `auto` | L4 — auto = simple ≤10 cat, mega >10. Hamburger forces drawer on desktop too |
| 1.2 | `nav_show_search_sticky` | bool | true | Sticky search on scroll |
| 1.3 | `nav_show_wishlist_icon` | bool | true | (depends on Sprint 2 D15) |
| 1.4 | `nav_show_compare_icon` | bool | false | Compare-products icon |
| 1.5 | `nav_extra_links_json` | json | `[]` | `[{label:"Bestsellers",url:"/shop?sort=popular"},...]` up to 4 links |

### 2. Hero section (above-the-fold)

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 2.1 | `hero_show` | bool | true | OFF = no hero (rare) |
| 2.2 | `hero_variant` | enum: `single\|carousel\|split` | `carousel` | L3. Single = 1 banner. Carousel = current. Split = slider + 2 side-banners |
| 2.3 | `hero_autoplay_seconds` | number | 5 | 0 = no autoplay (carousel/split only) |
| 2.4 | `hero_show_arrows` | bool | true | Carousel/split arrow controls |

### 3. Trust strip (under hero)

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 3.1 | `trust_strip_show` | bool | true | Trust badges row |
| 3.2 | `trust_strip_source` | enum: `trust_point\|static_4` | `trust_point` | Reuse trustPoint module OR show fixed 4-icon static (Free delivery / COD / Easy return / Quality) |

### 4. Featured Categories

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 4.1 | `feature_categories_show` | bool | true | Section on/off |
| 4.2 | `feature_categories_limit` | number | 6 | Max tiles (4/6/8) |
| 4.3 | `feature_categories_title` | string | "ফিচারড ক্যাটাগরি" | Section heading |

### 5. Product strips (the big toggleable group) — L5

7 strips, each with `_show` / `_limit` / `_title`:

| # | Strip | API | Show default | Limit default |
|---|---|---|---|---|
| 5.1 | `flash_sale` | `/flashsale` | true | 8 |
| 5.2 | `trending_products` | `/product/trending_product` | true | 8 |
| 5.3 | `bestsellers` (popular) | `/product/popular_product` | true | 8 |
| 5.4 | `new_arrivals` | `/product/new_arrival` (NEW endpoint) | true | 8 |
| 5.5 | `just_for_you` | `/product/just_for_you_product` | false | 8 |
| 5.6 | `ecommerce_choice` | `/product/ecommerce_choice_product` | false | 8 |
| 5.7 | `category_wise_strip` | `/product/popular_product?category=X` | false | 4 |

→ **21 fields total** (7 × `_show` + `_limit` + `_title`).

### 6. Offer / Bundle hero

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 6.1 | `offers_block_show` | bool | true | Active bundle/offer cards block |
| 6.2 | `offers_block_limit` | number | 3 | 1-6 offers |
| 6.3 | `offers_block_title` | string | "স্পেশাল অফার" | |
| 6.4 | `offers_block_layout` | enum: `grid\|carousel` | `grid` | 3-up grid OR scroll carousel |

### 7. Mid-page promo banner

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 7.1 | `promo_banner_show` | bool | false | Single CTA banner mid-page |
| 7.2 | `promo_banner_image` | upload | — | Banner image |
| 7.3 | `promo_banner_url` | string | — | Click destination |
| 7.4 | `promo_banner_text_overlay` | string | "" | Optional text on banner |

### 8. Content blocks — L6

#### 8a. Brand story snippet
| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 8.1 | `brand_story_show` | bool | true | On/off |
| 8.2 | `brand_story_title` | string | "আমাদের গল্প" | |
| 8.3 | `brand_story_text` | string (long) | "" | 2-3 sentence body |
| 8.4 | `brand_story_image` | upload | — | Right-side image |
| 8.5 | `brand_story_cta_label` | string | "আরও জানুন" | |
| 8.6 | `brand_story_cta_url` | string | "/about" | |

#### 8b. Reviews carousel
| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 8.7 | `reviews_carousel_show` | bool | true | On/off |
| 8.8 | `reviews_carousel_source` | enum: `auto_featured\|manual_pick` | `auto_featured` | Auto = recent 5-star with photo; manual = admin picks specific review IDs |
| 8.9 | `reviews_carousel_ids` (when manual) | json | `[]` | Array of review _ids |
| 8.10 | `reviews_carousel_limit` | number | 5 | |
| 8.11 | `reviews_carousel_title` | string | "কাস্টমারের ভালোবাসা" | |

#### 8c. Site-level FAQ
| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 8.12 | `site_faq_show` | bool | true | On/off |
| 8.13 | `site_faq_title` | string | "সাধারণ প্রশ্ন" | |
| **NEW MODULE:** `siteFaq` collection — admin CRUD (question + answer + order_no + status). Separate from per-product `faq_template`. |

#### 8d. Newsletter / WhatsApp opt-in
| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 8.14 | `newsletter_show` | bool | true | On/off |
| 8.15 | `newsletter_title` | string | "অফার পেতে সাইন আপ করুন" | |
| 8.16 | `newsletter_collect` | enum: `email\|phone\|both` | `both` | What to collect |
| **NEW MODULE:** `newsletterSubscriber` collection — `{contact, channel:"email"\|"sms", subscribed_at, source:"home"\|"footer"\|"checkout"}`. Admin export CSV. |

### 9. Footer — L7

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 9.1 | `footer_show_payment_strip` | bool | true | Payment method icons row |
| 9.2 | `footer_payment_methods` | json | `[]` | Admin upload icons OR pick from preset (bKash/Nagad/Visa/MC/SSL) |
| 9.3 | `footer_show_delivery_strip` | bool | true | Delivery partner icons row |
| 9.4 | `footer_delivery_partners` | json | `[]` | Same pattern (Pathao/Steadfast/RedX) |
| 9.5 | `footer_show_mini_newsletter` | bool | true | Duplicate of 8d in footer column |

### 10. Floating chat widgets — L2

| # | Field | Type | Default | Behaviour |
|---|---|---|---|---|
| 10.1 | `chat_whatsapp_show` | bool | (= C13 `enable_whatsapp_chat`) | Reuse Sprint 2 field |
| 10.2 | `chat_messenger_show` | bool | false | FB Messenger floating button |
| 10.3 | `chat_messenger_page_id` | string | "" | FB page ID for `m.me/<id>` link |
| 10.4 | `chat_livechat_show` | bool | false | 3rd-party embed |
| 10.5 | `chat_livechat_embed_code` | string (long) | "" | Paste Tawk.to / Crisp / Tidio `<script>` |
| 10.6 | `chat_widgets_position` | enum: `bottom-right\|bottom-left` | `bottom-right` | Stack position |

→ Multiple widgets stack vertically if all on. Owner can mix any combination.

---

## Summary count

| Section | Field count |
|---|---|
| Topbar | 4 |
| Navbar | 5 |
| Hero | 4 |
| Trust strip | 2 |
| Featured Categories | 3 |
| **Product strips** | **21** (7 × 3) |
| Offer block | 4 |
| Promo banner | 4 |
| Brand story | 6 |
| Reviews carousel | 5 |
| Site FAQ | 2 + new module |
| Newsletter | 3 + new module |
| Footer | 5 |
| Chat widgets | 6 |
| **home_section_array** (L1 revised) | **1 JSON field** with array of `{section_id, enabled, order}` for 14 reorderable sections |
| **TOTAL** | **~74 flat toggles + 1 section-order JSON + 2 new modules + 1 new endpoint** |

## Section ordering — `home_section_array` schema

Single JSON field on settings doc:

```json
{
  "home_section_array": [
    { "id": "trust_strip",         "enabled": true,  "order": 1 },
    { "id": "feature_categories",  "enabled": true,  "order": 2 },
    { "id": "flash_sale",          "enabled": true,  "order": 3 },
    { "id": "bestsellers",         "enabled": true,  "order": 4 },
    { "id": "offers_block",        "enabled": true,  "order": 5 },
    { "id": "new_arrivals",        "enabled": true,  "order": 6 },
    { "id": "brand_story",         "enabled": true,  "order": 7 },
    { "id": "reviews_carousel",    "enabled": true,  "order": 8 },
    { "id": "trending_products",   "enabled": true,  "order": 9 },
    { "id": "just_for_you",        "enabled": false, "order": 10 },
    { "id": "ecommerce_choice",    "enabled": false, "order": 11 },
    { "id": "category_wise_strip", "enabled": false, "order": 12 },
    { "id": "promo_banner",        "enabled": false, "order": 13 },
    { "id": "site_faq",            "enabled": true,  "order": 14 },
    { "id": "newsletter",          "enabled": true,  "order": 15 }
  ]
}
```

**Render logic (FE):**
1. Read `home_section_array`, filter `enabled: true`, sort by `order`.
2. For each enabled section, look up its content config in the flat toggles (e.g. `bestsellers_limit`, `bestsellers_title`).
3. Render in order using shared `<SectionRenderer />` switching by `section_id`.

**Admin UX:**
- New "Home Layout" tab → top section = drag-drop list of all 15 sections with toggle on/off
- Drag = update `order` field; Toggle = update `enabled` field
- Saving sends only the `home_section_array` JSON (not 74 flat fields)
- Below the drag list: collapsible config panel per section (title / limit / variant / etc — the flat toggles)

**Migration safety:**
- Schema default = the L9 DTC-research order with sensible enabled flags
- If section_array missing from existing settings doc → backfill on read (no migration script needed)
- If new section added in future code → append to end with `enabled: false` automatically

Plus 2 new BE modules (`siteFaq`, `newsletterSubscriber`) + 1 new endpoint (`/product/new_arrival`).

---

## Effort estimate (rough)

| Track | Hours |
|---|---|
| BE: settings schema add 74 fields + `home_section_array` JSON + 2 new modules + new endpoint | ~5-7h |
| Admin: new "Home Layout" tab — drag-drop section reorder list (react-beautiful-dnd or @dnd-kit) + collapsible per-section config panels (~14 sections) | ~8-10h |
| FE: rewrite `(frontend)/page.js` to dynamic-render from `home_section_array`, single `<SectionRenderer />` switching by section_id, hero variant switcher, chat stacker | ~12-15h |
| FE: 4 new components (brand story, reviews carousel, site FAQ, newsletter form) | ~4-5h |
| FE: hero variants (single + split — carousel exists) | ~3h |
| FE: category mega-menu component (when 3 levels deep) | ~3-4h |
| Testing + polish | ~3h |
| **TOTAL Sprint 3 H1 (Track D)** | **~38-47h** (was ~35-45h pre-reorder) |

This is **bigger than the original H1 estimate (10-14h)**. The toggle catalog turned H1 from "rewrite home" into "build owner-controllable home builder."

---

## Open questions (defer to Sprint 3 kickoff)

1. **Mega-menu nested rendering** — 3 levels deep (cat → sub → child). Admin already controls tree. Render decision: column-per-level (Daraz) or accordion (cleaner)?
2. ~~Section reorder~~ — RESOLVED via L1 revision + L8 + L9. Drag-drop + section-array storage. DTC-research default order.
3. **`category_wise_strip` (5.7)** — which category? Owner picks 1 category to feature on home, OR auto-picks the top-selling?
4. **Reviews carousel `manual_pick` (8.9)** — admin UI = checkbox in review list "Feature on home"? Or a separate "Featured Reviews" page?
5. **Newsletter dispatch** — collect now, send later (manual export to Mailchimp)? OR build send-flow this sprint? Defer recommended.
6. **Site FAQ vs per-product FAQ overlap** — owner may put same Q in both. Document, no enforcement.
7. **Drag-drop library** — `@dnd-kit/sortable` (modern, accessible, smaller) vs `react-beautiful-dnd` (battle-tested, larger). Recommend `@dnd-kit`.

---

## Sprint 3 split proposal

Given the size (~35-45h), Sprint 3 could split into:

- **Sprint 3a — Home Layout Foundation (~20h):** all toggles wired BE, Admin tab built, FE reads + conditional renders WITH variants disabled (single hero, simple dropdown, all existing strips). Brand story + Reviews + FAQ + Newsletter modules in.
- **Sprint 3b — Variants & Polish (~15-25h):** hero split variant, mega-menu component, hamburger drawer, payment/delivery footer strips, chat stacking, owner styling polish.

---

## Resume notes

Sprint 3 plan files:
- [CLIENT_SPRINT_3.md](CLIENT_SPRINT_3.md) — high-level H1 + future design items
- [SPRINT_3_HOME_LAYOUT_TOGGLES.md](SPRINT_3_HOME_LAYOUT_TOGGLES.md) — this file, full toggle catalog

**Sprint 2 must complete first.** This is the next sprint's plan, not active work.
