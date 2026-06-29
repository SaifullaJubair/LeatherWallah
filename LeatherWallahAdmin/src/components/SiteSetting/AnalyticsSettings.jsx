import { useState, useEffect, useContext } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import { FaEdit, FaLock, FaEye } from "react-icons/fa";
import {
  SiMeta,
  SiTiktok,
  SiGoogletagmanager,
  SiGoogleanalytics,
} from "react-icons/si";
import { VscAzure } from "react-icons/vsc";
import { MdToggleOff, MdToggleOn } from "react-icons/md";
import { FiInfo } from "react-icons/fi";
import { AuthContext } from "../../context/AuthProvider";

// S4+S5 Phase 1A (2026-06-05) — DB-driven analytics IDs + admin-only
// secrets section. IDs live in the public /setting response (browser
// already shows them via pixel scripts). CAPI access tokens + test
// event codes live in /setting/secrets, guarded by the new permission
// flag `setting_secrets_update` — they never reach the public response.

const PUBLIC_ID_KEYS = [
  "meta_pixel_id",
  "tiktok_pixel_id",
  "gtm_id",
  "ga4_id",
  "clarity_id",
  "google_verification_meta",
];

const SECRET_KEYS = [
  "meta_capi_access_token",
  "tiktok_capi_access_token",
  "meta_test_event_code",
  "tiktok_test_event_code",
];

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
      <MdToggleOn className="text-4xl text-blue-600" />
    ) : (
      <MdToggleOff className="text-4xl text-gray-400" />
    )}
  </button>
);

