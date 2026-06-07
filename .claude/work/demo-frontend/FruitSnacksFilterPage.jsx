import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Search, ShoppingBag, Heart, SlidersHorizontal,
  ArrowUpDown, X, Plus, Star, Check, Home, LayoutGrid, User, Leaf,
  Truck, ShieldCheck, RotateCcw, Smartphone, Monitor,
} from "lucide-react";

/* ───────────────────────── helpers ───────────────────────── */
const taka = (n) => "৳" + Number(n).toLocaleString("en-US");

/* ───────────────────────── data ───────────────────────── */
const CATS = [
  { key: "nuts", label: "Nuts" },
  { key: "dryfruit", label: "Dry Fruit" },
  { key: "dates", label: "Dates" },
  { key: "seeds", label: "Seeds" },
];
const SIZES = ["250g", "500g", "1kg"];
const TYPES = ["Raw", "Roasted", "Salted"];
const SORTS = [
  { k: "popular", label: "Popular" },
  { k: "new", label: "Newest" },
  { k: "price_asc", label: "Price: Low → High" },
  { k: "price_desc", label: "Price: High → Low" },
  { k: "name_asc", label: "Name: A → Z" },
  { k: "name_desc", label: "Name: Z → A" },
];
const TINT = {
  nuts: "linear-gradient(140deg,#e7efe5,#cfe0cf)",
  dryfruit: "linear-gradient(140deg,#f6e5df,#efd2c6)",
  dates: "linear-gradient(140deg,#f4e9d6,#ecd9b6)",
  seeds: "linear-gradient(140deg,#e9e6f0,#dcd6ea)",
};
const PRODUCTS = [
  { id: 11, name: "Ajwa Dates", cat: "Dates", catKey: "dates", price: 1450, original: 1700, rating: 4.9, reviews: 156, sizes: ["500g", "1kg"], type: "Raw", inStock: true },
  { id: 8, name: "Mixed Nuts Box", cat: "Nuts", catKey: "nuts", price: 950, original: 1200, rating: 4.9, reviews: 205, sizes: ["500g", "1kg"], type: "Roasted", inStock: true },
  { id: 1, name: "Medjool Dates", cat: "Dates", catKey: "dates", price: 520, original: 650, rating: 4.7, reviews: 142, sizes: ["500g", "1kg"], type: "Raw", inStock: true },
  { id: 2, name: "Cashew Nuts (W320)", cat: "Nuts", catKey: "nuts", price: 780, original: 950, rating: 4.6, reviews: 98, sizes: ["250g", "500g"], type: "Roasted", inStock: true },
  { id: 4, name: "Pistachios", cat: "Nuts", catKey: "nuts", price: 1150, original: 1400, rating: 4.8, reviews: 64, sizes: ["250g"], type: "Salted", inStock: true },
  { id: 3, name: "Almonds", cat: "Nuts", catKey: "nuts", price: 690, original: 820, rating: 4.5, reviews: 76, sizes: ["250g", "500g", "1kg"], type: "Raw", inStock: true },
  { id: 6, name: "Raisins", cat: "Dry Fruit", catKey: "dryfruit", price: 320, original: 420, rating: 4.3, reviews: 110, sizes: ["500g", "1kg"], type: "Raw", inStock: true },
  { id: 7, name: "Dried Apricots", cat: "Dry Fruit", catKey: "dryfruit", price: 560, original: 700, rating: 4.5, reviews: 38, sizes: ["250g", "500g"], type: "Raw", inStock: true },
  { id: 9, name: "Chia Seeds", cat: "Seeds", catKey: "seeds", price: 280, original: 360, rating: 4.2, reviews: 87, sizes: ["250g"], type: "Raw", inStock: true },
  { id: 10, name: "Sunflower Seeds", cat: "Seeds", catKey: "seeds", price: 240, original: 300, rating: 4.1, reviews: 29, sizes: ["250g", "500g"], type: "Roasted", inStock: true },
  { id: 5, name: "Walnuts", cat: "Nuts", catKey: "nuts", price: 880, original: 0, rating: 4.4, reviews: 41, sizes: ["250g", "500g"], type: "Raw", inStock: false },
  { id: 12, name: "Pine Nuts", cat: "Nuts", catKey: "nuts", price: 1850, original: 0, rating: 4.6, reviews: 18, sizes: ["250g"], type: "Raw", inStock: false },
];
const PRICE_MIN = 200, PRICE_MAX = 2000;

