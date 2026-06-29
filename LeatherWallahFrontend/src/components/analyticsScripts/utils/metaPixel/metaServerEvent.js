// src/components/analyticsScripts/utils/metaPixel/metaServerEvent.js
import { BASE_URL } from "@/components/utils/baseURL";
// Browser এর cookie পড়ো
const getCookieValue = (name) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : "";
};

// ✅ Anonymous External ID — guest user দের জন্য
// Site এ ঢোকামাত্র একটা random ID generate করে cookie তে save করো
const getOrCreateAnonymousId = () => {
  if (typeof document === "undefined") return "";

  const COOKIE_NAME = "_leather_wallah_uid";
  const existing = getCookieValue(COOKIE_NAME);
  if (existing) return existing;

  // নতুন ID generate করো
  const newId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // 1 বছরের জন্য cookie set করো
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${newId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

  return newId;
};

// Backend এ event পাঠাও — silent fail
export const sendServerEvent = async (data) => {
  try {
    const anonymousId = getOrCreateAnonymousId();
    const fbc = getCookieValue("_fbc");
    const fbp = getCookieValue("_fbp");

    await fetch(`${BASE_URL}/meta-pixel/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        event_source_url: window.location.href,
        user_data: {
          ...data.user_data,
          fbc: fbc || undefined,
          fbp: fbp || undefined,
          // ✅ logged-in user এর external_id থাকলে সেটা use করো
          // না থাকলে anonymous ID use করো
          external_id: data.user_data?.external_id || anonymousId,
        },
      }),
    });
  } catch (error) {
    console.warn("Meta server event error:", error);
  }
};
