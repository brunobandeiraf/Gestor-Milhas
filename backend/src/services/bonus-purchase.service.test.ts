import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

// Mock prisma transaction client
const mockTx = {
  bonusPurchase: {
    create: vi.fn(),
  },
  schedule: {
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
    bonusPurchase: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./loyalty-account.service.js", () => ({
  getOrCreate: vi.fn(),
}));

import prisma from "../prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import { create, findAllByUser } from "./bonus-purchase.service.js";
import type { BonusPurchaseInput } from "../utils/schemas.js";

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

const mockBonusPurchase = {
  id: "bp-1",
  userId: "user-1",
  programId: "program-1",
  product: "iPhone 15",
  store: "Amazon",
  pointsPerReal: new Decimal(10),
  totalValue: new Decimal(5000),
  calculatedPoints: 50000,
  purchaseDate: new Date("2025-01-15T00:00:00.000Z"),
  productReceiveDate: new Date("2025-01-20T00:00:00.000Z"),
  pointsReceiveDate: new Date("2025-02-15T00:00:00.000Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("BonusPurchaseService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx) as any
    );
  });

  describe("create", () => {
    const validData: BonusPurchaseInput = {
      programId: "program-1",
      product: "iPhone 15",
      store: "Amazon",
      pointsPerReal: 10,
      totalValue: 5000,
      purchaseDate: "2025-01-15T00:00:00.000Z",
      productReceiveDate: "2025-01-20T00:00:00.000Z",
      pointsReceiveDate: "2025-02-15T00:00:00.000Z",
    };

    it("calculates points as floor(pointsPerReal * totalValue)", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.bonusPurchase.create.mockResolvedValue(mockBonusPurchase);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(mockTx.bonusPurchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          calculatedPoints: 50000, // 10 * 5000
        }),
      });
    });

    it("floors calculated points for non-integer results", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.bonusPurchase.create.mockResolvedValue({ ...mockBonusPurchase, calculatedPoints: 33333 });
      mockTx.schedule.create.mockResolvedValue({});

      const data: BonusPurchaseInput = {
        ...validData,
        pointsPerReal: 3.3333,
        totalValue: 10000,
      };

      await create("user-1", data);

      // 3.3333 * 10000 = 33333.0 → floor = 33333
      expect(mockTx.bonusPurchase.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          calculatedPoints: 33333,
        }),
      });
    });

    it("creates a BONUS_PURCHASE_CREDIT schedule with pointsReceiveDate", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.bonusPurchase.create.mockResolvedValue(mockBonusPurchase);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(mockTx.schedule.create).toHaveBeenCalledWith({
        data: {
          type: "BONUS_PURCHASE_CREDIT",
          status: "PENDING",
          executionDate: new Date("2025-02-15T00:00:00.000Z"),
          loyaltyAccountId: "account-1",
          bonusPurchaseId: "bp-1",
          milesAmount: 50000,
          costAmount: new Decimal(5000),
        },
      });
    });

    it("calls getOrCreate with correct userId and programId", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.bonusPurchase.create.mockResolvedValue(mockBonusPurchase);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(LoyaltyAccountService.getOrCreate).toHaveBeenCalledWith(
        "user-1",
        "program-1",
        mockTx
      );
    });

    it("creates BonusPurchase record with all fields", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.bonusPurchase.create.mockResolvedValue(mockBonusPurchase);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(mockTx.bonusPurchase.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          programId: "program-1",
          product: "iPhone 15",
          store: "Amazon",
          pointsPerReal: new Decimal(10),
          totalValue: new Decimal(5000),
          calculatedPoints: 50000,
          purchaseDate: new Date("2025-01-15T00:00:00.000Z"),
          productReceiveDate: new Date("2025-01-20T00:00:00.000Z"),
          pointsReceiveDate: new Date("2025-02-15T00:00:00.000Z"),
        },
      });
    });

    it("runs everything inside prisma.$transaction", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.bonusPurchase.create.mockResolvedValue(mockBonusPurchase);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("returns the created bonus purchase", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(mockAccount as any);
      mockTx.bonusPurchase.create.mockResolvedValue(mockBonusPurchase);
      mockTx.schedule.create.mockResolvedValue({});

      const result = await create("user-1", validData);

      expect(result).toEqual(mockBonusPurchase);
    });
  });

  describe("findAllByUser", () => {
    it("returns all bonus purchases for a user with program and schedules", async () => {
      const purchases = [mockBonusPurchase];
      vi.mocked(prisma.bonusPurchase.findMany).mockResolvedValue(purchases as any);

      const result = await findAllByUser("user-1");

      expect(prisma.bonusPurchase.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { program: true, schedules: true },
        orderBy: { purchaseDate: "desc" },
      });
      expect(result).toEqual(purchases);
    });

    it("returns empty array when user has no bonus purchases", async () => {
      vi.mocked(prisma.bonusPurchase.findMany).mockResolvedValue([]);

      const result = await findAllByUser("user-2");

      expect(result).toHaveLength(0);
    });
  });
});
