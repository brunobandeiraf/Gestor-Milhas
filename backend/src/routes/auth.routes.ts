import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../utils/schemas.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);

export default router;
