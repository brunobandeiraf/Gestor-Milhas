import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import { BusinessRuleError, NotFoundError } from "../utils/errors.js";

const { Decimal } = Prisma;

vi.mock("../prisma/client.js", () => ({
  default: {
    loyaltyAccount: {
      findMany: vi.fn(),
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
import {
  getByUser,
  getOrCreate,
  credit,
  debit,
  decrementCpf,
} from "./loyalty-account.service.js";

const mockAccount = {
  id: "account-1",
  userId: "user-1",
  programId: "program-1",
  miles: 10000,
  totalCost: new Decimal(350),
  averagePrice: new Decimal(35),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProgram = {
  id: "program-1",
  name: "LATAM Pass",
  type: "AIRLINE" as const,
  airlineId: "airline-1",
  cpfLimit: 5,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("LoyaltyAccountService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getByUser", () => {
    it("returns all loyalty accounts for a user", async () => {
      const accounts = [mockAccount];
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue(accounts as any);

      const result = await getByUser("user-1");

      expect(prisma.loyaltyAccount.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { program: true },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toHaveLength(1);
    });

    it("returns empty array when user has no accounts", async () => {
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue([]);

      const result = await getByUser("user-2");

      expect(result).toHaveLength(0);
    });
  });

  describe("getOrCreate", () => {
    it("returns existing account when found", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);

      const result = await getOrCreate("user-1", "program-1");

      expect(prisma.loyaltyAccount.findUnique).toHaveBeenCalledWith({
        where: { userId_programId: { userId: "user-1", programId: "program-1" } },
      });
      expect(result).toEqual(mockAccount);
      expect(prisma.loyaltyAccount.create).not.toHaveBeenCalled();
    });

    it("creates new account for AIRLINE program with cpfLimit", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.program.findUnique).mockResolvedValue(mockProgram as any);
      vi.mocked(prisma.loyaltyAccount.create).mockResolvedValue({
        ...mockAccount,
        miles: 0,
        totalCost: new Decimal(0),
        averagePrice: new Decimal(0),
        cpfAvailable: 5,
      } as any);

      const result = await getOrCreate("user-1", "program-1");

      expect(prisma.loyaltyAccount.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          programId: "program-1",
          miles: 0,
          totalCost: new Decimal(0),
          averagePrice: new Decimal(0),
          cpfAvailable: 5,
        },
      });
      expect(result.cpfAvailable).toBe(5);
    });

    it("creates new account for BANK program with cpfAvailable 0", async () => {
      const bankProgram = { ...mockProgram, type: "BANK" as const, airlineId: null, cpfLimit: null };
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.program.findUnique).mockResolvedValue(bankProgram as any);
      vi.mocked(prisma.loyaltyAccount.create).mockResolvedValue({
        ...mockAccount,
        miles: 0,
        totalCost: new Decimal(0),
        averagePrice: new Decimal(0),
        cpfAvailable: 0,
      } as any);

      await getOrCreate("user-1", "program-1");

      expect(prisma.loyaltyAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ cpfAvailable: 0 }),
      });
    });

    it("throws NotFoundError when program does not exist", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);

      await expect(getOrCreate("user-1", "nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("uses transaction client when provided", async () => {
      const txClient = {
        loyaltyAccount: {
          findUnique: vi.fn().mockResolvedValue(mockAccount),
        },
        program: { findUnique: vi.fn() },
      };

      const result = await getOrCreate("user-1", "program-1", txClient as any);

      expect(txClient.loyaltyAccount.findUnique).toHaveBeenCalled();
      expect(prisma.loyaltyAccount.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockAccount);
    });
  });

  describe("credit", () => {
    it("adds miles and cost to account", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await credit("account-1", 5000, 200);

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: {
          miles: 15000,
          totalCost: new Decimal(550),
        },
      });
    });

    it("throws NotFoundError when account not found", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);

      await expect(credit("nonexistent", 1000, 50)).rejects.toThrow(NotFoundError);
    });

    it("uses transaction client when provided", async () => {
      const txClient = {
        loyaltyAccount: {
          findUnique: vi.fn().mockResolvedValue(mockAccount),
          update: vi.fn().mockResolvedValue({}),
        },
      };

      await credit("account-1", 5000, 200, txClient as any);

      expect(txClient.loyaltyAccount.findUnique).toHaveBeenCalled();
      expect(txClient.loyaltyAccount.update).toHaveBeenCalled();
      expect(prisma.loyaltyAccount.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("debit", () => {
    it("subtracts miles from account", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await debit("account-1", 3000);

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { miles: 7000 },
      });
    });

    it("throws BusinessRuleError when insufficient balance", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);

      await expect(debit("account-1", 15000)).rejects.toThrow(BusinessRuleError);
      await expect(debit("account-1", 15000)).rejects.toThrow(
        "Saldo de milhas insuficiente"
      );
      expect(prisma.loyaltyAccount.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when account not found", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);

      await expect(debit("nonexistent", 1000)).rejects.toThrow(NotFoundError);
    });

    it("allows debiting exact balance", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await debit("account-1", 10000);

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { miles: 0 },
      });
    });
  });

  describe("decrementCpf", () => {
    it("decrements cpfAvailable by 1", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(mockAccount as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await decrementCpf("account-1");

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { cpfAvailable: 2 },
      });
    });

    it("throws BusinessRuleError when cpfAvailable is 0", async () => {
      const accountNoCpf = { ...mockAccount, cpfAvailable: 0 };
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(accountNoCpf as any);

      await expect(decrementCpf("account-1")).rejects.toThrow(BusinessRuleError);
      await expect(decrementCpf("account-1")).rejects.toThrow(
        "Limite de CPF atingido para este programa"
      );
      expect(prisma.loyaltyAccount.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when account not found", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);

      await expect(decrementCpf("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("uses transaction client when provided", async () => {
      const txClient = {
        loyaltyAccount: {
          findUnique: vi.fn().mockResolvedValue(mockAccount),
          update: vi.fn().mockResolvedValue({}),
        },
      };

      await decrementCpf("account-1", txClient as any);

      expect(txClient.loyaltyAccount.findUnique).toHaveBeenCalled();
      expect(txClient.loyaltyAccount.update).toHaveBeenCalled();
      expect(prisma.loyaltyAccount.findUnique).not.toHaveBeenCalled();
    });
  });
});
