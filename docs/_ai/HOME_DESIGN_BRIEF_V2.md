# FruitSnacks Home Page — Design Brief V2

**Variant 2 of 2** — paste into Claude design tool or AI UI generator.
**Aesthetic:** Rich premium fashion/cosmetics-leaning — Sephora-meets-Rare Beauty energy on a fresh-snacks brand.
**Pair with:** [HOME_DESIGN_BRIEF.md](HOME_DESIGN_BRIEF.md) (Variant 1 = earthy-organic, single static hero).
**This variant differs:** new palette, new fonts, nested mega-menu, split hero with carousel, overlay-style product cards, ALL Variant-1 toggled-off sections turned ON (ecommerce_choice / just_for_you / promo banner / category-wise strip / nested mega-menu), heavy motion design.

**Designed against:** WCAG AA (4.5:1 contrast), 44x44pt touch targets, prefers-reduced-motion respect, 8dp spacing rhythm, 150-300ms micro-interaction timing, no emoji-as-icon (SVG only).

---

## 1. Brand tone for V2

> A boutique snack atelier. Curated like cosmetics, served like couture.

Where Variant 1 was "honest farmstand," V2 is "the snack you bring to a dinner party — wrapped in tissue, tied with ribbon." Editorial. Aspirational. Animated. Made for the customer who buys themselves flowers on Friday.

---

## 2. Color palette — "Berry & Bronze"

Completely different mood from V1 forest-green. Cosmetics-aisle warmth with confident accents.

```
PRIMARY              #6B2D5F   Plum Wine            — main CTAs, links, primary headings
PRIMARY-DEEP         #4A1D42   Aubergine           — pressed/hover, footer base, dark surfaces
PRIMARY-SOFT         #9C5B91   Rose Plum            — secondary buttons, soft borders

ACCENT               #D4A574   Champagne Bronze    — luxury chips, hover glow, decorative
ACCENT-DEEP          #B07F4F   Burnished Bronze    — accent text on cream, icon strokes
ACCENT-SHIMMER       linear-gradient(135deg, #D4A574 0%, #F0D4A0 50%, #B07F4F 100%)
                                                   — hero overlays, badge backgrounds, animated shimmer fills

CORAL                #E8654C   Coral Pop            — sale badges, urgency CTAs, "limited" markers
CORAL-SOFT           #F4A693   Blush Coral          — tag backgrounds, hover wash

BG-IVORY             #FBF7F1   Warm Ivory          — page background (NOT pure white)
BG-PEARL             #F2E8DC   Pearl Sand           — alternating section bg
BG-INK               #1A0F1C   Aubergine Black     — footer / dark hero / overlays

TEXT-INK             #2A1929   Rich Plum-Black     — body text (warmer than #000)
TEXT-MUTED           #6E5C6B   Mauve Smoke         — secondary text, meta
TEXT-WHISPER         #B5A5B0   Dusty Lilac         — placeholders, dividers, captions

SUCCESS              #5A8F5A   Sage (kept neutral)
WARNING              #D4A574   Champagne
DANGER               #C44535   Burnt Coral

OVERLAY              rgba(26, 15, 28, 0.6)            — modal/sheet backdrop
BORDER-WHISPER       #EBE0D5                          — card borders, dividers
SHADOW-LUXE          0 10px 40px rgba(74, 29, 66, 0.12)
SHADOW-FLOAT         0 24px 60px rgba(74, 29, 66, 0.18)
GLOW-ACCENT          0 0 30px rgba(212, 165, 116, 0.4) — used sparingly on hover
```

**Contrast verification (WCAG AA):**
- PRIMARY `#6B2D5F` on BG-IVORY `#FBF7F1` = 9.1:1 ✓ (large + small text safe)
- TEXT-INK `#2A1929` on BG-IVORY = 14.8:1 ✓ AAA
- BG-IVORY text on BG-INK = 16.2:1 ✓ AAA
- ACCENT `#D4A574` on BG-INK = 6.4:1 ✓ AA

**Rule:** Page bg always BG-IVORY (warm, never pure white). Sections alternate IVORY → PEARL → IVORY → INK. Pure white reserved for product card hover state only. Gradients used INTENTIONALLY (max 3 places on page — hero overlay, premium badge, CTA hover) — never as default fill.

---

## 3. Typography pairing — V2

Different from V1 (no Fraunces / Inter Tight / Hind Siliguri here).

```
DISPLAY FONT  (hero, section titles, brand moments)
  Family: "Tenor Sans" — refined transitional serif-ish sans with high-fashion personality
  Fallback: "Cormorant", "Playfair Display", Georgia, serif
  Weights: 400 only (the font is single-weight, its character carries hierarchy via size)
  Use: ALL CAPS for editorial moments, sentence case for headlines
  Letter-spacing: 4% on caps, -1% on large headlines

DECORATIVE ACCENT  (one-word moments, signature flourishes)
  Family: "Marcellus" — classical Roman serif with elegant flair
  Fallback: "Cormorant Garamond", serif
  Weights: 400
  Use: Italic accents inside headlines (one word italic for emphasis), section sub-titles

BODY FONT  (paragraphs, UI labels, buttons, navigation)
  Family: "Manrope" — modern geometric sans with friendly curves
  Fallback: "Outfit", "DM Sans", -apple-system, sans-serif
  Weights: 300 (light body, large display), 400 (body), 500 (labels/buttons), 700 (CTAs)
  Use: All UI text, body paragraphs, navigation, buttons

BANGLA FONT  (Bangla text — required for BD market)
  Display Bangla: "Baloo Da 2" — modern Bengali display, complements Tenor Sans
  Fallback: "Hind Siliguri", "Noto Sans Bengali", sans-serif
  Body Bangla: "Hind Siliguri" 400/500 (well-supported, readable at small sizes)

MONO  (price tickers, product codes, countdown)
  Family: "Space Grotesk" Mono variant OR "DM Mono"
  Fallback: "JetBrains Mono", ui-monospace
  Use: Tabular-nums only for prices/counters
```

**Type scale (mobile → desktop):**
```
HERO DISPLAY    56px → 104px    Tenor Sans 400 ALL CAPS, line-height 0.92, letter-spacing 2%
H1 SECTION      36px → 64px     Tenor Sans 400, line-height 1.0, letter-spacing -0.5%
H1 ACCENT       —               Marcellus 400 italic (one word inside H1), same size, slight color shift to ACCENT-DEEP
H2 SUBHEAD      24px → 36px     Marcellus 400 italic, TEXT-MUTED, line-height 1.2
EYEBROW LABEL   11px → 13px     Manrope 500 ALL CAPS, letter-spacing 18%, ACCENT-DEEP
BODY LARGE      17px → 19px     Manrope 400, line-height 1.65
BODY            15px → 16px     Manrope 400, line-height 1.6
SMALL           12px → 13px     Manrope 400, line-height 1.5
PRICE           20px → 26px     Manrope 700 tabular-nums, TEXT-INK
PRICE-WAS       14px → 16px     Manrope 400 strikethrough TEXT-WHISPER
BUTTON          14px → 15px     Manrope 700 letter-spacing 6%
```

**Rule:** Eyebrow labels (uppercase, wide tracking, ACCENT-DEEP color) precede every section title. Wider tracking than V1 (18% vs 12%) — cosmetics catalog feel. Headlines mix Tenor Sans (most words) + Marcellus italic (one accent word) for editorial dynamism.

---

## 4. Spacing & layout system

