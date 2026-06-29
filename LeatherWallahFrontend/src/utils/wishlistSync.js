/**
 * wishlistSync — F3.
 *
 * Mirrors cartSync.js for the BE-backed wishlist (Phase G1). Wishlist on the
 * storefront has always been localStorage-only (F-10 in issues.md); F3 adds
 * an additive sync layer so logged-in buyers keep their saved items across
 * devices. The localStorage flow is untouched.
 *
 * `localStorage.wishlist` shape (legacy): [{ productId, variation_product_id, ... }]
 * BE `/wishlist/sync` body: { items: [{ product_id, variation_id? }] }
 *
 * Both call sites are best-effort — never throw, never block UI.
 */

import { BASE_URL } from "@/components/utils/baseURL";

const readLocalWishlist = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("wishlist");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

/**
 * After login: push the localStorage wishlist into the DB. BE upserts each
 * row (idempotent, won't overwrite notify_back_in_stock). Call from the
 * login success handler (next to syncCartAfterLogin).
 */
export const syncWishlistAfterLogin = async () => {
  const local = readLocalWishlist();
  if (!local.length) return;
  const items = local
    .map((w) => ({
      product_id: w?.productId,
      variation_id: w?.variation_product_id || undefined,
    }))
    .filter((x) => x.product_id);
  if (!items.length) return;
  try {
    await fetch(`${BASE_URL}/wishlist/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items }),
      keepalive: true,
    });
  } catch (_) {
    // silent
  }
};

/**
 * Best-effort per-item upsert. Called by PDP heart-icon click for logged-in
 * users so the add propagates to other devices. Guests skip (no isLoggedIn).
 * Never throws — localStorage already holds the truth.
 */
export const addToWishlistRemote = async (
  productId,
  variation_product_id,
  isLoggedIn,
) => {
  if (!isLoggedIn || !productId) return;
  try {
    await fetch(`${BASE_URL}/wishlist/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        product_id: productId,
        variation_id: variation_product_id || undefined,
      }),
      keepalive: true,
    });
  } catch (_) {
    // silent — localStorage already updated
  }
};

/**
 * Best-effort per-item delete. Mirror of addToWishlistRemote for the remove
 * flow (PDP heart toggle off, WishList page delete, UserDashboard delete).
 */
export const removeFromWishlistRemote = async (
  productId,
  variation_product_id,
  isLoggedIn,
) => {
  if (!isLoggedIn || !productId) return;
  try {
    await fetch(`${BASE_URL}/wishlist/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        product_id: productId,
        variation_id: variation_product_id || undefined,
      }),
      keepalive: true,
    });
  } catch (_) {
    // silent
  }
};

/**
 * On a logged-in page load: pull DB wishlist down and union-merge into local.
 * Server-wins is wrong here (localStorage holds add-clicks done while offline);
 * we keep every local item and add any DB items the local doesn't have. The
 * local list stays the storefront source of truth — BE just preserves it
 * across devices.
 */
export const loadWishlistFromDB = async () => {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch(`${BASE_URL}/wishlist`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const json = await res.json();
    const dbRows = json?.data || [];
    if (!Array.isArray(dbRows) || !dbRows.length) return;

    const local = readLocalWishlist();
    const key = (it) =>
      `${it?.productId || it?.product_id?._id || ""}:${
        it?.variation_product_id || it?.variation_id?._id || ""
      }`;
    const seen = new Set(local.map(key));

    // Translate DB rows to legacy localStorage shape so UserDashboardWishList
    // can render them without changes.
    const additions = dbRows
      .map((r) => {
        const p = r?.product_id;
        if (!p || typeof p !== "object") return null;
        const v = r?.variation_id && typeof r.variation_id === "object"
          ? r.variation_id
          : null;
        return {
          productId: p._id,
          product_name: p.product_name,
          product_slug: p.product_slug,
          product_price: p.product_price,
          product_discount_price: p.product_discount_price,
          main_image: p.main_image,
          is_variation: !!v,
          variation_product_id: v?._id || null,
          variation: v
            ? {
                _id: v._id,
                variation_name: v.variation_name,
                variation_price: v.variation_price,
              }
            : undefined,
        };
      })
      .filter((it) => it && !seen.has(key(it)));

    if (!additions.length) return;
    const merged = [...local, ...additions];
    localStorage.setItem("wishlist", JSON.stringify(merged));
    // Storage event so any open wishlist page re-reads. (Same tab won't fire
    // 'storage' natively — components that need real-time update should also
    // poll on focus or expose a refresh button.)
    window.dispatchEvent(new Event("wishlist:updated"));
  } catch (_) {
    // silent
  }
};
