import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { categoryCreateSchema, categoryUpdateSchema } from "../validators/category.js";

type CategoryInput = z.infer<typeof categoryCreateSchema>;
type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

export class CategoryService {
  async create(userId: string, input: CategoryInput) {
    const duplicate = await prisma.category.findFirst({ where: { userId, name: input.name, deletedAt: null } });
    if (duplicate) throw new AppError(409, "You already have an active category with this name");
    const data: Prisma.CategoryUncheckedCreateInput = { userId, name: input.name };
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.kind !== undefined) data.kind = input.kind;
    return prisma.category.create({ data });
  }

  list(userId: string) {
    return prisma.category.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } });
  }

  async getById(userId: string, id: string) {
    const category = await prisma.category.findFirst({ where: { id, userId, deletedAt: null } });
    if (!category) throw new AppError(404, "Category not found");
    return category;
  }

  async update(userId: string, id: string, input: CategoryUpdate) {
    const category = await this.getById(userId, id);
    if (input.name !== undefined && input.name !== category.name) {
      const duplicate = await prisma.category.findFirst({ where: { userId, name: input.name, deletedAt: null, NOT: { id } } });
      if (duplicate) throw new AppError(409, "You already have an active category with this name");
    }
    const data: Prisma.CategoryUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.kind !== undefined) data.kind = input.kind;
    return prisma.category.update({ where: { id: category.id }, data });
  }

  async softDelete(userId: string, id: string) {
    const category = await this.getById(userId, id);
    await prisma.category.update({ where: { id: category.id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const categoryService = new CategoryService();
