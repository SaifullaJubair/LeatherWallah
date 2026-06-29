import { useState } from "react";
import { FaCheck, FaCircle, FaSave, FaExternalLinkAlt, FaBars } from "react-icons/fa";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

// Shell for the Page Content editor: left vertical tabs (with completeness
// dots) and a main area showing only the active section. The whole editor fits
// the viewport — the sidebar and a sticky header stay put while ONLY the active
// section body scrolls, so the admin never has to scroll the entire page to
// reach the Save button (that now lives in the page header).
//
// Props:
//   sections     — array from pageContentMeta.js, with `isComplete(ctx)`
//   ctx          — context object passed to each section's isComplete()
//   active       — current section id
//   onChange(id) — switch active section
//   livePath     — e.g. `/products/<slug>` (used by the open-live link)
//   saving       — boolean
//   formId       — id of the <form> these actions submit (Save lives outside it)
//   children     — the section bodies. The caller keeps every section mounted
//                  (use a `hidden` className on inactive ones) so react-hook-form
//                  / local state survives tab switches.
//
// The Save + Open-live actions are rendered by the PAGE header now (see
// ProductPageContentEditPage). This component exposes <PageContentActions/> for
// that, and only lays out the sidebar + scrollable content here.
const PageContentLayout = ({
  sections,
  ctx,
  active,
  onChange,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeIdx = sections.findIndex((s) => s.id === active);
  const activeMeta = sections[activeIdx] || sections[0];

  const Tab = ({ s, idx }) => {
    const done = s.isComplete(ctx);
    const isActive = s.id === active;
    return (
      <button
        type="button"
        onClick={() => {
          onChange(s.id);
          setMobileOpen(false);
        }}
        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 text-sm transition ${
          isActive
            ? "bg-blueColor-50 text-blueColor-700 font-semibold"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <span className="text-[10px] w-5 text-gray-400 tabular-nums">{idx + 1}.</span>
        {done ? (
          <FaCheck size={11} className="text-green-500 shrink-0" />
        ) : (
          <FaCircle size={6} className="text-gray-300 shrink-0" />
        )}
        <span className="flex-1 truncate">{s.label}</span>
      </button>
    );
  };

  return (
    <div className="md:grid md:grid-cols-[220px_1fr] md:gap-5 md:h-full md:min-h-0">
      {/* Mobile: section picker bar */}
      <div className="md:hidden mb-3">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-md text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            <FaBars size={12} /> {activeMeta?.label}
          </span>
          <span className="text-xs text-gray-400">
            {activeIdx + 1} / {sections.length}
          </span>
        </button>
        {mobileOpen && (
          <div className="mt-2 p-2 bg-white border rounded-md space-y-1 max-h-[50vh] overflow-y-auto">
            {sections.map((s, i) => (
              <Tab key={s.id} s={s} idx={i} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: sidebar — own scroll, fills the grid cell height. */}
      <aside className="hidden md:block md:h-full md:min-h-0">
        <div className="h-full overflow-y-auto p-2 bg-white border rounded-lg space-y-1">
          {sections.map((s, i) => (
            <Tab key={s.id} s={s} idx={i} />
          ))}
        </div>
      </aside>

      {/* Active section content — its OWN scroll area so the page itself
          doesn't scroll. Each section card already renders its own heading, so
          we don't repeat activeMeta.label here (that was a duplicate header). */}
      <main className="min-w-0 md:h-full md:overflow-y-auto pr-1">
        {children}
      </main>
    </div>
  );
};

// Save + Open-live actions, rendered in the page header (beside "Back to list").
// Save submits the editor form by id, so it works even though it sits outside
// the <form>.
export function PageContentActions({ livePath, saving, formId }) {
  return (
    <div className="flex items-center gap-2">
      {livePath && (
        <a
          href={livePath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-blueColor-700 hover:bg-gray-100 rounded"
          title="Open the live product page in a new tab"
        >
          <FaExternalLinkAlt size={11} /> Open live page
        </a>
      )}
      <button
        type="submit"
        form={formId}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 disabled:opacity-60 text-sm font-semibold"
      >
        {saving ? <MiniSpinner /> : <FaSave />} Save Page Content
      </button>
    </div>
  );
}

export default PageContentLayout;
