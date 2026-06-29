import { useState, useEffect, useContext } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import { FaEdit, FaLock } from "react-icons/fa";
import { MdToggleOff, MdToggleOn, MdEmail } from "react-icons/md";
import { FiInfo, FiCheckCircle } from "react-icons/fi";
import { AuthContext } from "../../context/AuthProvider";

const Toggle = ({ enabled, onChange, disabled }) => (
  <button type="button" onClick={() => !disabled && onChange(!enabled)} disabled={disabled}
    className={`flex items-center transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
    {enabled
      ? <MdToggleOn className="text-4xl text-indigo-600" />
      : <MdToggleOff className="text-4xl text-gray-400" />}
  </button>
);

const buildState = (d) => ({
  email_provider_enabled: !!d?.email_provider_enabled,
  email_provider_name: d?.email_provider_name ?? "",
  email_host: d?.email_host ?? "",
  email_port: d?.email_port ?? 587,
  email_username: d?.email_username ?? "",
  email_from_address: d?.email_from_address ?? "",
  email_from_name: d?.email_from_name ?? "",
});

const PROVIDERS = [
  { label: "Gmail", host: "smtp.gmail.com", port: 587 },
  { label: "Brevo (Sendinblue)", host: "smtp-relay.brevo.com", port: 587 },
  { label: "Resend", host: "smtp.resend.com", port: 465 },
  { label: "Outlook / Hotmail", host: "smtp-mail.outlook.com", port: 587 },
  { label: "Custom SMTP", host: "", port: 587 },
];

const EmailSettings = ({ refetch, getInitialCurrencyData: d }) => {
  const { user } = useContext(AuthContext) || {};
  const canEditSecrets = !!user?.role_id?.setting_secrets_update;

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState(buildState(d));

  const [secretsLoading, setSecretsLoading] = useState(false);
  const [isEditingSecrets, setIsEditingSecrets] = useState(false);
  const [passwordMask, setPasswordMask] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [testLoading, setTestLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => { setState(buildState(d)); }, [d]);

  useEffect(() => {
    if (!canEditSecrets) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/setting/secrets`, { credentials: "include" });
        const result = await res.json();
        if (result?.success) {
          setPasswordMask(result?.data?.secrets_summary?.email_password || "");
        }
      } catch {}
    })();
  }, [canEditSecrets]);

  const set = (key) => (val) => { if (!isEditing) return; setState((p) => ({ ...p, [key]: val })); };

  const handlePreset = (preset) => {
    if (!isEditing) return;
    setState((p) => ({ ...p, email_host: preset.host, email_port: preset.port, email_provider_name: preset.label }));
  };

  const handleCancel = () => { setIsEditing(false); setState(buildState(d)); };

  const handleSave = async () => {
    if (state.email_provider_enabled && !state.email_host) {
      toast.error("SMTP host is required before enabling email"); return;
    }
    if (state.email_provider_enabled && !state.email_from_address) {
      toast.error("From address is required before enabling email"); return;
    }
    if (state.email_provider_enabled && !passwordMask && !passwordInput.trim()) {
      toast.error("Set the SMTP password (Secrets section) before enabling email"); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: d?._id,
          email_provider_enabled: state.email_provider_enabled,
          email_provider_name: state.email_provider_name,
          email_host: state.email_host,
          email_port: Number(state.email_port),
          email_username: state.email_username,
          email_from_address: state.email_from_address,
          email_from_name: state.email_from_name,
        }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success("Email settings saved");
        refetch();
        setIsEditing(false);
      } else {
        toast.error(result?.message || "Something went wrong");
      }
    } catch (e) {
      toast.error(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSecretsSave = async () => {
    const v = passwordInput.trim();
    if (!v) { toast.info("Type a new password to update"); return; }
    setSecretsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/setting/secrets`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_password: v }),
      });
      const result = await res.json();
      if (result?.success) {
        toast.success("SMTP password updated");
        setPasswordMask(v.length > 4 ? v.slice(-4) : v);
        setPasswordInput("");
        setIsEditingSecrets(false);
      } else {
        toast.error(result?.message || "Failed");
      }
    } catch (e) {
      toast.error(e?.message || "Network error");
    } finally {
      setSecretsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error("Enter a valid email address to test"); return;
    }
    setTestLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/setting/test-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });
      const result = await res.json();
      if (result?.success) {
        toast.success("Test email sent! Check your inbox.");
      } else {
        toast.error(result?.message || "Failed to send test email");
      }
    } catch (e) {
      toast.error(e?.message || "Network error");
    } finally {
      setTestLoading(false);
    }
  };

  const pwMaskDisplay = passwordMask ? `••••••••${passwordMask}` : "(not set)";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* ── Non-secret settings ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                <MdEmail className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Email Provider</h2>
                <p className="text-sm text-gray-500 mt-1">SMTP settings for admin password-reset OTP emails</p>
              </div>
            </div>
            {!isEditing && (
              <button type="button" onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 flex items-center gap-2">
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Enable toggle */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable email sending</p>
              <p className="text-xs text-gray-400 mt-0.5">When OFF, email OTP is skipped. Use phone OTP instead.</p>
            </div>
            <Toggle enabled={state.email_provider_enabled} onChange={set("email_provider_enabled")} disabled={!isEditing} />
          </div>

          {/* Quick preset buttons */}
          {isEditing && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map((p) => (
                  <button key={p.label} type="button" onClick={() => handlePreset(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium
                      ${state.email_host === p.host && p.host
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                      }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "email_provider_name", label: "Provider name", placeholder: "Gmail" },
              { key: "email_host", label: "SMTP host", placeholder: "smtp.gmail.com" },
              { key: "email_from_address", label: "From address", placeholder: "you@gmail.com" },
              { key: "email_from_name", label: "From name", placeholder: "Leather Wallah" },
              { key: "email_username", label: "Username / login email", placeholder: "you@gmail.com" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input type="text" value={state[key]} onChange={(e) => set(key)(e.target.value)}
                  disabled={!isEditing} placeholder={placeholder}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-gray-600">SMTP port</label>
              <input type="number" value={state.email_port} onChange={(e) => set("email_port")(e.target.value)}
                disabled={!isEditing} placeholder="587"
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed" />
              <p className="text-[10px] text-gray-400 mt-1">587 = TLS (recommended) · 465 = SSL · 25 = plain</p>
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
            <FiInfo className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-700">
              SMTP password is managed in the <strong>Secrets</strong> section below.
              For Gmail, use an <strong>App Password</strong> (not your Gmail password) —
              Google Account → Security → 2-Step → App Passwords.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button type="button" onClick={handleCancel}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <><MiniSpinner /><span>Saving...</span></> : "Save Settings"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 flex items-center gap-2">
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Secrets (admin-only) ─────────────────────────────── */}
      {canEditSecrets ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-slate-600 to-gray-700 rounded-xl">
                  <FaLock className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">SMTP Password (Secret)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Server-only. Last-4 mask shown only.</p>
                </div>
              </div>
              {!isEditingSecrets && (
                <button type="button" onClick={() => setIsEditingSecrets(true)}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg flex items-center gap-2">
                  <FaEdit /> {passwordMask ? "Rotate Password" : "Set Password"}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">SMTP Password</label>
              <input type={isEditingSecrets ? "text" : "password"}
                value={isEditingSecrets ? passwordInput : ""}
                onChange={(e) => isEditingSecrets && setPasswordInput(e.target.value)}
                disabled={!isEditingSecrets}
                placeholder={isEditingSecrets ? "Paste new password or App Password…" : pwMaskDisplay}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono" />
              <p className="text-[10px] text-gray-400 mt-1">
                Current: <span className="font-mono">{pwMaskDisplay}</span>. Leave blank to keep.
              </p>
            </div>

            {isEditingSecrets && (
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button type="button" onClick={() => { setIsEditingSecrets(false); setPasswordInput(""); }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSecretsSave} disabled={secretsLoading}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {secretsLoading ? <><MiniSpinner /><span>Saving...</span></> : "Save Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <FaLock className="text-gray-400 mt-0.5" />
          <p className="text-xs text-gray-500">
            SMTP password can only be managed by users with the{" "}
            <code className="bg-white px-1 rounded">setting_secrets_update</code> permission.
          </p>
        </div>
      )}

      {/* ── Send test email ──────────────────────────────────── */}
      {canEditSecrets && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="text-green-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Send Test Email</h3>
                <p className="text-xs text-gray-500 mt-0.5">Verify your SMTP settings work before going live</p>
              </div>
            </div>
          </div>
          <div className="p-6 flex gap-3">
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 outline-none" />
            <button type="button" onClick={handleTestEmail} disabled={testLoading}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2 shrink-0">
              {testLoading ? <><MiniSpinner /><span>Sending...</span></> : "Send Test"}
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default EmailSettings;
