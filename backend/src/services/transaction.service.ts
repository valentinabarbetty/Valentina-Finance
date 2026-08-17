import { Prisma, TransactionKind } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

export const transactionInclude = {
  category: { select: { id: true, name: true, icon: true, color: true } },
  type: { select: { id: true, name: true, kind: true, icon: true, color: true } },
} as const;

export const parseMoney = (amount: string): Prisma.Decimal => new Prisma.Decimal(amount);
export const parseDate = (date: string): Date => new Date(`${date}T00:00:00.000Z`);
export const serializeDate = (date: Date): string => date.toISOString().slice(0, 10);
export function serializeTransaction<T extends { amount: Prisma.Decimal; date: Date }>(record: T): Omit<T, "amount" | "date"> & { amount: string; date: string } {
  return { ...record, amount: record.amount.toFixed(2), date: serializeDate(record.date) };
}

export async function assertCategory(userId: string, categoryId: string, kind: TransactionKind): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, deletedAt: null, kind: { in: ["GENERAL", kind] } },
    select: { id: true },
  });
  if (!category) throw new AppError(400, "Category must be active, owned by you, and compatible with this transaction");
}

export async function assertTransactionType(userId: string, typeId: string, kind: TransactionKind): Promise<void> {
  const type = await prisma.transactionType.findFirst({
    where: { id: typeId, userId, deletedAt: null, kind },
    select: { id: true },
  });
  if (!type) throw new AppError(400, "Transaction type must be active, owned by you, and compatible with this transaction");
}

export function dateFilter(month?: number, year?: number): Prisma.DateTimeFilter | undefined {
  if (month === undefined || year === undefined) return undefined;
  return { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) };
}

export function pagination(page?: number, limit?: number): { skip?: number; take?: number } {
  if (!page || !limit) return {};
  return { skip: (page - 1) * limit, take: limit };
}
