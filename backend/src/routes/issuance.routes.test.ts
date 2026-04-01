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
  miles: 50000,
  totalCost: new Decimal(2000),
  averagePrice: new Decimal(40),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAirlineProgram = {
  id: "program-1",
  name: "LATAM Pass",
  type: "AIRLINE",
  airlineId: "airline-1",
  cpfLimit: 3,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockIssuance = {
  id: "issuance-1",
  userId: "user-1",
  programId: "program-1",
  date: new Date("2025-06-01T00:00:00.000Z"),
  cpfUsed: "12345678901",
  milesUsed: 20000,
  cashPaid: new Decimal(150),
  locator: "ABC123",
  passenger: "João Silva",
  realTicketValue: new Decimal(2000),
  totalCost: new Decimal(950),
  savings: new Decimal(1050),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock prisma before importing routes
vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: vi.fn(),
    issuance: {
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
import issuanceRoutes from "./issuance.routes.js";

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
  app.use("/api/issuances", issuanceRoutes);
  app.use(errorHandler);
  return app;
}

describe("Issuance Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/issuances", () => {
    const validBody = {
      programId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2025-06-01T00:00:00.000Z",
      cpfUsed: "12345678901",
      milesUsed: 20000,
      cashPaid: 150,
      locator: "ABC123",
      passenger: "João Silva",
      realTicketValue: 2000,
      paymentMethod: "PIX",
    };

    it("returns 201 with created issuance", async () => {
      vi.mocked(prisma.$transaction).mockImplementation((fn: any) => {
        const tx = {
          issuance: { create: vi.fn().mockResolvedValue(mockIssuance) },
          payment: { create: vi.fn().mockResolvedValue({}) },
          loyaltyAccount: {
            findUnique: vi.fn().mockResolvedValue(mockAccount),
            create: vi.fn(),
            update: vi.fn().mockResolvedValue({}),
          },
          program: {
            findUnique: vi.fn().mockResolvedValue(mockAirlineProgram),
          },
        };
        return fn(tx);
      });

      const app = createApp();
      const res = await request(app)
        .post("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("issuance-1");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/issuances")
        .send(validBody);

      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/issuances")
        .set("Authorization", `Bearer ${pendingToken()}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it("returns 400 when programId is missing", async () => {
      const app = createApp();
      const { programId, ...body } = validBody;
      const res = await request(app)
        .post("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(body);

      expect(res.status).toBe(400);
    });

    it("returns 400 when milesUsed is less than 1", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, milesUsed: 0 });

      expect(res.status).toBe(400);
    });

    it("returns 400 when passenger is empty", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, passenger: "" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when date is invalid", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, date: "invalid-date" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when paymentMethod is missing", async () => {
      const app = createApp();
      const { paymentMethod, ...body } = validBody;
      const res = await request(app)
        .post("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(body);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/issuances", () => {
    it("returns 200 with list of issuances", async () => {
      vi.mocked(prisma.issuance.findMany).mockResolvedValue([
        { ...mockIssuance, payment: null },
      ] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 200 with empty array when no issuances", async () => {
      vi.mocked(prisma.issuance.findMany).mockResolvedValue([]);

      const app = createApp();
      const res = await request(app)
        .get("/api/issuances")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/issuances");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/issuances")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
