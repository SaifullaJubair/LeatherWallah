import { redirect } from "next/navigation";

// Legacy QR safety net. Pre-2026-05-30 the backend generated QR URLs in the
// shape `/products-themed/<slug>`. That route never existed in the frontend
// (the real route is `/products/<slug>`), so old printed QRs would 404.
//
// New QRs encode `/q/<short_code>` instead. This catch-all 301-redirects any
// legacy `/products-themed/...` hit to the current PDP, so previously printed
// labels continue to work. Stays permanently as a safety net.
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ProductsThemedRedirectPage({ params }) {
  const { slug } = await params;
  if (!slug) redirect("/");
  redirect(`/products/${slug}`);
}
