import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "../generated/prisma/client.js";
import { NotFoundError } from "../utils/errors.js";

const { Decimal } = Prisma;

vi.mock("../prisma/client.js", () => ({
  default: {
    loyaltyAccount: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import { recalculate } from "./average-price.service.js";

function makeAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: "account-1",
    userId: "user-1",
    programId: "program-1",
    miles: 10000,
    totalCost: new Decimal(350),
    averagePrice: new Decimal(0),
    cpfAvailable: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AveragePriceService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("recalculate", () => {
    it("calculates average price correctly for normal values", async () => {
      // 350 / (10000 / 1000) = 350 / 10 = 35
      const account = makeAccount({ miles: 10000, totalCost: new Decimal(350) });
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(account as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await recalculate("account-1");

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { averagePrice: new Decimal(35) },
      });
    });

    it("sets average price to 0 when miles is 0", async () => {
      const account = makeAccount({ miles: 0, totalCost: new Decimal(0) });
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(account as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await recalculate("account-1");

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { averagePrice: new Decimal(0) },
      });
    });

    it("sets average price to 0 when miles is 0 even with non-zero totalCost", async () => {
      // Edge case: totalCost > 0 but miles = 0 (e.g. after full debit)
      const account = makeAccount({ miles: 0, totalCost: new Decimal(500) });
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(account as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await recalculate("account-1");

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { averagePrice: new Decimal(0) },
      });
    });

    it("handles very small miles values", async () => {
      // 10 / (1 / 1000) = 10 * 1000 = 10000
      const account = makeAccount({ miles: 1, totalCost: new Decimal(10) });
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(account as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await recalculate("account-1");

      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { averagePrice: new Decimal(10000) },
      });
    });

    it("handles large values", async () => {
      // 999999.99 / (5000000 / 1000) = 999999.99 / 5000 = 199.999998
      const account = makeAccount({
        miles: 5000000,
        totalCost: new Decimal("999999.99"),
      });
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(account as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await recalculate("account-1");

      const updateCall = vi.mocked(prisma.loyaltyAccount.update).mock.calls[0][0];
      const avgPrice = updateCall.data.averagePrice as InstanceType<typeof Decimal>;
      // 999999.99 * 1000 / 5000000 = 199.999998
      expect(avgPrice.toNumber()).toBeCloseTo(199.999998, 4);
    });

    it("handles fractional totalCost producing non-round average", async () => {
      // 100.50 / (3000 / 1000) = 100.50 / 3 = 33.5
      const account = makeAccount({
        miles: 3000,
        totalCost: new Decimal("100.50"),
      });
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(account as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await recalculate("account-1");

      const updateCall = vi.mocked(prisma.loyaltyAccount.update).mock.calls[0][0];
      const avgPrice = updateCall.data.averagePrice as InstanceType<typeof Decimal>;
      expect(avgPrice.toNumber()).toBeCloseTo(33.5, 4);
    });

    it("throws NotFoundError when account does not exist", async () => {
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(null);

      await expect(recalculate("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(recalculate("nonexistent")).rejects.toThrow(
        "Conta de fidelidade não encontrada"
      );
      expect(prisma.loyaltyAccount.update).not.toHaveBeenCalled();
    });

    it("uses transaction client when provided", async () => {
      const account = makeAccount({ miles: 10000, totalCost: new Decimal(350) });
      const txClient = {
        loyaltyAccount: {
          findUnique: vi.fn().mockResolvedValue(account),
          update: vi.fn().mockResolvedValue({}),
        },
      };

      await recalculate("account-1", txClient as any);

      expect(txClient.loyaltyAccount.findUnique).toHaveBeenCalledWith({
        where: { id: "account-1" },
      });
      expect(txClient.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { averagePrice: new Decimal(35) },
      });
      expect(prisma.loyaltyAccount.findUnique).not.toHaveBeenCalled();
      expect(prisma.loyaltyAccount.update).not.toHaveBeenCalled();
    });

    it("uses default prisma client when no transaction provided", async () => {
      const account = makeAccount({ miles: 2000, totalCost: new Decimal(50) });
      vi.mocked(prisma.loyaltyAccount.findUnique).mockResolvedValue(account as any);
      vi.mocked(prisma.loyaltyAccount.update).mockResolvedValue({} as any);

      await recalculate("account-1");

      expect(prisma.loyaltyAccount.findUnique).toHaveBeenCalledWith({
        where: { id: "account-1" },
      });
      // 50 / (2000 / 1000) = 50 / 2 = 25
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: { averagePrice: new Decimal(25) },
      });
    });
  });
});
