import { useState, useEffect } from "react";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MdToggleOff,
  MdToggleOn,
  MdDragIndicator,
} from "react-icons/md";
import { FiChevronDown, FiChevronUp, FiSave, FiRotateCcw } from "react-icons/fi";

const SECTION_LABELS = {
  trust_strip: "Trust Strip",
  feature_categories: "Featured Categories",
  flash_sale: "Flash Sale",
  bestsellers: "Bestsellers",
  offers_block: "Special Offers Block",
  new_arrivals: "New Arrivals",
  brand_story: "Brand Story",
  reviews_carousel: "Reviews Carousel",
  trending_products: "Trending Products",
  just_for_you: "Just for You",
  ecommerce_choice: "Our Choice",
  category_wise_strip: "Category Strip",
  promo_banner: "Promo Banner",
  site_faq: "Site FAQ",
  newsletter: "Newsletter",
  // Boutique preset (few-products storytelling home)
  hero_spotlight: "Hero Spotlight (boutique)",
  product_features: "Product Features (boutique)",
  story_band: "Story Band (boutique)",
};

const L9_DEFAULTS = [
  { id: "trust_strip",         enabled: true,  order: 1  },
  { id: "feature_categories",  enabled: true,  order: 2  },
  { id: "flash_sale",          enabled: true,  order: 3  },
  { id: "bestsellers",         enabled: true,  order: 4  },
  { id: "offers_block",        enabled: true,  order: 5  },
  { id: "new_arrivals",        enabled: true,  order: 6  },
  { id: "brand_story",         enabled: true,  order: 7  },
  { id: "reviews_carousel",    enabled: true,  order: 8  },
  { id: "trending_products",   enabled: true,  order: 9  },
  { id: "just_for_you",        enabled: false, order: 10 },
  { id: "ecommerce_choice",    enabled: false, order: 11 },
  { id: "category_wise_strip", enabled: false, order: 12 },
  { id: "promo_banner",        enabled: false, order: 13 },
  { id: "site_faq",            enabled: true,  order: 14 },
  { id: "newsletter",          enabled: true,  order: 15 },
  // Boutique preset — disabled by default; mirrors backend HOME_SECTION_DEFAULTS.
  { id: "hero_spotlight",      enabled: false, order: 16 },
  { id: "product_features",    enabled: false, order: 17 },
  { id: "story_band",          enabled: false, order: 18 },
];

// Toggle component
const Toggle = ({ enabled, onChange }) => (
  <button type="button" onClick={() => onChange(!enabled)} className="flex items-center">
    {enabled
      ? <MdToggleOn className="text-4xl text-green-600" />
      : <MdToggleOff className="text-4xl text-gray-400" />}
  </button>
);

