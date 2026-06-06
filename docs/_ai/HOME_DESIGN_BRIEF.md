# FruitSnacks Home Page — Design Brief

**For:** Paste into Claude design tool (or any AI UI generator) to produce the actual visual design.
**Aesthetic:** Earthy-premium organic — Khaas Food / Wildly Organic / Bokksu warmth meets Allbirds restraint.
**Locked decisions:** Single static hero / tall image-forward product cards / DTC-optimized section order.

---

## 1. Brand essence (one line)

> Premium dried fruits, nuts, and curated snack boxes — sourced honest, packed beautiful, delivered fresh across Bangladesh.

Tone: warm, confident, quietly artisanal. Not loud. Not "ecommerce-templated." Imagine a Tokyo specialty grocer or a Brooklyn pantry brand — but in Bangla cadence.

---

## 2. Color palette (semantic tokens)

```
PRIMARY              #2D5F3F   Deep Forest Green   — main CTAs, links, key headings
PRIMARY-DARK         #1F4530   Bottle Green        — hover states, footer background
PRIMARY-LIGHT        #4A7C5A   Sage                — secondary buttons, icon strokes

SECONDARY            #C97B3D   Burnt Honey         — accent buttons, badges, mid-page CTAs
SECONDARY-LIGHT      #E5A05F   Amber Glow          — hover on secondary, highlight chips

ACCENT               #B8553A   Rust Terracotta     — sale badges, urgency markers
ACCENT-SOFT          #E89B7E   Peach Wash          — tag backgrounds, soft pills

BG-CREAM             #FAF6EE   Warm Off-White      — page background (NOT pure white)
BG-PARCHMENT         #F2EBDB   Aged Paper          — alternating section background
BG-DEEP              #1A2820   Forest Night        — footer + dark hero overlay

TEXT-INK             #1F1A14   Ink Brown           — body text (warmer than #000)
TEXT-MUTED           #6B5F4F   Bark                — secondary text, meta, captions
TEXT-WHISPER         #A89E8B   Driftwood           — placeholder, dividers

SUCCESS              #4A7C5A   Sage (= primary-light)
WARNING              #C97B3D   Burnt Honey (= secondary)
DANGER               #B8553A   Rust (= accent)

OVERLAY              rgba(31, 26, 20, 0.55)        — image overlays, modals
BORDER-SOFT          #E5DCC8                       — card borders, dividers
SHADOW-WARM          0 4px 24px rgba(31, 26, 20, 0.08)
```

**Rule:** Page bg is ALWAYS `BG-CREAM`, never pure white. Sections alternate with `BG-PARCHMENT` for rhythm. Pure white reserved for product card interiors only.

---

## 3. Typography pairing

```
DISPLAY FONT  (headings, hero, section titles)
  Family: "Fraunces" — variable serif with optical sizing
  Fallback: "Cormorant Garamond", Georgia, serif
  Weights used: 400 (light italic for accents), 500 (subheads), 600 (h1/hero)
  Optical: prefer ranges 9-144, axis "SOFT" 50, "WONK" 1

BODY FONT  (paragraphs, UI labels, buttons)
  Family: "Inter Tight" — geometric humanist sans
  Fallback: "DM Sans", -apple-system, sans-serif
  Weights: 400 (body), 500 (labels), 600 (buttons)

BANGLA FONT  (Bangla text throughout — required for BD market)
  Family: "Hind Siliguri" or "Noto Serif Bengali" for display
  Fallback: "Tiro Bangla", sans-serif
  Body Bangla: "Hind Siliguri" 400/500
  Headings Bangla: "Noto Serif Bengali" 500/600

MONO  (price ticker decoration, microcopy accents)
  Family: "JetBrains Mono" weight 400 only
  Sparing use — for small editorial price tags + product codes
```

**Type scale (mobile → desktop):**
```
HERO            48px → 88px      Fraunces 600, line-height 0.95, letter-spacing -2%
H1 SECTION      32px → 56px      Fraunces 600, line-height 1.05, letter-spacing -1.5%
H2 SUBHEAD      22px → 32px      Fraunces 500 italic (yes, italic), line-height 1.2
EYEBROW LABEL   11px → 13px      Inter Tight 500 UPPERCASE, letter-spacing 12%
BODY            15px → 17px      Inter Tight 400, line-height 1.65
SMALL           13px → 14px      Inter Tight 400, line-height 1.5
PRICE           20px → 24px      Inter Tight 600, tabular-nums
PRICE-WAS       14px → 16px      Inter Tight 400 strikethrough TEXT-MUTED
```

**Rule:** Eyebrow labels (uppercase + wide tracking) before EVERY section title. Adds editorial rhythm. Example: `OUR FAVORITES` above `Bestsellers This Week`.

---

## 4. Spacing & layout system

```
GRID         12-column on desktop (max-width 1280px, gutter 24px)
             8-column on tablet
             4-column on mobile

SPACING SCALE (use these only — no random values)
  4   8   12   16   24   32   48   64   96   128   160

SECTION RHYTHM
  Mobile: py-16 between sections
  Tablet: py-20
  Desktop: py-32

CONTAINER PADDING
  Mobile: px-5
  Tablet: px-8
  Desktop: px-12

ROUNDED CORNERS
  Buttons: rounded-full (pill style) OR rounded-md 6px
  Cards: rounded-2xl 16px
  Inputs: rounded-lg 10px
  Image masks: rounded-3xl 24px on hero, rounded-2xl on product images

NEVER use sharp 0px corners (cold/templated) except for editorial dividers.
NEVER use 4px+ borders (too aggressive). Use 1px BORDER-SOFT for divisions.
```

