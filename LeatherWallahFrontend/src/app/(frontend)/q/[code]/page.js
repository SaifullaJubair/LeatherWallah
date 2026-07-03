import { redirect } from "next/navigation";
import { BASE_URL } from "@/components/utils/baseURL";

// Permanent short-URL route. The QR code on a product label encodes
// `https://<domain>/q/<short_code>`. Backend lookup returns the current
// `product_slug`; we 301-redirect to the actual PDP at `/products/<slug>`.
//
// Why this indirection exists (vs encoding the slug directly into the QR):
//   1. Product rename → slug changes → printed QR stays valid via this lookup.
//   2. Domain switch → infra-level redirect can catch all `/q/...` URLs in
//      one rule without touching every product doc.
//   3. Deleted product → friendly 410 page instead of cryptic 404.
//
// `dynamic = "force-dynamic"` so Next never tries to statically pre-render
// (each request must hit the backend lookup).
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function QrLookupPage({ params }) {
  const { code } = await params;
  if (!code) redirect("/");

  let slug = null;
  try {
    const res = await fetch(`${BASE_URL}/product/by-qr-code/${code}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data?.product_slug) {
      slug = json.data.product_slug;
    }
  } catch {
    /* fall through to friendly 404 below */
  }

  if (slug) {
    redirect(`/products/${slug}`);
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          This code no longer works
        </h1>
        <p className="mt-3 text-gray-600">
          The product was removed, or the code was scanned incorrectly.
        </p>
        <a
          href="/"
          className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
