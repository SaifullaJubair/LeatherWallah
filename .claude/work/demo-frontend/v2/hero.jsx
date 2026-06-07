/* FruitSnacks V2 — split hero (carousel + stacked cards), trust strip, categories */

function Hero() {
  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const n = HERO_SLIDES.length;
  const touch = React.useRef(null);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  React.useEffect(() => {
    if (paused || reduce) return;
    const t = setTimeout(() => setIdx((p) => (p + 1) % n), 6000);
    return () => clearTimeout(t);
  }, [idx, paused, n, reduce]);

  const go = (d) => setIdx((p) => (p + d + n) % n);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);

  return (
    <section className="hero" aria-label="Featured" data-screen-label="Hero">
      <div className="hero-blob" aria-hidden="true" />
      <SparkField count={4} />
      <div className="container">
        <div className="hero-grid">
          <div className={"hslider" + (paused ? " paused" : "")}
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touch.current == null) return;
              const dx = e.changedTouches[0].clientX - touch.current;
              if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
              touch.current = null;
            }}
          >
            {HERO_SLIDES.map((s, k) => (
              <div key={k} className={"hslide" + (k === idx ? " on" : "")} aria-hidden={k !== idx}>
                <div className="hslide-img"><Ph label={s.ph} tone={s.tone} /></div>
                <div className="hslide-body">
                  <div className="eyebrow hs-anim">{s.eyebrow}</div>
                  <h1 className="hs-h1">
                    <span className="hs-anim d1">{s.line1}</span>
                    <span className="em hs-anim d2">{s.accent}</span>
                  </h1>
                  <p className="hs-sub hs-anim d3">{s.sub}</p>
                  <div className="hs-cta hs-anim d4">
                    <a href="#" className="btn btn-primary">Explore collection <Icon name="arrow" size={17} className="arrow" /></a>
                    <a href="#" className="btn btn-ghost">Watch story <Icon name="arrowup" size={15} /></a>
                  </div>
                  <div className="hs-counter hs-anim d4">
                    <span className="cnum">{String(idx + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
                    <span className="hs-progress" key={idx}><span /></span>
                  </div>
                </div>
              </div>
            ))}
            <div className="hs-arrows">
              <button className="hs-arrow" aria-label="Previous slide" onClick={() => go(-1)}><Icon name="chevron" size={22} style={{ transform: "rotate(180deg)" }} /></button>
              <button className="hs-arrow" aria-label="Next slide" onClick={() => go(1)}><Icon name="chevron" size={22} /></button>
            </div>
            <div className="hs-dots">
              {HERO_SLIDES.map((_, k) => (
                <button key={k} className={"hs-dot" + (k === idx ? " on" : "")} aria-label={"Go to slide " + (k + 1)} onClick={() => setIdx(k)} />
              ))}
            </div>
          </div>

          <div className="hstack">
            {HERO_CARDS.map((c, k) => (
              <a key={k} href="#" className={"hcard grad-" + c.grad}>
                <Ph label={c.ph} tone={c.tone} />
                <div className="hcard-body">
                  <div className="eyebrow">
                    {c.eyebrow.indexOf("JUST") === 0 ? <Icon name="hex" size={12} color="var(--accent)" /> : null}
                    {c.eyebrow}
                  </div>
                  <div className="ht">{c.title}</div>
                  <div className="hp">{c.price}</div>
                </div>
                <span className="hcard-cta"><Icon name="arrow" size={18} /></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Trust strip ---- */
const TRUST = [
  { ico: "gift", label: "Free Luxury Packaging", sub: "Above ৳ 1,500" },
  { ico: "envelope", label: "Same-Day Dhaka Delivery", sub: "Order before 2 PM" },
  { ico: "medal", label: "100% Authentic Source", sub: "Direct from origin" },
  { ico: "shield", label: "Secure Buy-Now-Pay", sub: "Multiple methods" },
];
function TrustStrip() {
  return (
    <section className="bg-pearl section-sm" aria-label="Why shop with us">
      <div className="container">
        <div className="tstrip-grid reveal">
          {TRUST.map((t) => (
            <div key={t.label} className="tstrip-cell">
              <span className="tc-ico"><Icon name={t.ico} size={44} sw={1.25} /></span>
              <div className="tc-label">{t.label}</div>
              <div className="tc-sub">{t.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- Featured categories ---- */
function Categories() {
  return (
    <section className="bg-ivory section" aria-label="Categories" data-screen-label="Categories">
      <div className="container">
        <div className="reveal">
          <SectionHead eyebrow="BROWSE" title="Curated" em="Categories" sub="Six worlds. Endless small luxuries." />
        </div>
        <div className="cat-grid stagger">
          {CATEGORIES.map((c) => (
            <a key={c.slug} href="#" className="cat-tile">
              <Ph label={c.name} tone={c.tone} />
              <span className="cat-arrow"><Icon name="arrow" size={16} /></span>
              <div className="cat-body">
                <div className="cat-name">{c.name}</div>
                <div className="cat-count">{c.count} selections</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, TrustStrip, Categories });
