/**
 * fix-stringified-objectids.ts — post-migration repair (2026-07-06).
 *
 * WHY THIS EXISTS
 * When the demo DB was migrated off Atlas onto the Contabo Coolify mongo:7
 * container, the reference fields that are declared as ObjectId in the schemas
 * came back as PLAIN STRINGS (24-hex) instead of BSON ObjectId. A `_id` stays a
 * real ObjectId, but every `*_id` reference field got stringified.
 *
 * The visible symptom: the storefront home page was EMPTY. `top_selling`,
 * `new_arrival`, `trending_product` and `just_for_you` all returned 0 items,
 * even though 6 products existed and `search_product` (which does a plain
 * find(), no $lookup) showed all 6. Those four endpoints use aggregation
 * `$lookup` from products.category_id -> categories._id with
 * `preserveNullAndEmptyArrays: false`. A String never equals an ObjectId in a
 * `$lookup`, so the category unwind dropped every product.
 *
 * WHAT IT FIXES (idempotent — safe to run twice; a no-op once clean):
 *   products.category_id, products.theme_id, products.product_publisher_id
 *   categories.category_publisher_id
 *   variations.product_id
 * Any 24-hex string in one of these fields is converted to a real ObjectId.
 *
 * It does NOT touch `explore_category_show` (the just_for_you category flag) —
 * that is seed/business data, set in seed-demo.ts, not a migration artifact.
 *
 * USAGE (one-off, against the target DB via MONGO_URI in .env):
 *   cd LeatherWallahBackend
 *   npx ts-node-dev --transpile-only src/scripts/fix-stringified-objectids.ts
 *
 * PREVENTION: migrate with `mongodump | mongorestore` (BSON, preserves types),
 * NOT `mongoexport | mongoimport` or hand-rolled JSON — JSON has no ObjectId
 * type so every reference degrades to a string and you land back here.
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Types } from "mongoose";

const HEX24 = /^[0-9a-fA-F]{24}$/;

// collection -> reference fields that must be ObjectId
const TARGETS: Record<string, string[]> = {
  products: ["category_id", "theme_id", "product_publisher_id"],
  categories: ["category_publisher_id"],
  variations: ["product_id"],
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    console.error("no db handle");
    process.exit(1);
  }
  console.log("[fix-oids] connected");

  let totalConverted = 0;

  for (const [coll, fields] of Object.entries(TARGETS)) {
    const c = db.collection(coll);
    for (const field of fields) {
      let converted = 0;
      const cursor = c.find({ [field]: { $type: "string" } });
      while (await cursor.hasNext()) {
        const doc: any = await cursor.next();
        const v = doc[field];
        if (typeof v === "string" && HEX24.test(v)) {
          await c.updateOne(
            { _id: doc._id },
            { $set: { [field]: new Types.ObjectId(v) } },
          );
          converted++;
        }
      }
      if (converted) {
        console.log(`[fix-oids] ${coll}.${field} -> converted ${converted}`);
        totalConverted += converted;
      }
    }
  }

  console.log(
    totalConverted === 0
      ? "[fix-oids] nothing to convert — already clean ✅"
      : `[fix-oids] done — ${totalConverted} field(s) converted ✅`,
  );

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  console.error("[fix-oids] failed:", e);
  process.exit(1);
});
