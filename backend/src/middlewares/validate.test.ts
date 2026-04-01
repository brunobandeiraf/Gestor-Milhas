import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validate } from "./validate.js";
import { ValidationError } from "../utils/errors.js";
import type { Request, Response, NextFunction } from "express";

function createMockReq(body: unknown): Request {
  return { body } as Request;
}

function createMockRes(): Response {
  return {} as Response;
}

describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().min(1, { message: "Nome é obrigatório" }),
    email: z.string().email({ message: "Email inválido" }),
  });

  it("should call next() and set parsed body on valid input", () => {
    const req = createMockReq({ name: "Test", email: "test@example.com" });
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "Test", email: "test@example.com" });
  });

  it("should throw ValidationError with field details on invalid input", () => {
    const req = createMockReq({ name: "", email: "invalid" });
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    expect(() => validate(schema)(req, res, next)).toThrow(ValidationError);

    try {
      validate(schema)(req, res, next);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const validationErr = err as ValidationError;
      expect(validationErr.statusCode).toBe(400);
      expect(validationErr.code).toBe("VALIDATION_ERROR");
      expect(validationErr.details).toBeDefined();
      expect(validationErr.details!["name"]).toBe("Nome é obrigatório");
      expect(validationErr.details!["email"]).toBe("Email inválido");
    }
  });

  it("should throw ValidationError when body is missing fields", () => {
    const req = createMockReq({});
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    expect(() => validate(schema)(req, res, next)).toThrow(ValidationError);
  });
});
