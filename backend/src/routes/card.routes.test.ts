import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { errorHandler } from "../middlewares/error-handler.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    card: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import cardRoutes from "./card.routes.js";

const JWT_SECRET = "test-jwt-secret";

const mockBank = {
  id: "bank-1",
  name: "Itaú",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCard = {
  id: "card-1",
  userId: "user-1",
  bankId: "bank-1",
  name: "Platinum",
  closingDay: 10,
  dueDay: 20,
  creditLimit: 5000,
  annualFee: 300,
  active: true,
  minIncome: null,
  scoring: null,
  brand: null,
  vipLounge: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  bank: mockBank,
};

const validCardBody = {
  bankId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  name: "Platinum",
  closingDay: 10,
  dueDay: 20,
  creditLimit: 5000,
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
  app.use("/api/cards", cardRoutes);
  app.use(errorHandler);
  return app;
}

describe("Card Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/cards", () => {
    it("returns 201 when user creates a card", async () => {
      vi.mocked(prisma.card.create).mockResolvedValue(mockCard as any);

      const app = createApp();
      const res = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validCardBody);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Platinum");
    });

    it("creates card for targetUserId when admin provides it", async () => {
      const targetUserId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
      const cardForTarget = { ...mockCard, userId: targetUserId };
      vi.mocked(prisma.card.create).mockResolvedValue(cardForTarget as any);

      const app = createApp();
      const res = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ ...validCardBody, targetUserId });

      expect(res.status).toBe(201);
      expect(prisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: targetUserId }),
        })
      );
    });

    it("ignores targetUserId when non-admin sends it", async () => {
      vi.mocked(prisma.card.create).mockResolvedValue(mockCard as any);

      const app = createApp();
      const res = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ ...validCardBody, targetUserId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" });

      expect(res.status).toBe(201);
      expect(prisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "user-1" }),
        })
      );
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).post("/api/cards").send(validCardBody);
      expect(res.status).toBe(401);
    });

    it("returns 403 for pending registration", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${pendingToken()}`)
        .send(validCardBody);
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid body", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/cards")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ name: "Platinum" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/cards", () => {
    it("returns 200 with user cards", async () => {
      vi.mocked(prisma.card.findMany).mockResolvedValue([mockCard] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/cards")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/cards");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/cards/:id", () => {
    it("returns 200 when user owns the card", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/cards/card-1")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("card-1");
    });

    it("returns 200 when admin accesses any card", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/cards/card-1")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
    });

    it("returns 403 when user does not own the card", async () => {
      const otherCard = { ...mockCard, userId: "other-user" };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(otherCard as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/cards/card-1")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(403);
    });

    it("returns 404 when card not found", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .get("/api/cards/nonexistent")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/cards/:id", () => {
    it("returns 200 when user updates own card", async () => {
      const updated = { ...mockCard, name: "Black" };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(updated as any);

      const app = createApp();
      const res = await request(app)
        .put("/api/cards/card-1")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validCardBody);

      expect(res.status).toBe(200);
    });

    it("returns 403 when non-admin updates another user's card", async () => {
      const otherCard = { ...mockCard, userId: "other-user" };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(otherCard as any);

      const app = createApp();
      const res = await request(app)
        .put("/api/cards/card-1")
        .set("Authorization", `Bearer ${userToken()}`)
        .send(validCardBody);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/cards/:id/toggle-active", () => {
    it("returns 200 when user toggles own card", async () => {
      const toggled = { ...mockCard, active: false };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(toggled as any);

      const app = createApp();
      const res = await request(app)
        .patch("/api/cards/card-1/toggle-active")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ active: false });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it("returns 200 when admin toggles any card", async () => {
      const toggled = { ...mockCard, active: false };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(toggled as any);

      const app = createApp();
      const res = await request(app)
        .patch("/api/cards/card-1/toggle-active")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ active: false });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it("returns 403 when user toggles another user's card", async () => {
      const otherCard = { ...mockCard, userId: "other-user" };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(otherCard as any);

      const app = createApp();
      const res = await request(app)
        .patch("/api/cards/card-1/toggle-active")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ active: false });

      expect(res.status).toBe(403);
    });
  });
});