---

## 5. Top bar (slim utility strip)

**Height:** 36px, background `PRIMARY-DARK`, text white 13px Inter Tight 400, letter-spacing 5%.

**Content (3 zones):**
- LEFT: rotating Bangla announcement, fade-in/out every 5s
  Examples: "৫০০৳ অর্ডারে ফ্রি ডেলিভারি ঢাকার ভেতর" / "নতুন কালেকশন: শীতকালীন ড্রাই ফ্রুট বক্স" / "আজই অর্ডার করুন, কাল পৌঁছে যাবে"
- CENTER (desktop only): "📍 ঢাকা সহ সারা দেশে ডেলিভারি"
- RIGHT: "📞 +880 1XXX-XXXXXX" linked, then divider "|", then "অর্ডার ট্র্যাক করুন" link with arrow

**Mobile:** Only the rotating announcement, center-aligned, 32px tall.

---

## 6. Navbar (sticky on scroll)

**Layout:** 80px tall desktop, 64px tall mobile, BG-CREAM, bottom border 1px BORDER-SOFT. Sticky position with subtle shadow appearing on scroll (`SHADOW-WARM`).

**3-zone layout:**

**LEFT ZONE (~25%):**
- Logo: FruitSnacks wordmark in Fraunces 600, 24px desktop / 20px mobile, color PRIMARY. Small leaf icon (single line, hand-drawn feel) before the name. Total width ~180px desktop.

**CENTER ZONE (~50%):**
- Search bar: pill-shaped, BG-PARCHMENT background, 44px tall, full center width up to 480px max.
- Placeholder text rotating every 4s: "খেজুর খুঁজুন..." / "মিক্সড নাটস..." / "গিফট প্যাক..."
- Search icon left (PRIMARY-LIGHT stroke 1.5px), microphone icon right (TEXT-MUTED, mobile only)
- On focus → expands to 560px, dropdown opens (see search dropdown spec section 13)

**RIGHT ZONE (~25%):**
- 3 nav links (Inter Tight 500, 14px, TEXT-INK): "শপ" / "অফার" / "আমাদের গল্প"
  → Underline on hover with PRIMARY 1.5px, animated left-to-right
- Vertical divider (BORDER-SOFT, 24px tall)
- Icon row (28px touch targets, gap 20px):
  - User icon (account dropdown — Profile / Orders / Wishlist / Loyalty / Logout)
  - Heart icon (wishlist) — small badge top-right with count (PRIMARY background, white text, 10px tabular-nums)
  - Bag icon (cart) — same badge style, count
- Mobile: collapses to hamburger drawer right of logo, cart icon stays visible right edge

**Mega-menu trigger:** Hovering "শপ" opens mega-menu below navbar — 3 columns: top categories (with thumb 40x40), featured 2x2 product grid, promo image card right with CTA "সব দেখুন →" linking to /shop.

---

## 7. Hero section — single static (NO carousel)

**Layout:** Full-width section, height 88vh on desktop (min 640px, max 820px), 72vh mobile. BG-CREAM background.

**Asymmetric split:** 55% LEFT text column / 45% RIGHT image column. Mobile = stacked (image bottom).

**LEFT column content (vertical stack, justify-center, max-width 560px, padding 80px left desktop):**

```
[EYEBROW]    SINCE 2024 · CRAFTED IN BANGLADESH
             (uppercase Inter Tight 500, letter-spacing 18%, PRIMARY-LIGHT, 13px)

[HEADLINE]   প্রতিদিনের জন্য
             একটু ভালো কিছু।
             (Fraunces 600, 72px desktop / 44px mobile, TEXT-INK, line-height 0.98)
             Note: line 2 has the word "ভালো" wrapped in soft underline using SECONDARY color
             — hand-drawn squiggle SVG, slightly offset below baseline

[SUBCOPY]    হাতে বাছাই করা খেজুর, বাদাম আর শুকনো ফল —
             কোনো প্রিজার্ভেটিভ নেই, কোনো লুকানো গল্প নেই।
             (Inter Tight 400, 18px desktop, TEXT-MUTED, line-height 1.6, max-width 440px)

[CTA ROW]    [Primary button: শপ এখনই →]    [Ghost link: আমাদের গল্প পড়ুন]
             Primary: BG-PRIMARY, white text, pill rounded-full, py-4 px-8, 16px Inter Tight 600,
             arrow icon shifts right 4px on hover, button lifts 2px with SHADOW-WARM
             Ghost: TEXT-INK, underline offset 6px, hover changes underline to PRIMARY

[TRUST ROW]  4 mini-icons row below CTAs (gap 32px, top margin 56px):
             ✓ ফ্রি ডেলিভারি ৫০০৳+   ✓ ১০০% খাঁটি   ✓ ৭ দিনে রিটার্ন   ✓ ক্যাশ অন ডেলিভারি
             Icons hand-drawn line style, 18px, PRIMARY-LIGHT stroke
             Text: Inter Tight 400, 13px, TEXT-MUTED
```

**RIGHT column content:**

