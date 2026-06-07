/* FruitSnacks V2 — footer, floating chat, bottom nav, drawer, mobile search, toast */

const FOOT_COLS = [
  { h: "Shop", links: ["All Products", "Bestsellers", "New Arrivals", "Bundle Editions", "Gift Boxes", "Sale"] },
  { h: "Assist", links: ["Track Order", "Returns & Refunds", "Shipping & Delivery", "FAQ", "Customer Care", "Contact Us"] },
  { h: "Atelier", links: ["Our Story", "Quality Promise", "Sourcing Standards", "Journal (Blog)", "Wholesale Inquiries", "Press & Media"] },
  { h: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Settings", "Accessibility Statement"] },
];
const PAY = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "Amex", "SSL ✓"];
const PARTNERS = ["Pathao", "Steadfast", "RedX"];
const SOCIAL = ["fb", "ig", "wa", "yt", "tiktok", "pinterest"];

function Footer() {
  return (
    <footer className="footer bg-ink" data-screen-label="Footer">
      <div className="container">
        <div className="footer-top">
          <div className="foot-brand">
            <a href="#" className="foot-logo">
              <span className="logo-emblem" style={{ background: "rgba(212,165,116,.12)", borderColor: "var(--accent)" }}><Icon name="hex" size={16} color="var(--accent)" /></span>
              <span className="logo-word">FruitSnacks</span>
            </a>
            <p className="foot-tag">An atelier of small luxuries.<br />Crafted in Bangladesh.</p>
            <form className="foot-news" onSubmit={(e) => e.preventDefault()}>
              <input placeholder="Subscribe to journal updates" aria-label="Email" />
              <button aria-label="Join">Join <Icon name="arrow" size={14} /></button>
            </form>
            <div className="foot-social">
              {SOCIAL.map((s) => <a key={s} href="#" aria-label={s}><Icon name={s} size={17} /></a>)}
            </div>
            <div className="foot-contact">
              <div><Icon name="phone" size={15} /> +880 1700-000000</div>
              <div><Icon name="envelope" size={15} /> hello@fruitsnacks.bd</div>
              <div><Icon name="pin" size={15} /> Studio 4B, Gulshan-2, Dhaka</div>
            </div>
          </div>
          {FOOT_COLS.map((c) => (
            <div key={c.h} className="foot-col">
              <h5>{c.h}</h5>
              {c.links.map((l) => <a key={l} href="#">{l}</a>)}
            </div>
          ))}
        </div>

        <div className="foot-strip">
          <h6>WE ACCEPT</h6>
          <div className="pay-row">{PAY.map((p) => <span key={p} className="pay-box">{p}</span>)}</div>
        </div>
        <div className="foot-strip">
          <h6>DELIVERED WITH</h6>
          <div className="pay-row">{PARTNERS.map((p) => <span key={p} className="pay-box">{p}</span>)}</div>
        </div>

        <div className="foot-bottom">
          <span>© 2025 FruitSnacks Bangladesh • Crafted with care, packed by hand.</span>
          <div className="links">
            <a href="#">Terms</a><span>·</span><a href="#">Privacy</a><span>·</span><a href="#">Cookies</a><span>·</span><a href="#">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---- Floating chat stack ---- */
const FLOATS = [
  { key: "wa", ico: "wa", bg: "#25D366", tip: "WhatsApp us", pulse: true },
  { key: "msg", ico: "messenger", bg: "linear-gradient(135deg,#0084FF,#44BEC7)", tip: "Message us" },
  { key: "chat", ico: "chatdots", bg: "var(--accent-deep)", grad: true, tip: "Live chat" },
];
function FloatingChat() {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setShown(true), 400); return () => clearTimeout(t); }, []);
  return (
    <div className="floats" aria-label="Chat with us">
      {FLOATS.map((f, i) => (
        <button key={f.key} className={"float-btn" + (shown ? " in" : "")}
          style={{ background: f.grad ? undefined : f.bg, backgroundImage: f.grad ? "var(--shimmer)" : undefined, transitionDelay: (i * 0.1) + "s" }}
          aria-label={f.tip}>
          {f.pulse && <span className="float-pulse" />}
          <Icon name={f.ico} size={26} color="#fff" />
          <span className="tip">{f.tip} <Icon name="arrow" size={13} /></span>
        </button>
      ))}
    </div>
  );
}