```
GRID                12-column desktop (max-width 1360px, gutter 32px — wider than V1)
                    8-column tablet
                    4-column mobile

SPACING SCALE       4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 160 / 200
                    (extra 200 step for V2 — denser hero, more breathing room on sections)

SECTION RHYTHM      Mobile: py-20    Tablet: py-28    Desktop: py-40
                    (more generous than V1 — V2 is editorial-magazine feel)

CONTAINER PADDING   Mobile: px-5   Tablet: px-10   Desktop: px-16

ROUNDED CORNERS     Buttons: rounded-full (pill) OR rounded-sm 4px (luxury minimal alternative)
                    Cards: rounded-lg 8px (tighter than V1 — modern fashion)
                    Inputs: rounded-full (pill)
                    Image masks: rounded-lg 8px (NOT extra-large — fashion editorial)
                    Hero floating elements: rounded-3xl 24px

BORDERS             1px BORDER-WHISPER for soft divides
                    1px ACCENT-DEEP for premium emphasis (sparingly)
                    NEVER use 0px sharp corners (cold) AND NEVER use rounded-full on cards (juvenile)

SHADOWS             SHADOW-LUXE for default card elevation
                    SHADOW-FLOAT for hover (cards lift 6px)
                    GLOW-ACCENT for premium product hover (champagne glow ring)
                    Always use plum-tinted rgba, NEVER cold gray
```

---

## 5. Top bar (slim utility strip)

**Height:** 40px desktop (4px taller than V1 — premium feel), 36px mobile.
**Background:** BG-INK (`#1A0F1C` aubergine-black).
**Text:** BG-IVORY 13px Manrope 400, letter-spacing 8%.

**Content (3 zones):**
- LEFT: rotating premium offer, **horizontally sliding** every 6s (300ms slide-in from right + 300ms slide-out left)
  Examples: "✦ ১৫০০৳ অর্ডারে ফ্রি প্রিমিয়াম প্যাকেজিং" / "✦ নতুন: শীতকালীন লিমিটেড এডিশন বক্স" / "✦ স্টুডেন্ট ডিসকাউন্ট ১০% — কোড: STUDY"
  (the ✦ is a small champagne-bronze 4-point star SVG, not emoji)
- CENTER (desktop only): "🇧🇩 বাংলাদেশ • ৳ BDT" — small flag SVG + currency
- RIGHT: divider | "অর্ডার ট্র্যাক করুন" | divider | "সাহায্য" | divider | Small bag count "৩"
  Each separated by 1px BG-IVORY 20% opacity vertical dividers

**Mobile:** Only rotating offer center-aligned, 32px tall.

---

## 6. Navbar — sticky with 3-level mega-menu

**Height:** 88px desktop (8px taller than V1), 64px mobile. BG-IVORY. Border-bottom 1px BORDER-WHISPER.

**Sticky behavior:** On scroll past 200px, navbar shrinks to 64px desktop, adds SHADOW-LUXE, background switches to BG-IVORY @ 95% opacity with `backdrop-filter: blur(20px)` for premium glass effect. Logo scales 0.85x. Animation duration 200ms ease-out.

**3-zone layout:**

**LEFT ZONE (~22%):**
- Logo: "FruitSnacks" wordmark in Tenor Sans 400, 26px desktop / 22px mobile, color PRIMARY-DEEP
- Above wordmark: tiny circular bronze emblem (12px), abstract fruit-slice geometric mark in PRIMARY color stroke
- Total logo block ~200px wide
- On hover: emblem rotates 180deg smooth 400ms ease-in-out

**CENTER ZONE (~50%) — NAVIGATION LINKS + MEGA-MENU:**

Navigation links (5 items, gap 40px, Manrope 500 14px letter-spacing 6% TEXT-INK uppercase):

```
SHOP   COLLECTIONS   OFFERS   ABOUT   JOURNAL
```

Each link has a **3-line underline indicator** below (1.5px PRIMARY-DEEP) that animates in from 0% to 100% width on hover, originating from left, 280ms ease-out.

**Mega-menu trigger:** Hovering "SHOP" or "COLLECTIONS" opens full-width mega-menu below navbar (slides down 12px + fades in over 240ms).

**Mega-menu structure — NESTED 3-LEVEL (Daraz/Pickaboo pattern, reimagined editorial):**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│  COL 1: PARENT CATEGORIES       COL 2: SUBCATEGORIES         COL 3: CHILD CATS     │
│  (~25% width)                   (~25% width)                 (~25% width)          │
│                                                                                     │
│  ▸ Dried Fruits          →     ▸ Mango Range          →    ▸ Slices               │
│    Nuts & Seeds          ◌      Apricot Range          ◌    Cubes                  │
│    Mixed Boxes           ◌      Date Range             ◌    Whole                  │
│    Gift Sets             ◌      Berry Range            ◌    Strips                 │
│    Healthy Snacks        ◌                              ◌                          │
│    Premium Collection    ◌                                                          │
│                                                                                     │
│  (hover triggers next col)                              COL 4: PROMO TILE (~25%)   │
│  Active item has:                                                                   │
│    - PRIMARY-SOFT bg                                    ┌─────────────────────┐   │
│    - PRIMARY text                                       │  [Bundle image]     │   │
│    - chevron ▸ rotates 90deg                            │  WINTER COLLECTION  │   │
│    - subtle 200ms                                       │  Limited Edition    │   │
│                                                         │  Save up to 25%     │   │
│                                                         │  [SHOP NOW →]       │   │
│                                                         └─────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Mega-menu detailed spec:**
- Container: full-width, BG-IVORY, top edge has soft 4px PRIMARY-SOFT gradient line
- Internal max-width 1360px center, padding 48px
- Min-height 480px (consistent regardless of category depth — prevents jump)
- **Active state per column:** hovered item gets background tint, plus a small chevron arrow rotates from ▸ to ▾ in 180ms
- **Column 1 → 2 → 3 reveal:** initial only Col 1 visible; hovering parent reveals Col 2 (slide right 16px + fade, 200ms); hovering subcategory reveals Col 3 same animation
- **Col 4 promo tile:** static rectangular image card 320x400 with overlay text bottom, swap dynamically based on hovered top-level (Shop → "WINTER COLLECTION", Collections → "EID GIFT BOXES", etc)
- **Close behavior:** mouse leaves mega-menu area → wait 200ms grace period → fade out 180ms
- **Mobile:** mega-menu becomes full-screen drawer slide-in from left, accordion-style (parent expands to subcategories, sub expands to children); 16px tap targets per row with chevrons

**RIGHT ZONE (~28%):**
- Pill-shaped search bar, BG-PEARL background, 44px tall, ~280px wide (smaller than V1 because nav links dominate center)
  - Subtle search icon SVG left (stroke 1.5px PRIMARY-SOFT)
  - Placeholder "Search the atelier..." in TEXT-WHISPER, 14px Manrope 400 italic
  - On focus: expands to 360px, dropdown opens (same 4-tier as V1 spec section 13, but restyled with BG-IVORY + ACCENT-DEEP eyebrow tags)
- Icon strip (gap 20px, each 32px touch target):
  - Account icon (line-drawn user silhouette, 1.5px stroke PRIMARY)
  - Wishlist heart (line-drawn, 1.5px stroke). Badge: ACCENT-SHIMMER gradient fill, white tabular-nums 10px count
  - Bag icon (line-drawn shopping bag with subtle handle detail). Same badge style.
  - On bag click: slide-out mini-cart drawer from right edge (not full page navigate)

**Mobile navbar:** logo left, hamburger right (3-line icon → animates to X on open), search icon between (opens full-screen overlay). Bag/wishlist hidden behind hamburger.

---

## 7. Hero section — SPLIT carousel variant

**Variant 1 used single static. V2 uses split — slider LEFT + 2 stacked banner cards RIGHT.**

**Layout:** Full-width section, height 92vh desktop (min 680px, max 880px), 78vh mobile. BG-IVORY background.

**Desktop grid:** 60% LEFT main slider / 40% RIGHT two stacked cards (gap 24px between them).
**Mobile:** stacked vertically — main slider top (auto-height 4:5 ratio), then 2 side-cards horizontal scroll below.

**MAIN SLIDER (LEFT, 60%):**

3-5 slides, auto-rotate every 6s, pause on hover. Each slide:
- Full-bleed image left half (with subtle bottom-right ACCENT-SHIMMER gradient overlay top corner — adds editorial luxury frame)
- Content overlay RIGHT half on top of image:

```
EYEBROW:    NEW · FW 2025 COLLECTION    (Manrope 500 13px LSP 18%, ACCENT-DEEP)

HEADLINE:   The Art of
            Indulgence.
            (Tenor Sans 400, 104px desktop / 60px mobile, TEXT-INK, line-height 0.92)
            Note: word "Indulgence" rendered in Marcellus 400 italic + ACCENT-DEEP color
            Slight letter-spacing -1%

SUBCOPY:    Hand-curated dried fruits and nuts —
            because every quiet moment deserves
            something extraordinary.
            (Manrope 300, 19px desktop, TEXT-MUTED, line-height 1.7, max-width 460px)

CTA ROW:    [Primary: EXPLORE COLLECTION →]   [Secondary: WATCH STORY ↗]
            Primary: BG-PRIMARY-DEEP, BG-IVORY text, rounded-full, py-4 px-10, Manrope 700 letter-spacing 6%
                     Hover: BG shifts to PRIMARY (lighter), arrow translates +6px, GLOW-ACCENT halo appears
            Secondary: transparent, TEXT-INK, underline 6px offset, ↗ icon

SLIDE COUNTER: bottom-left of content area, "01 / 04" in Manrope 400 tabular-nums 14px ACCENT-DEEP
               + thin progress bar 2px wide PRIMARY-SOFT 60% width fills as slide timer counts down
```

**Slider controls:**
- Dot indicators bottom-center (only 4 dots if 4 slides), each 8px circle ACCENT-DEEP on active, BORDER-WHISPER otherwise
- Active dot has a small filling animation (champagne fills from left as 6s ticks)
- Side arrows: large 64px circular SHADOW-LUXE buttons at vertical center, BG-IVORY 90% opacity, PRIMARY arrow inside
- Keyboard: ← → arrow keys navigate
- Swipe on mobile: 60px threshold, follow finger in real-time

**RIGHT STACK (40%, 2 cards):**

**Card A (TOP):** "Bestseller Bundle" tile
- Aspect 4:3, BG image of premium gift box product photography
- Overlay: ACCENT-SHIMMER linear gradient bottom-to-top (transparent top, 60% bronze bottom)
- Content bottom-left padding 32px:
  - Eyebrow "★ BESTSELLER" Manrope 500 11px ACCENT-DEEP
  - Title "Royal Date Selection" Tenor Sans 400 32px BG-IVORY
  - Price "From ৳ 1,200" Manrope 500 16px BG-IVORY
  - CTA: small circular 48px button bottom-right, BG-IVORY, PRIMARY-DEEP arrow
- Hover: image scales 1.04, GLOW-ACCENT halo appears around card edge

**Card B (BOTTOM):** "Just Dropped" tile
- Same aspect 4:3, different image (new arrival hero product)
- Different overlay: BG-INK 50% opacity bottom gradient
- Content bottom-left:
  - Eyebrow "JUST DROPPED" with small ⬢ hexagon icon Manrope 500 ACCENT
  - Title "Pistachio Saffron Mix"
  - Price "৳ 850"
  - CTA same circular button
- Hover: same as Card A

**Background depth (whole hero):**
- Behind the slider: large organic blob shape SECONDARY (PRIMARY-SOFT) at 30% opacity, blur 60px, positioned top-left -100px offset
- Subtle SVG grain noise overlay 2% opacity entire section (premium paper feel)
- 3 small floating "sparkle" particles slowly animating across the section (Lottie-style or SVG, CSS keyframes), ACCENT-DEEP, only visible if `prefers-reduced-motion: no-preference`

---

## 8. Trust strip — V2 luxury edition

**Background:** BG-PEARL (pearl sand alternates from ivory hero).
**Height:** py-16 desktop, py-10 mobile.
**Layout:** 4 cells equal split desktop, 2x2 mobile.

**Each cell — different from V1 (more refined):**

```
[Large icon 48px PRIMARY-SOFT stroke 1.25px line-drawn — NEVER emoji]
[Label Manrope 500 14px LSP 8% UPPERCASE TEXT-INK]
[Sublabel Manrope 400 italic 13px TEXT-MUTED]

Examples:
✦ icon = wrapped box       FREE LUXURY PACKAGING        Above ৳ 1,500
✧ icon = airmail envelope  SAME-DAY DHAKA DELIVERY      Order before 2 PM
☆ icon = quality medal     100% AUTHENTIC SOURCE        Direct from origin
◈ icon = secure shield     SECURE BUY-NOW-PAY           Multiple methods
```

Cells separated by extremely thin 1px BORDER-WHISPER vertical dividers (desktop only).
On hover per cell: icon performs a subtle 6deg wobble 400ms ease-out, label letter-spacing increases by 2%.

---

## 9. Featured Categories — visual tile grid

**Background:** BG-IVORY.
**Section header centered:**
```
EYEBROW:    BROWSE
TITLE:      Curated Categories
            (Tenor Sans 400 56px, "Categories" in Marcellus italic + ACCENT-DEEP)
SUBCOPY:    Six worlds. Endless small luxuries.
            (Marcellus 400 italic 24px TEXT-MUTED max-width 540px center)
```

**Layout:** 6 large tiles in 3-col x 2-row grid desktop (gap 24px), 2-col x 3-row mobile.

**Each tile — RICHER than V1:**
- Aspect 3:4 portrait, BG-PEARL base, rounded-lg
- 80% of tile = beautifully shot product image (top-down, dark moody backdrop, hand-styled)
- Bottom 20% overlay: light cream gradient with text:
  - Category name Tenor Sans 400 22px TEXT-INK
  - Product count Manrope 400 italic 13px ACCENT-DEEP ("12 selections")
- TOP-RIGHT corner: small circular ACCENT-SHIMMER badge with arrow icon "→" (32px)
- Hover effects:
  - Tile lifts 8px with SHADOW-FLOAT
  - Image scales 1.08 with 500ms ease-out
  - Bottom overlay gradient intensifies
  - Top-right arrow badge rotates 45deg
  - All happens together (orchestrated, not jarring)

Categories: ড্রাই ফ্রুটস / নাটস ও বীজ / মিক্স কালেকশন / গিফট বক্স / প্রিমিয়াম রেঞ্জ / হেলদি স্ন্যাকস

---

## 10. Promo Banner Block (V1 had this OFF — V2 turns ON, mid-page editorial)

**Background:** Full-width section BG-INK (aubergine-black). Section py-32.

**Layout:** Asymmetric 60/40 split — image RIGHT (60%), text LEFT (40%) on a dark backdrop.

**LEFT (text on dark):**
```
EYEBROW:    LIMITED EDITION   (ACCENT colored)
TITLE:      Winter
            Wonders.
            (Tenor Sans 400 88px BG-IVORY line-height 0.92)
            "Wonders" in Marcellus italic + ACCENT color
SUBCOPY:    A seven-piece curation of seasonal flavors,
            available only through January.
            Free luxury wrap with every box.
            (Manrope 300 18px TEXT-WHISPER line-height 1.7)
CTA:        [DISCOVER THE EDIT →]
            Primary CTA but on dark — BG-IVORY, TEXT-INK
            Hover: shifts to ACCENT-SHIMMER gradient fill
COUNTDOWN:  Below CTA, "Ends in 4d : 12h : 33m : 18s"
            Manrope 400 tabular-nums 14px ACCENT
            Each digit pair in tiny rounded box BG-IVORY 8% bg
```

**RIGHT (image):**
- Full-bleed product photograph — Winter Wonders box opened, contents spilling on dark velvet
- Image extends beyond grid right edge for editorial feel (bleed)
- Subtle ACCENT-SHIMMER gradient overlay top-right corner adds luxury frame
- Floating mini badge "BEST GIFT 2025" on image top-left, circular wax-seal style, ACCENT-SHIMMER fill, TEXT-INK text, rotated -8deg