- Single large hero image, 4:5 portrait aspect, rounded-3xl, slight rotation -2deg (gives editorial feel)
- Subject: top-down flat-lay of a wooden bowl with dates + cashews + dried apricots, scattered loose nuts around, on a linen cloth, warm natural light
- Floating chips overlapping the image:
  - Top-left chip: small circular badge with "নতুন" + leaf icon, BG-PARCHMENT, PRIMARY text, 14px Fraunces 500 italic, rotated -8deg, drop-shadow
  - Bottom-right chip: rectangular tag with "৳ ৩৫০ থেকে শুরু", BG-SECONDARY, white text, Fraunces 500, pinned at bottom-right with safety-pin SVG icon
- Behind the image: large organic blob shape, BG-PARCHMENT, blur 0, offset top-right 40px / right -60px — adds depth without busy texture

**Background detail:** Very subtle noise/grain texture overlay on entire hero (3% opacity, SVG noise), gives "premium paper" feel — NOT a clean gradient.

---

## 8. Trust strip (under hero)

**Background:** BG-PARCHMENT (alternates from cream hero).
**Height:** py-12 desktop, py-8 mobile.
**Layout:** 4-column equal split desktop, 2x2 grid mobile.

Each cell:
```
[Icon 36px PRIMARY-LIGHT stroke 1.5px hand-drawn style]
[Label Bangla: Inter Tight 500 / Hind Siliguri 500, 15px, TEXT-INK]
[Sublabel: Inter Tight 400, 13px, TEXT-MUTED]

Examples:
🌿 ১০০% প্রাকৃতিক          কোনো কেমিক্যাল নয়
🚚 দ্রুত ডেলিভারি            ২৪ ঘণ্টায় ঢাকায়
↩️ সহজ রিটার্ন              ৭ দিনের গ্যারান্টি
💳 ক্যাশ অন ডেলিভারি       বিশ্বস্ত পেমেন্ট
```

Cells separated by 1px vertical dividers BORDER-SOFT (desktop only).

---

## 9. Featured Categories (section 1 in body)

**Section header:**
```
EYEBROW:    EXPLORE
TITLE:      আমাদের ক্যাটাগরি
SUBCOPY:    ছোট কালেকশন — বড় যত্নে বাছাই করা।
            (italic Fraunces 500 32px, max-width 500px center-aligned)
```

**Layout:** 6-tile grid desktop (3 cols x 2 rows), 4-tile mobile (2 cols x 2 rows). Gap 24px.

**Each tile:**
- Square aspect 1:1, BG-PARCHMENT, rounded-2xl, padding 24px
- Top: circular product image 80% width, centered (e.g. pile of cashews on transparent bg)
- Bottom: category name Fraunces 500 italic 20px TEXT-INK, item count Inter Tight 400 13px TEXT-MUTED ("১২টি পণ্য")
- Hover: tile lifts 4px, image scales 1.05, background darkens slightly to a custom cream-warm tone
- Click → /category/{slug}

Sample categories: খেজুর / বাদাম / শুকনো ফল / মিক্স প্যাক / গিফট বক্স / বীজ ও দানা

---

## 10. Flash Sale strip (when active)

**Background:** Section flush BG-CREAM but with strong urgency frame.
**Top accent bar:** 4px tall ACCENT (rust terracotta) gradient → SECONDARY (honey).

**Header row (flex justify-between):**
```
LEFT:
  EYEBROW: LIMITED TIME
  TITLE: ফ্ল্যাশ সেল [tomato emoji or hot fire icon]

RIGHT:
  Countdown timer: 4 boxes Fraunces 600 tabular-nums each (HH/MM/SS/CS or HH/MM/SS)
  Each box 56x56px, BG-PRIMARY-DARK, white digit 28px, label below "ঘণ্টা/মিনিট/সেকেন্ড"
  Tiny separators ":" between in TEXT-MUTED
```

**Product grid:** 4-up horizontal scroll on mobile, 4-col grid desktop. Use product card spec (section 14) with SALE badge variant.

**"View More" link:** Right-aligned below grid, "সব ফ্ল্যাশ সেল দেখুন →" linking to /shop?on_sale=1, underline on hover.

---

## 11. Bestsellers / Trending / New Arrivals strips

(Same component shape, different content + heading)

**Section structure (repeats 3+ times with different titles):**

```
HEADER (centered):
  EYEBROW: OUR FAVORITES   /   TRENDING NOW   /   FRESH IN
  TITLE: বেস্টসেলার / এখন ট্রেন্ডিং / নতুন এসেছে
  SUBCOPY: One-liner italic Fraunces 500 — different per strip
    Bestsellers: "যা সবচেয়ে বেশি ভালোবাসা পেয়েছে।"
    Trending: "এই সপ্তাহে সবাই যা চাচ্ছে।"
    New: "সদ্য তাকে এসেছে।"

GRID:
  Desktop: 4 cards per row, gap 24px
  Tablet: 3 cards, gap 20px
  Mobile: horizontal scroll, 1.5 cards visible, snap scroll, gap 16px

FOOTER:
  Centered "সব দেখুন →" link, 16px Inter Tight 500, PRIMARY color, underline-offset 8px
  Subtle horizontal divider line BORDER-SOFT below (60% width centered)
```

Alternate section backgrounds: BG-CREAM → BG-PARCHMENT → BG-CREAM → BG-PARCHMENT for rhythm.

