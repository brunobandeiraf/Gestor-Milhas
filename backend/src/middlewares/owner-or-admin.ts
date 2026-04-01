import type { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client.js";
import { AuthorizationError } from "../utils/errors.js";

/**
 * Middleware that ensures data isolation between users.
 * Allows access if:
 * - The authenticated user is the resource owner (req.params.userId matches req.user.userId)
 * - The authenticated user is an ADMIN who manages the target user (adminId matches)
 */
export const ownerOrAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const targetUserId = req.params.userId;

  if (!req.user) {
    throw new AuthorizationError("Acesso negado");
  }

  // Owner can always access their own data
  if (req.user.userId === targetUserId) {
    next();
    return;
  }

  // Admin can access data of users they manage
  if (req.user.role === "ADMIN") {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { adminId: true },
    });

    if (targetUser && targetUser.adminId === req.user.userId) {
      next();
      return;
    }
  }

  throw new AuthorizationError("Acesso negado");
};
