import { Router } from "express";
import { BusinessController } from "../controllers/business.controller";
import { authGuard, authGuardAdmin } from "../middleware/authGuard";
import uploadBusinessDoc from "../multer/business.profile.multer";

const router = Router();
const businessController = new BusinessController();

router.post("/register", businessController.register);
router.post("/login", businessController.login);

router.post(
  "/upload-document",
  authGuard,
  uploadBusinessDoc.single("document"),
  businessController.uploadDocument,
);

router.put(
  "/admin/approve/:businessId",
  authGuardAdmin,
  businessController.approve,
);

router.get("/admin/all", authGuardAdmin, businessController.getAll);

export default router;
