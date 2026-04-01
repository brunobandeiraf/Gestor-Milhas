import type { Request, Response, NextFunction } from "express";
import * as AuthService from "../services/auth.service.js";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await AuthService.refresh(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
