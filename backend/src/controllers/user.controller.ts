import type { Request, Response, NextFunction } from "express";
import * as UserService from "../services/user.service.js";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const { email, password, fullName } = req.body as { email: string; password: string; fullName: string };
    const user = await UserService.create({ email, password, fullName, adminId });
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

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserService.update(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const adminValidateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserService.adminValidate(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    await UserService.deleteUser(req.params.id, adminId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const resendActivation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    await UserService.resendActivationEmail(req.params.id, adminId);
    res.json({ message: "Email de ativação reenviado com sucesso" });
  } catch (error) {
    next(error);
  }
};

export const verifyActivationToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await UserService.verifyActivationToken(req.params.token);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const activateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    const user = await UserService.activateAccount(token, password);
    res.json({ message: "Conta ativada com sucesso", email: user.email });
  } catch (error) {
    next(error);
  }
};
