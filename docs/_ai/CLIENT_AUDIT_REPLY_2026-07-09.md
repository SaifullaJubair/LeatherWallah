# Reply to "leatherwallah.com - Audite Report" (client audit, 2026-07-07)

**Context:** Client ran a live-site audit (GTMetrix + Meta Pixel Helper) against the storefront only.
At the time of that test, **Admin panel access had not yet been handed over to the client** — only
the frontend URL was shared. Every analytics/tracking system on this checklist is already built and
is **DB-driven from Admin → Site Settings → Analytics & Pixels**; nothing fires until IDs are entered
there and toggled on. This is not missing development — it's unfilled configuration behind a screen
the client hasn't seen yet.

Verified against the actual codebase (LeatherWallahFrontend, LeatherWallahBackend, LeatherWallahAdmin)
on 2026-07-09.

---

## Checklist reply

- [x] **Website Structure & Design সম্পূর্ণ করা।**
  Structurally complete. All major routes exist and are live: home, category, product detail,
  cart/checkout, order-success, account/auth pages. Site was registered July 5, 2026 as noted;
  structure work is not a blocker for anything else on this list.

- [ ] **Google Tag Manager (GTM) Setup।** — *Code ready, pending ID*
  GTM snippet is fully wired into `layout.js`, gated by a `gtm_id` + `gtm_enabled` toggle in
  Admin Site Settings. Needs: client's real GTM container ID pasted into Admin, toggle switched on.
  No development work remaining.

- [ ] **Google Analytics 4 (GA4) Integration।** — *Code ready, pending ID*
  GA4 has its own `ga4_id` + `ga4_enabled` field in Admin (separate from GTM, with a built-in warning
  against enabling both at once to avoid double-counting). Standard setup path is to also add a GA4
  tag inside the GTM container itself once GTM is live. Needs: GA4 Measurement ID in Admin.

- [ ] **Google Search Console Verification।** — *Code ready, pending value*
  Verification meta tag is wired into Next.js metadata via a `google_verification_meta` field in
  Admin Site Settings. Needs: verification code from Search Console pasted into Admin.

- [ ] **Meta Pixel Installation।** — *Code ready, pending ID*
  Full client-side Pixel script + server-side Conversions API (CAPI) is implemented, including
  advanced matching. Admin has `meta_pixel_id` + `meta_pixel_enabled` toggle, plus a separate secured
  "CAPI Secrets" panel for the access token. Needs: real Meta Pixel ID entered in Admin (the ID
  currently sitting in the backend `.env` is unused by the live pixel script — Admin is the actual
  source of truth).

- [ ] **Data Layer Enable করা।** — *Code already firing, waiting on GTM*
  `window.dataLayer.push()` calls already exist for view_item, add_to_cart, purchase,
  begin_checkout, search, login, sign_up. This is why Meta Pixel Helper / GTM's own debugger show
  nothing yet — there's no container ID to receive the pushes. No separate action needed beyond
  turning on GTM above.

- [ ] **Event & Conversion Tracking Configure করা।** — *Code already built, waiting on GTM/Pixel*
  ViewContent, AddToCart, InitiateCheckout, Purchase, Search, Login, CompleteRegistration are all
  tracked simultaneously across Meta Pixel, TikTok Pixel, and GTM dataLayer, with event-ID dedup
  between browser and server-side (CAPI) events. Activates automatically once GTM/Pixel IDs are set.

- [ ] **Technical SEO Setup।** — *Done*
  Dynamic `robots.txt`, dynamic `sitemap.xml`, canonical tags, and JSON-LD structured data
  (Organization + per-product schema) are all live already. No action needed.

- [ ] **Basic On-Page SEO।** — *Done*
  Per-page title/description/OG/Twitter-card metadata is DB-driven per page (`pageSeo`) and already
  wired into Next.js metadata output. No action needed.

- [ ] **Facebook Page Optimization।** — *Not a website task*
  Facebook Page settings, not part of the codebase. Marketing/ops item for the client's FB Page
  directly.

- [ ] **Initial Content Strategy।** — *Not a website task*
  Marketing/content planning, not a development item.

- [ ] **Test Conversion & Tracking Verification।** — *Blocked only on the above IDs*
  Once GTM, GA4, and Meta Pixel IDs are entered and enabled in Admin, this can be verified live in
  minutes using GTM Preview mode and Meta Pixel Helper — the underlying events are already built.

- [ ] **Meta Ads Launch Preparation।** — *Not a website task*
  Ads Manager campaign setup, done outside the website once Pixel is confirmed live.

- [ ] **Performance Dashboard Setup।** — *Outside current scope*
  Typically built in GA4/Looker Studio once GA4 is live; not a website codebase task.

---

## What actually needs to happen next

1. Hand over Admin panel access to the client (or enter values on their behalf).
2. Collect from the client: GTM container ID, GA4 Measurement ID, Meta Pixel ID (+ CAPI access
   token if server-side tracking is wanted), Google Search Console verification code.
3. Enter these in **Admin → Site Settings → Analytics & Pixels**, toggle each on.
4. Add a GA4 tag inside the GTM container (via Google's GTM UI, not the codebase).
5. Re-run GTMetrix / Meta Pixel Helper — data layer, GTM, and Pixel checks should all pass
   immediately since the underlying event code is already live.

**Net result: 7 of the 9 technical checklist items are code-complete already.** What's outstanding is
configuration (IDs + Admin handover), not engineering work.

## GTMetrix performance note (page 1 of audit)

Score was 67% (Grade C), with the report's own suggestion — fix image sizing/format and enable
server caching — largely already addressed in recent perf work (see
[leatherwallah-perf-lcp memory]/prior commits: hero banner priority, logo sizing, render-blocking CSS
removal, font loading fixes). Remaining gap is believed to be network latency from the origin server
location, not outstanding code issues — see project memory `leatherwallah-perf-lcp` for details before
re-investing here.
