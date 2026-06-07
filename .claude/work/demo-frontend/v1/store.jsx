/* FruitSnacks — shared shop context */
const ShopContext = React.createContext({
  cart: 0, wish: 0, wishlist: {}, addToCart: () => {}, toggleWish: () => {},
});
function useShop() { return React.useContext(ShopContext); }
window.ShopContext = ShopContext;
window.useShop = useShop;
