import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { BASE_URL } from "../../../utils/baseURL";
import { toast } from "react-toastify";
import MiniSpinner from "../../../shared/MiniSpinner/MiniSpinner";
import ImageUploader from "../../common/ImageUploader";
import { motion } from "framer-motion";
import {
  FaImage,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaSearch,
  FaTag,
  FaEye,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaWhatsapp,
  FaTiktok,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { MdMessage } from "react-icons/md";

const SoftwareInformation = ({ refetch, getInitialCurrencyData: data }) => {
  const [loading, setLoading] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Branding
      logo: data?.logo || "",
      favicon: data?.favicon || "",

      // Basic Info
      title: data?.title || "",
      contact: data?.contact || "",
      email: data?.email || "",
      address: data?.address || "",
      address_two: data?.address_two || "",
      address_three: data?.address_three || "",

      // Welcome Message
      welcome_message: data?.welcome_message || "",

      // Social Media
      facebook: data?.facebook || "",
      instagram: data?.instagram || "",
      twitter: data?.twitter || "",
      you_tube: data?.you_tube || "",
      watsapp: data?.watsapp || "",
      tik_tok: data?.tik_tok || "",

      // SEO
      seo_title: data?.seo_title || "",
      seo_description: data?.seo_description || "",
      seo_keywords: data?.seo_keywords || "",
    },
  });

  // Watch SEO fields for live preview
  const seoTitle = watch("seo_title");
  const seoDescription = watch("seo_description");
  const siteTitle = watch("title");

  const handleCancel = (section) => {
    setEditingSection(null);
    setLogoPreview(null);
    setFaviconPreview(null);

    if (section === "branding") {
      setValue("logo", data?.logo || "");
      setValue("favicon", data?.favicon || "");
    } else if (section === "basic") {
      setValue("title", data?.title || "");
      setValue("contact", data?.contact || "");
      setValue("email", data?.email || "");
      setValue("address", data?.address || "");
      setValue("address_two", data?.address_two || "");
      setValue("address_three", data?.address_three || "");
    } else if (section === "welcome") {
      setValue("welcome_message", data?.welcome_message || "");
    } else if (section === "social") {
      setValue("facebook", data?.facebook || "");
      setValue("instagram", data?.instagram || "");
      setValue("twitter", data?.twitter || "");
      setValue("you_tube", data?.you_tube || "");
      setValue("watsapp", data?.watsapp || "");
      setValue("tik_tok", data?.tik_tok || "");
    } else if (section === "seo") {
      setValue("seo_title", data?.seo_title || "");
      setValue("seo_description", data?.seo_description || "");
      setValue("seo_keywords", data?.seo_keywords || "");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitForm = async (formData) => {
    setLoading(true);
    try {
      let logo = formData?.logo;
      let favicon = formData?.favicon;

      if (formData?.logo instanceof FileList && formData?.logo?.[0]) {
        const logoUpload = await ImageUploader(formData?.logo?.[0]);
        logo = logoUpload[0];
      }
      if (formData?.favicon instanceof FileList && formData?.favicon?.[0]) {
        const faviconUpload = await ImageUploader(formData?.favicon?.[0]);
        favicon = faviconUpload[0];
      }

      const sendData = {
        _id: data?._id,
        logo: logo || data?.logo,
        favicon: favicon || data?.favicon,
        title: formData?.title || data?.title,
        contact: formData?.contact || data?.contact,
        email: formData?.email || data?.email,
        address: formData?.address || data?.address,
        address_two: formData?.address_two || data?.address_two,
        address_three: formData?.address_three || data?.address_three,
        welcome_message: formData?.welcome_message || data?.welcome_message,
        facebook: formData?.facebook || data?.facebook,
        instagram: formData?.instagram || data?.instagram,
        twitter: formData?.twitter || data?.twitter,
        you_tube: formData?.you_tube || data?.you_tube,
        watsapp: formData?.watsapp || data?.watsapp,
        tik_tok: formData?.tik_tok || data?.tik_tok,
        seo_title: formData?.seo_title || data?.seo_title,
        seo_description: formData?.seo_description || data?.seo_description,
        seo_keywords: formData?.seo_keywords || data?.seo_keywords,
      };

      const response = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });

      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Settings updated successfully");
        refetch();
        setEditingSection(null);
        setLogoPreview(null);
        setFaviconPreview(null);
      } else {
        toast.error(result?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (faviconPreview) URL.revokeObjectURL(faviconPreview);
    };
  }, [logoPreview, faviconPreview]);

  const socialFields = [
    {
      name: "facebook",
      label: "Facebook",
      icon: FaFacebook,
      color: "bg-blue-600",
      placeholder: "https://facebook.com/yourpage",
    },
    {
      name: "instagram",
      label: "Instagram",
      icon: FaInstagram,
      color: "bg-pink-600",
      placeholder: "https://instagram.com/yourpage",
    },
    {
      name: "twitter",
      label: "Twitter",
      icon: FaTwitter,
      color: "bg-sky-500",
      placeholder: "https://twitter.com/yourpage",
    },
    {
      name: "you_tube",
      label: "YouTube",
      icon: FaYoutube,
      color: "bg-red-600",
      placeholder: "https://youtube.com/@yourchannel",
    },
    {
      name: "watsapp",
      label: "WhatsApp",
      icon: FaWhatsapp,
      color: "bg-green-600",
      placeholder: "https://wa.me/yournumber",
    },
    {
      name: "tik_tok",
      label: "TikTok",
      icon: FaTiktok,
      color: "bg-black",
      placeholder: "https://tiktok.com/@yourpage",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit(handleSubmitForm)}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Site Settings</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your site branding, social links, and SEO settings
            </p>
          </div>
        </div>

        {/* Branding Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <FaImage className="text-blue-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">Branding</h3>
            </div>
            {editingSection !== "branding" ? (
              <button
                type="button"
                onClick={() => setEditingSection("branding")}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleCancel("branding")}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <MiniSpinner />
                  ) : (
                    <>
                      <FaSave />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Site Logo
              </label>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-full h-32 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                    {logoPreview || data?.logo ? (
                      <img
                        src={logoPreview || data?.logo}
                        alt="Logo preview"
                        className="max-h-28 max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <FaImage className="mx-auto text-gray-400 text-3xl mb-2" />
                        <span className="text-xs text-gray-400">
                          No logo uploaded
                        </span>
                      </div>
                    )}
                  </div>
                  {editingSection === "branding" && (
                    <>
                      <input
                        {...register("logo")}
                        onChange={(e) => {
                          register("logo").onChange(e);
                          handleLogoChange(e);
                        }}
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                      <p className="text-xs text-gray-400">
                        Recommended: 400×120px, PNG/SVG
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Favicon */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Favicon
              </label>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-full h-32 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                    {faviconPreview || data?.favicon ? (
                      <img
                        src={faviconPreview || data?.favicon}
                        alt="Favicon preview"
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <FaImage className="mx-auto text-gray-400 text-3xl mb-2" />
                        <span className="text-xs text-gray-400">
                          No favicon uploaded
                        </span>
                      </div>
                    )}
                  </div>
                  {editingSection === "branding" && (
                    <>
                      <input
                        {...register("favicon")}
                        onChange={(e) => {
                          register("favicon").onChange(e);
                          handleFaviconChange(e);
                        }}
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                      <p className="text-xs text-gray-400">
                        Recommended: 32×32px or 64×64px, ICO/PNG
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <FaGlobe className="text-blue-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">
                Basic Information
              </h3>
            </div>
            {editingSection !== "basic" ? (
              <button
                type="button"
                onClick={() => setEditingSection("basic")}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleCancel("basic")}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <MiniSpinner />
                  ) : (
                    <>
                      <FaSave />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Title
              </label>
              <input
                {...register("title")}
                type="text"
                disabled={editingSection !== "basic"}
                placeholder="e.g. Leather Wallah"
                className="w-full rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register("contact")}
                  type="text"
                  disabled={editingSection !== "basic"}
                  placeholder="e.g. 09696500122"
                  className="w-full pl-10 rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register("email")}
                  type="email"
                  disabled={editingSection !== "basic"}
                  placeholder="e.g. info@example.com"
                  className="w-full pl-10 rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop 1 Address
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register("address")}
                  type="text"
                  disabled={editingSection !== "basic"}
                  placeholder="Main branch address"
                  className="w-full pl-10 rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop 2 Address
              </label>
              <input
                {...register("address_two")}
                type="text"
                disabled={editingSection !== "basic"}
                placeholder="2nd branch address"
                className="w-full rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop 3 Address
              </label>
              <input
                {...register("address_three")}
                type="text"
                disabled={editingSection !== "basic"}
                placeholder="3rd branch address"
                className="w-full rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Welcome Message Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <MdMessage className="text-blue-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">
                Welcome Message
              </h3>
            </div>
            {editingSection !== "welcome" ? (
              <button
                type="button"
                onClick={() => setEditingSection("welcome")}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleCancel("welcome")}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <MiniSpinner />
                  ) : (
                    <>
                      <FaSave />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <textarea
            {...register("welcome_message")}
            disabled={editingSection !== "welcome"}
            rows={4}
            placeholder="Enter your welcome message..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Social Media Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <FaFacebook className="text-blue-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">
                Social Media Links
              </h3>
            </div>
            {editingSection !== "social" ? (
              <button
                type="button"
                onClick={() => setEditingSection("social")}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleCancel("social")}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <MiniSpinner />
                  ) : (
                    <>
                      <FaSave />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 ${field.color} rounded-lg flex items-center justify-center text-white`}
                    >
                      <Icon size={14} />
                    </div>
                    <input
                      {...register(field.name)}
                      type="url"
                      disabled={editingSection !== "social"}
                      placeholder={field.placeholder}
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEO Settings Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 relative">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <FaSearch className="text-blue-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">
                SEO Settings
              </h3>
            </div>
            {editingSection !== "seo" ? (
              <button
                type="button"
                onClick={() => setEditingSection("seo")}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleCancel("seo")}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <MiniSpinner />
                  ) : (
                    <>
                      <FaSave />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Control how your site appears in Google search results
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (50-60 characters recommended)
                </span>
              </label>
              <div className="relative">
                <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register("seo_title")}
                  type="text"
                  disabled={editingSection !== "seo"}
                  placeholder="e.g. Leather Wallah – Premium Genuine Leather Footwear"
                  className="w-full pl-10 rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-xs text-gray-400">
                  {seoTitle?.length || 0} characters
                </span>
                {seoTitle?.length > 60 && (
                  <span className="text-xs text-yellow-600">
                    Title is too long
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Description
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (150-160 characters recommended)
                </span>
              </label>
              <textarea
                {...register("seo_description")}
                rows={3}
                disabled={editingSection !== "seo"}
                placeholder="e.g. Bangladesh's best genuine leather footwear — Oxfords, loafers, sneakers & boots. High quality, affordable price. Cash on delivery nationwide."
                className="w-full rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              />
              <div className="mt-1 flex justify-between">
                <span className="text-xs text-gray-400">
                  {seoDescription?.length || 0} characters
                </span>
                {seoDescription?.length > 160 && (
                  <span className="text-xs text-yellow-600">
                    Description is too long
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Keywords
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (comma-separated)
                </span>
              </label>
              <input
                {...register("seo_keywords")}
                type="text"
                disabled={editingSection !== "seo"}
                placeholder="e.g. leather shoes, genuine leather footwear, leather boots bangladesh"
                className="w-full rounded-lg border-gray-200 shadow-sm text-sm p-2.5 border focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Live Google Preview */}
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-3">
                <FaEye className="text-gray-500" />
                <p className="text-sm font-medium text-gray-700">
                  Google Search Preview
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-blue-600 text-lg font-medium hover:underline cursor-pointer line-clamp-1">
                  {seoTitle ||
                    siteTitle ||
                    "Leather Wallah – Premium Products"}
                </p>
                <p className="text-green-700 text-sm mt-0.5">
                  https://www.leatherwallah.com
                </p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {seoDescription ||
                    "Your site description will appear here. Update the SEO description field to change this text."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default SoftwareInformation;
