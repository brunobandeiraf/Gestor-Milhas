import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Prisma } from "../generated/prisma/client.js";
import { errorHandler } from "../middlewares/error-handler.js";

const { Decimal } = Prisma;

const mockOriginAccount = {
  id: "origin-account-1",
  userId: "user-1",
  programId: "origin-program-1",
  miles: 50000,
  totalCost: new Decimal(2000),
  averagePrice: new Decimal(40),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDestAccount = {
  id: "dest-account-1",
  userId: "user-1",
  programId: "dest-program-1",
  miles: 10000,
  totalCost: new Decimal(500),
  averagePrice: new Decimal(50),
  cpfAvailable: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransfer = {
  id: "transfer-1",
  userId: "user-1",
  originProgramId: "origin-program-1",
  destinationProgramId: "dest-program-1",
  miles: 10000,
  bonusPercentage: new Decimal(20),
  bonusMiles: 2000,
  transferDate: new Date("2025-03-01T00:00:00.000Z"),
  receiveDate: new Date("2025-03-05T00:00:00.000Z"),
  bonusReceiveDate: new Date("2025-03-10T00:00:00.000Z"),
  cartPurchase: false,
  cartPurchaseCost: new Decimal(0),
  boomerang: false,
  boomerangMiles: null,
  boomerangReturnDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProgram = {
  id: "origin-program-1",
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
    transfer: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    schedule: {
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
import transferRoutes from "./transfer.routes.js";

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
  app.use("/api/transfers", transferRoutes);
  app.use(errorHandler);
  return app;
}

describe("Transfer Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/transfers", () => {
    const validBody = {
      originProgramId: "550e8400-e29b-41d4-a716-446655440000",
      destinationProgramId: "660e8400-e29b-41d4-a716-446655440001",
      miles: 10000,
      bonusPercentage: 20,
      transferDate: "2025-03-01T00:00:00.000Z",
      receiveDate: "2025-03-05T00:00:00.000Z",
      bonusReceiveDate: "2025-03-10T00:00:00.000Z",
      cartPurchase: false,
      cartPurchaseCost: 0,
      boomerang: false,
    };

    it("returns 201 with created transfer", async () => {
      vi.mocked(prisma.$transaction).mockImplementation((fn: any) => {
        const tx = {
          transfer: { create: vi.fn().mockResolvedValue(mockTransfer) },
          schedule: { create: vi.fn().mockResolvedValue({}) },
          payment: { create: vi.fn().mockResolvedValue({}) },
          loyaltyAccount: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(mockOriginAccount)
              .mockResolvedValueOnce(mockDestAccount)
              .mockResolvedValueOnce(mockOriginAccount)
              .mockResolvedValueOnce(mockOriginAccount),
            create: vi.fn(),
            update: vi.fn().mockResolvedValue({}),
          },
          program: { findUnique: vi.fn().mockResolvedValue(mockProgram) },
        };
        return fn(tx);
      });

      const app = createApp();
      const res = await request(app)
        .post("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("transfer-1");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transfers")
        .send(validBody);

      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transfers")
        .set("Authorization", `Bearer ${pendingToken()}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it("returns 400 when originProgramId is missing", async () => {
      const app = createApp();
      const { originProgramId, ...body } = validBody;
      const res = await request(app)
        .post("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(body);

      expect(res.status).toBe(400);
    });

    it("returns 400 when destinationProgramId is not a valid UUID", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, destinationProgramId: "not-a-uuid" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when miles is less than 1", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, miles: 0 });

      expect(res.status).toBe(400);
    });

    it("returns 400 when receiveDate is invalid", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, receiveDate: "invalid-date" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when transferDate is missing", async () => {
      const app = createApp();
      const { transferDate, ...body } = validBody;
      const res = await request(app)
        .post("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(body);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/transfers", () => {
    it("returns 200 with list of transfers", async () => {
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([
        { ...mockTransfer, schedules: [], payment: null },
      ] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 200 with empty array when no transfers", async () => {
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([]);

      const app = createApp();
      const res = await request(app)
        .get("/api/transfers")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/transfers");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/transfers")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
