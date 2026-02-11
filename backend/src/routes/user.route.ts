import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import uploadProfilePicture from "../multer/user.multer";
import { authGuard } from "../middleware/authGuard";

const router = Router();
const userController = new UserController();

router.post(
  "/register",
  uploadProfilePicture.single("profilePicture"),
  userController.register,
);

router.post("/login", userController.loginUser);
router.get("/", userController.getAllUsers);

router.get("/:userId", authGuard, userController.getUserProfile);
router.delete("/:userId", authGuard, userController.deleteUserAccount);

router.put(
  "/:userId",
  authGuard,
  uploadProfilePicture.single("profilePicture"),
  userController.editUserProfile,
);

router.post("/request-password-reset", userController.sendResetPasswordEmail);
router.post("/reset-password/:token", userController.resetPassword);

export default router;
