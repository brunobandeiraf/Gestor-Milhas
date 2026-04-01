import prisma from "../prisma/client.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import { BusinessRuleError } from "../utils/errors.js";
import type { IssuanceInput } from "../utils/schemas.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Creates an issuance (ticket emission) within an atomic Prisma transaction.
 *
 * Validates sufficient miles and CPF availability, debits miles,
 * decrements CPF for AIRLINE programs, calculates totalCost and savings,
 * and creates a Payment record.
 */
export async function create(userId: string, data: IssuanceInput) {
  return prisma.$transaction(async (tx: PrismaTransaction) => {
    // a. Get or create LoyaltyAccount
    const account = await LoyaltyAccountService.getOrCreate(
      userId,
      data.programId,
      tx
    );

    // b. Validate sufficient miles
    if (account.miles < data.milesUsed) {
      throw new BusinessRuleError("Saldo de milhas insuficiente");
    }

    // c. Get the program to check type
    const program = await tx.program.findUnique({
      where: { id: data.programId },
    });

    // d. If AIRLINE, validate CPF and decrement
    if (program?.type === "AIRLINE") {
      if (account.cpfAvailable <= 0) {
        throw new BusinessRuleError(
          "Limite de CPF atingido para este programa"
        );
      }
      await LoyaltyAccountService.decrementCpf(account.id, tx);
    }

    // e. Calculate totalCost
    const totalCost =
      (data.milesUsed / 1000) * account.averagePrice.toNumber() +
      data.cashPaid;

    // f. Calculate savings
    const savings = data.realTicketValue - totalCost;

    // g. Debit miles
    await LoyaltyAccountService.debit(account.id, data.milesUsed, tx);

    // h. Create Issuance record
    const issuance = await tx.issuance.create({
      data: {
        userId,
        programId: data.programId,
        date: new Date(data.date),
        cpfUsed: data.cpfUsed,
        milesUsed: data.milesUsed,
        cashPaid: new Decimal(data.cashPaid),
        locator: data.locator ?? null,
        passenger: data.passenger,
        realTicketValue: new Decimal(data.realTicketValue),
        totalCost: new Decimal(totalCost),
        savings: new Decimal(savings),
        notes: data.notes ?? null,
      },
    });

    // i. Create Payment record
    await tx.payment.create({
      data: {
        amount: new Decimal(data.cashPaid),
        paymentMethod: data.paymentMethod,
        date: new Date(data.date),
        issuanceId: issuance.id,
      },
    });

    return issuance;
  });
}

/**
 * Returns all issuances for a given user, including payment.
 */
export async function findAllByUser(userId: string) {
  return prisma.issuance.findMany({
    where: { userId },
    include: { payment: true },
    orderBy: { date: "desc" },
  });
}
