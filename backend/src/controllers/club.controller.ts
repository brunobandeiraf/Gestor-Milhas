import type { Request, Response, NextFunction } from "express";
import * as ClubService from "../services/club.service.js";

export const createClub = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const club = await ClubService.create(req.user!.userId, req.body);
    res.status(201).json(club);
  } catch (error) {
    next(error);
  }
};

export const listClubs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubs = await ClubService.findAllByUser(req.user!.userId);
    res.json(clubs);
  } catch (error) {
    next(error);
  }
};
