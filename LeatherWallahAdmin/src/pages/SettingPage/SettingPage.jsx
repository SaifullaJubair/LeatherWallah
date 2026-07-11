import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SettingS from "../../components/SiteSetting/SettingS";
import { IoSettingsOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { AuthContext } from "../../context/AuthProvider";

// Settings tabs grouped into 4 sections. Each tab keeps its existing
// /settings/:tab route + the SettingS switch case — only the navigation UI
// changed (flat wrap-row → grouped left sub-nav).
const TAB_GROUPS = [
  {
    group: "Store",
    icon: "🏪",
    tabs: [
      { id: "site-setting", label: "Site Setting" },
      { id: "currency", label: "Currency" },
      { id: "policies", label: "Policies" },
      // Gated by demo_data_clear — filtered out below when the admin lacks it.
      { id: "demo-data", label: "Demo Data", perm: "demo_data_clear" },
    ],
  },
  {
    group: "Commerce",
    icon: "🛒",
    tabs: [
      { id: "shipping", label: "Shipping" },
      { id: "payment-methods", label: "Payment Methods" },
      { id: "vat", label: "Tax / VAT" },
      { id: "loyalty", label: "Loyalty" },
    ],
  },
  {
    group: "Storefront",
    icon: "📢",
    tabs: [
      { id: "home-layout", label: "Home Layout" },
      // "Feature Cards" hidden — nothing reads card_one_title / card_one_logo
      // (and the other six). The storefront's FeatureService.jsx renders a
      // HARDCODED list (Built to Last / Genuine Leather / Easy Return / Cash on
      // Delivery); its DB-driven version is commented out in that file. So the
      // tab saved happily and changed nothing on the site. Restore this entry if
      // FeatureService is ever wired back to the settings doc.
      // { id: "feature-cards", label: "Feature Cards" },
      { id: "announcement-bar", label: "Announcement Bar" },
      { id: "offer-banner", label: "Offer Banner" },
      { id: "storefront-behaviour", label: "Storefront Behaviour" },
    ],
  },
  {
    group: "Integrations",
    icon: "🔌",
    tabs: [
      { id: "phone-credential", label: "Phone Credential" },
      { id: "sms", label: "SMS Provider" },
      { id: "email", label: "Email Provider" },
      { id: "analytics", label: "Analytics & Pixels" },
    ],
  },
];

const SettingPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { user } = useContext(AuthContext);

  // Hide permission-gated tabs (e.g. Demo Data) when the admin lacks the flag.
  const visibleGroups = TAB_GROUPS.map((g) => ({
    ...g,
    tabs: g.tabs.filter((t) => !t.perm || user?.role_id?.[t.perm] === true),
  })).filter((g) => g.tabs.length > 0);

  useEffect(() => {
    if (!tab) {
      navigate("/settings/site-setting", { replace: true });
    }
  }, [tab, navigate]);

  return (
    <div className="h-full min-h-0 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 px-4 pb-4">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header hidden — the sidebar makes it clear this is Settings, so we
            reclaim the vertical space. Re-enable if a page title is wanted.
        <div className="flex items-center gap-3 shrink-0 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
            <IoSettingsOutline className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Settings</h1>
            <p className="text-xs text-gray-500">
              Manage your application configuration
            </p>
          </div>
        </div>
        */}

        {/* Two-column: grouped left nav + content. flex-1 + min-h-0 so the two
            columns fill the remaining height and each scrolls internally. */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left sub-nav */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 lg:shrink-0 bg-white rounded-2xl shadow-xl p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto"
          >
            <nav className="space-y-4">
              {visibleGroups.map((g) => (
                <div key={g.group}>
                  <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <span>{g.icon}</span>
                    {g.group}
                  </p>
                  <div className="space-y-0.5">
                    {g.tabs.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate(`/settings/${t.id}`)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          tab === t.id
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </motion.aside>

          {/* Content */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-0 min-h-0 bg-white rounded-2xl shadow-xl overflow-y-auto"
          >
            <SettingS />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
