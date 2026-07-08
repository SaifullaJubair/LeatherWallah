/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // PERF: the upstream S3 (Contabo) serves images with no Cache-Control, so
    // Next's optimizer fell back to its 4h default (14400s) and kept re-fetching
    // + re-encoding. Uploads are UUID-prefixed (see backend image.upload.ts), so
    // replacing an image always yields a new URL — a long TTL can never serve a
    // stale one. 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // NOTE: deviceSizes/imageSizes are deliberately left at their defaults.
    // Narrowing them makes the optimizer reject any width outside the list with
    // a 400 — which would break already-indexed /_next/image?...&w=828 URLs on
    // this live site. Widths are generated on demand, so an unused entry costs
    // nothing anyway.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "leather-wallah.sgp1.cdn.digitaloceanspaces.com",
        pathname: "**",
      },
      {
        // Legacy buckets — existing/seed DB may still reference older bucket images.
        protocol: "https",
        hostname: "fruit-snacks.sgp1.cdn.digitaloceanspaces.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "artisen-leather.sgp1.cdn.digitaloceanspaces.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "sin1.contabostorage.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "cit-node.blr1.cdn.digitaloceanspaces.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "source.pexels.com",
        pathname: "**",
      },
    ],
  },
  async redirects() {
    return [
      // S1 (2026-06-04) — /cart route renamed to /checkout.
      {
        source: "/cart",
        destination: "/checkout",
        permanent: true,
      },
      // Track E (2026-06-08) — dead listing routes consolidated into /shop engine.
      { source: "/all-products", destination: "/shop", permanent: true },
      { source: "/all-ecommerce-product", destination: "/shop", permanent: true },
      { source: "/latest-product", destination: "/shop", permanent: true },
      { source: "/new-arrival", destination: "/shop", permanent: true },
      { source: "/top-product", destination: "/shop?sort=popular", permanent: true },
      { source: "/all-trending-products", destination: "/shop?sort=trending", permanent: true },
      { source: "/all-brands", destination: "/shop", permanent: true },
      // Order Unification Phase B — offer orders merged into regular orders;
      // old offer-order invoice links now go to the user's order history.
      {
        source: "/offer-orders/:path*",
        destination: "/user-profile?tab=purchase-history",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
