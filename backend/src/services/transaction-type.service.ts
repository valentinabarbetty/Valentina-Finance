import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { transactionTypeCreateSchema, transactionTypeUpdateSchema } from "../validators/transaction-type.js";

type TransactionTypeInput = z.infer<typeof transactionTypeCreateSchema>;
type TransactionTypeUpdate = z.infer<typeof transactionTypeUpdateSchema>;

export class TransactionTypeService {
  async create(userId: string, input: TransactionTypeInput) {
    const duplicate = await prisma.transactionType.findFirst({ where: { userId, kind: input.kind, name: input.name, deletedAt: null } });
    if (duplicate) throw new AppError(409, "You already have an active transaction type with this name and kind");
    const data: Prisma.TransactionTypeUncheckedCreateInput = { userId, name: input.name, kind: input.kind };
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    return prisma.transactionType.create({ data });
  }

  list(userId: string) {
    return prisma.transactionType.findMany({ where: { userId, deletedAt: null }, orderBy: [{ kind: "asc" }, { name: "asc" }] });
  }

  async getById(userId: string, id: string) {
    const transactionType = await prisma.transactionType.findFirst({ where: { id, userId, deletedAt: null } });
    if (!transactionType) throw new AppError(404, "Transaction type not found");
    return transactionType;
  }

  async update(userId: string, id: string, input: TransactionTypeUpdate) {
    const transactionType = await this.getById(userId, id);
    const name = input.name ?? transactionType.name;
    const kind = input.kind ?? transactionType.kind;
    const duplicate = await prisma.transactionType.findFirst({ where: { userId, kind, name, deletedAt: null, NOT: { id } } });
    if (duplicate) throw new AppError(409, "You already have an active transaction type with this name and kind");
    const data: Prisma.TransactionTypeUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.kind !== undefined) data.kind = input.kind;
    return prisma.transactionType.update({ where: { id: transactionType.id }, data });
  }

  async softDelete(userId: string, id: string) {
    const transactionType = await this.getById(userId, id);
    await prisma.transactionType.update({ where: { id: transactionType.id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const transactionTypeService = new TransactionTypeService();
