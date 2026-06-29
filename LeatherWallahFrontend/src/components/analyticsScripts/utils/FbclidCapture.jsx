"use client";
// S4+S5 Phase 1B B7 — capture ?fbclid= URL param into _fbc cookie.
//
// Why: Meta Pixel script sets _fbc cookie from fbclid AFTER the script
// loads on a page. The first ViewContent event from an ad-click visitor
// may fire before that happens, losing the strongest attribution signal.
// Setting _fbc manually on page load (synchronous-ish) makes the first
// event Meta-attributable too.
//
// Format: fb.<subdomain_index>.<creation_timestamp_ms>.<fbclid>
// (Meta convention; subdomain_index=1 for second-level domain).
import { useEffect } from "react";

const COOKIE_NAME = "_fbc";

const getCookie = (name) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : "";
};

const FbclidCapture = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Already set by Pixel? Don't overwrite.
    if (getCookie(COOKIE_NAME)) return;

    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (!fbclid) return;

    const value = `fb.1.${Date.now()}.${fbclid}`;
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }, []);

  return null;
};

export default FbclidCapture;
