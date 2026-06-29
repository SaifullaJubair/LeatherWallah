import { useState, useRef, useContext } from "react";
import { useForm } from "react-hook-form";
import "react-quill-new/dist/quill.snow.css";
import ReactQuill from "react-quill-new";
import { MdCancel } from "react-icons/md";
import { RiImageAddLine, RiVideoAddLine } from "react-icons/ri";
import { PiImagesThin } from "react-icons/pi";

import { toast } from "react-toastify";
import Select from "react-select";
import { BASE_URL } from "../../../../utils/baseURL";
import { AuthContext } from "../../../../context/AuthProvider";
import { LoaderOverlay } from "../../../common/loader/LoderOverley";
import { useNavigate } from "react-router-dom";
import MiniSpinner from "../../../../shared/MiniSpinner/MiniSpinner";

// Phase F+H — array/object fields BE expects as JSON.parse'able strings.
// The default stepOneData loop further down skips raw arrays/objects (would
// stringify to "[object Object]"), so each gets an explicit appender.
const PHASE_FH_JSON_FIELDS = ["product_dimensions", "tier_prices", "group_prices"];
const appendPhaseFHJsonFields = (formData, stepOneData) => {
  PHASE_FH_JSON_FIELDS.forEach((k) => {
    const v = stepOneData?.[k];
    if (v === undefined || v === null) return;
    if (Array.isArray(v) && v.length === 0) return;
    if (!Array.isArray(v) && typeof v === "object" && Object.keys(v).length === 0)
      return;
    formData.append(k, JSON.stringify(v));
  });
};

