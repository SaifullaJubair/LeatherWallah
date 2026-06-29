/**
 * PaymentMethodPicker — F1a.
 *
 * Reads settings.cod_enabled / manual_mfs_enabled / bank_transfer_enabled /
 * sslcommerz_enabled and surfaces the matching radio cards. When the user
 * picks a method that needs pre-pay instructions (manual_mfs / bank_transfer),
 * the instructions block + accounts table render right under the cards so the
 * buyer knows what to do BEFORE clicking Place Order.
 */

"use client";
import { FaMoneyBillWave, FaUniversity, FaMobileAlt } from "react-icons/fa";
import { MdCreditCard } from "react-icons/md";

const METHODS = [
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay the courier in cash on delivery.",
    icon: FaMoneyBillWave,
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "manual_mfs",
    label: "Mobile Wallet (bKash / Nagad / Rocket)",
    description: "Send Money to our merchant number, then submit the trxId.",
    icon: FaMobileAlt,
    iconBg: "bg-pink-100 text-pink-700",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description: "Transfer to one of our bank accounts; upload the slip after.",
    icon: FaUniversity,
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    value: "sslcommerz",
    label: "Cards / SSLCommerz",
    description: "Pay online via card, bKash, Nagad, or Rocket through SSLCommerz.",
    icon: MdCreditCard,
    iconBg: "bg-indigo-100 text-indigo-700",
  },
];

const PaymentMethodPicker = ({ settings, value, onChange }) => {
  if (!settings) return null;

  const enabledMap = {
    cod: settings.cod_enabled !== false, // default true
    manual_mfs: !!settings.manual_mfs_enabled,
    bank_transfer: !!settings.bank_transfer_enabled,
    sslcommerz: !!settings.sslcommerz_enabled,
  };

  const visible = METHODS.filter((m) => enabledMap[m.value]);

  if (!visible.length) {
    return (
      <div className="bg-white shadow-sm p-4 mt-3 rounded">
        <p className="text-sm text-red-600">
          No payment methods are enabled. Ask the admin to enable at least one in
          Settings → Payment Methods.
        </p>
      </div>
    );
  }

  const selectedMethod = visible.find((m) => m.value === value);

  return (
    <div className="bg-white shadow-sm p-5 mt-3 rounded">
      <p className="text-lg font-medium mb-1">Payment Method</p>
      <p className="text-xs text-gray-500 mb-4">
        Choose how you'd like to pay for this order.
      </p>

      <div className="space-y-2">
        {visible.map((m) => {
          const Icon = m.icon;
          const active = value === m.value;
          return (
            <label
              key={m.value}
              className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition ${
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={m.value}
                checked={active}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1.5 accent-primary"
              />
              <span
                className={`p-2 rounded ${m.iconBg} flex-shrink-0 flex items-center justify-center`}
              >
                <Icon size={18} />
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Method-specific instructions block. Visible BEFORE placing the order
          so the buyer knows what to do next. (Detailed instructions also come
          back from the BE payment_init response — that's the source of truth.) */}
      {selectedMethod && value === "manual_mfs" && (
        <ManualMfsInstructions settings={settings} />
      )}
      {selectedMethod && value === "bank_transfer" && (
        <BankTransferInstructions settings={settings} />
      )}
      {selectedMethod && value === "sslcommerz" && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-700">
          You'll be redirected to the secure SSLCommerz gateway after clicking
          Place Order.
        </div>
      )}
    </div>
  );
};

const ManualMfsInstructions = ({ settings }) => {
  const methods = settings?.manual_mfs_methods || [];
  const sharedInstruction = settings?.manual_mfs_instruction;
  if (!methods.length) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800">
        No MFS numbers configured yet. Please ask the admin to add one in
        Settings → Payment Methods.
      </div>
    );
  }
  return (
    <div className="mt-4 p-4 bg-pink-50 border border-pink-100 rounded">
      <p className="text-sm font-semibold text-pink-800 mb-2">
        Send Money to one of these numbers
      </p>
      {sharedInstruction && (
        <p className="text-xs text-pink-700 mb-3">{sharedInstruction}</p>
      )}
      <div className="space-y-2">
        {methods.map((m, i) => (
          <div
            key={i}
            className="bg-white rounded border border-pink-100 p-2 flex items-start justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">{m.name}</p>
              <p className="text-xs font-mono text-gray-700">{m.number}</p>
              {m.instruction && (
                <p className="text-[11px] text-gray-500 italic mt-1">
                  {m.instruction}
                </p>
              )}
            </div>
            {m.account_type && (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full self-start">
                {m.account_type}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-pink-700 mt-3">
        After placing the order you'll get a Transaction ID box to paste your
        trxId — admin will verify and confirm.
      </p>
    </div>
  );
};

const BankTransferInstructions = ({ settings }) => {
  const accounts = settings?.bank_accounts || [];
  const sharedInstruction = settings?.bank_transfer_instruction;
  if (!accounts.length) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800">
        No bank accounts configured yet. Please ask the admin to add one in
        Settings → Payment Methods.
      </div>
    );
  }
  return (
    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded">
      <p className="text-sm font-semibold text-amber-800 mb-2">
        Transfer to one of these accounts
      </p>
      {sharedInstruction && (
        <p className="text-xs text-amber-700 mb-3">{sharedInstruction}</p>
      )}
      <div className="space-y-2">
        {accounts.map((a, i) => (
          <div
            key={i}
            className="bg-white rounded border border-amber-100 p-2 text-xs"
          >
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-gray-800 text-sm">
                {a.bank_name}
                {a.branch && (
                  <span className="text-gray-400 font-normal"> · {a.branch}</span>
                )}
              </p>
            </div>
            <p className="text-gray-700">
              <span className="text-gray-400">A/C name:</span> {a.account_name}
            </p>
            <p className="text-gray-700 font-mono">
              <span className="text-gray-400 font-sans">A/C #:</span>{" "}
              {a.account_number}
            </p>
            {a.routing && (
              <p className="text-gray-500 font-mono">
                <span className="text-gray-400 font-sans">Routing:</span>{" "}
                {a.routing}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-amber-700 mt-3">
        After placing the order you'll be prompted to upload the deposit slip
        screenshot for admin verification.
      </p>
    </div>
  );
};

export default PaymentMethodPicker;
