import { useState, useEffect } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { MdToggleOff, MdToggleOn, MdPayments } from "react-icons/md";
import { FiInfo } from "react-icons/fi";
import {
  HiOutlineCash,
  HiOutlineCreditCard,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";
import { SiContactlesspayment } from "react-icons/si";

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

const SectionCard = ({ icon, title, badge, iconBg, headerBg, border, children }) => (
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

const Field = ({ label, hint, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

const TextInput = ({ value, onChange, disabled, placeholder, type = "text" }) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={(e) => onChange(type === "number" ? e.target.value : e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
  />
);

const TextArea = ({ value, onChange, disabled, placeholder, rows = 3 }) => (
  <textarea
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
  />
);

const Select = ({ value, onChange, disabled, options }) => (
  <select
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const ADVANCE_METHOD_OPTIONS = [
  { value: "sslcommerz", label: "SSLCommerz" },
  { value: "manual_mfs", label: "Manual MFS" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const MFS_ACCOUNT_TYPES = [
  { value: "personal", label: "Personal" },
  { value: "agent", label: "Agent" },
  { value: "merchant", label: "Merchant" },
];

const EMPTY_MFS = { name: "", number: "", account_type: "personal", instruction: "" };
const EMPTY_BANK = {
  bank_name: "",
  branch: "",
  account_name: "",
  account_number: "",
  routing: "",
};

const buildState = (d) => ({
  cod_enabled: !!d?.cod_enabled,

  manual_mfs_enabled: !!d?.manual_mfs_enabled,
  manual_mfs_instruction: d?.manual_mfs_instruction ?? "",
  manual_mfs_methods: Array.isArray(d?.manual_mfs_methods)
    ? d.manual_mfs_methods.map((m) => ({ ...EMPTY_MFS, ...m }))
    : [],

  bank_transfer_enabled: !!d?.bank_transfer_enabled,
  bank_transfer_instruction: d?.bank_transfer_instruction ?? "",
  bank_accounts: Array.isArray(d?.bank_accounts)
    ? d.bank_accounts.map((b) => ({ ...EMPTY_BANK, ...b }))
    : [],

  sslcommerz_enabled: !!d?.sslcommerz_enabled,
  sslcommerz_sandbox: d?.sslcommerz_sandbox !== false, // default true

  advance_payment_enabled: !!d?.advance_payment_enabled,
  advance_payment_min_percent:
    d?.advance_payment_min_percent === 0 || d?.advance_payment_min_percent
      ? d.advance_payment_min_percent
      : 20,
  advance_payment_methods: Array.isArray(d?.advance_payment_methods)
    ? d.advance_payment_methods
    : [],
});

const PaymentMethodsSettings = ({ refetch, getInitialCurrencyData: d }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [state, setState] = useState(buildState(d));

  useEffect(() => {
    setState(buildState(d));
  }, [d]);

  const set = (key) => (val) => {
    if (!isEditing) return;
    setState((prev) => ({ ...prev, [key]: val }));
  };

  // ---------- MFS list helpers ----------
  const addMfs = () =>
    setState((p) => ({ ...p, manual_mfs_methods: [...p.manual_mfs_methods, { ...EMPTY_MFS }] }));
  const removeMfs = (idx) =>
    setState((p) => ({
      ...p,
      manual_mfs_methods: p.manual_mfs_methods.filter((_, i) => i !== idx),
    }));
  const updateMfs = (idx, key, val) =>
    setState((p) => ({
      ...p,
      manual_mfs_methods: p.manual_mfs_methods.map((m, i) =>
        i === idx ? { ...m, [key]: val } : m,
      ),
    }));

  // ---------- Bank list helpers ----------
  const addBank = () =>
    setState((p) => ({ ...p, bank_accounts: [...p.bank_accounts, { ...EMPTY_BANK }] }));
  const removeBank = (idx) =>
    setState((p) => ({
      ...p,
      bank_accounts: p.bank_accounts.filter((_, i) => i !== idx),
    }));
  const updateBank = (idx, key, val) =>
    setState((p) => ({
      ...p,
      bank_accounts: p.bank_accounts.map((b, i) =>
        i === idx ? { ...b, [key]: val } : b,
      ),
    }));

  // ---------- advance methods multi-select ----------
  const toggleAdvanceMethod = (method) => {
    if (!isEditing) return;
    setState((p) => ({
      ...p,
      advance_payment_methods: p.advance_payment_methods.includes(method)
        ? p.advance_payment_methods.filter((m) => m !== method)
        : [...p.advance_payment_methods, method],
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setState(buildState(d));
  };

  const validate = () => {
    // MFS rows must have name + number when MFS is enabled
    if (state.manual_mfs_enabled) {
      for (const [i, m] of state.manual_mfs_methods.entries()) {
        if (!m.name?.trim() || !m.number?.trim()) {
          toast.error(`Manual MFS row #${i + 1}: name and number are required`);
          return false;
        }
      }
    }
    // Bank rows must have bank_name + account_name + account_number when bank is enabled
    if (state.bank_transfer_enabled) {
      for (const [i, b] of state.bank_accounts.entries()) {
        if (
          !b.bank_name?.trim() ||
          !b.account_name?.trim() ||
          !b.account_number?.trim()
        ) {
          toast.error(
            `Bank account #${i + 1}: bank name, account name and account number are required`,
          );
          return false;
        }
      }
    }
    // Advance: min% sane + at least one method picked when enabled
    if (state.advance_payment_enabled) {
      const pct = Number(state.advance_payment_min_percent);
      if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
        toast.error("Advance payment min % must be between 1 and 100");
        return false;
      }
      if (!state.advance_payment_methods.length) {
        toast.error("Pick at least one advance payment method");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        _id: d?._id,
        cod_enabled: state.cod_enabled,

        manual_mfs_enabled: state.manual_mfs_enabled,
        manual_mfs_instruction: state.manual_mfs_instruction,
        manual_mfs_methods: state.manual_mfs_methods,

        bank_transfer_enabled: state.bank_transfer_enabled,
        bank_transfer_instruction: state.bank_transfer_instruction,
        bank_accounts: state.bank_accounts,

        sslcommerz_enabled: state.sslcommerz_enabled,
        sslcommerz_sandbox: state.sslcommerz_sandbox,

        advance_payment_enabled: state.advance_payment_enabled,
        advance_payment_min_percent: Number(state.advance_payment_min_percent) || 0,
        advance_payment_methods: state.advance_payment_methods,
      };
      const res = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success("Payment settings updated successfully");
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

  const statusPills = [
    { label: "COD", on: state.cod_enabled },
    { label: "Manual MFS", on: state.manual_mfs_enabled },
    { label: "Bank Transfer", on: state.bank_transfer_enabled },
    { label: "SSLCommerz", on: state.sslcommerz_enabled },
    { label: "Advance Pay", on: state.advance_payment_enabled },
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
                <MdPayments className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Methods</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enable gateways and configure manual payment details
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
          {statusPills.map(({ label, on }) => (
            <div
              key={label}
              className="bg-white rounded-lg border border-gray-200 px-4 py-2 flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${on ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-xs font-medium text-gray-600">{label}</span>
              <span className={`text-xs font-bold ${on ? "text-green-600" : "text-gray-400"}`}>
                {on ? "ON" : "OFF"}
              </span>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="p-6 space-y-5">
          {/* COD */}
          <SectionCard
            icon={<HiOutlineCash size={18} />}
            title="Cash on Delivery (COD)"
            badge="Buyer pays the courier on delivery — no online step."
            iconBg="bg-emerald-600"
            headerBg="bg-emerald-50"
            border="border-emerald-100"
          >
            <ToggleRow
              label="Enable COD"
              description="Allow customers to place orders as cash-on-delivery"
              enabled={state.cod_enabled}
              onChange={set("cod_enabled")}
              disabled={!isEditing}
            />
          </SectionCard>

          {/* Manual MFS */}
          <SectionCard
            icon={<SiContactlesspayment size={18} />}
            title="Manual MFS (bKash / Nagad / Rocket)"
            badge="Customer sends money to your merchant number, submits trxId, you verify."
            iconBg="bg-pink-600"
            headerBg="bg-pink-50"
            border="border-pink-100"
          >
            <ToggleRow
              label="Enable Manual MFS"
              description="Show MFS option at checkout with the numbers listed below"
              enabled={state.manual_mfs_enabled}
              onChange={set("manual_mfs_enabled")}
              disabled={!isEditing}
            />

            <Field
              label="Shared instruction (shown above the numbers list at checkout)"
              hint="Optional. E.g. 'Send Money → submit trxId below.'"
            >
              <TextArea
                value={state.manual_mfs_instruction}
                onChange={set("manual_mfs_instruction")}
                disabled={!isEditing}
                placeholder="Send Money to one of the numbers below, then submit the transaction ID."
                rows={2}
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">MFS Methods</p>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addMfs}
                    className="px-3 py-1.5 text-xs bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-1.5"
                  >
                    <FaPlus size={10} /> Add method
                  </button>
                )}
              </div>

              {state.manual_mfs_methods.length === 0 && (
                <p className="text-xs text-gray-400 italic">No MFS methods added yet.</p>
              )}

              {state.manual_mfs_methods.map((m, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field label="Name (e.g. bKash)">
                      <TextInput
                        value={m.name}
                        onChange={(v) => updateMfs(idx, "name", v)}
                        disabled={!isEditing}
                        placeholder="bKash"
                      />
                    </Field>
                    <Field label="Receiving number">
                      <TextInput
                        value={m.number}
                        onChange={(v) => updateMfs(idx, "number", v)}
                        disabled={!isEditing}
                        placeholder="017XXXXXXXX"
                      />
                    </Field>
                    <Field label="Account type">
                      <Select
                        value={m.account_type || "personal"}
                        onChange={(v) => updateMfs(idx, "account_type", v)}
                        disabled={!isEditing}
                        options={MFS_ACCOUNT_TYPES}
                      />
                    </Field>
                  </div>
                  <Field label="Per-method instruction (optional)">
                    <TextInput
                      value={m.instruction}
                      onChange={(v) => updateMfs(idx, "instruction", v)}
                      disabled={!isEditing}
                      placeholder="Use 'Send Money', not 'Payment'"
                    />
                  </Field>
                  {isEditing && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeMfs(idx)}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center gap-1.5"
                      >
                        <FaTrash size={10} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Bank Transfer */}
          <SectionCard
            icon={<HiOutlineOfficeBuilding size={18} />}
            title="Bank Transfer"
            badge="Customer transfers to your bank, may upload a screenshot, you verify."
            iconBg="bg-amber-600"
            headerBg="bg-amber-50"
            border="border-amber-100"
          >
            <ToggleRow
              label="Enable Bank Transfer"
              description="Show bank-transfer option with the accounts listed below"
              enabled={state.bank_transfer_enabled}
              onChange={set("bank_transfer_enabled")}
              disabled={!isEditing}
            />

            <Field
              label="Shared instruction (shown above the bank accounts at checkout)"
              hint="Optional. E.g. 'Transfer the exact amount and upload the receipt.'"
            >
              <TextArea
                value={state.bank_transfer_instruction}
                onChange={set("bank_transfer_instruction")}
                disabled={!isEditing}
                placeholder="Transfer the exact amount to any of the accounts below, then upload the screenshot."
                rows={2}
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">Bank Accounts</p>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addBank}
                    className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-1.5"
                  >
                    <FaPlus size={10} /> Add account
                  </button>
                )}
              </div>

              {state.bank_accounts.length === 0 && (
                <p className="text-xs text-gray-400 italic">No bank accounts added yet.</p>
              )}

              {state.bank_accounts.map((b, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Bank name">
                      <TextInput
                        value={b.bank_name}
                        onChange={(v) => updateBank(idx, "bank_name", v)}
                        disabled={!isEditing}
                        placeholder="Dutch-Bangla Bank"
                      />
                    </Field>
                    <Field label="Branch (optional)">
                      <TextInput
                        value={b.branch}
                        onChange={(v) => updateBank(idx, "branch", v)}
                        disabled={!isEditing}
                        placeholder="Gulshan"
                      />
                    </Field>
                    <Field label="Account name">
                      <TextInput
                        value={b.account_name}
                        onChange={(v) => updateBank(idx, "account_name", v)}
                        disabled={!isEditing}
                        placeholder="Leather Wallah Ltd."
                      />
                    </Field>
                    <Field label="Account number">
                      <TextInput
                        value={b.account_number}
                        onChange={(v) => updateBank(idx, "account_number", v)}
                        disabled={!isEditing}
                        placeholder="123-456-7890"
                      />
                    </Field>
                    <Field label="Routing (optional)">
                      <TextInput
                        value={b.routing}
                        onChange={(v) => updateBank(idx, "routing", v)}
                        disabled={!isEditing}
                        placeholder="090123456"
                      />
                    </Field>
                  </div>
                  {isEditing && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeBank(idx)}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center gap-1.5"
                      >
                        <FaTrash size={10} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* SSLCommerz */}
          <SectionCard
            icon={<HiOutlineCreditCard size={18} />}
            title="SSLCommerz"
            badge="Card + bKash + Nagad + Rocket via hosted gateway. Secrets live in server .env."
            iconBg="bg-indigo-600"
            headerBg="bg-indigo-50"
            border="border-indigo-100"
          >
            <ToggleRow
              label="Enable SSLCommerz"
              description="Show SSLCommerz option at checkout (browser is redirected to their hosted page)"
              enabled={state.sslcommerz_enabled}
              onChange={set("sslcommerz_enabled")}
              disabled={!isEditing}
            />
            <ToggleRow
              label="Sandbox mode"
              description="Use sandbox endpoint for test transactions (turn OFF for live)"
              enabled={state.sslcommerz_sandbox}
              onChange={set("sslcommerz_sandbox")}
              disabled={!isEditing}
            />
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
              <FiInfo className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-700">
                Store ID and password are read from server{" "}
                <code className="bg-white px-1 rounded">.env</code> (
                <code className="bg-white px-1 rounded">SSLCOMMERZ_STORE_ID</code>,{" "}
                <code className="bg-white px-1 rounded">SSLCOMMERZ_STORE_PASSWORD</code>).
                Only the toggles above are saved here.
              </p>
            </div>
          </SectionCard>

          {/* Advance / Partial Payment */}
          <SectionCard
            icon={<MdPayments size={18} />}
            title="Advance / Partial Payment"
            badge="Customer pays X% online to confirm the order; the rest is collected COD on delivery."
            iconBg="bg-purple-600"
            headerBg="bg-purple-50"
            border="border-purple-100"
          >
            <ToggleRow
              label="Enable advance payment"
              description="Show the 'pay X% now, rest COD' option at checkout"
              enabled={state.advance_payment_enabled}
              onChange={set("advance_payment_enabled")}
              disabled={!isEditing}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Minimum advance percent (%)"
                hint="Customer must pre-pay at least this much of the order total."
              >
                <TextInput
                  type="number"
                  value={state.advance_payment_min_percent}
                  onChange={set("advance_payment_min_percent")}
                  disabled={!isEditing || !state.advance_payment_enabled}
                  placeholder="20"
                />
              </Field>

              <Field
                label="Allowed methods for advance"
                hint="Customer can pre-pay using any of the methods you select here."
              >
                <div className="flex flex-wrap gap-2 pt-1">
                  {ADVANCE_METHOD_OPTIONS.map((opt) => {
                    const active = state.advance_payment_methods.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleAdvanceMethod(opt.value)}
                        disabled={!isEditing || !state.advance_payment_enabled}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          active
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </SectionCard>

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
            <span className="font-medium text-gray-700">Tip:</span> When a customer
            checks out, they see only the methods you've enabled. Disable methods to
            hide them; the backend rejects orders placed against a disabled gateway.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentMethodsSettings;
