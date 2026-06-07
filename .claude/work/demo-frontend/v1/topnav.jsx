/* FruitSnacks — Top bar, Navbar, Search dropdown, Mega menu, Drawer */

function TopBar() {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ANNOUNCE.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="topbar" lang="bn">
      <div className="container">
        <div className="topbar-rot bn">
          {ANNOUNCE.map((a, idx) => (
            <span key={idx} className={idx === i ? "on" : ""}>{a}</span>
          ))}
        </div>
        <div className="topbar-center bn">
          <Icon name="pin" size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
          ঢাকা সহ সারা দেশে ডেলিভারি
        </div>
        <div className="topbar-right">
          <a href="#"><Icon name="phone" size={14} /> +880 1700-000000</a>
          <span className="topbar-div" />
          <a href="#" className="bn">অর্ডার ট্র্যাক করুন <Icon name="arrow" size={13} /></a>
        </div>
      </div>
    </div>
  );
}

function SearchDropdown({ query, onPick }) {
  const q = query.trim();
  const results = React.useMemo(() => {
    if (!q) return [];
    return ALL_PRODUCTS.filter((p) => p.name.includes(q) || p.cat.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  }, [q]);
  const catMatches = React.useMemo(() => {
    if (!q) return [];
    return CATEGORIES.filter((c) => c.name.includes(q)).slice(0, 3);
  }, [q]);

  if (!q) {
    return (
      <React.Fragment>
        <div className="sd-sec">
          <div className="sd-eyebrow bn"><Icon name="clock" size={13} /> সাম্প্রতিক খোঁজ</div>
          <div className="sd-pills">
            {RECENT.map((r) => (
              <button key={r} className="pill bn" onClick={() => onPick(r)}>{r}</button>
            ))}
            <button className="clear bn">সব মুছুন ✕</button>
          </div>
        </div>
        <div className="sd-sec">
          <div className="sd-eyebrow bn"><Icon name="fire" size={13} /> জনপ্রিয় খোঁজ</div>
          <div className="sd-pills">
            {POPULAR.map((r) => (
              <button key={r} className="pill bn" onClick={() => onPick(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="sd-sec">
          <div className="sd-eyebrow bn"><Icon name="gift" size={13} /> আপনার জন্য বাছাই</div>
          <div className="sd-mini-row">
            {PRODUCTS.bestsellers.map((p) => (
              <a key={p.id} href="#" className="sd-mini">
                <Ph label={p.ph} tone={p.tone} />
                <div className="nm bn-serif">{p.name.split("—")[0]}</div>
                <div className="pr">{CUR} {p.price}</div>
              </a>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  }

  if (results.length === 0 && catMatches.length === 0) {
    return (
      <div className="sd-sec">
        <div className="sd-nomatch">
          <span className="nm-ico"><Icon name="search" size={44} sw={1.3} /></span>
          <div className="nm-title bn-serif">"{q}" পাওয়া যায়নি</div>
          <div className="nm-sub bn">চেষ্টা করুন:</div>
          <div className="sd-pills" style={{ justifyContent: "center" }}>
            {POPULAR.map((r) => (
              <button key={r} className="pill bn" onClick={() => onPick(r)}>{r}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="sd-sec">
        <div className="sd-head-count bn">{results.length}টি পণ্য পাওয়া গেছে <b>"{q}"</b> এর জন্য</div>
        {results.map((p) => (
          <a key={p.id} href="#" className="sd-result">
            <Ph label="" tone={p.tone} />
            <div>
              <div className="r-name bn-serif">{p.name}</div>
              <div className="r-price">{CUR} {p.price}{p.was ? <s style={{ marginLeft: 6, color: "var(--whisper)" }}>{CUR} {p.was}</s> : null}</div>
            </div>
            <Icon name="chevron" size={16} className="r-arrow" />
          </a>
        ))}
      </div>
      {catMatches.length > 0 && (
        <div className="sd-sec">
          <div className="sd-eyebrow bn"><Icon name="folder" size={13} /> ক্যাটাগরিতে</div>
          {catMatches.map((c) => (
            <a key={c.slug} href="#" className="sd-cat-row">
              <span className="c-ico"><Icon name="folder" size={18} /></span>
              <span className="bn">{c.name} ({c.count})</span>
            </a>
          ))}
        </div>
      )}
      <div className="sd-sec" style={{ paddingBlock: 6 }}>
        <a href="#" className="sd-all bn">→ "{q}" এর সব ফলাফল দেখুন</a>
      </div>
    </React.Fragment>
  );
}

function Navbar({ onOpenDrawer }) {
  const shop = useShop();
  const [scrolled, setScrolled] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [ph, setPh] = React.useState(0);
  const [mega, setMega] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  React.useEffect(() => {
    const t = setInterval(() => setPh((v) => (v + 1) % SEARCH_PLACEHOLDERS.length), 4000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "")} onMouseLeave={() => setMega(false)}>
      <div className="container nav-inner">
        <button className="icon-btn hamburger" aria-label="Menu" onClick={onOpenDrawer}>
          <Icon name="menu" size={22} />
        </button>
        <a href="#" className="logo" aria-label="FruitSnacks home">
          <span className="logo-mark"><Icon name="leaf" size={26} /></span>
          <span className="logo-word">FruitSnacks</span>
        </a>

        <div className="nav-search" ref={wrapRef}>
          <div className="search-box">
            <span className="search-ico"><Icon name="search" size={18} /></span>
            <input
              lang="bn" className="bn"
              value={query}
              placeholder={SEARCH_PLACEHOLDERS[ph]}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              aria-label="পণ্য খুঁজুন"
            />
          </div>
          <div className={"search-drop" + (focused ? " open" : "")} role="listbox">
            <SearchDropdown query={query} onPick={(v) => setQuery(v)} />
          </div>
        </div>

        <div className="nav-links">
          <div onMouseEnter={() => setMega(true)} style={{ display: "inline-flex" }}>
            <a href="#" className="nav-link bn">শপ</a>
          </div>
          <a href="#" className="nav-link bn" onMouseEnter={() => setMega(false)}>অফার</a>
          <a href="#" className="nav-link bn" onMouseEnter={() => setMega(false)}>আমাদের গল্প</a>
        </div>

        <div className="nav-right">
          <span className="nav-vdiv" />
          <button className="icon-btn hide-mobile" aria-label="Account"><Icon name="user" size={21} /></button>
          <button className="icon-btn hide-mobile" aria-label="Wishlist">
            <Icon name="heart" size={21} />
            {shop.wish > 0 && <span className="count-badge">{shop.wish}</span>}
          </button>
          <button className="icon-btn" aria-label="Cart">
            <Icon name="bag" size={21} />
            {shop.cart > 0 && <span className="count-badge honey">{shop.cart}</span>}
          </button>
        </div>
      </div>

      <div className={"mega" + (mega ? " open" : "")} onMouseEnter={() => setMega(true)}>
        <div className="container mega-grid">
          <div>
            <h4>টপ ক্যাটাগরি</h4>
            {CATEGORIES.slice(0, 5).map((c) => (
              <a key={c.slug} href="#" className="mega-cat">
                <Ph label="" tone={c.tone} className="thumb" />
                <span className="cat-name bn-serif">{c.name}</span>
              </a>
            ))}
          </div>
          <div>
            <h4>ফিচার্ড পণ্য</h4>
            <div className="mega-feat">
              {PRODUCTS.trending.map((p) => (
                <a key={p.id} href="#" className="mini">
                  <Ph label={p.ph} tone={p.tone} />
                  <div className="meta">
                    <div className="nm bn-serif">{p.name.split("—")[0]}</div>
                    <div className="pr">{CUR} {p.price}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <a href="#" className="mega-promo">
            <Ph label="শীতকালীন বক্স · ফ্ল্যাট-লে" tone="tone-deep" />
            <div className="promo-body">
              <div className="pt bn-serif">শীতকালীন<br />কালেকশন</div>
              <div className="link-more bn" style={{ marginTop: 12 }}>সব দেখুন <Icon name="arrow" size={15} className="arrow" /></div>
            </div>
          </a>
        </div>
      </div>
    </nav>
  );
}

function Drawer({ open, onClose }) {
  React.useEffect(() => {
    document.body.classList.toggle("body-lock", open);
  }, [open]);
  return (
    <React.Fragment>
      <div className={"drawer-scrim" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="logo">
            <span className="logo-mark"><Icon name="leaf" size={24} /></span>
            <span className="logo-word">FruitSnacks</span>
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={22} /></button>
        </div>
        <a href="#" className="d-link bn-serif" onClick={onClose}>শপ</a>
        <a href="#" className="d-link bn-serif" onClick={onClose}>অফার</a>
        <a href="#" className="d-link bn-serif" onClick={onClose}>আমাদের গল্প</a>
        <a href="#" className="d-link bn-serif" onClick={onClose}>বান্ডল অফার</a>
        <a href="#" className="d-link bn-serif" onClick={onClose}>অর্ডার ট্র্যাক</a>
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <a href="#" className="btn btn-primary bn" style={{ width: "100%", justifyContent: "center" }}>
            <Icon name="user" size={18} /> লগইন / সাইন আপ
          </a>
        </div>
      </aside>
    </React.Fragment>
  );
}

Object.assign(window, { TopBar, Navbar, Drawer });
