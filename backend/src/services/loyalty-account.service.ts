import prisma from "../prisma/client.js";
import { BusinessRuleError, NotFoundError } from "../utils/errors.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function getByUser(userId: string) {
  return prisma.loyaltyAccount.findMany({
    where: { userId },
    include: { program: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getOrCreate(
  userId: string,
  programId: string,
  tx?: PrismaTransaction
) {
  const client = tx ?? prisma;

  const existing = await client.loyaltyAccount.findUnique({
    where: { userId_programId: { userId, programId } },
  });

  if (existing) return existing;

  const program = await client.program.findUnique({
    where: { id: programId },
  });

  if (!program) {
    throw new NotFoundError("Programa não encontrado");
  }

  return client.loyaltyAccount.create({
    data: {
      userId,
      programId,
      miles: 0,
      totalCost: new Decimal(0),
      averagePrice: new Decimal(0),
      cpfAvailable: program.type === "AIRLINE" ? (program.cpfLimit ?? 0) : 0,
    },
  });
}

export async function credit(
  accountId: string,
  miles: number,
  cost: number,
  tx?: PrismaTransaction
) {
  const client = tx ?? prisma;

  const account = await client.loyaltyAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new NotFoundError("Conta de fidelidade não encontrada");
  }

  await client.loyaltyAccount.update({
    where: { id: accountId },
    data: {
      miles: account.miles + miles,
      totalCost: new Decimal(account.totalCost.toNumber() + cost),
    },
  });
}

export async function debit(
  accountId: string,
  miles: number,
  tx?: PrismaTransaction
) {
  const client = tx ?? prisma;

  const account = await client.loyaltyAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new NotFoundError("Conta de fidelidade não encontrada");
  }

  if (account.miles < miles) {
    throw new BusinessRuleError("Saldo de milhas insuficiente");
  }

  await client.loyaltyAccount.update({
    where: { id: accountId },
    data: {
      miles: account.miles - miles,
    },
  });
}

export async function decrementCpf(
  accountId: string,
  tx?: PrismaTransaction
) {
  const client = tx ?? prisma;

  const account = await client.loyaltyAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new NotFoundError("Conta de fidelidade não encontrada");
  }

  if (account.cpfAvailable <= 0) {
    throw new BusinessRuleError("Limite de CPF atingido para este programa");
  }

  await client.loyaltyAccount.update({
    where: { id: accountId },
    data: {
      cpfAvailable: account.cpfAvailable - 1,
    },
  });
}