/* ───────────────────────── styles ───────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
.fs-root{
  --bg:#FAF6EE; --surface:#FFFFFF; --ink:#1A2820; --muted:#6E7C70;
  --line:#E8E1D2; --primary:#2D5F3F; --primary-d:#234B31; --accent:#C97B3D;
  --accent-soft:#F4E6D5; --danger:#B5432C; --star:#E0A106; --ok:#2E8B57;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--ink);
}
.fs-root *{box-sizing:border-box}
.disp{font-family:'Fraunces',Georgia,serif}
.bg-app{background:var(--bg)} .surface{background:var(--surface)}
.bg-brand{background:var(--primary)} .bg-brand-d{background:var(--primary-d)}
.text-brand{color:var(--primary)} .text-ink{color:var(--ink)} .text-muted{color:var(--muted)}
.text-accent{color:var(--accent)} .text-danger{color:var(--danger)} .text-star{color:var(--star)} .text-ok{color:var(--ok)}
.bg-accent-soft{background:var(--accent-soft)} .bg-brand-soft{background:#EAF1EA}
.bdr{border:1px solid var(--line)} .bdr-b{border-bottom:1px solid var(--line)} .bdr-t{border-top:1px solid var(--line)}
.aspect-prod{aspect-ratio:3/4}
.tap{transition:transform .15s ease,opacity .15s ease,background .15s ease} .tap:active{transform:scale(.97)}
.press{transition:background .15s ease,box-shadow .15s ease,color .15s ease}
.no-sb::-webkit-scrollbar{display:none} .no-sb{scrollbar-width:none}
.chip-x{transition:background .15s ease}
.sheet{transition:transform .28s cubic-bezier(.32,.72,0,1)}
.scrim{transition:opacity .28s ease}
.bump{animation:bump .3s ease}
@keyframes bump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
.toast-in{animation:toastin .25s ease}
@keyframes toastin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.rng{ -webkit-appearance:none;appearance:none;position:absolute;width:100%;height:24px;background:none;pointer-events:none;margin:0 }
.rng::-webkit-slider-thumb{ -webkit-appearance:none;appearance:none;height:22px;width:22px;border-radius:50%;background:var(--primary);border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer;pointer-events:auto }
.rng::-moz-range-thumb{ height:18px;width:18px;border-radius:50%;background:var(--primary);border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer;pointer-events:auto }
.fade-in{animation:fadein .3s ease}
@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){ .tap,.press,.sheet,.scrim,.bump,.toast-in,.fade-in{animation:none!important;transition:none!important} }
`;

/* ───────────────────────── small components ───────────────────────── */
function Stars({ r }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star size={12} className="text-star" fill="currentColor" />
      <span className="text-xs font-semibold text-ink">{r}</span>
    </span>
  );
}

