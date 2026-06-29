// Top-of-page marquee announcement bar. Items scroll continuously (seamless
// loop) using a CSS keyframe. Track is duplicated so the loop has no visible
// gap. Pauses on hover. Hides itself if no items configured.
//
// Each item's icon resolves by priority: icon_url (custom upload) >
// icon_key (curated, via DynamicIcon) > icon (legacy emoji/text) > bullet.
import DynamicIcon from "@/lib/icons/DynamicIcon";

export default function AnnouncementBar({ items = [] }) {
  const cleaned = (items || []).filter((it) => it && it.text);
  if (cleaned.length === 0) return null;

  // duplicate the list so the -50% translate loops seamlessly
  const loop = [...cleaned, ...cleaned];

  return (
    <div
      className="w-full text-white text-xs md:text-sm overflow-hidden"
      style={{
        // Use themed PDP brand colour when injected; otherwise fall back to
        // the site default green (matches Tailwind palette primary.DEFAULT).
        background: "var(--brand-primary, #1B5E20)",
      }}
    >
      <div className="announcement-marquee flex items-center whitespace-nowrap py-1.5">
        {loop.map((it, i) => (
          <span key={i} className="flex items-center gap-1.5 mx-6 md:mx-10">
            {it.icon_url ? (
              <img src={it.icon_url} alt="" width={16} height={16} className="object-contain inline-block" />
            ) : it.icon_key ? (
              <DynamicIcon name={it.icon_key} size={15} />
            ) : it.icon ? (
              <span>{it.icon}</span>
            ) : (
              <span aria-hidden>•</span>
            )}
            <span>{it.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
