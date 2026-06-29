"use client";

import DeliveryInformation from "@/components/frontend/checkout/DeliveryInformation";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import OfferSummary from "./OfferSummary";
import { districts } from "@/data/districts";
import { normalizeBdPhone } from "@/utils/phone";
import useGetSettingData from "@/components/lib/getSettingData";
import { toast } from "react-toastify";
import { BASE_URL } from "@/components/utils/baseURL";
import CustomLoader from "@/components/shared/loader/CustomLoader";
import { useRouter } from "next/navigation";

const ProductTable = ({ offerProducts, offer_id }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useRouter();
  const [selectedVariations, setSelectedVariations] = useState({});
  const { data: userInfo, isLoading: userGetLoading } = useUserInfoQuery();
  const [districtsData, setDistrictsData] = useState([]);
  const [districtId, setDistrictId] = useState("");
  const [division, setDivision] = useState(userInfo?.data?.user_division);
  const [district, setDistrict] = useState(userInfo?.data?.user_district);
  const [isOpenDistrict, setIsOpenDistrict] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [shopSubtotals, setShopSubtotals] = useState(0);
  const [shopTotal, setShopTotal] = useState(0);
  const [shopGrandTotals, setShopGrandTotals] = useState(0);
  const { data: settingData, isLoading: settingLoading } = useGetSettingData();

  // console.log(offerProducts);
  useEffect(() => {
    if (userInfo?.data) {
      setDivision(userInfo?.data?.user_division);
      setDistrict(userInfo?.data?.user_district);
    }
  }, [userInfo]);

  useEffect(() => {
    if (districtId) {
      const districtData = districts.filter(
        (district) => district?.division_id === districtId
      );
      setDistrictsData(districtData);
    }
  }, [districtId]);
  // Initialize selected variations
  useEffect(() => {
    const initialSelections = {};
    offerProducts?.forEach((product) => {
      if (product?.offer_product?.is_variation) {
        const productId = product?.offer_product?._id;
        const attributes = product?.offer_product?.attributes_details;

        if (attributes?.length > 0) {
          initialSelections[productId] = {};

          attributes.forEach((attribute) => {
            if (attribute?.attribute_values?.length > 0) {
              // Select the first value of each attribute
              initialSelections[productId][attribute._id] =
                attribute.attribute_values[0]._id;
            }
          });
        }
      }
    });
    setSelectedVariations(initialSelections);
  }, [offerProducts]);

  const handleVariationChange = (productId, attributeId, valueId) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [attributeId]: valueId,
      },
    }));
  };

  const getSelectedVariation = (product, selectedVariations) => {
    const productId = product?.offer_product?._id;
    const selectedAttributes = selectedVariations[productId] || {};

    // Find the variation based on selected attributes
    const selectedVariation = product?.offer_product?.variation_details?.find(
      (variation) =>
        Object.entries(selectedAttributes).every(([attributeId, valueId]) =>
          variation?.variation_name.includes(
            product?.offer_product?.attributes_details
              .find((attr) => attr._id === attributeId)
              ?.attribute_values.find((value) => value._id === valueId)
              ?.attribute_value_name
          )
        )
    );

    return selectedVariation;
  };

  const calculateUnitPrice = (product, selectedVariation) => {
    const { offer_discount_price, offer_discount_type } = product;
    let originalPrice = selectedVariation
      ? selectedVariation?.variation_discount_price
        ? selectedVariation?.variation_discount_price
        : selectedVariation?.variation_price
      : product?.offer_product?.product_discount_price
      ? product?.offer_product?.product_discount_price
      : product?.offer_product?.product_price || 0;

    if (offer_discount_type === "fixed") {
      return Math.max(originalPrice - offer_discount_price, 0);
    } else if (offer_discount_type === "percent") {
      return Math.max(
        originalPrice - (originalPrice * offer_discount_price) / 100,
        0
      );
    }

    return originalPrice; // No discount applied
  };

  const calculateSubtotal = (product, unitPrice) => {
    const quantity = product.offer_product_quantity || 0;
    return unitPrice * quantity;
  };

  const shippingCharge =
    division === "Dhaka"
      ? settingData?.data?.[0]?.inside_dhaka_shipping_charge || 0
      : settingData?.data?.[0]?.outside_dhaka_shipping_charge || 0;

  useEffect(() => {
    let totalDiscount = 0;
    let shopTotals = 0;
    let shopGrandTotals = 0;
    let productOriginalPriceSubtotal = 0;

    offerProducts?.forEach((product) => {
      const selectedVariation = getSelectedVariation(
        product,
        selectedVariations
      );

      const unitPrice = calculateUnitPrice(product, selectedVariation);
      const subtotal = calculateSubtotal(product, unitPrice);

      productOriginalPriceSubtotal +=
        (selectedVariation?.variation_price
          ? selectedVariation?.variation_price
          : product?.offer_product?.product_price) *
        product?.offer_product_quantity;
      shopTotals += subtotal;
      totalDiscount = productOriginalPriceSubtotal - shopTotals;
      shopGrandTotals = shopTotals + shippingCharge;
    });

    setTotalDiscount(totalDiscount);
    setShopSubtotals(productOriginalPriceSubtotal);
    setShopTotal(shopTotals);
    setShopGrandTotals(shopGrandTotals);
  }, [selectedVariations, shippingCharge]);

  const handleOrderProduct = async (data) => {
    const today =
      new Date().toISOString().split("T")[0] +
      " " +
      new Date().toLocaleTimeString();
    if (!district || !division)
      return toast.error("Please select a district and division.");

    // Order Unification Phase B — offer orders now go through the SAME
    // /order endpoint as regular orders (order_type:"offer" + offer_id). The
    // server recomputes the offer discount from the offers collection, so the
    // prices we send here are advisory only. Guest checkout works via
    // need_user_create + customer_name (same as the regular cart flow).
    const sendData = {
      order_status: "pending",
      pending_time: today,
      order_type: "offer",
      offer_id: offer_id,
      customer_id: userInfo?.data?._id,
      customer_name: data?.customer_name || userInfo?.data?.user_name,
      // F1.3 — submit one consistent phone format (E.164), symmetric with BE.
      customer_phone: normalizeBdPhone(data?.customer_phone),
      need_user_create: !userInfo?.data?.user_phone,
      billing_country: "Bangladesh",
      billing_city: district || userInfo?.data?.user_district,
      billing_state: division || userInfo?.data?.user_division,
      billing_address: data?.address,
      shipping_location:
        division === "Dhaka"
          ? ` Inside Dhaka, ${settingData?.data[0]?.inside_dhaka_shipping_days} Days`
          : `Outside Dhaka, ${settingData?.data[0]?.outside_dhaka_shipping_days} Days`,
      sub_total_amount: shopTotal ? shopTotal : 0,
      discount_amount: 0,
      shipping_cost: shippingCharge || 0,
      grand_total_amount: shopGrandTotals ? shopGrandTotals : 0,
      // Standard order_products[] line shape — server recomputes prices.
      order_products: offerProducts?.map((product) => {
        const selectedVariation = getSelectedVariation(
          product,
          selectedVariations
        );
        const originalPrice = selectedVariation?.variation_price
          ? selectedVariation?.variation_price
          : product?.offer_product?.product_price;
        const originalDiscountPrice =
          selectedVariation?.variation_discount_price
            ? selectedVariation?.variation_discount_price
            : product?.offer_product?.product_discount_price || 0;
        const unitPrice = calculateUnitPrice(product, selectedVariation);
        const productQuantity = product?.offer_product_quantity || 1;
        return {
          product_id: product?.offer_product?._id,
          variation_id: selectedVariation?._id || null,
          product_main_price: originalPrice,
          product_main_discount_price: originalDiscountPrice || 0,
          product_unit_price: originalPrice,
          product_unit_final_price: unitPrice,
          product_quantity: productQuantity,
          product_grand_total_price: unitPrice * productQuantity,
          campaign_id: null,
        };
      }),
    };

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/order`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();

      if (result?.statusCode === 200 && result?.success === true) {
        navigate.push(
          `/orders/order-success?order_id=${result?.data?.order_id}`
        );
        toast.success(
          result?.message ? result?.message : "Order created successfully",
          {
            autoClose: 1000,
          }
        );
        setLoading(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error posting data:", error);
      setLoading(false);
    }
  };

  if (userGetLoading) {
    return <CustomLoader />;
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit(handleOrderProduct)}>
        <div className="grid md:gap-4 lg:gap-4 grid-cols-1 md:grid-cols-5 lg:grid-cols-4">
          <div className="flex gap-6 md:col-span-3 mt-4 overflow-x-auto pb-6">
            <div className="w-full space-y-6 ">
              <div>
                <div className="my-3 py-2 bg-white  w-full">
                  <div className="overflow-x-auto  mx-4">
                    <table className="min-w-full text-sm">
                      <thead className="ltr:text-left rtl:text-right bg-gray-50 border-b">
                        <tr className="text-gray-900">
                          <td className="whitespace-nowrap p-4">Product</td>
                          <td className="whitespace-nowrap p-4">
                            Product Name
                          </td>
                          <td className="whitespace-nowrap p-4">Brand</td>
                          <td className="whitespace-nowrap p-4">Quantity</td>
                          <td className="whitespace-nowrap p-4">Variants</td>
                          <td className="whitespace-nowrap p-4">Unit Price</td>
                          <td className="whitespace-nowrap p-4">Total</td>
                        </tr>
                      </thead>

                      <tbody className="divide-gray-200">
                        {offerProducts?.map((product, i) => {
                          const selectedVariation = getSelectedVariation(
                            product,
                            selectedVariations
                          );
                          const unitPrice = calculateUnitPrice(
                            product,
                            selectedVariation
                          );
                          const subtotal =
                            unitPrice * product?.offer_product_quantity || 0;

                          return (
                            <tr
                              key={product?.offer_product?._id}
                              className={`${
                                i % 2 !== 0 ? "bg-gray-50" : "bg-white"
                              }`}
                            >
                              <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                                <img
                                  className="w-[44px] h-[44px] "
                                  src={
                                    selectedVariation?.variation_image ||
                                    product?.offer_product?.main_image
                                  }
                                  alt={product?.offer_product?.product_name}
                                />
                              </td>

                              <td className=" py-2.5 font-medium text-gray-700 px-4 overflow-y-auto">
                                <div className=" max-w-80">
                                  {product?.offer_product?.product_name}
                                </div>
                              </td>
                              <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                                {product?.offer_product?.brand_id?.brand_name ||
                                  "---"}
                              </td>
                              <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                                {product?.offer_product_quantity}
                              </td>

                              <td className=" flex flex-wrap py-2.5 font-medium text-gray-700 px-4">
                                {product?.offer_product?.is_variation &&
                                product?.offer_product?.variation_details ? (
                                  <div className="flex gap-4">
                                    {product?.offer_product?.attributes_details?.map(
                                      (attribute) => (
                                        <div key={attribute?._id}>
                                          <p className="text-text-Lightest">
                                            {attribute?.attribute_name}:
                                          </p>
                                          <select
                                            className="px-2 py-1 border"
                                            value={
                                              selectedVariations[
                                                product?.offer_product?._id
                                              ]?.[attribute._id] || ""
                                            }
                                            onChange={(e) =>
                                              handleVariationChange(
                                                product?.offer_product?._id,
                                                attribute?._id,
                                                e.target.value
                                              )
                                            }
                                          >
                                            {attribute?.attribute_values?.map(
                                              (attributeValue) => (
                                                <option
                                                  key={attributeValue?._id}
                                                  value={attributeValue?._id}
                                                >
                                                  {
                                                    attributeValue?.attribute_value_name
                                                  }
                                                </option>
                                              )
                                            )}
                                          </select>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  "---"
                                )}
                              </td>

                              <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                                {selectedVariation ? (
                                  <>
                                    <span className="line-through text-gray-500">
                                      ৳ {selectedVariation?.variation_price}
                                    </span>{" "}
                                    ৳ {unitPrice}
                                  </>
                                ) : (
                                  <>
                                    <span className="line-through text-gray-500">
                                      ৳ {product?.offer_product?.product_price}
                                    </span>{" "}
                                    ৳ {unitPrice}
                                  </>
                                )}
                              </td>

                              <td className="whitespace-nowrap py-2.5 font-medium text-gray-700 px-4">
                                ৳ {subtotal}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Coupon section & shop subtotal and grand total  part */}
                </div>
                <DeliveryInformation
                  register={register}
                  userInfo={userInfo}
                  errors={errors}
                  setDivision={setDivision}
                  setDistrictId={setDistrictId}
                  setDistrict={setDistrict}
                  setIsOpenDistrict={setIsOpenDistrict}
                  isOpenDistrict={isOpenDistrict}
                  districtsData={districtsData}
                  division={division}
                  district={district}
                />
              </div>
            </div>
          </div>
          {/*All shop  subtotal and grand total  part right side cart summary */}
          <div className="md:col-span-2 space-y-6 lg:col-span-1">
            {" "}
            <OfferSummary
              shopSubtotals={shopSubtotals}
              shopTotal={shopTotal}
              totalDiscount={totalDiscount}
              shippingCharge={shippingCharge}
              shopGrandTotals={shopGrandTotals}
              division={division}
              loading={loading}
              userInfo={userInfo}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductTable;