---

## 12. Product Card — TALL IMAGE-FORWARD spec

**This is the critical component. Used in every product strip.**

**Card dimensions:**
- Width: 280px desktop, 240px tablet, 180px mobile
- Aspect: image 4:5 portrait (so card total ~280x500 desktop)
- Background: pure white (the only place pure white appears)
- Border: 1px BORDER-SOFT
- Rounded: 2xl (16px)
- Hover: lifts 6px with SHADOW-WARM, border darkens to PRIMARY-LIGHT 40% opacity

**Internal structure (top to bottom):**

```
1. IMAGE SECTION (60% of card height, ~300px)
   - aspect 4:5
   - rounded top corners only (matching card)
   - object-fit: cover
   - background fallback BG-PARCHMENT
   - OVERLAY ELEMENTS:
     * Top-LEFT corner: badges stack (vertical, gap 6px, padding 12px from edges)
       - SALE badge: BG-ACCENT (rust), white text, "৩০% ছাড়" Inter Tight 600 11px, rounded-md px-2 py-1
       - NEW badge: BG-SECONDARY (honey), white text, "নতুন" same style
       - BESTSELLER: BG-PRIMARY, white text, "বেস্টসেলার", limited to ONE per strip max
     * Top-RIGHT corner: wishlist heart icon button
       - 32px circular, BG-CREAM with 60% opacity blur backdrop, heart stroke 1.5px PRIMARY-LIGHT
       - On click: fills PRIMARY color, micro pop animation
     * Bottom-LEFT corner: stock urgency (only if < 10)
       - text "মাত্র ৪টি বাকি", Inter Tight 500 11px, ACCENT color
       - Auto-hide if stock ≥ 10
   - HOVER REVEAL: bottom 1/3 of image area slides up with "Quick Add" button
     - Button: BG-PRIMARY-DARK, white text, full-width, 44px tall, "+ কার্টে যোগ করুন"
     - Slide animation 200ms ease-out, only on desktop hover

2. CONTENT SECTION (40% of card, padding 16px)

   a) CATEGORY TAG (eyebrow)
      - Inter Tight 500, 11px UPPERCASE, letter-spacing 10%, TEXT-MUTED
      - e.g. "DRIED FRUITS" or "MIXED NUTS"

   b) PRODUCT NAME
      - Fraunces 500, 17px desktop / 15px mobile, TEXT-INK
      - Line-height 1.25, max 2 lines with line-clamp-2
      - e.g. "প্রিমিয়াম ইরানি খেজুর — ৫০০ গ্রাম"

   c) RATING ROW (flex gap 6px, margin-top 6px)
      - 5 small filled circles (4px) showing rating in PRIMARY, empty in BORDER-SOFT
      - Text "৪.৮ (২৩৪)" Inter Tight 400 12px TEXT-MUTED
      - If 0 reviews: skip this row entirely (don't show "no reviews")

   d) PRICE ROW (margin-top 12px, flex align-baseline gap 8px)
      - Current price: Inter Tight 600 22px TEXT-INK tabular-nums
        e.g. "৳ ৩৫০"
      - Was-price (strikethrough): Inter Tight 400 14px TEXT-WHISPER tabular-nums
        e.g. "৳ ৫০০"
      - Discount chip (right-aligned, ml-auto): "৩০%↓" Inter Tight 600 11px, ACCENT bg with white text, rounded-md px-1.5

   e) VARIATION HINT (only if is_variation: true)
      - Below price, Inter Tight 400 12px TEXT-MUTED
      - e.g. "৩টি সাইজ" or "৫০০গ / ১কেজি / ২কেজি"

3. NO BOTTOM CTA in default state (revealed on hover via image overlay)
```

**Required data fields per card:**

```
_id                       (link)
product_name              (Bangla, can mix English)
product_slug              (URL)
main_image                (4:5 ratio preferred, fallback BG-PARCHMENT)
category.name             (eyebrow tag)
category.slug
product_price             (number, BDT)
product_discount_price    (number or null)
currency_symbol           (default "৳")
is_variation              (bool)
variation_count           (number, only used if is_variation)
rating.average            (0-5 float, optional)
rating.count              (integer, optional)
stock.in_stock            (bool)
stock.low_stock           (bool — true when 1-9 units)
stock.qty_visible         (number when low_stock, else hidden)
badges                    (array: ["NEW","SALE","BESTSELLER"])
campaign.discount_pct     (computed for chip, optional)
on_sale                   (bool, derived from discount_price < price)
```

---

## 13. Search dropdown (4-tier, opens on input focus)

**Container:** Floating panel below search bar, 560px wide, BG-CREAM, rounded-2xl, SHADOW-WARM elevated, border 1px BORDER-SOFT, padding 0, internal sections divided by BORDER-SOFT 1px.

**EMPTY STATE (no typing):**

