import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { expenseCreateSchema, expenseUpdateSchema, transactionFilterSchema } from "../validators/transaction.js";
import { assertCategory, assertTransactionType, dateFilter, pagination, parseDate, parseMoney, transactionInclude } from "./transaction.service.js";

type CreateInput = z.infer<typeof expenseCreateSchema>;
type UpdateInput = z.infer<typeof expenseUpdateSchema>;
type Filters = z.infer<typeof transactionFilterSchema>;

export class ExpenseService {
  async create(userId: string, input: CreateInput) {
    await assertCategory(userId, input.categoryId, "EXPENSE");
    if (input.typeId) await assertTransactionType(userId, input.typeId, "EXPENSE");
    const data: Prisma.ExpenseUncheckedCreateInput = { userId, categoryId: input.categoryId, amount: parseMoney(input.amount), date: parseDate(input.date) };
    if (input.typeId !== undefined) data.typeId = input.typeId;
    if (input.description !== undefined) data.description = input.description;
    if (input.notes !== undefined) data.notes = input.notes;
    return prisma.expense.create({ data, include: transactionInclude });
  }

  list(userId: string, filters: Filters) {
    const where: Prisma.ExpenseWhereInput = { userId, deletedAt: null };
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.transactionTypeId !== undefined) where.typeId = filters.transactionTypeId;
    const range = dateFilter(filters.month, filters.year);
    if (range) where.date = range;
    return prisma.expense.findMany({
      where,
      include: transactionInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      ...pagination(filters.page, filters.limit),
    });
  }

  async getById(userId: string, id: string) {
    const expense = await prisma.expense.findFirst({ where: { id, userId, deletedAt: null }, include: transactionInclude });
    if (!expense) throw new AppError(404, "Expense not found");
    return expense;
  }

  async update(userId: string, id: string, input: UpdateInput) {
    const expense = await this.getById(userId, id);
    const categoryId = input.categoryId ?? expense.categoryId;
    const typeId = input.typeId === undefined ? expense.typeId : input.typeId;
    await assertCategory(userId, categoryId, "EXPENSE");
    if (typeId) await assertTransactionType(userId, typeId, "EXPENSE");
    const data: Prisma.ExpenseUncheckedUpdateInput = {};
    if (input.amount !== undefined) data.amount = parseMoney(input.amount);
    if (input.date !== undefined) data.date = parseDate(input.date);
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.typeId !== undefined) data.typeId = input.typeId;
    if (input.description !== undefined) data.description = input.description;
    if (input.notes !== undefined) data.notes = input.notes;
    return prisma.expense.update({ where: { id: expense.id }, data, include: transactionInclude });
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const expense = await this.getById(userId, id);
    await prisma.expense.update({ where: { id: expense.id }, data: { deletedAt: new Date() } });
  }
}

export const expenseService = new ExpenseService();
