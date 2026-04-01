import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "./authenticate.js";
import { AuthenticationError } from "../utils/errors.js";

const JWT_SECRET = "test-secret";

const createMockReq = (authHeader?: string): Request => {
  return {
    headers: {
      ...(authHeader !== undefined && { authorization: authHeader }),
    },
  } as unknown as Request;
};

const mockRes = {} as Response;

describe("authenticate middleware", () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
    vi.stubEnv("JWT_SECRET", JWT_SECRET);
  });

  it("injects user payload into req on valid token", () => {
    const payload = {
      userId: "user-1",
      email: "test@example.com",
      role: "USER",
      registrationStatus: "COMPLETE",
    };
    const token = jwt.sign(payload, JWT_SECRET);
    const req = createMockReq(`Bearer ${token}`);

    authenticate(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
  });

  it("throws AuthenticationError when no Authorization header", () => {
    const req = createMockReq();

    expect(() => authenticate(req, mockRes, mockNext)).toThrow(
      AuthenticationError
    );
    expect(() => authenticate(req, mockRes, mockNext)).toThrow(
      "Token não fornecido"
    );
  });

  it("throws AuthenticationError when Authorization header is not Bearer", () => {
    const req = createMockReq("Basic abc123");

    expect(() => authenticate(req, mockRes, mockNext)).toThrow(
      AuthenticationError
    );
  });

  it("throws AuthenticationError on expired token", () => {
    const payload = {
      userId: "user-1",
      email: "test@example.com",
      role: "USER",
      registrationStatus: "COMPLETE",
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "-1s" });
    const req = createMockReq(`Bearer ${token}`);

    expect(() => authenticate(req, mockRes, mockNext)).toThrow(
      AuthenticationError
    );
    expect(() => authenticate(req, mockRes, mockNext)).toThrow(
      "Token inválido ou expirado"
    );
  });

  it("throws AuthenticationError on token signed with wrong secret", () => {
    const payload = {
      userId: "user-1",
      email: "test@example.com",
      role: "USER",
      registrationStatus: "COMPLETE",
    };
    const token = jwt.sign(payload, "wrong-secret");
    const req = createMockReq(`Bearer ${token}`);

    expect(() => authenticate(req, mockRes, mockNext)).toThrow(
      AuthenticationError
    );
  });

  it("throws AuthenticationError on malformed token", () => {
    const req = createMockReq("Bearer not-a-valid-jwt");

    expect(() => authenticate(req, mockRes, mockNext)).toThrow(
      AuthenticationError
    );
  });
});
