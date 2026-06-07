/* FruitSnacks — Categories, Product card, Strips, Flash sale */

function ProductCard({ p }) {
  const shop = useShop();
  const on = !!shop.wishlist[p.id];
  const [pop, setPop] = React.useState(false);
  const disc = p.was ? Math.round((1 - p.price / p.was) * 100) : null;

  const toggleWish = () => {
    shop.toggleWish(p.id);
    if (!on) { setPop(true); setTimeout(() => setPop(false), 320); }
  };

  return (
    <article className="pcard">
      <div className="pcard-img">
        <Ph label={p.ph} tone={p.tone} />
        <div className="pcard-badges">
          {p.badges.includes("sale") && disc && <span className="badge badge-sale bn">{disc}% ছাড়</span>}
          {p.badges.includes("new") && <span className="badge badge-new bn">নতুন</span>}
          {p.badges.includes("best") && <span className="badge badge-best bn">বেস্টসেলার</span>}
        </div>
        <button
          className={"wish-btn" + (on ? " on" : "") + (pop ? " pop" : "")}
          onClick={toggleWish}
          aria-pressed={on}
          aria-label={on ? "উইশলিস্ট থেকে সরান" : "উইশলিস্টে যোগ করুন"}
        >
          <Icon name="heart" size={17} color={on ? "var(--primary)" : "currentColor"}
            style={on ? { fill: "var(--primary)" } : null} />
        </button>
        {p.low_stock && <span className="stock-urgent bn">মাত্র {p.qty}টি বাকি</span>}
        <button className="quick-add bn" onClick={() => shop.addToCart(p.id)}>
          <Icon name="bag" size={16} /> কার্টে যোগ করুন
        </button>
      </div>
      <div className="pcard-body">
        <div className="pcard-cat">{p.cat}</div>
        <h3 className="pcard-name bn-serif" lang="bn">{p.name}</h3>
        <RatingDots rating={p.rating} />
        <div className="pcard-price">
          <span className="price-now">{CUR} {p.price}</span>
          {p.was && <span className="price-was">{CUR} {p.was}</span>}
          {disc && <span className="price-chip">{disc}%↓</span>}
        </div>
        {p.is_variation && <div className="var-hint bn">{p.var}</div>}
      </div>
    </article>
  );
}

function FeaturedCategories() {
  return (
    <section className="section bg-cream reveal" id="shop">
      <div className="container">
        <SectionHead eyebrow="EXPLORE" title="আমাদের ক্যাটাগরি" sub="ছোট কালেকশন — বড় যত্নে বাছাই করা।" />
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <a key={c.slug} href="#" className="cat-tile">
              <div className="cat-img"><Ph label={c.en} tone={c.tone} /></div>
              <div>
                <div className="cat-name bn-serif">{c.name}</div>
                <div className="cat-count bn">{c.count}টি পণ্য</div>
              </div>
            </a>
          ))}
        </div>
        <Flourish />
      </div>
    </section>
  );
}

function ProductStrip({ eyebrow, title, sub, items, bg = "bg-cream", id }) {
  return (
    <section className={"section reveal " + bg} id={id}>
      <div className="container">
        <SectionHead eyebrow={eyebrow} title={title} sub={sub} />
        <div className="strip-scroll" style={{ marginTop: 44 }}>
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <div className="strip-foot">
          <a href="#" className="link-more bn">সব দেখুন <Icon name="arrow" size={16} className="arrow" /></a>
          <div className="divider" />
        </div>
      </div>
    </section>
  );
}

function useCountdown(initial) {
  const [t, setT] = React.useState(initial);
  React.useEffect(() => {
    const id = setInterval(() => setT((v) => (v <= 0 ? 0 : v - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return [pad(h), pad(m), pad(s)];
}

function FlashSale() {
  const [h, m, s] = useCountdown(7 * 3600 + 42 * 60 + 18);
  const boxes = [[h, "ঘণ্টা"], [m, "মিনিট"], [s, "সেকেন্ড"]];
  return (
    <section className="section bg-cream reveal">
      <div className="container">
        <div className="flash-accent" />
        <div className="flash-head">
          <div>
            <div className="eyebrow">LIMITED TIME</div>
            <h2 className="section-title bn-serif" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              ফ্ল্যাশ সেল <span style={{ color: "var(--accent)" }}><Icon name="fire" size={34} color="var(--accent)" /></span>
            </h2>
          </div>
          <div className="countdown" aria-label="অফার শেষ হতে বাকি">
            {boxes.map(([val, lbl], i) => (
              <React.Fragment key={lbl}>
                <div className="cd-box">
                  <span className="cd-num">{val}</span>
                  <span className="cd-lbl bn">{lbl}</span>
                </div>
                {i < 2 && <span className="cd-sep">:</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="strip-scroll">
          {PRODUCTS.flash.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <a href="#" className="link-more bn">সব ফ্ল্যাশ সেল দেখুন <Icon name="arrow" size={16} className="arrow" /></a>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { ProductCard, FeaturedCategories, ProductStrip, FlashSale });
