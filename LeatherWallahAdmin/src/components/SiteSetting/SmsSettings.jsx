import { useState, useEffect, useContext } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import { FaEdit, FaLock } from "react-icons/fa";
import { MdToggleOff, MdToggleOn, MdSms } from "react-icons/md";
import { FiInfo } from "react-icons/fi";
import { AuthContext } from "../../context/AuthProvider";

// C12 (Sprint 2 2026-06-05) — SMS settings split:
//   - Non-secret fields (sms_enabled, sms_provider_name, sms_sender_id)
//     go to PATCH /setting like before.
//   - Secret fields (sms_api_key, sms_api_secret) go to PATCH /setting/secrets,
//     gated on `setting_secrets_update`. Backend never round-trips raw
//     values to the browser; we show a `••••3a4f` mask from /setting/secrets'
//     `secrets_summary` instead, mirroring AnalyticsSettings.jsx.

const SECRET_KEYS = ["sms_api_key", "sms_api_secret"];

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
      <MdToggleOn className="text-4xl text-sky-600" />
    ) : (
      <MdToggleOff className="text-4xl text-gray-400" />
    )}
  </button>
);

const buildNonSecretState = (d) => ({
  sms_enabled: !!d?.sms_enabled,
  sms_provider_name: d?.sms_provider_name ?? "",
  sms_sender_id: d?.sms_sender_id ?? "",
});

const lastFourOf = (s) => (s && s.length > 4 ? s.slice(-4) : s || "");

