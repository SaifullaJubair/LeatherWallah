// src/components/lib/getServerSettingData.js
import { BASE_URL } from "../utils/baseURL";

export async function getServerSettingData() {
  const res = await fetch(`${BASE_URL}/setting`, {
    next: {
      revalidate: 60, // Track D: reduced from 600 — admin home layout changes reflect within 60s
    },
  });

  if (!res.ok) {
    throw new Error("Setting Data fetching error!");
  }

  return res.json();
}
