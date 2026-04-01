import prisma from "../prisma/client.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import * as AveragePriceService from "./average-price.service.js";
import { NotFoundError } from "../utils/errors.js";
import type { ClubInput } from "../utils/schemas.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Generates monthly execution dates between startDate and endDate
 * based on the chargeDay.
 */
function generateMonthlyDates(
  startDate: Date,
  endDate: Date,
  chargeDay: number
): Date[] {
  const dates: Date[] = [];
  // Start from the month of startDate
  let year = startDate.getFullYear();
  let month = startDate.getMonth();

  while (true) {
    // Clamp chargeDay to the last day of the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(chargeDay, daysInMonth);
    const date = new Date(year, month, day);

    if (date > endDate) break;
    if (date >= startDate) {
      dates.push(date);
    }

    // Advance to next month
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return dates;
}

/**
 * Creates a club within an atomic Prisma transaction.
 *
 * Gets or creates the loyalty account, creates the Club record,
 * and generates monthly CLUB_CHARGE schedules between startDate and endDate.
 */
export async function create(userId: string, data: ClubInput) {
  return prisma.$transaction(async (tx: PrismaTransaction) => {
    // 1. Get or create loyalty account
    const account = await LoyaltyAccountService.getOrCreate(
      userId,
      data.programId,
      tx
    );

    // 2. Create Club record
    const club = await tx.club.create({
      data: {
        userId,
        programId: data.programId,
        plan: data.plan,
        milesPerMonth: data.milesPerMonth,
        monthlyFee: new Decimal(data.monthlyFee),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        chargeDay: data.chargeDay,
        paymentMethod: data.paymentMethod,
      },
    });

    // 3. Generate monthly CLUB_CHARGE schedules
    const dates = generateMonthlyDates(
      new Date(data.startDate),
      new Date(data.endDate),
      data.chargeDay
    );

    for (const executionDate of dates) {
      await tx.schedule.create({
        data: {
          type: "CLUB_CHARGE",
          status: "PENDING",
          executionDate,
          loyaltyAccountId: account.id,
          clubId: club.id,
          milesAmount: data.milesPerMonth,
          costAmount: new Decimal(data.monthlyFee),
        },
      });
    }

    return club;
  });
}

/**
 * Returns all clubs for a given user, including program and schedules.
 */
export async function findAllByUser(userId: string) {
  return prisma.club.findMany({
    where: { userId },
    include: { program: true, schedules: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Processes a monthly club charge: credits miles and creates a payment.
 */
export async function processMonthlyCharge(
  clubId: string,
  tx: PrismaTransaction
): Promise<void> {
  const club = await tx.club.findUnique({
    where: { id: clubId },
  });

  if (!club) {
    throw new NotFoundError("Clube não encontrado");
  }

  // Find the loyalty account for this user + program
  const account = await tx.loyaltyAccount.findUnique({
    where: {
      userId_programId: {
        userId: club.userId,
        programId: club.programId,
      },
    },
  });

  if (!account) {
    throw new NotFoundError("Conta de fidelidade não encontrada");
  }

  // Credit miles
  await LoyaltyAccountService.credit(
    account.id,
    club.milesPerMonth,
    club.monthlyFee.toNumber(),
    tx
  );

  // Recalculate average price
  await AveragePriceService.recalculate(account.id, tx);

  // Create Payment record
  await tx.payment.create({
    data: {
      amount: club.monthlyFee,
      paymentMethod: club.paymentMethod,
      date: new Date(),
      clubId: club.id,
    },
  });
}

// Export for testing
export { generateMonthlyDates };
