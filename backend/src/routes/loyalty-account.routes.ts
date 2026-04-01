import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import * as loyaltyAccountController from "../controllers/loyalty-account.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  loyaltyAccountController.listAccounts
);

router.get(
  "/:id",
  authenticate,
  requireCompleteRegistration,
  loyaltyAccountController.getAccount
);

export default router;
