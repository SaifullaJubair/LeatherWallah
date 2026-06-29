import { useState } from "react";
import { RiRefreshLine } from "react-icons/ri";
import { FiDownload, FiPrinter, FiCopy, FiExternalLink } from "react-icons/fi";
import { toast } from "react-toastify";
import { BASE_URL } from "../../../utils/baseURL";

// Path A B-1 — copy any string to clipboard with non-HTTPS fallback.
// navigator.clipboard.writeText requires a secure context (HTTPS or
// localhost); on a LAN-IP dev setup or a customer-IT staging URL it throws
// silently. The execCommand path works everywhere modern enough to render
// the admin form.
const copyToClipboard = async (text) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
};

/**
 * Owner-facing QR block. Owner-decision 2026-05-30: SKU and Barcode fields
 * are STRICTLY backend-controlled and hidden from the form. This block only
 * exposes the QR section because QR is the customer-facing artifact (label
 * printing, marketing material, etc.) and the owner needs visibility +
 * regenerate control. SKU / barcode read-only display lives in
 * `InternalCodesPanel.jsx` (separate component on the product detail panel).
 */
const printLabel = (imageUrl, title) => {
  const w = window.open("", "_blank", "width=400,height=300");
  if (!w) {
    toast.error("Popup blocked — please allow popups to print labels");
    return;
  }
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

const QrBlock = ({ isUpdate, productId, qrCodeImage, qrCode, productSlug }) => {
  const [regenLoading, setRegenLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState(qrCodeImage || null);
  const [qrUrl, setQrUrl] = useState(qrCode || null);

  if (!isUpdate) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-xs text-gray-600">
          ℹ️ SKU, Barcode and QR code are auto-generated when you save this product.
          You'll see them in the product details page after saving.
        </p>
      </div>
    );
  }

  const handleQrRegenerate = async () => {
    if (!productId) {
      toast.info("Save the product first, then regenerate QR.");
      return;
    }
    setRegenLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/product/qr`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Regenerate failed");
      setQrPreview(json?.data?.qr_code_image || null);
      setQrUrl(json?.data?.qr_code || null);
      toast.success("QR regenerated");
    } catch (e) {
      toast.error(e.message || "Regenerate failed");
    } finally {
      setRegenLoading(false);
    }
  };

  return (
    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">QR Code</h4>
      {qrPreview ? (
        <div className="flex flex-wrap items-start gap-4">
          <img
            src={qrPreview}
            alt="QR"
            className="w-24 h-24 object-contain bg-white border border-gray-200 rounded"
          />
          <div className="flex-1 min-w-[200px]">
            {qrUrl && (
              <div className="text-xs text-gray-600 break-all mb-2 flex items-start gap-1.5 flex-wrap">
                <strong className="shrink-0">Points to:</strong>
                {/* B-1: clickable QR URL — opens PDP in a new tab. */}
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                  title="Open in new tab"
                >
                  {qrUrl}
                  <FiExternalLink size={11} className="shrink-0" />
                </a>
                {/* B-1: copy to clipboard, with execCommand fallback for
                    non-HTTPS dev/staging URLs. */}
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(qrUrl);
                    if (ok) toast.success("Copied to clipboard");
                    else toast.error("Copy failed — select manually");
                  }}
                  className="ml-1 px-1.5 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50 inline-flex items-center gap-1 shrink-0"
                  title="Copy URL"
                >
                  <FiCopy size={11} /> Copy
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <a
                href={qrPreview}
                target="_blank"
                rel="noreferrer"
                download
                className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <FiDownload size={12} /> Download PNG
              </a>
              <button
                type="button"
                onClick={() => printLabel(qrPreview, productSlug || "QR")}
                className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 inline-flex items-center gap-1"
              >
                <FiPrinter size={12} /> Print label
              </button>
              <button
                type="button"
                onClick={handleQrRegenerate}
                disabled={regenLoading}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
              >
                <RiRefreshLine size={12} />
                {regenLoading ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          QR is generated automatically on save.
          <button
            type="button"
            onClick={handleQrRegenerate}
            disabled={regenLoading}
            className="ml-2 text-blue-600 hover:underline"
          >
            {regenLoading ? "Regenerating..." : "Regenerate now"}
          </button>
        </p>
      )}
    </div>
  );
};

export default QrBlock;
