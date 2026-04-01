import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireCompleteRegistration } from "./require-complete-registration.js";
import { AuthorizationError } from "../utils/errors.js";

const createMockReq = (user?: Request["user"]): Request => {
  return { user } as unknown as Request;
};

const mockRes = {} as Response;

describe("requireCompleteRegistration middleware", () => {
  it("calls next when registration status is COMPLETE", () => {
    const req = createMockReq({
      userId: "u1",
      email: "a@b.com",
      role: "USER",
      registrationStatus: "COMPLETE",
    });
    const next = vi.fn() as NextFunction;

    requireCompleteRegistration(req, mockRes, next);

    expect(next).toHaveBeenCalled();
  });

  it("throws AuthorizationError when registration status is PENDING", () => {
    const req = createMockReq({
      userId: "u1",
      email: "a@b.com",
      role: "USER",
      registrationStatus: "PENDING",
    });
    const next = vi.fn() as NextFunction;

    expect(() => requireCompleteRegistration(req, mockRes, next)).toThrow(
      AuthorizationError
    );
    expect(() => requireCompleteRegistration(req, mockRes, next)).toThrow(
      "Complete seu cadastro para acessar esta funcionalidade"
    );
  });

  it("throws AuthorizationError when req.user is undefined", () => {
    const req = createMockReq(undefined);
    const next = vi.fn() as NextFunction;

    expect(() => requireCompleteRegistration(req, mockRes, next)).toThrow(
      AuthorizationError
    );
  });
});
