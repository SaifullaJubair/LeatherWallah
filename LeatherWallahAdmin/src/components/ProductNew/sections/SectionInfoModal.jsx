import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import { FiInfo } from "react-icons/fi";

// Modal that explains "what this section does, when to use it, real example".
// Used by every Advanced section header so the owner can recall *why* a field
// exists without re-reading the docs each time.
//
// Pass `content` as JSX so each call site can include tables, lists, code,
// real-shop examples. Closes on ESC and on backdrop click.

const SectionInfoModal = ({ open, title, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiInfo className="text-primaryColor" /> {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            title="Close"
          >
            <MdClose size={24} />
          </button>
        </div>
        <div className="p-6 text-sm text-gray-700 space-y-4 leading-relaxed [&_h4]:font-semibold [&_h4]:text-gray-800 [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-base [&_p]:mb-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-50 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SectionInfoModal;
