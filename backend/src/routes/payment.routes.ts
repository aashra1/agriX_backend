import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authGuard, authGuardAdmin } from "../middleware/authGuard";

const router = Router();
const paymentController = new PaymentController();

router.post(
  "/khalti/initiate",
  authGuard,
  paymentController.initiateKhaltiPayment,
);
router.post("/khalti/verify", authGuard, paymentController.verifyKhaltiPayment);
router.get("/user", authGuard, paymentController.getUserPayments);
router.get("/order/:orderId", authGuard, paymentController.getPaymentByOrderId);

router.get(
  "/admin/all",
  authGuard,
  authGuardAdmin,
  paymentController.getAllPayments,
);

router.post("/khalti/webhook", paymentController.khaltiWebhook);

export default router;
