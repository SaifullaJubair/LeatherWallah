# Variation Overhaul — Test Backlog (বাংলা)

মালিকের অনুরোধে test গুলো এখন না চালিয়ে Phase C-এর পর একসাথে চালানোর জন্য জমিয়ে রাখা হলো।

মালিক যখন বলবে "শব test দিয়ে দাও" / "A + B + C test list দাও" — তখন এই ফাইল থেকে priority অনুযায়ী চালানো হবে।

---

## Phase A — Attribute Display Metadata (Display Style + Weight tracking)

### P1 — অবশ্যই (5 মিনিট, admin panel)
- **A1** `/attribute` পেজে গিয়ে নতুন একটা attribute বানাও "Color2" নামে, Display Style = **Swatch** select করো, 3 টা value দাও hex code সহ (e.g. #ff0000) → save → list-এ purple "SWATCH" badge দেখাবে।
- **A2** `/attribute` পেজে "Weight2" attribute বানাও, **Enable weight tracking** checkbox tick করো, 3 টা value দাও grams সহ (যেমন 250, 500, 1000) → save → list-এ grey "BUTTON" badge + amber "⚖ weight" chip দেখাবে।
- **A3** `/attribute` থেকে আগে থেকে থাকা একটা attribute edit করো → display_type / tracks_weight ঠিকমতো prefill হয়েছে কিনা দেখো + যদি product-এ ব্যবহৃত হয় তাহলে amber warning দেখাবে: "⚠️ এই attribute N টা product-এ ব্যবহার হচ্ছে"।

### P2 — Recommended (10 মিনিট, admin panel)
- **A4** Swatch attribute বানাও কিন্তু কোনো hex code না দিয়ে → save → toast দেখাবে "X values have no color code" কিন্তু save success হবে (block হবে না)।
- **A5** আগের একটা button-type attribute এডিট করে swatch-এ পরিবর্তন করো (hex নেই) → একই swatch-no-hex toast আসবে।
- **A6** `/product/product-create` পেজে যাও → এমন category নাও যেখানে `tracks_weight=true` attribute variant axis-এ আছে → variation matrix-এ নতুন "Weight (g)" column দেখাবে → attribute value-এর weight থেকে auto-fill হবে।
- **A7** আগে থেকে থাকা variation row-এর weight manually edit করো → save → reload → নতুন weight preserved (admin override কাজ করছে)।
- **A8** Variation product বানাও যেখানে 2+ weight-tracking axis আছে (যেমন Size + Material — দুটোই tracks_weight) → amber warning দেখাবে "Multiple weight axes — variation weight will be SUM" → matrix auto-fill হবে দুই axis-এর sum দিয়ে।

### P3 — Edge case (15 মিনিট, পরে ব্যাচে করা যাবে)
- **A9** যে attribute কোনো product-এ ব্যবহৃত হয়নি, সেটার update form-এ amber warning দেখাবে না।
- **A10** `/attribute` থেকে Display Style = **Dropdown** select করো → list-এ blue "DROPDOWN" badge দেখাবে।
- **A11** এমন attribute-এ tracks_weight=true করো যেটা কোনো product-এ variant axis না → শুধু stored, matrix-এ কিছু পরিবর্তন হবে না (informational)।
- **A12** আগে থেকে থাকা variation product update করো → existing row-এর weight auto-fill হবে না (MOD #13 — admin override preserved)।
- **A13** (Storefront PDP) — একটা color product-এ যাও → color value এখনো ঠিকমতো render হচ্ছে (Phase C এর rewrite-এর আগে Phase A migration smart-default রেখেছিল যাতে break না হয়)।
- **A14** (Terminal) — `cd FruitSnacksBackend && npx ts-node src/scripts/backfill-attribute-display-type.ts` → আবার চালালে clean রান হবে, log-এ দেখাবে "0 new migrated" (idempotent)।

---

## Phase B — Category Default Attributes (Hierarchical inheritance)

### P1 — অবশ্যই (5 মিনিট, admin panel)
- **B1** `/category` থেকে একটা root category create/edit করো → Default Variant Attributes = [Color] + Default Filter Attributes = [Color, Size] save করো → form re-open করে দেখো ঠিকমতো load হয়েছে।
- **B2** ওই root-এর under একটা child category add করো → inheritance hint banner দেখাবে "Inheriting variant axes from parent: Color" + "Inheriting filter attributes from parent: Color, Size" + "MERGED with these" note।
- **B3** ওই child category-তে Default Variant = [Size, Material] add করো → save → resolved chain হবে [Color (parent), Size, Material] — এই order-এ (parent-first dedup)।

### P2 — Recommended (10 মিনিট, admin panel)
- **B4** `/product/product-create` empty form-এ যাও, এমন category নাও যার defaults আছে → toast দেখাবে "Category defaults auto-loaded" + attributes pre-fill হবে।
- **B5** `/product/product-create` এ manually 2টা attribute add করো → তারপর category change করো যেটার defaults আছে → amber banner দেখাবে "💡 Category defaults available: [...]" with **Apply** / **Dismiss** button (আগের 2টা attribute screen-এ থাকবে)।
- **B6** **Apply** click করো → আগের 2টা + category defaults MERGE হবে (কোনো duplicate ছাড়া); admin selection wipe হবে না।
- **B7** **Dismiss** click করো → banner গায়েব, attributes অপরিবর্তিত।
- **B8** দ্রুত category A → B → C পরপর change করো → শুধু শেষ category-র banner দেখাবে (race-safe abort কাজ করছে)।

### P3 — Edge case (15 মিনিট, admin + storefront + shell মিলিয়ে)
- **B9** যে attribute কোনো category-এর defaults-এ আছে সেটা delete করো → ওই category-র product form re-open করো → defaults resolve হবে crash ছাড়া (self-healing dead-ref skip)।
- **B10** `/category` থেকে একটা inactive attribute defaults-এ assign করো → resolve time-এ filter out হবে (শুধু active attribute আসবে)।
- **B11** Storefront category page-এ filter sidebar-এ category defaults + product-এর own show_in_filter — দুটোর union দেখাবে, de-dup হবে, category defaults আগে।
- **B12** Storefront filter sidebar-এ এমন attribute value যেটার matching product 0 → hidden হবে (industry-standard "hide empty")।
- **B13** (Shell) `curl http://localhost:5000/api/v1/category/defaults/<any-cat-id>` → public endpoint, return করবে `{ default_variant_attributes: [...], default_filter_attributes: [...] }`।
- **B14** Circular parent করার চেষ্টা (UI দিয়ে possible না, edge) → resolver visited Set-এ break করবে, infinite loop হবে না।

---

## Phase E — Inline Attribute Create + Add Value + Form Draft

### P1 — অবশ্যই (5 মিনিট, admin panel)
- **E1** `/product/product-create` → attribute multi-select-এর পাশে নতুন **+ Create** button দেখা যাচ্ছে → click করো → AddAttribute modal খুলবে (responsive: mobile-এ bottom-sheet, desktop-এ centered)।
- **E2** Modal-এ attribute name + display_type + values দিয়ে save → modal close + toast "added — pick values to continue" → multi-select-এ নতুন attribute auto-selected (axis on by default)।
- **E3** একটা attribute select করার পর per-row header-এ **+ Add value** button click করো → amber inline mini-form খুলবে → name + (display_type=swatch হলে hex) + (tracks_weight হলে grams) input দেখাবে।

### P2 — Recommended (10 মিনিট, admin panel)
- **E4** Mini-form-এ নতুন value name দিয়ে save → toast "Value 'X' added" → পাশের value-select-এ নতুন option auto-checked।
- **E5** Mini-form-এ ওই attribute-এ already থাকা একটা value name দাও (case-insensitive) → toast "এই attribute-এ already আছে" — backend hit হবে না।
- **E6** Product create form-এ partial data ভর্তি করো (name, category, কয়েকটা attribute) → tab close না করে refresh → toast "Draft restored" দুটো button (Discard / Keep) সহ → Keep click করলে data ঠিকঠাক restored।
- **E7** Draft restore toast-এ **Discard** click করো → page reload → form clean, কোনো old data নেই।
- **E8** Create form submit success করো → reload → কোনো draft restore toast আসবে না (submit-এ clear হয়ে গেছে)।

### P3 — Edge case (15 মিনিট)
- **E9** Update mode-এ যাও (existing product edit) → কোনো draft restore হবে না (EM2 — create-only)।
- **E10** Draft সেভ থাকা অবস্থায় একটা attribute admin panel থেকে delete করো → product create page reload → draft restore হবে কিন্তু toast-এ "(X attribute(s) no longer available — skipped)" message থাকবে।
- **E11** Mini-form খোলা থাকা অবস্থায় **Cancel** click করো → form গায়েব, কোনো data save হবে না।
- **E12** Swatch display_type attribute-এর mini-form-এ hex input দেখাবে; button display_type-এর hex input দেখাবে না।
- **E13** tracks_weight=true attribute-এর mini-form-এ grams input দেখাবে; tracks_weight=false attribute-এ grams দেখাবে না।
- **E14** 30 মিনিট আগে saved draft → reload → silently clear, কোনো restore toast নেই।
- **E15** Per-row **Edit** button (mini-form-এর পাশে) click করো → full UpdateAttribute modal খুলবে (old behavior, untouched)।
- **E16** Tab close → reopen → sessionStorage auto-clean হয়ে গেছে → কোনো draft নেই (sessionStorage semantics)।
- **E17** sessionStorage quota cross করার চেষ্টা (admin tool থেকে fill করে test) → toast "Draft save failed — sessionStorage quota full"; form-এ ক্রাশ হবে না।

---

## Phase C — PDP Variation Picker Rewrite

### P1 — অবশ্যই (5 মিনিট, storefront)
- **C1** Variation product-এর PDP খোলো (যেমন Color + Size আছে) → chip ঠিকমতো render হচ্ছে: color axis = circle, size axis = pill button (display_type honor হচ্ছে)।
- **C2** Swatch click করো → variation switch হবে: price update, stock count update, পিছনে variation_product_id change হবে।
- **C3** সব axis selected + in-stock অবস্থায় "Add to Cart" click করো → toast "Added to cart" → cart sidebar-এ ঠিক variation দেখাবে।

### P2 — Recommended (10 মিনিট, storefront)
- **C4** এমন URL দিয়ে PDP visit করো `/products/<slug>?<axis_attribute_id>=<value_id>&<axis2>=<value2>` → page load হবে ঠিক ওই selection নিয়ে (URL → state)।
- **C5** Page-এ একটা selection change করো → URL address bar-এ update হবে full reload ছাড়া (state → URL)।
- **C6** Page refresh করো → URL থেকে selection preserved থাকবে।
- **C7** কোনো axis NOT selected অবস্থায় add-to-cart চেষ্টা করো (URL দিয়ে manually `?axis=invalid_id` দিয়ে test করা যায়) → button disabled / toast দেখাবে "প্রথমে সব option select করুন।"।
- **C8** এমন combination নাও যেটা Out of Stock → button-এ "Out of Stock" দেখাবে, click করলে disabled / toast।
- **C9** OOS chip behavior — যে chip-এর stock নেই সেটা opacity-reduced + tooltip "Out of stock" দেখাবে কিন্তু এখনো CLICKABLE থাকবে (silently disabled না)।

### P3 — Edge case (15 মিনিট)
- **C10** এমন attribute যার desktop-এ > 16 value / mobile-এ > 8 → "+N আরো" chip দেখাবে → click করলে modal খুলবে → search name দিয়ে filter হবে → tap-select করলে modal close হয়ে selection apply হবে।
- **C11** Dropdown display_type-এর attribute → axis "Select…" button হিসেবে render হবে → click করলে সরাসরি modal খুলবে (inline chip নেই)।
- **C12** Swatch attribute যার কোনো hex code নেই (admin display_type=swatch দিয়েছে কিন্তু color skip করেছে) → grey circle + hover tooltip-এ value name দেখাবে।
- **C13** Modal — ESC দিলে close হবে; panel-এর বাইরে click করলে close হবে; modal খোলা থাকলে background scroll হবে না; auto-focus search input-এ চলে যাবে।
- **C14** Aria-label — screen reader দিয়ে test করলে প্রতিটা chip-এ value name announce করবে; OOS chip-এ "Out of stock"-ও announce করবে।
- **C15** বাংলা value name কাজ করবে (যেমন "কালো", "লাল") — URL, search, combination[] match — কোথাও encoding issue হবে না।
- **C16** Pre-Phase-0 product (যদি DB-তে legacy doc থাকে — `attribute_id` snapshot নেই) → picker legacy fallback দিয়ে render হবে (crash হবে না)।

---

## Test শুরুর আগে checklist

প্রতিবার test session শুরু করার আগে:
1. Backend running — `localhost:5000`
2. Admin running — `localhost:3001` — `Ctrl+Shift+R` দিয়ে hard refresh
3. Storefront running — `localhost:3000` — Phase C ship হয়েছে তাই hard refresh
4. Backfill migration আগেই চালানো হয়েছে (Phase A migration earlier session-এ done)
5. C tests-এর জন্য কমপক্ষে একটা variation product থাকতে হবে যাতে display_type variety আছে (একটা swatch with hex, একটা button, optionally একটা dropdown — C11-এর জন্য)

## কোন test কোথায় চালাতে হবে

| Test group | কোথায় |
|------------|---------|
| A1–A12, B1–B10, E1–E17 | Admin panel (port 3001) |
| A13, B11, B12, C1–C16 | Storefront (port 3000) |
| A14, B13, B14 | Terminal / curl / shell |

---

## Test priority summary

| Priority | Test count | মোট সময় |
|----------|-----------|---------|
| **P1 — Smoke** (must) | A: 3 + B: 3 + C: 3 + E: 3 = **12** | ~20 মিনিট |
| **P2 — Critical paths** | A: 5 + B: 5 + C: 6 + E: 5 = **21** | ~35 মিনিট |
| **P3 — Edge cases** | A: 6 + B: 6 + C: 7 + E: 9 = **28** | ~45 মিনিট |
| **মোট** | **61 test** | **~100 মিনিট** |

সব phase ship complete — A + B + C + E চারটাই একসাথে test করা যাবে।
