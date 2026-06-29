import { useState } from "react";
import { FiChevronDown, FiChevronRight, FiDownload, FiPrinter, FiLock } from "react-icons/fi";

/**
 * Read-only internal codes display — SKU + Barcode + barcode image with
 * Download/Print buttons. Renders inside the product Edit page as a small
 * collapsible section. Add Product mode shows a placeholder line.
 *
 * Owner-decision 2026-05-30: SKU + Barcode are STRICTLY immutable; this
 * component never exposes an edit path. To change them, owner would have to
 * delete + recreate the product (extreme, intentional friction).
 */
const printLabel = (imageUrl, title) => {
  const w = window.open("", "_blank", "width=400,height=300");
  if (!w) return;
  w.document.write(`
    <html><head><title>${title}</title>
    <style>body{margin:0;padding:20px;text-align:center;font-family:sans-serif}
    img{max-width:100%}p{margin:8px 0;font-size:12px}</style>
    </head><body>
    <img src="${imageUrl}" alt="${title}" />
    <p>${title}</p>
    <script>window.onload = function(){ window.print(); };</script>
    </body></html>
  `);
  w.document.close();
};

const InternalCodesPanel = ({ isUpdate, productSku, barcode, barcodeImage }) => {
  const [open, setOpen] = useState(false);

  if (!isUpdate) {
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
        <FiLock size={12} className="inline-block mr-1" />
        SKU + Barcode auto-generated on save (warehouse use only).
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left"
      >
        <span className="text-sm font-medium text-gray-700 inline-flex items-center gap-2">
          <FiLock size={12} className="text-gray-400" />
          Internal codes (SKU + Barcode)
        </span>
        {open ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
      </button>
      {open && (
        <div className="p-3 bg-white space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">SKU</div>
              <code className="block mt-1 font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded select-all">
                {productSku || <span className="text-gray-400">— not generated —</span>}
              </code>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Barcode</div>
              <code className="block mt-1 font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded select-all">
                {barcode || <span className="text-gray-400">— variation-only —</span>}
              </code>
            </div>
          </div>
          {barcodeImage && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <img
                src={barcodeImage}
                alt="Barcode"
                className="h-12 max-w-[200px] object-contain"
              />
              <div className="flex flex-col gap-1">
                <a
                  href={barcodeImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <FiDownload size={12} /> Download PNG
                </a>
                <button
                  type="button"
                  onClick={() => printLabel(barcodeImage, barcode || "Barcode")}
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <FiPrinter size={12} /> Print label
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 italic">
            These codes are permanent and cannot be edited.
          </p>
        </div>
      )}
    </div>
  );
};

export default InternalCodesPanel;
