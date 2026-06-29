// Turn a pasted YouTube / Vimeo watch URL into an embeddable iframe URL.
// Returns null if the URL isn't a recognised YouTube/Vimeo link (caller then
// falls back to treating it as a direct video file, or hides the section).
//
// Handles the common forms:
//   https://www.youtube.com/watch?v=ID
//   https://youtu.be/ID
//   https://www.youtube.com/embed/ID
//   https://www.youtube.com/shorts/ID
//   https://vimeo.com/ID
export function toEmbedUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  const url = raw.trim();

  // ── YouTube ──
  // watch?v=, youtu.be/, /embed/, /shorts/
  const yt =
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  if (yt && /youtu/.test(url)) {
    return `https://www.youtube.com/embed/${yt[1]}`;
  }

  // ── Vimeo ──
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }

  return null;
}

// Is this string a YouTube/Vimeo link we can embed?
export function isEmbeddableLink(raw) {
  return toEmbedUrl(raw) !== null;
}

export default toEmbedUrl;
