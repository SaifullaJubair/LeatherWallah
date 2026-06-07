/* FruitSnacks V2 — top bar + navbar + nested mega-menu + search + drawer */

function TopBar() {
  const [i, setI] = React.useState(0);
  const [out, setOut] = React.useState(false);
  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => {
      setOut(true);
      setTimeout(() => { setI((p) => (p + 1) % ANNOUNCE.length); setOut(false); }, 300);
    }, 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="topbar">
      <div className="container">
        <div className="topbar-rot">
          {ANNOUNCE.map((a, k) => (
            <span key={k} className={(k === i ? (out ? "out" : "on") : "")}>
              <Spark size={11} color="var(--accent)" />{a}
            </span>
          ))}
        </div>
        <div className="topbar-center">
          <span className="flag" aria-hidden="true" style={{ background: "linear-gradient(#006a4e 0 60%, #f42a41 60% 100%)", position: "relative" }}>
            <span style={{ position: "absolute", width: 6, height: 6, borderRadius: "50%", background: "#f42a41", left: 5, top: 2 }} />
          </span>
          <span>Bangladesh</span><span style={{ opacity: .5 }}>•</span><span>৳ BDT</span>
        </div>
        <div className="topbar-right">
          <a href="#">Track Order</a>
          <span className="topbar-div" />
          <a href="#">Help</a>
          <span className="topbar-div" />
          <a href="#"><Icon name="bag" size={14} /><span>3</span></a>
        </div>
      </div>
    </div>
  );
}

