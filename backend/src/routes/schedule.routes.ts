import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import * as scheduleController from "../controllers/schedule.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  scheduleController.listSchedules
);

export default router;
