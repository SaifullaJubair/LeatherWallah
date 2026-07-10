import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../../../utils/baseURL";

// Sticker-size single product label — Phase D Bug #3.
// Opens in a popup, auto-triggers window.print(), no QR (owner decision).
// Layout: product name (small), SKU (bold mono), barcode image (centered),
// barcode number under image. Sized for typical thermal-printer 50x30 mm.
//
// Phase 0.5+ Option 1 (2026-05-31): variation barcode IMAGES are now created
// LAZILY — variations save with only the barcode NUMBER. The first time this
// modal opens for a given line and the image URL is missing, we hit
// POST /product/ensure-barcode-image to render + S3-upload + cache the image,
// then show + print. Subsequent prints for the same line use the cached URL.
const PrintLabel = ({ line, onClose }) => {
  const sku = line?.variation_sku || line?.product_sku;
  const barcode = line?.variation_barcode || line?.barcode;
  const productName = line?.product_name;
  const variationName = line?.variation_name;

  // Prefer the variation image if this is a variation line, else the product
  // image. The lazy fetch may replace this with the freshly-generated URL.
  const initialImage =
    line?.variation_barcode_image || line?.barcode_image || null;
  const [barcodeImage, setBarcodeImage] = useState(initialImage);
  const [genState, setGenState] = useState(initialImage ? "ready" : "generating");
  // generating → ready | error
  const [genError, setGenError] = useState(null);
  const autoPrintFiredRef = useRef(false);
  // True while this component is on screen. Used instead of a per-run
  // `cancelled` flag, so a StrictMode remount (which runs cleanup then re-runs
  // the effect) can't leave the request orphaned.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // What we ask the backend to render. Variation wins if the line carries a
  // variation_id (the per-variation barcode is what should print on the box).
  const ensureKind = line?.variation_id ? "variation" : "product";
  const ensureId = line?.variation_id || line?.product_id || null;

  // Step 1 — if no image but we have a barcode number + an id, kick off the
  // lazy ensure. Skip when the line already has an image (most repeat prints).
  //
  // `genState` must NOT be a dependency, and this must not cancel on cleanup.
  // It used to do both: the effect began with setGenState("generating"), which
  // re-rendered, re-ran the effect (genState was a dep), and ran the previous
  // run's cleanup — flipping `cancelled` to true. The request completed fine
  // but its result was thrown away, so the modal sat on "Generating barcode
  // image…" forever. It only ever appeared to work from the order page, where
  // the image was already cached and this effect never ran at all.
  useEffect(() => {
    if (initialImage) return; // already have it
    if (!barcode || !ensureId) {
      setGenState("error");
      setGenError("No barcode on this item");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/product/ensure-barcode-image`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: ensureKind, id: ensureId }),
        });
        const json = await res.json();
        if (!mountedRef.current) return;
        if (json?.success && json?.data?.barcode_image) {
          setBarcodeImage(json.data.barcode_image);
          setGenState("ready");
        } else {
          setGenError(json?.message || "Generation failed");
          setGenState("error");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setGenError(err?.message || "Network error");
        setGenState("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2 — auto-fire print only when the image is ready (or unrecoverable).
  // Small delay so the image element paints first.
  useEffect(() => {
    if (autoPrintFiredRef.current) return;
    if (genState !== "ready" && genState !== "error") return;
    autoPrintFiredRef.current = true;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [genState]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-label, #print-label * { visibility: visible; }

          /* Pinned to the page origin. The ancestors are still laid out (only
             invisible), so 'absolute' would resolve against whichever of them
             is positioned — the modal overlay — instead of the page. 'fixed'
             resolves against the page box. Width is intrinsic rather than
             100%, which would inherit the app shell's width. */
          #print-label {
            position: fixed;
            left: 0;
            top: 0;
            width: max-content;
            /* The p-4 is preview padding. On a 40mm sticker it costs 8.5mm of
               the 32mm content box, which is what pushed the barcode off the
               sheet. */
            margin: 0;
            padding: 0 !important;
            background: #fff;
          }
          /* No border on the sticker itself — it's a preview affordance, and a
             printed hairline just wastes the tiny margin. */
          #print-label > div {
            border: 0 !important;
          }
          .no-print { display: none !important; }
          @page { margin: 3mm; size: 60mm 40mm; }
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b no-print">
          <h3 className="font-semibold text-sm text-gray-700">Print Label</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* The label itself — what actually prints */}
        <div id="print-label" className="p-4">
          <div
            className="mx-auto border border-gray-300 rounded bg-white text-center"
            style={{ width: "60mm", padding: "3mm" }}
          >
            <p
              className="font-medium text-gray-700 truncate"
              style={{ fontSize: "8pt", lineHeight: 1.1 }}
            >
              {productName || "—"}
            </p>
            {variationName && (
              <p
                className="text-gray-500 truncate"
                style={{ fontSize: "7pt", lineHeight: 1.1 }}
              >
                {variationName}
              </p>
            )}
            {sku && (
              <p
                className="font-mono font-bold text-black mt-1"
                style={{ fontSize: "10pt" }}
              >
                {sku}
              </p>
            )}
            {genState === "generating" && (
              <p
                className="text-gray-400 italic mt-2 no-print"
                style={{ fontSize: "8pt" }}
              >
                Generating barcode image…
              </p>
            )}
            {barcodeImage ? (
              // The number is baked INTO the image: the backend renders it with
              // bwip-js `includetext: true` (helpers/code.images.ts). Don't
              // repeat it below — that duplicate was what overflowed the 40mm
              // page and got sliced in half.
              <img
                src={barcodeImage}
                alt={`Barcode ${barcode || ""}`}
                crossOrigin="anonymous"
                className="mx-auto mt-1"
                style={{ height: "13mm", objectFit: "contain" }}
              />
            ) : genState === "error" ? (
              <p
                className="font-mono mt-2"
                style={{ fontSize: "9pt", letterSpacing: "1px" }}
              >
                {barcode || "No barcode"}
              </p>
            ) : barcode && genState !== "generating" ? (
              <p
                className="font-mono mt-2"
                style={{ fontSize: "9pt", letterSpacing: "1px" }}
              >
                {barcode}
              </p>
            ) : !barcode ? (
              <p
                className="text-gray-400 italic mt-2"
                style={{ fontSize: "8pt" }}
              >
                No barcode
              </p>
            ) : null}
          </div>
          {genState === "error" && (
            <p
              className="text-xs text-red-500 text-center mt-2 no-print"
              role="alert"
            >
              Barcode image generation failed: {genError}. Number printed as text instead.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-2 border-t no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={genState === "generating"}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {genState === "generating" ? "Preparing…" : "Print"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintLabel;
