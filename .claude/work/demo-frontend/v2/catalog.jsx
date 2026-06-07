/* FruitSnacks V2 — overlay product card + product strips */

function badgeNode(b) {
  if (b === "sale") return <span key="sale" className="badge badge-sale">SALE</span>;
  if (b === "new") return <span key="new" className="badge badge-new"><span className="nw-txt">NEW</span></span>;
  if (b === "best") return <span key="best" className="badge badge-best">BESTSELLER</span>;
  return null;
}

function discountPct(p) {
  if (!p.was) return null;
  return Math.round((1 - p.price / p.was) * 100);
}

function ProductCard({ p, context }) {
  const { wishlist, toggleWish, addToCart, openQuickView } = useShop();
  const [pop, setPop] = React.useState(false);
  const [floatPlus, setFloatPlus] = React.useState(false);
  const wished = !!wishlist[p.id];
  const disc = discountPct(p);

  const onWish = (e) => {
    e.preventDefault(); e.stopPropagation();
    toggleWish(p.id);
    if (!wished) { setPop(true); setFloatPlus(true); setTimeout(() => setPop(false), 400); setTimeout(() => setFloatPlus(false), 700); }
  };
  const onAdd = (e) => { e.preventDefault(); e.stopPropagation(); addToCart({ id: p.id, name: p.name, price: p.price, tone: p.tone, variant: "Standard pack" }); };
  const onQuick = (e) => { e.preventDefault(); e.stopPropagation(); openQuickView(p); };

  return (
    <a href="#" className="pcard" aria-label={p.name} onClick={onQuick}>
      <div className="pcard-media">
        <Ph label={p.ph} tone={p.tone} />
        <div className="pcard-shade" />
        <div className="pcard-badges">
          {disc != null && <span className="badge badge-sale">−{disc}%</span>}
          {p.badges.filter((b) => b !== "sale").map(badgeNode)}
          {context === "trending" && p.growth != null && (
            <span className="badge badge-trend"><Icon name="arrowup" size={11} /> {p.growth}%</span>
          )}
        </div>
        {context === "editor" && (
          <span className="editor-seal" aria-label="Editor's choice"><Spark size={15} color="var(--bg-ink)" /></span>
        )}
        <div className="pcard-tools">
          <button className={"wish-btn" + (wished ? " on" : "") + (pop ? " pop" : "")}
            aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} onClick={onWish}>
            <Icon name="heart" size={18} color={wished ? "var(--primary-deep)" : "var(--primary)"} style={wished ? { fill: "var(--primary-deep)" } : null} />
            {floatPlus && <span className="wish-plus">+1</span>}
          </button>
          <button className="qv-btn" aria-label="Quick view" onClick={onQuick}>
            <Icon name="eye" size={18} color="var(--primary)" />
            <span className="qv-tip">Quick view</span>
          </button>
        </div>
        {p.low_stock && <span className="stock-urgent">Only {p.qty} left</span>}

        {/* hover reveal */}
        <div className="pcard-reveal">
          <div className="pr-cat">{p.cat}</div>
          <div className="pr-name">{p.name}</div>
          <RatingDots rating={p.rating} light />
          <div className="pr-price">
            <span className="now">{CUR} {p.price}</span>
            {p.was && <span className="was">{CUR} {p.was}</span>}
            {p.varlabel && <span className="varhint">{p.varlabel}</span>}
          </div>
        </div>
        <div className="pcard-cta-row">
          <button className="add-bag" onClick={onAdd}>Add to bag</button>
          <button className="quick-bag" aria-label="Quick view" onClick={onQuick}><Icon name="eye" size={18} /></button>
        </div>
      </div>
      <div className="pcard-foot">
        <div className="pcard-name-static">{p.name}</div>
      </div>
    </a>
  );
}

/* generic strip */
function Strip({ id, eyebrow, title, em, emPos, sub, products, context, bg, footLink, scroll }) {
  return (
    <section className={"section " + (bg || "bg-ivory")} aria-label={title} data-screen-label={title}>
      <div className="container">
        <div className="reveal">
          <SectionHead eyebrow={eyebrow} title={title} em={em} emPos={emPos} sub={sub} />
        </div>
        <div className={"strip-grid stagger" + (scroll ? " strip-scroll" : "")}>
          {products.map((p) => <ProductCard key={p.id} p={p} context={context} />)}
        </div>
        {footLink && (
          <div className="strip-foot reveal">
            <a href="#" className="link-more">{footLink} <Icon name="arrow" size={15} className="arrow" /></a>
            <div className="divider" />
          </div>
        )}
      </div>
    </section>
  );
}

function Bestsellers() {
  return <Strip eyebrow="REGULARLY LOVED" title="Customer" em="Bestsellers"
    sub="The ones our customers reach for again and again." products={PRODUCTS.bestsellers}
    context="bestseller" bg="bg-ivory" footLink="View all bestsellers" scroll />;
}
function Trending() {
  return <Strip eyebrow="RIGHT NOW" title="Trending This Week"
    sub="What everyone's adding to cart." products={PRODUCTS.trending}
    context="trending" bg="bg-pearl" scroll />;
}
function JustForYou() {
  return (
    <section className="section bg-ivory" aria-label="Editor's picks" data-screen-label="Just For You">
      <div className="container">
        <div className="reveal head-center">
          <div className="match-chip"><Spark size={12} color="var(--accent-deep)" /> MATCHED TO YOUR TASTE</div>
          <SectionHead eyebrow="EDITOR'S PICKS" title="Just For" em="You"
            sub="Based on what you've loved before." />
        </div>
        <div className="strip-grid strip-scroll stagger">
          {PRODUCTS.foryou.map((p) => <ProductCard key={p.id} p={p} context="foryou" />)}
        </div>
      </div>
    </section>
  );
}
function EditorsChoice() {
  return <Strip eyebrow="HOUSE FAVORITES" title="Our Editor's" em="Choice"
    sub="Picked by our team for unparalleled quality." products={PRODUCTS.editor}
    context="editor" bg="bg-pearl" scroll />;
}
function NewArrivals() {
  return <Strip eyebrow="JUST ARRIVED" title="Fresh on the" em="Shelf"
    sub="The latest additions to our atelier." products={PRODUCTS.fresh}
    context="new" bg="bg-pearl" footLink="View all new arrivals" scroll />;
}

Object.assign(window, {
  ProductCard, Strip, Bestsellers, Trending, JustForYou, EditorsChoice, NewArrivals,
});
