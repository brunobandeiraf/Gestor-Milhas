import prisma from "../prisma/client.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import * as AveragePriceService from "./average-price.service.js";
import type { TransferInput } from "../utils/schemas.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Creates a transfer between two loyalty programs within an atomic Prisma transaction.
 *
 * Debits miles from origin immediately, creates schedules for credit/bonus/boomerang,
 * calculates proportional cost, and creates a Payment record if applicable.
 */
export async function create(userId: string, data: TransferInput) {
  return prisma.$transaction(async (tx: PrismaTransaction) => {
    // a. Get or create origin and destination loyalty accounts
    const originAccount = await LoyaltyAccountService.getOrCreate(
      userId,
      data.originProgramId,
      tx
    );
    const destinationAccount = await LoyaltyAccountService.getOrCreate(
      userId,
      data.destinationProgramId,
      tx
    );

    // b. Debit miles from origin immediately
    await LoyaltyAccountService.debit(originAccount.id, data.miles, tx);

    // c. Calculate bonus miles
    const bonusMiles = Math.floor(data.miles * (data.bonusPercentage / 100));

    // d. Calculate transfer cost (proportional to origin average price)
    let transferCost =
      (data.miles / 1000) * originAccount.averagePrice.toNumber();
    if (data.cartPurchase) {
      transferCost += data.cartPurchaseCost;
    }

    // e. Create Transfer record
    const transfer = await tx.transfer.create({
      data: {
        userId,
        originProgramId: data.originProgramId,
        destinationProgramId: data.destinationProgramId,
        miles: data.miles,
        bonusPercentage: new Decimal(data.bonusPercentage),
        bonusMiles,
        transferDate: new Date(data.transferDate),
        receiveDate: new Date(data.receiveDate),
        bonusReceiveDate: data.bonusReceiveDate
          ? new Date(data.bonusReceiveDate)
          : null,
        cartPurchase: data.cartPurchase,
        cartPurchaseCost: new Decimal(data.cartPurchaseCost),
        boomerang: data.boomerang,
        boomerangMiles: data.boomerangMiles ?? null,
        boomerangReturnDate: data.boomerangReturnDate
          ? new Date(data.boomerangReturnDate)
          : null,
      },
    });

    // f. Create Schedule TRANSFER_CREDIT
    await tx.schedule.create({
      data: {
        type: "TRANSFER_CREDIT",
        status: "PENDING",
        executionDate: new Date(data.receiveDate),
        loyaltyAccountId: destinationAccount.id,
        transferId: transfer.id,
        milesAmount: data.miles,
        costAmount: new Decimal(transferCost),
      },
    });

    // g. Create Schedule TRANSFER_BONUS_CREDIT if applicable
    if (bonusMiles > 0 && data.bonusReceiveDate) {
      await tx.schedule.create({
        data: {
          type: "TRANSFER_BONUS_CREDIT",
          status: "PENDING",
          executionDate: new Date(data.bonusReceiveDate),
          loyaltyAccountId: destinationAccount.id,
          transferId: transfer.id,
          milesAmount: bonusMiles,
          costAmount: new Decimal(0),
        },
      });
    }

    // h. Create Schedule BOOMERANG_RETURN if applicable
    if (data.boomerang && data.boomerangMiles && data.boomerangReturnDate) {
      await tx.schedule.create({
        data: {
          type: "BOOMERANG_RETURN",
          status: "PENDING",
          executionDate: new Date(data.boomerangReturnDate),
          loyaltyAccountId: originAccount.id,
          transferId: transfer.id,
          milesAmount: data.boomerangMiles,
          costAmount: new Decimal(0),
        },
      });
    }

    // i. Create Payment record if there is a cost
    if (transferCost > 0) {
      await tx.payment.create({
        data: {
          amount: new Decimal(transferCost),
          paymentMethod: "OTHER",
          date: new Date(data.transferDate),
          transferId: transfer.id,
        },
      });
    }

    // j. Recalculate average price for origin account (after debit)
    await AveragePriceService.recalculate(originAccount.id, tx);

    return transfer;
  });
}

/**
 * Returns all transfers for a given user, including schedules and payment.
 */
export async function findAllByUser(userId: string) {
  return prisma.transfer.findMany({
    where: { userId },
    include: { schedules: true, payment: true },
    orderBy: { transferDate: "desc" },
  });
}
