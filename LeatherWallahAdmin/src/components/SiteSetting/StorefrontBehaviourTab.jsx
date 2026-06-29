import { useState, useEffect } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { motion } from "framer-motion";
import { FaEdit, FaStore } from "react-icons/fa";
import { MdToggleOff, MdToggleOn } from "react-icons/md";
import { FiInfo } from "react-icons/fi";

// C13 (Sprint 2 2026-06-06) — 13 storefront behaviour toggles (Tier A + Tier B).
// Sends only these 13 fields to PATCH /setting; the $set-patch fix in C12 ensures
// no other tab's values are clobbered.

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
      <MdToggleOn className="text-4xl text-green-600" />
    ) : (
      <MdToggleOff className="text-4xl text-gray-400" />
    )}
  </button>
);

const buildState = (d) => ({
  // Tier A
  maintain_stock: d?.maintain_stock ?? true,
  show_sold_count: d?.show_sold_count ?? true,
  show_email_field_checkout: d?.show_email_field_checkout ?? true,
  enable_promo_at_checkout: d?.enable_promo_at_checkout ?? true,
  verify_phone_on_order: d?.verify_phone_on_order ?? false,
  allow_image_download: d?.allow_image_download ?? false,
  min_order_amount: typeof d?.min_order_amount === "number" ? d.min_order_amount : 0,
  // Tier B
  show_stock_count_on_pdp: d?.show_stock_count_on_pdp ?? false,
  hide_out_of_stock_products: d?.hide_out_of_stock_products ?? false,
  enable_whatsapp_chat: d?.enable_whatsapp_chat ?? false,
  whatsapp_number: d?.whatsapp_number ?? "",
  chat_messenger_show: d?.chat_messenger_show ?? false,
  chat_messenger_page_id: d?.chat_messenger_page_id ?? "",
  chat_livechat_show: d?.chat_livechat_show ?? false,
  chat_livechat_embed_code: d?.chat_livechat_embed_code ?? "",
  chat_widgets_position: d?.chat_widgets_position ?? "bottom-right",
  enable_reviews: d?.enable_reviews ?? true,
  auto_approve_reviews: d?.auto_approve_reviews ?? false,
  enable_seeded_reviews: d?.enable_seeded_reviews ?? true,
});

