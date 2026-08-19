import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { budgetCreateSchema, budgetUpdateSchema } from "../validators/budget.js";
import { parseMoney } from "./transaction.service.js";

type CreateInput = z.infer<typeof budgetCreateSchema>;
type UpdateInput = z.infer<typeof budgetUpdateSchema>;

const money = (value: Prisma.Decimal) => value.toFixed(2);

type BudgetRow = Prisma.BudgetGetPayload<null>;
function formatBudget(budget: BudgetRow) {
  return { ...budget, plannedAmount: money(budget.plannedAmount) };
}

export class BudgetService {
  private async assertTarget(userId: string, categoryId: string | null | undefined, goalId: string | null | undefined): Promise<void> {
    const hasCat = categoryId !== null && categoryId !== undefined;
    const hasGoal = goalId !== null && goalId !== undefined;
    if (hasCat && hasGoal) throw new AppError(400, "Target either a category or a goal, not both");
    if (!hasCat && !hasGoal) throw new AppError(400, "Must target a category or a goal");
    if (hasCat) {
      const category = await prisma.category.findFirst({ where: { id: categoryId!, userId, deletedAt: null }, select: { id: true } });
      if (!category) throw new AppError(400, "Category not found");
    }
    if (hasGoal) {
      const goal = await prisma.goal.findFirst({ where: { id: goalId!, userId, deletedAt: null }, select: { id: true } });
      if (!goal) throw new AppError(400, "Goal not found");
    }
  }

  async create(userId: string, input: CreateInput) {
    const categoryId = input.categoryId ?? null;
    const goalId = input.goalId ?? null;
    const isRecurring = input.isRecurring ?? false;

    await this.assertTarget(userId, categoryId, goalId);

    if (isRecurring) {
      const existing = await prisma.budget.findFirst({
        where: { userId, deletedAt: null, isRecurring: true, ...(categoryId ? { categoryId } : { goalId }) },
      });
      if (existing) throw new AppError(409, "A recurring budget already exists for this target");
    }

    const data: Prisma.BudgetUncheckedCreateInput = {
      userId,
      plannedAmount: parseMoney(input.plannedAmount),
      isRecurring,
      categoryId,
      goalId,
    };

    if (!isRecurring) {
      data.month = input.month!;
      data.year = input.year!;
    }

    return formatBudget(await prisma.budget.create({ data }));
  }

  async list(userId: string) {
    const rows = await prisma.budget.findMany({ where: { userId, deletedAt: null }, orderBy: [{ year: "desc" }, { month: "desc" }] });
    return rows.map(formatBudget);
  }

  async getById(userId: string, id: string) {
    const budget = await prisma.budget.findFirst({ where: { id, userId, deletedAt: null } });
    if (!budget) throw new AppError(404, "Budget not found");
    return formatBudget(budget);
  }

  async update(userId: string, id: string, input: UpdateInput) {
    const budget = await prisma.budget.findFirst({ where: { id, userId, deletedAt: null } });
    if (!budget) throw new AppError(404, "Budget not found");

    const categoryId = input.categoryId === undefined ? budget.categoryId : input.categoryId;
    const goalId = input.goalId === undefined ? budget.goalId : input.goalId;

    await this.assertTarget(userId, categoryId, goalId);

    const data: Prisma.BudgetUncheckedUpdateInput = {};
    if (input.plannedAmount !== undefined) data.plannedAmount = parseMoney(input.plannedAmount);
    if (input.isRecurring !== undefined) data.isRecurring = input.isRecurring;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.goalId !== undefined) data.goalId = input.goalId;
    if (input.month !== undefined) data.month = input.month;
    if (input.year !== undefined) data.year = input.year;

    return formatBudget(await prisma.budget.update({ where: { id: budget.id }, data }));
  }

  async remove(userId: string, id: string): Promise<void> {
    const budget = await prisma.budget.findFirst({ where: { id, userId, deletedAt: null } });
    if (!budget) throw new AppError(404, "Budget not found");
    await prisma.budget.update({ where: { id: budget.id }, data: { deletedAt: new Date() } });
  }

  async resolve(userId: string, categoryId: string, month: number, year: number) {
    const override = await prisma.budget.findFirst({
      where: { userId, categoryId, isRecurring: false, month, year, deletedAt: null },
    });
    if (override) return formatBudget(override);

    const recurring = await prisma.budget.findFirst({
      where: { userId, categoryId, isRecurring: true, deletedAt: null },
    });
    if (recurring) return formatBudget(recurring);

    return null;
  }

  async resolveGoal(userId: string, goalId: string, month: number, year: number) {
    const override = await prisma.budget.findFirst({
      where: { userId, goalId, isRecurring: false, month, year, deletedAt: null },
    });
    if (override) return formatBudget(override);

    const recurring = await prisma.budget.findFirst({
      where: { userId, goalId, isRecurring: true, deletedAt: null },
    });
    if (recurring) return formatBudget(recurring);

    return null;
  }
}

export const budgetService = new BudgetService();
