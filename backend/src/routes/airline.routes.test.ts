import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { errorHandler } from "../middlewares/error-handler.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    airline: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    program: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import airlineRoutes from "./airline.routes.js";

const JWT_SECRET = "test-jwt-secret";

const mockAirline = {
  id: "airline-1",
  name: "LATAM",
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
  app.use("/api/airlines", airlineRoutes);
  app.use(errorHandler);
  return app;
}

describe("Airline Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/airlines", () => {
    it("returns 201 when admin creates an airline", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.airline.create).mockResolvedValue(mockAirline);

      const app = createApp();
      const res = await request(app)
        .post("/api/airlines")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "LATAM" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("LATAM");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).post("/api/airlines").send({ name: "LATAM" });
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/airlines")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ name: "LATAM" });
      expect(res.status).toBe(403);
    });

    it("returns 409 when name already exists", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);

      const app = createApp();
      const res = await request(app)
        .post("/api/airlines")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "LATAM" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("NAME_CONFLICT");
    });
  });

  describe("GET /api/airlines", () => {
    it("returns 200 with list of airlines", async () => {
      vi.mocked(prisma.airline.findMany).mockResolvedValue([mockAirline]);

      const app = createApp();
      const res = await request(app)
        .get("/api/airlines")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/airlines");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/airlines/:id", () => {
    it("returns 200 with airline details", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);

      const app = createApp();
      const res = await request(app)
        .get("/api/airlines/airline-1")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("airline-1");
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .get("/api/airlines/nonexistent")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/airlines/:id", () => {
    it("returns 200 when admin updates airline", async () => {
      const updated = { ...mockAirline, name: "LATAM Airlines" };
      vi.mocked(prisma.airline.findUnique)
        .mockResolvedValueOnce(mockAirline)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.airline.update).mockResolvedValue(updated);

      const app = createApp();
      const res = await request(app)
        .put("/api/airlines/airline-1")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "LATAM Airlines" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("LATAM Airlines");
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .put("/api/airlines/airline-1")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ name: "LATAM Airlines" });
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/airlines/:id/deactivate", () => {
    it("returns 200 when admin deactivates airline", async () => {
      const deactivated = { ...mockAirline, active: false };
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);
      vi.mocked(prisma.program.findMany).mockResolvedValue([]);
      vi.mocked(prisma.airline.update).mockResolvedValue(deactivated);

      const app = createApp();
      const res = await request(app)
        .patch("/api/airlines/airline-1/deactivate")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it("returns 409 when active programs are linked", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);
      vi.mocked(prisma.program.findMany).mockResolvedValue([{ name: "LATAM Pass" } as any]);

      const app = createApp();
      const res = await request(app)
        .patch("/api/airlines/airline-1/deactivate")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ACTIVE_LINKS");
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .patch("/api/airlines/airline-1/deactivate")
        .set("Authorization", `Bearer ${userToken()}`);
      expect(res.status).toBe(403);
    });
  });
});
