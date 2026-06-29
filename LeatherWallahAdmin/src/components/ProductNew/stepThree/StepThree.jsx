import { useState, useRef, useContext } from "react";
import { useForm } from "react-hook-form";
import "react-quill-new/dist/quill.snow.css";
import ReactQuill from "react-quill-new";
import { MdCancel } from "react-icons/md";
import { RiImageAddLine, RiVideoAddLine } from "react-icons/ri";
import { PiImagesThin } from "react-icons/pi";
import { toast } from "react-toastify";
import Select from "react-select";
import { BASE_URL } from "../../../utils/baseURL";
import { AuthContext } from "../../../context/AuthProvider";
import { LoaderOverlay } from "../../common/loader/LoderOverley";
import { useQuery } from "@tanstack/react-query";
import MiniSpinner from "../../../shared/MiniSpinner/MiniSpinner";
import { useNavigate } from "react-router-dom";

// Phase F+H — array/object fields the BE expects as JSON.parse'able strings.
// The default `Object.entries(stepOneData)` loop below skips raw arrays/objects
// (would stringify to "[object Object]") so each gets an explicit appender.
// A2c adds custom_fields + bundle_items here.
const PHASE_FH_JSON_FIELDS = [
  "product_dimensions",
  "tier_prices",
  "group_prices",
  "custom_fields",
  "bundle_items",
];
const appendPhaseFHJsonFields = (formData, stepOneData) => {
  PHASE_FH_JSON_FIELDS.forEach((k) => {
    const v = stepOneData?.[k];
    if (v === undefined || v === null) return;
    // Skip empty arrays / empty objects to keep the request small.
    if (Array.isArray(v) && v.length === 0) return;
    if (!Array.isArray(v) && typeof v === "object" && Object.keys(v).length === 0)
      return;
    formData.append(k, JSON.stringify(v));
  });
};

