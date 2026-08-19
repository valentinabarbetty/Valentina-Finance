import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { incomeCreateSchema, incomeUpdateSchema, transactionFilterSchema } from "../validators/transaction.js";
import { assertCategory, assertTransactionType, dateFilter, pagination, parseDate, parseMoney, transactionInclude } from "./transaction.service.js";

type CreateInput = z.infer<typeof incomeCreateSchema>;
type UpdateInput = z.infer<typeof incomeUpdateSchema>;
type Filters = z.infer<typeof transactionFilterSchema>;

export class IncomeService {
  async create(userId: string, input: CreateInput) {
    await assertCategory(userId, input.categoryId, "INCOME");
    if (input.typeId) await assertTransactionType(userId, input.typeId, "INCOME", input.categoryId);
    const data: Prisma.IncomeUncheckedCreateInput = { userId, categoryId: input.categoryId, amount: parseMoney(input.amount), date: parseDate(input.date) };
    if (input.typeId !== undefined) data.typeId = input.typeId;
    if (input.description !== undefined) data.description = input.description;
    if (input.notes !== undefined) data.notes = input.notes;
    return prisma.income.create({ data, include: transactionInclude });
  }

  list(userId: string, filters: Filters) {
    const where: Prisma.IncomeWhereInput = { userId, deletedAt: null };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.transactionTypeId !== undefined) where.typeId = filters.transactionTypeId;
    const range = dateFilter(filters.month, filters.year);
    if (range) where.date = range;
    return prisma.income.findMany({
      where,
      include: transactionInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      ...pagination(filters.page, filters.limit),
    });
  }

  async getById(userId: string, id: string) {
    const income = await prisma.income.findFirst({ where: { id, userId, deletedAt: null }, include: transactionInclude });
    if (!income) throw new AppError(404, "Income not found");
    return income;
  }

  async update(userId: string, id: string, input: UpdateInput) {
    const income = await this.getById(userId, id);
    const categoryId = input.categoryId ?? income.categoryId;
    const typeId = input.typeId === undefined ? income.typeId : input.typeId;
    await assertCategory(userId, categoryId, "INCOME");
    if (typeId) await assertTransactionType(userId, typeId, "INCOME", categoryId);
    const data: Prisma.IncomeUncheckedUpdateInput = {};
    if (input.amount !== undefined) data.amount = parseMoney(input.amount);
    if (input.date !== undefined) data.date = parseDate(input.date);
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.typeId !== undefined) data.typeId = input.typeId;
    if (input.description !== undefined) data.description = input.description;
    if (input.notes !== undefined) data.notes = input.notes;
    return prisma.income.update({ where: { id: income.id }, data, include: transactionInclude });
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const income = await this.getById(userId, id);
    await prisma.income.update({ where: { id: income.id }, data: { deletedAt: new Date() } });
  }
}

export const incomeService = new IncomeService();
