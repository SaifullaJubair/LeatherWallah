import { getSeoConfig } from "@/components/lib/getSeoConfig";
import Providers from "@/components/providers/Providers";
import QueryProviders from "@/components/providers/QueryProviders";
import { bodyFont, sansFont } from "@/utils/font";
// PERF: every `import "x.css"` here becomes its own render-blocking <link> on
// EVERY route. On slow 4G the homepage was serialising ~10 stylesheets into
// ~4,950 ms of blocked paint — for only 35.7 KiB. So only genuinely global CSS
// stays here:
//   - skeleton.css  : 14 components across most routes (1 KiB)
//   - ReactToastify : the ToastContainer below is mounted in this layout
//   - globals.css   : Tailwind
// Moved out:
//   - react-photo-view.css (18.5 KiB) → co-located with its 6 consumers
//     (PDP gallery, cart, profile). The homepage has no lightbox.
//   - react-tooltip.css → deleted; nothing in src/ ever imported react-tooltip.
import "react-loading-skeleton/dist/skeleton.css";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import AnalyticsAdvancedMatching from "@/components/analyticsScripts/utils/AnalyticsAdvancedMatching";
import FbclidCapture from "@/components/analyticsScripts/utils/FbclidCapture";
import TikTokPixelScript from "@/components/analyticsScripts/tiktokPixel/TikTokPixelScript";
import MetaPixelScript from "@/components/analyticsScripts/metaPixel/MetaPixelScript";
import GoogleTagManager, {
  GoogleTagManagerNoScript,
} from "@/components/analyticsScripts/googleAnalytics/GoogleTagManager";
import MicrosoftClarity from "@/components/analyticsScripts/microsoftClarity/MicrosoftClarity";
import { BASE_URL } from "@/components/utils/baseURL";

/**
 * PERF — warm up the API origin so the browser does DNS + TCP + TLS while it is
 * still parsing HTML, instead of after the first fetch fires. PageSpeed measured
 * ~300 ms of LCP sitting in that handshake.
 *
 * A preconnect socket is only reused by a request in the SAME CORS mode, and we
 * get one hint per origin. The app mixes both modes against the API:
 *   - anonymous       — getSettingData / getTrendingProducts (plain fetch, no
 *                       credentials). These drive the Navbar + first content, so
 *                       they are the ones on the LCP path.
 *   - use-credentials — useUserInfoQuery, cart sync (credentials: "include").
 * We hint the anonymous mode because that is what the render-path fetches use.
 *
 * `crossorigin` (valueless) means anonymous. Writing crossorigin="use-credentials"
 * here would open a socket the settings/trending fetches cannot reuse.
 *
 * The S3 image host is deliberately NOT preconnected: images are served through
 * /_next/image, so the *server* fetches from S3 and the browser never opens a
 * connection to it. PageSpeed correctly flagged that hint as unused.
 *
 * Derived from env, never hardcoded. Bad/unset env yields no hint rather than a
 * broken one.
 */
function apiOrigin() {
  try {
    return BASE_URL ? new URL(BASE_URL).origin : null;
  } catch {
    return null; // malformed NEXT_PUBLIC_API_URL — skip the hint, don't crash render
  }
}

