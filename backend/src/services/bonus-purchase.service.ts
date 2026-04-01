import prisma from "../prisma/client.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import type { BonusPurchaseInput } from "../utils/schemas.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Creates a bonus purchase within an atomic Prisma transaction.
 *
 * Calculates points as pointsPerReal * totalValue, creates the BonusPurchase
 * record, and schedules a BONUS_PURCHASE_CREDIT for the pointsReceiveDate.
 * Points are NOT credited immediately — they are scheduled.
 */
export async function create(userId: string, data: BonusPurchaseInput) {
  return prisma.$transaction(async (tx: PrismaTransaction) => {
    // 1. Get or create loyalty account
    const account = await LoyaltyAccountService.getOrCreate(
      userId,
      data.programId,
      tx
    );

    // 2. Calculate points
    const calculatedPoints = Math.floor(data.pointsPerReal * data.totalValue);

    // 3. Create BonusPurchase record
    const bonusPurchase = await tx.bonusPurchase.create({
      data: {
        userId,
        programId: data.programId,
        product: data.product,
        store: data.store,
        pointsPerReal: new Decimal(data.pointsPerReal),
        totalValue: new Decimal(data.totalValue),
        calculatedPoints,
        purchaseDate: new Date(data.purchaseDate),
        productReceiveDate: new Date(data.productReceiveDate),
        pointsReceiveDate: new Date(data.pointsReceiveDate),
      },
    });

    // 4. Create Schedule for future credit
    await tx.schedule.create({
      data: {
        type: "BONUS_PURCHASE_CREDIT",
        status: "PENDING",
        executionDate: new Date(data.pointsReceiveDate),
        loyaltyAccountId: account.id,
        bonusPurchaseId: bonusPurchase.id,
        milesAmount: calculatedPoints,
        costAmount: new Decimal(data.totalValue),
      },
    });

    return bonusPurchase;
  });
}

/**
 * Returns all bonus purchases for a given user, including program and schedules.
 */
export async function findAllByUser(userId: string) {
  return prisma.bonusPurchase.findMany({
    where: { userId },
    include: { program: true, schedules: true },
    orderBy: { purchaseDate: "desc" },
  });
}
