import prisma from "../prisma/client.js";
import { AuthorizationError, NotFoundError } from "../utils/errors.js";
import type { CardInput } from "../utils/schemas.js";

const ADMIN_ONLY_FIELDS = [
  "minIncome",
  "scoring",
  "brand",
  "vipLounge",
  "notes",
] as const;

function stripAdminFields(data: Partial<CardInput>): Partial<CardInput> {
  const cleaned = { ...data };
  for (const field of ADMIN_ONLY_FIELDS) {
    delete cleaned[field];
  }
  return cleaned;
}

export async function create(userId: string, data: CardInput) {
  return prisma.card.create({
    data: {
      userId,
      bankId: data.bankId,
      name: data.name,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      creditLimit: data.creditLimit,
      annualFee: data.annualFee ?? 0,
      active: data.active ?? true,
      minIncome: data.minIncome ?? null,
      scoring: data.scoring ?? null,
      brand: data.brand ?? null,
      vipLounge: data.vipLounge ?? null,
      notes: data.notes ?? null,
    },
    include: { bank: true },
  });
}

export async function findAllByUser(userId: string) {
  return prisma.card.findMany({
    where: { userId },
    include: { bank: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function findById(id: string) {
  const card = await prisma.card.findUnique({
    where: { id },
    include: { bank: true },
  });
  if (!card) {
    throw new NotFoundError("Cartão não encontrado");
  }
  return card;
}

export async function update(
  id: string,
  userId: string,
  role: string,
  data: Partial<CardInput>
) {
  const card = await prisma.card.findUnique({ where: { id } });
  if (!card) {
    throw new NotFoundError("Cartão não encontrado");
  }
  if (card.userId !== userId && role !== "ADMIN") {
    throw new AuthorizationError("Acesso negado");
  }

  const updateData = role !== "ADMIN" ? stripAdminFields(data) : data;

  return prisma.card.update({
    where: { id },
    data: updateData,
    include: { bank: true },
  });
}

export async function toggleActive(
  id: string,
  userId: string,
  role: string,
  active: boolean
) {
  const card = await prisma.card.findUnique({ where: { id } });
  if (!card) {
    throw new NotFoundError("Cartão não encontrado");
  }
  if (card.userId !== userId && role !== "ADMIN") {
    throw new AuthorizationError("Acesso negado");
  }

  return prisma.card.update({
    where: { id },
    data: { active },
    include: { bank: true },
  });
}
