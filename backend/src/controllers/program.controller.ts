import type { Request, Response, NextFunction } from "express";
import * as ProgramService from "../services/program.service.js";

export const createProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const program = await ProgramService.create(req.body);
    res.status(201).json(program);
  } catch (error) {
    next(error);
  }
};

export const listPrograms = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const programs = await ProgramService.findAll();
    res.json(programs);
  } catch (error) {
    next(error);
  }
};

export const getProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const program = await ProgramService.findById(req.params.id);
    res.json(program);
  } catch (error) {
    next(error);
  }
};

export const updateProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const program = await ProgramService.update(req.params.id, req.body);
    res.json(program);
  } catch (error) {
    next(error);
  }
};

export const toggleActiveProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { active } = req.body as { active: boolean };
    const program = await ProgramService.toggleActive(req.params.id, active);
    res.json(program);
  } catch (error) {
    next(error);
  }
};
