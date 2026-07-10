import { SITE_URL } from "./baseURL";

/**
 * Normalise an admin-entered link into something `next/link` can route.
 *
 * The Banner form takes a free-text "path" with no validation, so what lands in
 * the database is whatever the admin typed. The dangerous shape is a bare
 * hostname: `leatherwallah.com/products/x` has no leading slash, so the browser
 * resolves it RELATIVE to the current page and you land on
 * `/leatherwallah.com/products/x` — a 404, with nothing to suggest why.
 *
 * Returns:
 *   - a site-relative path ("/products/x") for anything pointing at our own
 *     site, however it was written — this also keeps client-side routing, which
 *     a full URL to our own origin would otherwise turn into a document reload
 *   - the original absolute URL for a genuinely external link
 *   - null when there's nothing usable, so the caller can hide the CTA rather
 *     than render a link to "/"
 */
export const toInternalPath = (raw, siteUrl = SITE_URL) => {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  // Already what we want.
  if (value.startsWith("/")) return value;

  const ownHost = (() => {
    try {
      return new URL(siteUrl).hostname.replace(/^www\./i, "");
    } catch {
      return null;
    }
  })();

  // A full URL: strip to a path only when it's our own site.
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./i, "");
      if (ownHost && host === ownHost) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
      return value; // external — leave it alone
    } catch {
      return null;
    }
  }

  // No scheme and no slash. Could be our own host typed without one, or just a
  // path missing its slash.
  const stripped = value.replace(/^www\./i, "");
  if (ownHost) {
    const lower = stripped.toLowerCase();
    if (lower === ownHost) return "/";
    if (lower.startsWith(`${ownHost}/`)) {
      return `/${stripped.slice(ownHost.length + 1)}`;
    }
  }
  return `/${value.replace(/^\/+/, "")}`;
};

export default toInternalPath;
