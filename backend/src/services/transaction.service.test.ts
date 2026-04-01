import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

// Mock prisma client
const mockTx = {
  transaction: {
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
    transaction: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./loyalty-account.service.js", () => ({
  getOrCreate: vi.fn(),
  credit: vi.fn(),
}));

vi.mock("./average-price.service.js", () => ({
  recalculate: vi.fn(),
}));

import prisma from "../prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import * as AveragePriceService from "./average-price.service.js";
import { create, findAllByUser } from "./transaction.service.js";
import type { TransactionInput } from "../utils/schemas.js";

const mockAccount = {
  id: "account-1",
  userId: "user-1",
  programId: "program-1",
  miles: 5000,
  totalCost: new Decimal(200),
  averagePrice: new Decimal(40),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransaction = {
  id: "txn-1",
  userId: "user-1",
  programId: "program-1",
  type: "PURCHASE" as const,
  miles: 10000,
  totalCost: new Decimal(350),
  costPerK: new Decimal(35),
  date: new Date("2025-01-15T00:00:00.000Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("TransactionService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Re-setup $transaction mock after reset
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx) as any
    );
  });

  describe("create", () => {
    it("creates transaction with costPerK (VM) and calculates totalCost", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue(mockTransaction);
      mockTx.payment.create.mockResolvedValue({});

      const data: TransactionInput = {
        programId: "program-1",
        type: "PURCHASE",
        miles: 10000,
        costPerK: 35,
        date: "2025-01-15T00:00:00.000Z",
        paymentMethod: "PIX",
      };

      const result = await create("user-1", data);

      // VM * (miles / 1000) = 35 * 10 = 350
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          programId: "program-1",
          type: "PURCHASE",
          miles: 10000,
          totalCost: new Decimal(350),
          costPerK: new Decimal(35),
        }),
      });
      expect(result).toEqual(mockTransaction);
    });

    it("creates transaction with totalCost (VT) and calculates costPerK", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue(mockTransaction);
      mockTx.payment.create.mockResolvedValue({});

      const data: TransactionInput = {
        programId: "program-1",
        type: "PURCHASE",
        miles: 10000,
        totalCost: 350,
        date: "2025-01-15T00:00:00.000Z",
        paymentMethod: "CREDIT_CARD",
      };

      await create("user-1", data);

      // VT / (miles / 1000) = 350 / 10 = 35
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalCost: new Decimal(350),
          costPerK: new Decimal(35),
        }),
      });
    });

    it("credits miles to loyalty account", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue(mockTransaction);
      mockTx.payment.create.mockResolvedValue({});

      const data: TransactionInput = {
        programId: "program-1",
        type: "PURCHASE",
        miles: 10000,
        costPerK: 35,
        date: "2025-01-15T00:00:00.000Z",
        paymentMethod: "PIX",
      };

      await create("user-1", data);

      expect(LoyaltyAccountService.credit).toHaveBeenCalledWith(
        "account-1",
        10000,
        350, // totalCost = 35 * 10
        mockTx
      );
    });

    it("recalculates average price after crediting", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue(mockTransaction);
      mockTx.payment.create.mockResolvedValue({});

      const data: TransactionInput = {
        programId: "program-1",
        type: "BONUS",
        miles: 5000,
        costPerK: 20,
        date: "2025-01-15T00:00:00.000Z",
        paymentMethod: "OTHER",
      };

      await create("user-1", data);

      expect(AveragePriceService.recalculate).toHaveBeenCalledWith(
        "account-1",
        mockTx
      );
    });

    it("creates payment record with correct amount and method", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue({ ...mockTransaction, id: "txn-2" });
      mockTx.payment.create.mockResolvedValue({});

      const data: TransactionInput = {
        programId: "program-1",
        type: "PURCHASE",
        miles: 6000,
        costPerK: 40,
        date: "2025-02-01T00:00:00.000Z",
        paymentMethod: "BANK_TRANSFER",
      };

      await create("user-1", data);

      // totalCost = 40 * 6 = 240
      expect(mockTx.payment.create).toHaveBeenCalledWith({
        data: {
          amount: new Decimal(240),
          paymentMethod: "BANK_TRANSFER",
          date: new Date("2025-02-01T00:00:00.000Z"),
          transactionId: "txn-2",
        },
      });
    });

    it("calls getOrCreate with correct userId and programId", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue(mockTransaction);
      mockTx.payment.create.mockResolvedValue({});

      const data: TransactionInput = {
        programId: "program-1",
        type: "CARD_POINTS",
        miles: 3000,
        totalCost: 0,
        date: "2025-01-15T00:00:00.000Z",
        paymentMethod: "OTHER",
      };

      await create("user-1", data);

      expect(LoyaltyAccountService.getOrCreate).toHaveBeenCalledWith(
        "user-1",
        "program-1",
        mockTx
      );
    });

    it("handles all transaction types", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue(mockTransaction);
      mockTx.payment.create.mockResolvedValue({});

      for (const type of ["PURCHASE", "BONUS", "CARD_POINTS", "MANUAL_ADJUST"] as const) {
        vi.resetAllMocks();
        vi.mocked(prisma.$transaction).mockImplementation(
          (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx) as any
        );
        vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
        mockTx.transaction.create.mockResolvedValue({ ...mockTransaction, type });
        mockTx.payment.create.mockResolvedValue({});

        const data: TransactionInput = {
          programId: "program-1",
          type,
          miles: 1000,
          costPerK: 30,
          date: "2025-01-15T00:00:00.000Z",
          paymentMethod: "PIX",
        };

        await create("user-1", data);

        expect(mockTx.transaction.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ type }),
        });
      }
    });

    it("runs everything inside prisma.$transaction", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.transaction.create.mockResolvedValue(mockTransaction);
      mockTx.payment.create.mockResolvedValue({});

      const data: TransactionInput = {
        programId: "program-1",
        type: "PURCHASE",
        miles: 1000,
        costPerK: 30,
        date: "2025-01-15T00:00:00.000Z",
        paymentMethod: "PIX",
      };

      await create("user-1", data);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("findAllByUser", () => {
    it("returns all transactions for a user with program and payment", async () => {
      const transactions = [mockTransaction];
      vi.mocked(prisma.transaction.findMany).mockResolvedValue(transactions as any);

      const result = await findAllByUser("user-1");

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { program: true, payment: true },
        orderBy: { date: "desc" },
      });
      expect(result).toEqual(transactions);
    });

    it("returns empty array when user has no transactions", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);

      const result = await findAllByUser("user-2");

      expect(result).toHaveLength(0);
    });
  });
});
