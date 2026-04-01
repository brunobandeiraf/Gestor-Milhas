import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError, NotFoundError } from "../utils/errors.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    bank: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    card: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import { create, findAll, findById, update, deactivate } from "./bank.service.js";

const mockBank = {
  id: "bank-1",
  name: "Itaú",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("BankService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("create", () => {
    it("creates a bank successfully", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.bank.create).mockResolvedValue(mockBank);

      const result = await create({ name: "Itaú" });

      expect(prisma.bank.create).toHaveBeenCalledWith({ data: { name: "Itaú" } });
      expect(result.name).toBe("Itaú");
      expect(result.active).toBe(true);
    });

    it("throws ConflictError when name already exists", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);

      await expect(create({ name: "Itaú" })).rejects.toThrow(ConflictError);
      await expect(create({ name: "Itaú" })).rejects.toThrow("Banco já cadastrado");
      expect(prisma.bank.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("returns all banks ordered by name", async () => {
      const banks = [mockBank, { ...mockBank, id: "bank-2", name: "Bradesco" }];
      vi.mocked(prisma.bank.findMany).mockResolvedValue(banks);

      const result = await findAll();

      expect(prisma.bank.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
      expect(result).toHaveLength(2);
    });
  });

  describe("findById", () => {
    it("returns bank when found", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);

      const result = await findById("bank-1");

      expect(result).toEqual(mockBank);
    });

    it("throws NotFoundError when not found", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);

      await expect(findById("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(findById("nonexistent")).rejects.toThrow("Banco não encontrado");
    });
  });

  describe("update", () => {
    it("updates bank name", async () => {
      const updated = { ...mockBank, name: "Itaú Unibanco" };
      vi.mocked(prisma.bank.findUnique)
        .mockResolvedValueOnce(mockBank)
        .mockResolvedValueOnce(null);
      vi.mocked(prisma.bank.update).mockResolvedValue(updated);

      const result = await update("bank-1", { name: "Itaú Unibanco" });

      expect(result.name).toBe("Itaú Unibanco");
    });

    it("throws NotFoundError when bank not found", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);

      await expect(update("nonexistent", { name: "Test" })).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when new name already exists", async () => {
      const other = { ...mockBank, id: "bank-2", name: "Bradesco" };
      vi.mocked(prisma.bank.findUnique)
        .mockResolvedValueOnce(mockBank)
        .mockResolvedValueOnce(other);

      await expect(update("bank-1", { name: "Bradesco" })).rejects.toThrow(ConflictError);
      expect(prisma.bank.update).not.toHaveBeenCalled();
    });

    it("skips name uniqueness check when name unchanged", async () => {
      const updated = { ...mockBank, active: false };
      vi.mocked(prisma.bank.findUnique).mockResolvedValueOnce(mockBank);
      vi.mocked(prisma.bank.update).mockResolvedValue(updated);

      const result = await update("bank-1", { active: false });

      expect(result.active).toBe(false);
      expect(prisma.bank.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("deactivate", () => {
    it("deactivates bank when no active cards linked", async () => {
      const deactivated = { ...mockBank, active: false };
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);
      vi.mocked(prisma.card.findMany).mockResolvedValue([]);
      vi.mocked(prisma.bank.update).mockResolvedValue(deactivated);

      const result = await deactivate("bank-1");

      expect(result.active).toBe(false);
      expect(prisma.bank.update).toHaveBeenCalledWith({
        where: { id: "bank-1" },
        data: { active: false },
      });
    });

    it("throws NotFoundError when bank not found", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(null);

      await expect(deactivate("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when active cards are linked", async () => {
      vi.mocked(prisma.bank.findUnique).mockResolvedValue(mockBank);
      vi.mocked(prisma.card.findMany).mockResolvedValue([
        { name: "Platinum" } as any,
        { name: "Black" } as any,
      ]);

      await expect(deactivate("bank-1")).rejects.toThrow(ConflictError);
      await expect(deactivate("bank-1")).rejects.toThrow(
        "Existem registros ativos vinculados: Platinum, Black"
      );
      expect(prisma.bank.update).not.toHaveBeenCalled();
    });
  });
});
