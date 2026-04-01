import type { Request, Response, NextFunction } from "express";
import * as ScheduleService from "../services/schedule.service.js";

export const listSchedules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schedules = await ScheduleService.getPending(req.user!.userId);
    res.json(schedules);
  } catch (error) {
    next(error);
  }
};