export async function generateMetadata() {
  const seo = await getSeoConfig();
  return {
    // ── 1. Basic ──────────────────────────────────────────
    metadataBase: new URL(seo.siteUrl),
    title: {
      default: seo.seoTitle,
      template: `%s | ${seo.siteName}`,
    },
    // description — buildPageMeta থেকে আসে, কিন্তু
    // যে page এ generateMetadata নেই সেখানে এটা fallback
    description: seo.seoDescription,
    keywords: seo.seoKeywords,

    // ── 2. Robots ─────────────────────────────────────────
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // ── 3. Verification ───────────────────────────────────
    // S4+S5 Phase 1A — DB-driven via Admin Site Settings → Analytics
    // tab, .env fallback for back-compat.
    verification: {
      google: seo.googleVerification || undefined,
    },

    // ── 4. Icons ──────────────────────────────────────────
    // Intentionally NOT set here. Next.js metadata `icons` would emit its own
    // <link rel="icon" href="/favicon.ico">, which competes with the DB-driven
    // favicon injected manually in RootLayout <head> below — and the browser
    // often wins for the static /favicon.ico, so the Admin Site-Settings favicon
    // never showed. By omitting it, the ONLY <link rel="icon"> is the DB one
    // (with a hard-coded Leather Wallah fallback). See RootLayout <head>.

    // ── 5. Format Detection ───────────────────────────────
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    // ── 6. OG & Twitter — fallback ────────────────────────
    openGraph: {
      type: "website",
      locale: "bn_BD",
      siteName: seo.siteName,
      url: seo.siteUrl,
      title: seo.seoTitle,
      description: seo.seoDescription,
      images: [{ url: seo.logo, width: 1200, height: 630, alt: seo.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.seoTitle,
      description: seo.seoDescription,
      images: [seo.logo],
    },
  };
}

export default async function RootLayout({ children }) {
  const seo = await getSeoConfig();

  // Organization JSON-LD — Google কে business সম্পর্কে জানায়
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.siteName,
    url: seo.siteUrl,
    logo: seo.logo,
    sameAs: [
      seo.facebook,
      seo.instagram,
      seo.youtube,
      seo.whatsapp,
      seo.twitter,
    ].filter(Boolean),
  };

  return (
    <html lang="bn" className={sansFont.variable}>
      <head>
        {/* Warm up the API connection — see apiOrigin() above for why this is
            anonymous mode and why the S3 host is intentionally absent. */}
        {apiOrigin() && <link rel="preconnect" href={apiOrigin()} crossOrigin="" />}
        {seo.gtmId && <GoogleTagManager gtmId={seo.gtmId} />}
        {/* DB-driven favicon (Admin → Site Settings). This is the ONLY
            <link rel="icon"> on the page. The old static src/app/favicon.ico
            (Artisan Leather leftover) was deleted so Next.js no longer
            auto-injects a competing /favicon.ico link. The DB value can contain
            spaces (uploaded filenames), so encode it — un-encoded spaces make
            the browser drop the link. If the shop hasn't set a favicon yet we
            emit nothing and let the browser show its default, rather than point
            at a /favicon.ico that no longer exists. */}
        {seo.favicon && seo.favicon !== "/favicon.ico" && (
          <>
            <link rel="icon" href={encodeURI(seo.favicon)} />
            <link rel="shortcut icon" href={encodeURI(seo.favicon)} />
            <link rel="apple-touch-icon" href={encodeURI(seo.favicon)} />
          </>
        )}
      </head>
      <body className={bodyFont.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        {seo.gtmId && <GoogleTagManagerNoScript gtmId={seo.gtmId} />}

        {/* ✅ Pixel scripts — Providers এর বাইরে, Redux নেই এখানে */}
        {seo.metaPixelId && <MetaPixelScript pixelId={seo.metaPixelId} />}
        {seo.tiktokPixelId && <TikTokPixelScript pixelId={seo.tiktokPixelId} />}
        {seo.clarityId && <MicrosoftClarity clarityId={seo.clarityId} />}

        {/* Phase 1B B7 — convert ?fbclid= URL param into _fbc cookie BEFORE
            first event fires, so ad-click visitors are Meta-attributable
            from their very first ViewContent. */}
        <FbclidCapture />

        <Providers>
          <QueryProviders>
            {/* ✅ AdvancedMatching — Providers এর ভেতরে, Redux কাজ করবে */}
            <AnalyticsAdvancedMatching
              metaPixelId={seo.metaPixelId}
              tiktokPixelId={seo.tiktokPixelId}
            />
            <main>
              {children}
              <ToastContainer
                position="bottom-right"
                autoClose={1500}
                transition={Slide}
                closeOnClick
              />
            </main>
          </QueryProviders>
        </Providers>
      </body>
    </html>
  );
}
