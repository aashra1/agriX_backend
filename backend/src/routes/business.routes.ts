import { Router } from "express";
import { BusinessController } from "../controllers/business.controller";
import { authGuard, authGuardAdmin } from "../middleware/authGuard";
import uploadBusinessDoc from "../multer/business.profile.multer";
import uploadProfilePicture from "../multer/business.profile.multer";

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
  uploadBusinessDoc.single("document"),
  businessController.uploadDocument,
);

router.put(
  "/admin/approve/:businessId",
  authGuardAdmin,
  businessController.approve,
);

router.get("/admin/all", authGuardAdmin, businessController.getAll);

router.get(
  "/profile",
  authGuard,
  (req, res, next) => {
    console.log("✅ GET /api/business/profile route hit!");
    console.log("User from authGuard:", req.user);
    next();
  },
  businessController.getProfile,
);

router.put("/profile/edit", authGuard, businessController.editProfile);

export default router;
