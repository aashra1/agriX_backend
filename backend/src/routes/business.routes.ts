import { Router } from "express";
import { BusinessController } from "../controllers/business.controller";
import { authGuard, authGuardAdmin } from "../middleware/authGuard";
import uploadProfilePicture from "../multer/business.profile.multer";
import uploadBusinessDocument from "../multer/business.multer";

const router = Router();
const businessController = new BusinessController();

router.post(
  "/register",
  uploadProfilePicture.single("profilePicture"),
  businessController.register,
);

router.post("/login", businessController.login);

router.post(
  "/upload-document",
  authGuard,
  uploadBusinessDocument.single("document"),
  businessController.uploadDocument,
);

router.put(
  "/admin/approve/:businessId",
  authGuardAdmin,
  businessController.approve,
);

router.get("/admin/all", authGuardAdmin, businessController.getAll);

router.get("/profile", authGuard, businessController.getProfile);

router.put(
  "/profile/edit",
  authGuard,
  uploadProfilePicture.single("profilePicture"),
  businessController.editProfile,
);

export default router;
