import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

// Mock prisma transaction client
const mockTx = {
  transfer: {
    create: vi.fn(),
  },
  schedule: {
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
    transfer: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./loyalty-account.service.js", () => ({
  getOrCreate: vi.fn(),
  debit: vi.fn(),
}));

vi.mock("./average-price.service.js", () => ({
  recalculate: vi.fn(),
}));

import prisma from "../prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import * as AveragePriceService from "./average-price.service.js";
import { create, findAllByUser } from "./transfer.service.js";
import type { TransferInput } from "../utils/schemas.js";

const mockOriginAccount = {
  id: "origin-account-1",
  userId: "user-1",
  programId: "origin-program-1",
  miles: 50000,
  totalCost: new Decimal(2000),
  averagePrice: new Decimal(40),
  cpfAvailable: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDestinationAccount = {
  id: "dest-account-1",
  userId: "user-1",
  programId: "dest-program-1",
  miles: 10000,
  totalCost: new Decimal(500),
  averagePrice: new Decimal(50),
  cpfAvailable: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransfer = {
  id: "transfer-1",
  userId: "user-1",
  originProgramId: "origin-program-1",
  destinationProgramId: "dest-program-1",
  miles: 10000,
  bonusPercentage: new Decimal(20),
  bonusMiles: 2000,
  transferDate: new Date("2025-03-01T00:00:00.000Z"),
  receiveDate: new Date("2025-03-05T00:00:00.000Z"),
  bonusReceiveDate: new Date("2025-03-10T00:00:00.000Z"),
  cartPurchase: false,
  cartPurchaseCost: new Decimal(0),
  boomerang: false,
  boomerangMiles: null,
  boomerangReturnDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseData: TransferInput = {
  originProgramId: "origin-program-1",
  destinationProgramId: "dest-program-1",
  miles: 10000,
  bonusPercentage: 20,
  transferDate: "2025-03-01T00:00:00.000Z",
  receiveDate: "2025-03-05T00:00:00.000Z",
  bonusReceiveDate: "2025-03-10T00:00:00.000Z",
  cartPurchase: false,
  cartPurchaseCost: 0,
  boomerang: false,
};

describe("TransferService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx) as any
    );
  });

  describe("create", () => {
    function setupMocks() {
      vi.mocked(LoyaltyAccountService.getOrCreate)
        .mockResolvedValueOnce(mockOriginAccount as any)
        .mockResolvedValueOnce(mockDestinationAccount as any);
      mockTx.transfer.create.mockResolvedValue(mockTransfer);
      mockTx.schedule.create.mockResolvedValue({});
      mockTx.payment.create.mockResolvedValue({});
    }

    it("gets or creates origin and destination accounts", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(LoyaltyAccountService.getOrCreate).toHaveBeenCalledWith(
        "user-1",
        "origin-program-1",
        mockTx
      );
      expect(LoyaltyAccountService.getOrCreate).toHaveBeenCalledWith(
        "user-1",
        "dest-program-1",
        mockTx
      );
    });

    it("debits miles from origin immediately", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(LoyaltyAccountService.debit).toHaveBeenCalledWith(
        "origin-account-1",
        10000,
        mockTx
      );
    });

    it("calculates bonus miles as floor(miles * bonusPercentage / 100)", async () => {
      setupMocks();

      await create("user-1", baseData);

      // 10000 * (20 / 100) = 2000
      expect(mockTx.transfer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bonusMiles: 2000,
        }),
      });
    });

    it("floors bonus miles for non-integer results", async () => {
      setupMocks();

      const data: TransferInput = {
        ...baseData,
        miles: 10000,
        bonusPercentage: 33,
      };

      await create("user-1", data);

      // 10000 * (33 / 100) = 3300
      expect(mockTx.transfer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bonusMiles: 3300,
        }),
      });
    });

    it("creates Transfer record with all fields", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(mockTx.transfer.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          originProgramId: "origin-program-1",
          destinationProgramId: "dest-program-1",
          miles: 10000,
          bonusPercentage: new Decimal(20),
          bonusMiles: 2000,
          transferDate: new Date("2025-03-01T00:00:00.000Z"),
          receiveDate: new Date("2025-03-05T00:00:00.000Z"),
          bonusReceiveDate: new Date("2025-03-10T00:00:00.000Z"),
          cartPurchase: false,
          cartPurchaseCost: new Decimal(0),
          boomerang: false,
          boomerangMiles: null,
          boomerangReturnDate: null,
        },
      });
    });

    it("creates TRANSFER_CREDIT schedule with receiveDate", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(mockTx.schedule.create).toHaveBeenCalledWith({
        data: {
          type: "TRANSFER_CREDIT",
          status: "PENDING",
          executionDate: new Date("2025-03-05T00:00:00.000Z"),
          loyaltyAccountId: "dest-account-1",
          transferId: "transfer-1",
          milesAmount: 10000,
          costAmount: new Decimal(400), // (10000/1000) * 40 = 400
        },
      });
    });

    it("creates TRANSFER_BONUS_CREDIT schedule when bonusMiles > 0 and bonusReceiveDate exists", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(mockTx.schedule.create).toHaveBeenCalledWith({
        data: {
          type: "TRANSFER_BONUS_CREDIT",
          status: "PENDING",
          executionDate: new Date("2025-03-10T00:00:00.000Z"),
          loyaltyAccountId: "dest-account-1",
          transferId: "transfer-1",
          milesAmount: 2000,
          costAmount: new Decimal(0),
        },
      });
    });

    it("does NOT create TRANSFER_BONUS_CREDIT when bonusPercentage is 0", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate)
        .mockResolvedValueOnce(mockOriginAccount as any)
        .mockResolvedValueOnce(mockDestinationAccount as any);
      mockTx.transfer.create.mockResolvedValue({
        ...mockTransfer,
        bonusMiles: 0,
      });
      mockTx.schedule.create.mockResolvedValue({});

      const data: TransferInput = {
        ...baseData,
        bonusPercentage: 0,
        bonusReceiveDate: null,
      };

      await create("user-1", data);

      // Only TRANSFER_CREDIT should be created
      expect(mockTx.schedule.create).toHaveBeenCalledTimes(1);
      expect(mockTx.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "TRANSFER_CREDIT",
        }),
      });
    });

    it("calculates transfer cost as (miles/1000) * originAveragePrice", async () => {
      setupMocks();

      await create("user-1", baseData);

      // (10000/1000) * 40 = 400
      // Payment should be created with amount 400
      expect(mockTx.payment.create).toHaveBeenCalledWith({
        data: {
          amount: new Decimal(400),
          paymentMethod: "OTHER",
          date: new Date("2025-03-01T00:00:00.000Z"),
          transferId: "transfer-1",
        },
      });
    });

    it("adds cartPurchaseCost to transfer cost when cartPurchase is true", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate)
        .mockResolvedValueOnce(mockOriginAccount as any)
        .mockResolvedValueOnce(mockDestinationAccount as any);
      mockTx.transfer.create.mockResolvedValue({
        ...mockTransfer,
        cartPurchase: true,
        cartPurchaseCost: new Decimal(150),
      });
      mockTx.schedule.create.mockResolvedValue({});
      mockTx.payment.create.mockResolvedValue({});

      const data: TransferInput = {
        ...baseData,
        cartPurchase: true,
        cartPurchaseCost: 150,
      };

      await create("user-1", data);

      // (10000/1000) * 40 + 150 = 550
      expect(mockTx.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: new Decimal(550),
        }),
      });
    });

    it("creates BOOMERANG_RETURN schedule when boomerang is enabled", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate)
        .mockResolvedValueOnce(mockOriginAccount as any)
        .mockResolvedValueOnce(mockDestinationAccount as any);
      mockTx.transfer.create.mockResolvedValue({
        ...mockTransfer,
        boomerang: true,
        boomerangMiles: 3000,
        boomerangReturnDate: new Date("2025-04-01T00:00:00.000Z"),
      });
      mockTx.schedule.create.mockResolvedValue({});
      mockTx.payment.create.mockResolvedValue({});

      const data: TransferInput = {
        ...baseData,
        boomerang: true,
        boomerangMiles: 3000,
        boomerangReturnDate: "2025-04-01T00:00:00.000Z",
      };

      await create("user-1", data);

      expect(mockTx.schedule.create).toHaveBeenCalledWith({
        data: {
          type: "BOOMERANG_RETURN",
          status: "PENDING",
          executionDate: new Date("2025-04-01T00:00:00.000Z"),
          loyaltyAccountId: "origin-account-1",
          transferId: "transfer-1",
          milesAmount: 3000,
          costAmount: new Decimal(0),
        },
      });
    });

    it("does NOT create Payment when transferCost is 0", async () => {
      const zeroAvgAccount = {
        ...mockOriginAccount,
        averagePrice: new Decimal(0),
      };
      vi.mocked(LoyaltyAccountService.getOrCreate)
        .mockResolvedValueOnce(zeroAvgAccount as any)
        .mockResolvedValueOnce(mockDestinationAccount as any);
      mockTx.transfer.create.mockResolvedValue(mockTransfer);
      mockTx.schedule.create.mockResolvedValue({});

      const data: TransferInput = {
        ...baseData,
        cartPurchase: false,
        cartPurchaseCost: 0,
      };

      await create("user-1", data);

      expect(mockTx.payment.create).not.toHaveBeenCalled();
    });

    it("recalculates average price for origin account after debit", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(AveragePriceService.recalculate).toHaveBeenCalledWith(
        "origin-account-1",
        mockTx
      );
    });

    it("runs everything inside prisma.$transaction", async () => {
      setupMocks();

      await create("user-1", baseData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("returns the created transfer", async () => {
      setupMocks();

      const result = await create("user-1", baseData);

      expect(result).toEqual(mockTransfer);
    });
  });

  describe("findAllByUser", () => {
    it("returns all transfers for a user with schedules and payment", async () => {
      const transfers = [mockTransfer];
      vi.mocked(prisma.transfer.findMany).mockResolvedValue(transfers as any);

      const result = await findAllByUser("user-1");

      expect(prisma.transfer.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { schedules: true, payment: true },
        orderBy: { transferDate: "desc" },
      });
      expect(result).toEqual(transfers);
    });

    it("returns empty array when user has no transfers", async () => {
      vi.mocked(prisma.transfer.findMany).mockResolvedValue([]);

      const result = await findAllByUser("user-2");

      expect(result).toHaveLength(0);
    });
  });
});
