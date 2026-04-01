import prisma from "../prisma/client.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import type { Airline } from "../generated/prisma/client.js";

export async function create(data: { name: string }): Promise<Airline> {
  const existing = await prisma.airline.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ConflictError("Companhia aérea já cadastrada", "NAME_CONFLICT", { field: "name" });
  }

  return prisma.airline.create({ data: { name: data.name } });
}

export async function findAll(): Promise<Airline[]> {
  return prisma.airline.findMany({ orderBy: { name: "asc" } });
}

export async function findById(id: string): Promise<Airline> {
  const airline = await prisma.airline.findUnique({ where: { id } });
  if (!airline) {
    throw new NotFoundError("Companhia aérea não encontrada");
  }
  return airline;
}

export async function update(
  id: string,
  data: { name?: string; active?: boolean }
): Promise<Airline> {
  const airline = await prisma.airline.findUnique({ where: { id } });
  if (!airline) {
    throw new NotFoundError("Companhia aérea não encontrada");
  }

  if (data.name && data.name !== airline.name) {
    const existing = await prisma.airline.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictError("Companhia aérea já cadastrada", "NAME_CONFLICT", { field: "name" });
    }
  }

  return prisma.airline.update({ where: { id }, data });
}

export async function deactivate(id: string): Promise<Airline> {
  const airline = await prisma.airline.findUnique({ where: { id } });
  if (!airline) {
    throw new NotFoundError("Companhia aérea não encontrada");
  }

  const activePrograms = await prisma.program.findMany({
    where: { airlineId: id, active: true },
    select: { name: true },
  });

  if (activePrograms.length > 0) {
    const names = activePrograms.map((p) => p.name).join(", ");
    throw new ConflictError(
      `Existem registros ativos vinculados: ${names}`,
      "ACTIVE_LINKS"
    );
  }

  return prisma.airline.update({ where: { id }, data: { active: false } });
}
