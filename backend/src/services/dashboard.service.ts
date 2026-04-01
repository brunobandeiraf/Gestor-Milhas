import prisma from "../prisma/client.js";
import { Prisma } from "../generated/prisma/client.js";

const { Decimal } = Prisma;

export interface AccountSummary {
  programName: string;
  miles: number;
  averagePrice: number;
  totalCost: number;
}

export interface UpcomingSchedule {
  id: string;
  type: string;
  executionDate: Date;
  milesAmount: number;
  programName: string;
}

export interface UserDashboard {
  accounts: AccountSummary[];
  totalMiles: number;
  totalInvested: number;
  totalSaved: number;
  upcomingSchedules: UpcomingSchedule[];
}

export interface UserMetrics {
  accounts: AccountSummary[];
  totalMiles: number;
  totalInvested: number;
  totalSaved: number;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string | null;
  totalMiles: number;
  totalInvested: number;
  totalSaved: number;
}

export interface AdminDashboard {
  managedUsersSavings: number;
  globalSavings: number;
  users: UserSummary[];
}

/**
 * Aggregates account data for a user into AccountSummary array.
 */
async function getAccountSummaries(userId: string): Promise<AccountSummary[]> {
  const accounts = await prisma.loyaltyAccount.findMany({
    where: { userId },
    include: { program: true },
    orderBy: { createdAt: "asc" },
  });

  return accounts.map((a) => ({
    programName: a.program.name,
    miles: a.miles,
    averagePrice: a.averagePrice.toNumber(),
    totalCost: a.totalCost.toNumber(),
  }));
}

/**
 * Sums savings from all issuances for a user.
 */
async function getTotalSaved(userId: string): Promise<number> {
  const result = await prisma.issuance.aggregate({
    where: { userId },
    _sum: { savings: true },
  });
  return result._sum.savings?.toNumber() ?? 0;
}

/**
 * Returns the user dashboard with account summaries, totals, and upcoming schedules.
 */
export async function getUserDashboard(userId: string): Promise<UserDashboard> {
  const accounts = await getAccountSummaries(userId);

  const totalMiles = accounts.reduce((sum, a) => sum + a.miles, 0);
  const totalInvested = accounts.reduce((sum, a) => sum + a.totalCost, 0);
  const totalSaved = await getTotalSaved(userId);

  const pendingSchedules = await prisma.schedule.findMany({
    where: {
      loyaltyAccount: { userId },
      status: "PENDING",
    },
    include: {
      loyaltyAccount: { include: { program: true } },
    },
    orderBy: { executionDate: "asc" },
  });

  const upcomingSchedules: UpcomingSchedule[] = pendingSchedules.map((s) => ({
    id: s.id,
    type: s.type,
    executionDate: s.executionDate,
    milesAmount: s.milesAmount,
    programName: s.loyaltyAccount.program.name,
  }));

  return {
    accounts,
    totalMiles,
    totalInvested,
    totalSaved,
    upcomingSchedules,
  };
}

/**
 * Returns user metrics (same as dashboard but without upcoming schedules).
 */
export async function getUserMetrics(userId: string): Promise<UserMetrics> {
  const accounts = await getAccountSummaries(userId);

  const totalMiles = accounts.reduce((sum, a) => sum + a.miles, 0);
  const totalInvested = accounts.reduce((sum, a) => sum + a.totalCost, 0);
  const totalSaved = await getTotalSaved(userId);

  return { accounts, totalMiles, totalInvested, totalSaved };
}

/**
 * Returns the admin dashboard with managed users savings, global savings,
 * and a list of users with their summaries.
 */
export async function getAdminDashboard(
  adminId: string
): Promise<AdminDashboard> {
  // Get managed users
  const managedUsers = await prisma.user.findMany({
    where: { adminId },
    select: { id: true, email: true, fullName: true },
  });

  // Build user summaries
  const users: UserSummary[] = [];
  let managedUsersSavings = 0;

  for (const user of managedUsers) {
    const accounts = await getAccountSummaries(user.id);
    const totalMiles = accounts.reduce((sum, a) => sum + a.miles, 0);
    const totalInvested = accounts.reduce((sum, a) => sum + a.totalCost, 0);
    const totalSaved = await getTotalSaved(user.id);

    managedUsersSavings += totalSaved;

    users.push({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      totalMiles,
      totalInvested,
      totalSaved,
    });
  }

  // Global savings across ALL users
  const globalResult = await prisma.issuance.aggregate({
    _sum: { savings: true },
  });
  const globalSavings = globalResult._sum.savings?.toNumber() ?? 0;

  return { managedUsersSavings, globalSavings, users };
}
