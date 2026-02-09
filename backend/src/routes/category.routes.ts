import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authGuard, authGuardAdmin } from "../middleware/authGuard";

const router = Router();

// Admin-only routes
router.post("/", authGuard, authGuardAdmin, categoryController.addCategory);

router.get("/", categoryController.getCategories);

router.get("/:id", categoryController.getCategoryById);

router.put(
  "/:id",
  authGuard,
  authGuardAdmin,
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  authGuard,
  authGuardAdmin,
  categoryController.deleteCategory,
);

export default router;
