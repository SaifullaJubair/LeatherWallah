import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaSave, FaImage, FaUndo } from "react-icons/fa";
import { BASE_URL } from "../../utils/baseURL";
import ColorAutoPreview from "./ColorAutoPreview";
import { PALETTE_PRESETS } from "./palettePresets";
import ThemeFloatingManager from "./ThemeFloatingManager";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { buildThemePreviewUrl } from "../../utils/frontendUrl";

const FONT_OPTIONS = [
  // Bangla-first
  { key: "hind-siliguri", label: "Hind Siliguri (Bangla)" },
  { key: "tiro-bangla", label: "Tiro Bangla (Bangla)" },
  { key: "noto-sans-bengali", label: "Noto Sans Bengali (Bangla)" },
  { key: "baloo-da-2", label: "Baloo Da 2 (rounded)" },
  { key: "mina", label: "Mina (Bangla)" },
  // Latin-first (Bangla auto-falls back to Hind Siliguri)
  { key: "poppins", label: "Poppins (English)" },
  { key: "inter", label: "Inter (English)" },
  { key: "montserrat", label: "Montserrat (English)" },
  { key: "roboto", label: "Roboto (English)" },
];

const slugify = (s = "") =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const ThemeForm = ({ initial = null, mode = "create" }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  // CREATE-mode buffered floating images — uploaded after the theme is created
  // (AB-3). Each entry: { localId, file, meta }.
  const [pendingFloats, setPendingFloats] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      theme_name: initial?.theme_name || "",
      theme_slug: initial?.theme_slug || "",
      theme_for: initial?.theme_for || "",
      status: initial?.status || "draft",
      colors: {
        primary: initial?.colors?.primary || "#10B981",
        page_bg: initial?.colors?.page_bg || "#FAFAFA",
        accent: initial?.colors?.accent || "#F59E0B",
      },
      typography: {
        heading_font:
          initial?.typography?.heading_font ||
          initial?.typography?.font_key ||
          "hind-siliguri",
        body_font:
          initial?.typography?.body_font ||
          initial?.typography?.font_key ||
          "hind-siliguri",
        heading_weight: initial?.typography?.heading_weight || "700",
      },
      button_style: {
        border_radius: initial?.button_style?.border_radius || "8px",
      },
    },
  });

  const watchedName = watch("theme_name");
  const watchedSlug = watch("theme_slug");
  const watchedColors = watch("colors");
  const watchedHeadingFont = watch("typography.heading_font");
  const watchedBodyFont = watch("typography.body_font");
  const watchedHeadingWeight = watch("typography.heading_weight");
  const watchedButtonRadius = watch("button_style.border_radius");

  // Build the live-preview iframe URL from current form values. Debounced so we
  // don't reload the iframe on every keystroke / color drag.
  const buildPreviewUrl = () => {
    const q = new URLSearchParams({
      primary: watchedColors?.primary || "",
      page_bg: watchedColors?.page_bg || "",
      accent: watchedColors?.accent || "",
      heading_font: watchedHeadingFont || "",
      body_font: watchedBodyFont || "",
      heading_weight: watchedHeadingWeight || "",
      button_radius: watchedButtonRadius || "",
    });
    return buildThemePreviewUrl(q); // null when storefront URL not configured
  };
  const [previewUrl, setPreviewUrl] = useState(buildPreviewUrl());
  useEffect(() => {
    const id = setTimeout(() => setPreviewUrl(buildPreviewUrl()), 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedColors?.primary,
    watchedColors?.page_bg,
    watchedColors?.accent,
    watchedHeadingFont,
    watchedBodyFont,
    watchedHeadingWeight,
    watchedButtonRadius,
  ]);

  // Apply a curated palette's 3 base colors into the form.
  const applyPalette = (p) => {
    setValue("colors.primary", p.primary, { shouldDirty: true });
    setValue("colors.page_bg", p.page_bg, { shouldDirty: true });
    setValue("colors.accent", p.accent, { shouldDirty: true });
  };

  // Auto-suggest slug from name when admin hasn't edited slug manually
  useEffect(() => {
    if (mode !== "create") return;
    if (!watchedName) return;
    if (!watchedSlug || watchedSlug === slugify(watchedName).slice(0, watchedSlug.length)) {
      setValue("theme_slug", slugify(watchedName));
    }
  }, [watchedName, mode, setValue, watchedSlug]);

  const onSubmit = async (form) => {
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("theme_name", form.theme_name);
      payload.append("theme_slug", form.theme_slug);
      payload.append("theme_for", form.theme_for);
      payload.append("status", form.status);
      payload.append("colors", JSON.stringify(form.colors));
      payload.append("typography", JSON.stringify(form.typography));
      payload.append("button_style", JSON.stringify(form.button_style));
      if (thumbnailFile) {
        payload.append("thumbnail_preview", thumbnailFile);
      }

      const url =
        mode === "create" ? `${BASE_URL}/theme` : `${BASE_URL}/theme/${initial._id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        credentials: "include",
        body: payload,
      });
      const data = await res.json();

      if (!data?.success) {
        toast.error(data?.message || "Save failed");
        setSubmitting(false);
        return;
      }

      // CREATE: upload any buffered floating images now that we have a theme _id.
      if (mode === "create" && pendingFloats.length) {
        const newId = data?.data?._id || data?.data?.id;
        if (newId) {
          let failed = 0;
          for (const pf of pendingFloats) {
            try {
              const fd = new FormData();
              fd.append("asset", pf.file);
              Object.entries(pf.meta || {}).forEach(([k, v]) =>
                fd.append(k, String(v)),
              );
              const fres = await fetch(
                `${BASE_URL}/theme/${newId}/floating-asset`,
                { method: "POST", credentials: "include", body: fd },
              );
              const fdata = await fres.json();
              if (!fdata?.success) failed++;
            } catch {
              failed++;
            }
          }
          if (failed) {
            toast.warn(
              `Theme created, কিন্তু ${failed}টি floating image upload হয়নি — edit করে আবার চেষ্টা করো।`,
            );
          }
        } else {
          toast.warn(
            "Theme created, কিন্তু floating image upload হয়নি (theme id পাওয়া যায়নি) — edit করে যোগ করো।",
          );
        }
      }

      toast.success(mode === "create" ? "Theme created" : "Theme updated");
      navigate("/theme");
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-20">
      <div className="lg:grid lg:grid-cols-[1fr_minmax(360px,42%)] lg:gap-6 lg:items-stretch">
        {/* ── LEFT: the form ── */}
        <div className="space-y-6 min-w-0">
      {/* Section 1 — Basic info */}
      <Section title="1. Basic Info" subtitle="Theme এর নাম, কোন product লাইনের জন্য, status">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Theme Name *" error={errors.theme_name}>
            <input
              type="text"
              {...register("theme_name", { required: "Required" })}
              className="form-input"
              placeholder="e.g. Oxford Burgundy Premium"
            />
          </Field>
          <Field label="Slug *" error={errors.theme_slug}>
            <input
              type="text"
              {...register("theme_slug", { required: "Required" })}
              className="form-input font-mono"
              placeholder="oxford-burgundy-premium"
              disabled={mode === "update"}
            />
          </Field>
          <Field label="Theme For *" error={errors.theme_for}>
            <input
              type="text"
              {...register("theme_for", { required: "Required" })}
              className="form-input"
              placeholder="Shoes / Boots / Wallets / default"
            />
          </Field>
          <Field label="Status">
            <select {...register("status")} className="form-input">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Thumbnail Preview (optional)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="form-input"
            />
            {initial?.thumbnail_preview && !thumbnailFile && (
              <img
                src={initial.thumbnail_preview}
                alt="thumb"
                className="mt-2 w-24 h-24 object-cover rounded border"
              />
            )}
          </Field>
        </div>
      </Section>

      {/* Section 2 — Colors */}
      <Section
        title="2. Colors"
        subtitle="তোমাকে শুধু ৩টা color দিতে হবে — বাকি 5 shade backend নিজে generate করবে।"
      >
        {/* Curated palette presets — one click fills the 3 base colors */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              Suggested Palettes
            </p>
            <button
              type="button"
              onClick={() => applyPalette(PALETTE_PRESETS[0])}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blueColor-600"
              title="Reset to the default green palette"
            >
              <FaUndo size={10} /> Reset to suggested
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PALETTE_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPalette(p)}
                title={p.name}
                className="group flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border border-gray-200 hover:border-blueColor-400 hover:bg-blueColor-50 transition"
              >
                <span className="flex">
                  {[p.primary, p.accent, p.page_bg].map((c, i) => (
                    <span
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-white -ml-1 first:ml-0"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="text-[11px] text-gray-600 group-hover:text-blueColor-700">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Field label="Primary *">
            <div className="flex items-center gap-2">
              <input type="color" {...register("colors.primary")} className="h-10 w-14" />
              <input
                type="text"
                {...register("colors.primary")}
                className="form-input flex-1 font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              বাটন, hero badge, accent bar, heading accent — main brand রং।
            </p>
          </Field>
          <Field label="Page Background *">
            <div className="flex items-center gap-2">
              <input type="color" {...register("colors.page_bg")} className="h-10 w-14" />
              <input
                type="text"
                {...register("colors.page_bg")}
                className="form-input flex-1 font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              পুরো page এর background — হালকা/নিউট্রাল রাখো।
            </p>
          </Field>
          <Field label="Accent *">
            <div className="flex items-center gap-2">
              <input type="color" {...register("colors.accent")} className="h-10 w-14" />
              <input
                type="text"
                {...register("colors.accent")}
                className="form-input flex-1 font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              রেটিং star, ছোট highlight — primary থেকে আলাদা রং।
            </p>
          </Field>
        </div>
        <ColorAutoPreview
          primary={watchedColors.primary}
          page_bg={watchedColors.page_bg}
          accent={watchedColors.accent}
        />
      </Section>

      {/* Section 3 — Theme-level (GLOBAL) floating images */}
      <Section
        title="3. Floating Images (Global)"
        subtitle="এই theme যেসব product ব্যবহার করবে সবাই এই floating image পাবে। প্রতিটি product চাইলে নিজের Page Content → Floating tab থেকে hide / replace / extra যোগ করতে পারবে।"
      >
        {mode === "create" ? (
          <ThemeFloatingManager
            onPendingChange={setPendingFloats}
          />
        ) : (
          <ThemeFloatingManager
            themeId={initial?._id}
            initialAssets={initial?.floating_assets}
          />
        )}
      </Section>

      {/* Section 4 — Typography & buttons */}
      <Section title="4. Typography & Roundness">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Heading Font">
            <select {...register("typography.heading_font")} className="form-input">
              {FONT_OPTIONS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">সব title/heading এর font।</p>
          </Field>
          <Field label="Body Font">
            <select {...register("typography.body_font")} className="form-input">
              {FONT_OPTIONS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">সব লেখা/details এর font।</p>
          </Field>
          <Field label="Heading Weight">
            <select {...register("typography.heading_weight")} className="form-input">
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
            </select>
          </Field>
          <Field label="Corner Roundness">
            <select {...register("button_style.border_radius")} className="form-input">
              <option value="0px">Sharp (0px)</option>
              <option value="8px">Default (8px)</option>
              <option value="16px">Rounded (16px)</option>
              <option value="24px">Extra Rounded (24px)</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              বাটন, card, badge, image — পুরো page এর কোণার rounding।
            </p>
          </Field>
        </div>
      </Section>

        </div>
        {/* ── End LEFT form column ── */}

        {/* ── RIGHT: sticky live preview iframe ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                Live Preview
              </p>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blueColor-600"
                >
                  <FaImage size={11} /> Full screen
                </a>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              {previewUrl ? (
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  title="Theme live preview"
                  className="w-full"
                  style={{ height: "calc(100vh - 7rem)", border: 0 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center p-6 bg-yellow-50 text-center"
                  style={{ height: "calc(100vh - 7rem)" }}
                >
                  <p className="text-sm text-yellow-700">
                    Preview unavailable — set{" "}
                    <code className="bg-yellow-100 px-1 rounded">
                      VITE_FRONTEND_URL
                    </code>{" "}
                    in the admin environment and rebuild.
                  </p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              রং/font বদলালে ~১ সেকেন্ড পর preview আপডেট হবে (dummy product দিয়ে)।
            </p>
          </div>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg px-4 py-3 flex items-center justify-end gap-3">
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="lg:hidden inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
          >
            <FaImage size={12} /> Preview
          </a>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 bg-blueColor-600 text-white rounded hover:bg-blueColor-700 disabled:opacity-60 text-sm font-semibold"
        >
          {submitting ? <MiniSpinner /> : <FaSave />}{" "}
          {mode === "create" ? "Create Theme" : "Update Theme"}
        </button>
      </div>
    </form>
  );
};

const Section = ({ title, subtitle, children }) => (
  <section className="bg-white rounded-lg border border-gray-200 p-5">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
  </div>
);

export default ThemeForm;
