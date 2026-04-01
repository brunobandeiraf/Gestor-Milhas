import type { Request, Response, NextFunction } from "express";
import * as CardService from "../services/card.service.js";
import { AuthorizationError } from "../utils/errors.js";

export const createCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId =
      req.user!.role === "ADMIN" && req.body.targetUserId
        ? req.body.targetUserId
        : req.user!.userId;
    const { targetUserId, ...cardData } = req.body;
    const card = await CardService.create(ownerId, cardData);
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
};

export const listCards = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const targetUserId =
      req.user!.role === "ADMIN" && req.query.userId
        ? (req.query.userId as string)
        : req.user!.userId;
    const cards = await CardService.findAllByUser(targetUserId);
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

export const getCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const card = await CardService.findById(req.params.id);
    if (card.userId !== req.user!.userId && req.user!.role !== "ADMIN") {
      throw new AuthorizationError("Acesso negado");
    }
    res.json(card);
  } catch (error) {
    next(error);
  }
};

export const updateCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const card = await CardService.update(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body
    );
    res.json(card);
  } catch (error) {
    next(error);
  }
};

export const toggleActiveCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { active } = req.body as { active: boolean };
    const card = await CardService.toggleActive(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      active
    );
    res.json(card);
  } catch (error) {
    next(error);
  }
};
