"use client";
// src/components/analyticsScripts/metaPixel/MetaPixelScript.jsx
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { generateEventId } from "../utils/metaPixel/useMetaPixel";
import { sendServerEvent } from "../utils/metaPixel/metaServerEvent";

// PageView previously had NO server-side (CAPI) counterpart — the browser
// fbq() call fired alone, with no eventID, so Meta could never dedupe it
// against anything server-side. Threading eventID through both legs here
// mirrors every other tracked event (ViewContent, AddToCart, Purchase...).
//
// The <Script> below can still be mid-load when this effect's FIRST run
// fires (it fires on mount, same tick as the initial pageview), so
// window.fbq may not exist yet. A bare `if (!window.fbq) return` drops
// that call outright instead of missing a beat — retry briefly instead,
// so the initial PageView isn't lost.
const trackPageView = (attempts = 20) => {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") {
    if (attempts <= 0) return;
    setTimeout(() => trackPageView(attempts - 1), 100);
    return;
  }
  const eventId = generateEventId();
  window.fbq("track", "PageView", {}, { eventID: eventId });
  sendServerEvent({
    event_name: "PageView",
    event_id: eventId,
  });
};

const PageViewTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    trackPageView();
  }, [pathname, searchParams]);
  return null;
};

// ✅ Redux নেই — শুধু script load করে
// AdvancedMatching আলাদা component এ থাকবে — Providers এর ভেতরে
const MetaPixelScript = ({ pixelId }) => {
  if (!pixelId) return null;
  return (
    <>
      {/* No 'track PageView' here anymore — PageViewTracker's effect fires on
          first mount too, so this init script + that effect used to double-count
          the initial pageview. PageViewTracker is now the single source. */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
};

export default MetaPixelScript;
