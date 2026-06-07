/* FruitSnacks V2 — shared shop context + provider */
const ShopContext = React.createContext(null);
function useShop() { return React.useContext(ShopContext); }

function ShopProvider({ children }) {
  const [items, setItems] = React.useState([
    { key: "p1|500g", id: "p1", name: "Premium Iranian Dates", price: 350, tone: "t-plum", variant: "Regular · 500 g · Standard pouch", qty: 1 },
    { key: "p4|500g", id: "p4", name: "Mixed Nuts Box — 4 Kinds", price: 650, tone: "t-plum", variant: "Classic · 500 g · Standard pouch", qty: 1 },
  ]);
  const [wish, setWish] = React.useState(0);
  const [wishlist, setWishlist] = React.useState({});
  const [cartBump, setCartBump] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [quickView, setQuickView] = React.useState(null);
  const [compare, setCompare] = React.useState({});
  const bumpT = React.useRef(null);
  const toastT = React.useRef(null);

  const cart = items.reduce((s, it) => s + it.qty, 0);
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);

  const bump = () => {
    setCartBump(true);
    clearTimeout(bumpT.current);
    bumpT.current = setTimeout(() => setCartBump(false), 460);
  };

  const addToCart = React.useCallback((item, qty) => {
    const q = qty || 1;
    const key = item.id + "|" + (item.variant || "default");
    setItems((arr) => {
      const i = arr.findIndex((x) => x.key === key);
      if (i >= 0) {
        const next = arr.slice();
        next[i] = { ...next[i], qty: next[i].qty + q };
        return next;
      }
      return [...arr, { key, id: item.id, name: item.name, price: item.price, tone: item.tone || "t-bronze", variant: item.variant || "Standard", qty: q }];
    });
    bump();
    setToast({ name: item.name, price: item.price, qty: q });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const updateQty = React.useCallback((key, delta) => {
    setItems((arr) => arr.map((x) => x.key === key ? { ...x, qty: Math.max(1, x.qty + delta) } : x));
  }, []);
  const removeItem = React.useCallback((key) => {
    setItems((arr) => arr.filter((x) => x.key !== key));
  }, []);

  const toggleWish = React.useCallback((id) => {
    setWishlist((w) => {
      const next = { ...w, [id]: !w[id] };
      if (!next[id]) delete next[id];
      setWish(Object.keys(next).length);
      return next;
    });
  }, []);

  const toggleCompare = React.useCallback((id) => {
    setCompare((c) => {
      const next = { ...c, [id]: !c[id] };
      if (!next[id]) delete next[id];
      return next;
    });
  }, []);

  const openCart = React.useCallback(() => setCartOpen(true), []);
  const closeCart = React.useCallback(() => setCartOpen(false), []);
  const openQuickView = React.useCallback((p) => setQuickView(p), []);
  const closeQuickView = React.useCallback(() => setQuickView(null), []);

  const val = {
    items, cart, subtotal, wish, wishlist, cartBump, toast, compare,
    addToCart, updateQty, removeItem, toggleWish, toggleCompare,
    cartOpen, openCart, closeCart,
    quickView, openQuickView, closeQuickView,
  };
  return <ShopContext.Provider value={val}>{children}</ShopContext.Provider>;
}

Object.assign(window, { ShopContext, useShop, ShopProvider });
