/* FruitSnacks V2 — app shell + scroll reveal */

function useReveal() {
  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll(".reveal, .stagger");
    if (reduce) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          if (el.classList.contains("stagger")) {
            [...el.children].forEach((ch, i) => { ch.style.transitionDelay = (i * 0.06) + "s"; });
          }
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
}

function App() {
  useReveal();
  const [drawer, setDrawer] = React.useState(false);
  const [mSearch, setMSearch] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.toggle("body-lock", drawer || mSearch);
  }, [drawer, mSearch]);

  return (
    <ShopProvider>
      <a href="#main" className="skip">Skip to content</a>
      <TopBar />
      <Navbar onOpenDrawer={() => setDrawer(true)} onOpenMobileSearch={() => setMSearch(true)} />
      <main id="main">
        <Hero />
        <TrustStrip />
        <Categories />
        <PromoBanner />
        <FlashSale />
        <Bestsellers />
        <Trending />
        <JustForYou />
        <EditorsChoice />
        <CategorySpotlight />
        <NewArrivals />
        <Bundles />
        <BrandStory />
        <Reviews />
        <Faq />
        <Newsletter />
      </main>
      <Footer />
      <FloatingChat />
      <BottomNav />
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <MobileSearch open={mSearch} onClose={() => setMSearch(false)} />
      <CartToast />
      <CartDrawer />
      <QuickView />
      <TweaksMount />
    </ShopProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
