import type { Request, Response, NextFunction } from "express";
import * as TransferService from "../services/transfer.service.js";

export const createTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transfer = await TransferService.create(req.user!.userId, req.body);
    res.status(201).json(transfer);
  } catch (error) {
    next(error);
  }
};

export const listTransfers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transfers = await TransferService.findAllByUser(req.user!.userId);
    res.json(transfers);
  } catch (error) {
    next(error);
  }
};