const StepThree = ({
  setCurrentStep,
  stepThreeData,
  stepOneData,
}) => {
  const { user, loading } = useContext(AuthContext);
  const [saveAndPublish, setSaveAndPublish] = useState(true);
  const [product_supplier_id, setProduct_supplier_id] = useState();
  const [buttonLoading, setLoading] = useState(false);

  // const { data: suppliers = [], isLoading: supplierLoading } = useQuery({
  //   queryKey: [`/api/v1/supplier`],
  //   queryFn: async () => {
  //     const res = await fetch(`${BASE_URL}/supplier`, {
  //       credentials: "include",
  //     });
  //     const data = await res.json();
  //     return data;
  //   },
  // }); // get all category for select

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const [description, setDescription] = useState(stepThreeData?.description);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const sizechartInputRef = useRef(null);
  const [imagePreviews, setImagePreviews] = useState(
    stepThreeData?.other_images || []
  );
  const [thumbnailPreview, setThumbnailPreview] = useState(
    stepThreeData?.main_image
  );
  const [sizeChartPreview, setSizeChartPreview] = useState(
    stepThreeData?.size_chart
  );
  const [thumbnailVideoPreview, setThumbnailVideoPreview] = useState(
    stepThreeData?.main_video
  );

  const [trending_product, settrendingProduct] = useState(true);

  const watchImages = watch("other_images");
  const navigate = useNavigate();

  const handleSizeChartChange = (e) => {
    const file = e.target.files?.[0]; // Safe check for file existence
    if (file) {
      setSizeChartPreview(URL.createObjectURL(file));
      setValue("size_chart", file); // Update React Hook Form value
    }
  };

  const removeSizeChart = () => {
    setSizeChartPreview(null);
    setValue("size_chart", null); // Reset React Hook Form value
    if (sizechartInputRef.current) {
      sizechartInputRef.current.value = ""; // Reset input field
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0]; // Safe check for file existence
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
      setValue("main_image", file); // Update React Hook Form value
    }
  };

  const removeThumbnail = () => {
    setThumbnailPreview(null);
    setValue("main_image", null); // Reset React Hook Form value
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ""; // Reset input field
    }
  };

  const handleThumbnailVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailVideoPreview(URL.createObjectURL(file));
      setValue("main_video", file); // Update React Hook Form value
    }
  };

  const removeThumbnailVideo = () => {
    setThumbnailVideoPreview(null);
    setValue("main_video", null); // Reset React Hook Form value
    if (videoInputRef.current) {
      videoInputRef.current.value = ""; // Reset file input
    }
  };

  // Handle file input change to show image preview
  const handleImageChange = (event) => {
    const files = event.target.files;
    if (files.length) {
      const previews = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviews([...imagePreviews, ...previews]);

      const currentFiles = watchImages ? Array.from(watchImages) : [];
      setValue("other_images", [...currentFiles, ...files]);
      event.target.value = null;
    }
  };

  // Remove selected image preview
  const removeImage = (index) => {
    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1); // Remove the image preview

    setImagePreviews(updatedPreviews);

    const updatedFiles = Array.from(watchImages);
    updatedFiles.splice(index, 1); // Remove the file itself
    setValue("other_images", updatedFiles.length ? updatedFiles : null); // Update the input field or reset
  };

  //   set keyword
  const [keywords, setKeywords] = useState(stepThreeData?.keywords || []);
  const [inputKeyword, setInputKeyword] = useState("");

  //   add keyword
  const handleKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newKeyword = inputKeyword.trim();
      if (newKeyword !== "") {
        setKeywords([...keywords, { keyword: newKeyword }]);
        setInputKeyword(""); // Clear the input field
      }
    }
  };
  // remove keyword
  const removeKeyword = (keywordToRemove) => {
    const updatedKeywords = keywords.filter(
      (keyword) => keyword?.keyword !== keywordToRemove
    );
    setKeywords(updatedKeywords);
  };
  //handle keyword
  const handleKeywordChange = (e) => {
    setInputKeyword(e.target.value);
  };

  const handleDataPost = async (data) => {
    setLoading(true);
    if (saveAndPublish == true) {
      if (!thumbnailVideoPreview && !thumbnailPreview) {
        toast.error("Main image or video is required", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }

      if (!description) {
        toast.error("Description is required", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("product_status", "active");
      formData.append("product_publisher_id", user?._id);

      Object.entries(data).forEach(([key, value]) => {
        if (
          key === "main_image" ||
          key === "other_images" ||
          key === "main_video" ||
          key === "size_chart"
        ) {
          // Skip appending for main_image and other_images
          return; // Using `return` in `forEach` acts like `continue` in traditional loops
        }

        // Append other data normally
        formData.append(key, value);
      });

      // Separate logic for handling "main_image" and "other_images" if needed
      if (data?.main_image) {
        formData.append("main_image", data?.main_image);
      }
      if (data?.main_video) {
        formData.append("main_video", data?.main_video);
      }
      if (data?.size_chart) {
        formData.append("size_chart", data?.size_chart);
      }

      // if (product_supplier_id) {
      //   formData.append("product_supplier_id", product_supplier_id);
      // }

      if (data?.other_images && data?.other_images.length > 0) {
        data.other_images.forEach((file, index) => {
          formData.append(`other_images[${index}]`, file);
        });
      }
      formData.append("meta_keywords", JSON.stringify(keywords));
      formData.append("description", description);
      // (legacy `specifications` formData append removed — specification
      // module retired in Phase 0; attribute payload now ships via
      // product_attributes + variant_axes set from StepOne.)

      Object.entries(stepOneData).forEach(([key, value]) => {
        if (key === "variation_details" && Array.isArray(value)) {
          value.forEach((product, index) => {
            // Legacy fields (kept additive — cart/order still read these).
            formData.append(
              `variation_details[${index}][variation_name]`,
              product.variation_name
            );
            formData.append(
              `variation_details[${index}][variation_price]`,
              product.variation_price
            );
            formData.append(
              `variation_details[${index}][variation_discount_price]`,
              product.variation_discount_price
            );
            formData.append(
              `variation_details[${index}][variation_quantity]`,
              product.variation_quantity
            );
            formData.append(
              `variation_details[${index}][variation_buying_price]`,
              product.variation_buying_price
            );
            formData.append(
              `variation_details[${index}][variation_alert_quantity]`,
              product.variation_alert_quantity
            );
            // Phase-1 new shape:
            formData.append(
              `variation_details[${index}][variation_price_delta]`,
              product.variation_price_delta ?? 0
            );
            formData.append(
              `variation_details[${index}][is_active]`,
              product.is_active !== false
            );
            (product.combination || []).forEach((valueId, ci) => {
              formData.append(
                `variation_details[${index}][combination][${ci}]`,
                valueId
              );
            });

            if (product.variation_image) {
              formData.append(
                `variation_details[${index}][variation_image]`,
                product.variation_image
              );
            }
            if (product.variation_video) {
              formData.append(
                `variation_details[${index}][variation_video]`,
                product.variation_video
              );
            }
          });
        } else if (key === "product_attributes" && Array.isArray(value)) {
          // Phase-2 single source of truth (spec table + filter facets).
          value.forEach((pa, i) => {
            formData.append(
              `product_attributes[${i}][attribute_id]`,
              pa.attribute_id
            );
            (pa.value_ids || []).forEach((vid, j) => {
              formData.append(
                `product_attributes[${i}][value_ids][${j}]`,
                vid
              );
            });
          });
        } else if (key === "variant_axes" && Array.isArray(value)) {
          value.forEach((va, i) => {
            formData.append(
              `variant_axes[${i}][attribute_id]`,
              va.attribute_id
            );
            formData.append(
              `variant_axes[${i}][is_mandatory]`,
              va.is_mandatory !== false
            );
          });
        } else if (key === "category_path" && Array.isArray(value)) {
          value.forEach((id, i) => {
            formData.append(`category_path[${i}]`, id);
          });
        } else if (Array.isArray(value) || (value && typeof value === "object")) {
          // attributes_details handled separately below; skip raw object append
          // (FormData would stringify objects to "[object Object]").
        } else {
          formData.append(key, value);
        }
      });

      if (stepOneData?.attributes_details?.length > 0) {
        stepOneData?.attributes_details?.forEach((att, index) => {
          // Append the main specification ID
          formData.append(
            `attributes_details[${index}][attribute_name]`,
            att?.attribute_name
          );

          // Append each specification value's ID
          att?.attribute_values.forEach((value, valueIndex) => {
            formData.append(
              `attributes_details[${index}][attribute_values][${valueIndex}][attribute_value_name]`,
              value?.attribute_value_name
            );
            formData.append(
              `attributes_details[${index}][attribute_values][${valueIndex}][attribute_value_code]`,
              value?.attribute_value_code
            );
          });
        });
      }

      // Phase F+H — arrays/objects (skipped by default loop) packed as JSON strings.
      appendPhaseFHJsonFields(formData, stepOneData);

      formData.append("trending_product", trending_product);

      // Remove keys with undefined values
      for (const [key, value] of formData.entries()) {
        if (
          value === "undefined" ||
          value === undefined ||
          value === null ||
          value === "" ||
          value === "null"
        ) {
          formData.delete(key);
        }
      }

      // console.log(Object.fromEntries(formData.entries()));
      // setLoading(false);
      // return;

      const response = await fetch(`${BASE_URL}/product`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Product created successfully",
          {
            autoClose: 1000,
          }
        );
        setLoading(false);
        navigate("/product/product-list");
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } else {
      if (!thumbnailVideoPreview && !thumbnailPreview) {
        toast.error("Main image or video is required", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }

      if (!description) {
        toast.error("Description is required", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("product_status", "in-active");
      formData.append("product_publisher_id", user?._id);

      Object.entries(data).forEach(([key, value]) => {
        if (
          key === "main_image" ||
          key === "other_images" ||
          key === "main_video" ||
          key === "size_chart"
        ) {
          // Skip appending for main_image and other_images
          return; // Using `return` in `forEach` acts like `continue` in traditional loops
        }

        // Append other data normally
        formData.append(key, value);
      });

      // Separate logic for handling "main_image" and "other_images" if needed
      if (data?.main_image) {
        formData.append("main_image", data?.main_image);
      }
      if (data?.main_video) {
        formData.append("main_video", data?.main_video);
      }
      if (data?.size_chart) {
        formData.append("size_chart", data?.size_chart);
      }

      // if (product_supplier_id) {
      //   formData.append("product_supplier_id", product_supplier_id);
      // }

      if (data?.other_images && data?.other_images.length > 0) {
        data.other_images.forEach((file, index) => {
          formData.append(`other_images[${index}]`, file);
        });
      }
      formData.append("meta_keywords", JSON.stringify(keywords));
      formData.append("description", description);
      // (legacy `specifications` formData append removed — specification
      // module retired in Phase 0; attribute payload now ships via
      // product_attributes + variant_axes set from StepOne.)

      Object.entries(stepOneData).forEach(([key, value]) => {
        if (key === "variation_details" && Array.isArray(value)) {
          value.forEach((product, index) => {
            // Legacy fields (kept additive — cart/order still read these).
            formData.append(
              `variation_details[${index}][variation_name]`,
              product.variation_name
            );
            formData.append(
              `variation_details[${index}][variation_price]`,
              product.variation_price
            );
            formData.append(
              `variation_details[${index}][variation_discount_price]`,
              product.variation_discount_price
            );
            formData.append(
              `variation_details[${index}][variation_quantity]`,
              product.variation_quantity
            );
            formData.append(
              `variation_details[${index}][variation_buying_price]`,
              product.variation_buying_price
            );
            formData.append(
              `variation_details[${index}][variation_alert_quantity]`,
              product.variation_alert_quantity
            );
            // Phase-1 new shape:
            formData.append(
              `variation_details[${index}][variation_price_delta]`,
              product.variation_price_delta ?? 0
            );
            formData.append(
              `variation_details[${index}][is_active]`,
              product.is_active !== false
            );
            (product.combination || []).forEach((valueId, ci) => {
              formData.append(
                `variation_details[${index}][combination][${ci}]`,
                valueId
              );
            });

            if (product.variation_image) {
              formData.append(
                `variation_details[${index}][variation_image]`,
                product.variation_image
              );
            }
            if (product.variation_video) {
              formData.append(
                `variation_details[${index}][variation_video]`,
                product.variation_video
              );
            }
          });
        } else if (key === "product_attributes" && Array.isArray(value)) {
          // Phase-2 single source of truth (spec table + filter facets).
          value.forEach((pa, i) => {
            formData.append(
              `product_attributes[${i}][attribute_id]`,
              pa.attribute_id
            );
            (pa.value_ids || []).forEach((vid, j) => {
              formData.append(
                `product_attributes[${i}][value_ids][${j}]`,
                vid
              );
            });
          });
        } else if (key === "variant_axes" && Array.isArray(value)) {
          value.forEach((va, i) => {
            formData.append(
              `variant_axes[${i}][attribute_id]`,
              va.attribute_id
            );
            formData.append(
              `variant_axes[${i}][is_mandatory]`,
              va.is_mandatory !== false
            );
          });
        } else if (key === "category_path" && Array.isArray(value)) {
          value.forEach((id, i) => {
            formData.append(`category_path[${i}]`, id);
          });
        } else if (Array.isArray(value) || (value && typeof value === "object")) {
          // attributes_details handled separately below; skip raw object append
          // (FormData would stringify objects to "[object Object]").
        } else {
          formData.append(key, value);
        }
      });

      if (stepOneData?.attributes_details?.length > 0) {
        stepOneData?.attributes_details?.forEach((att, index) => {
          // Append the main specification ID
          formData.append(
            `attributes_details[${index}][attribute_name]`,
            att?.attribute_name
          );

          // Append each specification value's ID
          att?.attribute_values.forEach((value, valueIndex) => {
            formData.append(
              `attributes_details[${index}][attribute_values][${valueIndex}][attribute_value_name]`,
              value?.attribute_value_name
            );
            formData.append(
              `attributes_details[${index}][attribute_values][${valueIndex}][attribute_value_code]`,
              value?.attribute_value_code
            );
          });
        });
      }

      // Phase F+H — arrays/objects (skipped by default loop) packed as JSON strings.
      appendPhaseFHJsonFields(formData, stepOneData);

      formData.append("trending_product", trending_product);

      // Remove keys with undefined values
      for (const [key, value] of formData.entries()) {
        if (
          value === "undefined" ||
          value === undefined ||
          value === null ||
          value === "" ||
          value === "null"
        ) {
          formData.delete(key);
        }
      }

      // setLoading(false);
      // console.log(Object.fromEntries(formData));
      // return;

      const response = await fetch(`${BASE_URL}/product`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Product created successfully",
          {
            autoClose: 1000,
          }
        );
        setLoading(false);
        navigate("/product/product-list");
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <LoaderOverlay />;
  }

  // if (supplierLoading) {
  //   return;
  // }

  return (
    <div>
      <form onSubmit={handleSubmit(handleDataPost)} className="mt-3 space-y-8">
        {/* Product Description Section */}
        <section className=" shadow-md bg-gray-50 rounded-lg p-4 sm:p-8 md:p-12">
          <h1 className="sm:text-3xl text-xl mb-6 font-semibold text-textColor">
            Product Other Information
          </h1>

          {/* Product Description */}
          <div className="mt-4">
            <label
              htmlFor="product_description"
              className="font-medium text-gray-800"
            >
              Product Description
            </label>
            <ReactQuill
              className="mt-2"
              id="product_description"
              theme="snow"
              value={description}
              onChange={setDescription}
              placeholder="Enter Product Description"
            />
          </div>
          {/* Thumbnail Video */}
          <div className="my-6">
            <h2 className="text-lg text-gray-700 font-semibold">
              Thumbnail Video
            </h2>
            <div className="border-dashed border my-3 bg-white border-blue-400 rounded-lg  text-center">
              {thumbnailVideoPreview ? (
                <div className="relative inline-block my-2 ">
                  <video
                    controls
                    autoPlay
                    src={thumbnailVideoPreview}
                    className="w-48 h-full"
                  ></video>
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full "
                    onClick={removeThumbnailVideo}
                  >
                    <MdCancel size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer p-6">
                  <RiVideoAddLine className="text-7xl text-gray-400" />

                  <span className="text-gray-500">Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    className="hidden"
                    {...register("main_video")}
                    onChange={handleThumbnailVideoChange}
                  />
                  <p className="text-gray-400 text-sm">
                    Upload Product Thumbnil video
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="my-6">
            <h2 className="text-lg text-gray-700 font-semibold">
              Thumbnail Image
            </h2>
            <div className="border-dashed border my-3 bg-white border-blue-400 rounded-lg  text-center">
              {thumbnailPreview ? (
                <div className="relative inline-block my-2 ">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    className="w-48 h-48 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full "
                    onClick={removeThumbnail}
                  >
                    <MdCancel size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer p-6">
                  <RiImageAddLine className="text-7xl text-gray-400" />

                  <span className="text-gray-500">Upload Thumbnail</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={thumbnailInputRef}
                    className="hidden"
                    {...register("main_image")}
                    onChange={handleThumbnailChange}
                  />
                  <p className="text-gray-400 text-sm">
                    Upload Product Thumbnil Image (JPG, PNG, WEBP)
                  </p>
                </label>
              )}
              {errors.main_image && (
                <p className="text-red-600 text-xs">
                  {errors.main_image.message}
                </p>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="my-10">
            <h2 className="text-lg text-gray-700 mb-4 font-semibold">
              Aditional Images
            </h2>
            {imagePreviews.length > 0 ? (
              <>
                <div className="border-dashed border-2 border-blue-400 rounded-lg p-4 text-center">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {/* Display Image Previews */}
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`preview-${index}`}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full"
                          onClick={() => removeImage(index)}
                        >
                          <MdCancel />
                        </button>
                      </div>
                    ))}

                    {/* Image Upload Box */}
                    <label
                      htmlFor="image_upload"
                      className="w-24 h-24 flex items-center justify-center cursor-pointer bg-white border-dashed border border-blue-400 text-gray-500 rounded-md"
                    >
                      <span className="text-2xl font-semibold">+</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="image_upload"
                        multiple
                        accept="image/*"
                        className="hidden"
                        {...register("other_images", {
                          validate: {
                            isImage: (files) =>
                              Array.from(files).every((file) =>
                                [
                                  "image/jpg",
                                  "image/jpeg",
                                  "image/png",
                                  "image/webp",
                                  "image/gif",
                                  "image/JPG",
                                  "image/JPEG",
                                  "image/PNG",
                                  "image/WEBP",
                                  "image/GIF",
                                ].includes(file.type)
                              ) || "Only image files are allowed",
                          },
                        })}
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Upload 300×300 pixel images in PNG, JPG, or WebP format (max
                    1 MB)
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className=" text-center">
                  <div className="flex flex-wrap gap-4 justify-center my-3">
                    {/* Display Image Previews */}
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative  border shadow">
                        <img
                          src={preview}
                          alt={`preview-${index}`}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full"
                          onClick={() => removeImage(index)}
                        >
                          <MdCancel />
                        </button>
                      </div>
                    ))}

                    {/* Image Upload Box */}
                    <label
                      htmlFor="image_upload"
                      className="w-full p-10 flex flex-col  items-center justify-center cursor-pointer bg-white border-dashed border border-blue-400 text-gray-500 rounded-md"
                    >
                      <PiImagesThin className="text-7xl" />

                      <input
                        ref={fileInputRef}
                        type="file"
                        id="image_upload"
                        multiple
                        accept="image/*"
                        className="hidden"
                        {...register("other_images", {
                          validate: {
                            isImage: (files) =>
                              Array.from(files).every((file) =>
                                [
                                  "image/jpg",
                                  "image/jpeg",
                                  "image/png",
                                  "image/webp",
                                  "image/gif",
                                  "image/JPG",
                                  "image/JPEG",
                                  "image/PNG",
                                  "image/WEBP",
                                  "image/GIF",
                                ].includes(file.type)
                              ) || "Only image files are allowed",
                          },
                        })}
                        onChange={handleImageChange}
                      />
                      <p className="text-gray-400 mt-2 text-sm">
                        Upload 300×300 pixel images in PNG, JPG, or WebP format
                      </p>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="my-6">
            <h2 className="text-lg text-gray-700 font-semibold">Size Chart</h2>
            <div className="border-dashed border my-3 bg-white border-blue-400 rounded-lg  text-center">
              {sizeChartPreview ? (
                <div className="relative inline-block my-2 ">
                  <img
                    src={sizeChartPreview}
                    alt="Size Chart Preview"
                    className="w-48 h-48 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full "
                    onClick={removeSizeChart}
                  >
                    <MdCancel size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer p-6">
                  <RiImageAddLine className="text-7xl text-gray-400" />

                  <span className="text-gray-500">Upload Size Chart</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={sizechartInputRef}
                    className="hidden"
                    {...register("size_chart")}
                    onChange={handleSizeChartChange}
                  />
                  <p className="text-gray-400 text-sm">
                    Upload Product Thumbnil Image (JPG, PNG, WEBP)
                  </p>
                </label>
              )}
              {errors.size_chart && (
                <p className="text-red-600 text-xs">
                  {errors.size_chart.message}
                </p>
              )}
            </div>
          </div>

          {/* Image section end */}
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            {/* Trending Product */}
            <div className=" space-y-2 ">
              <label htmlFor="trending_product" className="font-medium">
                Trending Product
              </label>
              <Select
                id="trending_product"
                name="trending_product"
                placeholder="-Select Trending Product-"
                defaultValue={{ value: "true", label: "Yes" }}
                options={[
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ]}
                aria-label="Select Trending Product"
                onChange={(selectedOption) =>
                  settrendingProduct(selectedOption?.value)
                }
              ></Select>
            </div>
            {/* Product Warrenty */}
            <div className="">
              <label htmlFor="product_warrenty" className="font-medium">
                Product Warrenty
              </label>
              <input
                // defaultValue={stepOneDefaultdata?.product_warrenty}
                {...register("product_warrenty")}
                id="product_warrenty"
                type="text"
                defaultValue={stepThreeData?.product_warrenty}
                placeholder="Enter Warrenty"
                className="block w-full p-2.5 outline-primaryColor text-gray-800 bg-white border border-gray-300 rounded-lg mt-2"
              />
            </div>
            {/* Product Return */}
            <div className="">
              <label htmlFor="product_return" className="font-medium">
                Product Return Policy
              </label>
              <input
                // defaultValue={stepOneDefaultdata?.product_return}
                {...register("product_return")}
                id="product_return"
                type="text"
                defaultValue={stepThreeData?.product_return}
                placeholder="Enter Return Policy"
                className="block w-full p-2.5 outline-primaryColor text-gray-800 bg-white border border-gray-300 rounded-lg mt-2"
              />
            </div>
            {/* unit */}
            <div className="">
              <label htmlFor="unit" className="font-medium">
                Unit
              </label>
              <input
                defaultValue={stepThreeData?.unit}
                {...register("unit")}
                id="unit"
                placeholder="Enter Unit Like Pc, Box, kg, Lit etc."
                type="text"
                className="block w-full p-2.5 outline-primaryColor text-gray-800 bg-white border border-gray-300 rounded-lg mt-2"
              />
            </div>
            {/* Supplier Name */}
            {/* <div className=" space-y-2">
              <label htmlFor="supplier_name" className="font-medium">
                Supplier Name
              </label>

              <Select
                id="supplier_id"
                name="supplier_id"
                isClearable
                aria-label="Select a Category"
                options={suppliers?.data}
                getOptionLabel={(x) => x?.supplier_name}
                getOptionValue={(x) => x?._id}
                onChange={(selectedOption) =>
                  setProduct_supplier_id(selectedOption?._id)
                }
              ></Select>
            </div> */}
          </div>

          {/* meta */}
          <div className="mt-8">
            <div className="flex flex-col gap-2 mt-4">
              <label htmlFor="fname" className="text-base font-medium">
                Meta Keyword
              </label>
              {keywords?.length > 0 && (
                <div className="flex flex-wrap gap-1 bg-white mb-3 rounded-lg py-1 min-h-[50px] items-center">
                  {keywords?.map((keyword, index) => (
                    <div
                      key={index}
                      className="bg-gray-300 text-black py-1 px-2 mx-1 rounded-full flex item-center justify-center h-auto"
                    >
                      <span>{keyword?.keyword}</span>
                      <div
                        className="ml-2 w-6 h-6 cursor-pointer bg-gray-400 rounded-full px-2 flex item-center justify-center"
                        onClick={() => removeKeyword(keyword?.keyword)}
                      >
                        X
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="text"
                className="bg-bgray-50 border border-gray-300 p-4 rounded-lg h-14 focus:border focus:border-success-300 focus:ring-0"
                name="fname"
                value={inputKeyword}
                onChange={handleKeywordChange}
                onKeyDown={handleKeyPress}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="meta_title" className="font-medium">
                Meta Title
              </label>
              <input
                defaultValue={stepThreeData?.meta_title}
                {...register("meta_title")}
                id="meta_title"
                type="text"
                className="block w-full px-2 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl mt-2"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="meta_description" className="font-medium">
                Meta Description
              </label>
              <textarea
                cols={5}
                defaultValue={stepThreeData?.meta_description}
                {...register("meta_description")}
                id="meta_description"
                type="text"
                className="block w-full px-2 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl mt-2"
              />
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex justify-end items-center gap-2 sm:gap-4 flex-wrap">
          <button
            type="button"
            className=" bg-gray-300 text-gray-900 text-lg  py-2.5 px-6 font-semibold  rounded-lg  text-center"
            onClick={() => setCurrentStep(2)}
          >
            Back
          </button>
          {buttonLoading ? (
            <MiniSpinner />
          ) : (
            <>
              <button
                className=" bg-yellowColor text-white text-lg  py-2.5 px-6 font-semibold  rounded-lg  text-center"
                type="submit"
                onClick={() => setSaveAndPublish(false)}
              >
                Save and UnPublish
              </button>
              <button
                className=" bg-green-600 text-white text-lg  py-2.5 px-6 font-semibold  rounded-lg  text-center"
                type="submit"
                onClick={() => setSaveAndPublish(true)}
              >
                Save and Publish
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default StepThree;
