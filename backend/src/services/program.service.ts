import prisma from "../prisma/client.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import type { ProgramInput } from "../utils/schemas.js";
import type { Program } from "../generated/prisma/client.js";

export async function create(data: ProgramInput): Promise<Program> {
  if (data.type === "AIRLINE" && !data.airlineId) {
    throw new ValidationError(
      "Programas de companhia aérea devem ter uma companhia associada",
      "VALIDATION_ERROR",
      { field: "airlineId" }
    );
  }

  const existing = await prisma.program.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    throw new ConflictError("Programa já cadastrado", "NAME_CONFLICT", {
      field: "name",
    });
  }

  return prisma.program.create({
    data: {
      name: data.name,
      type: data.type,
      airlineId: data.type === "BANK" ? null : data.airlineId ?? null,
      cpfLimit: data.cpfLimit ?? null,
      active: data.active ?? true,
    },
    include: { airline: true },
  });
}

export async function findAll(): Promise<Program[]> {
  return prisma.program.findMany({
    orderBy: { name: "asc" },
    include: { airline: true },
  });
}

export async function findById(id: string): Promise<Program> {
  const program = await prisma.program.findUnique({
    where: { id },
    include: { airline: true },
  });
  if (!program) {
    throw new NotFoundError("Programa não encontrado");
  }
  return program;
}

export async function update(
  id: string,
  data: Partial<ProgramInput>
): Promise<Program> {
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) {
    throw new NotFoundError("Programa não encontrado");
  }

  const effectiveType = data.type ?? program.type;

  if (effectiveType === "AIRLINE") {
    const effectiveAirlineId = data.airlineId !== undefined ? data.airlineId : program.airlineId;
    if (!effectiveAirlineId) {
      throw new ValidationError(
        "Programas de companhia aérea devem ter uma companhia associada",
        "VALIDATION_ERROR",
        { field: "airlineId" }
      );
    }
  }

  if (data.name && data.name !== program.name) {
    const existing = await prisma.program.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictError("Programa já cadastrado", "NAME_CONFLICT", {
        field: "name",
      });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.cpfLimit !== undefined) updateData.cpfLimit = data.cpfLimit;
  if (data.active !== undefined) updateData.active = data.active;

  // For BANK type, always set airlineId to null
  if (effectiveType === "BANK") {
    updateData.airlineId = null;
  } else if (data.airlineId !== undefined) {
    updateData.airlineId = data.airlineId;
  }

  return prisma.program.update({
    where: { id },
    data: updateData,
    include: { airline: true },
  });
}

export async function toggleActive(
  id: string,
  active: boolean
): Promise<Program> {
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) {
    throw new NotFoundError("Programa não encontrado");
  }

  return prisma.program.update({
    where: { id },
    data: { active },
    include: { airline: true },
  });
}
