import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaSave, FaCopy, FaCheck, FaSync, FaTruck } from "react-icons/fa";
import { BASE_URL } from "../../utils/baseURL";
import { AuthContext } from "../../context/AuthProvider";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";

// Courier credentials — Pathao + Steadfast.
//
// These used to live only in the backend .env, which meant the shop owner could
// not change them: they had to ask a developer to edit the container and
// redeploy. Worse, on this deployment the .env still carries the PREVIOUS
// owner's keys (the codebase is a rebrand), so an unconfigured shop would have
// shipped its parcels on someone else's account. The backend now reads these
// from the settings document ONLY — no env fallback — so a blank config means
// "courier not set up" rather than "use the old owner's account".
//
// Split by sensitivity, exactly like the Analytics tab:
//   PATCH /setting          → non-secret fields (toggles, sandbox, store id)
//   PATCH /setting/secrets  → credentials, guarded by setting_secrets_update
// Secrets are never read back into the browser; the backend returns only the
// last 4 characters so the UI can show "••••3a4f".

const SECRET_FIELDS = [
  "pathao_client_id",
  "pathao_client_secret",
  "pathao_username",
  "pathao_password",
  "pathao_webhook_secret",
  "steadfast_api_key",
  "steadfast_api_secret",
  "steadfast_webhook_secret",
];

const PUBLIC_FIELDS = [
  "pathao_enabled",
  "pathao_sandbox",
  "pathao_store_id",
  "steadfast_enabled",
];

const genSecret = () =>
  // 32 url-safe chars. Generated in the browser so the raw value never has to
  // travel anywhere except the PATCH that stores it.
  crypto
    .randomUUID()
    .replace(/-/g, "")
    .concat(crypto.randomUUID().replace(/-/g, ""))
    .slice(0, 32);

const lastFourOf = (v) => (v && v.length > 4 ? v.slice(-4) : v || "");

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
  </div>
);

const Toggle = ({ checked, onChange, label, hint }) => (
  <div className="flex items-start justify-between py-2">
    <div className="pr-4">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-blueColor-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

// A secret input: shows "already set (••••3a4f)" when one exists, and only
// sends a value when the admin actually types a new one.
const SecretInput = ({ value, onChange, lastFour, placeholder }) => (
  <div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-input w-full font-mono text-sm"
      placeholder={lastFour ? `Already set (••••${lastFour})` : placeholder}
      autoComplete="off"
    />
    {lastFour && !value && (
      <p className="text-[11px] text-green-600 mt-1">
        Saved. Type a new value to replace it.
      </p>
    )}
  </div>
);

// The webhook URL the shop owner pastes into the courier's dashboard.
const WebhookUrl = ({ url, note }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
        toast.success("Webhook URL copied");
      })
      .catch(() => toast.error("Could not copy"));
  };
  return (
    <div className="rounded border border-blueColor-100 bg-blueColor-50/40 p-3">
      <p className="text-xs font-semibold text-gray-700 mb-1.5">
        Webhook URL — paste this into the courier dashboard
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-mono text-gray-700">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded bg-blueColor-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blueColor-700"
        >
          {copied ? <FaCheck size={11} /> : <FaCopy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {note && <p className="text-[11px] text-gray-500 mt-1.5">{note}</p>}
    </div>
  );
};

