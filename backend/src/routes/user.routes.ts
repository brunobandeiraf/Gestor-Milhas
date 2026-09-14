import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { completeRegistrationSchema } from "../utils/schemas.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

// Public routes — activation flow (no auth required)
// Must be before /:id routes to avoid "activate" being matched as an id
router.get(
  "/activate/:token",
  userController.verifyActivationToken
);

router.post(
  "/activate",
  userController.activateAccount
);

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

// Admin edits any managed user (even PENDING)
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  userController.updateUser
);

// Admin validates a user directly (sets status to COMPLETE with full data)
router.put(
  "/:id/admin-validate",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  validate(completeRegistrationSchema),
  userController.adminValidateUser
);

// Admin deletes a PENDING user
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  userController.deleteUser
);

// Admin resends activation email to a PENDING user
router.post(
  "/:id/resend-activation",
  authenticate,
  authorize("ADMIN"),
  requireCompleteRegistration,
  userController.resendActivation
);

// Authenticated user route (does NOT require complete registration)
router.put(
  "/:id/complete-registration",
  authenticate,
  validate(completeRegistrationSchema),
  userController.completeRegistration
);

export default router;
