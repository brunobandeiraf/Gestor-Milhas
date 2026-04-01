import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { transactionSchema } from "../utils/schemas.js";
import * as transactionController from "../controllers/transaction.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireCompleteRegistration,
  validate(transactionSchema),
  transactionController.createTransaction
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  transactionController.listTransactions
);

export default router;
