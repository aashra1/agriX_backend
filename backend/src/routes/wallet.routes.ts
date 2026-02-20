import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { authGuard, authGuardBusiness } from "../middleware/authGuard";

const router = Router();
const walletController = new WalletController();

router.get("/balance", authGuard, walletController.getWalletBalance);
router.get("/transactions", authGuard, walletController.getTransactions);

router.get(
  "/business/balance",
  authGuard,
  authGuardBusiness,
  walletController.getBusinessWalletBalance,
);

router.get(
  "/business/transactions",
  authGuard,
  authGuardBusiness,
  walletController.getBusinessTransactions,
);

export default router;
