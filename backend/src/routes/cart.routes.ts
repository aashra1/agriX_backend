import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { authGuard } from "../middleware/authGuard";

const router = Router();

router.use(authGuard);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/item/:productId", cartController.updateCartItem);
router.delete("/item/:productId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);
router.get("/count", cartController.getCartCount);

export default router;
