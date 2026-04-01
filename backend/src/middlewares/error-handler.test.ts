import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "./error-handler.js";
import {
  ValidationError,
  AuthenticationError,
  BusinessRuleError,
} from "../utils/errors.js";

const createMockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const mockReq = {} as Request;
const mockNext = vi.fn() as NextFunction;

describe("errorHandler middleware", () => {
  it("handles AppError subclasses with correct status and body", () => {
    const err = new ValidationError("CPF inválido", "INVALID_CPF", {
      field: "cpf",
    });
    const res = createMockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "INVALID_CPF",
        message: "CPF inválido",
        field: "cpf",
      },
    });
  });

  it("handles AuthenticationError with 401", () => {
    const err = new AuthenticationError();
    const res = createMockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "Email ou senha inválidos",
      },
    });
  });

  it("handles BusinessRuleError with details", () => {
    const err = new BusinessRuleError(
      "Saldo de milhas insuficiente",
      "INSUFFICIENT_MILES"
    );
    const res = createMockRes();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "INSUFFICIENT_MILES",
        message: "Saldo de milhas insuficiente",
      },
    });
  });

  it("omits field and details when not provided", () => {
    const err = new AuthenticationError();
    const res = createMockRes();

    errorHandler(err, mockReq, res, mockNext);

    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body.error).not.toHaveProperty("field");
    expect(body.error).not.toHaveProperty("details");
  });

  it("handles unknown errors as 500 Internal Error", () => {
    const err = new Error("something unexpected");
    const res = createMockRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno do servidor",
      },
    });

    consoleSpy.mockRestore();
  });
});
