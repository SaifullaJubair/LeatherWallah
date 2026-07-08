// Server-rendered <style> tag that injects theme CSS variables on :root.
// Used at the top of the product page body so the variables exist on first
// paint — no FOUC, no hydration mismatch. Variables are scoped to a wrapper
// data attribute when needed; here we use :root because the entire product
// page renders themed.

import ThemeFonts from "./ThemeFonts";

const FONT_FAMILY_MAP = {
  "hind-siliguri": '"Hind Siliguri", system-ui, sans-serif',
  "tiro-bangla": '"Tiro Bangla", "Hind Siliguri", serif',
  "noto-sans-bengali": '"Noto Sans Bengali", system-ui, sans-serif',
  "baloo-da-2": '"Baloo Da 2", system-ui, sans-serif',
  mina: '"Mina", system-ui, sans-serif',
};

export default function ThemeStyleInjector({ theme }) {
  if (!theme?.colors) return null;

  const c = theme.colors;
  const fontFam = FONT_FAMILY_MAP[theme.typography?.font_key] || FONT_FAMILY_MAP["hind-siliguri"];
  const headingWeight = theme.typography?.heading_weight || "700";
  const buttonRadius = theme.button_style?.border_radius || "8px";

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
      --brand-heading-weight: ${headingWeight};
      --brand-font: ${fontFam};
    }
  `.trim();

  return (
    <>
      {/* The faces referenced by --brand-font. Loaded here (not from globals.css)
          so only themed routes pay for them, and without blocking first paint. */}
      <ThemeFonts />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
