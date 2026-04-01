import type { Request, Response, NextFunction } from "express";
import * as IssuanceService from "../services/issuance.service.js";

export const createIssuance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const issuance = await IssuanceService.create(req.user!.userId, req.body);
    res.status(201).json(issuance);
  } catch (error) {
    next(error);
  }
};

export const listIssuances = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const issuances = await IssuanceService.findAllByUser(req.user!.userId);
    res.json(issuances);
  } catch (error) {
    next(error);
  }
};
