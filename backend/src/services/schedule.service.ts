import prisma from "../prisma/client.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";
import * as ClubService from "./club.service.js";
import * as LoyaltyAccountService from "./loyalty-account.service.js";
import * as AveragePriceService from "./average-price.service.js";
import { NotFoundError } from "../utils/errors.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Returns pending schedules for a given user, ordered by executionDate.
 */
export async function getPending(userId: string) {
  return prisma.schedule.findMany({
    where: {
      loyaltyAccount: { userId },
      status: "PENDING",
    },
    include: {
      loyaltyAccount: { include: { program: true } },
      club: true,
      bonusPurchase: true,
      transfer: true,
    },
    orderBy: { executionDate: "asc" },
  });
}

/**
 * Gets the current date in America/Sao_Paulo timezone as a Date object
 * with time set to end of day for comparison purposes.
 */
function getTodaySaoPaulo(): Date {
  const now = new Date();
  const spFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = spFormatter.format(now); // "YYYY-MM-DD"
  // Set to end of day so executionDate <= today works for dates on the same day
  return new Date(dateStr + "T23:59:59.999Z");
}

/**
 * Processes all pending schedules whose executionDate <= today (America/Sao_Paulo).
 * Each schedule is executed individually — success marks COMPLETED, failure records error.
 */
export async function processDaily(): Promise<void> {
  const today = getTodaySaoPaulo();

  const pendingSchedules = await prisma.schedule.findMany({
    where: {
      executionDate: { lte: today },
      status: "PENDING",
    },
    orderBy: { executionDate: "asc" },
  });

  for (const schedule of pendingSchedules) {
    try {
      await prisma.$transaction(async (tx: PrismaTransaction) => {
        await execute(schedule.id, tx);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { errorMessage },
      });
    }
  }
}

/**
 * Executes a single schedule based on its type.
 * Must be called within a Prisma transaction.
 */
export async function execute(
  scheduleId: string,
  tx: PrismaTransaction
): Promise<void> {
  const schedule = await tx.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new NotFoundError("Agendamento não encontrado");
  }

  switch (schedule.type) {
    case "CLUB_CHARGE": {
      if (!schedule.clubId) {
        throw new Error("Agendamento de clube sem clubId");
      }
      await ClubService.processMonthlyCharge(schedule.clubId, tx);
      break;
    }

    case "BONUS_PURCHASE_CREDIT": {
      await LoyaltyAccountService.credit(
        schedule.loyaltyAccountId,
        schedule.milesAmount,
        schedule.costAmount.toNumber(),
        tx
      );
      await AveragePriceService.recalculate(schedule.loyaltyAccountId, tx);
      break;
    }

    case "TRANSFER_CREDIT": {
      await LoyaltyAccountService.credit(
        schedule.loyaltyAccountId,
        schedule.milesAmount,
        schedule.costAmount.toNumber(),
        tx
      );
      await AveragePriceService.recalculate(schedule.loyaltyAccountId, tx);
      break;
    }

    case "TRANSFER_BONUS_CREDIT": {
      await LoyaltyAccountService.credit(
        schedule.loyaltyAccountId,
        schedule.milesAmount,
        0,
        tx
      );
      await AveragePriceService.recalculate(schedule.loyaltyAccountId, tx);
      break;
    }

    case "BOOMERANG_RETURN": {
      await LoyaltyAccountService.credit(
        schedule.loyaltyAccountId,
        schedule.milesAmount,
        0,
        tx
      );
      await AveragePriceService.recalculate(schedule.loyaltyAccountId, tx);
      break;
    }
  }

  // Mark as COMPLETED
  await tx.schedule.update({
    where: { id: scheduleId },
    data: {
      status: "COMPLETED",
      executedAt: new Date(),
    },
  });
}
