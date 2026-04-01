import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

// Mock prisma transaction client
const mockTx = {
  schedule: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  club: {
    findUnique: vi.fn(),
  },
  loyaltyAccount: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  payment: {
    create: vi.fn(),
  },
};

vi.mock("../prisma/client.js", () => ({
  default: {
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockTx)),
    schedule: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("./club.service.js", () => ({
  processMonthlyCharge: vi.fn(),
}));

vi.mock("./loyalty-account.service.js", () => ({
  credit: vi.fn(),
}));

vi.mock("./average-price.service.js", () => ({
  recalculate: vi.fn(),
}));

import prisma from "../prisma/client.js";
import * as ClubService from "./club.service.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import * as AveragePriceService from "./average-price.service.js";
import { getPending, processDaily, execute } from "./schedule.service.js";

const baseSchedule = {
  id: "schedule-1",
  type: "CLUB_CHARGE" as const,
  status: "PENDING" as const,
  executionDate: new Date("2025-01-10T00:00:00.000Z"),
  loyaltyAccountId: "account-1",
  clubId: "club-1",
  bonusPurchaseId: null,
  transferId: null,
  milesAmount: 10000,
  costAmount: new Decimal(200),
  errorMessage: null,
  executedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ScheduleService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx) as any
    );
  });

  describe("getPending", () => {
    it("returns pending schedules for a user ordered by executionDate", async () => {
      const schedules = [baseSchedule];
      vi.mocked(prisma.schedule.findMany).mockResolvedValue(schedules as any);

      const result = await getPending("user-1");

      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        where: {
          loyaltyAccount: { userId: "user-1" },
          status: "PENDING",
        },
        include: {
          loyaltyAccount: { include: { program: true } },
          club: true,
          bonusPurchase: true,
          transfer: true,
        },
        orderBy: { executionDate: "asc" },
      });
      expect(result).toEqual(schedules);
    });

    it("returns empty array when no pending schedules", async () => {
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);

      const result = await getPending("user-1");

      expect(result).toHaveLength(0);
    });
  });

  describe("execute", () => {
    it("executes CLUB_CHARGE by calling ClubService.processMonthlyCharge", async () => {
      mockTx.schedule.findUnique.mockResolvedValue(baseSchedule);
      mockTx.schedule.update.mockResolvedValue({});

      await execute("schedule-1", mockTx as any);

      expect(ClubService.processMonthlyCharge).toHaveBeenCalledWith(
        "club-1",
        mockTx
      );
      expect(mockTx.schedule.update).toHaveBeenCalledWith({
        where: { id: "schedule-1" },
        data: {
          status: "COMPLETED",
          executedAt: expect.any(Date),
        },
      });
    });

    it("executes BONUS_PURCHASE_CREDIT by crediting miles", async () => {
      const schedule = {
        ...baseSchedule,
        type: "BONUS_PURCHASE_CREDIT" as const,
        clubId: null,
        bonusPurchaseId: "bp-1",
      };
      mockTx.schedule.findUnique.mockResolvedValue(schedule);
      mockTx.schedule.update.mockResolvedValue({});

      await execute("schedule-1", mockTx as any);

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
    });

    it("executes TRANSFER_CREDIT by crediting miles with cost", async () => {
      const schedule = {
        ...baseSchedule,
        type: "TRANSFER_CREDIT" as const,
        clubId: null,
        transferId: "transfer-1",
        costAmount: new Decimal(400),
      };
      mockTx.schedule.findUnique.mockResolvedValue(schedule);
      mockTx.schedule.update.mockResolvedValue({});

      await execute("schedule-1", mockTx as any);

      expect(LoyaltyAccountService.credit).toHaveBeenCalledWith(
        "account-1",
        10000,
        400,
        mockTx
      );
      expect(AveragePriceService.recalculate).toHaveBeenCalledWith(
        "account-1",
        mockTx
      );
    });

    it("executes TRANSFER_BONUS_CREDIT with cost = 0", async () => {
      const schedule = {
        ...baseSchedule,
        type: "TRANSFER_BONUS_CREDIT" as const,
        clubId: null,
        transferId: "transfer-1",
        milesAmount: 2000,
        costAmount: new Decimal(0),
      };
      mockTx.schedule.findUnique.mockResolvedValue(schedule);
      mockTx.schedule.update.mockResolvedValue({});

      await execute("schedule-1", mockTx as any);

      expect(LoyaltyAccountService.credit).toHaveBeenCalledWith(
        "account-1",
        2000,
        0,
        mockTx
      );
    });

    it("executes BOOMERANG_RETURN with cost = 0", async () => {
      const schedule = {
        ...baseSchedule,
        type: "BOOMERANG_RETURN" as const,
        clubId: null,
        transferId: "transfer-1",
        milesAmount: 3000,
        costAmount: new Decimal(0),
      };
      mockTx.schedule.findUnique.mockResolvedValue(schedule);
      mockTx.schedule.update.mockResolvedValue({});

      await execute("schedule-1", mockTx as any);

      expect(LoyaltyAccountService.credit).toHaveBeenCalledWith(
        "account-1",
        3000,
        0,
        mockTx
      );
    });

    it("throws NotFoundError when schedule not found", async () => {
      mockTx.schedule.findUnique.mockResolvedValue(null);

      await expect(execute("nonexistent", mockTx as any)).rejects.toThrow(
        "Agendamento não encontrado"
      );
    });

    it("throws error when CLUB_CHARGE has no clubId", async () => {
      const schedule = { ...baseSchedule, clubId: null };
      mockTx.schedule.findUnique.mockResolvedValue(schedule);

      await expect(execute("schedule-1", mockTx as any)).rejects.toThrow(
        "Agendamento de clube sem clubId"
      );
    });

    it("marks schedule as COMPLETED with executedAt", async () => {
      const schedule = {
        ...baseSchedule,
        type: "TRANSFER_BONUS_CREDIT" as const,
        clubId: null,
        transferId: "t-1",
        costAmount: new Decimal(0),
      };
      mockTx.schedule.findUnique.mockResolvedValue(schedule);
      mockTx.schedule.update.mockResolvedValue({});

      await execute("schedule-1", mockTx as any);

      expect(mockTx.schedule.update).toHaveBeenCalledWith({
        where: { id: "schedule-1" },
        data: {
          status: "COMPLETED",
          executedAt: expect.any(Date),
        },
      });
    });
  });

  describe("processDaily", () => {
    it("processes all pending schedules with executionDate <= today", async () => {
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        baseSchedule,
      ] as any);
      mockTx.schedule.findUnique.mockResolvedValue(baseSchedule);
      mockTx.schedule.update.mockResolvedValue({});

      await processDaily();

      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        where: {
          executionDate: { lte: expect.any(Date) },
          status: "PENDING",
        },
        orderBy: { executionDate: "asc" },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("records error message when schedule execution fails", async () => {
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        baseSchedule,
      ] as any);
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error("Clube não encontrado")
      );

      await processDaily();

      expect(prisma.schedule.update).toHaveBeenCalledWith({
        where: { id: "schedule-1" },
        data: { errorMessage: "Clube não encontrado" },
      });
    });

    it("does nothing when no pending schedules", async () => {
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);

      await processDaily();

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
