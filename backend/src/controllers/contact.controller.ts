import type { Request, Response, NextFunction } from "express";
import * as ContactService from "../services/contact.service.js";
import type { ContactFormInput } from "../utils/schemas.js";

export const submitContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body as ContactFormInput;
    const message = await ContactService.create(data);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};
