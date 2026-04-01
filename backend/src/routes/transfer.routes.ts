import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { transferSchema } from "../utils/schemas.js";
import * as transferController from "../controllers/transfer.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireCompleteRegistration,
  validate(transferSchema),
  transferController.createTransfer
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  transferController.listTransfers
);

export default router;
