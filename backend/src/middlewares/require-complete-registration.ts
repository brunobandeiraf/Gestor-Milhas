import type { Request, Response, NextFunction } from "express";
import { AuthorizationError } from "../utils/errors.js";

/**
 * Middleware that blocks users with PENDING registration status
 * from accessing protected endpoints.
 */
export const requireCompleteRegistration = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.registrationStatus !== "COMPLETE") {
    throw new AuthorizationError(
      "Complete seu cadastro para acessar esta funcionalidade"
    );
  }
  next();
};
