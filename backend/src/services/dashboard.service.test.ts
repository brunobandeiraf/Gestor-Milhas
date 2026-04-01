import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

const mockLoyaltyAccounts = [
  {
    id: "la-1",
    userId: "user-1",
    programId: "prog-1",
    miles: 50000,
    totalCost: new Decimal(2000),
    averagePrice: new Decimal(40),
    cpfAvailable: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    program: { id: "prog-1", name: "LATAM Pass", type: "AIRLINE" },
  },
  {
    id: "la-2",
    userId: "user-1",
    programId: "prog-2",
    miles: 30000,
    totalCost: new Decimal(900),
    averagePrice: new Decimal(30),
    cpfAvailable: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    program: { id: "prog-2", name: "Livelo", type: "BANK" },
  },
];

const mockPendingSchedules = [
  {
    id: "sched-1",
    type: "CLUB_CHARGE",
    status: "PENDING",
    executionDate: new Date("2025-07-15"),
    milesAmount: 5000,
    loyaltyAccountId: "la-1",
    loyaltyAccount: {
      id: "la-1",
      program: { id: "prog-1", name: "LATAM Pass" },
    },
  },
];

vi.mock("../prisma/client.js", () => ({
  default: {
    loyaltyAccount: {
      findMany: vi.fn(),
    },
    issuance: {
      aggregate: vi.fn(),
    },
    schedule: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import {
  getUserDashboard,
  getAdminDashboard,
  getUserMetrics,
} from "./dashboard.service.js";

describe("DashboardService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getUserDashboard", () => {
    function setupMocks() {
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue(
        mockLoyaltyAccounts as any
      );
      vi.mocked(prisma.issuance.aggregate).mockResolvedValue({
        _sum: { savings: new Decimal(3500) },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any);
      vi.mocked(prisma.schedule.findMany).mockResolvedValue(
        mockPendingSchedules as any
      );
    }

    it("returns account summaries with program name, miles, averagePrice, totalCost", async () => {
      setupMocks();

      const result = await getUserDashboard("user-1");

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0]).toEqual({
        programName: "LATAM Pass",
        miles: 50000,
        averagePrice: 40,
        totalCost: 2000,
      });
      expect(result.accounts[1]).toEqual({
        programName: "Livelo",
        miles: 30000,
        averagePrice: 30,
        totalCost: 900,
      });
    });

    it("calculates totalMiles as sum of all accounts miles", async () => {
      setupMocks();

      const result = await getUserDashboard("user-1");

      expect(result.totalMiles).toBe(80000);
    });

    it("calculates totalInvested as sum of all accounts totalCost", async () => {
      setupMocks();

      const result = await getUserDashboard("user-1");

      expect(result.totalInvested).toBe(2900);
    });

    it("calculates totalSaved from issuance aggregate", async () => {
      setupMocks();

      const result = await getUserDashboard("user-1");

      expect(result.totalSaved).toBe(3500);
    });

    it("returns totalSaved as 0 when no issuances exist", async () => {
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue([]);
      vi.mocked(prisma.issuance.aggregate).mockResolvedValue({
        _sum: { savings: null },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any);
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);

      const result = await getUserDashboard("user-1");

      expect(result.totalSaved).toBe(0);
    });

    it("returns upcoming schedules with mapped fields", async () => {
      setupMocks();

      const result = await getUserDashboard("user-1");

      expect(result.upcomingSchedules).toHaveLength(1);
      expect(result.upcomingSchedules[0]).toEqual({
        id: "sched-1",
        type: "CLUB_CHARGE",
        executionDate: new Date("2025-07-15"),
        milesAmount: 5000,
        programName: "LATAM Pass",
      });
    });

    it("returns empty arrays when user has no data", async () => {
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue([]);
      vi.mocked(prisma.issuance.aggregate).mockResolvedValue({
        _sum: { savings: null },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any);
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([]);

      const result = await getUserDashboard("user-1");

      expect(result.accounts).toHaveLength(0);
      expect(result.totalMiles).toBe(0);
      expect(result.totalInvested).toBe(0);
      expect(result.totalSaved).toBe(0);
      expect(result.upcomingSchedules).toHaveLength(0);
    });
  });

  describe("getUserMetrics", () => {
    it("returns same data as dashboard but without upcomingSchedules", async () => {
      vi.mocked(prisma.loyaltyAccount.findMany).mockResolvedValue(
        mockLoyaltyAccounts as any
      );
      vi.mocked(prisma.issuance.aggregate).mockResolvedValue({
        _sum: { savings: new Decimal(3500) },
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any);

      const result = await getUserMetrics("user-1");

      expect(result.accounts).toHaveLength(2);
      expect(result.totalMiles).toBe(80000);
      expect(result.totalInvested).toBe(2900);
      expect(result.totalSaved).toBe(3500);
      expect(result).not.toHaveProperty("upcomingSchedules");
    });
  });

  describe("getAdminDashboard", () => {
    const mockManagedUsers = [
      { id: "user-1", email: "user1@test.com", fullName: "User One" },
      { id: "user-2", email: "user2@test.com", fullName: null },
    ];

    function setupAdminMocks() {
      vi.mocked(prisma.user.findMany).mockResolvedValue(
        mockManagedUsers as any
      );

      // User 1 accounts
      vi.mocked(prisma.loyaltyAccount.findMany)
        .mockResolvedValueOnce(mockLoyaltyAccounts as any)
        .mockResolvedValueOnce([]);

      // User 1 savings = 3500, User 2 savings = 500
      vi.mocked(prisma.issuance.aggregate)
        .mockResolvedValueOnce({
          _sum: { savings: new Decimal(3500) },
        } as any)
        .mockResolvedValueOnce({
          _sum: { savings: new Decimal(500) },
        } as any)
        // Global savings
        .mockResolvedValueOnce({
          _sum: { savings: new Decimal(10000) },
        } as any);
    }

    it("returns managed users savings as sum of individual savings", async () => {
      setupAdminMocks();

      const result = await getAdminDashboard("admin-1");

      expect(result.managedUsersSavings).toBe(4000);
    });

    it("returns global savings from all users", async () => {
      setupAdminMocks();

      const result = await getAdminDashboard("admin-1");

      expect(result.globalSavings).toBe(10000);
    });

    it("returns user summaries with correct data", async () => {
      setupAdminMocks();

      const result = await getAdminDashboard("admin-1");

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({
        id: "user-1",
        email: "user1@test.com",
        fullName: "User One",
        totalMiles: 80000,
        totalInvested: 2900,
        totalSaved: 3500,
      });
      expect(result.users[1]).toEqual({
        id: "user-2",
        email: "user2@test.com",
        fullName: null,
        totalMiles: 0,
        totalInvested: 0,
        totalSaved: 500,
      });
    });

    it("returns zeros when admin has no managed users", async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.issuance.aggregate).mockResolvedValue({
        _sum: { savings: null },
      } as any);

      const result = await getAdminDashboard("admin-1");

      expect(result.managedUsersSavings).toBe(0);
      expect(result.globalSavings).toBe(0);
      expect(result.users).toHaveLength(0);
    });
  });
});
