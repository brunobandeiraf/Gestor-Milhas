import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authorize } from "./authorize.js";
import { AuthorizationError } from "../utils/errors.js";

const createMockReq = (user?: Request["user"]): Request => {
  return { user } as unknown as Request;
};

const mockRes = {} as Response;

describe("authorize middleware", () => {
  it("calls next when user role is in allowed roles", () => {
    const req = createMockReq({
      userId: "u1",
      email: "a@b.com",
      role: "ADMIN",
      registrationStatus: "COMPLETE",
    });
    const next = vi.fn() as NextFunction;

    authorize("ADMIN", "USER")(req, mockRes, next);

    expect(next).toHaveBeenCalled();
  });

  it("calls next for single allowed role", () => {
    const req = createMockReq({
      userId: "u1",
      email: "a@b.com",
      role: "USER",
      registrationStatus: "COMPLETE",
    });
    const next = vi.fn() as NextFunction;

    authorize("USER")(req, mockRes, next);

    expect(next).toHaveBeenCalled();
  });

  it("throws AuthorizationError when user role is not in allowed roles", () => {
    const req = createMockReq({
      userId: "u1",
      email: "a@b.com",
      role: "USER",
      registrationStatus: "COMPLETE",
    });
    const next = vi.fn() as NextFunction;

    expect(() => authorize("ADMIN")(req, mockRes, next)).toThrow(
      AuthorizationError
    );
    expect(() => authorize("ADMIN")(req, mockRes, next)).toThrow(
      "Acesso negado"
    );
  });

  it("throws AuthorizationError when req.user is undefined", () => {
    const req = createMockReq(undefined);
    const next = vi.fn() as NextFunction;

    expect(() => authorize("ADMIN")(req, mockRes, next)).toThrow(
      AuthorizationError
    );
  });
});
