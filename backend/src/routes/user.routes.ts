import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { completeRegistrationSchema } from "../utils/schemas.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

// Admin-only routes (require complete registration)
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  userController.createUser
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  userController.listUsers
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  userController.getUser
);

// Authenticated user route (does NOT require complete registration)
router.put(
  "/:id/complete-registration",
  authenticate,
  validate(completeRegistrationSchema),
  userController.completeRegistration
);

export default router;
