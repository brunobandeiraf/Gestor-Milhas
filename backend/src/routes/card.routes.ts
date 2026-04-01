import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { requireCompleteRegistration } from "../middlewares/require-complete-registration.js";
import { validate } from "../middlewares/validate.js";
import { cardSchema } from "../utils/schemas.js";
import * as cardController from "../controllers/card.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireCompleteRegistration,
  validate(cardSchema),
  cardController.createCard
);

router.get(
  "/",
  authenticate,
  requireCompleteRegistration,
  cardController.listCards
);

router.get(
  "/:id",
  authenticate,
  requireCompleteRegistration,
  cardController.getCard
);

router.put(
  "/:id",
  authenticate,
  requireCompleteRegistration,
  validate(cardSchema),
  cardController.updateCard
);

router.patch(
  "/:id/toggle-active",
  authenticate,
  requireCompleteRegistration,
  cardController.toggleActiveCard
);

export default router;