const GroupHeader = ({ title, subtitle }) => (
  <div className="mb-3 mt-1">
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
    {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const ToggleRow = ({ label, help, fieldKey, state, set, isEditing }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex-1 pr-4">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {help && <p className="text-xs text-gray-400 mt-0.5">{help}</p>}
    </div>
    <Toggle
      enabled={!!state[fieldKey]}
      onChange={set(fieldKey)}
      disabled={!isEditing}
    />
  </div>
);

const StorefrontBehaviourTab = ({ refetch, getInitialCurrencyData: d }) => {
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
    const minAmt = Number(state.min_order_amount);
    if (!Number.isFinite(minAmt) || minAmt < 0) {
      toast.error("Minimum order amount must be 0 or a positive number");
      return;
    }
    if (state.enable_whatsapp_chat && !state.whatsapp_number?.trim()) {
      toast.error("WhatsApp number is required when WhatsApp chat is enabled");
      return;
    }
    if (state.chat_messenger_show && !state.chat_messenger_page_id?.trim()) {
      toast.error("Messenger Page ID is required when Messenger chat is enabled");
      return;
    }
    if (state.chat_livechat_show && !state.chat_livechat_embed_code?.trim()) {
      toast.error("Embed code is required when Live Chat is enabled");
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
          maintain_stock: state.maintain_stock,
          show_sold_count: state.show_sold_count,
          show_email_field_checkout: state.show_email_field_checkout,
          enable_promo_at_checkout: state.enable_promo_at_checkout,
          verify_phone_on_order: state.verify_phone_on_order,
          allow_image_download: state.allow_image_download,
          min_order_amount: minAmt,
          show_stock_count_on_pdp: state.show_stock_count_on_pdp,
          hide_out_of_stock_products: state.hide_out_of_stock_products,
          enable_whatsapp_chat: state.enable_whatsapp_chat,
          whatsapp_number: state.whatsapp_number ?? "",
          chat_messenger_show: state.chat_messenger_show,
          chat_messenger_page_id: state.chat_messenger_page_id ?? "",
          chat_livechat_show: state.chat_livechat_show,
          chat_livechat_embed_code: state.chat_livechat_embed_code ?? "",
          chat_widgets_position: state.chat_widgets_position ?? "bottom-right",
          enable_reviews: state.enable_reviews,
          auto_approve_reviews: state.auto_approve_reviews,
          enable_seeded_reviews: state.enable_seeded_reviews,
        }),
      });
      const result = await res.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success("Storefront behaviour settings saved");
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                <FaStore className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Storefront Behaviour</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Controls what customers see and how they interact with your store
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/30 transition-all flex items-center gap-2"
              >
                <FaEdit /> Edit Settings
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* GROUP 1: Stock & Inventory */}
          <div>
            <GroupHeader
              title="Stock & Inventory"
              subtitle="How stock is tracked and displayed"
            />
            <div className="bg-gray-50 rounded-lg px-4">
              <ToggleRow
                label="Maintain Stock"
                help="OFF = Pre-order / made-to-order mode. Orders succeed on any stock level; stock counters are NOT decremented."
                fieldKey="maintain_stock"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              <ToggleRow
                label="Show Sold Count on PDP"
                help='ON = Show "৫৩ জন কিনেছে" social-proof badge on the product page.'
                fieldKey="show_sold_count"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              <ToggleRow
                label="Show Stock Count on PDP"
                help='ON = Show "শুধু ৩টা বাকি" low-stock urgency badge on the product page.'
                fieldKey="show_stock_count_on_pdp"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              <ToggleRow
                label="Hide Out-of-Stock Products"
                help="ON = Out-of-stock products are excluded from all listings (enforced server-side — cannot be bypassed via DevTools)."
                fieldKey="hide_out_of_stock_products"
                state={state}
                set={set}
                isEditing={isEditing}
              />
            </div>
          </div>

          {/* GROUP 2: Checkout */}
          <div>
            <GroupHeader
              title="Checkout"
              subtitle="Fields and gates at order placement"
            />
            <div className="bg-gray-50 rounded-lg px-4">
              <ToggleRow
                label="Show Email Field at Checkout"
                help="OFF = Email input removed from checkout form. Useful for SMS-only shops."
                fieldKey="show_email_field_checkout"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              <ToggleRow
                label="Enable Promo / Coupon at Checkout"
                help="OFF = Coupon input hidden. Useful during campaigns where you don't want manual codes."
                fieldKey="enable_promo_at_checkout"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              <ToggleRow
                label="Require Phone Verification on Order"
                help="ON = Customer must verify phone via OTP before order is placed. Default OFF preserves anonymous checkout."
                fieldKey="verify_phone_on_order"
                state={state}
                set={set}
                isEditing={isEditing}
              />
            </div>
          </div>

          {/* GROUP 3: Limits */}
          <div>
            <GroupHeader
              title="Limits"
              subtitle="Minimum order constraints"
            />
            <div className="bg-gray-50 rounded-lg px-4 py-4">
              <label className="text-sm font-medium text-gray-700">
                Minimum Order Amount (৳)
              </label>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">
                Orders below this amount are rejected before any DB write. Set 0 to disable.
                Enforced server-side — cannot be bypassed via DevTools.
              </p>
              <input
                type="number"
                min={0}
                step={1}
                value={state.min_order_amount}
                onChange={(e) =>
                  isEditing &&
                  setState((p) => ({ ...p, min_order_amount: e.target.value }))
                }
                disabled={!isEditing}
                placeholder="0"
                className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* GROUP 4: PDP */}
          <div>
            <GroupHeader
              title="Product Detail Page (PDP)"
              subtitle="What appears on individual product pages"
            />
            <div className="bg-gray-50 rounded-lg px-4">
              <ToggleRow
                label="Allow Image Download"
                help="OFF = Right-click save is blocked on product images (prevents casual copying; does NOT block network-level download)."
                fieldKey="allow_image_download"
                state={state}
                set={set}
                isEditing={isEditing}
              />
            </div>
          </div>

          {/* GROUP 5: Customer Support */}
          <div>
            <GroupHeader
              title="Customer Support"
              subtitle="Live chat and contact options"
            />
            <div className="bg-gray-50 rounded-lg px-4">
              <ToggleRow
                label="Enable WhatsApp Chat Widget"
                help="ON = Floating WhatsApp button appears on storefront. Enter your WhatsApp number below."
                fieldKey="enable_whatsapp_chat"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              {state.enable_whatsapp_chat && (
                <div className="pb-3">
                  <label className="text-xs font-medium text-gray-600">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={state.whatsapp_number}
                    onChange={(e) =>
                      isEditing &&
                      setState((p) => ({ ...p, whatsapp_number: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="+8801XXXXXXXXX"
                    className="mt-1 w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
              )}
              <ToggleRow
                label="Enable Messenger Chat Widget"
                help="ON = Floating Facebook Messenger button appears on storefront. Enter your Facebook Page ID below."
                fieldKey="chat_messenger_show"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              {state.chat_messenger_show && (
                <div className="pb-3">
                  <label className="text-xs font-medium text-gray-600">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={state.chat_messenger_page_id}
                    onChange={(e) =>
                      isEditing &&
                      setState((p) => ({ ...p, chat_messenger_page_id: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="e.g. 1234567890 (your Page's numeric ID)"
                    className="mt-1 w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                </div>
              )}
              <ToggleRow
                label="Enable Live Chat (Tawk.to / Crisp / etc.)"
                help="ON = Paste your live-chat provider's embed script below. The chat box loads directly on your storefront."
                fieldKey="chat_livechat_show"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              {state.chat_livechat_show && (
                <div className="pb-3">
                  <label className="text-xs font-medium text-gray-600">
                    Live Chat Embed Code
                  </label>
                  <textarea
                    rows={5}
                    value={state.chat_livechat_embed_code}
                    onChange={(e) =>
                      isEditing &&
                      setState((p) => ({ ...p, chat_livechat_embed_code: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="Paste the full <script>…</script> snippet from Tawk.to / Crisp / Tidio"
                    className="mt-1 w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Get this from your provider's dashboard (e.g. Tawk.to → Administration → Chat Widget → Widget Code).
                  </p>
                </div>
              )}
              {(state.enable_whatsapp_chat || state.chat_messenger_show) && (
                <div className="pb-3">
                  <label className="text-xs font-medium text-gray-600">
                    Chat Buttons Position
                  </label>
                  <select
                    value={state.chat_widgets_position}
                    onChange={(e) =>
                      isEditing &&
                      setState((p) => ({ ...p, chat_widgets_position: e.target.value }))
                    }
                    disabled={!isEditing}
                    className="mt-1 block w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* GROUP 6: Reviews */}
          <div>
            <GroupHeader
              title="Reviews"
              subtitle="Customer review visibility and moderation"
            />
            <div className="bg-gray-50 rounded-lg px-4">
              <ToggleRow
                label="Enable Reviews"
                help="OFF = Review section and submission form hidden on all product pages."
                fieldKey="enable_reviews"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              <ToggleRow
                label="Auto-Approve Reviews"
                help="ON = Reviews go live immediately. OFF = New reviews land in the Pending Reviews queue for admin approval before going live."
                fieldKey="auto_approve_reviews"
                state={state}
                set={set}
                isEditing={isEditing}
              />
              <ToggleRow
                label="Show Seeded Reviews"
                help="ON = Admin-seeded (fake) reviews are visible on the storefront. OFF = Only real customer reviews shown. Dashboard analytics always show real data only."
                fieldKey="enable_seeded_reviews"
                state={state}
                set={set}
                isEditing={isEditing}
              />
            </div>
            {!state.auto_approve_reviews && state.enable_reviews && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <FiInfo className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Manual moderation is ON. Go to{" "}
                  <strong>Reviews → Pending Reviews</strong> to approve or reject
                  customer reviews before they appear on the storefront.
                </p>
              </div>
            )}
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
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
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
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
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

export default StorefrontBehaviourTab;
