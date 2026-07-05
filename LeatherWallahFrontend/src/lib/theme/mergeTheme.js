// Deep-merge product.theme_overrides into the base theme document.
// Override fields in product.theme_overrides take precedence; missing
// fields inherit from the theme. Keeps colors/button_style nested objects
// merged at the field level, not replaced wholesale.

// Default fallback theme used when a product has no `theme_id`. Values are
// chosen to match the site-wide TweakCN-adapted green theme in globals.css
// (`:root` block). Kept as hex (not oklch) so the themed PDP works in older
// browsers if ever rendered outside the shadcn surface, and so admins can
// preview the colors easily. The dark-mode equivalent isn't here because
// themed PDP itself doesn't switch with day/night (the product's theme always
// wins on themed pages); day/night affects the shadcn surface around it.
const NEUTRAL_FALLBACK = {
  theme_name: "Default",
  theme_slug: "default",
  colors: {
    primary: "#6B1A1F",        // deep burgundy (logo) — strong brand presence
    primary_light: "#EAC9CB",  // soft rose tint
    primary_dark: "#4A0E12",   // very dark wine
    page_bg: "#F8F6F0",        // ≈ background (warm cream)
    section_bg: "#EDE9DC",     // ≈ muted (light beige)
    heading_text: "#2C2520",   // ≈ foreground
    body_text: "#4A3F35",      // ≈ muted-foreground
    accent: "#C9A227",         // warm gold — pairs with burgundy (logo)
    button_text: "#FFFFFF",
  },
  floating_assets: [],
  typography: {
    font_key: "hind-siliguri",
    heading_weight: "700",
    style: "rounded",
  },
  button_style: { border_radius: "8px", variant: "filled" },
};

export function mergeTheme(theme, overrides) {
  const base = theme || NEUTRAL_FALLBACK;
  if (!overrides) return base;

  return {
    ...base,
    colors: {
      ...base.colors,
      ...(overrides.colors || {}),
    },
    button_style: {
      ...base.button_style,
      ...(overrides.button_style || {}),
    },
  };
}

export { NEUTRAL_FALLBACK };
