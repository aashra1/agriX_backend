import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import {
  authGuard,
  authGuardBusiness,
  authGuardAdmin,
} from "../middleware/authGuard";

const router = Router();

router.use(authGuard);

router.post("/", orderController.createOrder);
router.get("/user", orderController.getUserOrders);
router.get("/:orderId", orderController.getOrderById);

router.get(
  "/business/orders",
  authGuardBusiness,
  orderController.getBusinessOrders,
);

router.put(
  "/:orderId/status",
  authGuardBusiness,
  orderController.updateOrderStatus,
);
router.put(
  "/:orderId/payment",
  authGuardBusiness,
  orderController.updatePaymentStatus,
);

export default router;
