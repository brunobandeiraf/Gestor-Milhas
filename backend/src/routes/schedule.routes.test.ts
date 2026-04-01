import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { Prisma } from "../generated/prisma/client.js";
import { errorHandler } from "../middlewares/error-handler.js";

const { Decimal } = Prisma;

const mockSchedule = {
  id: "schedule-1",
  type: "CLUB_CHARGE",
  status: "PENDING",
  executionDate: new Date("2025-02-10T00:00:00.000Z"),
  loyaltyAccountId: "account-1",
  clubId: "club-1",
  bonusPurchaseId: null,
  transferId: null,
  milesAmount: 10000,
  costAmount: new Decimal(200),
  errorMessage: null,
  executedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("../prisma/client.js", () => ({
  default: {
    schedule: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import scheduleRoutes from "./schedule.routes.js";

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
  app.use("/api/schedules", scheduleRoutes);
  app.use(errorHandler);
  return app;
}

describe("Schedule Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("GET /api/schedules", () => {
    it("returns 200 with list of pending schedules", async () => {
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        mockSchedule,
      ] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/schedules")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 200 with empty array when no pending schedules", async () => {
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);

      const app = createApp();
      const res = await request(app)
        .get("/api/schedules")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/schedules");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/schedules")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
