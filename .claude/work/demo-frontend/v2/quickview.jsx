/* FruitSnacks V2 — Product Quick View modal */

function buildVariations(p) {
  const base = p.price;
  const mk = (label, mult, stock) => ({ label, price: Math.round(base * mult), was: p.was ? Math.round(p.was * mult) : null, stock });
  if (p.varlabel && p.varlabel.indexOf("3") === 0) {
    return [mk("250 g", 0.6, 12), mk("500 g", 1, p.low_stock ? p.qty : 24), mk("1 kg", 1.85, 7)];
  }
  if (p.varlabel && p.varlabel.indexOf("2") === 0) {
    return [mk("250 g", 0.62, 18), mk("500 g", 1, p.low_stock ? p.qty : 20)];
  }
  if (p.varlabel === "Numbered") {
    return [mk("No. 01 — Reserve", 1, 4), mk("No. 02 — Reserve", 1.15, 2)];
  }
  return [mk("Standard pack", 1, p.low_stock ? p.qty : 30)];
}

/* finish / type swatches per category */
const FINISH_BY_CAT = {
  "Nuts": [["Raw", "#E7D7B0"], ["Roasted", "#B5793F"], ["Salted", "#D6C096"]],
  "Dates": [["Regular", "#5A2D1A"], ["Pitted", "#7A4326"]],
  "Dried Fruits": [["Natural", "#C96B4A"], ["Sun-dried", "#9C4A2E"]],
  "Mixed": [["Classic", "#C99A5B"], ["Deluxe", "#8A5A2B"]],
  "Premium": [["Signature", "#6B2D5F"], ["Reserve", "#4A1D42"]],
  "Gift Boxes": [["Velvet Box", "#4A1D42"], ["Kraft Box", "#B07F4F"]],
  "Seeds": [["Mixed", "#9C8A5B"], ["Single", "#C7B583"]],
};
/* packaging adds a delta to unit price */
const PACKAGING = [["Standard pouch", 0], ["Gift tin", 150]];

const GALLERY_LABELS = ["Pack shot", "Close-up", "Texture", "Lifestyle"];

