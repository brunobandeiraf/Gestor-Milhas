import type { Request, Response, NextFunction } from "express";
import { AuthorizationError } from "../utils/errors.js";

/**
 * Middleware factory that checks if the authenticated user's role
 * is included in the allowed roles list.
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AuthorizationError("Acesso negado");
    }
    next();
  };
};
