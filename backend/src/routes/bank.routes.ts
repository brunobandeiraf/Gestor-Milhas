import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import * as bankController from "../controllers/bank.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  bankController.createBank
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  bankController.listBanks
);

router.get(
  "/:id",
  authenticate,
  requireCompleteRegistration,
  bankController.getBank
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  bankController.updateBank
);

router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  bankController.deactivateBank
);

export default router;
