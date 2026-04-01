import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import * as airlineController from "../controllers/airline.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  airlineController.createAirline
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  airlineController.listAirlines
);

router.get(
  "/:id",
  authenticate,
  requireCompleteRegistration,
  airlineController.getAirline
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  airlineController.updateAirline
);

router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  airlineController.deactivateAirline
);

export default router;