const PlatformCard = ({
  icon,
  title,
  badge,
  iconBg,
  headerBg,
  border,
  children,
}) => (
  <div className={`rounded-xl border ${border} overflow-hidden`}>
    <div className={`px-5 py-4 ${headerBg} flex items-center gap-3`}>
      <div className={`p-2.5 ${iconBg} rounded-lg text-white`}>{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {badge && <p className="text-xs text-gray-500 mt-0.5">{badge}</p>}
      </div>
    </div>
    <div className="p-5 space-y-3">{children}</div>
  </div>
);

const ToggleRow = ({ label, description, enabled, onChange, disabled }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
    <Toggle enabled={enabled} onChange={onChange} disabled={disabled} />
  </div>
);

const TextField = ({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  hint,
}) => (
  <div className="py-2 border-b border-gray-100 last:border-0">
    <label className="text-xs font-semibold text-gray-600 mb-1 block">
      {label}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-blue-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono"
    />
    {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

// Masked display + reveal for secret fields. Empty submit keeps existing
// value (BE service ignores empty strings); typed value replaces.
const SecretField = ({ label, placeholder, lastFour, value, onChange, disabled }) => {
  const display = lastFour ? `••••••••${lastFour}` : "(not set)";
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <label className="text-xs font-semibold text-gray-600 mb-1 block">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? display : placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-blue-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono"
      />
      <p className="text-[10px] text-gray-400 mt-1">
        {disabled ? (
          <>Current: <span className="font-mono">{display}</span>. Edit mode reveals an input — leave blank to keep current value.</>
        ) : (
          "Leave blank to keep current value. Typed value replaces."
        )}
      </p>
    </div>
  );
};

const lastFourOf = (s) => (s && s.length > 4 ? s.slice(-4) : s || "");

const AnalyticsSettings = ({ refetch, getInitialCurrencyData: d }) => {
  const { user } = useContext(AuthContext) || {};
  const canEditSecrets = !!user?.role_id?.setting_secrets_update;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [secretsLoading, setSecretsLoading] = useState(false);
  const [isEditingSecrets, setIsEditingSecrets] = useState(false);

  const [toggles, setToggles] = useState({
    meta_pixel_enabled: false,
    meta_capi_enabled: false,
    tiktok_pixel_enabled: false,
    tiktok_capi_enabled: false,
    gtm_enabled: false,
    ga4_enabled: false,
    clarity_enabled: false,
  });

  const [ids, setIds] = useState({
    meta_pixel_id: "",
    tiktok_pixel_id: "",
    gtm_id: "",
    ga4_id: "",
    clarity_id: "",
    google_verification_meta: "",
  });

  // Secrets: lastFour shown in disabled state; typed value used on save.
  const [secretsLastFour, setSecretsLastFour] = useState({
    meta_capi_access_token: "",
    tiktok_capi_access_token: "",
    meta_test_event_code: "",
    tiktok_test_event_code: "",
  });
  const [secretsInput, setSecretsInput] = useState({
    meta_capi_access_token: "",
    tiktok_capi_access_token: "",
    meta_test_event_code: "",
    tiktok_test_event_code: "",
  });

  useEffect(() => {
    if (!d) return;
    setToggles({
      meta_pixel_enabled: !!d.meta_pixel_enabled,
      meta_capi_enabled: !!d.meta_capi_enabled,
      tiktok_pixel_enabled: !!d.tiktok_pixel_enabled,
      tiktok_capi_enabled: !!d.tiktok_capi_enabled,
      gtm_enabled: !!d.gtm_enabled,
      ga4_enabled: !!d.ga4_enabled,
      clarity_enabled: !!d.clarity_enabled,
    });
    setIds({
      meta_pixel_id: d.meta_pixel_id || "",
      tiktok_pixel_id: d.tiktok_pixel_id || "",
      gtm_id: d.gtm_id || "",
      ga4_id: d.ga4_id || "",
      clarity_id: d.clarity_id || "",
      google_verification_meta: d.google_verification_meta || "",
    });
  }, [d]);

  // Load lastFour summary of secrets on mount. BE returns a
  // `secrets_summary` object with the last-4 chars of each secret —
  // raw token values never reach the browser.
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
            meta_capi_access_token: summary.meta_capi_access_token || "",
            tiktok_capi_access_token: summary.tiktok_capi_access_token || "",
            meta_test_event_code: summary.meta_test_event_code || "",
            tiktok_test_event_code: summary.tiktok_test_event_code || "",
          });
        }
      } catch {
        // silent — user without permission will get 401, just don't show
      }
    })();
  }, [canEditSecrets]);

  const setToggle = (key) => (val) => {
    if (!isEditing) return;
    setToggles((prev) => ({ ...prev, [key]: val }));
  };

  const setId = (key) => (val) => {
    if (!isEditing) return;
    setIds((prev) => ({ ...prev, [key]: val }));
  };

  const setSecretInput = (key) => (val) => {
    if (!isEditingSecrets) return;
    setSecretsInput((prev) => ({ ...prev, [key]: val }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (!d) return;
    setToggles({
      meta_pixel_enabled: !!d.meta_pixel_enabled,
      meta_capi_enabled: !!d.meta_capi_enabled,
      tiktok_pixel_enabled: !!d.tiktok_pixel_enabled,
      tiktok_capi_enabled: !!d.tiktok_capi_enabled,
      gtm_enabled: !!d.gtm_enabled,
      ga4_enabled: !!d.ga4_enabled,
      clarity_enabled: !!d.clarity_enabled,
    });
    setIds({
      meta_pixel_id: d.meta_pixel_id || "",
      tiktok_pixel_id: d.tiktok_pixel_id || "",
      gtm_id: d.gtm_id || "",
      ga4_id: d.ga4_id || "",
      clarity_id: d.clarity_id || "",
      google_verification_meta: d.google_verification_meta || "",
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: d?._id, ...toggles, ...ids }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success("Analytics settings updated successfully");
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
    setSecretsInput({
      meta_capi_access_token: "",
      tiktok_capi_access_token: "",
      meta_test_event_code: "",
      tiktok_test_event_code: "",
    });
  };

  const handleSecretsSave = async () => {
    // Only send non-empty fields — backend treats blanks as "no change".
    const payload = {};
    for (const k of SECRET_KEYS) {
      const v = (secretsInput[k] || "").trim();
      if (v) payload[k] = v;
    }
    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to update");
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
        toast.success("Secrets updated");
        // Refresh masked summary
        setSecretsLastFour((prev) => {
          const next = { ...prev };
          for (const k of SECRET_KEYS) {
            if (payload[k]) next[k] = lastFourOf(payload[k]);
          }
          return next;
        });
        handleSecretsCancel();
      } else {
        toast.error(result?.message || "Failed to update secrets");
      }
    } catch (error) {
      toast.error(error?.message || "Network error");
    } finally {
      setSecretsLoading(false);
    }
  };

  const statusPills = [
    { label: "Meta Pixel", key: "meta_pixel_enabled" },
    { label: "Meta CAPI", key: "meta_capi_enabled" },
    { label: "TikTok Pixel", key: "tiktok_pixel_enabled" },
    { label: "TikTok CAPI", key: "tiktok_capi_enabled" },
    { label: "GTM", key: "gtm_enabled" },
    { label: "GA4", key: "ga4_enabled" },
    { label: "Clarity", key: "clarity_enabled" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <SiGoogleanalytics className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Analytics & Pixels
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enable platforms + set public IDs (CAPI secrets in section below)
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-3 p-5 bg-gray-50 border-b border-gray-200">
          {statusPills.map(({ label, key }) => (
            <div
              key={key}
              className="bg-white rounded-lg border border-gray-200 px-4 py-2 flex items-center gap-2"
            >
              <span
                className={`w-2 h-2 rounded-full ${toggles[key] ? "bg-green-500" : "bg-gray-300"}`}
              />
              <span className="text-xs font-medium text-gray-600">{label}</span>
              <span
                className={`text-xs font-bold ${toggles[key] ? "text-green-600" : "text-gray-400"}`}
              >
                {toggles[key] ? "ON" : "OFF"}
              </span>
            </div>
          ))}
        </div>

        {/* Platform Cards */}
        <div className="p-6 space-y-5">
          {/* Meta */}
          <PlatformCard
            icon={<SiMeta size={18} />}
            title="Meta (Facebook) Pixel"
            badge="Pixel ID public (in browser). CAPI access token is secret — see Secrets section below."
            iconBg="bg-blue-600"
            headerBg="bg-blue-50"
            border="border-blue-100"
          >
            <ToggleRow
              label="Enable Meta Pixel"
              description="Loads fbq() browser script on all pages"
              enabled={toggles.meta_pixel_enabled}
              onChange={setToggle("meta_pixel_enabled")}
              disabled={!isEditing}
            />
            <ToggleRow
              label="Enable CAPI (Server-side)"
              description="Sends server events via Conversions API"
              enabled={toggles.meta_capi_enabled}
              onChange={setToggle("meta_capi_enabled")}
              disabled={!isEditing}
            />
            <TextField
              label="Pixel ID"
              placeholder="e.g. 1234567890123456"
              value={ids.meta_pixel_id}
              onChange={setId("meta_pixel_id")}
              disabled={!isEditing}
              hint="Meta Business → Events Manager → Settings → Pixel ID (15-16 digit number)"
            />
          </PlatformCard>

          {/* TikTok */}
          <PlatformCard
            icon={<SiTiktok size={18} />}
            title="TikTok Pixel"
            badge="Pixel ID public. Events API access token is secret — see Secrets section."
            iconBg="bg-gray-900"
            headerBg="bg-gray-50"
            border="border-gray-200"
          >
            <ToggleRow
              label="Enable TikTok Pixel"
              description="Loads ttq browser script on all pages"
              enabled={toggles.tiktok_pixel_enabled}
              onChange={setToggle("tiktok_pixel_enabled")}
              disabled={!isEditing}
            />
            <ToggleRow
              label="Enable Events API (Server-side)"
              description="Sends server events via TikTok Events API"
              enabled={toggles.tiktok_capi_enabled}
              onChange={setToggle("tiktok_capi_enabled")}
              disabled={!isEditing}
            />
            <TextField
              label="Pixel ID"
              placeholder="e.g. CXXXXXXXXXXXXXXXXXXX"
              value={ids.tiktok_pixel_id}
              onChange={setId("tiktok_pixel_id")}
              disabled={!isEditing}
              hint="TikTok Ads Manager → Assets → Events → Pixel ID"
            />
          </PlatformCard>

          {/* GTM */}
          <PlatformCard
            icon={<SiGoogletagmanager size={18} />}
            title="Google Tag Manager"
            badge="Container ID public. GA4 typically fires through GTM."
            iconBg="bg-green-600"
            headerBg="bg-green-50"
            border="border-green-100"
          >
            <ToggleRow
              label="Enable GTM"
              description="Loads GTM script — GA4 and other tags fire through GTM"
              enabled={toggles.gtm_enabled}
              onChange={setToggle("gtm_enabled")}
              disabled={!isEditing}
            />
            <TextField
              label="Container ID"
              placeholder="GTM-XXXXXXX"
              value={ids.gtm_id}
              onChange={setId("gtm_id")}
              disabled={!isEditing}
              hint="tagmanager.google.com → Workspace → top-right container ID"
            />
          </PlatformCard>

          {/* GA4 */}
          <PlatformCard
            icon={<SiGoogleanalytics size={18} />}
            title="Google Analytics 4"
            badge="Measurement ID public — only enable if NOT using GTM (avoid double tracking)."
            iconBg="bg-orange-500"
            headerBg="bg-orange-50"
            border="border-orange-100"
          >
            <ToggleRow
              label="Enable GA4 (Standalone)"
              description="Only enable if GTM is disabled — enabling both causes double tracking"
              enabled={toggles.ga4_enabled}
              onChange={setToggle("ga4_enabled")}
              disabled={!isEditing}
            />
            <TextField
              label="Measurement ID"
              placeholder="G-XXXXXXXXXX"
              value={ids.ga4_id}
              onChange={setId("ga4_id")}
              disabled={!isEditing}
              hint="GA4 → Admin → Data Streams → Web stream → Measurement ID"
            />
          </PlatformCard>

          {/* Clarity */}
          <PlatformCard
            icon={<VscAzure size={18} />}
            title="Microsoft Clarity"
            badge="Project ID public — session recordings + heatmaps"
            iconBg="bg-purple-600"
            headerBg="bg-purple-50"
            border="border-purple-100"
          >
            <ToggleRow
              label="Enable Clarity"
              description="Session recordings and heatmaps"
              enabled={toggles.clarity_enabled}
              onChange={setToggle("clarity_enabled")}
              disabled={!isEditing}
            />
            <TextField
              label="Project ID"
              placeholder="e.g. xxxxxxxxxx"
              value={ids.clarity_id}
              onChange={setId("clarity_id")}
              disabled={!isEditing}
              hint="clarity.microsoft.com → Project → Settings → Project ID"
            />
          </PlatformCard>

          {/* Google Search Console verification */}
          <PlatformCard
            icon={<SiGoogleanalytics size={18} />}
            title="Google Search Console Verification"
            badge="Public meta tag content — used in <head> for site ownership verification"
            iconBg="bg-red-500"
            headerBg="bg-red-50"
            border="border-red-100"
          >
            <TextField
              label="Verification Meta Content"
              placeholder="google-site-verification token from Search Console"
              value={ids.google_verification_meta}
              onChange={setId("google_verification_meta")}
              disabled={!isEditing}
              hint="search.google.com/search-console → Property → Verify → HTML tag → content attribute"
            />
          </PlatformCard>

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
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
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
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-start gap-3">
          <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">Note:</span> Public IDs
            above appear in the browser pixel scripts (that's how analytics
            works). CAPI access tokens stay server-side — manage them in the
            Secrets section below.
          </p>
        </div>
      </div>

      {/* CAPI Secrets section — only visible to admins with the
          setting_secrets_update permission flag. */}
      {canEditSecrets ? (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl">
                  <FaLock className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    CAPI Secrets
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Access tokens + test event codes — admin-only, never
                    leak to browser
                  </p>
                </div>
              </div>
              {!isEditingSecrets && (
                <button
                  type="button"
                  onClick={() => setIsEditingSecrets(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center gap-2"
                >
                  <FaEye /> Update Secrets
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            <PlatformCard
              icon={<SiMeta size={18} />}
              title="Meta CAPI"
              badge="From Meta Business → Events Manager → Conversions API → Generate token"
              iconBg="bg-blue-600"
              headerBg="bg-blue-50"
              border="border-blue-100"
            >
              <SecretField
                label="Access Token"
                placeholder="EAAxxx... (paste full token)"
                lastFour={secretsLastFour.meta_capi_access_token}
                value={secretsInput.meta_capi_access_token}
                onChange={setSecretInput("meta_capi_access_token")}
                disabled={!isEditingSecrets}
              />
              <SecretField
                label="Test Event Code (optional, debug only)"
                placeholder="TESTxxxx — leave blank in production"
                lastFour={secretsLastFour.meta_test_event_code}
                value={secretsInput.meta_test_event_code}
                onChange={setSecretInput("meta_test_event_code")}
                disabled={!isEditingSecrets}
              />
            </PlatformCard>

            <PlatformCard
              icon={<SiTiktok size={18} />}
              title="TikTok CAPI"
              badge="From TikTok Ads Manager → Events → Events API → Generate Access Token"
              iconBg="bg-gray-900"
              headerBg="bg-gray-50"
              border="border-gray-200"
            >
              <SecretField
                label="Access Token"
                placeholder="paste full Events API token"
                lastFour={secretsLastFour.tiktok_capi_access_token}
                value={secretsInput.tiktok_capi_access_token}
                onChange={setSecretInput("tiktok_capi_access_token")}
                disabled={!isEditingSecrets}
              />
              <SecretField
                label="Test Event Code (optional, debug only)"
                placeholder="TESTxxxx — leave blank in production"
                lastFour={secretsLastFour.tiktok_test_event_code}
                value={secretsInput.tiktok_test_event_code}
                onChange={setSecretInput("tiktok_test_event_code")}
                disabled={!isEditingSecrets}
              />
            </PlatformCard>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {isEditingSecrets ? (
                <>
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
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {secretsLoading ? (
                      <>
                        <MiniSpinner />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Secrets</span>
                    )}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="bg-amber-50 border-t border-amber-200 p-4 flex items-start gap-3">
            <FaLock className="text-amber-600 mt-0.5 flex-shrink-0" size={12} />
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-700">Security:</span>{" "}
              These values are NEVER exposed in the public site-setting API
              response. Backend reads them only for server-side event firing.
              Leave a field blank in edit mode to keep the existing value.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex items-center gap-3">
          <FaLock className="text-gray-400" />
          <p className="text-xs text-gray-500">
            CAPI Secrets section is hidden — requires the{" "}
            <code className="bg-gray-200 px-1 rounded">
              setting_secrets_update
            </code>{" "}
            permission. Owner / superadmin only by default.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsSettings;
