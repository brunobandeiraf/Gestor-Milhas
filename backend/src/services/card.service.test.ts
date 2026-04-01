import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    card: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import { create, findAllByUser, findById, update, toggleActive } from "./card.service.js";

const mockBank = {
  id: "bank-1",
  name: "Itaú",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCard = {
  id: "card-1",
  userId: "user-1",
  bankId: "bank-1",
  name: "Platinum",
  closingDay: 10,
  dueDay: 20,
  creditLimit: 5000,
  annualFee: 300,
  active: true,
  minIncome: null,
  scoring: null,
  brand: null,
  vipLounge: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  bank: mockBank,
};

describe("CardService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("create", () => {
    it("creates a card linked to user", async () => {
      vi.mocked(prisma.card.create).mockResolvedValue(mockCard as any);

      const result = await create("user-1", {
        bankId: "bank-1",
        name: "Platinum",
        closingDay: 10,
        dueDay: 20,
        creditLimit: 5000,
      });

      expect(prisma.card.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          bankId: "bank-1",
          name: "Platinum",
        }),
        include: { bank: true },
      });
      expect(result.name).toBe("Platinum");
    });
  });

  describe("findAllByUser", () => {
    it("returns all cards for the user with bank relation", async () => {
      vi.mocked(prisma.card.findMany).mockResolvedValue([mockCard] as any);

      const result = await findAllByUser("user-1");

      expect(prisma.card.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        include: { bank: true },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("findById", () => {
    it("returns card with bank relation", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);

      const result = await findById("card-1");

      expect(result).toEqual(mockCard);
    });

    it("throws NotFoundError when not found", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(null);

      await expect(findById("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(findById("nonexistent")).rejects.toThrow("Cartão não encontrado");
    });
  });

  describe("update", () => {
    it("updates card when user is owner", async () => {
      const updated = { ...mockCard, name: "Black" };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(updated as any);

      const result = await update("card-1", "user-1", "USER", { name: "Black" });

      expect(result.name).toBe("Black");
    });

    it("strips admin-only fields for non-admin users", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(mockCard as any);

      await update("card-1", "user-1", "USER", {
        name: "Black",
        minIncome: 10000,
        scoring: "high",
        brand: "Visa",
        vipLounge: "VIP",
        notes: "test",
      } as any);

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: "card-1" },
        data: { name: "Black" },
        include: { bank: true },
      });
    });

    it("keeps admin-only fields for admin users", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(mockCard as any);

      await update("card-1", "admin-1", "ADMIN", {
        name: "Black",
        minIncome: 10000,
        scoring: "high",
      } as any);

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: "card-1" },
        data: expect.objectContaining({
          name: "Black",
          minIncome: 10000,
          scoring: "high",
        }),
        include: { bank: true },
      });
    });

    it("throws NotFoundError when card not found", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(null);

      await expect(update("nonexistent", "user-1", "USER", { name: "X" })).rejects.toThrow(
        NotFoundError
      );
    });

    it("throws AuthorizationError when non-admin tries to update another user's card", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);

      await expect(
        update("card-1", "other-user", "USER", { name: "X" })
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("toggleActive", () => {
    it("toggles card active status", async () => {
      const toggled = { ...mockCard, active: false };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(toggled as any);

      const result = await toggleActive("card-1", "user-1", "USER", false);

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: "card-1" },
        data: { active: false },
        include: { bank: true },
      });
      expect(result.active).toBe(false);
    });

    it("allows admin to toggle any card", async () => {
      const toggled = { ...mockCard, active: false };
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);
      vi.mocked(prisma.card.update).mockResolvedValue(toggled as any);

      const result = await toggleActive("card-1", "admin-1", "ADMIN", false);

      expect(result.active).toBe(false);
    });

    it("throws NotFoundError when card not found", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(null);

      await expect(toggleActive("nonexistent", "user-1", "USER", false)).rejects.toThrow(
        NotFoundError
      );
    });

    it("throws AuthorizationError when non-admin user does not own the card", async () => {
      vi.mocked(prisma.card.findUnique).mockResolvedValue(mockCard as any);

      await expect(toggleActive("card-1", "other-user", "USER", false)).rejects.toThrow(
        AuthorizationError
      );
    });
  });
});
