import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authGuard, authGuardBusiness } from "../middleware/authGuard";
import uploadProductImage from "../multer/product.multer";

const router = Router();

router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/:id", productController.getProductById);

router.post(
  "/",
  authGuard,
  authGuardBusiness,
  uploadProductImage.single("image"),
  productController.addProduct,
);

router.get(
  "/business",
  authGuard,
  authGuardBusiness,
  productController.getBusinessProducts,
);

router.put(
  "/:id",
  authGuard,
  authGuardBusiness,
  uploadProductImage.single("image"),
  productController.updateProduct,
);

router.delete(
  "/:id",
  authGuard,
  authGuardBusiness,
  productController.deleteProduct,
);

export default router;