const CourierSettings = ({ refetch, getInitialCurrencyData: d }) => {
  const { user } = useContext(AuthContext) || {};
  const canEditSecrets = user?.role_id?.setting_secrets_update === true;

  const [form, setForm] = useState({
    pathao_enabled: false,
    pathao_sandbox: false,
    pathao_store_id: "",
    steadfast_enabled: false,
  });
  const [secrets, setSecrets] = useState(
    Object.fromEntries(SECRET_FIELDS.map((k) => [k, ""])),
  );
  const [lastFour, setLastFour] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingSecrets, setSavingSecrets] = useState(false);

  useEffect(() => {
    if (!d) return;
    setForm({
      pathao_enabled: !!d.pathao_enabled,
      pathao_sandbox: !!d.pathao_sandbox,
      pathao_store_id: d.pathao_store_id || "",
      steadfast_enabled: !!d.steadfast_enabled,
    });
  }, [d]);

  // Masked previews of what's already stored. Raw values never come back.
  useEffect(() => {
    if (!canEditSecrets) return;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/setting/secrets`, {
          credentials: "include",
        });
        const result = await res.json();
        if (result?.success) setLastFour(result?.data?.secrets_summary || {});
      } catch {
        // no permission → 401; just don't show the previews
      }
    })();
  }, [canEditSecrets]);

  const settingId = d?._id;

  const saveGeneral = async () => {
    if (!settingId) return toast.error("Settings not loaded yet");
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: settingId,
          ...Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, form[k]])),
        }),
      });
      const result = await res.json();
      if (result?.success) {
        toast.success("Courier settings saved");
        refetch?.();
      } else toast.error(result?.message || "Save failed");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const saveSecrets = async () => {
    // Only send what was actually typed — an empty box means "leave as is",
    // never "wipe it".
    const payload = Object.fromEntries(
      Object.entries(secrets).filter(([, v]) => v.trim().length > 0),
    );
    if (Object.keys(payload).length === 0) {
      return toast.info("Nothing to update");
    }
    setSavingSecrets(true);
    try {
      const res = await fetch(`${BASE_URL}/setting/secrets`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result?.success) {
        toast.success("Credentials saved");
        setLastFour((prev) => {
          const next = { ...prev };
          for (const [k, v] of Object.entries(payload)) next[k] = lastFourOf(v);
          return next;
        });
        setSecrets(Object.fromEntries(SECRET_FIELDS.map((k) => [k, ""])));
        refetch?.();
      } else toast.error(result?.message || "Save failed");
    } catch {
      toast.error("Network error");
    } finally {
      setSavingSecrets(false);
    }
  };

  const setSecret = (k, v) => setSecrets((p) => ({ ...p, [k]: v }));

  const apiBase = BASE_URL.replace(/\/api\/v1\/?$/, "");
  const steadfastToken =
    secrets.steadfast_webhook_secret || (lastFour.steadfast_webhook_secret ? "<your-saved-secret>" : "");
  const steadfastWebhook = `${apiBase}/api/v1/webhook/steadfast${
    steadfastToken ? `?token=${steadfastToken}` : ""
  }`;
  const pathaoWebhook = `${apiBase}/api/v1/webhook/pathao`;

  if (!canEditSecrets) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        You need the <strong>setting_secrets_update</strong> permission to view
        or edit courier credentials.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg bg-blueColor-50/60 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blueColor-600 text-white">
          <FaTruck />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Courier Integrations
          </h3>
          <p className="text-xs text-gray-600">
            Your own Pathao / Steadfast credentials. Until these are filled in,
            sending an order to a courier will fail with a clear message — it
            will never fall back to anyone else&apos;s account.
          </p>
        </div>
      </div>

      {/* ── Pathao ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200">
        <div className="border-b bg-gray-50 px-4 py-3">
          <h4 className="font-semibold text-gray-800">Pathao</h4>
          <p className="text-[11px] text-gray-500">
            Pathao Merchant Panel → Developer API. The store id is on the Stores
            page.
          </p>
        </div>
        <div className="space-y-4 p-4">
          <Toggle
            checked={form.pathao_enabled}
            onChange={(v) => setForm((p) => ({ ...p, pathao_enabled: v }))}
            label="Enable Pathao"
            hint="Off = the Send to Pathao button refuses with a clear message."
          />
          <Toggle
            checked={form.pathao_sandbox}
            onChange={(v) => setForm((p) => ({ ...p, pathao_sandbox: v }))}
            label="Sandbox mode"
            hint="ON sends orders to Pathao's TEST server. Leave OFF for real orders."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Store ID" hint="Numeric id of your Pathao store.">
              <input
                type="text"
                value={form.pathao_store_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, pathao_store_id: e.target.value }))
                }
                className="form-input w-full"
                placeholder="e.g. 325412"
              />
            </Field>
            <Field label="Client ID">
              <SecretInput
                value={secrets.pathao_client_id}
                onChange={(v) => setSecret("pathao_client_id", v)}
                lastFour={lastFour.pathao_client_id}
                placeholder="From the Pathao merchant panel"
              />
            </Field>
            <Field label="Client Secret">
              <SecretInput
                value={secrets.pathao_client_secret}
                onChange={(v) => setSecret("pathao_client_secret", v)}
                lastFour={lastFour.pathao_client_secret}
                placeholder="From the Pathao merchant panel"
              />
            </Field>
            <Field label="Username (email)">
              <SecretInput
                value={secrets.pathao_username}
                onChange={(v) => setSecret("pathao_username", v)}
                lastFour={lastFour.pathao_username}
                placeholder="Your Pathao merchant login email"
              />
            </Field>
            <Field label="Password">
              <SecretInput
                value={secrets.pathao_password}
                onChange={(v) => setSecret("pathao_password", v)}
                lastFour={lastFour.pathao_password}
                placeholder="Your Pathao merchant login password"
              />
            </Field>
          </div>

          <div className="border-t pt-4 space-y-3">
            <Field
              label="Webhook Secret"
              hint="Pathao signs each webhook with this. Copy the SAME value into the Pathao merchant panel's webhook settings — if they do not match, delivery statuses will never reach your orders."
            >
              <div className="flex gap-2">
                <SecretInput
                  value={secrets.pathao_webhook_secret}
                  onChange={(v) => setSecret("pathao_webhook_secret", v)}
                  lastFour={lastFour.pathao_webhook_secret}
                  placeholder="Paste the secret from Pathao, or generate one"
                />
                <button
                  type="button"
                  onClick={() => setSecret("pathao_webhook_secret", genSecret())}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  title="Generate a random secret"
                >
                  <FaSync size={11} /> Generate
                </button>
              </div>
            </Field>
            <WebhookUrl
              url={pathaoWebhook}
              note="Pathao merchant panel → Webhook. The secret above must match the one you set there."
            />
          </div>
        </div>
      </div>

      {/* ── Steadfast ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200">
        <div className="border-b bg-gray-50 px-4 py-3">
          <h4 className="font-semibold text-gray-800">Steadfast</h4>
          <p className="text-[11px] text-gray-500">
            Steadfast portal → API. Steadfast does not sign its webhooks, so we
            use a token in the URL instead.
          </p>
        </div>
        <div className="space-y-4 p-4">
          <Toggle
            checked={form.steadfast_enabled}
            onChange={(v) => setForm((p) => ({ ...p, steadfast_enabled: v }))}
            label="Enable Steadfast"
            hint="Off = the Send to Steadfast button refuses with a clear message."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="API Key">
              <SecretInput
                value={secrets.steadfast_api_key}
                onChange={(v) => setSecret("steadfast_api_key", v)}
                lastFour={lastFour.steadfast_api_key}
                placeholder="From the Steadfast portal"
              />
            </Field>
            <Field label="Secret Key">
              <SecretInput
                value={secrets.steadfast_api_secret}
                onChange={(v) => setSecret("steadfast_api_secret", v)}
                lastFour={lastFour.steadfast_api_secret}
                placeholder="From the Steadfast portal"
              />
            </Field>
          </div>

          <div className="border-t pt-4 space-y-3">
            <Field
              label="Webhook Secret"
              hint="Your own secret — Steadfast does not provide one. Generate it here, then register the URL below (token included) in the Steadfast dashboard. Without it we cannot tell a real Steadfast callback from a forged one, and we refuse them all."
            >
              <div className="flex gap-2">
                <SecretInput
                  value={secrets.steadfast_webhook_secret}
                  onChange={(v) => setSecret("steadfast_webhook_secret", v)}
                  lastFour={lastFour.steadfast_webhook_secret}
                  placeholder="Generate one →"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSecret("steadfast_webhook_secret", genSecret())
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  title="Generate a random secret"
                >
                  <FaSync size={11} /> Generate
                </button>
              </div>
            </Field>
            {secrets.steadfast_webhook_secret ? (
              <WebhookUrl
                url={steadfastWebhook}
                note="Save first, then paste this whole URL (token included) into the Steadfast dashboard."
              />
            ) : (
              <p className="text-[11px] text-gray-500">
                {lastFour.steadfast_webhook_secret
                  ? "A secret is already saved. Generate a new one to see the full URL again — the saved value is never shown back."
                  : "Generate a secret to get your webhook URL."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Save ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={saveGeneral}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {saving ? <MiniSpinner /> : <FaSave />} Save toggles & store id
        </button>
        <button
          type="button"
          onClick={saveSecrets}
          disabled={savingSecrets}
          className="inline-flex items-center gap-2 rounded bg-blueColor-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blueColor-700 disabled:opacity-60"
        >
          {savingSecrets ? <MiniSpinner /> : <FaSave />} Save credentials
        </button>
      </div>
    </div>
  );
};

export default CourierSettings;
