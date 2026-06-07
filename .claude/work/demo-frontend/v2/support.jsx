/* FruitSnacks V2 — brand story, reviews, FAQ, newsletter */

function BrandStory() {
  return (
    <section className="section bg-pearl" aria-label="Our story" data-screen-label="Brand Story">
      <div className="container">
        <div className="story-grid">
          <div className="story-media reveal">
            <div className="story-blob" aria-hidden="true" />
            <span className="story-date">—2024.</span>
            <div className="story-img"><Ph label="Studio Styling · Editorial Portrait" tone="t-plum" /></div>
          </div>
          <div className="story-copy reveal">
            <div className="eyebrow">OUR STORY</div>
            <h2 className="story-h">Small studio.<br />Big <span className="em">devotion.</span></h2>
            <p className="story-p">FruitSnacks began with a quiet rebellion: against the rushed, the mass-produced, the indifferent. Every selection in our atelier is sourced by hand <Spark size={11} color="var(--accent-deep)" style={{ display: "inline", verticalAlign: "middle" }} /> examined, tasted, approved. We don't scale at the expense of soul.</p>
            <blockquote className="story-quote">
              <span className="sq-mark">"</span>
              If we wouldn't serve it to our own family, it doesn't reach yours.
            </blockquote>
            <a href="#" className="link-more" style={{ marginTop: 8 }}>Read our full story <Icon name="arrow" size={15} className="arrow" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Reviews carousel ---- */
function Reviews() {
  const trackRef = React.useRef(null);
  const [active, setActive] = React.useState(0);
  const scrollTo = (i) => {
    const track = trackRef.current; if (!track) return;
    const card = track.children[i]; if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setActive(i);
  };
  const onScroll = () => {
    const track = trackRef.current; if (!track) return;
    const i = Math.round(track.scrollLeft / (track.scrollWidth / REVIEWS.length));
    setActive(Math.min(REVIEWS.length - 1, Math.max(0, i)));
  };
  return (
    <section className="section bg-ivory" aria-label="Reviews" data-screen-label="Reviews">
      <div className="container">
        <div className="rev-head reveal">
          <div>
            <SectionHead eyebrow="REAL VOICES" title="Why They Come" em="Back"
              sub="Reviews from people who actually pay for their snacks." center={false} />
          </div>
          <div className="rev-arrows">
            <button className="rev-arrow" aria-label="Previous" onClick={() => scrollTo(Math.max(0, active - 1))}><Icon name="chevron" size={20} style={{ transform: "rotate(180deg)" }} /></button>
            <button className="rev-arrow" aria-label="Next" onClick={() => scrollTo(Math.min(REVIEWS.length - 1, active + 1))}><Icon name="chevron" size={20} /></button>
          </div>
        </div>
        <div className="rev-track noscroll" ref={trackRef} onScroll={onScroll}>
          {REVIEWS.map((r, k) => (
            <article key={k} className="rev-card">
              <span className="rev-quote">"</span>
              <Stars n={5} />
              <p className="rev-text bn">{r.text}</p>
              <div className="rev-foot">
                <span className="rev-avatar">{r.init}</span>
                <div>
                  <div className="rev-name bn">{r.name}</div>
                  <div className="rev-loc"><Icon name="check" size={13} color="var(--accent-deep)" /> Verified Buyer · {r.loc}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="rev-dots">
          {REVIEWS.map((_, k) => <button key={k} className={"rd" + (k === active ? " on" : "")} aria-label={"Review " + (k + 1)} onClick={() => scrollTo(k)} />)}
        </div>
        <div className="head-center" style={{ marginTop: 18 }}>
          <a href="#" className="link-more" style={{ fontSize: 12 }}>Read all 234 reviews <Icon name="arrow" size={14} className="arrow" /></a>
        </div>
      </div>
    </section>
  );
}

/* ---- FAQ ---- */
function Faq() {
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section bg-pearl" aria-label="FAQ" data-screen-label="FAQ">
      <div className="container">
        <div className="faq-grid">
          <div className="faq-left reveal">
            <div className="eyebrow">HELP CENTER</div>
            <h2 className="section-title" style={{ lineHeight: 1.0 }}>Frequently<br /><span className="em">Asked.</span></h2>
            <p className="section-sub" style={{ margin: "16px 0 0", maxWidth: 360 }}>Can't find what you're looking for?</p>
            <a href="#" className="btn btn-primary" style={{ marginTop: 28 }}><Icon name="wa" size={18} /> WhatsApp us <Icon name="arrow" size={16} className="arrow" /></a>
          </div>
          <div className="faq-list reveal">
            {FAQS.map((f, k) => (
              <div key={k} className={"faq-item" + (open === k ? " open" : "")}>
                <button className="faq-q" aria-expanded={open === k} onClick={() => setOpen(open === k ? -1 : k)}>
                  <span>{f.q}</span>
                  <span className="faq-ico"><Icon name="plus" size={22} /></span>
                </button>
                <div className="faq-a" style={{ maxHeight: open === k ? 280 : 0 }}>
                  <div className="faq-a-inner">{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- Newsletter ---- */
function Newsletter() {
  const [tab, setTab] = React.useState("WHATSAPP");
  const [val, setVal] = React.useState("");
  const [ok, setOk] = React.useState(false);
  const submit = (e) => { e.preventDefault(); if (!val.trim()) return; setOk(true); setVal(""); setTimeout(() => setOk(false), 3500); };
  return (
    <section className="section bg-ink news" aria-label="Newsletter" data-screen-label="Newsletter">
      <span className="news-watermark" aria-hidden="true">F</span>
      <SparkField count={6} />
      <div className="container">
        <div className="news-inner reveal">
          <div className="eyebrow" style={{ color: "var(--accent-deep)" }}>JOIN THE ATELIER</div>
          <h2 className="news-title">Be the <span className="em">first</span> to know.</h2>
          <p className="news-sub">New collections, exclusive previews, subscriber-only access. No spam — we'd never.</p>
          <div className="news-tabs">
            {["WHATSAPP", "EMAIL"].map((t) => (
              <button key={t} className={"news-tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          <form className="news-form" onSubmit={submit}>
            <input value={val} onChange={(e) => setVal(e.target.value)}
              placeholder={tab === "WHATSAPP" ? "+8801XXXXXXXXX" : "you@atelier.com"}
              aria-label={tab === "WHATSAPP" ? "WhatsApp number" : "Email address"} />
            <button type="submit" className="news-submit">Subscribe</button>
          </form>
          <div className="news-fine">{ok ? "✦ You're on the list — welcome to the atelier." : "We respect your inbox. Unsubscribe anytime — promise."}</div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { BrandStory, Reviews, Faq, Newsletter });
