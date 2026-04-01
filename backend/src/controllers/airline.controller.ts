import type { Request, Response, NextFunction } from "express";
import * as AirlineService from "../services/airline.service.js";

export const createAirline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body as { name: string };
    const airline = await AirlineService.create({ name });
    res.status(201).json(airline);
  } catch (error) {
    next(error);
  }
};

export const listAirlines = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const airlines = await AirlineService.findAll();
    res.json(airlines);
  } catch (error) {
    next(error);
  }
};

export const getAirline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const airline = await AirlineService.findById(req.params.id);
    res.json(airline);
  } catch (error) {
    next(error);
  }
};

export const updateAirline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const airline = await AirlineService.update(req.params.id, req.body);
    res.json(airline);
  } catch (error) {
    next(error);
  }
};

export const deactivateAirline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const airline = await AirlineService.deactivate(req.params.id);
    res.json(airline);
  } catch (error) {
    next(error);
  }
};
