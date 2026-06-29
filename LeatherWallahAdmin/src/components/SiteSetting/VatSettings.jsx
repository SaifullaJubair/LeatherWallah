import { useState, useEffect } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import { FaEdit, FaPercent } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";

const VatSettings = ({ refetch, getInitialCurrencyData: d }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [vat, setVat] = useState(0);

  useEffect(() => {
    setVat(typeof d?.vat_percentage === "number" ? d.vat_percentage : 0);
  }, [d]);

  const handleCancel = () => {
    setIsEditing(false);
    setVat(typeof d?.vat_percentage === "number" ? d.vat_percentage : 0);
  };

  const handleSave = async () => {
    const pct = Number(vat);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toast.error("VAT % must be a number between 0 and 100");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: d?._id, vat_percentage: pct }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success("VAT settings updated successfully");
        refetch();
        setIsEditing(false);
      } else {
        toast.error(result?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl">
                <FaPercent className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Tax / VAT</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Site-wide VAT percentage applied at checkout
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-emerald-500/30 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-4 flex items-start gap-3">
            <FiInfo className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800">
              This site-wide VAT is applied to every order line that doesn't have a{" "}
              <code className="bg-white px-1 rounded">vat_percentage_override</code>{" "}
              set on the product. Set it to <strong>0</strong> to disable tax for the whole store.
            </p>
          </div>

          <div className="max-w-xs">
            <label className="text-xs font-medium text-gray-600">VAT percent (%)</label>
            <div className="relative mt-1">
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                disabled={!isEditing}
                placeholder="0"
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                %
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              0 = no tax. Per-product overrides win when greater than 0.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <MiniSpinner />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VatSettings;
