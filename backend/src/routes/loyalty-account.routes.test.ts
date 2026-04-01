import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Prisma } from "../generated/prisma/client.js";
import { errorHandler } from "../middlewares/error-handler.js";

const { Decimal } = Prisma;

vi.mock("../prisma/client.js", () => ({
  default: {
    loyaltyAccount: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import loyaltyAccountRoutes from "./loyalty-account.routes.js";

const JWT_SECRET = "test-jwt-secret";

const mockProgram = {
  id: "program-1",
  name: "LATAM Pass",
  type: "AIRLINE",
  airlineId: "airline-1",
  cpfLimit: 3,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAccount = {
  id: "account-1",
  userId: "user-1",
  programId: "program-1",
  miles: 10000,
  totalCost: new Decimal("250.00"),
  averagePrice: new Decimal("25.00"),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  program: mockProgram,
};

function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
  registrationStatus: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

const userToken = () =>
  generateToken({
    userId: "user-1",
    email: "user@test.com",
    role: "USER",
    registrationStatus: "COMPLETE",
  });

const adminToken = () =>
  generateToken({
    userId: "admin-1",
    email: "admin@test.com",
    role: "ADMIN",
    registrationStatus: "COMPLETE",
  });

const pendingToken = () =>
  generateToken({
    userId: "user-2",
    email: "pending@test.com",
    role: "USER",
    registrationStatus: "PENDING",
  });

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/loyalty-accounts", loyaltyAccountRoutes);
  app.use(errorHandler);
  return app;
}

describe("Loyalty Account Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("GET /api/loyalty-accounts", () => {
    it("returns 200 with list of accounts for authenticated user", async () => {
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue([mockAccount] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe("account-1");
    });

    it("returns 200 with empty array when user has no accounts", async () => {
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue([]);

      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/loyalty-accounts");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/loyalty-accounts/:id", () => {
    it("returns 200 with account detail for the owner", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts/account-1")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("account-1");
      expect(res.body.program).toBeDefined();
      expect(res.body.program.name).toBe("LATAM Pass");
    });

    it("returns 200 when admin accesses another user account", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts/account-1")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("account-1");
    });

    it("returns 403 when non-owner non-admin accesses account", async () => {
      const otherUserToken = generateToken({
        userId: "user-other",
        email: "other@test.com",
        role: "USER",
        registrationStatus: "COMPLETE",
      });

      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts/account-1")
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTHORIZATION_ERROR");
    });

    it("returns 404 when account not found", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts/nonexistent")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(404);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/loyalty-accounts/account-1");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/loyalty-accounts/account-1")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
