import type { Request, Response, NextFunction } from "express";
import * as LoyaltyAccountService from "../services/loyalty-account.service.js";
import prisma from "../prisma/client.js";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";

export const listAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accounts = await LoyaltyAccountService.getByUser(req.user!.userId);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

export const getAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { id: req.params.id },
      include: { program: true },
    });

    if (!account) {
      throw new NotFoundError("Conta de fidelidade não encontrada");
    }

    if (account.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
      throw new AuthorizationError("Acesso negado a esta conta de fidelidade");
    }

    res.json(account);
  } catch (error) {
    next(error);
  }
};
