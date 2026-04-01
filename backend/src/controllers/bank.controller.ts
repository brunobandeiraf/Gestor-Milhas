import type { Request, Response, NextFunction } from "express";
import * as BankService from "../services/bank.service.js";

export const createBank = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body as { name: string };
    const bank = await BankService.create({ name });
    res.status(201).json(bank);
  } catch (error) {
    next(error);
  }
};

export const listBanks = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const banks = await BankService.findAll();
    res.json(banks);
  } catch (error) {
    next(error);
  }
};

export const getBank = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bank = await BankService.findById(req.params.id);
    res.json(bank);
  } catch (error) {
    next(error);
  }
};

export const updateBank = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bank = await BankService.update(req.params.id, req.body);
    res.json(bank);
  } catch (error) {
    next(error);
  }
};

export const deactivateBank = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bank = await BankService.deactivate(req.params.id);
    res.json(bank);
  } catch (error) {
    next(error);
  }
};
