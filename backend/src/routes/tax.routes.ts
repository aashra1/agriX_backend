import { Router } from "express";
import { TaxController } from "../controllers/tax.controller";
import { authGuard } from "../middleware/authGuard";

const router = Router();
const taxController = new TaxController();

router.get("/business", authGuard, taxController.getBusinessTaxLiabilities);
router.post("/pay", authGuard, taxController.payTaxes);

export default router;
