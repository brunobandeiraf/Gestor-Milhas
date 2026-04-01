import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

vi.mock("../prisma/client.js", () => ({
  default: {
    program: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from "../prisma/client.js";
import { create, findAll, findById, update, toggleActive } from "./program.service.js";

const mockAirlineProgram = {
  id: "prog-1",
  name: "LATAM Pass",
  type: "AIRLINE" as const,
  airlineId: "airline-1",
  cpfLimit: 3,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  airline: { id: "airline-1", name: "LATAM", active: true, createdAt: new Date(), updatedAt: new Date() },
};

const mockBankProgram = {
  id: "prog-2",
  name: "Livelo",
  type: "BANK" as const,
  airlineId: null,
  cpfLimit: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  airline: null,
};

describe("ProgramService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("create", () => {
    it("creates an AIRLINE program successfully", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.program.create).mockResolvedValue(mockAirlineProgram as any);

      const result = await create({
        name: "LATAM Pass",
        type: "AIRLINE",
        airlineId: "airline-1",
        cpfLimit: 3,
      });

      expect(prisma.program.create).toHaveBeenCalledWith({
        data: {
          name: "LATAM Pass",
          type: "AIRLINE",
          airlineId: "airline-1",
          cpfLimit: 3,
          active: true,
        },
        include: { airline: true },
      });
      expect(result.name).toBe("LATAM Pass");
      expect(result.type).toBe("AIRLINE");
    });

    it("creates a BANK program and ignores airlineId", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.program.create).mockResolvedValue(mockBankProgram as any);

      await create({
        name: "Livelo",
        type: "BANK",
        airlineId: "airline-1", // should be ignored
      });

      expect(prisma.program.create).toHaveBeenCalledWith({
        data: {
          name: "Livelo",
          type: "BANK",
          airlineId: null,
          cpfLimit: null,
          active: true,
        },
        include: { airline: true },
      });
    });

    it("throws ValidationError when AIRLINE type has no airlineId", async () => {
      await expect(
        create({ name: "Test", type: "AIRLINE" })
      ).rejects.toThrow(ValidationError);
      await expect(
        create({ name: "Test", type: "AIRLINE" })
      ).rejects.toThrow(
        "Programas de companhia aérea devem ter uma companhia associada"
      );
      expect(prisma.program.create).not.toHaveBeenCalled();
    });

    it("throws ConflictError when name already exists", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(mockAirlineProgram as any);

      await expect(
        create({ name: "LATAM Pass", type: "AIRLINE", airlineId: "airline-1" })
      ).rejects.toThrow(ConflictError);
      await expect(
        create({ name: "LATAM Pass", type: "AIRLINE", airlineId: "airline-1" })
      ).rejects.toThrow("Programa já cadastrado");
      expect(prisma.program.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("returns all programs with airline relation", async () => {
      const programs = [mockAirlineProgram, mockBankProgram];
      vi.mocked(prisma.program.findMany).mockResolvedValue(programs as any);

      const result = await findAll();

      expect(prisma.program.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
        include: { airline: true },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("findById", () => {
    it("returns program with airline relation when found", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(mockAirlineProgram as any);

      const result = await findById("prog-1");

      expect(prisma.program.findUnique).toHaveBeenCalledWith({
        where: { id: "prog-1" },
        include: { airline: true },
      });
      expect(result).toEqual(mockAirlineProgram);
    });

    it("throws NotFoundError when not found", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);

      await expect(findById("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(findById("nonexistent")).rejects.toThrow("Programa não encontrado");
    });
  });

  describe("update", () => {
    it("updates program name", async () => {
      const updated = { ...mockAirlineProgram, name: "LATAM Pass Plus" };
      vi.mocked(prisma.program.findUnique)
        .mockResolvedValueOnce(mockAirlineProgram as any) // findById
        .mockResolvedValueOnce(null); // name uniqueness check
      vi.mocked(prisma.program.update).mockResolvedValue(updated as any);

      const result = await update("prog-1", { name: "LATAM Pass Plus" });

      expect(result.name).toBe("LATAM Pass Plus");
    });

    it("throws NotFoundError when program not found", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);

      await expect(update("nonexistent", { name: "Test" })).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when new name already exists", async () => {
      const other = { ...mockBankProgram, name: "Livelo" };
      vi.mocked(prisma.program.findUnique)
        .mockResolvedValueOnce(mockAirlineProgram as any) // findById
        .mockResolvedValueOnce(other as any); // name uniqueness check

      await expect(update("prog-1", { name: "Livelo" })).rejects.toThrow(ConflictError);
      expect(prisma.program.update).not.toHaveBeenCalled();
    });

    it("throws ValidationError when changing to AIRLINE without airlineId", async () => {
      const bankProg = { ...mockBankProgram };
      vi.mocked(prisma.program.findUnique).mockResolvedValue(bankProg as any);

      await expect(
        update("prog-2", { type: "AIRLINE" })
      ).rejects.toThrow(ValidationError);
      await expect(
        update("prog-2", { type: "AIRLINE" })
      ).rejects.toThrow(
        "Programas de companhia aérea devem ter uma companhia associada"
      );
    });

    it("sets airlineId to null when type is BANK", async () => {
      const airlineProg = { ...mockAirlineProgram };
      vi.mocked(prisma.program.findUnique).mockResolvedValueOnce(airlineProg as any);
      vi.mocked(prisma.program.update).mockResolvedValue(mockBankProgram as any);

      await update("prog-1", { type: "BANK" });

      expect(prisma.program.update).toHaveBeenCalledWith({
        where: { id: "prog-1" },
        data: { type: "BANK", airlineId: null },
        include: { airline: true },
      });
    });

    it("skips name uniqueness check when name unchanged", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValueOnce(mockAirlineProgram as any);
      vi.mocked(prisma.program.update).mockResolvedValue({ ...mockAirlineProgram, active: false } as any);

      await update("prog-1", { active: false });

      // findUnique called only once (for findById), not for name check
      expect(prisma.program.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("toggleActive", () => {
    it("activates a program", async () => {
      const activated = { ...mockAirlineProgram, active: true };
      vi.mocked(prisma.program.findUnique).mockResolvedValue({ ...mockAirlineProgram, active: false } as any);
      vi.mocked(prisma.program.update).mockResolvedValue(activated as any);

      const result = await toggleActive("prog-1", true);

      expect(prisma.program.update).toHaveBeenCalledWith({
        where: { id: "prog-1" },
        data: { active: true },
        include: { airline: true },
      });
      expect(result.active).toBe(true);
    });

    it("deactivates a program", async () => {
      const deactivated = { ...mockAirlineProgram, active: false };
      vi.mocked(prisma.program.findUnique).mockResolvedValue(mockAirlineProgram as any);
      vi.mocked(prisma.program.update).mockResolvedValue(deactivated as any);

      const result = await toggleActive("prog-1", false);

      expect(result.active).toBe(false);
    });

    it("throws NotFoundError when program not found", async () => {
      vi.mocked(prisma.program.findUnique).mockResolvedValue(null);

      await expect(toggleActive("nonexistent", true)).rejects.toThrow(NotFoundError);
      await expect(toggleActive("nonexistent", true)).rejects.toThrow("Programa não encontrado");
    });
  });
});
