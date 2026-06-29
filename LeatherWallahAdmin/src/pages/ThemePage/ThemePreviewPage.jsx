import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import { useGetThemeById } from "../../hooks/useGetTheme";
import useGetProductsForPreview from "../../hooks/useGetProductsForPreview";
import { LoaderOverlay } from "../../components/common/loader/LoderOverley";
import { buildThemePreviewUrl } from "../../utils/frontendUrl";

// Build the frontend /theme-preview URL from a saved theme's values, so the
// admin sees the EXACT storefront PDP rendering (not a hand-rolled mock).
// Returns null when the storefront URL isn't configured (see frontendUrl.js).
// Phase 2 — pass an optional product slug to preview the theme on a REAL product
// (the FE preview ignores the product's own theme_id and uses these colors).
const previewUrlFor = (theme, slug) => {
  const c = theme?.colors || {};
  const q = new URLSearchParams({
    primary: c.primary || "",
    page_bg: c.page_bg || "",
    accent: c.accent || "",
    heading_font:
      theme?.typography?.heading_font || theme?.typography?.font_key || "",
    body_font: theme?.typography?.body_font || theme?.typography?.font_key || "",
    heading_weight: theme?.typography?.heading_weight || "",
    button_radius: theme?.button_style?.border_radius || "",
  });
  if (slug) q.set("slug", slug);
  return buildThemePreviewUrl(q);
};

const ThemePreviewPage = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetThemeById(id);
  const theme = data?.data;

  // Phase 2 — optional real-product preview. Empty = rich dummy product.
  const [slug, setSlug] = useState("");
  const { data: productsData } = useGetProductsForPreview("", 50);
  const products = productsData?.data || [];

  if (isLoading) return <LoaderOverlay />;
  if (!theme)
    return <div className="p-4 text-center text-gray-500">Theme not found.</div>;

  const url = previewUrlFor(theme, slug);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Admin context bar (not styled by the theme) */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/theme" className="text-sm text-blueColor-600 hover:underline">
            <FaArrowLeft className="inline" /> Themes
          </Link>
          <span className="text-sm text-gray-700">
            Preview: <strong>{theme.theme_name}</strong>
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              theme.status === "active"
                ? "bg-green-100 text-green-700"
                : theme.status === "draft"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {theme.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Phase 2 — pick a real product to preview this theme on. */}
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 max-w-[200px]"
            title="Preview this theme on a real product"
          >
            <option value="">Sample product (dummy)</option>
            {products.map((p) => (
              <option key={p._id} value={p.product_slug}>
                {p.product_name}
              </option>
            ))}
          </select>
          <Link
            to={`/theme/update/${id}`}
            className="text-sm text-gray-600 hover:text-blueColor-600"
          >
            Edit
          </Link>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blueColor-600 hover:underline"
            >
              <FaExternalLinkAlt size={11} /> Full screen
            </a>
          )}
        </div>
      </div>

      {/* The real storefront PDP, rendered with this theme via the frontend
          /theme-preview route (single source of truth — no mock to drift).
          When the storefront URL isn't configured we show a hint instead of
          silently loading localhost (AB-2). */}
      {url ? (
        <iframe
          key={url}
          src={url}
          title={`Preview of ${theme.theme_name}`}
          className="flex-1 w-full bg-white"
          style={{ border: 0, minHeight: "calc(100vh - 45px)" }}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="font-semibold text-yellow-800">
              Theme preview is not configured
            </p>
            <p className="mt-2 text-sm text-yellow-700">
              The storefront URL is missing. Set{" "}
              <code className="bg-yellow-100 px-1 rounded">
                VITE_FRONTEND_URL
              </code>{" "}
              (e.g. <code className="bg-yellow-100 px-1 rounded">https://leatherwallah.com</code>)
              in the admin environment and rebuild — Vite inlines env vars at build
              time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemePreviewPage;
