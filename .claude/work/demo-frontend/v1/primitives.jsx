/* FruitSnacks — primitives: icons, placeholder, rating */

// Line-icon set (simple strokes, "hand-drawn" feel via round caps)
const I = {
  leaf: "M11 21c-4.5 0-8-3.2-8-8 0-5 4-9 16-9 0 9-3 17-8 17zm0-4c3-2 5-6 5-9",
  search: null, // custom below
};

function Icon({ name, size = 20, sw = 1.6, color = "currentColor", style }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", style,
  };
  const paths = {
    leaf: <><path d="M4 20C4 12 9 4 20 4c0 11-6 16-12 16-2.5 0-4-1.5-4-4z" /><path d="M9 17c2-4 5-7 9-9" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
    heart: <path d="M12 20S4 14.5 4 9a4.2 4.2 0 0 1 8-1.6A4.2 4.2 0 0 1 20 9c0 5.5-8 11-8 11z" />,
    bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="M6 6l12 12M18 6L6 18" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevron: <path d="M9 6l6 6-6 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    fire: <path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C9 10 10 9 10 7c1 .5 2 1.5 2 .5 0-2 0-3 0-4.5z" />,
    gift: <><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M4 9h16M12 9v11M8.5 9C6 9 6 5 8.5 5S12 9 12 9s.5-4 3-4 2 4 0 4" /></>,
    folder: <><path d="M4 7a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" /></>,
    truck: <><rect x="2" y="7" width="13" height="9" rx="1" /><path d="M15 10h4l3 3v3h-7z" /><circle cx="6.5" cy="18" r="1.6" /><circle cx="18" cy="18" r="1.6" /></>,
    sprout: <><path d="M12 21v-9" /><path d="M12 12C12 8 9 6 5 6c0 4 3 6 7 6z" /><path d="M12 14c0-3 2-5 6-5 0 3-2 5-6 5z" /></>,
    refresh: <><path d="M4 12a8 8 0 0 1 14-5l2 2" /><path d="M20 5v4h-4" /><path d="M20 12a8 8 0 0 1-14 5l-2-2" /><path d="M4 19v-4h4" /></>,
    wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="14" r="1" /></>,
    pin: <><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z" />,
    check: <path d="M5 12l4.5 4.5L19 7" />,
    star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor" stroke="none" />,
    starline: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" />,
    home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    cursor: <><path d="M5 3l14 7-6 2-2 6z" fill="currentColor" stroke="none" /></>,
    fb: <path d="M14 8h2V5h-2c-2 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V8.5c0-.4.2-.5.5-.5z" fill="currentColor" stroke="none" />,
    ig: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r="0.6" fill="currentColor" /></>,
    wa: <path d="M5 19l1.2-3.2A7 7 0 1 1 9 18l-4 1zm5.5-9c-.2 0-.5 0-.7.4s-.8 1-.8 2.3.9 2.7 1 2.9 1.7 2.7 4.1 3.7c2 .8 2.4.6 2.8.6s1.3-.5 1.5-1 .2-1 .1-1.1l-2-1c-.2-.1-.4 0-.6.2l-.6.7c-.1.1-.2.2-.5.1a5.6 5.6 0 0 1-2.8-2.4c-.2-.4 0-.5.2-.7l.4-.5c.1-.2 0-.4 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4z" fill="currentColor" stroke="none" />,
    yt: <><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" /></>,
    tiktok: <path d="M14 4v9.5a3 3 0 1 1-3-3M14 4c.5 2.2 2 3.6 4 3.8" />,
    messenger: <path d="M12 3c5 0 9 3.7 9 8.3S17 19 12 19a10 10 0 0 1-2.7-.4L5 20l1.2-3.1A7.7 7.7 0 0 1 3 11.3C3 6.7 7 3 12 3z" />,
    chatdots: <><path d="M4 5h16v11H9l-5 4z" /><circle cx="9" cy="10.5" r="0.6" fill="currentColor" /><circle cx="12" cy="10.5" r="0.6" fill="currentColor" /><circle cx="15" cy="10.5" r="0.6" fill="currentColor" /></>,
  };
  return <svg {...common} aria-hidden="true">{paths[name] || null}</svg>;
}

// Striped placeholder with monospace caption
function Ph({ label, tone = "tone-honey", className = "" }) {
  return (
    <div className={"ph " + tone + " " + className}>
      <span className="ph-label">{label}</span>
    </div>
  );
}

// rating dots row (product card)
function RatingDots({ rating }) {
  if (!rating) return null;
  const full = Math.round(rating.avg);
  return (
    <div className="pcard-rating">
      <div className="dots" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={"dot" + (i < full ? " fill" : "")} />
        ))}
      </div>
      <span className="rating-txt">{rating.avg.toFixed(1)} ({rating.count})</span>
    </div>
  );
}

// star row for reviews
function Stars({ n = 5, color = "var(--secondary)" }) {
  return (
    <div className="rev-stars" aria-label={n + " stars"}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name="star" size={16} color={i < n ? color : "var(--border-soft)"} />
      ))}
    </div>
  );
}

// squiggle underline svg for hero
function Squiggle() {
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M2 7c25-7 50-7 75-2s50 8 75 3 40-6 46-4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const Flourish = () => <div className="flourish" aria-hidden="true">❧</div>;

// section header block
function SectionHead({ eyebrow, title, sub, center = true, light = false }) {
  return (
    <div className={center ? "head-center" : ""}>
      <div className="eyebrow" style={light ? { color: "var(--secondary-light)" } : null}>{eyebrow}</div>
      <h2 className="section-title bn-serif" style={light ? { color: "var(--bg-cream)" } : null}>{title}</h2>
      {sub && <p className="section-sub" style={light ? { color: "var(--whisper)" } : null}>{sub}</p>}
    </div>
  );
}

Object.assign(window, { Icon, Ph, RatingDots, Stars, Squiggle, Flourish, SectionHead });
