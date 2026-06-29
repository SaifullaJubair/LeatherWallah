// Resolves the storefront (Next.js frontend) base URL used to build the
// /theme-preview iframe links shown in the admin Theme pages.
//
// Why this exists: the URL used to be `import.meta.env.VITE_FRONTEND_URL ||
// "http://localhost:3000"` duplicated in two files. On a LIVE admin deploy where
// VITE_FRONTEND_URL was not set, that fell back to localhost:3000 — so the theme
// preview iframe silently tried to load the developer's machine and rendered
// nothing (AB-2). Vite inlines env at BUILD time, so the real fix is also to set
// VITE_FRONTEND_URL in the admin container + rebuild — but this keeps the code
// from silently pointing at localhost in production.

const RAW = (import.meta.env.VITE_FRONTEND_URL || "").trim().replace(/\/+$/, "");

// True when the admin itself is being served from a local dev host.
const isLocalHost = () => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0";
};

/**
 * Returns the storefront base URL (no trailing slash) or `null` when it cannot
 * be safely determined (production admin with no VITE_FRONTEND_URL configured).
 * Callers should treat `null` as "preview unavailable — show a config hint"
 * rather than guessing localhost.
 */
export const getFrontendUrl = () => {
  if (RAW) return RAW;
  // No env configured. Only fall back to localhost when WE are local too —
  // never on a real deployed admin (that was the AB-2 silent breakage).
  if (isLocalHost()) return "http://localhost:3000";
  return null;
};

/**
 * Builds a /theme-preview URL from a URLSearchParams (or string) of theme
 * fields. Returns `null` if the frontend URL is not configured.
 */
export const buildThemePreviewUrl = (params) => {
  const base = getFrontendUrl();
  if (!base) return null;
  const qs = params?.toString?.() ?? String(params || "");
  return `${base}/theme-preview${qs ? `?${qs}` : ""}`;
};
