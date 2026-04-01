import prisma from "../prisma/client.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import * as AveragePriceService from "./average-price.service.js";
import type { TransactionInput } from "../utils/schemas.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Creates a transaction (miles purchase/bonus/card points/manual adjust)
 * within an atomic Prisma transaction.
 *
 * Handles VM ↔ VT conversion, credits miles, recalculates average price,
 * and creates the associated Payment record.
 */
export async function create(userId: string, data: TransactionInput) {
  return prisma.$transaction(async (tx: PrismaTransaction) => {
    // 1. Get or create loyalty account
    const account = await LoyaltyAccountService.getOrCreate(
      userId,
      data.programId,
      tx
    );

    // 2. VM ↔ VT conversion
    let totalCost: number;
    let costPerK: number;
    const milesInK = data.miles / 1000;

    if (data.costPerK != null) {
      // VM provided: calculate VT
      costPerK = data.costPerK;
      totalCost = costPerK * milesInK;
    } else {
      // VT provided: calculate VM
      totalCost = data.totalCost!;
      costPerK = totalCost / milesInK;
    }

    // 3. Create Transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        programId: data.programId,
        type: data.type,
        miles: data.miles,
        totalCost: new Decimal(totalCost),
        costPerK: new Decimal(costPerK),
        date: new Date(data.date),
      },
    });

    // 4. Credit miles to loyalty account
    await LoyaltyAccountService.credit(account.id, data.miles, totalCost, tx);

    // 5. Recalculate average price
    await AveragePriceService.recalculate(account.id, tx);

    // 6. Create Payment record
    await tx.payment.create({
      data: {
        amount: new Decimal(totalCost),
        paymentMethod: data.paymentMethod,
        date: new Date(data.date),
        transactionId: transaction.id,
      },
    });

    return transaction;
  });
}

/**
 * Returns all transactions for a given user, including the program relation.
 */
export async function findAllByUser(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    include: { program: true, payment: true },
    orderBy: { date: "desc" },
  });
}