```
TIER 1: 🕐 সাম্প্রতিক খোঁজ  (only if localStorage has entries)
  Padding 20px
  Eyebrow label TEXT-MUTED 11px uppercase
  Pill chips horizontal flex-wrap gap 8px:
    [খেজুর] [মিক্সড বাদাম] [গিফট প্যাক] [×]
    Pills: BG-PARCHMENT, TEXT-INK 13px, rounded-full px-3 py-1.5
    Hover: BG turns PRIMARY-LIGHT 20%, text PRIMARY
    The × at end: subtle clear-all button

DIVIDER

TIER 2: 🔥 জনপ্রিয় খোঁজ
  Same pill style, content from admin-curated popularKeyword
  Examples: [অফিস স্ন্যাক] [আজ ডেলিভারি] [৫০০৳ নিচে] [কিডস টিফিন]

DIVIDER

TIER 3: 🎁 আপনার জন্য বাছাই
  Eyebrow label
  Horizontal scroll row of 4 mini product cards (140x180 each, simpler version)
  Each shows image + name (1 line) + price
  Mini card variant of section 12
```

**TYPING STATE (debounce 250ms):**

```
TIER A: SEARCH RESULTS
  Header row: "৮টি পণ্য পাওয়া গেছে \"মিক্স\" এর জন্য"
              (Inter Tight 400 13px, "মিক্স" wrapped in PRIMARY color + bold)
  6 product result rows (max), each row:
    [Image 48x48 rounded-md] [Name + Price in stacked col] [Right arrow icon]
    Hover: full row background BG-PARCHMENT, slight scale 0.99
    Keyboard arrows highlight one at a time

DIVIDER

TIER B: 📁 ক্যাটাগরিতে
  2-3 category match rows:
    [Folder icon] [Category name (count)]  e.g.  "মিক্সড নাটস (১২)"
    Same hover pattern

DIVIDER

TIER C: → "মিক্স" এর সব ফলাফল দেখুন (২৩)
  Primary action button-style row, BG-PRIMARY-LIGHT 10% bg on hover, PRIMARY color text + bold
  Links to /shop?q=মিক্স
```

**NO MATCH STATE:**

```
Empty illustration (simple line drawing of a magnifying glass + leaf) 100x100 center
Text: "\"xyz\" পাওয়া যায়নি"   Fraunces 500 18px
Subtext: "চেষ্টা করুন:" + suggestion pills (popular keywords)
Below: "🎁 আপনার পছন্দ হতে পারে" with bestseller fallback row
```

**Keyboard:** Arrow up/down navigates rows, Enter selects, Esc closes, full mobile-fullscreen variant on small screens.

---

## 14. Bundle offers / Active deals (mid-page hero block)

**Background:** Full-width section, BG-DEEP (forest night), text light. Section py-32.

**Header centered, light text:**
```
EYEBROW: BUNDLE & SAVE   (SECONDARY-LIGHT amber, 13px)
TITLE: কম্বো অফার          (Fraunces 600 56px, BG-CREAM color)
SUBCOPY: একসাথে নিন, বেশি বাঁচান। (italic 22px, TEXT-WHISPER)
```

**Layout:** 3 large offer cards side-by-side desktop (1-col stack mobile), gap 24px, max-width 1200px center.

**Each card:**
- Aspect 4:5
- Background image: top-down photo of the bundle contents on linen cloth
- OVERLAY: dark gradient bottom-to-top (transparent at top, OVERLAY at bottom)
- Bottom-left padding 32px content:
  - Badge top: "৩-পণ্য বান্ডল" Fraunces 500 italic 14px SECONDARY-LIGHT
  - Title: bundle name Fraunces 600 28px BG-CREAM, line-height 1.1
  - Old/New price row: "৳ ১৫০০  ৳ ১২০০" same pattern as product card, light colors
  - "Save ৳ ৩০০" chip, BG-ACCENT, white, rounded-full px-3 py-1
  - CTA arrow: bottom-right circular button 48px, BG-SECONDARY, "→" icon, hover scales 1.1

Hover: image zooms 1.05, overlay darkens slightly.

---

## 15. Brand story snippet

**Background:** BG-PARCHMENT.
**Layout:** Asymmetric 2-col split. 40% image LEFT, 60% text RIGHT (reverse on mobile = image top).
**Section padding:** py-32.

**LEFT image:**
- Portrait 4:5 photograph of owner/founder hand sorting nuts on a wooden table (or whatever owner provides)
- Rounded-3xl, slight rotation +2deg
- Behind it: organic blob shape SECONDARY-LIGHT bg, blur 20px, offset bottom-left
- Optional: small handwritten signature SVG overlapping bottom-right of image

**RIGHT text (max-width 520px):**
```
EYEBROW:    OUR STORY   (PRIMARY-LIGHT 13px)
TITLE:      একটা ছোট দোকান।
            অনেক বড় যত্ন।
            (Fraunces 600 56px desktop, line-height 1.0)

BODY:       ২০২৪ সালে আমরা শুরু করেছিলাম একটাই বিশ্বাস নিয়ে —
            আপনার পরিবারের জন্য যা কিনছেন, সেটা যেন আমরা নিজেরাও খাই।
            প্রতিটা খেজুর, প্রতিটা বাদাম — হাতে বাছাই, ছবি দেখে নয়।

            (Inter Tight 400, 17px, TEXT-INK, line-height 1.7, two paragraphs)

CTA:        আমাদের সম্পর্কে আরও জানুন →
            (link style, PRIMARY, underline-offset 8px, 16px Inter Tight 500)
```

Decorative element: small leaf SVG drawn in PRIMARY-LIGHT, scattered 2-3 places around the text block as period markers.

---

## 16. Reviews carousel

**Background:** BG-CREAM.
**Layout:** Horizontal scroll-snap carousel, 3 cards visible desktop, 1.2 cards mobile.

