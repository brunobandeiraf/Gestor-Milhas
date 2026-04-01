import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Prisma } from "../generated/prisma/client.js";
import { errorHandler } from "../middlewares/error-handler.js";

const { Decimal } = Prisma;

const mockAccount = {
  id: "account-1",
  userId: "user-1",
  programId: "program-1",
  miles: 5000,
  totalCost: new Decimal(200),
  averagePrice: new Decimal(40),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransaction = {
  id: "txn-1",
  userId: "user-1",
  programId: "program-1",
  type: "PURCHASE",
  miles: 10000,
  totalCost: new Decimal(350),
  costPerK: new Decimal(35),
  date: new Date("2025-01-15T00:00:00.000Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

// Mock prisma before importing routes
vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: vi.fn(),
    transaction: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    loyaltyAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    program: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import transactionRoutes from "./transaction.routes.js";

const JWT_SECRET = "test-jwt-secret";

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
  app.use("/api/transactions", transactionRoutes);
  app.use(errorHandler);
  return app;
}

describe("Transaction Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/transactions", () => {
    const validBody = {
      programId: "550e8400-e29b-41d4-a716-446655440000",
      type: "PURCHASE",
      miles: 10000,
      costPerK: 35,
      date: "2025-01-15T00:00:00.000Z",
      paymentMethod: "PIX",
    };

    it("returns 201 with created transaction", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        (fn: any) => {
          const tx = {
            transaction: { create: vi.fn().mockResolvedValue(mockTransaction) },
            payment: { create: vi.fn().mockResolvedValue({}) },
            loyaltyAccount: {
              findUnique: vi.fn().mockResolvedValue(mockAccount),
              create: vi.fn(),
              update: vi.fn().mockResolvedValue({}),
            },
            program: { findUnique: vi.fn().mockResolvedValue(mockProgram) },
          };
          return fn(tx);
        }
      );

      const app = createApp();
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("txn-1");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transactions")
        .send(validBody);

      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${pendingToken()}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it("returns 400 when miles is missing", async () => {
      const app = createApp();
      const { miles, ...bodyWithoutMiles } = validBody;
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(bodyWithoutMiles);

      expect(res.status).toBe(400);
    });

    it("returns 400 when neither totalCost nor costPerK is provided", async () => {
      const app = createApp();
      const { costPerK, ...bodyWithoutCost } = validBody;
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(bodyWithoutCost);

      expect(res.status).toBe(400);
    });

    it("returns 400 when programId is not a valid UUID", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, programId: "not-a-uuid" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when type is invalid", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, type: "INVALID_TYPE" });

      expect(res.status).toBe(400);
    });

    it("accepts totalCost instead of costPerK", async () => {
      vi.mocked(prisma.$transaction).mockImplementation(
        (fn: any) => {
          const tx = {
            transaction: { create: vi.fn().mockResolvedValue(mockTransaction) },
            payment: { create: vi.fn().mockResolvedValue({}) },
            loyaltyAccount: {
              findUnique: vi.fn().mockResolvedValue(mockAccount),
              create: vi.fn(),
              update: vi.fn().mockResolvedValue({}),
            },
            program: { findUnique: vi.fn().mockResolvedValue(mockProgram) },
          };
          return fn(tx);
        }
      );

      const app = createApp();
      const body = {
        programId: "550e8400-e29b-41d4-a716-446655440000",
        type: "PURCHASE",
        miles: 10000,
        totalCost: 350,
        date: "2025-01-15T00:00:00.000Z",
        paymentMethod: "CREDIT_CARD",
      };

      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(body);

      expect(res.status).toBe(201);
    });
  });

  describe("GET /api/transactions", () => {
    it("returns 200 with list of transactions", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([
        { ...mockTransaction, program: mockProgram, payment: null },
      ] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 200 with empty array when no transactions", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);

      const app = createApp();
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/transactions");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