function PriceRange({ value, onChange }) {
  const [lo, hi] = value;
  const pct = (v) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-ink">{taka(lo)}</span>
        <span className="text-xs text-muted">to</span>
        <span className="text-sm font-semibold text-ink">{taka(hi)}{hi >= PRICE_MAX ? "+" : ""}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute h-1.5 w-full rounded-full" style={{ background: "var(--line)" }} />
        <div className="absolute h-1.5 rounded-full bg-brand" style={{ left: pct(lo) + "%", right: 100 - pct(hi) + "%" }} />
        <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={20} value={lo} className="rng"
          onChange={(e) => onChange([Math.min(+e.target.value, hi - 20), hi])} />
        <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={20} value={hi} className="rng"
          onChange={(e) => onChange([lo, Math.max(+e.target.value, lo + 20)])} />
      </div>
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button onClick={onClick}
      className="tap press px-3.5 rounded-full text-sm font-medium bdr"
      style={{
        minHeight: 40,
        background: active ? "var(--primary)" : "var(--surface)",
        color: active ? "#fff" : "var(--ink)",
        borderColor: active ? "var(--primary)" : "var(--line)",
      }}>
      {children}
    </button>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} aria-pressed={on}
      className="press rounded-full relative" style={{ width: 46, height: 28, background: on ? "var(--primary)" : "#cfcabb" }}>
      <span className="absolute rounded-full surface" style={{
        width: 22, height: 22, top: 3, left: on ? 21 : 3, transition: "left .2s ease", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
      }} />
    </button>
  );
}

