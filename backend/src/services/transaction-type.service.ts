import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { transactionTypeCreateSchema, transactionTypeUpdateSchema } from "../validators/transaction-type.js";

type TransactionTypeInput = z.infer<typeof transactionTypeCreateSchema>;
type TransactionTypeUpdate = z.infer<typeof transactionTypeUpdateSchema>;

export class TransactionTypeService {
  private async assertCategoryKind(userId: string, categoryId: string, kind: string): Promise<void> {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
      select: { id: true, kind: true },
    });
    if (!category) throw new AppError(400, "Category not found");
    if (category.kind !== kind) throw new AppError(400, `Category kind must be ${kind}, not ${category.kind}`);
  }

  async create(userId: string, input: TransactionTypeInput) {
    await this.assertCategoryKind(userId, input.categoryId, input.kind);
    const duplicate = await prisma.transactionType.findFirst({ where: { userId, categoryId: input.categoryId, name: input.name, deletedAt: null } });
    if (duplicate) throw new AppError(409, "You already have an active transaction type with this name in this category");
    const data: Prisma.TransactionTypeUncheckedCreateInput = { userId, name: input.name, kind: input.kind, categoryId: input.categoryId };
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    return prisma.transactionType.create({ data });
  }

  list(userId: string, categoryId?: string) {
    const where: Prisma.TransactionTypeWhereInput = { userId, deletedAt: null };
    if (categoryId) where.categoryId = categoryId;
    return prisma.transactionType.findMany({ where, orderBy: [{ kind: "asc" }, { name: "asc" }] });
  }

  async getById(userId: string, id: string) {
    const transactionType = await prisma.transactionType.findFirst({ where: { id, userId, deletedAt: null } });
    if (!transactionType) throw new AppError(404, "Transaction type not found");
    return transactionType;
  }

  async update(userId: string, id: string, input: TransactionTypeUpdate) {
    const transactionType = await this.getById(userId, id);
    const name = input.name ?? transactionType.name;
    const categoryId = input.categoryId ?? transactionType.categoryId;
    if (input.kind !== undefined || input.categoryId !== undefined) {
      const kind = input.kind ?? transactionType.kind;
      await this.assertCategoryKind(userId, categoryId, kind);
    }
    const duplicate = await prisma.transactionType.findFirst({ where: { userId, categoryId, name, deletedAt: null, NOT: { id } } });
    if (duplicate) throw new AppError(409, "You already have an active transaction type with this name in this category");
    const data: Prisma.TransactionTypeUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.kind !== undefined) data.kind = input.kind;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    return prisma.transactionType.update({ where: { id: transactionType.id }, data });
  }

  async softDelete(userId: string, id: string) {
    const transactionType = await this.getById(userId, id);
    await prisma.transactionType.update({ where: { id: transactionType.id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const transactionTypeService = new TransactionTypeService();
