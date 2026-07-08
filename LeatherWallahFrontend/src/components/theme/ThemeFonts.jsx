"use client";

import { useEffect } from "react";

// Loads the Google font faces that the per-product theme system can pick from
// (see ThemeStyleInjector's FONT_FAMILY_MAP → --brand-font).
//
// PERF: this stylesheet used to live as `@import url(fonts.googleapis.com/...)`
// at the top of globals.css. A CSS @import is render-blocking AND serialised —
// the browser had to download globals.css before it could even discover the
// font URL, then block first paint on it. PageSpeed measured ~750 ms of
// render-blocking on that one request, on EVERY route, even though only the
// themed PDP / theme-preview actually consume --brand-font.
//
// Now it renders only where --brand-font is set, and appends the stylesheet from
// an effect so it never blocks paint.
//
// The font list must stay in sync with FONT_FAMILY_MAP. `display=swap` means
// text paints immediately in a fallback face and re-renders when the real face
// arrives, so loading it late never leaves text invisible. Every stack in
// FONT_FAMILY_MAP also ends in "Hind Siliguri" → system-ui, so Bangla glyphs
// still render during (and without) the swap.
const THEME_FONTS_HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Hind+Siliguri:wght@400;500;600;700" +
  "&family=Tiro+Bangla" +
  "&family=Noto+Sans+Bengali:wght@400;500;600;700" +
  "&family=Baloo+Da+2:wght@400;500;600;700" +
  "&family=Mina:wght@400;700" +
  "&family=Poppins:wght@400;500;600;700" +
  "&family=Inter:wght@400;500;600;700" +
  "&family=Montserrat:wght@400;500;600;700" +
  "&family=Roboto:wght@400;500;700" +
  "&display=swap";

const LINK_ID = "theme-fonts";

/**
 * Appended from an effect rather than rendered as a <link> or an inline
 * <script>, because:
 *   - a rendered <link rel=stylesheet> is hoisted into <head> by Next and
 *     blocks first paint — the very thing we are removing;
 *   - a <script dangerouslySetInnerHTML> only executes when it arrives in the
 *     server HTML. Client-rendered themed views (/theme-preview, which fetches
 *     its product after hydration) would silently get --brand-font set with the
 *     font never loaded.
 * An effect covers both paths and is inherently non-blocking.
 */
export default function ThemeFonts() {
  useEffect(() => {
    if (document.getElementById(LINK_ID)) return; // already added by a previous themed route

    // gstatic serves the actual .woff2 the stylesheet points at. Font files are
    // always fetched in anonymous CORS mode, so crossOrigin is required for the
    // preconnect socket to be reused.
    if (!document.querySelector('link[rel="preconnect"][href*="fonts.gstatic.com"]')) {
      const pre = document.createElement("link");
      pre.rel = "preconnect";
      pre.href = "https://fonts.gstatic.com";
      pre.crossOrigin = "anonymous";
      document.head.appendChild(pre);
    }

    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = THEME_FONTS_HREF;
    document.head.appendChild(link);
    // Intentionally not removed on unmount: navigating away from a themed page
    // and back should not refetch, and a stray @font-face costs nothing.
  }, []);

  return (
    <noscript>
      <link rel="stylesheet" href={THEME_FONTS_HREF} />
    </noscript>
  );
}
