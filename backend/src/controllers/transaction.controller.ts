import type { Request, Response, NextFunction } from "express";
import * as TransactionService from "../services/transaction.service.js";

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transaction = await TransactionService.create(
      req.user!.userId,
      req.body
    );
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const listTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transactions = await TransactionService.findAllByUser(
      req.user!.userId
    );
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};
