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

const mockBonusPurchase = {
  id: "bp-1",
  userId: "user-1",
  programId: "program-1",
  product: "iPhone 15",
  store: "Amazon",
  pointsPerReal: new Decimal(10),
  totalValue: new Decimal(5000),
  calculatedPoints: 50000,
  purchaseDate: new Date("2025-01-15T00:00:00.000Z"),
  productReceiveDate: new Date("2025-01-20T00:00:00.000Z"),
  pointsReceiveDate: new Date("2025-02-15T00:00:00.000Z"),
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
    bonusPurchase: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    schedule: {
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
import bonusPurchaseRoutes from "./bonus-purchase.routes.js";

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
  app.use("/api/bonus-purchases", bonusPurchaseRoutes);
  app.use(errorHandler);
  return app;
}

describe("Bonus Purchase Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/bonus-purchases", () => {
    const validBody = {
      programId: "550e8400-e29b-41d4-a716-446655440000",
      product: "iPhone 15",
      store: "Amazon",
      pointsPerReal: 10,
      totalValue: 5000,
      purchaseDate: "2025-01-15T00:00:00.000Z",
      productReceiveDate: "2025-01-20T00:00:00.000Z",
      pointsReceiveDate: "2025-02-15T00:00:00.000Z",
    };

    it("returns 201 with created bonus purchase", async () => {
      vi.mocked(prisma.$transaction).mockImplementation((fn: any) => {
        const tx = {
          bonusPurchase: { create: vi.fn().mockResolvedValue(mockBonusPurchase) },
          schedule: { create: vi.fn().mockResolvedValue({}) },
          loyaltyAccount: {
            findUnique: vi.fn().mockResolvedValue(mockAccount),
            create: vi.fn(),
            update: vi.fn().mockResolvedValue({}),
          },
          program: { findUnique: vi.fn().mockResolvedValue(mockProgram) },
        };
        return fn(tx);
      });

      const app = createApp();
      const res = await request(app)
        .post("/api/bonus-purchases")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("bp-1");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/bonus-purchases")
        .send(validBody);

      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/bonus-purchases")
        .set("Authorization", `Bearer ${pendingToken()}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it("returns 400 when product is missing", async () => {
      const app = createApp();
      const { product, ...bodyWithoutProduct } = validBody;
      const res = await request(app)
        .post("/api/bonus-purchases")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(bodyWithoutProduct);

      expect(res.status).toBe(400);
    });

    it("returns 400 when store is missing", async () => {
      const app = createApp();
      const { store, ...bodyWithoutStore } = validBody;
      const res = await request(app)
        .post("/api/bonus-purchases")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(bodyWithoutStore);

      expect(res.status).toBe(400);
    });

    it("returns 400 when programId is not a valid UUID", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/bonus-purchases")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, programId: "not-a-uuid" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when pointsReceiveDate is invalid", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/bonus-purchases")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, pointsReceiveDate: "invalid-date" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/bonus-purchases", () => {
    it("returns 200 with list of bonus purchases", async () => {
      vi.mocked(prisma.bonusPurchase.findMany).mockResolvedValue([
        { ...mockBonusPurchase, program: mockProgram, schedules: [] },
      ] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/bonus-purchases")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 200 with empty array when no bonus purchases", async () => {
      vi.mocked(prisma.bonusPurchase.findMany).mockResolvedValue([]);

      const app = createApp();
      const res = await request(app)
        .get("/api/bonus-purchases")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/bonus-purchases");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/bonus-purchases")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
