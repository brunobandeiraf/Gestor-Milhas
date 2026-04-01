import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get(
  "/user",
  authenticate,
  requireCompleteRegistration,
  dashboardController.getUserDashboard
);

router.get(
  "/admin",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  dashboardController.getAdminDashboard
);

router.get(
  "/metrics/user/:id",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  dashboardController.getUserMetrics
);

export default router;