/* ---- Mobile bottom nav ---- */
function BottomNav() {
  const { cart, wish, openCart } = useShop();
  const items = [
    { ico: "home", label: "Home", active: true },
    { ico: "grid", label: "Shop" },
    { ico: "heart", label: "Wishlist", badge: wish },
    { ico: "user", label: "Account" },
    { ico: "bag", label: "Bag", badge: cart, action: openCart },
  ];
  return (
    <nav className="botnav" aria-label="Mobile">
      {items.map((it) => (
        <a key={it.label} href="#" className={it.active ? "active" : ""}
          onClick={it.action ? (e) => { e.preventDefault(); it.action(); } : undefined}>
          {it.badge ? <span className="bn-badge">{it.badge}</span> : null}
          <Icon name={it.ico} size={21} />
          <span>{it.label}</span>
        </a>
      ))}
    </nav>
  );
}

/* ---- Mobile drawer (accordion mega) ---- */
function MobileDrawer({ open, onClose }) {
  const [exp, setExp] = React.useState(null);
  return (
    <>
      <div className={"drawer-scrim" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"drawer noscroll" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="logo-word" style={{ color: "var(--primary-deep)" }}>FruitSnacks</span>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" size={22} /></button>
        </div>
        {["SHOP", "COLLECTIONS"].map((m) => (
          <div key={m} className="d-acc">
            <button className="d-acc-head" onClick={() => setExp(exp === m ? null : m)}>
              {m}<Icon name="chevdown" size={18} style={{ transform: exp === m ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            <div className="d-acc-body" style={{ maxHeight: exp === m ? 600 : 0 }}>
              {MEGA[m].parents.map((p) => <a key={p.name} href="#" className="d-sub">{p.name}</a>)}
            </div>
          </div>
        ))}
        {["OFFERS", "ABOUT", "JOURNAL"].map((l) => <a key={l} href="#" className="d-link">{l}</a>)}
        <div className="drawer-foot">
          <a href="#" className="d-util"><Icon name="user" size={18} /> Account</a>
          <a href="#" className="d-util"><Icon name="heart" size={18} /> Wishlist</a>
        </div>
      </aside>
    </>
  );
}

/* ---- Mobile full-screen search ---- */
function MobileSearch({ open, onClose }) {
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);
  React.useEffect(() => { if (open && ref.current) setTimeout(() => ref.current.focus(), 80); }, [open]);
  const ql = q.trim().toLowerCase();
  const results = ql ? ALL_PRODUCTS.filter((p) => (p.name + " " + p.cat).toLowerCase().includes(ql)).slice(0, 6) : [];
  return (
    <div className={"msearch" + (open ? " open" : "")} aria-hidden={!open}>
      <div className="msearch-head">
        <div className="search-box" style={{ flex: 1, width: "auto" }}>
          <Icon name="search" size={18} className="search-ico" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the atelier…" aria-label="Search" />
        </div>
        <button className="msearch-cancel" onClick={() => { setQ(""); onClose(); }}>Cancel</button>
      </div>
      <div className="msearch-body noscroll">
        {!ql && (
          <>
            <div className="sd-eyebrow" style={{ padding: "0 4px" }}><Spark size={12} color="var(--accent-deep)" /> POPULAR</div>
            <div className="sd-pills" style={{ marginBottom: 24 }}>{POPULAR.map((p) => <button key={p} className="pill" onClick={() => setQ(p)}>{p}</button>)}</div>
            <div className="sd-eyebrow" style={{ padding: "0 4px" }}><Spark size={12} color="var(--accent-deep)" /> TRENDING</div>
            {PRODUCTS.trending.map((p) => (
              <a key={p.id} href="#" className="sd-result"><Ph label="" tone={p.tone} /><div><div className="r-name bn">{p.name}</div><div className="r-price">{CUR} {p.price}</div></div></a>
            ))}
          </>
        )}
        {ql && results.map((p) => (
          <a key={p.id} href="#" className="sd-result"><Ph label="" tone={p.tone} /><div><div className="r-name bn">{p.name}</div><div className="r-price">{CUR} {p.price}</div></div><Icon name="arrow" size={16} className="r-arrow" /></a>
        ))}
        {ql && results.length === 0 && <div className="sd-nomatch"><div className="nm-title">No matches for "{q}"</div></div>}
      </div>
    </div>
  );
}

/* ---- Cart toast ---- */
function CartToast() {
  const { toast } = useShop();
  return (
    <div className={"cart-toast" + (toast ? " on" : "")} role="status" aria-live="polite">
      {toast && (
        <>
          <span className="ct-ico"><Icon name="check" size={18} color="var(--bg-ivory)" /></span>
          <div>
            <div className="ct-title">Added to bag</div>
            <div className="ct-name bn">{toast.name}</div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { Footer, FloatingChat, BottomNav, MobileDrawer, MobileSearch, CartToast });
