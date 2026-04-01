import prisma from "../prisma/client.js";
import { NotFoundError } from "../utils/errors.js";
import { Prisma, type PrismaClient } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

type PrismaTransaction = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/**
 * Recalculates the average price for a loyalty account based on current miles and totalCost.
 * Formula: averagePrice = totalCost / (miles / 1000)
 * If miles === 0, averagePrice = 0.
 */
export async function recalculate(
  loyaltyAccountId: string,
  tx?: PrismaTransaction
): Promise<void> {
  const client = tx ?? prisma;

  const account = await client.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new NotFoundError("Conta de fidelidade não encontrada");
  }

  let averagePrice: InstanceType<typeof Decimal>;

  if (account.miles === 0) {
    averagePrice = new Decimal(0);
  } else {
    // totalCost / (miles / 1000) = totalCost * 1000 / miles
    averagePrice = new Decimal(account.totalCost.toString())
      .mul(1000)
      .div(account.miles);
  }

  await client.loyaltyAccount.update({
    where: { id: loyaltyAccountId },
    data: { averagePrice },
  });
}
