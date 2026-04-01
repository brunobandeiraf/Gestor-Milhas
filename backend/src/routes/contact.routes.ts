import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { contactFormSchema } from "../utils/schemas.js";
import * as contactController from "../controllers/contact.controller.js";

const router = Router();

// POST / — public route, no authentication required
router.post("/", validate(contactFormSchema), contactController.submitContact);

export default router;