function QuickView() {
  const { quickView: p, closeQuickView, addToCart, toggleWish, wishlist, toggleCompare, compare } = useShop();
  const [vi, setVi] = React.useState(0);
  const [fi, setFi] = React.useState(0);
  const [pk, setPk] = React.useState(0);
  const [qty, setQty] = React.useState(1);
  const [gi, setGi] = React.useState(0);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    if (p) { setVi(0); setFi(0); setPk(0); setQty(1); setGi(0); setAdded(false); }
  }, [p]);

  React.useEffect(() => {
    if (!p) return;
    const onKey = (e) => { if (e.key === "Escape") closeQuickView(); };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("body-lock");
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("body-lock"); };
  }, [p, closeQuickView]);

  if (!p) return null;

  const variations = buildVariations(p);
  const v = variations[vi] || variations[0];
  const finish = FINISH_BY_CAT[p.cat] || [["Classic", "#B07F4F"], ["Premium", "#6B2D5F"]];
  const pkgDelta = PACKAGING[pk][1];
  const unit = v.price + pkgDelta;
  const wasUnit = v.was ? v.was + pkgDelta : null;
  const disc = v.was ? Math.round((1 - v.price / v.was) * 100) : null;
  const inStock = v.stock > 0;
  const low = inStock && v.stock <= 6;
  const wished = !!wishlist[p.id];
  const compared = !!compare[p.id];
  const desc = DESC[p.cat] || "Hand-picked premium snacks — honest flavour, thoughtful packaging.";
  const attrs = ATTRS[p.cat] || [];

  const doAdd = () => {
    if (!inStock) return;
    addToCart({ id: p.id, name: p.name, price: unit, tone: p.tone, variant: finish[fi][0] + " · " + v.label + " · " + PACKAGING[pk][0] }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  const stepQty = (d) => setQty((q) => Math.max(1, Math.min(inStock ? v.stock : 1, q + d)));

  return (
    <div className="qv-scrim" onClick={closeQuickView} role="dialog" aria-modal="true" aria-label={p.name}>
      <div className="qv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qv-close" aria-label="Close" onClick={closeQuickView}><Icon name="close" size={22} /></button>

        <div className="qv-gallery">
          <div className="qv-main">
            <Ph label={GALLERY_LABELS[gi] + " · " + p.ph} tone={p.tone} />
            <div className="qv-badges">
              {disc != null && <span className="badge badge-sale">−{disc}%</span>}
              {p.badges.includes("new") && <span className="badge badge-new"><span className="nw-txt">NEW</span></span>}
              {p.badges.includes("best") && <span className="badge badge-best">BESTSELLER</span>}
              {p.badges.includes("editor") && <span className="badge" style={{ backgroundImage: "var(--shimmer)", color: "var(--bg-ink)" }}>EDITOR'S CHOICE</span>}
            </div>
          </div>
          <div className="qv-thumbs">
            {GALLERY_LABELS.map((g, k) => (
              <button key={k} className={"qv-thumb" + (k === gi ? " on" : "")} aria-label={g} onClick={() => setGi(k)}>
                <Ph label="" tone={p.tone} />
              </button>
            ))}
          </div>
        </div>

        <div className="qv-detail noscroll">
          <div className="qv-eyebrow">{p.cat}{p.is_variation ? " · " + p.varlabel : ""}</div>
          <h3 className="qv-name">{p.name}</h3>

          <div className="qv-rate-row">
            {p.rating ? (
              <>
                <Stars n={Math.round(p.rating.avg)} />
                <span className="qv-rate-txt">{p.rating.avg.toFixed(1)} · {p.rating.count} reviews</span>
              </>
            ) : <span className="qv-rate-txt">New arrival</span>}
          </div>

          <div className="qv-price">
            <span className="now">{CUR} {unit.toLocaleString("en-IN")}</span>
            {wasUnit && <span className="was">{CUR} {wasUnit.toLocaleString("en-IN")}</span>}
            {disc != null && <span className="qv-save">Save {CUR} {(v.was - v.price).toLocaleString("en-IN")}</span>}
          </div>

          <p className="qv-desc">{desc}</p>

          {/* ---- Variant groups (above stock) ---- */}
          <div className="qv-variants">
            <div className="qv-vgroup">
              <div className="qv-label">Type / Finish <span className="qv-sel">{finish[fi][0]}</span></div>
              <div className="qv-swatches">
                {finish.map((f, k) => (
                  <button key={k} className={"qv-swatch" + (k === fi ? " on" : "")} aria-label={f[0]} title={f[0]} onClick={() => setFi(k)}>
                    <span className="sw-dot" style={{ background: f[1] }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="qv-vgroup">
              <div className="qv-label">Weight / Size <span className="qv-sel">{v.label}</span></div>
              <div className="qv-var-pills">
                {variations.map((vr, k) => (
                  <button key={k} className={"qv-var" + (k === vi ? " on" : "") + (vr.stock === 0 ? " disabled" : "")}
                    disabled={vr.stock === 0} onClick={() => { setVi(k); setQty(1); }}>
                    <span>{vr.label}</span>
                    <span className="qv-var-price">{CUR} {(vr.price + pkgDelta).toLocaleString("en-IN")}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="qv-vgroup">
              <div className="qv-label">Packaging <span className="qv-sel">{PACKAGING[pk][0]}</span></div>
              <div className="qv-opt-pills">
                {PACKAGING.map((pg, k) => (
                  <button key={k} className={"qv-opt" + (k === pk ? " on" : "")} onClick={() => setPk(k)}>
                    <span>{pg[0]}</span>
                    {pg[1] > 0 && <span className="qv-opt-delta">+{CUR}{pg[1]}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Stock ---- */}
          <div className="qv-stock">
            {inStock
              ? <span className={"qv-stock-tag" + (low ? " low" : "")}><span className="qv-dot" />{low ? <span>In stock — only {v.stock} left</span> : <span>In stock · {v.stock} available</span>}</span>
              : <span className="qv-stock-tag out"><span className="qv-dot" /><span>Out of stock</span></span>}
          </div>

          <div className="qv-actions">
            <div className="qv-stepper" aria-label="Quantity">
              <button aria-label="Decrease" onClick={() => stepQty(-1)} disabled={qty <= 1}><Icon name="minus" size={16} /></button>
              <input type="text" inputMode="numeric" value={qty} aria-label="Quantity"
                onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, ""), 10); setQty(isNaN(n) ? 1 : Math.max(1, Math.min(inStock ? v.stock : 1, n))); }} />
              <button aria-label="Increase" onClick={() => stepQty(1)} disabled={inStock && qty >= v.stock}><Icon name="plus" size={16} /></button>
            </div>
            <button className={"qv-add" + (added ? " added" : "")} onClick={doAdd} disabled={!inStock}>
              {added ? <><Icon name="check" size={17} /> Added to bag</> : inStock ? <><Icon name="bag" size={17} /> Add to bag — {CUR} {(unit * qty).toLocaleString("en-IN")}</> : "Out of stock"}
            </button>
          </div>

          <div className="qv-mini-actions">
            <button className={"qv-mini" + (wished ? " on" : "")} onClick={() => toggleWish(p.id)} aria-pressed={wished}>
              <Icon name="heart" size={17} style={wished ? { fill: "var(--primary-deep)" } : null} /> {wished ? "Wishlisted" : "Wishlist"}
            </button>
            <button className={"qv-mini" + (compared ? " on" : "")} onClick={() => toggleCompare(p.id)} aria-pressed={compared}>
              <Icon name="compare" size={17} /> {compared ? "Comparing" : "Compare"}
            </button>
            <button className="qv-mini" aria-label="Share"><Icon name="arrowup" size={17} /> Share</button>
          </div>

          {attrs.length > 0 && (
            <div className="qv-attrs">
              {attrs.map(([k, val]) => (
                <div key={k} className="qv-attr"><span className="qa-k">{k}</span><span className="qa-v">{val}</span></div>
              ))}
            </div>
          )}

          <div className="qv-trust">
            <span><Icon name="truck" size={16} /> <span>2-hour Dhaka delivery</span></span>
            <span><Icon name="shield" size={16} /> <span>100% authentic</span></span>
          </div>

          <a href="#" className="qv-full">View full details <Icon name="arrow" size={14} className="arrow" /></a>
        </div>
      </div>
    </div>
  );
}

window.QuickView = QuickView;
