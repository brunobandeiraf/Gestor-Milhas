import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { issuanceSchema } from "../utils/schemas.js";
import * as issuanceController from "../controllers/issuance.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireCompleteRegistration,
  validate(issuanceSchema),
  issuanceController.createIssuance
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  issuanceController.listIssuances
);

export default router;
