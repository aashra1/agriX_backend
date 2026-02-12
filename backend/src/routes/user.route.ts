import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authGuard, authGuardAdmin } from "../middleware/authGuard";
import uploadProfilePicture from "../multer/user.multer";

const router = Router();
const userController = new UserController();

// Public routes
router.post(
  "/register",
  uploadProfilePicture.single("profilePicture"),
  userController.register,
);

router.post("/login", userController.loginUser);

router.post("/request-password-reset", userController.sendResetPasswordEmail);

router.post("/reset-password/:token", userController.resetPassword);

// Protected routes (require authentication)
router.put("/change-password", authGuard, userController.changePassword);

router.get("/:userId", authGuard, userController.getUserProfile);

router.put(
  "/:userId",
  authGuard,
  uploadProfilePicture.single("profilePicture"),
  userController.editUserProfile,
);

router.delete("/:userId", authGuard, userController.deleteUserAccount);

// Admin only routes
router.get("/", authGuard, authGuardAdmin, userController.getAllUsers);

export default router;
