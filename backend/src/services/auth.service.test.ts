import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../utils/errors.js";

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
import { login, refresh } from "./auth.service.js";

const JWT_SECRET = "test-jwt-secret";
const JWT_REFRESH_SECRET = "test-jwt-refresh-secret";

const mockUser = {
  id: "user-1",
  email: "user@example.com",
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

describe("AuthService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
  });

  describe("login", () => {
    it("returns access and refresh tokens for valid credentials", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login("user@example.com", "password123");

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");

      const decoded = jwt.verify(result.accessToken, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("user@example.com");
      expect(decoded.role).toBe("USER");
      expect(decoded.registrationStatus).toBe("COMPLETE");
    });

    it("throws AuthenticationError when user is not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(login("unknown@example.com", "password123")).rejects.toThrow(
        AuthenticationError
      );
      await expect(login("unknown@example.com", "password123")).rejects.toThrow(
        "Email ou senha inválidos"
      );
    });

    it("throws AuthenticationError when password is wrong", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(login("user@example.com", "wrongpassword")).rejects.toThrow(
        AuthenticationError
      );
      await expect(login("user@example.com", "wrongpassword")).rejects.toThrow(
        "Email ou senha inválidos"
      );
    });

    it("includes registrationStatus PENDING in token for pending users", async () => {
      const pendingUser = { ...mockUser, registrationStatus: "PENDING" as const };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(pendingUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login("user@example.com", "password123");
      const decoded = jwt.verify(result.accessToken, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.registrationStatus).toBe("PENDING");
    });

    it("includes role ADMIN in token for admin users", async () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login("user@example.com", "password123");
      const decoded = jwt.verify(result.accessToken, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.role).toBe("ADMIN");
    });

    it("generates a valid refresh token with userId", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login("user@example.com", "password123");
      const decoded = jwt.verify(result.refreshToken, JWT_REFRESH_SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe("user-1");
    });
  });

  describe("refresh", () => {
    it("returns a new access token for a valid refresh token", async () => {
      const validRefreshToken = jwt.sign({ userId: "user-1" }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await refresh(validRefreshToken);

      expect(result).toHaveProperty("accessToken");
      const decoded = jwt.verify(result.accessToken, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("user@example.com");
      expect(decoded.role).toBe("USER");
      expect(decoded.registrationStatus).toBe("COMPLETE");
    });

    it("throws AuthenticationError for an expired refresh token", async () => {
      const expiredToken = jwt.sign({ userId: "user-1" }, JWT_REFRESH_SECRET, { expiresIn: "0s" });

      // Small delay to ensure token is expired
      await new Promise((r) => setTimeout(r, 10));

      await expect(refresh(expiredToken)).rejects.toThrow(AuthenticationError);
      await expect(refresh(expiredToken)).rejects.toThrow("Token inválido ou expirado");
    });

    it("throws AuthenticationError for an invalid refresh token", async () => {
      await expect(refresh("invalid-token")).rejects.toThrow(AuthenticationError);
      await expect(refresh("invalid-token")).rejects.toThrow("Token inválido ou expirado");
    });

    it("throws AuthenticationError when user no longer exists", async () => {
      const validRefreshToken = jwt.sign({ userId: "deleted-user" }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(refresh(validRefreshToken)).rejects.toThrow(AuthenticationError);
      await expect(refresh(validRefreshToken)).rejects.toThrow("Token inválido ou expirado");
    });

    it("throws AuthenticationError for a token signed with wrong secret", async () => {
      const wrongSecretToken = jwt.sign({ userId: "user-1" }, "wrong-secret", { expiresIn: "7d" });

      await expect(refresh(wrongSecretToken)).rejects.toThrow(AuthenticationError);
      await expect(refresh(wrongSecretToken)).rejects.toThrow("Token inválido ou expirado");
    });
  });
});
