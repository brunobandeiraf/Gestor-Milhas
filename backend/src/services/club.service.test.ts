import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

// Mock prisma transaction client
const mockTx = {
  club: {
    create: vi.fn(),
    findUnique: vi.fn(),
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
    club: {
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
import {
  create,
  findAllByUser,
  processMonthlyCharge,
  generateMonthlyDates,
} from "./club.service.js";
import type { ClubInput } from "../utils/schemas.js";

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

const mockClub = {
  id: "club-1",
  userId: "user-1",
  programId: "program-1",
  plan: "Gold",
  milesPerMonth: 10000,
  monthlyFee: new Decimal(200),
  startDate: new Date("2025-01-15T00:00:00.000Z"),
  endDate: new Date("2025-06-15T00:00:00.000Z"),
  chargeDay: 10,
  paymentMethod: "CREDIT_CARD" as const,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ClubService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx) as any
    );
  });

  describe("generateMonthlyDates", () => {
    it("generates dates for each month between start and end", () => {
      const start = new Date("2025-01-15");
      const end = new Date("2025-04-15");
      const dates = generateMonthlyDates(start, end, 10);

      expect(dates).toHaveLength(3);
      expect(dates[0].getDate()).toBe(10);
      expect(dates[0].getMonth()).toBe(1); // Feb
      expect(dates[1].getMonth()).toBe(2); // Mar
      expect(dates[2].getMonth()).toBe(3); // Apr
    });

    it("clamps chargeDay to last day of month for short months", () => {
      const start = new Date("2025-02-01");
      const end = new Date("2025-02-28");
      const dates = generateMonthlyDates(start, end, 31);

      expect(dates).toHaveLength(1);
      expect(dates[0].getDate()).toBe(28); // Feb has 28 days in 2025
    });

    it("includes startDate month if chargeDay >= startDate day", () => {
      const start = new Date("2025-03-01");
      const end = new Date("2025-05-31");
      const dates = generateMonthlyDates(start, end, 15);

      expect(dates).toHaveLength(3);
      expect(dates[0].getMonth()).toBe(2); // Mar
    });

    it("excludes dates after endDate", () => {
      const start = new Date("2025-01-01");
      const end = new Date("2025-03-05");
      const dates = generateMonthlyDates(start, end, 10);

      // Jan 10, Feb 10 — Mar 10 is after endDate
      expect(dates).toHaveLength(2);
    });

    it("returns empty array when start > end", () => {
      const start = new Date("2025-06-01");
      const end = new Date("2025-01-01");
      const dates = generateMonthlyDates(start, end, 10);

      expect(dates).toHaveLength(0);
    });
  });

  describe("create", () => {
    const validData: ClubInput = {
      programId: "program-1",
      plan: "Gold",
      milesPerMonth: 10000,
      monthlyFee: 200,
      startDate: "2025-01-15T00:00:00.000Z",
      endDate: "2025-04-15T00:00:00.000Z",
      chargeDay: 10,
      paymentMethod: "CREDIT_CARD",
    };

    it("calls getOrCreate with correct userId and programId", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        mockAccount as any
      );
      mockTx.club.create.mockResolvedValue(mockClub);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(LoyaltyAccountService.getOrCreate).toHaveBeenCalledWith(
        "user-1",
        "program-1",
        mockTx
      );
    });

    it("creates Club record with all fields", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        mockAccount as any
      );
      mockTx.club.create.mockResolvedValue(mockClub);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(mockTx.club.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          programId: "program-1",
          plan: "Gold",
          milesPerMonth: 10000,
          monthlyFee: new Decimal(200),
          startDate: new Date("2025-01-15T00:00:00.000Z"),
          endDate: new Date("2025-04-15T00:00:00.000Z"),
          chargeDay: 10,
          paymentMethod: "CREDIT_CARD",
        },
      });
    });

    it("creates CLUB_CHARGE schedules for each month", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        mockAccount as any
      );
      mockTx.club.create.mockResolvedValue(mockClub);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      // Feb 10, Mar 10, Apr 10 = 3 schedules
      expect(mockTx.schedule.create).toHaveBeenCalledTimes(3);

      // Verify first schedule
      expect(mockTx.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "CLUB_CHARGE",
          status: "PENDING",
          loyaltyAccountId: "account-1",
          clubId: "club-1",
          milesAmount: 10000,
          costAmount: new Decimal(200),
        }),
      });
    });

    it("runs everything inside prisma.$transaction", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        mockAccount as any
      );
      mockTx.club.create.mockResolvedValue(mockClub);
      mockTx.schedule.create.mockResolvedValue({});

      await create("user-1", validData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("returns the created club", async () => {
      vi.mocked(LoyaltyAccountService.getOrCreate).mockResolvedValue(
        mockAccount as any
      );
      mockTx.club.create.mockResolvedValue(mockClub);
      mockTx.schedule.create.mockResolvedValue({});

      const result = await create("user-1", validData);

      expect(result).toEqual(mockClub);
    });
  });

  describe("findAllByUser", () => {
    it("returns all clubs for a user with program and schedules", async () => {
      const clubs = [mockClub];
      vi.mocked(prisma.club.findMany).mockResolvedValue(clubs as any);

      const result = await findAllByUser("user-1");

      expect(prisma.club.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { program: true, schedules: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(clubs);
    });

    it("returns empty array when user has no clubs", async () => {
      vi.mocked(prisma.club.findMany).mockResolvedValue([]);

      const result = await findAllByUser("user-2");

      expect(result).toHaveLength(0);
    });
  });

  describe("processMonthlyCharge", () => {
    it("credits miles and creates payment", async () => {
      mockTx.club.findUnique.mockResolvedValue(mockClub);
      mockTx.loyaltyAccount.findUnique.mockResolvedValue(mockAccount);
      mockTx.payment.create.mockResolvedValue({});

      await processMonthlyCharge("club-1", mockTx as any);

      expect(LoyaltyAccountService.credit).toHaveBeenCalledWith(
        "account-1",
        10000,
        200,
        mockTx
      );
      expect(AveragePriceService.recalculate).toHaveBeenCalledWith(
        "account-1",
        mockTx
      );
      expect(mockTx.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: new Decimal(200),
          paymentMethod: "CREDIT_CARD",
          clubId: "club-1",
        }),
      });
    });

    it("throws NotFoundError when club not found", async () => {
      mockTx.club.findUnique.mockResolvedValue(null);

      await expect(
        processMonthlyCharge("nonexistent", mockTx as any)
      ).rejects.toThrow("Clube não encontrado");
    });

    it("throws NotFoundError when loyalty account not found", async () => {
      mockTx.club.findUnique.mockResolvedValue(mockClub);
      mockTx.loyaltyAccount.findUnique.mockResolvedValue(null);

      await expect(
        processMonthlyCharge("club-1", mockTx as any)
      ).rejects.toThrow("Conta de fidelidade não encontrada");
    });
  });
});
