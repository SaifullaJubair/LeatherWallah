import VariationModel from "./variation.model";
import { IVariationInterface } from "./variation.interface";

/**
 * Rows for the admin Page Content variation table. Its only consumer.
 *
 * Projected, not the whole doc: the table shows name / weight / badge / price /
 * stock, and has no business shipping variation_buying_price (the shop's cost
 * price), SKU or barcode to the browser. The route is admin-authenticated now,
 * so this is defence in depth rather than the fix — but there's no reason for
 * the margin to leave the server on this call.
 */
export const findVariationsByProductService = async (productId: string) => {
  return VariationModel.find({ product_id: productId })
    .select(
      "_id variation_name variation_weight_grams variation_badge_text variation_badge_icon_key variation_price variation_discount_price variation_quantity",
    )
    .lean();
};

export const updateVariationService = async (
  _id: string,
  data: Partial<IVariationInterface>,
) => {
  return VariationModel.updateOne({ _id }, data, { runValidators: true });
};
