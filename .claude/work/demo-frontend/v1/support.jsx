/* FruitSnacks — FAQ, Newsletter, Footer, Floats, Bottom nav */

function FAQ() {
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section bg-parchment reveal">
      <div className="container">
        <div className="faq-grid">
          <div>
            <div className="eyebrow">HELP &amp; SUPPORT</div>
            <h2 className="section-title bn-serif" style={{ fontSize: "clamp(30px,3.6vw,48px)" }}>প্রায়শই জিজ্ঞাসিত প্রশ্ন</h2>
            <p className="section-sub bn-serif" style={{ marginLeft: 0 }} lang="bn">কিছু খুঁজে পাচ্ছেন না?</p>
            <div className="faq-cta">
              <a href="#" className="btn btn-primary bn"><Icon name="wa" size={18} /> WhatsApp এ মেসেজ করুন</a>
            </div>
          </div>
          <div>
            {FAQS.map((f, i) => (
              <div className={"faq-item" + (open === i ? " open" : "")} key={i}>
                <button className="faq-q bn" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                  {f.q}
                  <span className="faq-ico"><Icon name="close" size={18} sw={2} style={{ transform: "rotate(45deg)" }} /></span>
                </button>
                <div className="faq-a" style={{ maxHeight: open === i ? "240px" : "0" }}>
                  <div className="faq-a-inner bn" lang="bn">{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [tab, setTab] = React.useState("whatsapp");
  const [val, setVal] = React.useState("");
  const [ok, setOk] = React.useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!val.trim()) return;
    setOk("ধন্যবাদ! আপনি সফলভাবে সাবস্ক্রাইব করেছেন ✓");
    setVal("");
    setTimeout(() => setOk(""), 4000);
  };
  return (
    <section className="section news bg-deep reveal">
      <span className="news-leaf" style={{ top: "18%", left: "12%", transform: "rotate(-20deg)" }}><Icon name="leaf" size={90} /></span>
      <span className="news-leaf" style={{ top: "30%", right: "10%", transform: "rotate(40deg)" }}><Icon name="leaf" size={70} /></span>
      <span className="news-leaf" style={{ bottom: "12%", left: "40%", transform: "rotate(8deg)" }}><Icon name="leaf" size={60} /></span>
      <div className="container">
        <div className="news-inner">
          <div className="eyebrow" style={{ color: "var(--secondary-light)" }}>STAY IN TOUCH</div>
          <h2 className="news-title bn-serif" lang="bn">শুধু সেরা অফার, কোনো স্প্যাম নয়।</h2>
          <p className="news-sub bn" lang="bn">WhatsApp বা ইমেইলে — যেটা আপনার সুবিধা। নতুন পণ্য আর শুধুমাত্র সাবস্ক্রাইবারদের জন্য ছাড়।</p>
          <div className="news-tabs">
            <button className={"news-tab" + (tab === "whatsapp" ? " on" : "")} onClick={() => setTab("whatsapp")}>WhatsApp</button>
            <button className={"news-tab" + (tab === "email" ? " on" : "")} onClick={() => setTab("email")}>Email</button>
          </div>
          <form className="news-form" onSubmit={submit}>
            <input
              value={val} onChange={(e) => setVal(e.target.value)}
              type={tab === "email" ? "email" : "tel"}
              placeholder={tab === "email" ? "you@example.com" : "+8801XXXXXXXXX"}
              aria-label="Subscribe"
            />
            <button type="submit" className="btn btn-sage bn">সাবস্ক্রাইব</button>
          </form>
          <div className="news-ok bn">{ok}</div>
          <p className="news-fine bn" lang="bn">আমরা আপনার ডেটা নিরাপদে রাখি। যেকোনো সময় আনসাবস্ক্রাইব করতে পারবেন।</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    ["শপ", ["সকল পণ্য", "বেস্টসেলার", "নতুন এসেছে", "বান্ডল অফার", "গিফট প্যাক"]],
    ["সহায়তা", ["অর্ডার ট্র্যাক", "রিটার্ন পলিসি", "শিপিং ইনফো", "FAQ", "যোগাযোগ"]],
    ["কোম্পানি", ["আমাদের গল্প", "কোয়ালিটি প্রমিস", "ব্লগ", "ক্যারিয়ার", "প্রাইভেসি পলিসি"]],
  ];
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="foot-brand">
            <span className="foot-logo">
              <span style={{ color: "var(--secondary-light)" }}><Icon name="leaf" size={26} /></span>
              <span className="logo-word">FruitSnacks</span>
            </span>
            <p className="foot-tag bn" lang="bn">বাংলাদেশের প্রতিটা কোণায়, খাঁটি আর সতেজ স্ন্যাকস।</p>
            <div className="foot-social">
              {["fb", "ig", "wa", "yt", "tiktok"].map((s) => (
                <a key={s} href="#" aria-label={s}><Icon name={s} size={18} /></a>
              ))}
            </div>
            <div className="foot-contact bn">
              <div><Icon name="phone" size={15} /> +880 1700-000000</div>
              <div><Icon name="check" size={15} /> hello@fruitsnacksbd.com</div>
              <div><Icon name="pin" size={15} /> বনানী, ঢাকা ১২১৩</div>
            </div>
          </div>
          {cols.map(([title, links]) => (
            <div className="foot-col" key={title}>
              <h5 className="bn">{title}</h5>
              {links.map((l) => <a key={l} href="#" className="bn">{l}</a>)}
            </div>
          ))}
        </div>

        <div className="foot-strip">
          <h6 className="bn">পেমেন্ট</h6>
          <div className="pay-row">
            {["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "SSL"].map((p) => (
              <span className="pay-box" key={p}>{p}</span>
            ))}
          </div>
        </div>
        <div className="foot-strip">
          <h6 className="bn">ডেলিভারি পার্টনার</h6>
          <div className="pay-row">
            {["Pathao", "Steadfast", "RedX"].map((p) => (
              <span className="pay-box" key={p}>{p}</span>
            ))}
          </div>
        </div>

        <div className="foot-bottom">
          <span className="bn">© ২০২৫ FruitSnacks Bangladesh — সকল অধিকার সংরক্ষিত।</span>
          <span className="links">
            <a href="#">Terms</a><span>·</span><a href="#">Privacy</a><span>·</span><a href="#">Cookies</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function Floats() {
  const items = [
    ["float-chat", "chatdots", "চ্যাট করুন"],
    ["float-msg", "messenger", "Messenger"],
    ["float-wa", "wa", "WhatsApp"],
  ];
  return (
    <div className="floats">
      {items.map(([cls, ic, tip]) => (
        <a key={cls} href="#" className={"float-btn " + cls} aria-label={tip}>
          <span className="tip bn">{tip}</span>
          <Icon name={ic} size={26} color="#fff" />
        </a>
      ))}
    </div>
  );
}

function BottomNav() {
  const shop = useShop();
  const items = [
    ["home", "হোম", true, 0],
    ["grid", "শপ", false, 0],
    ["heart", "উইশলিস্ট", false, shop.wish],
    ["user", "অ্যাকাউন্ট", false, 0],
    ["bag", "কার্ট", false, shop.cart],
  ];
  return (
    <nav className="botnav" aria-label="Mobile">
      {items.map(([ic, lbl, active, badge]) => (
        <a key={lbl} href="#" className={active ? "active" : ""}>
          {badge > 0 && <span className="bn-badge">{badge}</span>}
          <Icon name={ic} size={22} />
          <span className="bn">{lbl}</span>
        </a>
      ))}
    </nav>
  );
}

Object.assign(window, { FAQ, Newsletter, Footer, Floats, BottomNav });
