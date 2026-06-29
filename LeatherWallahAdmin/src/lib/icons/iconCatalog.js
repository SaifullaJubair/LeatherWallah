// FULL icon catalog — the "heavy" set behind the IconPicker's search.
//
// Instead of hand-listing icons, we read every component exported by
// lucide-react and react-icons/fa6 at runtime and turn each into a pickable
// entry { key, label, words }. DynamicIcon already resolves any "lu:Name" /
// "fa:Name" key, so every catalog entry is guaranteed renderable on the
// storefront too — no extra registry work, full back-compat with saved keys.
//
// The curated ICON_REGISTRY (registry.js) stays as the "Featured" quick-access
// list; this catalog is what powers an open-ended search across ~3.6k icons.

import * as Lucide from "lucide-react";
import * as Fa6 from "react-icons/fa6";

// PascalCase, no spaces/digits-only — a real component name.
const isPascal = (n) => /^[A-Z][A-Za-z0-9]+$/.test(n);

// lucide ships each icon under 3 names: `Apple`, `AppleIcon`, `LucideApple`.
// Keep the bare canonical name; drop the two alias forms so the grid isn't
// triple-filled with the same glyph.
const isLucideAlias = (n) => n.startsWith("Lucide") || n.endsWith("Icon");

// "FaTruckFast" -> "Truck Fast", "Apple" -> "Apple". Strips the fa prefix and
// splits CamelCase into searchable words.
function humanize(name, prefix) {
  let base = name;
  if (prefix === "fa") base = name.replace(/^Fa/, "");
  return base
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

// Auto-categorise an icon by keywords in its name. lucide/fa6 ship no category
// metadata, so we derive a coarse bucket from the label words. First match wins;
// anything unmatched lands in "other". Order matters (more specific first).
const CATEGORY_RULES = [
  { key: "arrows", label: "Arrows & Directions", words: ["arrow", "chevron", "caret", "move", "corner", "undo", "redo", "refresh", "rotate", "repeat", "shuffle", "expand", "shrink", "maximize", "minimize", "fold"] },
  { key: "media", label: "Media & Audio/Video", words: ["play", "pause", "stop", "music", "audio", "video", "film", "camera", "mic", "volume", "speaker", "headphone", "podcast", "radio", "tv", "disc", "cast", "record", "rewind", "forward", "image", "photo", "picture"] },
  { key: "files", label: "Files & Folders", words: ["file", "folder", "document", "page", "paper", "clipboard", "book", "notebook", "note", "archive", "save", "copy", "paste", "scroll"] },
  { key: "comm", label: "Communication", words: ["mail", "message", "chat", "comment", "send", "inbox", "phone", "call", "bell", "notification", "at", "reply", "share", "rss", "podcast", "voicemail"] },
  { key: "devices", label: "Devices & Tech", words: ["phone", "smartphone", "tablet", "laptop", "computer", "monitor", "screen", "mouse", "keyboard", "printer", "server", "database", "hard", "cpu", "chip", "memory", "usb", "bluetooth", "wifi", "battery", "plug", "power", "router", "cable", "webcam", "watch", "gamepad", "joystick"] },
  { key: "shapes", label: "Shapes & Symbols", words: ["circle", "square", "triangle", "hexagon", "octagon", "diamond", "star", "heart", "shape", "dot", "grid", "layout", "layers", "box", "pentagon", "shapes"] },
  { key: "weather", label: "Weather & Nature", words: ["sun", "moon", "cloud", "rain", "snow", "storm", "wind", "thermometer", "umbrella", "droplet", "flame", "fire", "leaf", "tree", "flower", "sprout", "mountain", "wave", "sunrise", "sunset", "rainbow", "tornado"] },
  { key: "people", label: "People & Body", words: ["user", "users", "person", "people", "baby", "child", "man", "woman", "face", "smile", "frown", "hand", "fingerprint", "footprint", "accessibility", "contact", "group", "team", "crown", "graduation", "venus", "mars"] },
  { key: "commerce", label: "Commerce & Money", words: ["shopping", "cart", "bag", "store", "shop", "wallet", "credit", "card", "money", "cash", "coin", "dollar", "euro", "pound", "bitcoin", "banknote", "receipt", "tag", "percent", "gift", "ticket", "badge", "trophy", "award", "barcode", "qr"] },
  { key: "food", label: "Food & Drink", words: ["food", "coffee", "tea", "cup", "drink", "beer", "wine", "pizza", "cake", "cookie", "ice", "cream", "apple", "banana", "cherry", "grape", "carrot", "egg", "milk", "wheat", "beef", "fish", "utensil", "fork", "soup", "candy", "donut", "croissant", "salad", "popcorn", "sandwich", "hamburger"] },
  { key: "transport", label: "Transport & Travel", words: ["car", "truck", "bus", "bike", "bicycle", "plane", "train", "ship", "boat", "rocket", "fuel", "gauge", "map", "compass", "navigation", "route", "road", "anchor", "sail", "tram", "taxi", "ambulance", "helicopter", "luggage", "tent"] },
  { key: "health", label: "Health & Medical", words: ["heart", "pulse", "activity", "pill", "syringe", "stethoscope", "dna", "hospital", "cross", "bandage", "brain", "bone", "tooth", "dumbbell", "ambulance", "thermometer", "virus", "shield"] },
  { key: "edit", label: "Editing & Text", words: ["edit", "pencil", "pen", "type", "text", "bold", "italic", "underline", "align", "list", "indent", "heading", "font", "case", "quote", "highlighter", "eraser", "brush", "palette", "crop", "scissors", "ruler"] },
  { key: "ui", label: "UI & Controls", words: ["check", "x", "plus", "minus", "menu", "settings", "sliders", "toggle", "filter", "search", "zoom", "eye", "lock", "unlock", "key", "trash", "delete", "info", "help", "alert", "warning", "more", "ellipsis", "loader", "spinner", "command", "option", "panel", "sidebar", "table", "columns", "rows"] },
  { key: "weather2", label: "Time & Calendar", words: ["clock", "timer", "calendar", "date", "history", "alarm", "hourglass", "watch", "stopwatch", "schedule"] },
  { key: "social", label: "Brands & Social", words: ["facebook", "instagram", "twitter", "youtube", "linkedin", "github", "google", "apple", "microsoft", "amazon", "whatsapp", "telegram", "tiktok", "discord", "slack", "spotify", "reddit", "pinterest", "snapchat", "twitch", "figma", "dribbble", "behance", "paypal", "stripe", "visa", "android", "windows", "chrome", "firefox"] },
];

function categorise(words) {
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((w) => words.includes(w))) return rule.key;
  }
  return "other";
}

