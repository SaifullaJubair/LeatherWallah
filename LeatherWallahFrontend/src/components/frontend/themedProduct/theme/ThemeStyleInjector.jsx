// Server-rendered <style> tag that injects theme CSS variables on :root.
// Used at the top of the product page body so the variables exist on first
// paint — no FOUC, no hydration mismatch. Variables are scoped to a wrapper
// data attribute when needed; here we use :root because the entire product
// page renders themed.

// Each stack ends with "Hind Siliguri" so Bangla glyphs always render even when
// the chosen face is Latin-first (Poppins/Inter/etc.).
const FONT_FAMILY_MAP = {
  "hind-siliguri": '"Hind Siliguri", system-ui, sans-serif',
  "tiro-bangla": '"Tiro Bangla", "Hind Siliguri", serif',
  "noto-sans-bengali": '"Noto Sans Bengali", "Hind Siliguri", system-ui, sans-serif',
  "baloo-da-2": '"Baloo Da 2", "Hind Siliguri", system-ui, sans-serif',
  mina: '"Mina", "Hind Siliguri", system-ui, sans-serif',
  poppins: '"Poppins", "Hind Siliguri", system-ui, sans-serif',
  inter: '"Inter", "Hind Siliguri", system-ui, sans-serif',
  montserrat: '"Montserrat", "Hind Siliguri", system-ui, sans-serif',
  roboto: '"Roboto", "Hind Siliguri", system-ui, sans-serif',
};
const resolveFont = (key) => FONT_FAMILY_MAP[key] || FONT_FAMILY_MAP["hind-siliguri"];

export default function ThemeStyleInjector({ theme }) {
  if (!theme?.colors) return null;

  const c = theme.colors;
  // Two-font system: heading + body. Old single `font_key` is the back-compat
  // fallback for both when the newer fields aren't set.
  const t = theme.typography || {};
  const bodyFont = resolveFont(t.body_font || t.font_key);
  const headingFont = resolveFont(t.heading_font || t.font_key);
  const headingWeight = theme.typography?.heading_weight || "700";
  const buttonRadius = theme.button_style?.border_radius || "8px";
  // Derive a site-wide rounding scale from the single radius setting so cards,
  // images and badges all share the same corner language as the buttons.
  // Sharp (0) → everything square; otherwise cards get a bit more rounding.
  const rNum = parseInt(buttonRadius, 10) || 0;
  const cardRadius = rNum === 0 ? "0px" : `${rNum + 8}px`;
  const badgeRadius = rNum === 0 ? "0px" : "9999px";

  const css = `
    :root {
      --brand-primary: ${c.primary};
      --brand-primary-light: ${c.primary_light};
      --brand-primary-dark: ${c.primary_dark};
      --page-bg: ${c.page_bg};
      --section-bg: ${c.section_bg};
      --heading-color: ${c.heading_text};
      --body-color: ${c.body_text};
      --accent-color: ${c.accent};
      --button-text: ${c.button_text || "#FFFFFF"};
      --button-radius: ${buttonRadius};
      --card-radius: ${cardRadius};
      --badge-radius: ${badgeRadius};
      --brand-heading-weight: ${headingWeight};
      --brand-font: ${bodyFont};
      --brand-font-heading: ${headingFont};
      --footer-bg: ${c.primary_dark || c.primary};
    }
  `.trim();

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
