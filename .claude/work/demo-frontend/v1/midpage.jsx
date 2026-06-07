/* FruitSnacks — Bundles, Brand story, Reviews */

function BundleOffers() {
  return (
    <section className="section bg-deep reveal">
      <div className="container">
        <SectionHead light eyebrow="BUNDLE & SAVE" title="কম্বো অফার" sub="একসাথে নিন, বেশি বাঁচান।" />
        <div className="bundle-grid">
          {BUNDLES.map((b) => (
            <a key={b.name} href="#" className="bundle-card">
              <Ph label={b.ph} tone="tone-deep" />
              <div className="bundle-body">
                <div className="bundle-tag bn-serif">{b.tag}</div>
                <div className="bundle-name bn-serif">{b.name}</div>
                <div className="bundle-price">
                  <span className="now">{CUR} {b.price}</span>
                  <span className="was">{CUR} {b.was}</span>
                </div>
                <span className="bundle-save bn">Save {CUR} {b.save}</span>
              </div>
              <span className="bundle-cta" aria-hidden="true"><Icon name="arrow" size={20} /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandStory() {
  return (
    <section className="section bg-parchment reveal" id="story">
      <div className="container">
        <div className="story-grid">
          <div className="story-media">
            <div className="story-blob" />
            <div className="story-img">
              <Ph label="ফাউন্ডার · হাতে বাদাম বাছাই · কাঠের টেবিল" tone="tone-honey" />
            </div>
            <span className="story-sign bn-serif">FruitSnacks</span>
          </div>
          <div className="story-copy">
            <div className="eyebrow">OUR STORY</div>
            <h2 className="story-h bn-serif" lang="bn">
              একটা ছোট <span className="sticker">দোকান</span>।<br />অনেক বড় যত্ন।
            </h2>
            <p className="story-p bn" lang="bn">
              ২০২৪ সালে আমরা শুরু করেছিলাম একটাই বিশ্বাস নিয়ে — আপনার পরিবারের জন্য যা কিনছেন,
              সেটা যেন আমরা নিজেরাও খাই।
              <span className="story-leaf"><Icon name="leaf" size={16} /></span>
            </p>
            <p className="story-p bn" lang="bn">
              প্রতিটা খেজুর, প্রতিটা বাদাম — হাতে বাছাই, ছবি দেখে নয়। যেটা আপনার টেবিলে পৌঁছায়,
              সেটার পেছনে থাকে আসল মানুষ আর আসল যত্ন।
            </p>
            <div style={{ marginTop: 24 }}>
              <a href="#" className="link-more bn">আমাদের সম্পর্কে আরও জানুন <Icon name="arrow" size={16} className="arrow" /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const trackRef = React.useRef(null);
  const [active, setActive] = React.useState(0);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstChild;
    if (!card) return;
    const w = card.getBoundingClientRect().width + 20;
    setActive(Math.round(el.scrollLeft / w));
  };
  const goto = (i) => {
    const el = trackRef.current;
    const card = el.children[i];
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };
  return (
    <section className="section bg-cream reveal">
      <div className="container">
        <SectionHead eyebrow="LOVED BY" title="কাস্টমারদের ভালোবাসা" sub="নিজেদের কথায় তারা যা বলেছেন।" />
        <div className="rev-track" ref={trackRef} onScroll={onScroll}>
          {REVIEWS.map((r, i) => (
            <div className="rev-card" key={i}>
              <span className="rev-quote" aria-hidden="true">❝</span>
              <Stars n={5} />
              <p className="rev-text bn-serif" lang="bn">{r.text}</p>
              <div className="rev-foot">
                <span className="rev-avatar bn-serif">{r.init}</span>
                <div>
                  <div className="rev-name bn">{r.name}</div>
                  <div className="rev-loc bn">{r.loc} <Icon name="check" size={12} color="var(--primary-light)" /> ভেরিফায়েড</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rev-dots">
          {REVIEWS.map((_, i) => (
            <button key={i} className={"rd" + (i === active ? " on" : "")} aria-label={"রিভিউ " + (i + 1)} onClick={() => goto(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { BundleOffers, BrandStory, Reviews });