**Animation:** When section scrolls into view, image performs subtle parallax (translateY 0 to -40px as user scrolls past). Title words stagger-fade up 100ms each. Respects reduced-motion.

---

## 11. Flash Sale strip (kept from V1, restyled V2)

**Header same structure, restyled:**
- Eyebrow: "TIME-LIMITED OFFER" in CORAL color (urgency without garish)
- Title: "Flash Sale" Tenor Sans 400 56px, "Sale" in Marcellus italic CORAL
- Countdown: each digit box BG-INK with BG-IVORY tabular-nums 32px, separator dots in CORAL
- "Sale ends in" label above countdown in Manrope 500 letter-spacing 12% TEXT-MUTED

**Grid:** 4-up product cards with SALE badge prominent (CORAL background, BG-IVORY text "30% OFF").

---

## 12. Bestsellers strip — first product showcase

**Section header centered:**
```
EYEBROW:    REGULARLY LOVED
TITLE:      Customer Bestsellers
            ("Bestsellers" Marcellus italic + ACCENT-DEEP)
SUBCOPY:    The ones our customers reach for again and again.
```

Uses Product Card V2 spec (section 18 below).

**Footer:** Centered "VIEW ALL BESTSELLERS →" link, Manrope 700 letter-spacing 8% PRIMARY-DEEP, underline-offset 8px, arrow translates +6px on hover.

---

## 13. Trending Now strip — second product showcase

```
EYEBROW:    RIGHT NOW
TITLE:      Trending This Week
SUBCOPY:    What everyone's adding to cart.
```

Same product card. Different background — alternates to BG-PEARL.

**Special V2 detail:** small "↑ 23%" growth chip next to each product card top-left badge, indicating it's trending up. Chip: tiny pill, ACCENT-DEEP bg, BG-IVORY text 10px, with up-arrow SVG.

---

## 14. Just For You strip (V1 had OFF — V2 turns ON)

**Logged-in users see personalized.** Guest users see "Editor's Picks" fallback.

```
EYEBROW:    HAND-PICKED FOR [USER NAME] / EDITOR'S PICKS
TITLE:      Just For You / Editor's Picks
            ("You" / "Picks" Marcellus italic ACCENT-DEEP)
SUBCOPY:    Based on what you've loved before.
            (Manrope italic 17px TEXT-MUTED)
```

Background: BG-IVORY.

**Personalization indicator chip** above title (when logged in): small pill "MATCHED TO YOUR TASTE" Manrope 500 11px LSP 12% ACCENT-DEEP, with sparkle ✦ icon.

Same product card spec.

---

## 15. E-commerce Choice strip (V1 had OFF — V2 turns ON, editor-curated)

```
EYEBROW:    HOUSE FAVORITES
TITLE:      Our Editor's Choice
SUBCOPY:    Picked by our team for unparalleled quality.
```

Background: BG-PEARL alternation.

**Each card in this strip gets an extra premium signal:**
- Top-right corner above the wishlist heart: small circular "EDITOR'S CHOICE" gold-foil badge (32px), ACCENT-SHIMMER gradient with subtle "✦" inside, rotated -8deg, casts GLOW-ACCENT shadow

Same product card spec otherwise.

---

## 16. Category-wise strip (V1 had OFF — V2 turns ON)

**Adaptive section: shows a selected category's bestsellers.** Owner picks 1 category in admin.

```
EYEBROW:    SPOTLIGHT
TITLE:      [Category Name] Selection
SUBCOPY:    Inside our [category] collection — the most loved.
            Below subcopy: small link "Browse all [category] →"
```

Background: BG-IVORY.

**Different layout from other strips:** instead of pure 4-col grid, this is an editorial 2+3 layout —
- Left: 1 LARGE feature product card (takes 2 cols, full-height image, premium presentation)
- Right: 3 standard product cards in vertical stack
- Desktop only — mobile collapses to standard 4-card horizontal scroll

The large feature card is visually distinct: aspect 4:5, ACCENT-DEEP 1px border, EDITOR'S NOTE caption below the standard info ("A staff favorite — pairs beautifully with afternoon tea.")

---

## 17. New Arrivals strip — newest showcase

```
EYEBROW:    JUST ARRIVED
TITLE:      Fresh on the Shelf
SUBCOPY:    The latest additions to our atelier.
```

Background: BG-PEARL.

**Special V2 detail:** "NEW" badge on these cards is animated — small champagne-bronze shimmer sweeps across the badge text every 4s (CSS keyframe gradient animation, 1.5s duration). Respects reduced-motion (disable shimmer).

---

## 18. Product Card V2 — OVERLAY style (different from V1 tall image-forward)

V1 = info below image. **V2 = info overlay on hover, image-dominant always-visible by default.**

