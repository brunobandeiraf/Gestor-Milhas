import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError, NotFoundError } from "../utils/errors.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    airline: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    program: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import { create, findAll, findById, update, deactivate } from "./airline.service.js";

const mockAirline = {
  id: "airline-1",
  name: "LATAM",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("AirlineService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("create", () => {
    it("creates an airline successfully", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.airline.create).mockResolvedValue(mockAirline);

      const result = await create({ name: "LATAM" });

      expect(prisma.airline.create).toHaveBeenCalledWith({ data: { name: "LATAM" } });
      expect(result.name).toBe("LATAM");
      expect(result.active).toBe(true);
    });

    it("throws ConflictError when name already exists", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);

      await expect(create({ name: "LATAM" })).rejects.toThrow(ConflictError);
      await expect(create({ name: "LATAM" })).rejects.toThrow("Companhia aérea já cadastrada");
      expect(prisma.airline.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("returns all airlines ordered by name", async () => {
      const airlines = [mockAirline, { ...mockAirline, id: "airline-2", name: "GOL" }];
      vi.mocked(prisma.airline.findMany).mockResolvedValue(airlines);

      const result = await findAll();

      expect(prisma.airline.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
      expect(result).toHaveLength(2);
    });
  });

  describe("findById", () => {
    it("returns airline when found", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);

      const result = await findById("airline-1");

      expect(result).toEqual(mockAirline);
    });

    it("throws NotFoundError when not found", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(null);

      await expect(findById("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(findById("nonexistent")).rejects.toThrow("Companhia aérea não encontrada");
    });
  });

  describe("update", () => {
    it("updates airline name", async () => {
      const updated = { ...mockAirline, name: "LATAM Airlines" };
      vi.mocked(prisma.airline.findUnique)
        .mockResolvedValueOnce(mockAirline) // findById
        .mockResolvedValueOnce(null); // name uniqueness check
      vi.mocked(prisma.airline.update).mockResolvedValue(updated);

      const result = await update("airline-1", { name: "LATAM Airlines" });

      expect(result.name).toBe("LATAM Airlines");
    });

    it("throws NotFoundError when airline not found", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(null);

      await expect(update("nonexistent", { name: "Test" })).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when new name already exists", async () => {
      const other = { ...mockAirline, id: "airline-2", name: "GOL" };
      vi.mocked(prisma.airline.findUnique)
        .mockResolvedValueOnce(mockAirline) // findById
        .mockResolvedValueOnce(other); // name uniqueness check

      await expect(update("airline-1", { name: "GOL" })).rejects.toThrow(ConflictError);
      expect(prisma.airline.update).not.toHaveBeenCalled();
    });

    it("skips name uniqueness check when name unchanged", async () => {
      const updated = { ...mockAirline, active: false };
      vi.mocked(prisma.airline.findUnique).mockResolvedValueOnce(mockAirline);
      vi.mocked(prisma.airline.update).mockResolvedValue(updated);

      const result = await update("airline-1", { active: false });

      expect(result.active).toBe(false);
      // findUnique called only once (for findById), not for name check
      expect(prisma.airline.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("deactivate", () => {
    it("deactivates airline when no active programs linked", async () => {
      const deactivated = { ...mockAirline, active: false };
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);
      vi.mocked(prisma.program.findMany).mockResolvedValue([]);
      vi.mocked(prisma.airline.update).mockResolvedValue(deactivated);

      const result = await deactivate("airline-1");

      expect(result.active).toBe(false);
      expect(prisma.airline.update).toHaveBeenCalledWith({
        where: { id: "airline-1" },
        data: { active: false },
      });
    });

    it("throws NotFoundError when airline not found", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(null);

      await expect(deactivate("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when active programs are linked", async () => {
      vi.mocked(prisma.airline.findUnique).mockResolvedValue(mockAirline);
      vi.mocked(prisma.program.findMany).mockResolvedValue([
        { name: "LATAM Pass" } as any,
        { name: "Multiplus" } as any,
      ]);

      await expect(deactivate("airline-1")).rejects.toThrow(ConflictError);
      await expect(deactivate("airline-1")).rejects.toThrow(
        "Existem registros ativos vinculados: LATAM Pass, Multiplus"
      );
      expect(prisma.airline.update).not.toHaveBeenCalled();
    });
  });
});
