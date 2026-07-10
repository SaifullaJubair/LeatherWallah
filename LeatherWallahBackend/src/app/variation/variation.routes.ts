import express from "express";
import { verifyToken } from "../../middlewares/verify.token";
import {
  findVariationsByProduct,
  patchVariation,
} from "./variation.controllers";

const router = express.Router();

// Admin-only: the raw variation docs carry variation_buying_price (the shop's
// cost price), SKU, barcode and stock. This route used to be unauthenticated,
// so anyone who could guess a product _id could read the margins. Its only
// caller is the admin Page Content editor, which already sends credentials.
router.get(
  "/by-product/:productId",
  verifyToken("product_update"),
  findVariationsByProduct,
);

router.patch("/:id", verifyToken("product_update"), patchVariation);

export const VariationRoutes = router;
