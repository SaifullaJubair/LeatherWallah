"use client";
import { useEffect, useMemo, useState } from "react";

// In-page table of contents built from the h2/h3 headings inside the rendered
// policy HTML. Adds ids to those headings, tracks the one in view (scroll-spy),
// and renders jump links. Renders nothing if the content has no headings.
export default function PolicyToc({ containerId = "policy-content" }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll("h2, h3"));
    const items = nodes.map((el, i) => {
      if (!el.id) {
        const base =
          el.textContent
            ?.trim()
            .toLowerCase()
            .replace(/[^a-z0-9ঀ-৿]+/g, "-")
            .replace(/^-+|-+$/g, "") || `section-${i}`;
        el.id = `${base}-${i}`;
      }
      return { id: el.id, text: el.textContent?.trim() || "", level: el.tagName === "H3" ? 3 : 2 };
    });
    setHeadings(items);

    if (items.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [containerId]);

  const hasToc = useMemo(() => headings.length > 1, [headings]);
  if (!hasToc) return null;

  const jump = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
    }
  };

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
        On this page
      </p>
      <ul className="space-y-1.5 border-l border-gray-200">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${h.id}`}
              onClick={(e) => jump(e, h.id)}
              className={`block -ml-px border-l-2 pl-3 py-0.5 transition-colors ${
                activeId === h.id
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
