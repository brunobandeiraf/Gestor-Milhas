import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { programSchema } from "../utils/schemas.js";
import * as programController from "../controllers/program.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  validate(programSchema),
  programController.createProgram
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  programController.listPrograms
);

router.get(
  "/:id",
  authenticate,
  requireCompleteRegistration,
  programController.getProgram
);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  validate(programSchema),
  programController.updateProgram
);

router.patch(
  "/:id/toggle-active",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  programController.toggleActiveProgram
);

export default router;
