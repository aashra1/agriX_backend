import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authGuard, authGuardAdmin } from "../middleware/authGuard";
import uploadProfilePicture from "../multer/user.multer";

const router = Router();
const userController = new UserController();

router.get("/profile", authGuard, userController.getMyProfile);
router.put(
  "/profile",
  authGuard,
  uploadProfilePicture.single("profilePicture"),
  userController.editMyProfile,
);

router.put("/change-password", authGuard, userController.changePassword);
router.post("/request-password-reset", userController.sendResetPasswordEmail);
router.post("/reset-password/:token", userController.resetPassword);
router.get(
  "/:userId",
  authGuard,
  authGuardAdmin,
  userController.getUserProfile,
);
router.put(
  "/:userId",
  authGuard,
  authGuardAdmin,
  uploadProfilePicture.single("profilePicture"),
  userController.editUserProfile,
);
router.delete(
  "/:userId",
  authGuard,
  authGuardAdmin,
  userController.deleteUserAccount,
);
router.post(
  "/register",
  uploadProfilePicture.single("profilePicture"),
  userController.register,
);
router.post("/login", userController.loginUser);
router.get("/", authGuard, authGuardAdmin, userController.getAllUsers);

export default router;
