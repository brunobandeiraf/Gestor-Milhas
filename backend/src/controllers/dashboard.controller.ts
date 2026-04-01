import type { Request, Response, NextFunction } from "express";
import * as DashboardService from "../services/dashboard.service.js";

export const getUserDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dashboard = await DashboardService.getUserDashboard(
      req.user!.userId
    );
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dashboard = await DashboardService.getAdminDashboard(
      req.user!.userId
    );
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
};

export const getUserMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metrics = await DashboardService.getUserMetrics(req.params.id);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
};
