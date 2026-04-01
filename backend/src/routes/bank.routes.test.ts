import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { errorHandler } from "../middlewares/error-handler.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    bank: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    card: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import bankRoutes from "./bank.routes.js";

const JWT_SECRET = "test-jwt-secret";

const mockBank = {
  id: "bank-1",
  name: "Itaú",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
  registrationStatus: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

const adminToken = () =>
  generateToken({
    userId: "admin-1",
    email: "admin@test.com",
    role: "ADMIN",
    registrationStatus: "COMPLETE",
  });

const userToken = () =>
  generateToken({
    userId: "user-1",
    email: "user@test.com",
    role: "USER",
    registrationStatus: "COMPLETE",
  });

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/banks", bankRoutes);
  app.use(errorHandler);
  return app;
}

describe("Bank Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/banks", () => {
    it("returns 201 when admin creates a bank", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.bank.create).mockResolvedValue(mockBank);

      const app = createApp();
      const res = await request(app)
        .post("/api/banks")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Itaú" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Itaú");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).post("/api/banks").send({ name: "Itaú" });
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/banks")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ name: "Itaú" });
      expect(res.status).toBe(403);
    });

    it("returns 409 when name already exists", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);

      const app = createApp();
      const res = await request(app)
        .post("/api/banks")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Itaú" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("NAME_CONFLICT");
    });
  });

  describe("GET /api/banks", () => {
    it("returns 200 with list of banks", async () => {
      vi.mocked(prisma.bank.findMany).mockResolvedValue([mockBank]);

      const app = createApp();
      const res = await request(app)
        .get("/api/banks")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/banks");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/banks/:id", () => {
    it("returns 200 with bank details", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);

      const app = createApp();
      const res = await request(app)
        .get("/api/banks/bank-1")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("bank-1");
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .get("/api/banks/nonexistent")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/banks/:id", () => {
    it("returns 200 when admin updates bank", async () => {
      const updated = { ...mockBank, name: "Itaú Unibanco" };
      vi.mocked(prisma.bank.findUnique)
        .mockResolvedValueOnce(mockBank)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.bank.update).mockResolvedValue(updated);

      const app = createApp();
      const res = await request(app)
        .put("/api/banks/bank-1")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Itaú Unibanco" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Itaú Unibanco");
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .put("/api/banks/bank-1")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ name: "Itaú Unibanco" });
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/banks/:id/deactivate", () => {
    it("returns 200 when admin deactivates bank", async () => {
      const deactivated = { ...mockBank, active: false };
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);
      vi.mocked(prisma.card.findMany).mockResolvedValue([]);
      vi.mocked(prisma.bank.update).mockResolvedValue(deactivated);

      const app = createApp();
      const res = await request(app)
        .patch("/api/banks/bank-1/deactivate")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it("returns 409 when active cards are linked", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);
      vi.mocked(prisma.card.findMany).mockResolvedValue([{ name: "Platinum" } as any]);

      const app = createApp();
      const res = await request(app)
        .patch("/api/banks/bank-1/deactivate")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACTIVE_LINKS");
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .patch("/api/banks/bank-1/deactivate")
        .set("Authorization", `Bearer ${userToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