**Header centered:**
```
EYEBROW: LOVED BY
TITLE: কাস্টমারদের ভালোবাসা
SUBCOPY: (italic 22px) "নিজেদের কথায় তারা যা বলেছেন।"
```

**Each review card:**
- Width 360px desktop, 280px mobile
- BG-PARCHMENT, rounded-2xl, padding 32px
- Top: 5 star row (filled SECONDARY honey, empty BORDER-SOFT)
- Middle: review text Fraunces 500 italic 20px line-height 1.4 TEXT-INK
  - Opening quote mark "❝" 60px PRIMARY-LIGHT positioned absolute top-left offset, decorative
  - Max 4 lines line-clamp
- Bottom row (margin-top 24px, flex align-center gap 12px):
  - Avatar 48px circle (initials fallback if no photo)
  - Stacked text: Name Inter Tight 600 15px TEXT-INK / Location + verified badge Inter Tight 400 12px TEXT-MUTED
- Optional: photo strip below review (up to 3 thumbnail 60x60 rounded-md if user uploaded photos)

Carousel dots below: 5 small dots PRIMARY active, BORDER-SOFT inactive, centered.

---

## 17. Site-level FAQ accordion

**Background:** BG-PARCHMENT.
**Layout:** 2-col split desktop — LEFT 40% title block, RIGHT 60% accordion. Single col mobile.

**LEFT:**
```
EYEBROW: HELP & SUPPORT
TITLE: প্রায়শই জিজ্ঞাসিত প্রশ্ন
       (Fraunces 600 48px line-height 1.05)
SUBCOPY: কিছু খুঁজে পাচ্ছেন না? italic
         [WhatsApp এ মেসেজ করুন →] button (PRIMARY pill button)
```

**RIGHT:**
- 6 accordion items max on home (rest on /faq page)
- Each item: full width, py-6 padding, border-bottom BORDER-SOFT 1px
- Question row: Inter Tight 500 17px TEXT-INK, "+" icon right (PRIMARY) rotates to "×" when open, smooth 200ms
- Open state: question turns PRIMARY color, answer slides down with fade
- Answer text: Inter Tight 400 16px TEXT-MUTED line-height 1.65, padding-top 12px

Sample Qs (Bangla):
- ডেলিভারি কত দিনে পাবো?
- পেমেন্ট অপশন কী কী?
- প্রোডাক্ট পছন্দ না হলে রিটার্ন করা যাবে?
- কীভাবে অর্ডার ট্র্যাক করবো?
- COD এ কি অর্ডার করা যায়?
- প্রোডাক্ট কতদিন ভালো থাকবে?

---

## 18. Newsletter / WhatsApp opt-in

**Background:** Full-width section, BG-DEEP (forest night).
**Layout:** Centered single-column, max-width 640px, py-32.

**Content:**
```
EYEBROW: STAY IN TOUCH    (SECONDARY-LIGHT amber)
TITLE:   শুধু সেরা অফার, কোনো স্প্যাম নয়।
         (Fraunces 600 48px desktop, BG-CREAM color, center-aligned, line-height 1.05)

SUBCOPY: WhatsApp বা ইমেইলে — যেটা আপনার সুবিধা।
         নতুন পণ্য আর শুধুমাত্র সাবস্ক্রাইবারদের জন্য ছাড়।
         (Inter Tight 400 17px TEXT-WHISPER center-aligned max-width 480px)

TAB ROW:  Two pill tabs centered: [WhatsApp] [Email]
          Active tab BG-SECONDARY honey, white text, Fraunces 500 14px
          Inactive transparent, BG-CREAM 60% text

INPUT ROW: flex gap 8px max-width 480px center
  Single text input (placeholder shifts based on tab):
    "+8801XXXXXXXXX" / "you@example.com"
    44px tall, BG-CREAM bg, TEXT-INK text, rounded-full px-6
  Submit button: BG-PRIMARY-LIGHT, white, rounded-full px-8, "সাবস্ক্রাইব"

FINE PRINT: "আমরা আপনার ডেটা নিরাপদে রাখি। যেকোনো সময় আনসাবস্ক্রাইব করতে পারবেন।"
            Inter Tight 400 12px TEXT-WHISPER center

Decorative: floating leaf SVGs PRIMARY-LIGHT scattered behind the title at 8% opacity, 3 leaves
```

---

## 19. Footer

**Background:** BG-DEEP (forest night), text BG-CREAM / TEXT-WHISPER.
**Layout:** Multi-column structured, py-24 top section, py-8 bottom bar.

**TOP SECTION — 5 columns desktop, 2-col mobile collapse:**

```
COL 1 (wider, span 2 of 12): BRAND
  Logo + leaf icon (white version)
  Tagline 2 lines: "বাংলাদেশের প্রতিটা কোণায়, খাঁটি আর সতেজ স্ন্যাকস।"
  Social icons row: FB / IG / WhatsApp / YouTube / TikTok
    36px circular, BG-CREAM 10% bg, white icons, hover BG-SECONDARY honey
  Contact block:
    📞 +880 1XXX-XXXXXX
    📧 hello@fruitsnacksbd.com
    📍 [Address line]

COL 2: শপ
  - সকল পণ্য
  - বেস্টসেলার
  - নতুন এসেছে
  - বান্ডল অফার
  - গিফট প্যাক

COL 3: সহায়তা
  - অর্ডার ট্র্যাক
  - রিটার্ন পলিসি
  - শিপিং ইনফো
  - FAQ
  - যোগাযোগ

COL 4: কোম্পানি
  - আমাদের গল্প
  - কোয়ালিটি প্রমিস
  - ব্লগ (future)
  - ক্যারিয়ার
  - প্রাইভেসি পলিসি

All link styles: Inter Tight 400 14px TEXT-WHISPER, hover → BG-CREAM color
Column titles: Inter Tight 500 13px UPPERCASE letter-spacing 12% SECONDARY-LIGHT
```

