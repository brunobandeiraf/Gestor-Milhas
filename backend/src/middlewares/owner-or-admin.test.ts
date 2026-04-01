import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { AuthorizationError } from "../utils/errors.js";

// Mock prisma before importing the middleware
vi.mock("../prisma/client.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { ownerOrAdmin } from "./owner-or-admin.js";
import prisma from "../prisma/client.js";

const createMockReq = (
  user: Request["user"],
  params: Record<string, string> = {}
): Request => {
  return { user, params } as unknown as Request;
};

const mockRes = {} as Response;

describe("ownerOrAdmin middleware", () => {
  let mockNext: NextFunction;

  beforeEach(() => {
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it("calls next when user is the resource owner", async () => {
    const req = createMockReq(
      {
        userId: "user-1",
        email: "a@b.com",
        role: "USER",
        registrationStatus: "COMPLETE",
      },
      { userId: "user-1" }
    );

    await ownerOrAdmin(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    // Should not query the database for owner access
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("calls next when admin manages the target user", async () => {
    const req = createMockReq(
      {
        userId: "admin-1",
        email: "admin@b.com",
        role: "ADMIN",
        registrationStatus: "COMPLETE",
      },
      { userId: "user-2" }
    );

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      adminId: "admin-1",
    } as any);

    await ownerOrAdmin(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-2" },
      select: { adminId: true },
    });
  });

  it("throws AuthorizationError when admin does not manage the target user", async () => {
    const req = createMockReq(
      {
        userId: "admin-1",
        email: "admin@b.com",
        role: "ADMIN",
        registrationStatus: "COMPLETE",
      },
      { userId: "user-2" }
    );

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      adminId: "other-admin",
    } as any);

    await expect(ownerOrAdmin(req, mockRes, mockNext)).rejects.toThrow(
      AuthorizationError
    );
    await expect(ownerOrAdmin(req, mockRes, mockNext)).rejects.toThrow(
      "Acesso negado"
    );
  });

  it("throws AuthorizationError when non-admin user accesses another user's data", async () => {
    const req = createMockReq(
      {
        userId: "user-1",
        email: "a@b.com",
        role: "USER",
        registrationStatus: "COMPLETE",
      },
      { userId: "user-2" }
    );

    await expect(ownerOrAdmin(req, mockRes, mockNext)).rejects.toThrow(
      AuthorizationError
    );
  });

  it("throws AuthorizationError when req.user is undefined", async () => {
    const req = createMockReq(undefined, { userId: "user-1" });

    await expect(ownerOrAdmin(req, mockRes, mockNext)).rejects.toThrow(
      AuthorizationError
    );
  });

  it("throws AuthorizationError when target user does not exist", async () => {
    const req = createMockReq(
      {
        userId: "admin-1",
        email: "admin@b.com",
        role: "ADMIN",
        registrationStatus: "COMPLETE",
      },
      { userId: "nonexistent" }
    );

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(ownerOrAdmin(req, mockRes, mockNext)).rejects.toThrow(
      AuthorizationError
    );
  });
});
