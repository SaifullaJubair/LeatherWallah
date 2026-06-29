"use client";
// src/components/analyticsScripts/utils/AnalyticsAdvancedMatching.jsx
// Runs inside Redux Providers — useUserInfoQuery returns the logged-in
// storefront user. For anon visitors nothing fires; their data comes
// via per-event userData passed by AddToCart / PDP later.
import { useEffect } from "react";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import { splitName } from "@/utils/nameSplit";

const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.startsWith("+88")
    ? phone.slice(3)
    : phone.startsWith("88")
      ? phone.slice(2)
      : phone;
};

const AnalyticsAdvancedMatching = ({ metaPixelId, tiktokPixelId }) => {
  const { data: userInfo } = useUserInfoQuery();
  const phone = normalizePhone(userInfo?.data?.user_phone);
  const name = userInfo?.data?.user_name;
  // S4+S5 Phase 1B: fn/ln split + ct/st/country/em advanced matching.
  // Meta EMQ jumps when more identifiers are present.
  const { fn, ln } = splitName(name);
  const email = userInfo?.data?.user_email; // Phase 1C will populate
  const city = userInfo?.data?.user_district; // BD form uses district as city
  const state = userInfo?.data?.user_division;
  const externalId = userInfo?.data?._id;

  // Meta Advanced Matching
  useEffect(() => {
    if (!phone || !metaPixelId) return;
    const timer = setTimeout(() => {
      if (window.fbq) {
        const matching = {
          ph: phone,
          external_id: externalId ? String(externalId) : undefined,
        };
        if (fn) matching.fn = fn;
        if (ln) matching.ln = ln;
        if (email) matching.em = email;
        if (city) matching.ct = city.toLowerCase();
        if (state) matching.st = state.toLowerCase();
        matching.country = "bd";
        window.fbq("init", String(metaPixelId), matching);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [phone, metaPixelId, fn, ln, email, city, state, externalId]);

  // TikTok Advanced Matching — wrap in same 500ms timeout as Meta so
  // ttq is actually attached to window before identify fires.
  useEffect(() => {
    if (!phone || !tiktokPixelId) return;
    const timer = setTimeout(() => {
      if (!window.ttq) return;
      const identify = {
        phone_number: phone,
        external_id: externalId ? String(externalId) : undefined,
      };
      if (fn) identify.first_name = fn;
      if (ln) identify.last_name = ln;
      if (email) identify.email = email;
      window.ttq.identify(identify);
    }, 500);
    return () => clearTimeout(timer);
  }, [phone, tiktokPixelId, fn, ln, email, externalId]);

  return null;
};

export default AnalyticsAdvancedMatching;