**MID-FOOTER STRIPS (between cols and bottom bar):**

```
PAYMENT STRIP:
  Light heading: "পেমেন্ট"  Inter Tight 500 13px TEXT-WHISPER
  Row of icons (each 48x32 rounded-sm BG-CREAM 8% bg, padding 8px):
    bKash · Nagad · Rocket · Visa · Mastercard · SSL Secure badge

DIVIDER 1px BG-CREAM 8%

DELIVERY PARTNERS STRIP:
  Heading: "ডেলিভারি পার্টনার"
  Row of logos: Pathao · Steadfast · RedX (same style boxes)
```

**BOTTOM BAR:**
- Full width, separator border-top 1px BG-CREAM 8%
- LEFT: "© ২০২৫ FruitSnacks Bangladesh — সকল অধিকার সংরক্ষিত।" 12px TEXT-WHISPER
- RIGHT: Mini links: Terms · Privacy · Cookies (12px, dot separators)

---

## 20. Floating chat widgets (right-bottom stack)

**Position:** Fixed bottom-right corner, padding 24px from edges, z-50.
**Stack:** Vertical column, gap 12px between buttons, max 3 widgets.

**Each button:**
- 56px circle (60px on hover)
- SHADOW-WARM with PRIMARY tint
- Brand-color background per platform:
  - WhatsApp: #25D366
  - Messenger: #0084FF
  - Live chat (Tawk/Crisp): SECONDARY honey
- White icon center, 24px
- Hover: scales 1.1, optional tooltip slides in from left ("চ্যাট করুন")
- Tap on mobile: gentle bounce animation 200ms

Order top-to-bottom (if all enabled): Live chat → Messenger → WhatsApp (WhatsApp closest to thumb = primary action).

---

## 21. Micro-interactions & details (don't skip)

**Animations:**
- Page load: hero text fade-up + slide-from-bottom 24px, staggered 80ms between elements (eyebrow → title → subcopy → CTAs → trust row → image)
- Section enter: each section fades in + translateY 16px when 30% in viewport (IntersectionObserver based)
- Product card hover: 200ms ease-out transform, NEVER use generic 300ms ease defaults
- Image load: blur-up effect (LQIP) instead of jarring pop
- Cart icon: subtle pulse + count badge bounce when item added
- Search dropdown: 180ms fade + scale-95 to scale-100 origin top
- Buttons: arrow icon translateX +4px on hover, NOT scale (too cliche)

