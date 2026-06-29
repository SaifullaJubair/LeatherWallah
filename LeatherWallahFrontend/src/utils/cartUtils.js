export const productPrice = (product) => {
  if (product?.flash_sale_details) {
    return product?.flash_sale_details?.flash_sale_product
      ?.flash_sale_product_price;
  } else if (product?.campaign_details) {
    return product?.campaign_details?.campaign_product?.campaign_product_price;
  } else if (product?.is_variation) {
    return product?.variations?.variation_discount_price
      ? product?.variations?.variation_discount_price
      : product?.variations?.variation_price;
  } else {
    return product?.product_discount_price
      ? product?.product_discount_price
      : product?.product_price;
  }
};
export const calculateSubtotal = (product, products) => {
  const price = productPrice(product);

  const quantity = products?.find(
    (item) =>
      item?.productId === product?._id &&
      (product?.variations?._id
        ? item?.variation_product_id === product?.variations?._id
        : true)
  )?.quantity;

  return price * (quantity || 1);
};

export const calculationCouponProductPrice = (price, coupon) => {
  if (
    coupon?.coupon_product_type === "specific" &&
    coupon?.coupon_type === "percentage"
  ) {
    const discountPrice = Math.round((price * coupon?.coupon_amount) / 100);
    if (discountPrice > coupon?.coupon_max_amount) {
      if (coupon?.coupon_max_amount > price) {
        return 0;
      } else {
        return price - coupon?.coupon_max_amount;
      }
    }
    return price - discountPrice;
  } else if (
    coupon?.coupon_product_type === "specific" &&
    coupon?.coupon_type === "fixed"
  ) {
    if (coupon?.coupon_amount > price) {
      return 0;
    } else {
      return price - coupon?.coupon_amount;
    }
  }
  return price;
};
