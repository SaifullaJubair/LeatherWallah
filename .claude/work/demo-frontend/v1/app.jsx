/* FruitSnacks — App root */
const { useState, useEffect, useRef, useCallback } = React;

// Live social-proof toast
const PROOF = [
  ["ধানমন্ডির রুবিনা", "মিক্সড নাটস বক্স"],
  ["চট্টগ্রামের তানভীর", "প্রিমিয়াম ইরানি খেজুর"],
  ["উত্তরার নুসরাত", "অফিস স্ন্যাক জার"],
  ["সিলেটের সাকিব", "গিফট হ্যাম্পার"],
];
function ProofToast() {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    let idx = 0;
    const cycle = () => {
      setI(idx % PROOF.length); idx++;
      setShow(true);
      setTimeout(() => setShow(false), 4500);
    };
    const first = setTimeout(cycle, 6000);
    const loop = setInterval(cycle, 18000);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, []);
  const [who, what] = PROOF[i];
  return (
    <div className={"proof-toast" + (show ? " on" : "")} role="status">
      <span className="proof-dot" />
      <div>
        <div className="proof-who bn"><b>{who}</b> এইমাত্র অর্ডার দিলেন</div>
        <div className="proof-what bn">{what} <Icon name="check" size={12} color="var(--primary)" /></div>
      </div>
    </div>
  );
}

function App() {
  const [cart, setCart] = useState(0);
  const [wishlist, setWishlist] = useState({});
  const [drawer, setDrawer] = useState(false);

  const addToCart = useCallback((id) => {
    setCart((c) => c + 1);
    const bag = document.querySelector('.nav-right .icon-btn[aria-label="Cart"]');
    if (bag) { bag.classList.remove("bump"); void bag.offsetWidth; bag.classList.add("bump"); }
  }, []);
  const toggleWish = useCallback((id) => {
    setWishlist((w) => { const n = { ...w }; if (n[id]) delete n[id]; else n[id] = true; return n; });
  }, []);

  const wish = Object.keys(wishlist).length;

  // scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.18 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const ctx = { cart, wish, wishlist, addToCart, toggleWish };

  return (
    <ShopContext.Provider value={ctx}>
      <a href="#main" className="skip">মূল কন্টেন্টে যান</a>
      <TopBar />
      <Navbar onOpenDrawer={() => setDrawer(true)} />
      <Drawer open={drawer} onClose={() => setDrawer(false)} />
      <main id="main">
        <Hero />
        <TrustStrip />
        <FeaturedCategories />
        <FlashSale />
        <ProductStrip eyebrow="OUR FAVORITES" title="বেস্টসেলার" sub="যা সবচেয়ে বেশি ভালোবাসা পেয়েছে।" items={PRODUCTS.bestsellers} bg="bg-parchment" />
        <BundleOffers />
        <ProductStrip eyebrow="TRENDING NOW" title="এখন ট্রেন্ডিং" sub="এই সপ্তাহে সবাই যা চাচ্ছে।" items={PRODUCTS.trending} bg="bg-cream" />
        <BrandStory />
        <ProductStrip eyebrow="FRESH IN" title="নতুন এসেছে" sub="সদ্য তাকে এসেছে।" items={PRODUCTS.fresh} bg="bg-cream" />
        <Reviews />
        <FAQ />
        <Newsletter />
      </main>
      <Footer />
      <Floats />
      <BottomNav />
      <ProofToast />
    </ShopContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