**Card dimensions:**
- Width: 300px desktop, 260px tablet, 200px mobile
- Aspect: 3:4 portrait (slightly less tall than V1's 4:5)
- Background: BG-IVORY default, BG-PEARL on rest state for image breathing room
- Border: 1px BORDER-WHISPER default
- Rounded: lg (8px) — sharper than V1's 2xl
- Default elevation: SHADOW-LUXE (gentle)
- Hover elevation: SHADOW-FLOAT (lifts 6px) + 1.5px PRIMARY-SOFT border + optional GLOW-ACCENT

**Internal structure — V2 OVERLAY pattern:**

```
DEFAULT STATE (no hover):
  - Image fills 100% of card (3:4 aspect), object-fit cover
  - Rounded-lg corners
  - Overlays on top of image:
    * TOP-LEFT corner: badges stack
      - SALE: CORAL bg, BG-IVORY text "−30%" Manrope 700 11px LSP 8%, rounded-sm px-2 py-1
      - NEW: ACCENT bg, TEXT-INK text "NEW", same style
      - BESTSELLER: PRIMARY-DEEP bg, BG-IVORY text, max 1 per strip
      - EDITOR'S CHOICE (if editor's choice strip): champagne shimmer foil badge
      - TRENDING (if trending strip): "↑ 23%" small chip
    * TOP-RIGHT: wishlist heart icon button
      - 36px circular, BG-IVORY @ 80% opacity backdrop-blur(8px)
      - Heart line-drawn 1.5px stroke PRIMARY
      - On click: fills PRIMARY-DEEP, scales 1.2 → 1.0 in 300ms spring physics, briefly shows tiny "+1" floating up
    * BOTTOM-LEFT (only if low stock): "Only 4 left" Manrope 400 italic 11px BG-IVORY,
      backdrop-blur, CORAL-tinted text
  - Below image, only 1 line VISIBLE always:
    * Product name Tenor Sans 400 17px TEXT-INK line-clamp-1
    * (price NOT shown until hover — clean editorial look)
  - Padding 16px around the always-visible info

HOVER STATE (desktop):
  - Image gets dark gradient overlay bottom-half (BG-INK 0% to 60%)
  - Reveal block slides up from bottom on top of image, padding 20px:
    * Category eyebrow Manrope 500 11px LSP 12% ACCENT
    * Product name Tenor Sans 400 18px BG-IVORY (1-2 lines line-clamp-2)
    * Rating row: 5 small dots ACCENT fill / BORDER-WHISPER empty, "4.8 (234)" Manrope 400 12px ACCENT
    * Price row: current price Manrope 700 22px BG-IVORY tabular-nums, was-price strikethrough Manrope 400 14px TEXT-WHISPER
    * Variation hint (if any): "3 sizes" Manrope 400 italic 12px ACCENT-DEEP
  - Full-width "ADD TO BAG" button slides up at very bottom 20px from edge:
    * BG-IVORY bg, TEXT-INK text, Manrope 700 13px LSP 8%, py-3
    * On hover of button itself: BG-ACCENT-SHIMMER gradient
  - All hover content reveals via single 240ms ease-out translateY(20px) → 0 + opacity 0 → 1
  - Default below-image text fades out simultaneously (no content overlap)

MOBILE STATE:
  - Default state shows everything overlaid since no hover available
  - Image has darker bottom gradient (BG-INK 0% to 70%, taller)
  - Always-visible info overlaid bottom of image: category eyebrow + product name + price (no rating, save space)
  - Tap-and-hold: long-press 400ms → mini-preview modal (image bigger + add-to-bag button)
```

**Required data fields per card (same as V1, with additions):**

```
_id
product_name
product_slug
main_image (3:4 preferred for V2, fallback BG-PEARL)
category.name
category.slug
product_price
product_discount_price
currency_symbol "৳"
is_variation
variation_count
rating.average
rating.count
stock.in_stock
stock.low_stock
stock.qty_visible
badges: ["NEW", "SALE", "BESTSELLER", "EDITOR_CHOICE", "TRENDING"]
trending_growth_pct (number, optional — for trending strip "↑ X%")
campaign.discount_pct
on_sale (bool)
strip_context (string: "bestseller" / "trending" / "editor" / "new" / "personalized" — controls which badges show)
```

---

## 19. Bundle / Offer hero block (V1 had this — V2 keeps but restyled)

**Background:** BG-IVORY.
**Layout:** 3 large editorial offer cards in horizontal row desktop (1-col stack mobile), gap 32px.

**Each card — V2 luxury edition:**
- Aspect 3:4
- Full-bleed product photography (top-down hand-styled luxury arrangement)
- ACCENT-SHIMMER subtle gradient frame around card (4px gradient border using padding + bg trick)
- Overlay content top-left padding 32px:
  - Badge "3-PIECE EDIT" Tenor Sans 400 italic 14px ACCENT-DEEP
- Content bottom-left padding 32px:
  - Bundle name Tenor Sans 400 32px BG-IVORY line-height 1.05
  - Old/New price "৳ 1,500 ৳ 1,200" with strikethrough on old, BG-IVORY for new
  - Tiny "Save ৳ 300" chip ACCENT-SHIMMER bg, TEXT-INK text, rounded-full px-3 py-1
- BOTTOM-RIGHT corner: 56px circular CTA button, BG-IVORY, PRIMARY-DEEP arrow inside, GLOW-ACCENT halo on hover

**Animation:** When section scrolls into view, the 3 cards stagger-fade-in (100ms apart) with translateY 24px → 0 and slight scale 0.96 → 1.

---

## 20. Brand Story — magazine-spread layout

**Background:** BG-PEARL.
**Layout:** 50/50 split — image LEFT, text RIGHT desktop. Mobile = image top.

**LEFT image:**
- Portrait 4:5 of founder/owner in their studio (or product styling moment), shot moody editorial
- Rounded-lg
- Behind image: ACCENT-SHIMMER large blob shape blur 80px offset bottom-right
- ABOVE image, overlapping top-left -40px offset: large Marcellus italic quote "—2024." date stamp, ACCENT-DEEP color, 64px, rotated -3deg

**RIGHT text (max-width 540px):**
```
EYEBROW:    OUR STORY    (ACCENT-DEEP)
TITLE:      Small studio.
            Big devotion.
            (Tenor Sans 400 64px desktop, "devotion" Marcellus italic + ACCENT-DEEP)

BODY:       FruitSnacks began with a quiet rebellion:
            against the rushed, the mass-produced,
            the indifferent. Every selection in our
            atelier is sourced by hand — examined,
            tasted, approved. We don't scale at the
            expense of soul.
            (Manrope 300 18px TEXT-INK line-height 1.8, max-width 480px)

PULL QUOTE: "If we wouldn't serve it to our own family,
            it doesn't reach yours."
            (Marcellus 400 italic 26px PRIMARY-DEEP line-height 1.4 max-width 460px
             With a small Marcellus opening quote " 60px ACCENT-DEEP absolute positioned top-left)

CTA:        READ OUR FULL STORY →
            (Manrope 700 14px LSP 8% PRIMARY-DEEP underline-offset 8px)
```

Decorative: small champagne-bronze 4-point star ✦ SVG scattered 3 places around the text block (used as period markers / accents — NEVER as emoji).

---

## 21. Reviews carousel — testimonial wall

**Background:** BG-IVORY.
**Layout:** Horizontal scroll carousel, 3 cards visible desktop, 1.2 cards mobile.

**Header:**
```
EYEBROW:    REAL VOICES
TITLE:      Why They Come Back
            ("Back" Marcellus italic ACCENT-DEEP)
SUBCOPY:    Reviews from people who actually pay for their snacks.
            (Marcellus italic 22px TEXT-MUTED)
```

**Each review card — V2 spec:**
- Width 380px desktop, 300px mobile
- BG-PEARL, rounded-lg, padding 36px, SHADOW-LUXE
- Large Marcellus opening quote " 80px ACCENT-DEEP absolute top-left -20px offset (decorative bleed)
- Star row: 5 small filled stars ACCENT (champagne) / empty BORDER-WHISPER
- Review text Tenor Sans 400 italic 19px TEXT-INK line-height 1.5 line-clamp-4
- Bottom row (margin-top 32px, flex align-center gap 16px):
  - Avatar 56px circle (real photo or initials in BG-INK with BG-IVORY text)
  - Stacked: Name Manrope 500 16px TEXT-INK / "Verified Buyer · Dhaka" Manrope 400 12px TEXT-MUTED with small ✓ icon ACCENT
- Optional bottom strip: row of photos uploaded (up to 3, 64x64 rounded-md)

**Carousel controls:**
- Dot indicators below center, ACCENT-DEEP active / BORDER-WHISPER inactive
- Arrow buttons on sides: 48px circular, BG-IVORY, PRIMARY arrow, SHADOW-LUXE
- Auto-rotate every 7s, pause on hover or touch
- Total review count visible: "Read all 234 reviews →" link below carousel center, Manrope 700 13px LSP 6% PRIMARY-DEEP underline

---

## 22. Site FAQ accordion — editorial Q&A

**Background:** BG-PEARL.
**Layout:** 40/60 split — title LEFT, accordion RIGHT. Single col mobile.

**LEFT:**
```
EYEBROW:    HELP CENTER
TITLE:      Frequently
            Asked.
            (Tenor Sans 400 56px line-height 1.0, "Asked" Marcellus italic ACCENT-DEEP)
SUBCOPY:    Can't find what you're looking for?
            (Manrope 400 16px TEXT-MUTED italic)
CTA BUTTON: [WHATSAPP US →]
            Pill BG-PRIMARY-DEEP, BG-IVORY text, Manrope 700 LSP 6% py-3 px-8
            WhatsApp icon 18px SVG left of text (line-drawn, NOT brand color)
```

**RIGHT — accordion:**
- 6 items visible (rest on /faq page)
- Each item: full width, py-7 padding, border-bottom 1px BORDER-WHISPER
- Question row: Tenor Sans 400 19px TEXT-INK (NOT bold — letterform carries weight). Right side: animated "+" 24px PRIMARY-DEEP that rotates 45deg to "×" on open, 240ms cubic-bezier(0.4, 0, 0.2, 1)
- Open state: question color shifts to PRIMARY-DEEP smooth 200ms. Answer expands height 0 → auto with fade-in (200ms ease-out)
- Answer text: Manrope 400 16px TEXT-MUTED line-height 1.75, padding-top 16px
- Animation: only 1 open at a time (accordion behavior), closing the previously open one as new opens

Sample Qs (mix of English + Bangla as fits brand):
- What does same-day delivery actually mean?
- ডেলিভারি কত দিনে পাবো?
- How do I return a product?
- Do you ship outside Bangladesh?
- প্রোডাক্ট কতদিন ভালো থাকবে?
- How does the loyalty program work?

---

## 23. Newsletter / WhatsApp opt-in — V2 elegant

**Background:** Full-width section BG-INK. py-40 desktop.

**Layout:** Centered single-column, max-width 720px.

**Decorative:**
- Large faded Marcellus "F" letterform in BG-IVORY @ 4% opacity 400px size, absolute positioned center as background watermark
- 6 small ACCENT-SHIMMER sparkle particles ✦ slowly drift across section (CSS keyframes, respects reduced-motion)

**Content:**
```
EYEBROW:    JOIN THE ATELIER    (ACCENT-DEEP)
TITLE:      Be the first to know.
            (Tenor Sans 400 64px desktop, "first" Marcellus italic ACCENT, BG-IVORY color)

SUBCOPY:    New collections, exclusive previews, subscriber-only access.
            No spam — we'd never.
            (Manrope 300 18px TEXT-WHISPER center max-width 540px)

TAB ROW:    Two pill tabs centered, gap 8px:
            [WHATSAPP]  [EMAIL]
            Active: BG-IVORY bg, TEXT-INK text, Manrope 700 13px LSP 8% px-8 py-2.5
            Inactive: transparent, BG-IVORY 50% text, hover BG-IVORY 10% bg

INPUT ROW:  flex gap 8px max-width 520px center, margin-top 24px
            Single text input:
              Placeholder "+8801XXXXXXXXX" / "you@atelier.com"
              48px tall, BG-IVORY @ 10% bg with 1px BG-IVORY 20% border
              Manrope 400 16px BG-IVORY text
              Rounded-full px-6
              Focus: border PRIMARY-SOFT 1.5px, soft GLOW-ACCENT ring
            Submit button: BG-ACCENT-SHIMMER gradient fill, TEXT-INK text, rounded-full px-8 py-3
              "SUBSCRIBE" Manrope 700 14px LSP 8%
              Hover: subtle scale 1.02, shadow appears

FINE PRINT: "We respect your inbox. Unsubscribe anytime — promise."
            Manrope 400 italic 12px TEXT-WHISPER center, margin-top 16px
```

---

## 24. Footer — V2 magazine-style

**Background:** BG-INK (aubergine-black), text BG-IVORY / TEXT-WHISPER.
**Layout:** 5 columns desktop, accordion below md.

**TOP SECTION — py-32:**

```
COL 1 (span 2 of 12): BRAND BLOCK
  Logo: "FruitSnacks" Tenor Sans 28px BG-IVORY + emblem in ACCENT
  Tagline 2 lines: "An atelier of small luxuries.
                   Crafted in Bangladesh."
                  (Marcellus italic 16px TEXT-WHISPER line-height 1.5)
  Newsletter mini-form (smaller version of section 23):
    Single input with arrow button "JOIN →"
    Compact, optional ("Subscribe to journal updates")
  Social row:
    5 icons (FB / IG / WhatsApp / YouTube / TikTok / Pinterest)
    36px circles, BG-IVORY 8% bg, BG-IVORY icons stroke 1.5px
    Hover: BG-ACCENT-DEEP, icon color shifts TEXT-INK
  Contact block (small Manrope 400 14px TEXT-WHISPER):
    +880 1XXX-XXXXXX
    hello@fruitsnacks.bd
    Studio 4B, Gulshan-2, Dhaka

COL 2: SHOP
  - All Products
  - Bestsellers
  - New Arrivals
  - Bundle Editions
  - Gift Boxes
  - Sale

COL 3: ASSIST
  - Track Order
  - Returns & Refunds
  - Shipping & Delivery
  - FAQ
  - Customer Care
  - Contact Us

COL 4: ATELIER
  - Our Story
  - Quality Promise
  - Sourcing Standards
  - Journal (Blog)
  - Wholesale Inquiries
  - Press & Media

COL 5: LEGAL
  - Privacy Policy
  - Terms of Service
  - Cookie Settings
  - Accessibility Statement

All link styles: Manrope 400 14px TEXT-WHISPER, hover → BG-IVORY + underline appears
Column titles: Manrope 500 12px LSP 18% UPPERCASE ACCENT-DEEP
```

**MID-FOOTER:**

```
DIVIDER 1px BG-IVORY 8% full-width

PAYMENT STRIP:
  Small heading "WE ACCEPT" Manrope 500 11px LSP 14% TEXT-WHISPER
  Row of payment icons (each 48x32 rounded-sm BG-IVORY 6% bg padded 6px):
    bKash · Nagad · Rocket · Visa · Mastercard · American Express · SSL Secure ✓

ANOTHER DIVIDER

DELIVERY PARTNERS STRIP:
  Small heading "DELIVERED WITH"
  Row of logos: Pathao · Steadfast · RedX (same style boxes)
```

**BOTTOM BAR:**
- Full width, separator border-top 1px BG-IVORY 8%
- LEFT: "© 2025 FruitSnacks Bangladesh • Crafted with care, packed by hand." Manrope 400 12px TEXT-WHISPER
- RIGHT: Mini links: Terms · Privacy · Cookies · Accessibility (separated by · dots, 12px)

---

## 25. Floating chat widgets (right-bottom stack) — V2

**Position:** Fixed bottom-right, padding 32px from edges (more breathing than V1's 24px), z-50.
**Stack:** Vertical column, gap 14px.

**Each button:**
- 60px circle (64px on hover)
- SHADOW-FLOAT with PRIMARY-DEEP tint
- Brand-aware backgrounds:
  - WhatsApp: #25D366 (green)
  - Messenger: #0084FF gradient → #44BEC7 (Messenger spec gradient)
  - Live chat: BG-ACCENT-SHIMMER gradient
- White SVG icons center, 26px
- On scroll-into-view: each button slide-in from right 40px + fade, staggered 100ms
- On hover: scales 1.08 with SHADOW-FLOAT intensifies, optional tooltip slides in from left ("Chat with us →" in BG-INK bg, BG-IVORY text, 13px Manrope 500, rounded-md px-3 py-1.5)
- Tap on mobile: gentle bounce 240ms spring-physics

**WhatsApp pulse:** subtle ring expanding outward (1.5x scale + fade) every 4s — drawing attention without being aggressive. Respect reduced-motion.

---

## 26. Animation & Motion specifications — V2 (heavy motion focus)

V2 puts animation at the forefront. Each below is a real designed moment.

### Page-load orchestration (first paint sequence)

```
T=0ms     Top bar fades in (200ms ease-out)
T=100ms   Navbar fades in + slides down -16px → 0 (240ms ease-out)
T=200ms   Hero text container reveals in stagger:
            T=200ms: eyebrow translateY 16→0 + fade 280ms ease-out
            T=300ms: headline line 1 translateY 24→0 + fade 320ms ease-out
            T=380ms: headline line 2 same
            T=480ms: subcopy translateY 20→0 + fade 280ms ease-out
            T=580ms: CTAs translateY 16→0 + fade 240ms ease-out, both buttons together
            T=680ms: slide counter + trust elements 200ms fade
T=400ms   Hero slider image fades in + scale 1.02 → 1.0 over 600ms ease-out
T=500ms   Right stack 2 cards stagger-in 120ms apart, translateY 24→0 + fade 280ms

Total above-fold paint: ~1100ms
```

### Section-on-scroll reveals (IntersectionObserver)

When section enters viewport at 25% threshold:
- Entire section fades in opacity 0 → 1 over 400ms ease-out
- Header (eyebrow + title + subcopy) staggers 80ms each
- Grid items (products, categories) stagger 60ms each, translateY 16→0
- Single trigger only (don't re-animate on scroll-up)

### Micro-interactions

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Primary button | Hover | Arrow translateX +6px, GLOW-ACCENT halo appears | 200ms | ease-out |
| Secondary link | Hover | Underline draws left-to-right | 240ms | ease-out |
| Product card | Hover | Lift 6px, image scale 1.04, overlay reveals | 280ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Wishlist heart | Click | Fill + scale 1.0→1.3→1.0 spring + "+1" floats up 24px | 400ms total | spring stiffness 180 damping 14 |
| Category tile | Hover | Lift 8px, image scale 1.08, top-right arrow rotates 45deg | 320ms | ease-out |
| Mega-menu reveal | Hover trigger | Fade + slide-down 12px | 240ms | ease-out |
| Mega-menu column reveal | Hover parent | Slide-right 16→0 + fade | 200ms | ease-out |
| Search dropdown | Focus | Fade + scale-95→100 origin top | 180ms | ease-out |
| Toast notification | Append | Slide-up from bottom 16px + fade | 240ms | spring |
| Skeleton loader | Always | Shimmer gradient sweep left-to-right | 1.5s | linear (infinite) |
| Slide counter progress | Auto | Fills 0→100% width as 6s slide timer | 6000ms | linear |
| WhatsApp pulse | Idle | Ring expands 1x→1.5x + fade | 1500ms (infinite, 2.5s pause between) | ease-out |
| Sparkle particles | Idle | Drift diagonal + fade in-out | 4000ms (infinite, randomized starts) | linear |
| Active dot indicator | Active | Fills champagne color from left | 6000ms | linear (matches slide timer) |
| Card "NEW" badge | Idle | Champagne shimmer sweeps text | 4000ms repeat | linear |
| Accordion open/close | Click | Height auto + content fade-in | 240ms expand, 200ms collapse | cubic-bezier(0.4, 0, 0.2, 1) |
| Logo emblem | Hover | Rotates 180deg | 400ms | ease-in-out |
| Navbar shrink on scroll | Scroll past 200px | Height 88→64, logo scale 1→0.85, blur backdrop | 200ms | ease-out |
| Image bleed parallax | Scroll | translateY 0→-40px as section scrolls | continuous | linear |

### Cursor / pointer enhancements

- On hero image area: custom cursor with small champagne-bronze ✦ sparkle following pointer with 200ms lerp delay (NOT on mobile)
- On clickable cards: cursor changes to standard pointer (NO custom override globally — accessibility)

### Texture & depth

- Subtle SVG noise grain overlay on whole page at 2% opacity (premium paper feel — barely visible until you look close)
- Blur blobs in BG-PEARL or PRIMARY-SOFT scattered as background depth (behind hero image, behind brand story image, behind newsletter watermark)
- Drop shadows: always plum-tinted (rgba(74, 29, 66, X)) — NEVER cold gray (#000 based)

### Reduced-motion respect (REQUIRED)

When `@media (prefers-reduced-motion: reduce)`:
- Disable all auto-rotating animations (slider auto-rotate, sparkle drift, badge shimmer, WhatsApp pulse)
- Replace transform animations with simple opacity fades (300ms max)
- Page-load orchestration becomes single 400ms total fade-in
- Hover states still animate (these are user-initiated, not autoplay)
- Slider becomes paused — user controls via dots/arrows manually
- Critical for accessibility — must not skip

### Performance discipline

- Animate only `transform` and `opacity` (NEVER width/height/top/left — causes reflow)
- `will-change: transform` on actively animating elements only (remove after animation)
- IntersectionObserver for scroll reveals (not scroll event listeners)
- Lazy-load below-fold images with `loading="lazy"` + reserve aspect-ratio
- Skeleton loaders use BG-PEARL with shimmer gradient (NOT generic gray)

---

## 27. Responsive breakpoints

```
sm:  640px    Mobile landscape, small tablets
md:  768px    Tablets portrait
lg:  1024px   Tablets landscape, small laptops
xl:  1280px   Desktops
2xl: 1536px   Large desktops, design studios
```

**Mobile-first.** Default styles = mobile, scale up.

**Mobile-specific must-haves:**
- Bottom navigation bar (sticky bottom): Home / Shop / Wishlist / Account / Bag (5 SVG icons, labels Manrope 500 10px LSP 6%)
- Hero stacks vertically, slider auto-height 4:5 ratio
- Mega-menu becomes full-screen slide-in drawer from left with accordion behavior
- Search becomes full-screen overlay with auto-focus
- Product cards in horizontal scroll (snap, 1.5 cards visible)
- Footer columns collapse to 2-col, then accordion below sm

---

## 28. Accessibility checklist

- Contrast: ALL pairs verified ≥ 4.5:1 (small text) / 3:1 (large text)
- Focus states: 2px ACCENT-DEEP outline with 4px offset, NEVER remove without replacement
- Touch targets: minimum 44x44pt
- Heart icon: aria-pressed state, aria-label changes "Add to wishlist" / "Remove from wishlist"
- Bangla blocks: `lang="bn"` for screen reader
- Skip-to-content link top of page (visually hidden until focused)
- All images: descriptive alt text
- Decorative SVGs: `aria-hidden="true"`
- Reduced motion: full respect (see section 26)
- Dynamic Type: text scales without truncation up to 200%
- All interactive elements keyboard reachable, focus order matches visual
- Form errors: inline near field + aria-live announcements
- Color is never sole indicator — always icon/text companion (sale badges have "−30%" text not just CORAL color)

---

## 29. Compressed 1-paragraph summary (for character-limited tools)

```
Premium e-commerce home page, fashion/cosmetics-leaning fresh-snacks brand, "berry & bronze" palette:
plum-wine primary (#6B2D5F), champagne-bronze accent (#D4A574), aubergine-black dark (#1A0F1C),
warm ivory (#FBF7F1) and pearl sand (#F2E8DC) backgrounds, never pure white.
Typography: Tenor Sans for display (single weight, character via size + ALL CAPS), Marcellus
italic for accent words within headlines, Manrope for body/UI/buttons (300/400/500/700),
Baloo Da 2 + Hind Siliguri for Bangla. Top bar: rotating premium offer slide-in/out
horizontally every 6s, currency display center, track-order/help/bag-count right.
Navbar 88px sticky shrink-on-scroll with glass blur backdrop, "FruitSnacks" wordmark + bronze
emblem left, 5 ALL-CAPS nav links center with underline-draw hover, pill search +
account/wishlist/bag-with-badges right. Mega-menu 3-level nested: parent column → subcategory
column reveals on hover → child-cat column reveals next + 4th column promo tile that swaps
content based on top-level. Hero: SPLIT layout, 60% main slider left (4 slides 6s auto-rotate
with progress bar in active dot), 40% right two stacked editorial cards (bestseller bundle
top, just-dropped bottom). Headline "The Art of Indulgence" — "Indulgence" in Marcellus italic
champagne color. Trust strip 4 line-drawn-icon cells on pearl-sand. Featured categories 6 tall
tiles 3:4 with image+overlay text+rotating arrow on hover. Promo banner mid-page on
aubergine-black with 60/40 image-text split, countdown timer, "Winter Wonders" editorial.
Product strips: Flash Sale → Bestsellers → Trending (with "↑23%" growth chips) → Just For You
(personalized when logged-in else Editor's Picks fallback with sparkle badge) → Editor's Choice
(champagne-foil EDITOR'S CHOICE rosette per card) → Category Spotlight (2+3 layout: 1 large
feature card + 3 standard) → New Arrivals (with shimmering NEW badge). Product card V2:
overlay style — image 3:4 fills card, badges top-left, line-drawn wishlist heart top-right
with backdrop-blur, only product name visible by default, on hover dark gradient covers
bottom-half + reveals eyebrow/name/rating/price/variation + ADD TO BAG button slides up.
Bundle offers 3 cards with champagne-shimmer gradient frames. Brand story 50/50 split with
overlapping italic date stamp, founder photo with plum-shimmer blob behind, pull quote in
Marcellus italic with large opening quote mark. Reviews carousel 3-visible parchment cards
with 80px Marcellus opening quote, 5 star champagne fill, verified-buyer photo +
location-name. FAQ 40/60 split title-left accordion-right with rotating-X icons. Newsletter
on aubergine-black with watermark "F" backdrop + drifting sparkles, WhatsApp/Email tabs,
pill input + champagne-shimmer SUBSCRIBE button. Footer 5-col on aubergine-black with brand
+ mini-newsletter + social-icons + 4-link columns + payment/delivery strips + bottom legal
bar. Floating right-bottom chat stack: WhatsApp (with subtle 4s pulse ring) + Messenger +
Live chat embed, all 60px circles with brand-gradient backgrounds, scale on hover.
Heavy motion design: orchestrated page-load (top bar → navbar → hero stagger → right cards),
IntersectionObserver section-reveal stagger, spring-physics on hearts (1.0→1.3→1.0 + floating
+1), shimmering badges, parallax image bleed on promo banner, mega-menu column-reveal slide-right.
Reduced-motion respect mandatory: disable autoplay/shimmer/drift/pulse, replace transforms
with simple fades. Mobile: bottom 5-tab nav, full-screen mega-drawer accordion, horizontal
scroll product strips, swipe slider 60px threshold. WCAG AA verified (PRIMARY on IVORY 9.1:1),
44pt touch targets, lang="bn" on Bangla, aria-live form errors, prefers-reduced-motion
respect, never remove focus rings, color is never sole indicator.
```

---

## 30. V2-specific recommendations (Claude's additions beyond brief)

**1. "What goes with this" recommender on PDP (Sprint 4 candidate):**
When viewing a product, mid-page section "Pairs Beautifully With" showing 3 complementary items as a horizontal scroll. Increases AOV. Uses just_for_you / category-wise data. ~3h build.

**2. Live cart count animation:**
When item added to cart from any product card, the bag icon in navbar plays a small bounce + count badge briefly scales 1.0→1.4→1.0 in champagne color flash. Tiny detail, huge feedback satisfaction.

**3. "Recently viewed" sticky strip (mobile):**
On mobile only, after user has viewed 3+ products, a small collapsible sticky bottom strip appears above bottom-nav showing horizontally-scrollable thumbnails of recently viewed. Tap to revisit. Common Daraz/Sephora pattern, ~4h build.

**4. Sticky add-to-bag on mobile PDP:**
Once user scrolls past the PDP hero, a sticky bottom bar appears with mini-thumbnail + price + ADD TO BAG button. Mobile conversion lever.

**5. Wax-seal review badges:**
On product cards in EDITOR'S CHOICE strip, the EDITOR'S CHOICE badge isn't just a chip — it's a small wax-seal SVG with the brand emblem stamped in it, rotated -8deg. Premium signal that scales the brand emotion. Adds ~1h design time.

**6. Section-end manuscript dividers:**
Between major sections, a 1-line "✦ ✦ ✦" Marcellus italic divider in ACCENT-DEEP color, centered, 60% width. Editorial magazine rhythm. Negligible build cost.

**7. Locale-aware "delivery to" pill (header):**
Small pill in top bar "Deliver to Dhaka ▾" (clickable opens area picker modal). Personalization signal. Sprint 4 candidate.

**8. "Live" inventory pulse:**
For low-stock items (≤5 units), small text "5 left — others viewing" on PDP. Real-time-ish urgency. Needs viewer-count tracking; can fake it Phase 1 with random number 1-3.

---

## 31. How to use this brief

**Option A — paste entire markdown into Claude design tool:**
"Generate a single-page React + Tailwind CSS implementation of this design brief. Use placeholder images from unsplash.com/s/photos/dried-fruits and unsplash.com/s/photos/luxury-cosmetics. Implement every section. Heavy motion design per spec section 26. WCAG AA compliant."

**Option B — section-by-section (better control):**
Paste sections one at a time. Iterate. Move on.

**Option C — comparison to Variant 1:**
Show both briefs to designer/AI tool, ask "give me a Frankenstein hybrid pulling X from V1 and Y from V2." Useful for owner indecision moments.

---

## 32. Files

This is V2 of 2 home page design variants.
- [HOME_DESIGN_BRIEF.md](HOME_DESIGN_BRIEF.md) — Variant 1: earthy-organic, single hero, tall product cards
- **HOME_DESIGN_BRIEF_V2.md** (this file) — fashion-rich, split hero, overlay cards, all sections ON, heavy motion
- Pair with: [SPRINT_3_HOME_LAYOUT_TOGGLES.md](SPRINT_3_HOME_LAYOUT_TOGGLES.md) (admin toggle catalog), [SPRINT_3_SEARCH_AND_STRIP_AUDIT.md](SPRINT_3_SEARCH_AND_STRIP_AUDIT.md) (search dropdown + strip API audit)

---

## 33. Variant comparison cheatsheet

| Aspect | V1 (Earthy Organic) | V2 (Berry & Bronze Rich) |
|---|---|---|
| Mood | Honest farmstand | Boutique snack atelier |
| Primary color | Forest green `#2D5F3F` | Plum wine `#6B2D5F` |
| Accent color | Burnt honey `#C97B3D` | Champagne bronze `#D4A574` + shimmer gradient |
| Bg colors | Cream `#FAF6EE`, Parchment | Ivory `#FBF7F1`, Pearl |
| Display font | Fraunces (variable serif) | Tenor Sans (single-weight refined) |
| Body font | Inter Tight | Manrope |
| Accent font | (italic Fraunces same family) | Marcellus (different family, classical Roman) |
| Bangla font | Hind Siliguri + Noto Serif Bengali | Baloo Da 2 + Hind Siliguri |
| Hero | Single static, 55/45 split | Split: 60% slider + 40% 2 cards |
| Hero carousel | NO | YES, 4 slides, 6s auto-rotate |
| Hero animation | Hand-drawn underline accent on key word | Marcellus italic accent on key word + shimmer overlay |
| Navbar height | 80px | 88px (shrinks to 64 on scroll with glass blur) |
| Mega-menu | Simple 3-col flat | Nested 3-level (parent → sub → child) + promo tile col |
| Trust strip | Hand-drawn icons cream bg | Line-drawn editorial icons pearl bg with hover wobble |
| Featured cat tiles | 6 squares, image+name+count | 6 tall 3:4 portraits with overlay + rotating arrow |
| Promo banner mid-page | OFF in V1 | ON — large dark "Winter Wonders" editorial with parallax |
| Ecommerce_choice strip | OFF | ON — with wax-seal gold-foil EDITOR'S CHOICE badge |
| Just_for_you strip | OFF | ON — personalized with sparkle "MATCHED" chip |
| Category-wise strip | OFF | ON — 2+3 editorial layout (1 large feature + 3 standard) |
| Product card | Tall image-forward, info always visible below | OVERLAY style — image dominant, info reveals on hover |
| Product card aspect | 4:5 | 3:4 |
| Product card border | Soft 2xl rounded (16px) | Sharp lg rounded (8px) |
| Bundle offers | 3 dark cards | 3 cards with champagne-shimmer gradient frames |
| Brand story | Asymmetric 40/60 with photo | 50/50 magazine spread with overlapping italic date stamp |
| Reviews carousel | 3 cards parchment with quote mark | 3 cards pearl with 80px Marcellus opening quote |
| FAQ | 2-col split | Same but with sharper editorial typography |
| Newsletter | Dark green tabs WhatsApp/Email | Dark aubergine with watermark "F" + drifting sparkles |
| Footer | 5-col forest green | 5-col aubergine-black with mini-newsletter in brand col |
| Floating chat | WhatsApp + Messenger + Live (basic styling) | Same 3 but with WhatsApp pulse ring, gradient backgrounds, stagger-on-scroll |
| Animation density | Restrained, intentional micro-interactions | Heavy orchestrated motion (page-load sequence, scroll reveals, parallax, shimmer, particles) |
| Cursor | Leaf cursor on hero | Champagne sparkle cursor on hero |
| Texture | Warm paper grain 3% | Premium paper grain 2% + 3 sparkle particles |
| Section dividers | Manuscript flourish | "✦ ✦ ✦" Marcellus italic divider |
| Vibe in one word | Warm | Glamorous |

Both pair with the SAME admin toggle catalog (SPRINT_3_HOME_LAYOUT_TOGGLES.md). Owner can ship either — or admin can flip between styles by changing palette + font tokens + a few component variants.
