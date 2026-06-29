import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Select from "react-select";
import { BASE_URL } from "../../../../utils/baseURL";
import { LoaderOverlay } from "../../../common/loader/LoderOverley";
import UpdateStepOnePrice from "./UpdateStepOnePrice";
import { toast } from "react-toastify";
import DefaultProductVariation from "./DefaultProductVariation";
import CategoryTreePicker from "../../../Category/CategoryTreePicker";
import StepOneAdvanced from "../../../ProductNew/stepOne/StepOneAdvanced";
import StepOneProductType from "../../../ProductNew/stepOne/StepOneProductType";

const UpdateStepOne = ({
  setCurrentStep,
  setStepOneData,
  stepOneData
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Single-leaf category from the nested tree — replaces old category/sub/child
  // chain. category_path = ancestor chain (root → …) for fast subtree filtering.
  const [category_id, setCategory_id] = useState(
    stepOneData?.category_id ? stepOneData?.category_id : ""
  );
  const [category_name, setCategory_name] = useState(
    stepOneData?.category_name ? stepOneData?.category_name : ""
  );
  const [category_path, setCategoryPath] = useState(
    stepOneData?.category_path ?? []
  );

  const [brand_id, setBrand_id] = useState(
    stepOneData?.brand_id ? stepOneData?.brand_id : ""
  );
  const [brand_name, setBrand_name] = useState(
    stepOneData?.brand_name ? stepOneData?.brand_name : ""
  );

  // set default value
  const brandNameValue = stepOneData?.brand_name ? stepOneData?.brand_name : "";
  const brandNameId = stepOneData?.brand_id ? stepOneData?.brand_id : "";

  // set show product variation status
  const [showProductVariation, setShowProductVariation] = useState(
    stepOneData?.is_variation ? stepOneData?.is_variation : false
  );
  const [againAddNewVariation, setAgainAddNewVariation] = useState(
    stepOneData?.againAddNewVariation
      ? stepOneData?.againAddNewVariation
      : false
  );
  // Set product variation data
  const [inputValueData, setFormData] = useState(
    stepOneData?.newVariationData || []
  );

  useEffect(() => {
    // Check if new data is different from the current state
    if (
      stepOneData?.newVariationData &&
      stepOneData.newVariationData.length > 0 &&
      JSON.stringify(stepOneData.newVariationData) !==
        JSON.stringify(inputValueData)
    ) {
      setFormData(stepOneData.newVariationData);
    }
  }, [stepOneData?.newVariationData]);

  // set default variation data
  const [defaultVariationData, setDefaultVariationData] = useState(
    stepOneData?.defaultVariationData
  );

  // ── Phase F + H state (A2a + A2b) — hydrated from initial productData via
  //    stepOneData and re-emitted into sendData below.
  const [videoLink, setVideoLink] = useState(stepOneData?.video_link || "");
  const [condition, setCondition] = useState(stepOneData?.condition || "new");
  const [weightGrams, setWeightGrams] = useState(
    stepOneData?.product_weight_grams ?? "",
  );
  const [vatOverride, setVatOverride] = useState(
    stepOneData?.vat_percentage_override ?? "",
  );
  const [warehouseId, setWarehouseId] = useState(
    stepOneData?.warehouse_id || "",
  );
  const [dimensions, setDimensions] = useState(
    stepOneData?.product_dimensions || {},
  );
  const [tierPrices, setTierPrices] = useState(
    Array.isArray(stepOneData?.tier_prices) ? stepOneData.tier_prices : [],
  );
  const [groupPrices, setGroupPrices] = useState(
    Array.isArray(stepOneData?.group_prices) ? stepOneData.group_prices : [],
  );

  // ── Phase F (A2c) — product_type machinery + custom_fields ─────────
  const [productType, setProductType] = useState(
    stepOneData?.product_type || "simple",
  );
  const [downloadUrl, setDownloadUrl] = useState(
    stepOneData?.download_url || "",
  );
  const [licenseKey, setLicenseKey] = useState(stepOneData?.license_key || "");
  const [bundleItems, setBundleItems] = useState(
    Array.isArray(stepOneData?.bundle_items) ? stepOneData.bundle_items : [],
  );
  const [availableFrom, setAvailableFrom] = useState(
    stepOneData?.available_from || "",
  );
  const [billingInterval, setBillingInterval] = useState(
    stepOneData?.billing_interval || "",
  );
  const [customFields, setCustomFields] = useState(
    Array.isArray(stepOneData?.custom_fields) ? stepOneData.custom_fields : [],
  );

  // CategoryTreePicker fetches /category/tree itself. (sub/child endpoints retired.)
  const { data: brands = [], isLoading: brandLoading } = useQuery({
    queryKey: [`/api/v1/brand/dashboard`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/brand/dashboard`, {
        credentials: "include",
      });
      const data = await res.json();
      return data;
    },
  });
  const brandData = brands?.data ?? [];

  function validateProductData(data) {
    const {
      product_price,
      product_discount_price,
      product_quantity,
      product_alert_quantity,
    } = data;

    // Convert string values to numbers for comparison
    const price = parseFloat(product_price);
    const discountPrice = parseFloat(product_discount_price);
    const quantity = parseFloat(product_quantity);
    const alertQuantity = parseFloat(product_alert_quantity);

    // Validation checks
    if (price <= discountPrice) {
      toast.error("Product price must be greater than the discount price.", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    // if (quantity <= alertQuantity) {
    //   toast.error("Product quantity must be greater than the alert quantity.", {
    //     position: "top-center",
    //     autoClose: 2000,
    //     hideProgressBar: false,
    //     closeOnClick: true,
    //     pauseOnHover: true,
    //     draggable: true,
    //     progress: undefined,
    //     theme: "light",
    //   });
    //   return;
    // }
    // If all validations pass
    return null;
  }

  function validateVariationProductData(item, index) {
    const {
      variation_price,
      variation_discount_price,
      variation_quantity,
      variation_alert_quantity,
    } = item;

    // Convert string values to numbers for comparison
    const price = parseFloat(variation_price);
    const discountPrice = parseFloat(variation_discount_price);
    const quantity = parseFloat(variation_quantity);
    const alertQuantity = parseFloat(variation_alert_quantity);

    // Validation checks
    if (price <= discountPrice) {
      toast.error(
        `Product price must be greater than the discount price at serial no ${
          index + 1
        }.`,
        {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        }
      );
      return;
    }
    // if (quantity <= alertQuantity) {
    //   toast.error(
    //     `Product quantity must be greater than the alert quantity at serial no ${
    //       index + 1
    //     }.`,
    //     {
    //       position: "top-center",
    //       autoClose: 2000,
    //       hideProgressBar: false,
    //       closeOnClick: true,
    //       pauseOnHover: true,
    //       draggable: true,
    //       progress: undefined,
    //       theme: "light",
    //     }
    //   );
    //   return;
    // }
    // If all validations pass
    return null;
  }

  const handleDataPost = async (data) => {
    // Manually check if the category is selected
    if (!category_id) {
      toast.error("Please select the category", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    let variationValidateError = false;

    if (showProductVariation == true) {
      // Validate each item in inputValueData
      defaultVariationData?.forEach((item, index) => {
        const validationError = validateVariationProductData(item, index);
        if (validationError !== null) {
          variationValidateError = true;
          return;
        }

        if (item.variation_alert_quantity < 0) {
          toast.error(
            `Variation Alert Quantity is required at serial no ${index + 1}`,
            {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            }
          );
          return;
        }
        if (item.variation_buying_price < 0) {
          toast.error(
            `Variation Buying Price is required at serial no ${index + 1}`,
            {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            }
          );
          return;
        }
        if (item.variation_discount_price < 0) {
          toast.error(
            `Variation Discount Price is required at serial no ${index + 1}`,
            {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            }
          );
          return;
        }
        if (item.variation_price < 1) {
          toast.error(
            `Variation Price  is required at serial no ${index + 1}`,
            {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            }
          );
          return;
        }
        if (item.variation_quantity < 0) {
          toast.error(
            `Variation Quantity  is required at serial no ${index + 1}`,
            {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            }
          );
          return;
        }
      });

      // try {

      //   const sendData = {
      //     showProductVariation,
      //     variation_details: defaultVariationData?.map((item) => ({
      //       ...item,
      //     })),
      //   }
      //   const response = await fetch(
      //     `${BASE_URL}/product/check_product_barcode_when_update`,
      //     {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //         credentials: "include",
      //       },
      //       body: JSON.stringify(sendData),
      //     }
      //   );
      //   const result = await response.json();
      //   if (result?.statusCode == 200 && result?.success == true) {
      //     ("");
      //   } else {
      //     toast.error(result?.message || "Something went wrong", {
      //       autoClose: 1000,
      //     });
      //     variationValidateError = true;
      //   }
      // } catch (error) {
      //   toast.error("Something went wrong", {
      //     autoClose: 1000,
      //   });
      //   console.log(error);
      //   variationValidateError = true;
      // } finally {
      //   ("");
      // }

      if (variationValidateError) return;
    }

    const sendData = {
      category_id: category_id,
      category_name: category_name,
      category_path: category_path,
      brand_id: brand_id,
      brand_name: brand_name,
      product_name: data?.product_name,
      // product_sku: data?.product_sku,
      product_price: data?.product_price,
      product_discount_price: data?.product_discount_price,
      product_quantity: data?.product_quantity,
      // product_alert_quantity: data?.product_alert_quantity,
      product_buying_price: data?.product_buying_price,
      is_variation: showProductVariation,
      defaultVariationData: defaultVariationData,
      newVariationData: inputValueData?.map((item) => ({
        ...item,
      })),
      againAddNewVariation: againAddNewVariation,
      // ── Phase F + H additions (A2a + A2b)
      video_link: videoLink || "",
      condition: condition || "new",
      product_weight_grams: weightGrams === "" ? undefined : weightGrams,
      vat_percentage_override: vatOverride === "" ? undefined : vatOverride,
      warehouse_id: warehouseId || undefined,
      product_dimensions:
        dimensions &&
        (dimensions.length || dimensions.width || dimensions.height)
          ? dimensions
          : undefined,
      tier_prices: (tierPrices || []).filter(
        (r) => r.min_qty !== "" && r.price !== "",
      ),
      group_prices: (groupPrices || []).filter((r) => r.price !== ""),
      // ── Phase F (A2c) — product_type + per-type fields + custom_fields
      product_type: productType || "simple",
      download_url: downloadUrl || "",
      license_key: licenseKey || "",
      bundle_items: (bundleItems || []).filter(
        (r) => r.product_id && Number(r.quantity) > 0,
      ),
      available_from: availableFrom
        ? new Date(availableFrom).toISOString()
        : undefined,
      billing_interval: billingInterval || undefined,
      custom_fields: (customFields || []).filter(
        (r) => r.label?.trim() && r.value?.trim(),
      ),
    };
    if (!sendData?.brand_id) {
      delete sendData?.brand_id;
    }
    if (!sendData?.brand_name) {
      delete sendData?.brand_name;
    }
    if (showProductVariation == true) {
      delete sendData?.product_price;
      delete sendData?.product_discount_price;
      delete sendData?.product_quantity;
      delete sendData?.product_alert_quantity;
      delete sendData?.product_buying_price;
    }
    if (showProductVariation == false) {
      delete sendData?.newVariationData;
    }
    if (showProductVariation == false) {
      delete sendData?.defaultVariationData;
    }
    if (againAddNewVariation == true) {
      delete sendData?.defaultVariationData;
    }
    if (againAddNewVariation == false) {
      delete sendData?.newVariationData;
    }

    if (showProductVariation == false) {
      delete sendData?.variation_details;
      const validationError = validateProductData(sendData);
      if (validationError !== null) {
        return;
      }
    }

    setStepOneData(sendData);
    setCurrentStep(2);
  };

  // loading set
  if (brandLoading) {
    return <LoaderOverlay />;
  }

  return (
    <div>
      <form onSubmit={handleSubmit(handleDataPost)} className="mt-3 space-y-8">
        {/* Product Information */}
        <section className=" shadow-md bg-gray-50 rounded-lg p-4 sm:p-8 md:p-12">
          <h1 className="sm:text-3xl text-xl mb-6 font-semibold text-textColor">
            Product Information
          </h1>
          {/* Product all field  */}
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            {/* Product Name */}
            <div className="">
              <label htmlFor="product_name" className="font-medium">
                Product Name<span className="text-red-500">*</span>
              </label>
              <input
                defaultValue={stepOneData?.product_name}
                {...register("product_name", {
                  required: "Product Name is required",
                })}
                id="product_name"
                type="text"
                placeholder="Enter Product Name"
                className="block w-full p-2.5 text-gray-800 outline-primaryColor bg-white border border-gray-300 rounded-lg mt-2"
              />
              {errors.product_name && (
                <p className="text-red-600">{errors.product_name?.message}</p>
              )}
            </div>
            {/* Product Sku */}
            {/* <div className="">
              <label htmlFor="product_sku" className="font-medium">
                Product SKU
              </label>
              <input
                defaultValue={stepOneData?.product_sku}
                {...register("product_sku")}
                id="product_sku"
                type="text"
                placeholder="Enter Product SKU"
                className="block w-full p-2.5 outline-primaryColor text-gray-800 bg-white border border-gray-300 rounded-lg mt-2"
              />
            </div> */}
            {/* Category — nested tree single-leaf picker. Replaces the old
                category → sub → child 3-dropdown (modules retired). */}
            <div className="space-y-2">
              <label className="font-medium">
                Category<span className="text-red-500">*</span>
              </label>
              <CategoryTreePicker
                value={category_id}
                onChange={(node) => {
                  if (!node) {
                    setCategory_id("");
                    setCategory_name("");
                    setCategoryPath([]);
                    setStepOneData({
                      ...stepOneData,
                      category_id: "",
                      category_name: "",
                      category_path: [],
                    });
                    return;
                  }
                  setCategory_id(node._id);
                  setCategory_name(node.category_name);
                  const nextPath = [...(node.category_path ?? []), node._id];
                  setCategoryPath(nextPath);
                  setStepOneData({
                    ...stepOneData,
                    category_id: node._id,
                    category_name: node.category_name,
                    category_path: nextPath,
                  });
                }}
              />
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <label htmlFor="brand_name" className="font-medium">
                Brand Name
              </label>
              <Select
                id="brand_id"
                name="brand_id"
                aria-label="Select a Brand"
                isClearable
                defaultValue={
                  brandNameId
                    ? { _id: brandNameId, brand_name: brandNameValue }
                    : null
                }
                options={brandData}
                getOptionLabel={(x) => x?.brand_name}
                getOptionValue={(x) => x?._id}
                onChange={(selectedOption) => {
                  setBrand_id(selectedOption?._id ?? "");
                  setBrand_name(selectedOption?.brand_name ?? "");
                }}
              ></Select>
            </div>

          </div>
        </section>

        {/* Phase F + H — Advanced (logistics, tax, tier/group prices). */}
        <StepOneAdvanced
          videoLink={videoLink}
          setVideoLink={setVideoLink}
          condition={condition}
          setCondition={setCondition}
          weightGrams={weightGrams}
          setWeightGrams={setWeightGrams}
          vatOverride={vatOverride}
          setVatOverride={setVatOverride}
          warehouseId={warehouseId}
          setWarehouseId={setWarehouseId}
          dimensions={dimensions}
          setDimensions={setDimensions}
          tierPrices={tierPrices}
          setTierPrices={setTierPrices}
          groupPrices={groupPrices}
          setGroupPrices={setGroupPrices}
        />

        {/* Phase F (A2c) — product_type + conditional per-type fields + custom_fields. */}
        <StepOneProductType
          productType={productType}
          setProductType={setProductType}
          downloadUrl={downloadUrl}
          setDownloadUrl={setDownloadUrl}
          licenseKey={licenseKey}
          setLicenseKey={setLicenseKey}
          bundleItems={bundleItems}
          setBundleItems={setBundleItems}
          availableFrom={availableFrom}
          setAvailableFrom={setAvailableFrom}
          billingInterval={billingInterval}
          setBillingInterval={setBillingInterval}
          customFields={customFields}
          setCustomFields={setCustomFields}
        />

        {/* Product Price and variation */}
        {showProductVariation === true ? (
          <DefaultProductVariation
            defaultVariationData={defaultVariationData}
            setDefaultVariationData={setDefaultVariationData}
          />
        ) : (
          <UpdateStepOnePrice
            stepOneData={stepOneData}
            register={register}
            errors={errors}
          />
        )}

        <div className="grid place-content-end ">
          <button
            type="submit"
            className=" bg-primaryColor text-white text-lg  py-2.5 px-6 font-semibold  rounded-lg  text-center"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateStepOne;
