import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { bonusPurchaseSchema } from "../utils/schemas.js";
import * as bonusPurchaseController from "../controllers/bonus-purchase.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireCompleteRegistration,
  validate(bonusPurchaseSchema),
  bonusPurchaseController.createBonusPurchase
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  bonusPurchaseController.listBonusPurchases
);

export default router;
