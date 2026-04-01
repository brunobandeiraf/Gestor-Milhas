import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  InternalError,
} from "./errors.js";

describe("Custom Error Classes", () => {
  it("all errors extend AppError", () => {
    expect(new ValidationError("msg")).toBeInstanceOf(AppError);
    expect(new AuthenticationError()).toBeInstanceOf(AppError);
    expect(new AuthorizationError()).toBeInstanceOf(AppError);
    expect(new NotFoundError()).toBeInstanceOf(AppError);
    expect(new ConflictError("msg")).toBeInstanceOf(AppError);
    expect(new BusinessRuleError("msg")).toBeInstanceOf(AppError);
    expect(new InternalError()).toBeInstanceOf(AppError);
  });

  describe("ValidationError", () => {
    it("has status 400 and default code", () => {
      const err = new ValidationError("CPF inválido");
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.message).toBe("CPF inválido");
    });

    it("supports custom code, field and details", () => {
      const err = new ValidationError("CEP não encontrado", "INVALID_CEP", {
        field: "cep",
        details: { cep: "CEP não encontrado" },
      });
      expect(err.code).toBe("INVALID_CEP");
      expect(err.field).toBe("cep");
      expect(err.details).toEqual({ cep: "CEP não encontrado" });
    });
  });

  describe("AuthenticationError", () => {
    it("has status 401 and default message", () => {
      const err = new AuthenticationError();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe("Email ou senha inválidos");
      expect(err.code).toBe("AUTHENTICATION_ERROR");
    });
  });

  describe("AuthorizationError", () => {
    it("has status 403 and default message", () => {
      const err = new AuthorizationError();
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe("Acesso negado");
    });

    it("supports custom message", () => {
      const err = new AuthorizationError(
        "Complete seu cadastro para acessar esta funcionalidade"
      );
      expect(err.message).toBe(
        "Complete seu cadastro para acessar esta funcionalidade"
      );
    });
  });

  describe("NotFoundError", () => {
    it("has status 404 and default message", () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("Recurso não encontrado");
    });
  });

  describe("ConflictError", () => {
    it("has status 409", () => {
      const err = new ConflictError(
        "Existem registros ativos vinculados: Programa X"
      );
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("CONFLICT");
    });
  });

  describe("BusinessRuleError", () => {
    it("has status 422", () => {
      const err = new BusinessRuleError(
        "Saldo de milhas insuficiente",
        "INSUFFICIENT_MILES"
      );
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe("INSUFFICIENT_MILES");
      expect(err.message).toBe("Saldo de milhas insuficiente");
    });
  });

  describe("InternalError", () => {
    it("has status 500 and default message", () => {
      const err = new InternalError();
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe("Erro interno do servidor");
    });
  });
});
