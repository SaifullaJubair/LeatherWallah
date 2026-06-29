/**
 * ProductMetaPanel — A2c. Read-only product engagement stats + QR generator.
 *
 * Read fields (informational):
 *   - sold_count   (bumped by order placement, Phase F)
 *   - view_count   (bumped by PDP fetch, Phase F)
 *   - qr_code_image (data-URL, persisted after Generate)
 *
 * Action:
 *   - POST /product/qr {product_id} — generates+persists QR data-URL. Gated on
 *     `product_update` (BE flag).
 */

import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { FaQrcode, FaEye, FaShoppingBag, FaSync } from "react-icons/fa";
import { BASE_URL } from "../../../utils/baseURL";
import { AuthContext } from "../../../context/AuthProvider";
import MiniSpinner from "../../../shared/MiniSpinner/MiniSpinner";

const StatPill = ({ icon, label, value, tint }) => (
  <div
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${tint}`}
  >
    <div className="text-lg">{icon}</div>
    <div>
      <p className="text-[10px] uppercase tracking-wide font-semibold opacity-70">
        {label}
      </p>
      <p className="text-lg font-bold leading-none">{value ?? 0}</p>
    </div>
  </div>
);

const ProductMetaPanel = ({ productData, refetch }) => {
  const { user } = useContext(AuthContext);
  const [generating, setGenerating] = useState(false);
  // Local QR override for the freshly-generated data-URL (so it shows
  // immediately without a refetch round-trip).
  const [freshQr, setFreshQr] = useState(null);

  const canQr = user?.role_id?.product_update === true;
  const qrImage = freshQr || productData?.qr_code_image;
  const qrPayload = productData?.qr_code || productData?.product_slug;

  const handleGenerate = async () => {
    if (!productData?._id) {
      toast.error("Product id missing");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${BASE_URL}/product/qr`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productData._id }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        setFreshQr(result?.data?.qr_code_image || null);
        toast.success("QR code generated.", { autoClose: 1500 });
        if (typeof refetch === "function") refetch();
      } else {
        toast.error(result?.message || "QR generation failed", {
          autoClose: 2000,
        });
      }
    } catch (e) {
      toast.error(e?.message || "Network error", { autoClose: 2000 });
    } finally {
      setGenerating(false);
    }
  };

  if (!productData) return null;

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-5 mt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Read-only engagement stats */}
        <div className="flex flex-wrap items-center gap-3">
          <StatPill
            icon={<FaShoppingBag className="text-emerald-600" />}
            label="Sold"
            value={productData?.sold_count}
            tint="bg-emerald-50 border-emerald-100 text-emerald-700"
          />
          <StatPill
            icon={<FaEye className="text-blue-600" />}
            label="Views"
            value={productData?.view_count}
            tint="bg-blue-50 border-blue-100 text-blue-700"
          />
        </div>

        {/* QR area */}
        <div className="flex items-center gap-4">
          {qrImage && (
            <div className="flex flex-col items-center">
              <img
                src={qrImage}
                alt="Product QR"
                className="w-20 h-20 border border-gray-200 rounded bg-white p-1"
              />
              <p className="text-[10px] text-gray-400 mt-1 font-mono truncate max-w-[6rem]">
                {qrPayload}
              </p>
            </div>
          )}
          {canQr && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <MiniSpinner /> Generating…
                </>
              ) : qrImage ? (
                <>
                  <FaSync size={12} /> Regenerate QR
                </>
              ) : (
                <>
                  <FaQrcode size={14} /> Generate QR
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductMetaPanel;
