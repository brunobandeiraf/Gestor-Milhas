import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { clubSchema } from "../utils/schemas.js";
import * as clubController from "../controllers/club.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireCompleteRegistration,
  validate(clubSchema),
  clubController.createClub
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  clubController.listClubs
);

export default router;