/* ---- Search dropdown ---- */
function SearchDrop({ q, open, onPick }) {
  const ql = q.trim().toLowerCase();
  const results = ql
    ? ALL_PRODUCTS.filter((p) => (p.name + " " + p.cat).toLowerCase().includes(ql)).slice(0, 5)
    : [];
  return (
    <div className={"search-drop noscroll" + (open ? " open" : "")}>
      {!ql && (
        <>
          <div className="sd-sec">
            <div className="sd-eyebrow"><Icon name="clock" size={13} /> RECENT</div>
            <div className="sd-pills">
              {RECENT.map((r) => <button key={r} className="pill" onMouseDown={(e) => { e.preventDefault(); onPick(r); }}>{r}</button>)}
              <button className="clear">Clear</button>
            </div>
          </div>
          <div className="sd-sec">
            <div className="sd-eyebrow"><Spark size={12} color="var(--accent-deep)" /> POPULAR</div>
            <div className="sd-pills">
              {POPULAR.map((r) => <button key={r} className="pill" onMouseDown={(e) => { e.preventDefault(); onPick(r); }}>{r}</button>)}
            </div>
          </div>
          <div className="sd-sec">
            <div className="sd-eyebrow"><Spark size={12} color="var(--accent-deep)" /> TRENDING NOW</div>
            <div className="sd-mini-row noscroll">
              {PRODUCTS.trending.map((p) => (
                <a key={p.id} href="#" className="sd-mini">
                  <Ph label={p.ph} tone={p.tone} />
                  <div className="nm">{p.name}</div>
                  <div className="pr">{CUR} {p.price}</div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
      {ql && (
        <div className="sd-sec">
          {results.length > 0 ? (
            <>
              <div className="sd-head-count">Found <b>{results.length}</b> matches</div>
              {results.map((p) => (
                <a key={p.id} href="#" className="sd-result">
                  <Ph label="" tone={p.tone} />
                  <div>
                    <div className="r-name">{p.name}</div>
                    <div className="r-price">{CUR} {p.price}</div>
                  </div>
                  <Icon name="arrow" size={16} className="r-arrow" />
                </a>
              ))}
              <a href="#" className="sd-all">See all results <Icon name="arrow" size={15} /></a>
            </>
          ) : (
            <div className="sd-nomatch">
              <span className="nm-ico"><Icon name="search" size={28} color="var(--primary-soft)" /></span>
              <div className="nm-title">No matches for "{q}"</div>
              <div className="nm-sub">Try a category or browse our editor's picks.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Mega menu ---- */
function MegaMenu({ which, onClose }) {
  const data = MEGA[which];
  const [pi, setPi] = React.useState(0);
  const [si, setSi] = React.useState(0);
  React.useEffect(() => { setPi(0); setSi(0); }, [which]);
  if (!data) return null;
  const parent = data.parents[pi] || data.parents[0];
  const sub = parent.subs[si] || parent.subs[0];
  return (
    <div className="mega open" onMouseLeave={onClose}>
      <div className="container">
        <div className="mega-grid">
          <div className="mega-col">
            <h4>Categories</h4>
            {data.parents.map((p, k) => (
              <button key={p.name} className={"mega-item" + (k === pi ? " active" : "")}
                onMouseEnter={() => { setPi(k); setSi(0); }}>
                {p.name}<Icon name="chevron" size={15} className="mi-chev" />
              </button>
            ))}
          </div>
          <div className="mega-col">
            <h4>{parent.name}</h4>
            <div className="mega-reveal" key={"sub" + pi}>
              {parent.subs.map((s, k) => (
                <button key={s.name} className={"mega-item" + (k === si ? " active" : "")}
                  onMouseEnter={() => setSi(k)}>
                  {s.name}<Icon name="chevron" size={15} className="mi-chev" />
                </button>
              ))}
            </div>
          </div>
          <div className="mega-col">
            <h4>{sub.name}</h4>
            <div className="mega-reveal" key={"kid" + pi + "-" + si}>
              {sub.kids.map((c) => <a key={c} href="#" className="mega-child">{c}</a>)}
            </div>
          </div>
          <div className="mega-promo">
            <Ph label={data.promo.ph} tone={data.promo.tone} />
            <div className="pbody">
              <div className="eyebrow">{data.promo.eyebrow}</div>
              <div className="pt">{data.promo.title}</div>
              <div className="ps">{data.promo.sub}</div>
              <a href="#" className="link-more" style={{ color: "var(--bg-ivory)" }}>Shop now <Icon name="arrow" size={15} className="arrow" /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { label: "SHOP", mega: "SHOP" },
  { label: "COLLECTIONS", mega: "COLLECTIONS" },
  { label: "OFFERS", mega: null },
  { label: "ABOUT", mega: null },
  { label: "JOURNAL", mega: null },
];

function Navbar({ onOpenDrawer, onOpenMobileSearch }) {
  const { cart, wish, cartBump, openCart } = useShop();
  const [scrolled, setScrolled] = React.useState(false);
  const [mega, setMega] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [sFocus, setSFocus] = React.useState(false);
  const [ph, setPh] = React.useState(0);
  const closeT = React.useRef(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => {
    const t = setInterval(() => setPh((p) => (p + 1) % SEARCH_PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const openMega = (m) => { clearTimeout(closeT.current); if (m) setMega(m); else setMega(null); };
  const scheduleClose = () => { closeT.current = setTimeout(() => setMega(null), 200); };

  return (
    <header className={"nav" + (scrolled ? " scrolled" : "")} onMouseLeave={scheduleClose}>
      <div className="container">
        <div className="nav-inner">
          <button className="icon-btn hamburger" aria-label="Menu" onClick={onOpenDrawer}><Icon name="menu" size={22} /></button>
          <a href="#" className="logo" aria-label="FruitSnacks home">
            <span className="logo-emblem"><Icon name="hex" size={17} color="var(--primary)" /></span>
            <span className="logo-word">FruitSnacks</span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            {NAV_ITEMS.map((it) => (
              <a key={it.label} href="#" className={"nav-link" + (mega === it.mega && it.mega ? " active" : "")}
                onMouseEnter={() => openMega(it.mega)}>{it.label}</a>
            ))}
          </nav>

          <div className="nav-right">
            <div className="nav-search" onMouseEnter={() => clearTimeout(closeT.current)}>
              <div className="search-box">
                <Icon name="search" size={18} className="search-ico" />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  onFocus={() => { setSFocus(true); setMega(null); }}
                  onBlur={() => setTimeout(() => setSFocus(false), 150)}
                  placeholder={SEARCH_PLACEHOLDERS[ph]} aria-label="Search"
                />
              </div>
              <SearchDrop q={q} open={sFocus} onPick={(v) => setQ(v)} />
            </div>
            <button className="icon-btn mobile-only" aria-label="Search" onClick={onOpenMobileSearch}><Icon name="search" size={20} /></button>
            <button className="icon-btn hide-mobile" aria-label="Account"><Icon name="user" size={21} /></button>
            <button className="icon-btn hide-mobile" aria-label={"Wishlist, " + wish + " items"}>
              <Icon name="heart" size={21} />
              {wish > 0 && <span className="count-badge">{wish}</span>}
            </button>
            <button className="icon-btn" aria-label={"Bag, " + cart + " items"} onClick={openCart}>
              <Icon name="bag" size={21} />
              {cart > 0 && <span className={"count-badge" + (cartBump ? " bump" : "")}>{cart}</span>}
            </button>
          </div>
        </div>
      </div>
      {mega && <div onMouseEnter={() => clearTimeout(closeT.current)}><MegaMenu which={mega} onClose={scheduleClose} /></div>}
    </header>
  );
}

window.TopBar = TopBar;
window.Navbar = Navbar;
