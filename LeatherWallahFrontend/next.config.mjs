/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
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
