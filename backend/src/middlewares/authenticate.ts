import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../utils/errors.js";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  registrationStatus: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
};

/**
 * Middleware that validates JWT from Authorization header
 * and injects decoded user payload into req.user.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Token não fornecido");
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      registrationStatus: decoded.registrationStatus,
    };
    next();
  } catch {
    throw new AuthenticationError("Token inválido ou expirado");
  }
};