const SmsSettings = ({ refetch, getInitialCurrencyData: d }) => {
  const { user } = useContext(AuthContext) || {};
  const canEditSecrets = !!user?.role_id?.setting_secrets_update;

  // Non-secret section
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState(buildNonSecretState(d));

  // Secrets section (admin-only)
  const [secretsLoading, setSecretsLoading] = useState(false);
  const [isEditingSecrets, setIsEditingSecrets] = useState(false);
  const [secretsLastFour, setSecretsLastFour] = useState({
    sms_api_key: "",
    sms_api_secret: "",
  });
  const [secretsInput, setSecretsInput] = useState({
    sms_api_key: "",
    sms_api_secret: "",
  });

  useEffect(() => {
    setState(buildNonSecretState(d));
  }, [d]);

  // Pull masked secret summary on mount for admins with the flag. The raw
  // tokens never leave the server — we only get the last 4 chars to show
  // the admin "yes, a key is set" without exposing the value in Network
  // / Redux DevTools history.
  useEffect(() => {
    if (!canEditSecrets) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/setting/secrets`, {
          credentials: "include",
        });
        const result = await res.json();
        const summary = result?.data?.secrets_summary || {};
        if (result?.success) {
          setSecretsLastFour({
            sms_api_key: summary.sms_api_key || "",
            sms_api_secret: summary.sms_api_secret || "",
          });
        }
      } catch {
        // silent — admins without flag see 401 here, just don't surface it
      }
    })();
  }, [canEditSecrets]);

  const set = (key) => (val) => {
    if (!isEditing) return;
    setState((p) => ({ ...p, [key]: val }));
  };

  const setSecretInput = (key) => (val) => {
    if (!isEditingSecrets) return;
    setSecretsInput((p) => ({ ...p, [key]: val }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setState(buildNonSecretState(d));
  };

  const handleSave = async () => {
    // Sanity: enabling SMS without any key configured anywhere is a footgun.
    if (
      state.sms_enabled &&
      !secretsLastFour.sms_api_key &&
      !secretsInput.sms_api_key?.trim()
    ) {
      toast.error(
        "Configure the API key (Secrets section) before enabling SMS",
      );
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
          sms_enabled: state.sms_enabled,
          sms_provider_name: state.sms_provider_name,
          sms_sender_id: state.sms_sender_id,
        }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success("SMS settings updated successfully");
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

  const handleSecretsCancel = () => {
    setIsEditingSecrets(false);
    setSecretsInput({ sms_api_key: "", sms_api_secret: "" });
  };

  const handleSecretsSave = async () => {
    // Only send the keys the admin actually typed. Backend treats blank
    // as "keep existing" — without this filter, blank values would wipe.
    const payload = {};
    for (const k of SECRET_KEYS) {
      const v = (secretsInput[k] || "").trim();
      if (v) payload[k] = v;
    }
    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to update — type a new value to rotate");
      return;
    }
    setSecretsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/setting/secrets`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result?.success) {
        toast.success("SMS credentials updated");
        setSecretsLastFour((prev) => {
          const next = { ...prev };
          for (const k of SECRET_KEYS) {
            if (payload[k]) next[k] = lastFourOf(payload[k]);
          }
          return next;
        });
        handleSecretsCancel();
      } else {
        toast.error(result?.message || "Failed to update credentials");
      }
    } catch (error) {
      toast.error(error?.message || "Network error");
    } finally {
      setSecretsLoading(false);
    }
  };

  const apiKeyMask = secretsLastFour.sms_api_key
    ? `••••••••${secretsLastFour.sms_api_key}`
    : "(not set)";
  const apiSecretMask = secretsLastFour.sms_api_secret
    ? `••••••••${secretsLastFour.sms_api_secret}`
    : "(not set)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ── Non-secret SMS settings ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-cyan-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-sky-600 to-cyan-600 rounded-xl">
                <MdSms className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  SMS Provider
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Provider settings used for OTP and order SMS
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-sky-700 hover:to-cyan-700 focus:ring-4 focus:ring-sky-500/30 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Enable SMS sending
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                When OFF, OTP + order SMS are skipped (server short-circuits).
              </p>
            </div>
            <Toggle
              enabled={state.sms_enabled}
              onChange={set("sms_enabled")}
              disabled={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">
                Provider name
              </label>
              <input
                type="text"
                value={state.sms_provider_name}
                onChange={(e) => set("sms_provider_name")(e.target.value)}
                disabled={!isEditing}
                placeholder="BulkSMS BD"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">
                Sender ID
              </label>
              <input
                type="text"
                value={state.sms_sender_id}
                onChange={(e) => set("sms_sender_id")(e.target.value)}
                disabled={!isEditing}
                placeholder="Leather Wallah"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-3 flex items-start gap-2">
            <FiInfo className="text-sky-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-sky-700">
              API key / secret are managed in the <strong>Secrets</strong>{" "}
              section below (admin-only). The server reads from settings first,
              falling back to{" "}
              <code className="bg-white px-1 rounded">.env</code> when a value
              is unset.
            </p>
          </div>

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
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-sky-700 hover:to-cyan-700 focus:ring-4 focus:ring-sky-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
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
                className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-sky-700 hover:to-cyan-700 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Secrets (admin-only) ─────────────────────────────────── */}
      {canEditSecrets ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-slate-600 to-gray-700 rounded-xl">
                  <FaLock className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    SMS Credentials (Secrets)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Server-only. Values never leave the backend. Showing
                    last-4 mask only.
                  </p>
                </div>
              </div>
              {!isEditingSecrets && (
                <button
                  type="button"
                  onClick={() => setIsEditingSecrets(true)}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  <FaEdit /> Rotate Credentials
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                API key
              </label>
              <input
                type="text"
                value={secretsInput.sms_api_key}
                onChange={(e) => setSecretInput("sms_api_key")(e.target.value)}
                disabled={!isEditingSecrets}
                placeholder={isEditingSecrets ? "Paste new key…" : apiKeyMask}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-sky-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Current:{" "}
                <span className="font-mono">{apiKeyMask}</span>. Leave blank
                to keep current value.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                API secret{" "}
                <span className="text-gray-400">
                  (optional, provider-dependent)
                </span>
              </label>
              <input
                type="text"
                value={secretsInput.sms_api_secret}
                onChange={(e) =>
                  setSecretInput("sms_api_secret")(e.target.value)
                }
                disabled={!isEditingSecrets}
                placeholder={
                  isEditingSecrets ? "Paste new secret…" : apiSecretMask
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-sky-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Current:{" "}
                <span className="font-mono">{apiSecretMask}</span>. Leave
                blank to keep current value.
              </p>
            </div>

            {isEditingSecrets && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleSecretsCancel}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSecretsSave}
                  disabled={secretsLoading}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {secretsLoading ? (
                    <>
                      <MiniSpinner />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Credentials</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <FaLock className="text-gray-400 mt-0.5" />
          <p className="text-xs text-gray-500">
            SMS credentials (API key / secret) can only be managed by users
            with the <code className="bg-white px-1 rounded">
              setting_secrets_update
            </code>{" "}
            permission.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default SmsSettings;
