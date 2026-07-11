import { useState } from "react";
import { FaLightbulb, FaTimes, FaCopy, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";

// "Example" helper that sits next to Paste / Add on every repeater.
//
// The grey helper line under each section only ever SHOWED an example — the
// admin still had to type everything by hand. This turns it into something you
// can act on: a filled-in sample for the section, plus a ready-made prompt the
// admin can copy into ChatGPT and run against their own product, then paste
// straight back with the "Paste list" / "Paste table" button beside it.
//
// Props:
//   title     what section this is for (modal heading)
//   prompt    the AI prompt to copy (product name is substituted by the caller)
//   sample    string[] — a worked example, shown as the shape to aim for
//   note      optional extra line (caps, gotchas)
const ExampleButton = ({ title, prompt, sample = [], note }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null);

  const copy = (text, which) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(which);
        setTimeout(() => setCopied(null), 1800);
        toast.success("Copied", { autoClose: 900 });
      })
      .catch(() => toast.error("Could not copy"));
  };

  const close = () => {
    setOpen(false);
    setCopied(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
        title="See an example + copy an AI prompt"
      >
        <FaLightbulb size={12} /> Example
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-gray-800">
                {title} — example
              </h3>
              <button
                type="button"
                onClick={close}
                className="text-gray-400 hover:text-gray-700"
                title="Close"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Worked example */}
              {sample.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-gray-700">
                      What good looks like
                    </p>
                    <button
                      type="button"
                      onClick={() => copy(sample.join("\n"), "sample")}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {copied === "sample" ? (
                        <>
                          <FaCheck size={9} className="text-green-600" /> Copied
                        </>
                      ) : (
                        <>
                          <FaCopy size={9} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <ul className="rounded border border-gray-200 bg-gray-50 p-3 space-y-1">
                    {sample.map((s, i) => (
                      <li key={i} className="text-xs text-gray-700">
                        • {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* The AI prompt — the point of this modal */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-700">
                    Ask ChatGPT for YOUR product
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(prompt, "prompt")}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 font-medium text-white bg-blueColor-600 rounded hover:bg-blueColor-700"
                  >
                    {copied === "prompt" ? (
                      <>
                        <FaCheck size={9} /> Copied
                      </>
                    ) : (
                      <>
                        <FaCopy size={9} /> Copy prompt
                      </>
                    )}
                  </button>
                </div>
                <pre className="rounded border border-blueColor-100 bg-blueColor-50/40 p-3 text-[11px] leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">
                  {prompt}
                </pre>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Copy it, run it in ChatGPT, then bring the answer back with the{" "}
                  <strong>Paste</strong> button next to this one.
                </p>
              </div>

              {note && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                  {note}
                </p>
              )}
            </div>

            <div className="flex justify-end px-4 py-3 border-t bg-gray-50 rounded-b-lg">
              <button
                type="button"
                onClick={close}
                className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExampleButton;
