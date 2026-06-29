// src/components/analyticsScripts/utils/tiktokPixel/TiktokServerEvent.js
import { BASE_URL } from "@/components/utils/baseURL";

const getCookieValue = (name) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : "";
};

const getOrCreateAnonymousId = () => {
  if (typeof document === "undefined") return "";
  const COOKIE_NAME = "_leather_wallah_uid";
  const existing = getCookieValue(COOKIE_NAME);
  if (existing) return existing;
  const newId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${newId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  return newId;
};

export const sendTikTokServerEvent = async (data) => {
  try {
    const anonymousId = getOrCreateAnonymousId();
    await fetch(`${BASE_URL}/tiktok-pixel/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        event_source_url: window.location.href,
        user_data: {
          ...data.user_data,
          external_id: data.user_data?.external_id || anonymousId,
        },
      }),
    });
  } catch (error) {
    console.warn("TikTok server event error:", error);
  }
};
