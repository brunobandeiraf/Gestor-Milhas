import type { Request, Response, NextFunction } from "express";
import * as BonusPurchaseService from "../services/bonus-purchase.service.js";

export const createBonusPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bonusPurchase = await BonusPurchaseService.create(
      req.user!.userId,
      req.body
    );
    res.status(201).json(bonusPurchase);
  } catch (error) {
    next(error);
  }
};

export const listBonusPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchases = await BonusPurchaseService.findAllByUser(
      req.user!.userId
    );
    res.json(purchases);
  } catch (error) {
    next(error);
  }
};
