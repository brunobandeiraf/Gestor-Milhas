import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, string>;
  };
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.field && { field: err.field }),
        ...(err.details && { details: err.details }),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected errors
  console.error("Unhandled error:", err);
  const body: ErrorResponse = {
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor",
    },
  };
  res.status(500).json(body);
};
