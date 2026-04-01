import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { errorHandler } from "../middlewares/error-handler.js";

// Mock prisma
vi.mock("../prisma/client.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";
import userRoutes from "./user.routes.js";

const JWT_SECRET = "test-jwt-secret";

const mockAdmin = {
  id: "admin-1",
  email: "admin@test.com",
  passwordHash: "$2a$10$hashed",
  role: "ADMIN" as const,
  registrationStatus: "COMPLETE" as const,
  fullName: "Admin User",
  cpf: null,
  birthDate: null,
  phone: null,
  zipCode: null,
  state: null,
  city: null,
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  adminId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser = {
  id: "user-1",
  email: "user@test.com",
  passwordHash: "$2a$10$hashed",
  role: "USER" as const,
  registrationStatus: "PENDING" as const,
  fullName: null,
  cpf: null,
  birthDate: null,
  phone: null,
  zipCode: null,
  state: null,
  city: null,
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  adminId: "admin-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const completeRegData = {
  fullName: "João Silva",
  cpf: "12345678909",
  birthDate: "2000-01-15T00:00:00.000Z",
  email: "joao@example.com",
  phone: "11999999999",
  zipCode: "01001000",
  state: "SP",
  city: "São Paulo",
  street: "Rua Exemplo",
  number: "100",
  neighborhood: "Centro",
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

const pendingUserToken = () =>
  generateToken({
    userId: "user-1",
    email: "user@test.com",
    role: "USER",
    registrationStatus: "PENDING",
  });

const completeUserToken = () =>
  generateToken({
    userId: "user-1",
    email: "user@test.com",
    role: "USER",
    registrationStatus: "COMPLETE",
  });

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  app.use(errorHandler);
  return app;
}

describe("User Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  describe("POST /api/users", () => {
    it("returns 201 when admin creates a user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("$2a$10$hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

      const app = createApp();
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ email: "user@test.com", password: "secret123" });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe("user@test.com");
      expect(res.body.registrationStatus).toBe("PENDING");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/users")
        .send({ email: "user@test.com", password: "secret123" });

      expect(res.status).toBe(401);
    });

    it("returns 403 when non-admin tries to create user", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${completeUserToken()}`)
        .send({ email: "user@test.com", password: "secret123" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTHORIZATION_ERROR");
    });

    it("returns 403 when admin with PENDING status tries to create user", async () => {
      const pendingAdminToken = generateToken({
        userId: "admin-1",
        email: "admin@test.com",
        role: "ADMIN",
        registrationStatus: "PENDING",
      });

      const app = createApp();
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${pendingAdminToken}`)
        .send({ email: "user@test.com", password: "secret123" });

      expect(res.status).toBe(403);
    });

    it("returns 409 when email already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const app = createApp();
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken()}`)
        .send({ email: "user@test.com", password: "secret123" });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_CONFLICT");
    });
  });

  describe("GET /api/users", () => {
    it("returns 200 with list of managed users for admin", async () => {
      const users = [mockUser];
      vi.mocked(prisma.user.findMany).mockResolvedValue(users);

      const app = createApp();
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app).get("/api/users");

      expect(res.status).toBe(401);
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${completeUserToken()}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns 200 with user details for admin", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const app = createApp();
      const res = await request(app)
        .get("/api/users/user-1")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("user-1");
    });

    it("returns 404 when user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .get("/api/users/nonexistent")
        .set("Authorization", `Bearer ${adminToken()}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 for non-admin user", async () => {
      const app = createApp();
      const res = await request(app)
        .get("/api/users/user-1")
        .set("Authorization", `Bearer ${completeUserToken()}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/users/:id/complete-registration", () => {
    it("returns 200 when user completes registration", async () => {
      const completedUser = {
        ...mockUser,
        ...completeRegData,
        birthDate: new Date(completeRegData.birthDate),
        registrationStatus: "COMPLETE" as const,
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce(null); // cpf check
      vi.mocked(prisma.user.update).mockResolvedValue(completedUser);

      const app = createApp();
      const res = await request(app)
        .put("/api/users/user-1/complete-registration")
        .set("Authorization", `Bearer ${pendingUserToken()}`)
        .send(completeRegData);

      expect(res.status).toBe(200);
      expect(res.body.registrationStatus).toBe("COMPLETE");
      expect(res.body.fullName).toBe("João Silva");
    });

    it("allows PENDING user to complete registration (no requireCompleteRegistration)", async () => {
      const completedUser = {
        ...mockUser,
        ...completeRegData,
        birthDate: new Date(completeRegData.birthDate),
        registrationStatus: "COMPLETE" as const,
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.user.update).mockResolvedValue(completedUser);

      const app = createApp();
      const res = await request(app)
        .put("/api/users/user-1/complete-registration")
        .set("Authorization", `Bearer ${pendingUserToken()}`)
        .send(completeRegData);

      // Should NOT be blocked by requireCompleteRegistration
      expect(res.status).toBe(200);
    });

    it("returns 400 for invalid body (missing required fields)", async () => {
      const app = createApp();
      const res = await request(app)
        .put("/api/users/user-1/complete-registration")
        .set("Authorization", `Bearer ${pendingUserToken()}`)
        .send({ fullName: "João" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 401 without authentication", async () => {
      const app = createApp();
      const res = await request(app)
        .put("/api/users/user-1/complete-registration")
        .send(completeRegData);

      expect(res.status).toBe(401);
    });

    it("returns 409 when CPF belongs to another user", async () => {
      const otherUser = { ...mockUser, id: "user-2", cpf: "12345678909" };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce(otherUser); // cpf check

      const app = createApp();
      const res = await request(app)
        .put("/api/users/user-1/complete-registration")
        .set("Authorization", `Bearer ${pendingUserToken()}`)
        .send(completeRegData);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CPF_CONFLICT");
    });
  });
});
