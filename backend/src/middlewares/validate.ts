import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { ValidationError } from "../utils/errors.js";

/**
 * Express middleware that validates req.body against a Zod schema.
 * On failure, throws a ValidationError with field-specific error details.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string> = {};
        for (const issue of err.issues) {
          const field = issue.path.join(".");
          // Keep only the first error per field
          if (!details[field]) {
            details[field] = issue.message;
          }
        }
        throw new ValidationError("Dados inválidos", "VALIDATION_ERROR", {
          details,
        });
      }
      throw err;
    }
  };
}