**Cursor:**
- Custom cursor on hero image area only: small leaf icon following cursor with 200ms lerp delay
- On clickable elements: default browser cursor (don't override globally — accessibility)

**Texture / depth:**
- Subtle SVG grain noise overlay on whole page at 2-3% opacity (NOT visible until you look close — adds "premium paper" feel)
- Drop shadows: always warm-tinted (rgba(31, 26, 20, X)) — NEVER cold gray shadows
- Use 1-2 soft blur blobs in BG-PARCHMENT or SECONDARY-LIGHT colors as background depth (behind hero image, behind brand story image)

**Bangla typography care:**
- Bangla line-height needs +0.15 vs English (1.65 → 1.8 for body)
- Avoid italic for Bangla body (looks broken in many fonts)
- Bangla numerals optional ("৩৫০" vs "350") — use English numerals for prices for tabular alignment consistency, Bangla numerals for inline counts in text

**Loading states:**
- Skeleton cards use BG-PARCHMENT with shimmer gradient (NOT generic gray)
- Shimmer animation: warm cream gradient sweep left-to-right 1.5s ease-in-out infinite

**Empty states:**
- Hand-drawn line illustrations for empty cart / empty wishlist / no search results
- Style: single-line PRIMARY-LIGHT stroke 1.5px, organic curves, NEVER generic stock illustration

---

## 22. Responsive breakpoints

```
sm:   640px   (mobile landscape, small tablets)
md:   768px   (tablets portrait)
lg:   1024px  (tablets landscape, small laptops)
xl:   1280px  (desktops)
2xl:  1536px  (large desktops)
```

Mobile-first approach. Default styles = mobile, scale up via min-width queries. Avoid max-width queries.

**Mobile-specific must-haves:**
- Bottom navigation bar (sticky bottom) on storefront mobile: Home / Shop / Wishlist / Account / Cart (5 icons)
- Hero image goes below text on mobile, not above
- Product strips horizontal-scroll with snap on mobile (1.5 cards visible)
- Search becomes full-screen overlay on mobile when focused
- Footer columns collapse to 2-col, then accordion below md

---

## 23. Accessibility

- Color contrast: All text passes WCAG AA. PRIMARY (#2D5F3F) on BG-CREAM (#FAF6EE) = 7.2:1 ✓
- Focus states: 2px PRIMARY outline with 4px offset, NEVER `outline: none` without replacement
- All interactive elements: 44x44px minimum touch target
- Heart icon (wishlist): aria-pressed state, aria-label "Add to wishlist" / "Remove from wishlist"
- Bangla content: lang="bn" on Bangla text blocks for screen reader pronunciation
- Skip-to-content link for keyboard users at top
- Reduced motion: respect prefers-reduced-motion, disable all animations

---

## 24. One-line summary per section (for AI prompt clarity)

If pasting this brief into an AI design tool with character limits, here's the compressed version:

```
Premium organic snacks DTC ecommerce home page.
Earthy palette: deep forest green primary, burnt honey secondary, rust accent, cream backgrounds.
Fraunces serif for headlines (often italic), Inter Tight for body, Hind Siliguri for Bangla.
Top bar: rotating Bangla announcement.
Navbar: leaf-icon logo, pill-shaped search, 3 nav links, user/wishlist/cart icons.
Hero: single static, 55/45 split text+image, headline "প্রতিদিনের জন্য একটু ভালো কিছু" with hand-drawn underline on key word, organic blob background, floating chips on image.
Trust strip: 4 hand-drawn icons + bilingual labels.
Featured categories: 6-tile grid with circular product images on cream squares.
Flash sale: countdown timer + 4 product cards horizontal scroll.
3 product strips (bestsellers / trending / new arrivals): each centered eyebrow + title + italic subcopy + 4-card grid + "see all" link.
Product card (tall image-forward): 4:5 image with badges overlay top-left, wishlist heart top-right, hover slide-up Quick Add button; below: category eyebrow, Bangla name, dot-rating, price with strikethrough was-price, discount chip, variation hint.
Bundle offers: 3 dark cards with overlay text on bundle photographs.
Brand story: asymmetric image+text split with floating leaf decorations.
Reviews carousel: parchment cards with italic quote, large opening quote mark, avatar+verified.
FAQ: 2-col split, title left, accordion right.
Newsletter: dark green section, WhatsApp/Email tab toggle, single input + button.
Footer: 5-col dark green, social icons, payment+delivery strips, copyright bar.
Floating right-bottom: WhatsApp + Messenger + Live chat stack.
Micro-interactions: warm shadows, leaf cursor on hero, staggered fade-up on load, blob backgrounds, 2% noise grain overlay everywhere.
Mobile: bottom 5-tab navigation, full-screen search, horizontal-scroll strips.
```

---

## 25. Recommendations (Claude's additions beyond brief)

**1. Add a "Snack Quiz" entry point** (Sprint 4 candidate):
A small playful banner mid-page: "৩ প্রশ্নে আপনার পারফেক্ট স্ন্যাক বক্স খুঁজে নিন →" linking to a 3-step quiz that recommends a bundle. High engagement, low build cost. DTC pattern (Glossier, Function of Beauty).

**2. Editorial recipe cards** (in place of generic blog teaser):
3 horizontal cards with image + recipe title + ingredients list. Example: "অফিসে নেওয়ার জন্য — ৫ মিনিটে এনার্জি বল।" Drives content marketing without full blog module.

**3. "Just made" / "Just packed today" date stamp on product cards:**
Tiny ribbon "আজ প্যাক করা" on items packed within last 48h. Trust + freshness signal. Needs `packed_date` field; can defer.

**4. Localized social proof in real-time:**
Toast notification bottom-left every 30s: "ধানমন্ডির রুবিনা এইমাত্র অর্ডার দিলেন: মিক্সড নাটস বক্স ✓"
Use last 24h orders, anonymize last name. High conversion lever, ~2h build.

**5. Inverted typography moment:**
On the brand story section, try ONE word in the headline rendered as a thick organic-outline shape (like a sticker), rotated -3deg, with PRIMARY color fill. Breaks the visual rhythm without breaking the aesthetic. Memorable detail people screenshot.

**6. Replace generic loading spinners with food motion:**
A rotating ring of small leaf SVGs as the loading indicator. Tiny detail, brand-consistent.

**7. Section-end signature:**
Every major section ends with a 1-line "—" divider drawn in italic Fraunces, like a manuscript flourish. Costs nothing, adds editorial feel.

---

## How to use this brief

**Option A — Paste whole brief into Claude design tool:**
Copy all of this markdown. Paste into Claude (or similar) with prompt: "Generate a single-page React + Tailwind home page implementing this design brief exactly. Use placeholder images from unsplash.com/s/photos/dried-fruits. Implement section by section."

**Option B — Section-by-section:**
Paste one section at a time (e.g. just section 7 Hero). Iterate on that section, copy results, move to next. Better for control.

**Option C — Hand to a designer:**
This brief is detailed enough for a human designer to mock up in Figma. Color tokens, type scale, spacing system, section content all locked.

---

## Files

This brief lives at `docs/_ai/HOME_DESIGN_BRIEF.md`. Pair with:
- [SPRINT_3_HOME_LAYOUT_TOGGLES.md](SPRINT_3_HOME_LAYOUT_TOGGLES.md) — admin toggle catalog (74 toggles + section reorder)
- [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) — search dropdown spec + strip API audit
- [CLIENT_SPRINT_3.md](CLIENT_SPRINT_3.md) — Sprint 3 H1 high-level plan
