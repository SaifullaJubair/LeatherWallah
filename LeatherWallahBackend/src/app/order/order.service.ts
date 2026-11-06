import mongoose from "mongoose";
import { IOrderInterface, orderSearchableField } from "./order.interface";
import OrderModel from "./order.model";
import ApiError from "../../errors/ApiError";
import OrderProductModel from "../orderProducts/orderProduct.model";
import { USER_PUBLIC_PROJECTION } from "../user/user.interface";
import { restockLine, decrementLine } from "./order.stock";
import { recomputeLineForEdit } from "./order.recompute";

// Create A Order
export const postOrderServices = async (
  data: IOrderInterface,
  session: mongoose.ClientSession,
): Promise<IOrderInterface | {} | any> => {
  const createOrder: IOrderInterface | {} | any = await OrderModel.create(
    [data],
    { session },
  );
  if (!createOrder) throw new ApiError(400, "Order Create Failed !");
  return createOrder?.[0];
};

// Get Order Tracking Info
export const getOrderTrackingInfoService = async (
  order_id: string,
): Promise<IOrderInterface | any> => {
  const order_info = await OrderModel.findOne({
    invoice_id: order_id,
  })
    .select("-internal_note") // Phase A — admin-only field, never on public tracking
    .populate([
      {
        path: "customer_id",
        model: "users",
        select: "user_name user_phone user_image",
      },
    ]);

  const order_products = await OrderProductModel.find({
    order_id: order_info?._id?.toString(),
  }).populate([
    {
      path: "product_id",
      model: "products",
      select: "product_name main_image",
    },
    {
      path: "variation_id",
      model: "variations",
      select: "variation_name variation_image",
    },
  ]);

  return { order_info, order_products };
};