function ProductCard({ p, onAdd, big }) {
  const disc = p.original ? Math.round((1 - p.price / p.original) * 100) : 0;
  const [wish, setWish] = useState(false);
  return (
    <div className="surface rounded-2xl overflow-hidden bdr fade-in" style={{ boxShadow: "0 1px 3px rgba(26,40,32,.06)" }}>
      <div className="relative aspect-prod" style={{ background: TINT[p.catKey] }}>
        <Leaf size={big ? 56 : 40} className="absolute" style={{ color: "rgba(45,95,63,.18)", right: 10, bottom: 10 }} />
        <div className="absolute flex flex-col gap-1" style={{ top: 8, left: 8 }}>
          {disc > 0 && <span className="text-xs font-bold rounded-md px-1.5 py-0.5" style={{ background: "var(--danger)", color: "#fff" }}>-{disc}%</span>}
          {!p.inStock && <span className="text-xs font-semibold rounded-md px-1.5 py-0.5" style={{ background: "rgba(26,40,32,.7)", color: "#fff" }}>Out of stock</span>}
        </div>
        <button onClick={() => setWish((w) => !w)} aria-label="Add to wishlist"
          className="tap absolute surface rounded-full flex items-center justify-center"
          style={{ top: 8, right: 8, width: 36, height: 36, boxShadow: "0 1px 4px rgba(0,0,0,.12)" }}>
          <Heart size={17} className={wish ? "text-danger" : "text-muted"} fill={wish ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-3">
        <div className="text-xs text-accent font-semibold mb-0.5">{p.cat}</div>
        <div className="text-sm font-semibold text-ink leading-snug" style={{ minHeight: 38 }}>{p.name}</div>
        <div className="flex items-center gap-2 mt-1 mb-2">
          <Stars r={p.rating} />
          <span className="text-xs text-muted">({p.reviews})</span>
        </div>
        <div className="flex items-end justify-between">
          <div className="leading-none">
            <span className="text-base font-bold text-brand disp">{taka(p.price)}</span>
            {p.original > 0 && <span className="text-xs text-muted ml-1.5 line-through">{taka(p.original)}</span>}
          </div>
          <button disabled={!p.inStock} onClick={() => p.inStock && onAdd(p)} aria-label="Add to bag"
            className="tap press rounded-xl flex items-center justify-center"
            style={{ width: 40, height: 40, background: p.inStock ? "var(--primary)" : "#d8d3c6", color: "#fff" }}>
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── shared filter engine (hook) ───────────────────────── */
function useListing() {
  const [sort, setSort] = useState("popular");
  const [selSizes, setSizes] = useState([]);
  const [selTypes, setTypes] = useState([]);
  const [selCats, setCats] = useState([]);
  const [inStockOnly, setInStock] = useState(false);
  const [price, setPrice] = useState([PRICE_MIN, PRICE_MAX]);
  const [page, setPage] = useState(1);
  const priceTouched = price[0] !== PRICE_MIN || price[1] !== PRICE_MAX;

  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let r = PRODUCTS.filter((p) => {
      if (p.price < price[0] || p.price > price[1]) return false;
      if (selSizes.length && !p.sizes.some((s) => selSizes.includes(s))) return false;
      if (selTypes.length && !selTypes.includes(p.type)) return false;
      if (selCats.length && !selCats.includes(p.catKey)) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });
    const cmp = {
      popular: (a, b) => b.reviews - a.reviews,
      new: (a, b) => b.id - a.id,
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      name_asc: (a, b) => a.name.localeCompare(b.name),
      name_desc: (a, b) => b.name.localeCompare(a.name),
    }[sort];
    return [...r].sort(cmp);
  }, [sort, selSizes, selTypes, selCats, inStockOnly, price]);

  useEffect(() => { setPage(1); }, [sort, selSizes, selTypes, selCats, inStockOnly, price]);

  const activeCount = selSizes.length + selTypes.length + selCats.length + (inStockOnly ? 1 : 0) + (priceTouched ? 1 : 0);
  const reset = () => { setSizes([]); setTypes([]); setCats([]); setInStock(false); setPrice([PRICE_MIN, PRICE_MAX]); };

  const chips = [
    ...selCats.map((c) => ({ k: "cat:" + c, label: CATS.find((x) => x.key === c)?.label, rm: () => toggle(selCats, setCats, c) })),
    ...selSizes.map((s) => ({ k: "size:" + s, label: s, rm: () => toggle(selSizes, setSizes, s) })),
    ...selTypes.map((t) => ({ k: "type:" + t, label: t, rm: () => toggle(selTypes, setTypes, t) })),
    ...(inStockOnly ? [{ k: "stock", label: "In stock", rm: () => setInStock(false) }] : []),
    ...(priceTouched ? [{ k: "price", label: `${taka(price[0])}–${taka(price[1])}`, rm: () => setPrice([PRICE_MIN, PRICE_MAX]) }] : []),
  ];

  return { sort, setSort, selSizes, setSizes, selTypes, setTypes, selCats, setCats, inStockOnly, setInStock,
    price, setPrice, page, setPage, filtered, activeCount, reset, toggle, chips, priceTouched };
}

/* ───────────────────────── filter form (reused mobile sheet + desktop sidebar) ───────────────────────── */
function FilterControls({ L }) {
  const Section = ({ title, children }) => (
    <div className="py-4 bdr-b">
      <div className="text-sm font-bold text-ink mb-3 disp">{title}</div>
      {children}
    </div>
  );
  return (
    <div>
      <Section title="Price Range">
        <PriceRange value={L.price} onChange={L.setPrice} />
      </Section>
      <Section title="Category">
        <div className="flex flex-col gap-1">
          {CATS.map((c) => {
            const on = L.selCats.includes(c.key);
            return (
              <button key={c.key} onClick={() => L.toggle(L.selCats, L.setCats, c.key)}
                className="tap flex items-center gap-3 py-2 text-left" style={{ minHeight: 40 }}>
                <span className="rounded-md flex items-center justify-center bdr"
                  style={{ width: 22, height: 22, background: on ? "var(--primary)" : "var(--surface)", borderColor: on ? "var(--primary)" : "var(--line)" }}>
                  {on && <Check size={15} className="text-white" />}
                </span>
                <span className="text-sm text-ink">{c.label}</span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Weight / Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => <Pill key={s} active={L.selSizes.includes(s)} onClick={() => L.toggle(L.selSizes, L.setSizes, s)}>{s}</Pill>)}
        </div>
      </Section>
      <Section title="Type">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => <Pill key={t} active={L.selTypes.includes(t)} onClick={() => L.toggle(L.selTypes, L.setTypes, t)}>{t}</Pill>)}
        </div>
      </Section>
      <div className="py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink disp">In stock only</div>
          <div className="text-xs text-muted">Hide out-of-stock items</div>
        </div>
        <Toggle on={L.inStockOnly} onChange={L.setInStock} />
      </div>
    </div>
  );
}

/* ───────────────────────── MOBILE VIEW ───────────────────────── */
function MobileView({ L, cart, addToCart, toast }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const perPage = 6;
  const pages = Math.max(1, Math.ceil(L.filtered.length / perPage));
  const items = L.filtered.slice((L.page - 1) * perPage, L.page * perPage);
  const sortLabel = SORTS.find((s) => s.k === L.sort)?.label;

  return (
    <div className="relative mx-auto bg-app overflow-hidden bdr"
      style={{ width: 390, height: 760, borderRadius: 38, boxShadow: "0 24px 60px rgba(26,40,32,.22)" }}>
      <div className="relative h-full overflow-hidden" style={{ borderRadius: 36 }}>
        {/* scroll area */}
        <div className="h-full overflow-y-auto no-sb">
          {/* header */}
          <div className="surface bdr-b sticky top-0 z-20">
            <div className="flex items-center gap-2 px-4" style={{ height: 56, paddingTop: 4 }}>
              <button className="tap flex items-center justify-center" style={{ width: 40, height: 40, marginLeft: -8 }} aria-label="Back">
                <ChevronLeft size={24} className="text-ink" />
              </button>
              <div className="flex-1">
                <div className="text-base font-bold text-ink disp leading-tight">Nuts & Seeds</div>
                <div className="text-xs text-muted">{L.filtered.length} products</div>
              </div>
              <button className="tap flex items-center justify-center" style={{ width: 40, height: 40 }} aria-label="Search">
                <Search size={21} className="text-ink" />
              </button>
              <button className="tap relative flex items-center justify-center" style={{ width: 40, height: 40 }} aria-label="Bag">
                <ShoppingBag size={21} className="text-ink" />
                {cart > 0 && <span className="absolute text-white text-xs font-bold rounded-full flex items-center justify-center bump"
                  style={{ background: "var(--primary)", minWidth: 18, height: 18, top: 2, right: 2, fontSize: 10 }} key={cart}>{cart}</span>}
              </button>
            </div>
          </div>

          {/* sticky filter/sort bar */}
          <div className="surface sticky z-20 bdr-b" style={{ top: 56 }}>
            <div className="flex gap-2 px-4 py-2.5">
              <button onClick={() => setFilterOpen(true)}
                className="tap press flex-1 flex items-center justify-center gap-2 rounded-xl bdr font-medium text-sm"
                style={{ height: 44, background: L.activeCount ? "var(--primary)" : "var(--surface)", color: L.activeCount ? "#fff" : "var(--ink)", borderColor: L.activeCount ? "var(--primary)" : "var(--line)" }}>
                <SlidersHorizontal size={17} /> Filter
                {L.activeCount > 0 && <span className="rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ background: "#fff", color: "var(--primary)", minWidth: 18, height: 18 }}>{L.activeCount}</span>}
              </button>
              <button onClick={() => setSortOpen(true)}
                className="tap press flex-1 flex items-center justify-center gap-2 rounded-xl bdr font-medium text-sm surface text-ink"
                style={{ height: 44 }}>
                <ArrowUpDown size={16} /> {sortLabel}
              </button>
            </div>
            {L.chips.length > 0 && (
              <div className="flex gap-2 px-4 pb-2.5 overflow-x-auto no-sb">
                {L.chips.map((c) => (
                  <button key={c.k} onClick={c.rm}
                    className="chip-x flex items-center gap-1 rounded-full bg-brand-soft text-brand text-xs font-medium px-2.5 whitespace-nowrap"
                    style={{ height: 30 }}>
                    {c.label} <X size={13} />
                  </button>
                ))}
                <button onClick={L.reset} className="text-xs font-semibold text-danger px-2 whitespace-nowrap" style={{ height: 30 }}>Clear all</button>
              </div>
            )}
          </div>

          {/* grid */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-8" style={{ height: 360 }}>
              <div className="rounded-full bg-brand-soft flex items-center justify-center mb-3" style={{ width: 64, height: 64 }}>
                <Search size={26} className="text-brand" />
              </div>
              <div className="font-bold text-ink disp">No products found</div>
              <div className="text-sm text-muted mt-1">Try loosening your filters</div>
              <button onClick={L.reset} className="tap mt-4 rounded-full bg-brand text-white text-sm font-semibold px-5" style={{ height: 42 }}>Reset filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4">
              {items.map((p) => <ProductCard key={p.id} p={p} onAdd={addToCart} />)}
            </div>
          )}

          {/* pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-5 pt-1">
              <button disabled={L.page === 1} onClick={() => L.setPage(L.page - 1)}
                className="tap surface bdr rounded-lg flex items-center justify-center" style={{ width: 40, height: 40, opacity: L.page === 1 ? .4 : 1 }}>
                <ChevronLeft size={18} className="text-ink" />
              </button>
              {Array.from({ length: pages }).map((_, i) => (
                <button key={i} onClick={() => L.setPage(i + 1)}
                  className="tap rounded-lg flex items-center justify-center text-sm font-semibold bdr"
                  style={{ width: 40, height: 40, background: L.page === i + 1 ? "var(--primary)" : "var(--surface)", color: L.page === i + 1 ? "#fff" : "var(--ink)", borderColor: L.page === i + 1 ? "var(--primary)" : "var(--line)" }}>
                  {i + 1}
                </button>
              ))}
              <button disabled={L.page === pages} onClick={() => L.setPage(L.page + 1)}
                className="tap surface bdr rounded-lg flex items-center justify-center" style={{ width: 40, height: 40, opacity: L.page === pages ? .4 : 1 }}>
                <ChevronRight size={18} className="text-ink" />
              </button>
            </div>
          )}
          <div style={{ height: 64 }} />
        </div>

        {/* bottom nav */}
        <div className="absolute left-0 right-0 bottom-0 surface bdr-t flex items-center justify-around z-20" style={{ height: 60 }}>
          {[{ i: Home, l: "Home", a: false }, { i: LayoutGrid, l: "Category", a: true }, { i: ShoppingBag, l: "Bag", a: false }, { i: Heart, l: "Wishlist", a: false }, { i: User, l: "Profile", a: false }].map((n, idx) => (
            <button key={idx} className="tap flex flex-col items-center justify-center gap-0.5" style={{ width: 56, height: 56 }}>
              <n.i size={21} className={n.a ? "text-brand" : "text-muted"} fill={n.a ? "currentColor" : "none"} strokeWidth={n.a ? 1.5 : 2} />
              <span className="text-xs" style={{ color: n.a ? "var(--primary)" : "var(--muted)", fontSize: 10 }}>{n.l}</span>
            </button>
          ))}
        </div>

        {/* toast */}
        {toast && (
          <div className="absolute left-1/2 toast-in z-40" style={{ bottom: 74, transform: "translateX(-50%)" }}>
            <div className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white" style={{ background: "var(--ink)", boxShadow: "0 6px 20px rgba(0,0,0,.25)" }}>
              <Check size={16} className="text-ok" /> Added to bag
            </div>
          </div>
        )}

        {/* FILTER SHEET */}
        <div className="absolute inset-0 z-30" style={{ pointerEvents: filterOpen ? "auto" : "none" }}>
          <div className="scrim absolute inset-0" style={{ background: "rgba(26,40,32,.5)", opacity: filterOpen ? 1 : 0 }} onClick={() => setFilterOpen(false)} />
          <div className="sheet surface absolute left-0 right-0 bottom-0 flex flex-col"
            style={{ maxHeight: "88%", borderTopLeftRadius: 24, borderTopRightRadius: 24, transform: filterOpen ? "translateY(0)" : "translateY(100%)" }}>
            <div className="pt-2.5 flex justify-center"><span className="rounded-full" style={{ width: 40, height: 4, background: "var(--line)" }} /></div>
            <div className="flex items-center justify-between px-5 py-3 bdr-b">
              <span className="text-lg font-bold text-ink disp">Filters</span>
              <button onClick={L.reset} className="tap flex items-center gap-1 text-sm font-semibold text-danger"><RotateCcw size={15} /> Reset</button>
            </div>
            <div className="px-5 overflow-y-auto no-sb flex-1"><FilterControls L={L} /></div>
            <div className="p-4 bdr-t surface">
              <button onClick={() => setFilterOpen(false)}
                className="tap w-full rounded-full bg-brand text-white font-bold disp flex items-center justify-center" style={{ height: 52 }}>
                Show {L.filtered.length} products
              </button>
            </div>
          </div>
        </div>

        {/* SORT SHEET */}
        <div className="absolute inset-0 z-30" style={{ pointerEvents: sortOpen ? "auto" : "none" }}>
          <div className="scrim absolute inset-0" style={{ background: "rgba(26,40,32,.5)", opacity: sortOpen ? 1 : 0 }} onClick={() => setSortOpen(false)} />
          <div className="sheet surface absolute left-0 right-0 bottom-0 flex flex-col"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, transform: sortOpen ? "translateY(0)" : "translateY(100%)" }}>
            <div className="pt-2.5 flex justify-center"><span className="rounded-full" style={{ width: 40, height: 4, background: "var(--line)" }} /></div>
            <div className="px-5 py-3 bdr-b"><span className="text-lg font-bold text-ink disp">Sort by</span></div>
            <div className="px-3 py-2 pb-5">
              {SORTS.map((s) => {
                const on = L.sort === s.k;
                return (
                  <button key={s.k} onClick={() => { L.setSort(s.k); setSortOpen(false); }}
                    className="tap w-full flex items-center justify-between px-2 rounded-xl" style={{ height: 50, background: on ? "var(--bg)" : "transparent" }}>
                    <span className="text-sm font-medium" style={{ color: on ? "var(--primary)" : "var(--ink)" }}>{s.label}</span>
                    <span className="rounded-full flex items-center justify-center bdr" style={{ width: 22, height: 22, borderColor: on ? "var(--primary)" : "var(--line)", background: on ? "var(--primary)" : "transparent" }}>
                      {on && <Check size={14} className="text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── DESKTOP VIEW ───────────────────────── */
function DesktopView({ L, cart, addToCart }) {
  const perPage = 8;
  const pages = Math.max(1, Math.ceil(L.filtered.length / perPage));
  const items = L.filtered.slice((L.page - 1) * perPage, L.page * perPage);
  return (
    <div className="mx-auto surface bdr overflow-hidden" style={{ maxWidth: 1100, borderRadius: 20, boxShadow: "0 16px 50px rgba(26,40,32,.14)" }}>
      {/* top bar */}
      <div className="bdr-b flex items-center gap-3 px-6" style={{ height: 64 }}>
        <Leaf size={22} className="text-brand" />
        <span className="text-lg font-bold text-brand disp">FruitSnacks</span>
        <div className="flex-1 mx-4 max-w-md">
          <div className="flex items-center gap-2 bg-app rounded-full px-4" style={{ height: 42 }}>
            <Search size={17} className="text-muted" />
            <span className="text-sm text-muted">Search dates, nuts...</span>
          </div>
        </div>
        <button className="tap relative flex items-center justify-center bg-app rounded-full" style={{ width: 42, height: 42 }}>
          <ShoppingBag size={19} className="text-ink" />
          {cart > 0 && <span className="absolute text-white text-xs font-bold rounded-full flex items-center justify-center" style={{ background: "var(--primary)", minWidth: 18, height: 18, top: 0, right: 0, fontSize: 10 }}>{cart}</span>}
        </button>
      </div>
      <div className="flex">
        {/* sidebar */}
        <aside className="p-5 bg-app" style={{ width: 280, borderRight: "1px solid var(--line)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-base font-bold text-ink disp">Filters</span>
            {L.activeCount > 0 && <button onClick={L.reset} className="tap text-xs font-semibold text-danger">Reset</button>}
          </div>
          <FilterControls L={L} />
        </aside>
        {/* main */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-ink disp">Nuts & Seeds</h1>
              <div className="text-sm text-muted">{L.filtered.length} products found</div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-muted" />
              <select value={L.sort} onChange={(e) => L.setSort(e.target.value)}
                className="surface bdr rounded-xl px-3 text-sm font-medium text-ink" style={{ height: 42 }}>
                {SORTS.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {L.chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {L.chips.map((c) => (
                <button key={c.k} onClick={c.rm} className="chip-x flex items-center gap-1 rounded-full bg-brand-soft text-brand text-xs font-medium px-3" style={{ height: 30 }}>
                  {c.label} <X size={13} />
                </button>
              ))}
            </div>
          )}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center" style={{ height: 320 }}>
              <Search size={30} className="text-muted mb-2" />
              <div className="font-bold text-ink disp">No products found</div>
              <button onClick={L.reset} className="tap mt-3 rounded-full bg-brand text-white text-sm font-semibold px-5" style={{ height: 40 }}>Reset filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {items.map((p) => <ProductCard key={p.id} p={p} onAdd={addToCart} />)}
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: pages }).map((_, i) => (
                <button key={i} onClick={() => L.setPage(i + 1)}
                  className="tap rounded-lg flex items-center justify-center text-sm font-semibold bdr" style={{ width: 40, height: 40, background: L.page === i + 1 ? "var(--primary)" : "var(--surface)", color: L.page === i + 1 ? "#fff" : "var(--ink)", borderColor: L.page === i + 1 ? "var(--primary)" : "var(--line)" }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ───────────────────────── ROOT ───────────────────────── */
export default function FruitSnacksFilterPage() {
  const [view, setView] = useState("mobile");
  const [cart, setCart] = useState(0);
  const [toast, setToast] = useState(false);
  const tRef = useRef();
  const L = useListing(); // single shared engine for both views

  const addToCart = () => {
    setCart((c) => c + 1);
    setToast(true);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToast(false), 1600);
  };

  return (
    <div className="fs-root bg-app" style={{ minHeight: "100vh", padding: "20px 16px 48px" }}>
      <style>{CSS}</style>
      {/* control bar */}
      <div className="mx-auto flex items-center justify-between mb-6 flex-wrap gap-3" style={{ maxWidth: 1100 }}>
        <div>
          <div className="text-lg font-bold text-ink disp">FruitSnacks · Filter Page Mockup</div>
          <div className="text-sm text-muted">Shared PLP engine — mobile & desktop run the same filter/sort logic</div>
        </div>
        <div className="surface bdr rounded-full p-1 flex items-center gap-1">
          <button onClick={() => setView("mobile")}
            className="tap flex items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold" style={{ height: 38, background: view === "mobile" ? "var(--primary)" : "transparent", color: view === "mobile" ? "#fff" : "var(--ink)" }}>
            <Smartphone size={16} /> Mobile
          </button>
          <button onClick={() => setView("desktop")}
            className="tap flex items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold" style={{ height: 38, background: view === "desktop" ? "var(--primary)" : "transparent", color: view === "desktop" ? "#fff" : "var(--ink)" }}>
            <Monitor size={16} /> Desktop
          </button>
        </div>
      </div>

      {view === "mobile"
        ? <MobileView L={L} cart={cart} addToCart={addToCart} toast={toast} />
        : <DesktopView L={L} cart={cart} addToCart={addToCart} />}

      {/* trust footer note */}
      <div className="mx-auto mt-8 flex items-center justify-center gap-6 flex-wrap text-xs text-muted" style={{ maxWidth: 1100 }}>
        <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-brand" /> 100% Authentic</span>
        <span className="flex items-center gap-1.5"><Truck size={15} className="text-brand" /> 2-hour delivery in Dhaka</span>
        <span className="flex items-center gap-1.5"><RotateCcw size={15} className="text-brand" /> 7-day returns</span>
      </div>
    </div>
  );
}
