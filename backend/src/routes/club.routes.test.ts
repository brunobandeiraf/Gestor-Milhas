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

const mockClub = {
  id: "club-1",
  userId: "user-1",
  programId: "program-1",
  plan: "Gold",
  milesPerMonth: 10000,
  monthlyFee: new Decimal(200),
  startDate: new Date("2025-01-15T00:00:00.000Z"),
  endDate: new Date("2025-06-15T00:00:00.000Z"),
  chargeDay: 10,
  paymentMethod: "CREDIT_CARD",
  active: true,
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

vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: vi.fn(),
    club: {
      findMany: vi.fn(),
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
import clubRoutes from "./club.routes.js";

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
  app.use("/api/clubs", clubRoutes);
  app.use(errorHandler);
  return app;
}

describe("Club Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/clubs", () => {
    const validBody = {
      programId: "550e8400-e29b-41d4-a716-446655440000",
      plan: "Gold",
      milesPerMonth: 10000,
      monthlyFee: 200,
      startDate: "2025-01-15T00:00:00.000Z",
      endDate: "2025-06-15T00:00:00.000Z",
      chargeDay: 10,
      paymentMethod: "CREDIT_CARD",
    };

    it("returns 201 with created club", async () => {
      vi.mocked(prisma.$transaction).mockImplementation((fn: any) => {
        const tx = {
          club: { create: vi.fn().mockResolvedValue(mockClub) },
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
        .post("/api/clubs")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("club-1");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).post("/api/clubs").send(validBody);

      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/clubs")
        .set("Authorization", `Bearer ${pendingToken()}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it("returns 400 when plan is missing", async () => {
      const app = createApp();
      const { plan, ...bodyWithoutPlan } = validBody;
      const res = await request(app)
        .post("/api/clubs")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(bodyWithoutPlan);

      expect(res.status).toBe(400);
    });

    it("returns 400 when programId is not a valid UUID", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/clubs")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, programId: "not-a-uuid" });

      expect(res.status).toBe(400);
    });

    it("returns 400 when chargeDay is out of range", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/clubs")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, chargeDay: 32 });

      expect(res.status).toBe(400);
    });

    it("returns 400 when paymentMethod is invalid", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/clubs")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validBody, paymentMethod: "INVALID" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/clubs", () => {
    it("returns 200 with list of clubs", async () => {
      vi.mocked(prisma.club.findMany).mockResolvedValue([
        { ...mockClub, program: mockProgram, schedules: [] },
      ] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/clubs")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 200 with empty array when no clubs", async () => {
      vi.mocked(prisma.club.findMany).mockResolvedValue([]);

      const app = createApp();
      const res = await request(app)
        .get("/api/clubs")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/clubs");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/clubs")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
