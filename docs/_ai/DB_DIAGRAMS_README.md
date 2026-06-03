# Database Diagrams — how to view

Two ER diagrams of the FruitSnacks data model, in **DBML** (the format dbdiagram.io uses):

- **`DB_CURRENT.dbml`** — the database exactly as it is today (read from the live Mongoose models).
- **`DB_PROPOSED.dbml`** — the target after the big-bone phases (variation engine, nested category, backend pricing, online payment) from `BACKEND_AUDIT.md`.

## To see it as a picture (editable, drag-around)
1. Open **https://dbdiagram.io/d** (free, no signup needed to view).
2. Open the `.dbml` file, copy all, paste into the left editor.
3. The ER diagram renders on the right — drag boxes around, export PNG/PDF/SQL.

## Note: this is MongoDB, not SQL
The sample picture you shared is a SQL schema (integer ids, foreign keys, every relation its own table). FruitSnacks is **MongoDB**, so two things differ:
- **`Ref` lines** = an `ObjectId` field + Mongoose `populate()` (the NoSQL equivalent of a foreign key). dbdiagram draws them the same way.
- **Embedded arrays** (e.g. `product.faqs[]`, `cart.cart_products[]`, `attribute.attribute_values[]`) live *inside* a document — there's no separate table. DBML can't draw an array column, so those are written in each table's **Note**. That's why some boxes have only `_id` + a Note: the real richness is the embedded sub-document.

## The one diagram that matters most
Compare `variations` in CURRENT vs `product_variant_types` + `product_stocks` in PROPOSED — that's the keystone change (flat free-text variation → attribute-linked axes + price-delta + combination-stock matrix). Everything else is additive.
