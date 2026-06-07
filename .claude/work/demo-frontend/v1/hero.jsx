/* FruitSnacks — Hero + Trust strip */

function Hero() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  const mediaRef = React.useRef(null);
  const curRef = React.useRef(null);
  const raf = React.useRef(null);
  const target = React.useRef({ x: 0, y: 0 });
  const pos = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const el = mediaRef.current, cur = curRef.current;
    if (!el || !cur) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      cur.style.opacity = "1";
    };
    const onLeave = () => { cur.style.opacity = "0"; };
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.16;
      pos.current.y += (target.current.y - pos.current.y) * 0.16;
      cur.style.left = pos.current.x + "px";
      cur.style.top = pos.current.y + "px";
      raf.current = requestAnimationFrame(tick);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const rise = (i, base) => ({ className: base + " hrise" + (ready ? " in" : ""), style: { transitionDelay: i * 0.08 + "s" } });

  return (
    <header className="hero bg-cream">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div {...rise(0, "eyebrow")}>SINCE 2024 · CRAFTED IN BANGLADESH</div>
          <h1 {...rise(1, "hero-h1 bn-serif")} lang="bn">
            প্রতিদিনের জন্য<br />
            একটু <span className="squig">ভালো<Squiggle /></span> কিছু।
          </h1>
          <p {...rise(2, "hero-sub bn")} lang="bn">
            হাতে বাছাই করা খেজুর, বাদাম আর শুকনো ফল — কোনো প্রিজার্ভেটিভ নেই, কোনো লুকানো গল্প নেই।
          </p>
          <div {...rise(3, "hero-cta")}>
            <a href="#shop" className="btn btn-primary bn">শপ এখনই <Icon name="arrow" size={18} className="arrow" /></a>
            <a href="#story" className="btn-ghost bn">আমাদের গল্প পড়ুন</a>
          </div>
          <div {...rise(4, "trust-row")}>
            {[
              ["check", "ফ্রি ডেলিভারি ৫০০৳+"],
              ["sprout", "১০০% খাঁটি"],
              ["refresh", "৭ দিনে রিটার্ন"],
              ["wallet", "ক্যাশ অন ডেলিভারি"],
            ].map(([ic, tx]) => (
              <span className="trust-item bn" key={tx}>
                <span className="ti-ico"><Icon name={ic} size={18} /></span>{tx}
              </span>
            ))}
          </div>
        </div>

        <div ref={mediaRef} {...rise(5, "hero-media")}>
          <div className="hero-blob" />
          <div className="hero-img-wrap">
            <Ph label="হিরো ফ্ল্যাট-লে · কাঠের বাটিতে খেজুর, কাজু ও এপ্রিকট · লিনেন কাপড়, উষ্ণ আলো" tone="tone-honey" />
          </div>
          <div className="hero-chip new bn-serif"><Icon name="leaf" size={14} /> নতুন</div>
          <div className="hero-chip price bn">{CUR} ৩৫০ থেকে শুরু</div>
          <span className="hero-cursor" ref={curRef}><Icon name="leaf" size={26} /></span>
        </div>
      </div>
    </header>
  );
}

function TrustStrip() {
  const cells = [
    ["sprout", "১০০% প্রাকৃতিক", "কোনো কেমিক্যাল নয়"],
    ["truck", "দ্রুত ডেলিভারি", "২৪ ঘণ্টায় ঢাকায়"],
    ["refresh", "সহজ রিটার্ন", "৭ দিনের গ্যারান্টি"],
    ["wallet", "ক্যাশ অন ডেলিভারি", "বিশ্বস্ত পেমেন্ট"],
  ];
  return (
    <section className="bg-parchment" style={{ paddingBlock: "48px" }}>
      <div className="container">
        <div className="tstrip-grid">
          {cells.map(([ic, label, sub]) => (
            <div className="tstrip-cell" key={label}>
              <span className="tc-ico"><Icon name={ic} size={34} sw={1.4} /></span>
              <div className="tc-label bn">{label}</div>
              <div className="tc-sub bn">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, TrustStrip });
