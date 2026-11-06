/**
 * order.stock.ts — central stock movement for orders (Phase B, B2).
 *
 * WHY: stock used to be decremented at DELIVERY in 6 scattered places (manual
 * order update + steadfast sync + pathao single/bulk sync + 2 webhooks), each
 * with a raw `$inc -quantity` and NO guard — two simultaneous buyers could
 * drive stock negative (oversell). Owner decision (2026-05-25): decrement at
 * PLACEMENT with a guard, and RESTOCK on cancel/return. All movement now goes
 * through this one module so the rules live in a single place.
 *
 * Decrement uses a conditional update (`quantity >= qty`) so it is atomic and
 * can never go negative — if it can't be satisfied the placement transaction
 * aborts with "Out of stock". Restock is guarded by the order's `stock_restored`
 * flag so cancel→return (or repeated webhook hits) can't add stock back twice.
 *
 * NOTE: works on the LEGACY stock fields (`product_quantity` /
 * `variation_quantity`) for now — combination-stock migration is a later step
 * (Phase A follow-up #6). The shape here doesn't change when that lands.
 */

import mongoose from "mongoose";
import ProductModel from "../product/product.model";
import VariationModel from "../variation/variation.model";
import OrderProductModel from "../orderProducts/orderProduct.model";
import OrderModel from "./order.model";
import ApiError from "../../errors/ApiError";

export interface StockLine {
  product_id: any;
  variation_id?: any;
  product_quantity: number;
}

/**
 * Atomically decrement stock for each line, guarded so it never goes negative.
 * Throws ApiError(409) "Out of stock" if any line can't be fully satisfied.
 * MUST run inside the placement transaction (pass the session).
 */
export const decrementStockForLines = async (
  lines: StockLine[],
  session: mongoose.ClientSession,
): Promise<void> => {
  for (const line of lines) {
    const qty = Math.max(1, Number(line?.product_quantity) || 1);

    if (line?.variation_id) {
      const res = await VariationModel.updateOne(
        {
          _id: line.variation_id,
          product_id: line.product_id,
          variation_quantity: { $gte: qty },
        },
        { $inc: { variation_quantity: -qty } },
        { session },
      );
      if (res.modifiedCount === 0) {
        const v: any = await VariationModel.findById(line.variation_id)
          .select("variation_name variation_quantity")
          .session(session);
        throw new ApiError(
          409,
          `Out of stock: ${v?.variation_name || "variation"} (available ${
            v?.variation_quantity ?? 0
          }, requested ${qty}).`,
        );
      }
    } else {
      const res = await ProductModel.updateOne(
        { _id: line.product_id, product_quantity: { $gte: qty } },
        { $inc: { product_quantity: -qty } },
        { session },
      );
      if (res.modifiedCount === 0) {
        const p: any = await ProductModel.findById(line.product_id)
          .select("product_name product_quantity")
          .session(session);
        throw new ApiError(
          409,
          `Out of stock: ${p?.product_name || "product"} (available ${
            p?.product_quantity ?? 0
          }, requested ${qty}).`,
        );
      }
    }
  }
};

/**
 * Add stock back for a cancelled/returned order. Idempotent: only restores once
 * (guarded by order.stock_restored). Safe to call from any cancel/return path,
 * with or without a session. Returns true if it actually restocked.
 */
export const restockOrder = async (
  orderId: any,
  session?: mongoose.ClientSession,
): Promise<boolean> => {
  const orderQuery = OrderModel.findById(orderId).select("stock_restored");
  const order: any = session
    ? await orderQuery.session(session)
    : await orderQuery;
  if (!order) return false;
  if (order.stock_restored) return false; // already restocked

  const opQuery = OrderProductModel.find({
    order_id: String(orderId),
  }).select("product_id variation_id product_quantity");
  const orderProducts: any[] = session
    ? await opQuery.session(session)
    : await opQuery;

  for (const op of orderProducts) {
    const qty = Math.max(1, Number(op?.product_quantity) || 1);
    if (op?.variation_id) {
      await VariationModel.updateOne(
        { _id: op.variation_id },
        { $inc: { variation_quantity: qty } },
        session ? { session } : {},
      );
    } else {
      await ProductModel.updateOne(
        { _id: op.product_id },
        { $inc: { product_quantity: qty } },
        session ? { session } : {},
      );
    }
  }

  await OrderModel.updateOne(
    { _id: orderId },
    { $set: { stock_restored: true } },
    session ? { session } : {},
  );
  return true;
};

