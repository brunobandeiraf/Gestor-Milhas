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
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";
import authRoutes from "./auth.routes.js";

const JWT_SECRET = "test-jwt-secret";
const JWT_REFRESH_SECRET = "test-jwt-refresh-secret";

const mockUser = {
  id: "user-1",
  email: "user@test.com",
  passwordHash: "$2a$10$hashedpassword",
  role: "USER" as const,
  registrationStatus: "COMPLETE" as const,
  fullName: "Test User",
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

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use(errorHandler);
  return app;
}

describe("Auth Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
  });

  describe("POST /api/auth/login", () => {
    it("returns 200 with tokens for valid credentials", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const app = createApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@test.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");

      const decoded = jwt.verify(res.body.accessToken, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("user@test.com");
    });

    it("returns 401 for invalid credentials", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrong@test.com", password: "password123" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
      expect(res.body.error.message).toBe("Email ou senha inválidos");
    });

    it("returns 401 for wrong password", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const app = createApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@test.com", password: "wrongpass" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("returns 400 for missing email", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid email format", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "password123" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for missing password", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@test.com" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for empty password", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@test.com", password: "" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("returns 200 with new access token for valid refresh token", async () => {
      const validRefreshToken = jwt.sign(
        { userId: "user-1" },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const app = createApp();
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).not.toHaveProperty("refreshToken");

      const decoded = jwt.verify(res.body.accessToken, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe("user-1");
    });

    it("returns 401 for invalid refresh token", async () => {
      const app = createApp();
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
      expect(res.body.error.message).toBe("Token inválido ou expirado");
    });

    it("returns 401 for expired refresh token", async () => {
      const expiredToken = jwt.sign(
        { userId: "user-1" },
        JWT_REFRESH_SECRET,
        { expiresIn: "0s" }
      );

      await new Promise((r) => setTimeout(r, 10));

      const app = createApp();
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: expiredToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("returns 401 when user no longer exists", async () => {
      const validRefreshToken = jwt.sign(
        { userId: "deleted-user" },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const app = createApp();
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTHENTICATION_ERROR");
    });
  });
});