const UpdateStepThree = ({
  setCurrentStep,
  stepThreeData,
  stepOneData,
  productData,
  refetch,
}) => {
  const { user, loading } = useContext(AuthContext);
  const [saveAndPublish, setSaveAndPublish] = useState(true);
  const [product_returnable, setProduct_returnable] = useState(
    stepThreeData?.product_returnable_days || false
  );

  const [trending_product, settrendingProduct] = useState(
    stepThreeData?.trending_product !== undefined
      ? stepThreeData.trending_product
      : true
  );

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
    stepThreeData?.main_image || null
  );
  const [sizeChartPreview, setSizeChartPreview] = useState(
    stepThreeData?.size_chart || null
  );
  const [thumbnailVideoPreview, setThumbnailVideoPreview] = useState(
    stepThreeData?.main_video || null
  );
  const watchImages = watch("other_images");

  const [buttonLoading, setLoading] = useState(false);
  const navigate = useNavigate();

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
  const [keywords, setKeywords] = useState(stepThreeData?.meta_keywords || []);
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
      // if (data?.product_returnable == true && !data?.product_returnable_days) {
      //   toast.error("Error: Please fill in the product Returnable Days.");
      //   return;
      // }
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

      const formData = new FormData();
      formData.append("_id", productData?._id);
      formData.append("product_status", "active");
      formData.append("product_by", "super-admin");
      formData.append("product_publisher_id", user?._id);
      // formData.append(
      //   "panel_owner_id",
      //   user?.panel_owner_id ? user?.panel_owner_id : user?._id
      // );

      Object.entries(data).forEach(([key, value]) => {
        if (
          key === "main_image" ||
          key === "other_images" ||
          key === "main_video" ||
          key === "size_chart"
        ) {
          return;
        }

        // Append other data normally
        formData.append(key, value);
      });

      // Separate logic for handling "main_image" and "other_images" if needed
      if (data?.main_image) {
        formData.append("main_image", data?.main_image);
      } else {
        formData.append("main_image", thumbnailPreview);
      }

      if (
        data?.size_chart &&
        (data.size_chart instanceof File ||
          (data.size_chart instanceof FileList && data.size_chart.length > 0))
      ) {
        formData.append(
          "size_chart",
          data.size_chart instanceof FileList
            ? data.size_chart[0]
            : data.size_chart
        );
      } else if (sizeChartPreview && typeof sizeChartPreview !== "string") {
        formData.append("size_chart", sizeChartPreview);
      }

      if (
        data?.main_video &&
        (data.main_video instanceof File ||
          (data.main_video instanceof FileList && data.main_video.length > 0))
      ) {
        formData.append(
          "main_video",
          data.main_video instanceof FileList
            ? data.main_video[0]
            : data.main_video
        );
      } else if (sizeChartPreview && typeof sizeChartPreview !== "string") {
        formData.append("main_video", sizeChartPreview);
      }

      if (data?.other_images && data?.other_images.length > 0) {
        data.other_images.forEach((file, index) => {
          formData.append(`other_images[${index}]`, file);
        });
      }
      if (imagePreviews.length > 0) {
        imagePreviews.forEach((file, index) => {
          formData.append(
            `other_default_images[other_image][${index}]`,
            file?.other_image
          );
          formData.append(
            `other_default_images[other_image_key][${index}]`,
            file?.other_image_key
          );
        });
      }

      formData.append("meta_keywords", JSON.stringify(keywords));
      formData.append("description", description);
      // (legacy `specifications` formData append removed — specification
      // module retired in Phase 0; attribute payload now ships via
      // product_attributes + variant_axes set from UpdateStepOne.)

      Object.entries(stepOneData).forEach(([key, value]) => {
        if (
          (key === "newVariationData" || key === "defaultVariationData") &&
          Array.isArray(value)
        ) {
          value.forEach((product, index) => {
            formData.append(`variation_details[${index}][_id]`, product._id);
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
            // formData.append(
            //   `variation_details[${index}][variation_reseller_price]`,
            //   product.variation_reseller_price
            // );
            // formData.append(
            //   `variation_details[${index}][variation_wholeseller_price]`,
            //   product.variation_wholeseller_price
            // );
            // formData.append(
            //   `variation_details[${index}][variation_wholeseller_min_quantity]`,
            //   product.variation_wholeseller_min_quantity
            // );
            formData.append(
              `variation_details[${index}][variation_alert_quantity]`,
              product.variation_alert_quantity
            );
            // formData.append(
            //   `variation_details[${index}][variation_sku]`,
            //   product.variation_sku
            // );
            // formData.append(
            //   `variation_details[${index}][variation_barcode]`,
            //   product.variation_barcode
            // );

            // If the product has an variation_image, append the variation_image file
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
        } else {
          formData.append(key, value);
        }
      });

      // Phase F+H — arrays/objects (skipped by default loop) packed as JSON strings.
      appendPhaseFHJsonFields(formData, stepOneData);

      formData.append("trending_product", trending_product);

      // setLoading(false);
      // console.log(Object.fromEntries(formData));
      // return;

      const response = await fetch(`${BASE_URL}/product`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Product update successfully",
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
      // if (data?.product_returnable == true && !data?.product_returnable_days) {
      //   toast.error("Error: Please fill in the product Returnable Days.");
      //   return;
      // }
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

      const formData = new FormData();
      formData.append("_id", productData?._id);
      formData.append("product_status", "in-active");
      formData.append("product_by", "super-admin");
      formData.append("product_publisher_id", user?._id);
      // formData.append(
      //   "panel_owner_id",
      //   user?.panel_owner_id ? user?.panel_owner_id : user?._id
      // );

      Object.entries(data).forEach(([key, value]) => {
        if (
          key === "main_image" ||
          key === "other_images" ||
          key === "main_video" ||
          key === "size_chart"
        ) {
          return;
        }

        // Append other data normally
        formData.append(key, value);
      });

      // Separate logic for handling "main_image" and "other_images" if needed
      if (data?.main_image) {
        formData.append("main_image", data?.main_image);
      } else {
        formData.append("main_image", thumbnailPreview);
      }
      if (
        data?.size_chart &&
        (data.size_chart instanceof File ||
          (data.size_chart instanceof FileList && data.size_chart.length > 0))
      ) {
        formData.append(
          "size_chart",
          data.size_chart instanceof FileList
            ? data.size_chart[0]
            : data.size_chart
        );
      } else if (sizeChartPreview && typeof sizeChartPreview !== "string") {
        formData.append("size_chart", sizeChartPreview);
      }

      if (
        data?.main_video &&
        (data.main_video instanceof File ||
          (data.main_video instanceof FileList && data.main_video.length > 0))
      ) {
        formData.append(
          "main_video",
          data.main_video instanceof FileList
            ? data.main_video[0]
            : data.main_video
        );
      } else if (sizeChartPreview && typeof sizeChartPreview !== "string") {
        formData.append("main_video", sizeChartPreview);
      }

      if (data?.other_images && data?.other_images.length > 0) {
        data.other_images.forEach((file, index) => {
          formData.append(`other_images[${index}]`, file);
        });
      }
      if (imagePreviews.length > 0) {
        imagePreviews.forEach((file, index) => {
          formData.append(
            `other_default_images[other_image][${index}]`,
            file?.other_image
          );
          formData.append(
            `other_default_images[other_image_key][${index}]`,
            file?.other_image_key
          );
        });
      }

      formData.append("meta_keywords", JSON.stringify(keywords));
      formData.append("description", description);
      // (legacy `specifications` formData append removed — specification
      // module retired in Phase 0; attribute payload now ships via
      // product_attributes + variant_axes set from UpdateStepOne.)

      Object.entries(stepOneData).forEach(([key, value]) => {
        if (
          (key === "newVariationData" || key === "defaultVariationData") &&
          Array.isArray(value)
        ) {
          value.forEach((product, index) => {
            formData.append(`variation_details[${index}][_id]`, product._id);
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
            // formData.append(
            //   `variation_details[${index}][variation_reseller_price]`,
            //   product.variation_reseller_price
            // );
            // formData.append(
            //   `variation_details[${index}][variation_wholeseller_price]`,
            //   product.variation_wholeseller_price
            // );
            // formData.append(
            //   `variation_details[${index}][variation_wholeseller_min_quantity]`,
            //   product.variation_wholeseller_min_quantity
            // );
            formData.append(
              `variation_details[${index}][variation_alert_quantity]`,
              product.variation_alert_quantity
            );
            // formData.append(
            //   `variation_details[${index}][variation_sku]`,
            //   product.variation_sku
            // );
            // formData.append(
            //   `variation_details[${index}][variation_barcode]`,
            //   product.variation_barcode
            // );

            // If the product has an variation_image, append the variation_image file
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
        } else {
          formData.append(key, value);
        }
      });

      // Phase F+H — arrays/objects (skipped by default loop) packed as JSON strings.
      appendPhaseFHJsonFields(formData, stepOneData);

      formData.append("trending_product", trending_product);

      // setLoading(false);
      // console.log(Object.fromEntries(formData));
      // return;

      const response = await fetch(`${BASE_URL}/product`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : "Product update successfully",
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
                    autoPlay
                    controls
                    src={thumbnailVideoPreview}
                    alt="Thumbnail Video"
                    className="w-48 h-48 object-cover rounded-md"
                  />
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
                    ref={thumbnailInputRef}
                    accept="image/*"
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
            {imagePreviews?.length > 0 ? (
              <>
                <div className="border-dashed border-2 border-blue-400 rounded-lg p-4 text-center">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {/* Display Image Previews */}
                    {imagePreviews?.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview?.other_image || preview}
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
                          src={preview?.other_image || preview}
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
                defaultValue={
                  trending_product
                    ? { value: true, label: "Yes" }
                    : { value: false, label: "No" }
                }
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
            <div>
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

export default UpdateStepThree;