/**
 * Admin order-line edit (2026-11-06) — single-LINE stock move, deliberately
 * separate from decrementStockForLines/restockOrder above:
 *   - decrementStockForLines is PLACEMENT-only (loops a whole cart).
 *   - restockOrder is CANCEL/RETURN-only, guarded by the order-level
 *     `stock_restored` flag — reusing it for a one-line edit would wrongly
 *     flip that flag, so a LATER full cancel would skip restocking every
 *     other untouched line on the order.
 * These two never touch `stock_restored`. Caller MUST run both inside one
 * transaction (restock old, then decrement new) and abort on failure so a
 * failed new-side decrement never leaves the old line's stock restored
 * without the new line actually getting it (no partial apply).
 */

/** Restock one line's quantity. No-ops (does not throw) if the referenced
 * product/variation no longer exists — an order placed before the item was
 * deleted from the catalog must not block an edit to its OTHER lines. */
export const restockLine = async (
  line: StockLine,
  session: mongoose.ClientSession,
): Promise<void> => {
  const qty = Math.max(1, Number(line?.product_quantity) || 1);
  if (line?.variation_id) {
    await VariationModel.updateOne(
      { _id: line.variation_id },
      { $inc: { variation_quantity: qty } },
      { session },
    );
  } else {
    await ProductModel.updateOne(
      { _id: line.product_id },
      { $inc: { product_quantity: qty } },
      { session },
    );
  }
};

/** Decrement one line's quantity, atomically guarded (`$gte`) so it can never
 * go negative. Throws ApiError(409) "Out of stock" if unsatisfiable — caller
 * must abort the transaction so the paired restockLine call above this one
 * is rolled back too. */
export const decrementLine = async (
  line: StockLine,
  session: mongoose.ClientSession,
): Promise<void> => {
  const qty = Math.max(1, Number(line?.product_quantity) || 1);
  if (line?.variation_id) {
    const res = await VariationModel.updateOne(
      {
        _id: line.variation_id,
        product_id: line.product_id,
        variation_quantity: { $gte: qty },
      },
      { $inc: { variation_quantity: -qty } },
      { session },
    );
    if (res.modifiedCount === 0) {
      const v: any = await VariationModel.findById(line.variation_id)
        .select("variation_name variation_quantity")
        .session(session);
      throw new ApiError(
        409,
        `Out of stock: ${v?.variation_name || "variation"} (available ${
          v?.variation_quantity ?? 0
        }, requested ${qty}).`,
      );
    }
  } else {
    const res = await ProductModel.updateOne(
      { _id: line.product_id, product_quantity: { $gte: qty } },
      { $inc: { product_quantity: -qty } },
      { session },
    );
    if (res.modifiedCount === 0) {
      const p: any = await ProductModel.findById(line.product_id)
        .select("product_name product_quantity")
        .session(session);
      throw new ApiError(
        409,
        `Out of stock: ${p?.product_name || "product"} (available ${
          p?.product_quantity ?? 0
        }, requested ${qty}).`,
      );
    }
  }
};

/**
 * Phase F — increment `sold_count` on each product line of an order. Called at
 * placement (after decrementStockForLines so failed-stock orders aren't
 * counted). Uses the order's line quantity so a qty-3 order bumps sold_count
 * by 3, not 1.
 */
export const bumpSoldCounts = async (
  lines: StockLine[],
  session: mongoose.ClientSession,
): Promise<void> => {
  for (const line of lines) {
    const qty = Math.max(1, Number(line?.product_quantity) || 1);
    await ProductModel.updateOne(
      { _id: line.product_id },
      { $inc: { sold_count: qty } },
      { session },
    );
  }
};
