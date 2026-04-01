import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { errorHandler } from "../middlewares/error-handler.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    program: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import programRoutes from "./program.routes.js";

const JWT_SECRET = "test-jwt-secret";

const mockAirlineProgram = {
  id: "prog-1",
  name: "LATAM Pass",
  type: "AIRLINE",
  airlineId: "airline-1",
  cpfLimit: 3,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  airline: { id: "airline-1", name: "LATAM", active: true, createdAt: new Date(), updatedAt: new Date() },
};

const mockBankProgram = {
  id: "prog-2",
  name: "Livelo",
  type: "BANK",
  airlineId: null,
  cpfLimit: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  airline: null,
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
  app.use("/api/programs", programRoutes);
  app.use(errorHandler);
  return app;
}

describe("Program Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/programs", () => {
    it("returns 201 when admin creates an AIRLINE program", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.program.create).mockResolvedValue(mockAirlineProgram as any);

      const app = createApp();
      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "LATAM Pass", type: "AIRLINE", airlineId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("LATAM Pass");
      expect(res.body.type).toBe("AIRLINE");
    });

    it("returns 201 when admin creates a BANK program", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.program.create).mockResolvedValue(mockBankProgram as any);

      const app = createApp();
      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Livelo", type: "BANK" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Livelo");
      expect(res.body.type).toBe("BANK");
    });

    it("returns 400 when AIRLINE type has no airlineId (Zod validation)", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Test", type: "AIRLINE" });

      expect(res.status).toBe(400);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/programs")
        .send({ name: "Test", type: "BANK" });
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ name: "Test", type: "BANK" });
      expect(res.status).toBe(403);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${pendingToken()}`)
        .send({ name: "Test", type: "BANK" });
      expect(res.status).toBe(403);
    });

    it("returns 409 when name already exists", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(mockAirlineProgram as any);

      const app = createApp();
      const res = await request(app)
        .post("/api/programs")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "LATAM Pass", type: "AIRLINE", airlineId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("NAME_CONFLICT");
    });
  });

  describe("GET /api/programs", () => {
    it("returns 200 with list of programs", async () => {
      vi.mocked(prisma.program.findMany).mockResolvedValue([mockAirlineProgram, mockBankProgram] as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/programs")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/programs");
      expect(res.status).toBe(401);
    });

    it("returns 403 for user with PENDING registration", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/programs")
        .set("Authorization", `Bearer ${pendingToken()}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/programs/:id", () => {
    it("returns 200 with program details", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(mockAirlineProgram as any);

      const app = createApp();
      const res = await request(app)
        .get("/api/programs/prog-1")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("prog-1");
      expect(res.body.airline).toBeDefined();
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .get("/api/programs/nonexistent")
        .set("Authorization", `Bearer ${userToken()}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/programs/:id", () => {
    it("returns 200 when admin updates program", async () => {
      const updated = { ...mockAirlineProgram, name: "LATAM Pass Plus" };
      vi.mocked(prisma.program.findUnique)
        .mockResolvedValueOnce(mockAirlineProgram as any) // findById
        .mockResolvedValueOnce(null); // name uniqueness check
      vi.mocked(prisma.program.update).mockResolvedValue(updated as any);

      const app = createApp();
      const res = await request(app)
        .put("/api/programs/prog-1")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "LATAM Pass Plus", type: "AIRLINE", airlineId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("LATAM Pass Plus");
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .put("/api/programs/prog-1")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ name: "Test", type: "BANK" });
      expect(res.status).toBe(403);
    });

    it("returns 404 when program not found", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .put("/api/programs/nonexistent")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ name: "Test", type: "BANK" });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/programs/:id/toggle-active", () => {
    it("returns 200 when admin deactivates program", async () => {
      const deactivated = { ...mockAirlineProgram, active: false };
      vi.mocked(prisma.program.findUnique).mockResolvedValue(mockAirlineProgram as any);
      vi.mocked(prisma.program.update).mockResolvedValue(deactivated as any);

      const app = createApp();
      const res = await request(app)
        .patch("/api/programs/prog-1/toggle-active")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ active: false });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });

    it("returns 200 when admin activates program", async () => {
      const activated = { ...mockAirlineProgram, active: true };
      vi.mocked(prisma.program.findUnique).mockResolvedValue({ ...mockAirlineProgram, active: false } as any);
      vi.mocked(prisma.program.update).mockResolvedValue(activated as any);

      const app = createApp();
      const res = await request(app)
        .patch("/api/programs/prog-1/toggle-active")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ active: true });

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(true);
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .patch("/api/programs/prog-1/toggle-active")
        .set("Authorization", `Bearer ${userToken()}`)
        .send({ active: false });
      expect(res.status).toBe(403);
    });

    it("returns 404 when program not found", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .patch("/api/programs/nonexistent/toggle-active")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ active: false });

      expect(res.status).toBe(404);
    });
  });
});
