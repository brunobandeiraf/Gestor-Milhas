import type { Request, Response, NextFunction } from "express";
import * as UserService from "../services/user.service.js";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const { email, password } = req.body as { email: string; password: string };
    const user = await UserService.create({ email, password, adminId });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const users = await UserService.findAll(adminId);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserService.findById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const completeRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserService.completeRegistration(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