function buildCatalog() {
  const out = [];
  const seen = new Set();

  // ── lucide ──
  for (const name of Object.keys(Lucide)) {
    if (!isPascal(name) || isLucideAlias(name)) continue;
    if (["Icon", "LucideIcon", "createLucideIcon"].includes(name)) continue;
    const comp = Lucide[name];
    // lucide icons are forwardRef objects or functions; helpers aren't.
    if (typeof comp !== "function" && typeof comp !== "object") continue;
    const key = `lu:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = humanize(name, "lu");
    const words = label.toLowerCase();
    out.push({ key, label, words, category: categorise(words) });
  }

  // ── react-icons/fa6 ──
  for (const name of Object.keys(Fa6)) {
    if (!/^Fa[A-Z]/.test(name)) continue;
    const key = `fa:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = humanize(name, "fa");
    const words = label.toLowerCase();
    out.push({ key, label, words, category: categorise(words) });
  }

  return out;
}

// Built once on module load (~3.6k entries, cheap string work).
export const ICON_CATALOG = buildCatalog();

// Human labels for each category key (for the picker chips).
const CATEGORY_LABELS = {
  ...Object.fromEntries(CATEGORY_RULES.map((r) => [r.key, r.label])),
  other: "Other",
};

// Category list with live counts, biggest first, "other" last — for the
// "browse all" category chips so admins can explore without typing.
export const CATALOG_CATEGORIES = (() => {
  const counts = {};
  for (const icon of ICON_CATALOG) {
    counts[icon.category] = (counts[icon.category] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([key, count]) => ({ key, label: CATEGORY_LABELS[key] || key, count }))
    .sort((a, b) => {
      if (a.key === "other") return 1;
      if (b.key === "other") return -1;
      return b.count - a.count;
    });
})();

// Case-insensitive search + optional category filter over the full catalog.
// Every space-separated term must appear in the label/key. Capped so the grid
// never paints thousands of nodes at once. With no query but a category, lists
// that category (also capped).
export function searchCatalog(query, category = "all", limit = 400) {
  const q = (query || "").trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];
  const res = [];
  for (const icon of ICON_CATALOG) {
    if (category && category !== "all" && icon.category !== category) continue;
    if (terms.length) {
      const hay = `${icon.words} ${icon.key.toLowerCase()}`;
      if (!terms.every((t) => hay.includes(t))) continue;
    }
    res.push(icon);
    if (res.length >= limit) break;
  }
  return res;
}

export const CATALOG_COUNT = ICON_CATALOG.length;
