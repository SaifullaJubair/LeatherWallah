// Top of page rolling announcement bar. Renders 3-N items in a single flex row
// on md+, scrolls horizontally on mobile. Hides itself if no items configured.

export default function AnnouncementBar({ items = [] }) {
  const cleaned = (items || []).filter((it) => it && it.text);
  if (cleaned.length === 0) return null;

  return (
    <div
      className="w-full text-white text-xs md:text-sm"
      style={{ background: "var(--brand-primary, #C04137)" }}
    >
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center gap-4 md:gap-8 overflow-x-auto md:justify-around scrollbar-none">
        {cleaned.map((it, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            {it.icon ? <span>{it.icon}</span> : null}
            <span>{it.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
