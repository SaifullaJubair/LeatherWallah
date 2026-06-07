/* FruitSnacks V2 — Tweaks panel */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#D4A574", "#B07F4F"],
  "primary": ["#6B2D5F", "#4A1D42", "#9C5B91"],
  "displayFont": "Tenor Sans",
  "accentWord": "Marcellus",
  "motion": true,
  "altTint": true,
  "shimmerCtas": true
}/*EDITMODE-END*/;

function TweaksMount() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement.style;
    // accent pair
    r.setProperty("--accent", t.accent[0]);
    r.setProperty("--accent-deep", t.accent[1]);
    r.setProperty("--shimmer", `linear-gradient(135deg, ${t.accent[0]} 0%, ${lighten(t.accent[0], 22)} 50%, ${t.accent[1]} 100%)`);
    r.setProperty("--glow-accent", `0 0 30px ${hexA(t.accent[0], 0.45)}`);
    // primary trio
    r.setProperty("--primary", t.primary[0]);
    r.setProperty("--primary-deep", t.primary[1]);
    r.setProperty("--primary-soft", t.primary[2] || lighten(t.primary[0], 18));
    // fonts
    r.setProperty("--font-display", `"${t.displayFont}", "Cormorant", Georgia, serif`);
    r.setProperty("--font-accent", `"${t.accentWord}", "Cormorant Garamond", serif`);
  }, [t.accent, t.primary, t.displayFont, t.accentWord]);

  React.useEffect(() => {
    document.body.classList.toggle("no-motion", !t.motion);
  }, [t.motion]);
  React.useEffect(() => {
    document.body.classList.toggle("no-alt-tint", !t.altTint);
  }, [t.altTint]);
  React.useEffect(() => {
    document.body.classList.toggle("no-shimmer-cta", !t.shimmerCtas);
  }, [t.shimmerCtas]);

  return (
    <TweaksPanel>
      <TweakSection label="Palette" />
      <TweakColor label="Champagne accent" value={t.accent}
        options={[["#D4A574", "#B07F4F"], ["#D9A6A8", "#B0727A"], ["#D8B24A", "#A8842F"], ["#C8A2C8", "#8E6B9E"]]}
        onChange={(v) => setTweak("accent", v)} />
      <TweakColor label="Primary" value={t.primary}
        options={[["#6B2D5F", "#4A1D42", "#9C5B91"], ["#7A2E3A", "#511C26", "#B05E68"], ["#2E5A52", "#1C3A34", "#5E948B"], ["#3A2E6B", "#231C4A", "#6B5EB0"]]}
        onChange={(v) => setTweak("primary", v)} />

      <TweakSection label="Typography" />
      <TweakSelect label="Display font" value={t.displayFont}
        options={["Tenor Sans", "Cormorant", "Playfair Display", "Marcellus"]}
        onChange={(v) => setTweak("displayFont", v)} />
      <TweakSelect label="Accent (italic) font" value={t.accentWord}
        options={["Marcellus", "Cormorant Garamond", "Playfair Display"]}
        onChange={(v) => setTweak("accentWord", v)} />

      <TweakSection label="Motion & Style" />
      <TweakToggle label="Animations" value={t.motion} onChange={(v) => setTweak("motion", v)} />
      <TweakToggle label="Alternating section tint" value={t.altTint} onChange={(v) => setTweak("altTint", v)} />
      <TweakToggle label="Shimmer CTA hovers" value={t.shimmerCtas} onChange={(v) => setTweak("shimmerCtas", v)} />
    </TweaksPanel>
  );
}

/* tiny color helpers */
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const cl = (c) => Math.min(255, Math.round(c + (255 - c) * (amt / 100)));
  const r = cl((n >> 16) & 255), g = cl((n >> 8) & 255), b = cl(n & 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

window.TweaksMount = TweaksMount;
