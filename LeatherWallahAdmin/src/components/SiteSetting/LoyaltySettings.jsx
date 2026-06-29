import { useState, useEffect } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import { FaEdit, FaGift } from "react-icons/fa";
import { MdToggleOff, MdToggleOn } from "react-icons/md";
import { FiInfo } from "react-icons/fi";

const Toggle = ({ enabled, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`flex items-center transition-colors ${
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
    }`}
  >
    {enabled ? (
      <MdToggleOn className="text-4xl text-rose-600" />
    ) : (
      <MdToggleOff className="text-4xl text-gray-400" />
    )}
  </button>
);

const buildState = (d) => ({
  loyalty_enabled: !!d?.loyalty_enabled,
  loyalty_earn_rate:
    typeof d?.loyalty_earn_rate === "number" ? d.loyalty_earn_rate : 0,
  loyalty_redeem_rate:
    typeof d?.loyalty_redeem_rate === "number" ? d.loyalty_redeem_rate : 0,
  loyalty_max_redeem_percent:
    typeof d?.loyalty_max_redeem_percent === "number"
      ? d.loyalty_max_redeem_percent
      : 50,
});

const LoyaltySettings = ({ refetch, getInitialCurrencyData: d }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState(buildState(d));

  useEffect(() => {
    setState(buildState(d));
  }, [d]);

  const set = (key) => (val) => {
    if (!isEditing) return;
    setState((p) => ({ ...p, [key]: val }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setState(buildState(d));
  };

  const handleSave = async () => {
    const earn = Number(state.loyalty_earn_rate);
    const redeem = Number(state.loyalty_redeem_rate);
    const maxPct = Number(state.loyalty_max_redeem_percent);
    if (!Number.isFinite(earn) || earn < 0) {
      toast.error("Earn rate must be a non-negative number");
      return;
    }
    if (!Number.isFinite(redeem) || redeem < 0) {
      toast.error("Redeem rate must be a non-negative number");
      return;
    }
    if (!Number.isFinite(maxPct) || maxPct < 0 || maxPct > 100) {
      toast.error("Max redeem percent must be between 0 and 100");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: d?._id,
          loyalty_enabled: state.loyalty_enabled,
          loyalty_earn_rate: earn,
          loyalty_redeem_rate: redeem,
          loyalty_max_redeem_percent: maxPct,
        }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success("Loyalty settings updated successfully");
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

  const examplePoints =
    Number(state.loyalty_earn_rate) > 0
      ? Math.round(100 * Number(state.loyalty_earn_rate))
      : 0;
  const exampleDiscount =
    Number(state.loyalty_redeem_rate) > 0
      ? (100 * Number(state.loyalty_redeem_rate)).toFixed(2)
      : "0.00";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-pink-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl">
                <FaGift className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Loyalty Points</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Earn-on-order and redeem-at-checkout configuration
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-rose-700 hover:to-pink-700 focus:ring-4 focus:ring-rose-500/30 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Enable */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Loyalty Points</p>
              <p className="text-xs text-gray-400 mt-0.5">
                When OFF, customers neither earn nor redeem points (existing balances are kept).
              </p>
            </div>
            <Toggle
              enabled={state.loyalty_enabled}
              onChange={set("loyalty_enabled")}
              disabled={!isEditing}
            />
          </div>

          {/* Rates grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Earn rate</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={state.loyalty_earn_rate}
                onChange={(e) => set("loyalty_earn_rate")(e.target.value)}
                disabled={!isEditing || !state.loyalty_enabled}
                placeholder="1"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Points per 1 unit of currency spent. e.g. 1 → 100tk = 100 points.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Redeem rate</label>
              <input
                type="number"
                min={0}
                step={0.0001}
                value={state.loyalty_redeem_rate}
                onChange={(e) => set("loyalty_redeem_rate")(e.target.value)}
                disabled={!isEditing || !state.loyalty_enabled}
                placeholder="0.01"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Currency per 1 point at checkout. e.g. 0.01 → 100 pts = 1tk off.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">
                Max redeem percent (%)
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={state.loyalty_max_redeem_percent}
                  onChange={(e) => set("loyalty_max_redeem_percent")(e.target.value)}
                  disabled={!isEditing || !state.loyalty_enabled}
                  placeholder="50"
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  %
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Cap so a single order can't be fully paid by points.
              </p>
            </div>
          </div>

          {/* Live example */}
          <div className="bg-rose-50/60 border border-rose-100 rounded-lg p-4 flex items-start gap-3">
            <FiInfo className="text-rose-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-rose-800">
              <span className="font-medium">Example with current rates:</span> a 100tk
              order earns <strong>{examplePoints}</strong> points, and 100 points are
              worth <strong>{exampleDiscount}tk</strong> off. A single order can't be
              discounted by points more than{" "}
              <strong>{state.loyalty_max_redeem_percent}%</strong> of its total.
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
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-rose-700 hover:to-pink-700 focus:ring-4 focus:ring-rose-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
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
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all flex items-center gap-2"
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

export default LoyaltySettings;
