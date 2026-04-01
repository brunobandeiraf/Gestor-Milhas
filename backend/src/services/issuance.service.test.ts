import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

// Mock prisma transaction client
const mockTx = {
  issuance: {
    create: vi.fn(),
  },
  payment: {
    create: vi.fn(),
  },
  loyaltyAccount: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  program: {
    findUnique: vi.fn(),
  },
};

vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockTx)),
    issuance: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./loyalty-account.service.js", () => ({
  getOrCreate: vi.fn(),
  debit: vi.fn(),
  decrementCpf: vi.fn(),
}));

import prisma from "../prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import { create, findAllByUser } from "./issuance.service.js";
import type { IssuanceInput } from "../utils/schemas.js";
import { BusinessRuleError } from "../utils/errors.js";

const mockAccount = {
  id: "account-1",
  userId: "user-1",
  programId: "program-1",
  miles: 50000,
  totalCost: new Decimal(2000),
  averagePrice: new Decimal(40),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAirlineProgram = {
  id: "program-1",
  name: "LATAM Pass",
  type: "AIRLINE",
  airlineId: "airline-1",
  cpfLimit: 3,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBankProgram = {
  id: "program-2",
  name: "Livelo",
  type: "BANK",
  airlineId: null,
  cpfLimit: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockIssuance = {
  id: "issuance-1",
  userId: "user-1",
  programId: "program-1",
  date: new Date("2025-06-01T00:00:00.000Z"),
  cpfUsed: "12345678901",
  milesUsed: 20000,
  cashPaid: new Decimal(150),
  locator: "ABC123",
  passenger: "João Silva",
  realTicketValue: new Decimal(2000),
  totalCost: new Decimal(950),
  savings: new Decimal(1050),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseData: IssuanceInput = {
  programId: "program-1",
  date: "2025-06-01T00:00:00.000Z",
  cpfUsed: "12345678901",
  milesUsed: 20000,
  cashPaid: 150,
  locator: "ABC123",
  passenger: "João Silva",
  realTicketValue: 2000,
  notes: null,
  paymentMethod: "PIX",
};

describe("IssuanceService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx) as any
    );
  });

  describe("create", () => {
    function setupMocks(
      account = mockAccount,
      program = mockAirlineProgram
    ) {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        account as any
      );
      mockTx.program.findUnique.mockResolvedValue(program);
      mockTx.issuance.create.mockResolvedValue(mockIssuance);
      mockTx.payment.create.mockResolvedValue({});
    }

    it("gets or creates loyalty account", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(LoyaltyAccountService.getOrCreate).toHaveBeenCalledWith(
        "user-1",
        "program-1",
        mockTx
      );
    });

    it("throws BusinessRuleError when miles are insufficient", async () => {
      const lowMilesAccount = { ...mockAccount, miles: 1000 };
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        lowMilesAccount as any
      );

      await expect(create("user-1", baseData)).rejects.toThrow(
        BusinessRuleError
      );
      await expect(create("user-1", baseData)).rejects.toThrow(
        "Saldo de milhas insuficiente"
      );
    });

    it("throws BusinessRuleError when CPF is exhausted for AIRLINE program", async () => {
      const noCpfAccount = { ...mockAccount, cpfAvailable: 0 };
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        noCpfAccount as any
      );
      mockTx.program.findUnique.mockResolvedValue(mockAirlineProgram);

      await expect(create("user-1", baseData)).rejects.toThrow(
        BusinessRuleError
      );
      await expect(create("user-1", baseData)).rejects.toThrow(
        "Limite de CPF atingido para este programa"
      );
    });

    it("decrements CPF for AIRLINE programs", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(LoyaltyAccountService.decrementCpf).toHaveBeenCalledWith(
        "account-1",
        mockTx
      );
    });

    it("does NOT decrement CPF for BANK programs", async () => {
      setupMocks(mockAccount, mockBankProgram);

      const data = { ...baseData, programId: "program-2" };
      await create("user-1", data);

      expect(LoyaltyAccountService.decrementCpf).not.toHaveBeenCalled();
    });

    it("calculates totalCost as (milesUsed / 1000 * averagePrice) + cashPaid", async () => {
      setupMocks();

      await create("user-1", baseData);

      // (20000 / 1000) * 40 + 150 = 800 + 150 = 950
      expect(mockTx.issuance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalCost: new Decimal(950),
        }),
      });
    });

    it("calculates savings as realTicketValue - totalCost", async () => {
      setupMocks();

      await create("user-1", baseData);

      // 2000 - 950 = 1050
      expect(mockTx.issuance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          savings: new Decimal(1050),
        }),
      });
    });

    it("debits miles from loyalty account", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(LoyaltyAccountService.debit).toHaveBeenCalledWith(
        "account-1",
        20000,
        mockTx
      );
    });

    it("creates Issuance record with all fields", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(mockTx.issuance.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          programId: "program-1",
          date: new Date("2025-06-01T00:00:00.000Z"),
          cpfUsed: "12345678901",
          milesUsed: 20000,
          cashPaid: new Decimal(150),
          locator: "ABC123",
          passenger: "João Silva",
          realTicketValue: new Decimal(2000),
          totalCost: new Decimal(950),
          savings: new Decimal(1050),
          notes: null,
        },
      });
    });

    it("creates Payment record with cashPaid amount", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(mockTx.payment.create).toHaveBeenCalledWith({
        data: {
          amount: new Decimal(150),
          paymentMethod: "PIX",
          date: new Date("2025-06-01T00:00:00.000Z"),
          issuanceId: "issuance-1",
        },
      });
    });

    it("runs everything inside prisma.$transaction", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("returns the created issuance", async () => {
      setupMocks();

      const result = await create("user-1", baseData);

      expect(result).toEqual(mockIssuance);
    });

    it("handles savings as negative when totalCost exceeds realTicketValue", async () => {
      const expensiveAccount = {
        ...mockAccount,
        averagePrice: new Decimal(200),
      };
      setupMocks(expensiveAccount);

      await create("user-1", baseData);

      // (20000 / 1000) * 200 + 150 = 4000 + 150 = 4150
      // savings = 2000 - 4150 = -2150
      expect(mockTx.issuance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalCost: new Decimal(4150),
          savings: new Decimal(-2150),
        }),
      });
    });
  });

  describe("findAllByUser", () => {
    it("returns all issuances for a user with payment", async () => {
      const issuances = [mockIssuance];
      vi.mocked(prisma.issuance.findMany).mockResolvedValue(issuances as any);

      const result = await findAllByUser("user-1");

      expect(prisma.issuance.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { payment: true },
        orderBy: { date: "desc" },
      });
      expect(result).toEqual(issuances);
    });

    it("returns empty array when user has no issuances", async () => {
      vi.mocked(prisma.issuance.findMany).mockResolvedValue([]);

      const result = await findAllByUser("user-2");

      expect(result).toHaveLength(0);
    });
  });
});
