/* FruitSnacks V2 — slide-out mini cart drawer */

const FREE_SHIP = 1500;

function CartDrawer() {
  const { items, cart, subtotal, cartOpen, closeCart, updateQty, removeItem } = useShop();

  React.useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e) => { if (e.key === "Escape") closeCart(); };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("body-lock");
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("body-lock"); };
  }, [cartOpen, closeCart]);

  const toGo = Math.max(0, FREE_SHIP - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIP) * 100);

  return (
    <>
      <div className={"cart-scrim" + (cartOpen ? " open" : "")} onClick={closeCart} />
      <aside className={"cart-drawer" + (cartOpen ? " open" : "")} aria-hidden={!cartOpen} aria-label="Shopping bag">
        <div className="cart-head">
          <div className="cart-title">
            Your Bag <span className="cart-count-pill">{cart}</span>
          </div>
          <button className="icon-btn" aria-label="Close bag" onClick={closeCart}><Icon name="close" size={22} /></button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-ico"><Icon name="bag" size={40} color="var(--primary-soft)" /></span>
            <div className="cart-empty-title">Your bag is empty</div>
            <p className="cart-empty-sub">Add a little luxury — hand-curated dried fruits and nuts await.</p>
            <button className="btn btn-primary" onClick={closeCart}>Continue shopping <Icon name="arrow" size={16} className="arrow" /></button>
          </div>
        ) : (
          <>
            <div className="cart-ship">
              {toGo > 0
                ? <span>You're <b>{CUR} {toGo.toLocaleString("en-IN")}</b> away from free luxury delivery</span>
                : <span><Icon name="check" size={14} color="#5A8F5A" /> You've unlocked free luxury delivery</span>}
              <span className="cart-ship-bar"><span style={{ width: pct + "%" }} /></span>
            </div>

            <div className="cart-items noscroll">
              {items.map((it) => (
                <div key={it.key} className="cart-item">
                  <div className="cart-thumb"><Ph label="" tone={it.tone} /></div>
                  <div className="cart-item-main">
                    <div className="cart-item-top">
                      <div className="cart-item-name">{it.name}</div>
                      <button className="cart-remove" aria-label="Remove" onClick={() => removeItem(it.key)}><Icon name="close" size={15} /></button>
                    </div>
                    <div className="cart-item-variant">{it.variant}</div>
                    <div className="cart-item-bottom">
                      <div className="cart-qty">
                        <button aria-label="Decrease" onClick={() => updateQty(it.key, -1)} disabled={it.qty <= 1}><Icon name="minus" size={14} /></button>
                        <span>{it.qty}</span>
                        <button aria-label="Increase" onClick={() => updateQty(it.key, 1)}><Icon name="plus" size={14} /></button>
                      </div>
                      <div className="cart-item-price">{CUR} {(it.price * it.qty).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-foot">
              <div className="cart-row">
                <span>Subtotal</span>
                <span className="cart-subtotal">{CUR} {subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="cart-row muted">
                <span>Delivery</span>
                <span>{toGo > 0 ? "Calculated at checkout" : "Free"}</span>
              </div>
              <button className="cart-checkout">Checkout <Icon name="arrow" size={17} className="arrow" /></button>
              <button className="cart-continue" onClick={closeCart}>Continue shopping</button>
              <div className="cart-pay">
                <Icon name="shield" size={14} color="var(--primary-soft)" /> Secure checkout · bKash · Nagad · Visa · COD
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

window.CartDrawer = CartDrawer;