// Sortable row
const SortableRow = ({ section, onToggle, onConfigChange, flatConfig }) => {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionConfig = getSectionConfigFields(section.id);

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-lg mb-2 bg-white">
      <div className="flex items-center gap-3 p-3">
        {/* drag handle */}
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <MdDragIndicator className="text-2xl" />
        </button>

        {/* label */}
        <span className={`flex-1 font-medium text-sm ${!section.enabled ? "text-gray-400" : "text-gray-700"}`}>
          {SECTION_LABELS[section.id] || section.id}
        </span>

        {/* toggle */}
        <Toggle enabled={section.enabled} onChange={(val) => onToggle(section.id, val)} />

        {/* expand config */}
        {sectionConfig.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            {open ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        )}
      </div>

      {open && sectionConfig.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionConfig.map((field) => (
            <ConfigField
              key={field.key}
              field={field}
              value={flatConfig[field.key] ?? field.default ?? ""}
              onChange={(val) => onConfigChange(field.key, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ConfigField = ({ field, value, onChange }) => {
  if (field.type === "toggle") {
    return (
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-600">{field.label}</label>
        <Toggle enabled={!!value} onChange={onChange} />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
          min={field.min ?? 0}
          max={field.max}
        />
      </div>
    );
  }
  // text
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
        placeholder={field.placeholder || ""}
      />
    </div>
  );
};

function getSectionConfigFields(sectionId) {
  const LIMIT_OPTIONS = [
    { value: 4, label: "4" },
    { value: 8, label: "8" },
    { value: 12, label: "12" },
  ];

  switch (sectionId) {
    case "trust_strip":
      return [
        { key: "trust_strip_source", label: "Source", type: "select", options: [
          { value: "trust_point", label: "Trust Points module" },
          { value: "static_4", label: "Static 4 icons" },
        ]},
      ];
    case "feature_categories":
      return [
        { key: "feature_categories_title", label: "Section Title", type: "text", placeholder: "ফিচারড ক্যাটাগরি" },
        { key: "feature_categories_limit", label: "Max tiles", type: "number", min: 2, max: 12, default: 6 },
      ];
    case "flash_sale":
      return [
        { key: "flash_sale_title", label: "Section Title", type: "text" },
        { key: "flash_sale_limit", label: "Product limit", type: "number", min: 4, max: 16, default: 8 },
      ];
    case "bestsellers":
      return [
        { key: "bestsellers_title", label: "Section Title", type: "text" },
        { key: "bestsellers_limit", label: "Product limit", type: "number", min: 4, max: 16, default: 8 },
      ];
    case "offers_block":
      return [
        { key: "offers_block_title", label: "Section Title", type: "text" },
        { key: "offers_block_limit", label: "Max offers shown", type: "number", min: 1, max: 6, default: 3 },
        { key: "offers_block_layout", label: "Layout", type: "select", options: [
          { value: "grid", label: "Grid" },
          { value: "carousel", label: "Carousel" },
        ]},
      ];
    case "new_arrivals":
      return [
        { key: "new_arrivals_title", label: "Section Title", type: "text" },
        { key: "new_arrivals_limit", label: "Product limit", type: "number", min: 4, max: 16, default: 8 },
      ];
    case "brand_story":
      return [
        { key: "brand_story_title", label: "Section Title", type: "text" },
        { key: "brand_story_text", label: "Body text", type: "text", placeholder: "2-3 sentence brand story..." },
        { key: "brand_story_cta_label", label: "CTA Button Label", type: "text" },
        { key: "brand_story_cta_url", label: "CTA URL", type: "text" },
      ];
    case "reviews_carousel":
      return [
        { key: "reviews_carousel_title", label: "Section Title", type: "text" },
        { key: "reviews_carousel_limit", label: "Max reviews", type: "number", min: 2, max: 10, default: 5 },
        { key: "reviews_carousel_source", label: "Source", type: "select", options: [
          { value: "auto_featured", label: "Auto (recent 5-star with photo)" },
          { value: "manual_pick", label: "Manual pick (IDs)" },
        ]},
      ];
    case "trending_products":
      return [
        { key: "trending_products_title", label: "Section Title", type: "text" },
        { key: "trending_products_limit", label: "Product limit", type: "number", min: 4, max: 16, default: 8 },
      ];
    case "just_for_you":
      return [
        { key: "just_for_you_title", label: "Section Title", type: "text" },
        { key: "just_for_you_limit", label: "Product limit", type: "number", min: 4, max: 16, default: 8 },
      ];
    case "ecommerce_choice":
      return [
        { key: "ecommerce_choice_title", label: "Section Title", type: "text" },
        { key: "ecommerce_choice_limit", label: "Product limit", type: "number", min: 4, max: 16, default: 8 },
      ];
    case "category_wise_strip":
      return [
        { key: "category_wise_strip_title", label: "Section Title", type: "text" },
        { key: "category_wise_strip_limit", label: "Product limit", type: "number", min: 2, max: 12, default: 4 },
        { key: "category_wise_strip_category_id", label: "Category ID", type: "text", placeholder: "Paste category ObjectId" },
      ];
    case "promo_banner":
      return [
        { key: "promo_banner_url", label: "Click URL", type: "text", placeholder: "/shop" },
        { key: "promo_banner_text_overlay", label: "Text Overlay", type: "text" },
      ];
    case "site_faq":
      return [
        { key: "site_faq_title", label: "Section Title", type: "text" },
      ];
    case "newsletter":
      return [
        { key: "newsletter_title", label: "Section Title", type: "text" },
        { key: "newsletter_collect", label: "Collect", type: "select", options: [
          { value: "both", label: "Email + Phone" },
          { value: "email", label: "Email only" },
          { value: "phone", label: "Phone only" },
        ]},
      ];
    default:
      return [];
  }
}

const HomeLayoutTab = ({ refetch, getInitialCurrencyData }) => {
  const [sections, setSections] = useState([]);
  const [flatConfig, setFlatConfig] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // const [topbarOpen, setTopbarOpen] = useState(false); // Topbar card hidden — see below
  const [navOpen, setNavOpen] = useState(false);
  const [heroOpen, setHeroOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!getInitialCurrencyData) return;
    const raw = getInitialCurrencyData?.home_section_array;
    const arr = Array.isArray(raw) && raw.length > 0 ? [...raw].sort((a, b) => a.order - b.order) : L9_DEFAULTS;
    setSections(arr);
    setFlatConfig(getInitialCurrencyData);
    setIsDirty(false);
  }, [getInitialCurrencyData]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, order: i + 1 }));
      setIsDirty(true);
      return reordered;
    });
  };

  const handleToggle = (id, val) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: val } : s));
    setIsDirty(true);
  };

  const handleConfigChange = (key, val) => {
    setFlatConfig((prev) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  };

  const handleFlatChange = (key, val) => {
    setFlatConfig((prev) => ({ ...prev, [key]: val }));
    setIsDirty(true);
  };

  const handleReset = () => {
    const raw = getInitialCurrencyData?.home_section_array;
    const arr = Array.isArray(raw) && raw.length > 0 ? [...raw].sort((a, b) => a.order - b.order) : L9_DEFAULTS;
    setSections(arr);
    setFlatConfig(getInitialCurrencyData);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...flatConfig,
        home_section_array: sections,
        _id: getInitialCurrencyData?._id,
      };
      // remove fields not part of home_layout
      delete payload.createdAt;
      delete payload.updatedAt;

      const res = await fetch(`${BASE_URL}/setting/home_layout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Home layout saved!");
      setIsDirty(false);
      refetch();
    } catch {
      toast.error("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const FlatToggle = ({ fieldKey, label }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-600">{label}</span>
      <Toggle enabled={!!flatConfig[fieldKey]} onChange={(v) => handleFlatChange(fieldKey, v)} />
    </div>
  );

  const FlatText = ({ fieldKey, label, placeholder }) => (
    <div className="py-2">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={flatConfig[fieldKey] ?? ""}
        onChange={(e) => handleFlatChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
      />
    </div>
  );

  const FlatSelect = ({ fieldKey, label, options }) => (
    <div className="py-2">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={flatConfig[fieldKey] ?? ""}
        onChange={(e) => handleFlatChange(fieldKey, e.target.value)}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const SectionCard = ({ title, open, setOpen, children }) => (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        {title}
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header + actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Home Layout Builder</h2>
          <p className="text-sm text-gray-500 mt-1">Drag sections to reorder. Toggle to show/hide. Click ▸ to configure each section.</p>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              <FiRotateCcw size={14} /> Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium text-white transition ${
              isDirty ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? <MiniSpinner /> : <FiSave size={14} />}
            {saving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          You have unsaved changes.
        </div>
      )}

      {/* ── Topbar Settings — HIDDEN, nothing reads these ──────────────────
          All four fields save to the settings doc and the tab says "Saved",
          but the storefront never reads any of them (grep: 0 hits each). The
          only component that used them, TopNavbar, is commented out of
          (frontend)/layout.js. The bar that actually renders in that slot is
          <AnnouncementBar>, driven by `announcement_bar` — edit it on the
          Announcement Bar tab.

          Hidden rather than deleted: re-mounting TopNavbar would bring them
          back. If that never happens, delete these fields and this block.

      <SectionCard title="Topbar" open={topbarOpen} setOpen={setTopbarOpen}>
        <FlatToggle fieldKey="topbar_show" label="Show topbar" />
        <FlatText fieldKey="topbar_announcement_text" label="Announcement text" placeholder="Free delivery on orders above ৳500" />
        <FlatToggle fieldKey="topbar_show_track_order" label="Show Track Order link" />
        <FlatToggle fieldKey="topbar_show_hotline" label="Show Hotline number" />
      </SectionCard>
      ─────────────────────────────────────────────────────────────────────── */}

      {/* ── Navbar Settings ── */}
      <SectionCard title="Navbar" open={navOpen} setOpen={setNavOpen}>
        <FlatSelect fieldKey="nav_category_mode" label="Category nav mode" options={[
          { value: "auto", label: "Auto (simple ≤10 cats, mega >10)" },
          { value: "simple", label: "Simple dropdown" },
          { value: "mega", label: "Mega menu" },
          { value: "hamburger", label: "Hamburger drawer" },
        ]} />
        <FlatToggle fieldKey="nav_show_search_sticky" label="Sticky search bar on scroll" />
        <FlatToggle fieldKey="nav_show_wishlist_icon" label="Show Wishlist icon" />
        <FlatToggle fieldKey="nav_show_compare_icon" label="Show Compare icon" />
        <FlatText fieldKey="nav_extra_links_json" label='Extra nav links (JSON, max 4) e.g. [{"label":"Sale","url":"/shop?sale=1"}]' placeholder='[{"label":"Bestsellers","url":"/shop?sort=popular"}]' />
      </SectionCard>

      {/* ── Hero Settings ── */}
      <SectionCard title="Hero Section" open={heroOpen} setOpen={setHeroOpen}>
        <FlatToggle fieldKey="hero_show" label="Show hero section" />
        <FlatSelect fieldKey="hero_variant" label="Hero variant" options={[
          { value: "carousel", label: "Carousel (current)" },
          { value: "single", label: "Single banner" },
          { value: "split", label: "Split (slider + 2 side banners)" },
        ]} />
        <div className="py-2">
          <label className="block text-xs text-gray-500 mb-1">Autoplay seconds (0 = disabled)</label>
          <input
            type="number"
            value={flatConfig.hero_autoplay_seconds ?? 5}
            onChange={(e) => handleFlatChange("hero_autoplay_seconds", Number(e.target.value))}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
            min={0}
            max={30}
          />
        </div>
        <FlatToggle fieldKey="hero_show_arrows" label="Show navigation arrows" />
      </SectionCard>

      {/* ── Body Section Order ── */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Body Sections — drag to reorder</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableRow
                key={section.id}
                section={section}
                onToggle={handleToggle}
                onConfigChange={handleConfigChange}
                flatConfig={flatConfig}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* ── Footer Settings ── */}
      <SectionCard title="Footer" open={footerOpen} setOpen={setFooterOpen}>
        <FlatToggle fieldKey="footer_show_payment_strip" label="Show payment methods strip" />
        <FlatText fieldKey="footer_payment_methods" label='Payment methods (JSON key array) e.g. ["bkash","nagad","visa","mastercard"]' placeholder='["bkash","nagad","visa"]' />
        <FlatToggle fieldKey="footer_show_delivery_strip" label="Show delivery partners strip" />
        <FlatText fieldKey="footer_delivery_partners" label='Delivery partners (JSON key array) e.g. ["pathao","steadfast","redx"]' placeholder='["pathao","steadfast"]' />
        <FlatToggle fieldKey="footer_show_mini_newsletter" label="Show mini newsletter in footer" />
      </SectionCard>

      {/* ── Chat Widgets ── */}
      <SectionCard title="Floating Chat Widgets" open={chatOpen} setOpen={setChatOpen}>
        <p className="text-xs text-gray-400 mb-2">WhatsApp is configured in Storefront Behaviour tab.</p>
        <FlatToggle fieldKey="chat_messenger_show" label="Show Messenger button" />
        <FlatText fieldKey="chat_messenger_page_id" label="Facebook Page ID (for m.me link)" placeholder="your_page_id" />
        <FlatToggle fieldKey="chat_livechat_show" label="Show live chat (Tawk.to / Crisp / etc)" />
        <p className="text-xs text-amber-600 mt-1">Live chat embed code is saved in the Secrets tab (site_setting_update permission required).</p>
        <FlatSelect fieldKey="chat_widgets_position" label="Widget stack position" options={[
          { value: "bottom-right", label: "Bottom right" },
          { value: "bottom-left", label: "Bottom left" },
        ]} />
      </SectionCard>
    </div>
  );
};

export default HomeLayoutTab;