// Get A Customer All Orders
export const getACustomerAllOrderServices = async (
  limit: number,
  skip: number,
  searchTerm: any,
  customer_id: any,
): Promise<any> => {
  try {
    const andCondition = [];
    if (searchTerm) {
      andCondition.push({
        $or: orderSearchableField?.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      });
    }
    andCondition.push({ customer_id });
    const whereCondition =
      andCondition.length > 0 ? { $and: andCondition } : {};

    const getAllOrder = await OrderModel.find(whereCondition)
      .select("-internal_note") // Phase A — admin-only field, never on customer history
      .populate("customer_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return getAllOrder;
  } catch (error) {
    console.log(error);
    throw new Error("Could not fetch customer orders");
  }
};

// Get Dashboard Orders (all order_status filter support)
export const getDashboardOrderServices = async (
  limit: number,
  skip: number,
  searchTerm: any,
  order_status: any,
  courier_type?: any,
  order_source?: any,
  order_type?: any,
): Promise<any> => {
  const andCondition: any[] = [];

  if (searchTerm) {
    andCondition.push({
      $or: orderSearchableField?.map((field) => ({
        [field]: { $regex: searchTerm, $options: "i" },
      })),
    });
  }

  if (order_status && order_status !== "undefined" && order_status !== "null") {
    andCondition.push({ order_status });
  }

  // ✅ courier_type filter (Pathao tab এর জন্য)
  if (courier_type && courier_type !== "undefined" && courier_type !== "null") {
    andCondition.push({ courier_type });
  }

  // D18 M3 — POS Orders tab: filter by order_source
  if (order_source && order_source !== "undefined" && order_source !== "null") {
    andCondition.push({ order_source });
  }

  // Order Unification Phase A — order_type filter (offer/regular/... chips)
  if (order_type && order_type !== "undefined" && order_type !== "null") {
    andCondition.push({ order_type });
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const getAllOrder = await OrderModel.find(whereCondition)
    .populate([
      {
        path: "customer_id",
        model: "users",
        select: USER_PUBLIC_PROJECTION,
      },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return await Promise.all(
    getAllOrder?.map(async (order: any) => {
      const plainOrder = order?.toObject();
      const orderProduct = await OrderProductModel.find({
        order_id: plainOrder?._id?.toString(),
      }).select("product_id variation_id product_quantity");
      return { ...plainOrder, order_products: orderProduct };
    }),
  );
};

// Get Steadfast Orders
export const getSteadfastOrderServices = async (
  limit: number,
  skip: number,
  searchTerm: any,
  steadfast_status: any,
): Promise<any> => {
  const andCondition: any[] = [{ courier_type: "steadfast" }];

  if (searchTerm) {
    andCondition.push({
      $or: orderSearchableField?.map((field) => ({
        [field]: { $regex: searchTerm, $options: "i" },
      })),
    });
  }

  if (
    steadfast_status &&
    steadfast_status !== "undefined" &&
    steadfast_status !== "null" &&
    steadfast_status !== "all"
  ) {
    andCondition.push({ steadfast_status });
  }

  const whereCondition = { $and: andCondition };

  const getAllOrder = await OrderModel.find(whereCondition)
    .populate([
      {
        path: "customer_id",
        model: "users",
        select: USER_PUBLIC_PROJECTION,
      },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return await Promise.all(
    getAllOrder?.map(async (order: any) => {
      const plainOrder = order?.toObject();
      const orderProduct = await OrderProductModel.find({
        order_id: plainOrder?._id?.toString(),
      }).select("product_id variation_id product_quantity");
      return { ...plainOrder, order_products: orderProduct };
    }),
  );
};

// ✅ Get Pathao Orders
export const getPathaoOrderServices = async (
  limit: number,
  skip: number,
  searchTerm: any,
  pathao_status?: any,
): Promise<any> => {
  const andCondition: any[] = [{ courier_type: "pathao" }];

  if (searchTerm) {
    andCondition.push({
      $or: orderSearchableField?.map((field) => ({
        [field]: { $regex: searchTerm, $options: "i" },
      })),
    });
  }

  if (
    pathao_status &&
    pathao_status !== "undefined" &&
    pathao_status !== "null" &&
    pathao_status !== "all"
  ) {
    andCondition.push({ pathao_status });
  }

  const whereCondition = { $and: andCondition };

  const getAllOrder = await OrderModel.find(whereCondition)
    .populate([
      {
        path: "customer_id",
        model: "users",
        select: USER_PUBLIC_PROJECTION,
      },
    ])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return await Promise.all(
    getAllOrder?.map(async (order: any) => {
      const plainOrder = order?.toObject();
      const orderProduct = await OrderProductModel.find({
        order_id: plainOrder?._id?.toString(),
      }).select("product_id variation_id product_quantity");
      return { ...plainOrder, order_products: orderProduct };
    }),
  );
};

// Get A Order Details With Order Products
export const getAOrderWithOrderProductsServices = async (
  order_id: any,
): Promise<{ order: IOrderInterface; order_products: any[] } | null> => {
  const order = await OrderModel.findOne({ _id: order_id }).populate([
    {
      path: "customer_id",
      model: "users",
      select: USER_PUBLIC_PROJECTION,
    },
    {
      path: "coupon_id",
      model: "coupons",
      select:
        "coupon_code coupon_type coupon_amount coupon_max_amount coupon_customer_type coupon_product_type",
    },
  ]);

  if (!order) throw new ApiError(404, "Order not found");

  const orderProducts = await OrderProductModel.find({
    order_id: order?._id?.toString(),
  }).populate([
    {
      path: "product_id",
      model: "products",
      // product_sku / barcode / barcode_image surfaced for the admin order
      // details page (SKU column + "Print label" button per Phase D Bug #3).
      // Snapshots on the orderProduct doc are write-once at placement, but
      // the live product carries the printable barcode image URL.
      select:
        "product_name main_image product_sku barcode barcode_image barcode_format",
      populate: [
        {
          path: "category_id",
          model: "categories",
          select: "category_name category_slug category_status",
        },
      ],
    },
    {
      path: "variation_id",
      model: "variations",
      select:
        "variation_name variation_image variation_sku variation_barcode variation_barcode_image variation_barcode_format",
    },
    { path: "campaign_id", model: "campaigns" },
  ]);

  const filteredOrderProducts = orderProducts?.map((product: any) => {
    if (product?.campaign_id) {
      const { campaign_products } = product?.campaign_id;
      const campaignDetails = campaign_products?.find(
        (cp: any) =>
          cp?.campaign_product_id.toString() ==
          product?.product_id?._id.toString(),
      );
      product.campaign_id = campaignDetails;
    }
    return product;
  });

  // Order Unification Phase A — this GET is public (`/:order_id`, used by the
  // invoice + success page with no auth). Strip the admin-only internal_note so
  // it never reaches a storefront customer. The admin order-detail page reads
  // internal_note from the dashboard list endpoint instead (admin-gated).
  const safeOrder: any = order ? (order as any).toObject?.() ?? order : order;
  if (safeOrder) delete safeOrder.internal_note;

  return { order: safeOrder, order_products: filteredOrderProducts };
};

// Update A Order
// A2.3 — allowed forward / terminal order-status transitions. The FE dropdown
// only offers these, but a crafted PATCH could otherwise jump pending→completed
// or revive a cancelled order; this is the server-side guard. Mirrors the
// (previously dead) OrderTable dropdown map.
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["on_hold", "confirmed", "cancel"],
  on_hold: ["confirmed", "cancel"],
  confirmed: ["processing", "cancel"],
  processing: ["shipped", "cancel"],
  shipped: ["delivered", "return"],
  delivered: ["completed", "return"],
  // terminal — no onward transitions
  completed: [],
  cancel: [],
  return: [],
};

export const updateOrderServices = async (
  data: IOrderInterface,
  _id: string,
  session: mongoose.ClientSession,
): Promise<IOrderInterface | any> => {
  const updateOrderInfo = await OrderModel.findOne({ _id });
  if (!updateOrderInfo) throw new ApiError(400, "Order Not Found !");

  // Guard the status change (only when the PATCH actually changes order_status).
  const nextStatus = (data as any)?.order_status;
  const currentStatus = (updateOrderInfo as any)?.order_status;
  if (nextStatus && nextStatus !== currentStatus) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ApiError(
        400,
        `Invalid order status change: "${currentStatus}" → "${nextStatus}".`,
      );
    }
  }

  return await OrderModel.updateOne({ _id }, data, {
    session,
    runValidators: true,
  });
};

// An order whose parcel is already with a courier must not have its line
// items edited — the courier's weight/COD-amount is already based on the
// original items. Mirrors the admin's own `isCourierLocked` in
// LeatherWallahAdmin/src/components/Order/orderStatus.constants.js EXACTLY
// (consignment-id presence, not order_status) so the two can never diverge —
// an order can sit in "processing" with no consignment yet (editable) or get
// manually re-marked after a consignment already exists via a webhook race.
export const isCourierLockedServer = (order: any): boolean =>
  (order?.courier_type === "steadfast" && !!order?.steadfast_consignment_id) ||
  (order?.courier_type === "pathao" && !!order?.consignment_id);

const currencyLog = (n: number) => `৳${n}`;

/**
 * Admin order-line edit (2026-11-06) — change ONE line's variation and/or
 * quantity on a not-yet-shipped order. Owner's confirmed business flow: when
 * admin calls to confirm a pending COD order, the customer sometimes wants a
 * different size/qty; previously the only option was cancel + ask the
 * customer to reorder (customer usually doesn't bother).
 *
 * MUST run inside the caller's transaction (session). Order:
 *   1. Guard: order not courier-locked.
 *   2. Guard: the line belongs to this order.
 *   3. Price the NEW product/variation via recomputeLineForEdit (keeps
 *      coupon/loyalty on the order untouched — see that function's comment).
 *   4. Stock: restock the OLD line's qty, then decrement the NEW variation's
 *      qty — both inside the one transaction; a failed decrement aborts the
 *      whole edit (restockLine/decrementLine never touch stock_restored).
 *   5. Overwrite the line's price fields AND all six snapshot fields
 *      together (never partially — a half-updated snapshot reproduces the
 *      "wrong size on the label" bug this feature exists to fix).
 *   6. Re-sum the order's totals from its (now-edited) lines, preserving
 *      discount_amount/loyalty_redeem_amount/coupon_id exactly as they were.
 */
export const updateOrderLineServices = async (
  orderId: string,
  lineId: string,
  newVariationId: string | undefined,
  newQuantity: number | undefined,
  adminUserId: any,
  session: mongoose.ClientSession,
): Promise<{
  line: any;
  order: any;
  price_changed: boolean;
  old_unit_price: number;
  new_unit_price: number;
}> => {
  const order: any = await OrderModel.findById(orderId).session(session);
  if (!order) throw new ApiError(404, "Order not found.");

  if (isCourierLockedServer(order)) {
    throw new ApiError(
      400,
      `This order is already with the courier (${order?.courier_type}). Line items can no longer be edited.`,
    );
  }

  const line: any = await OrderProductModel.findOne({
    _id: lineId,
    order_id: orderId,
  }).session(session);
  if (!line) throw new ApiError(404, "Order line not found on this order.");

  const quantity = Math.max(
    1,
    Number(newQuantity ?? line.product_quantity) || 1,
  );
  const variationId = newVariationId ?? line.variation_id ?? undefined;

  // Restock the OLD line first (its product/variation may since have been
  // deleted from the catalog — restockLine no-ops rather than throwing, so
  // that never blocks editing this line).
  await restockLine(
    {
      product_id: line.product_id,
      variation_id: line.variation_id,
      product_quantity: line.product_quantity,
    },
    session,
  );

  // Price + snapshot the NEW product/variation. Throws if the product (or
  // the requested variation on it) doesn't exist — the admin UI only ever
  // offers currently-live variations, so this only fires on a stale request.
  const priced = await recomputeLineForEdit(
    line.product_id,
    variationId,
    quantity,
    line.campaign_id,
    order.customer_id,
    session,
  );

  // Decrement the NEW side. On failure this throws (409 Out of stock) and
  // the caller's transaction aborts — the restock above is rolled back too,
  // so stock never ends up partially moved.
  await decrementLine(
    { product_id: line.product_id, variation_id: variationId, product_quantity: quantity },
    session,
  );

  const old_unit_price = Number(line.product_unit_final_price) || 0;
  const new_unit_price = priced.product_unit_final_price;
  const price_changed = old_unit_price !== new_unit_price;

  await OrderProductModel.updateOne(
    { _id: lineId },
    {
      $set: {
        variation_id: variationId,
        product_quantity: quantity,
        product_unit_price: priced.product_unit_price,
        product_unit_final_price: priced.product_unit_final_price,
        product_grand_total_price: priced.product_grand_total_price,
        product_main_price: priced.product_main_price,
        product_main_discount_price: priced.product_main_discount_price,
        vat_rate: priced.vat_pct,
        vat_amount: Math.round(
          (priced.product_grand_total_price * priced.vat_pct) / 100,
        ),
        discount_source: priced.discount_source,
        // Snapshot refresh — all six together, never partial (see fn doc).
        product_sku_snapshot: priced.product_sku_snapshot,
        variation_sku_snapshot: priced.variation_sku_snapshot,
        product_barcode_snapshot: priced.product_barcode_snapshot,
        variation_barcode_snapshot: priced.variation_barcode_snapshot,
        product_name_snapshot: priced.product_name_snapshot,
        product_image_snapshot: priced.product_image_snapshot,
      },
    },
    { session },
  );

  // Re-sum order-level totals from ALL this order's lines (the edited one
  // now carries its new price). discount_amount / loyalty_redeem_amount /
  // coupon_id are intentionally left untouched — see recomputeLineForEdit's
  // doc comment for why re-validating them here would be wrong.
  const allLines = await OrderProductModel.find({ order_id: orderId })
    .select("product_grand_total_price vat_amount")
    .session(session);
  const sub_total_amount = allLines.reduce(
    (s, l: any) => s + (Number(l.product_grand_total_price) || 0),
    0,
  );
  const vat_amount = allLines.reduce(
    (s, l: any) => s + (Number(l.vat_amount) || 0),
    0,
  );
  const discount_amount = Number(order.discount_amount) || 0;
  const shipping_cost = Number(order.shipping_cost) || 0;
  const grand_total_amount =
    sub_total_amount - discount_amount + vat_amount + shipping_cost;

  // Lightweight structured audit trail, appended to internal_note (never
  // exposed to the customer) rather than overwriting any existing note.
  const timeNow =
    new Date().toISOString().split("T")[0] + " " + new Date().toLocaleTimeString();
  const auditLine = `[EDIT ${timeNow} by ${adminUserId}] variation ${
    line.variation_id || "-"
  }→${variationId || "-"}, qty ${line.product_quantity}→${quantity}, price ${currencyLog(old_unit_price)}→${currencyLog(new_unit_price)}`;
  const nextNote = order.internal_note
    ? `${order.internal_note}\n${auditLine}`
    : auditLine;

  await OrderModel.updateOne(
    { _id: orderId },
    {
      $set: {
        sub_total_amount,
        vat_amount,
        grand_total_amount,
        internal_note: nextNote,
      },
    },
    { session, runValidators: true },
  );

  const updatedLine = await OrderProductModel.findById(lineId).session(session);
  const updatedOrder = await OrderModel.findById(orderId).session(session);

  return {
    line: updatedLine,
    order: updatedOrder,
    price_changed,
    old_unit_price,
    new_unit_price,
  };
};
