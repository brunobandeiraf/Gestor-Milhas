import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError, NotFoundError } from "../utils/errors.js";

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

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

import prisma from "../prisma/client.js";
import bcrypt from "bcryptjs";
import { create, completeRegistration, findById, findAll } from "./user.service.js";

const mockUser = {
  id: "user-1",
  email: "user@example.com",
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

const completeData = {
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

describe("UserService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("create", () => {
    it("creates a user with PENDING status and hashed password", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue("$2a$10$hashed" as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

      const result = await create({
        email: "user@example.com",
        password: "secret123",
        adminId: "admin-1",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "user@example.com",
          passwordHash: "$2a$10$hashed",
          role: "USER",
          registrationStatus: "PENDING",
          adminId: "admin-1",
        },
      });
      expect(result.registrationStatus).toBe("PENDING");
      expect(result.role).toBe("USER");
    });

    it("throws ConflictError when email already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      await expect(
        create({ email: "user@example.com", password: "secret123", adminId: "admin-1" })
      ).rejects.toThrow(ConflictError);

      await expect(
        create({ email: "user@example.com", password: "secret123", adminId: "admin-1" })
      ).rejects.toThrow("Email já cadastrado");

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("completeRegistration", () => {
    it("updates user with personal data and sets status to COMPLETE", async () => {
      const completedUser = {
        ...mockUser,
        ...completeData,
        birthDate: new Date(completeData.birthDate),
        registrationStatus: "COMPLETE" as const,
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser) // findUnique by id
        .mockResolvedValueOnce(null); // findUnique by cpf
      vi.mocked(prisma.user.update).mockResolvedValue(completedUser);

      const result = await completeRegistration("user-1", completeData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          fullName: "João Silva",
          cpf: "12345678909",
          birthDate: new Date("2000-01-15T00:00:00.000Z"),
          email: "joao@example.com",
          phone: "11999999999",
          zipCode: "01001000",
          state: "SP",
          city: "São Paulo",
          street: "Rua Exemplo",
          number: "100",
          complement: null,
          neighborhood: "Centro",
          registrationStatus: "COMPLETE",
        },
      });
      expect(result.registrationStatus).toBe("COMPLETE");
    });

    it("throws NotFoundError when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(completeRegistration("nonexistent", completeData)).rejects.toThrow(
        NotFoundError
      );
      await expect(completeRegistration("nonexistent", completeData)).rejects.toThrow(
        "Usuário não encontrado"
      );
    });

    it("throws ConflictError when CPF belongs to another user", async () => {
      const otherUser = { ...mockUser, id: "user-2", cpf: "12345678909" };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser) // findUnique by id
        .mockResolvedValueOnce(otherUser); // findUnique by cpf

      await expect(completeRegistration("user-1", completeData)).rejects.toThrow(ConflictError);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("allows updating own CPF (same user)", async () => {
      const userWithCpf = { ...mockUser, cpf: "12345678909" };
      const completedUser = {
        ...mockUser,
        ...completeData,
        birthDate: new Date(completeData.birthDate),
        registrationStatus: "COMPLETE" as const,
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser) // findUnique by id
        .mockResolvedValueOnce(userWithCpf); // findUnique by cpf — same user
      vi.mocked(prisma.user.update).mockResolvedValue(completedUser);

      const result = await completeRegistration("user-1", completeData);
      expect(result.registrationStatus).toBe("COMPLETE");
    });

    it("stores complement as null when not provided", async () => {
      const completedUser = {
        ...mockUser,
        ...completeData,
        complement: null,
        birthDate: new Date(completeData.birthDate),
        registrationStatus: "COMPLETE" as const,
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.user.update).mockResolvedValue(completedUser);

      await completeRegistration("user-1", completeData);

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
      expect(updateCall.data.complement).toBeNull();
    });
  });

  describe("findById", () => {
    it("returns user when found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await findById("user-1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
      expect(result).toEqual(mockUser);
    });

    it("throws NotFoundError when user does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(findById("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(findById("nonexistent")).rejects.toThrow("Usuário não encontrado");
    });
  });

  describe("findAll", () => {
    it("returns all users managed by the given admin", async () => {
      const users = [mockUser, { ...mockUser, id: "user-2", email: "user2@example.com" }];
      vi.mocked(prisma.user.findMany).mockResolvedValue(users);

      const result = await findAll("admin-1");

      expect(prisma.user.findMany).toHaveBeenCalledWith({ where: { adminId: "admin-1" } });
      expect(result).toHaveLength(2);
    });

    it("returns empty array when admin has no managed users", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      const result = await findAll("admin-no-users");

      expect(result).toEqual([]);
    });
  });
});
