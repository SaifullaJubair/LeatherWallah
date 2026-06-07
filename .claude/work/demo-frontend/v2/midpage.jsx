/* FruitSnacks V2 — promo banner, flash sale, category spotlight, bundles */

/* countdown hook */
function useCountdown(initial) {
  const [t, setT] = React.useState(initial);
  React.useEffect(() => {
    const id = setInterval(() => setT((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600),
    m = Math.floor((t % 3600) / 60), s = t % 60;
  return { d, h, m, s, pad: (x) => String(x).padStart(2, "0") };
}

/* ---- Promo banner: Winter Wonders ---- */
function PromoBanner() {
  const c = useCountdown(4 * 86400 + 12 * 3600 + 33 * 60 + 18);
  const ref = React.useRef(null);
  const [off, setOff] = React.useState(0);
  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onScroll = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const prog = 1 - (r.top + r.height) / (window.innerHeight + r.height);
      setOff(Math.max(-40, Math.min(40, (prog - 0.5) * -80)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <section className="promo bg-ink" ref={ref} aria-label="Winter Wonders" data-screen-label="Promo Banner">
      <SparkField count={5} />
      <div className="container">
        <div className="promo-grid">
          <div className="promo-text reveal">
            <div className="eyebrow" style={{ color: "var(--accent)" }}>LIMITED EDITION</div>
            <h2 className="promo-title">Winter<br /><span className="em">Wonders.</span></h2>
            <p className="promo-sub">A seven-piece curation of seasonal flavours, available only through January. Free luxury wrap with every box.</p>
            <a href="#" className="btn btn-ivory" style={{ marginTop: 8 }}>Discover the edit <Icon name="arrow" size={17} className="arrow" /></a>
            <div className="promo-countdown">
              <span className="pc-label">Ends in</span>
              {[["d", c.d], ["h", c.h], ["m", c.m], ["s", c.s]].map(([l, v], i) => (
                <React.Fragment key={l}>
                  <span className="pc-box">{c.pad(v)}<i>{l}</i></span>
                  {i < 3 && <span className="pc-sep">:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="promo-media reveal">
            <div className="promo-img" style={{ transform: "translateY(" + off + "px)" }}>
              <Ph label="Winter Box · Velvet Backdrop" tone="t-ink" />
              <div className="promo-img-shimmer" />
            </div>
            <span className="wax-seal">BEST<br />GIFT<br />2025</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Flash sale ---- */
function FlashSale() {
  const c = useCountdown(6 * 3600 + 42 * 60 + 9);
  return (
    <section className="section bg-ivory" aria-label="Flash sale" data-screen-label="Flash Sale">
      <div className="container">
        <div className="flash-accent" />
        <div className="flash-head reveal">
          <div className="flash-title">
            <div className="eyebrow" style={{ color: "var(--coral)" }}>TIME-LIMITED OFFER</div>
            <h2 className="section-title" style={{ marginTop: 8 }}>Flash <span className="em" style={{ color: "var(--coral)" }}>Sale</span></h2>
          </div>
          <div className="flash-cd-wrap">
            <span className="flash-cd-label">Sale ends in</span>
            <div className="countdown">
              {[c.h, c.m, c.s].map((v, i) => (
                <React.Fragment key={i}>
                  <span className="cd-box">{c.pad(v)}</span>
                  {i < 2 && <span className="cd-sep">·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="strip-grid strip-scroll stagger">
          {PRODUCTS.flash.map((p) => <ProductCard key={p.id} p={p} context="flash" />)}
        </div>
      </div>
    </section>
  );
}

/* ---- Category spotlight (2+3) ---- */
function CategorySpotlight() {
  const f = SPOTLIGHT.feature;
  const { addToCart, toggleWish, wishlist } = useShop();
  return (
    <section className="section bg-ivory" aria-label="Category spotlight" data-screen-label="Category Spotlight">
      <div className="container">
        <div className="reveal head-center">
          <SectionHead eyebrow="SPOTLIGHT" title={SPOTLIGHT.category + " Selection"}
            sub={"Inside our " + SPOTLIGHT.category.toLowerCase() + " collection — the most loved."} />
          <a href="#" className="link-more" style={{ marginTop: 18, fontSize: 12 }}>Browse all {SPOTLIGHT.category.toLowerCase()} <Icon name="arrow" size={14} className="arrow" /></a>
        </div>
        <div className="spot-grid stagger">
          <a href="#" className="spot-feature">
            <Ph label={f.ph} tone={f.tone} />
            <div className="spot-feat-shade" />
            <div className="spot-badges">
              <span className="badge badge-best">BESTSELLER</span>
              {f.was && <span className="badge badge-sale">−{discountPct(f)}%</span>}
            </div>
            <div className="spot-feat-body">
              <div className="pr-cat" style={{ color: "var(--accent)" }}>{f.cat}</div>
              <div className="spot-feat-name bn">{f.name}</div>
              <RatingDots rating={f.rating} light />
              <div className="pr-price">
                <span className="now" style={{ color: "var(--bg-ivory)" }}>{CUR} {f.price}</span>
                {f.was && <span className="was">{CUR} {f.was}</span>}
              </div>
              <div className="spot-note"><Spark size={12} color="var(--accent)" /> {f.note}</div>
            </div>
          </a>
          <div className="spot-side">
            {SPOTLIGHT.side.map((p) => <ProductCard key={p.id} p={p} context="bestseller" />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Bundles ---- */
function Bundles() {
  return (
    <section className="section bg-ivory" aria-label="Bundle editions" data-screen-label="Bundles">
      <div className="container">
        <div className="reveal head-center">
          <SectionHead eyebrow="VALUE EDITS" title="Bundle" em="Editions"
            sub="Curated trios and quintets — more to love, less to spend." />
        </div>
        <div className="bundle-grid stagger">
          {BUNDLES.map((b, k) => (
            <a key={k} href="#" className="bundle-card">
              <div className="bundle-frame">
                <div className="bundle-inner">
                  <Ph label={b.ph} tone={b.tone} />
                  <div className="bundle-shade" />
                  <div className="bundle-tag">{b.tag}</div>
                  <div className="bundle-body">
                    <div className="bundle-name bn">{b.name}</div>
                    <div className="bundle-price">
                      <span className="was">{CUR} {b.was}</span>
                      <span className="now">{CUR} {b.price}</span>
                    </div>
                    <span className="bundle-save">Save {CUR} {b.save}</span>
                  </div>
                  <span className="bundle-cta"><Icon name="arrow" size={18} /></span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { PromoBanner, FlashSale, CategorySpotlight, Bundles, useCountdown });
