import prisma from "../prisma/client.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import type { Bank } from "../generated/prisma/client.js";

export async function create(data: { name: string }): Promise<Bank> {
  const existing = await prisma.bank.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ConflictError("Banco já cadastrado", "NAME_CONFLICT", { field: "name" });
  }

  return prisma.bank.create({ data: { name: data.name } });
}

export async function findAll(): Promise<Bank[]> {
  return prisma.bank.findMany({ orderBy: { name: "asc" } });
}

export async function findById(id: string): Promise<Bank> {
  const bank = await prisma.bank.findUnique({ where: { id } });
  if (!bank) {
    throw new NotFoundError("Banco não encontrado");
  }
  return bank;
}

export async function update(
  id: string,
  data: { name?: string; active?: boolean }
): Promise<Bank> {
  const bank = await prisma.bank.findUnique({ where: { id } });
  if (!bank) {
    throw new NotFoundError("Banco não encontrado");
  }

  if (data.name && data.name !== bank.name) {
    const existing = await prisma.bank.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictError("Banco já cadastrado", "NAME_CONFLICT", { field: "name" });
    }
  }

  return prisma.bank.update({ where: { id }, data });
}

export async function deactivate(id: string): Promise<Bank> {
  const bank = await prisma.bank.findUnique({ where: { id } });
  if (!bank) {
    throw new NotFoundError("Banco não encontrado");
  }

  const activeCards = await prisma.card.findMany({
    where: { bankId: id, active: true },
    select: { name: true },
  });

  if (activeCards.length > 0) {
    const names = activeCards.map((c) => c.name).join(", ");
    throw new ConflictError(
      `Existem registros ativos vinculados: ${names}`,
      "ACTIVE_LINKS"
    );
  }

  return prisma.bank.update({ where: { id }, data: { active: false } });
}
