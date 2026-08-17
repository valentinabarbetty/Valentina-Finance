import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { parseDate, parseMoney, serializeDate } from "./transaction.service.js";

const goalInclude = {
  subgoals: { where: { deletedAt: null }, include: { contributions: { where: { deletedAt: null } } } },
  contributions: { where: { deletedAt: null }, include: { subgoal: true } },
} as const;

type GoalWithData = Prisma.GoalGetPayload<{ include: typeof goalInclude }>;
const money = (value: Prisma.Decimal) => value.toFixed(2);
const contributionResponse = (contribution: { amount: Prisma.Decimal; date: Date }) => ({ ...contribution, amount: money(contribution.amount), date: serializeDate(contribution.date) });

const goalResponse = (goal: GoalWithData) => {
  const direct = goal.contributions.filter((item) => item.subgoalId === null).reduce((total, item) => total.plus(item.amount), new Prisma.Decimal(0));
  const fromSubgoals = goal.subgoals.reduce((total, subgoal) => total.plus(subgoal.contributions.reduce((subtotal, item) => subtotal.plus(item.amount), new Prisma.Decimal(0))), new Prisma.Decimal(0));
  const current = direct.plus(fromSubgoals);
  const pending = Prisma.Decimal.max(goal.targetAmount.minus(current), new Prisma.Decimal(0));
  const percentage = goal.targetAmount.gt(0) ? Number(current.div(goal.targetAmount).mul(100).toFixed(2)) : 0;
  return {
    ...goal,
    targetAmount: money(goal.targetAmount), currentAmount: money(current), pendingAmount: money(pending), percentage: Math.min(percentage, 100),
    startDate: goal.startDate ? serializeDate(goal.startDate) : null, targetDate: goal.targetDate ? serializeDate(goal.targetDate) : null,
    subgoals: goal.subgoals.map((subgoal) => {
      const currentAmount = subgoal.contributions.reduce((total, item) => total.plus(item.amount), new Prisma.Decimal(0));
      return { ...subgoal, targetAmount: money(subgoal.targetAmount), currentAmount: money(currentAmount), pendingAmount: money(Prisma.Decimal.max(subgoal.targetAmount.minus(currentAmount), new Prisma.Decimal(0))), contributions: subgoal.contributions.map(contributionResponse) };
    }),
    contributions: goal.contributions.filter((item) => item.subgoalId === null || item.subgoal?.deletedAt === null).map(contributionResponse),
  };
};

export class GoalService {
  private async assertCategory(userId: string, categoryId: string | null | undefined): Promise<void> {
    if (categoryId === undefined || categoryId === null) return;
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId, deletedAt: null } });
    if (!category) throw new AppError(400, "Category must be active and owned by you");
  }

  async get(userId: string, id: string): Promise<GoalWithData> {
    const goal = await prisma.goal.findFirst({ where: { id, userId, deletedAt: null }, include: goalInclude });
    if (!goal) throw new AppError(404, "Goal not found");
    return goal;
  }

  async create(userId: string, input: Record<string, unknown>) {
    await this.assertCategory(userId, input.categoryId as string | null | undefined);
    const data: Prisma.GoalUncheckedCreateInput = { userId, name: input.name as string, targetAmount: parseMoney(input.targetAmount as string) };
    for (const key of ["description", "priority", "status", "categoryId", "icon", "color"] as const) if (input[key] !== undefined) Object.assign(data, { [key]: input[key] });
    for (const key of ["startDate", "targetDate"] as const) if (input[key] !== undefined) Object.assign(data, { [key]: input[key] === null ? null : parseDate(input[key] as string) });
    return goalResponse(await prisma.goal.create({ data, include: goalInclude }));
  }

  async list(userId: string) { return (await prisma.goal.findMany({ where: { userId, deletedAt: null }, include: goalInclude, orderBy: { createdAt: "desc" } })).map(goalResponse); }
  async one(userId: string, id: string) { return goalResponse(await this.get(userId, id)); }

  async update(userId: string, id: string, input: Record<string, unknown>) {
    const goal = await this.get(userId, id);
    await this.assertCategory(userId, input.categoryId as string | null | undefined);
    const data: Prisma.GoalUncheckedUpdateInput = {};
    for (const key of ["name", "description", "priority", "status", "categoryId", "icon", "color"] as const) if (input[key] !== undefined) Object.assign(data, { [key]: input[key] });
    if (input.targetAmount !== undefined) data.targetAmount = parseMoney(input.targetAmount as string);
    for (const key of ["startDate", "targetDate"] as const) if (input[key] !== undefined) Object.assign(data, { [key]: input[key] === null ? null : parseDate(input[key] as string) });
    return goalResponse(await prisma.goal.update({ where: { id: goal.id }, data, include: goalInclude }));
  }

  async remove(userId: string, id: string): Promise<void> { const goal = await this.get(userId, id); await prisma.goal.update({ where: { id: goal.id }, data: { deletedAt: new Date() } }); }

  async subgoal(userId: string, goalId: string, id: string) {
    await this.get(userId, goalId);
    const subgoal = await prisma.subgoal.findFirst({ where: { id, goalId, userId, deletedAt: null }, include: { contributions: { where: { deletedAt: null } } } });
    if (!subgoal) throw new AppError(404, "Subgoal not found");
    return subgoal;
  }

  async listSubgoals(userId: string, goalId: string) { return goalResponse(await this.get(userId, goalId)).subgoals; }
  async createSubgoal(userId: string, goalId: string, input: Record<string, unknown>) {
    await this.get(userId, goalId);
    const data: Prisma.SubgoalUncheckedCreateInput = { userId, goalId, name: input.name as string, targetAmount: parseMoney(input.targetAmount as string) };
    for (const key of ["priority", "referenceUrl", "icon", "color"] as const) if (input[key] !== undefined) Object.assign(data, { [key]: input[key] });
    return prisma.subgoal.create({ data });
  }
  async updateSubgoal(userId: string, goalId: string, id: string, input: Record<string, unknown>) {
    const subgoal = await this.subgoal(userId, goalId, id); const data: Prisma.SubgoalUncheckedUpdateInput = {};
    for (const key of ["name", "priority", "referenceUrl", "icon", "color"] as const) if (input[key] !== undefined) Object.assign(data, { [key]: input[key] });
    if (input.targetAmount !== undefined) data.targetAmount = parseMoney(input.targetAmount as string);
    return prisma.subgoal.update({ where: { id: subgoal.id }, data });
  }
  async removeSubgoal(userId: string, goalId: string, id: string): Promise<void> { const subgoal = await this.subgoal(userId, goalId, id); await prisma.subgoal.update({ where: { id: subgoal.id }, data: { deletedAt: new Date() } }); }

  async contribution(userId: string, goalId: string, id: string) {
    await this.get(userId, goalId);
    const contribution = await prisma.goalContribution.findFirst({ where: { id, goalId, userId, deletedAt: null } });
    if (!contribution) throw new AppError(404, "Contribution not found");
    return contribution;
  }
  private async assertSubgoal(userId: string, goalId: string, subgoalId: string | null | undefined): Promise<void> { if (subgoalId !== undefined && subgoalId !== null) await this.subgoal(userId, goalId, subgoalId); }
  async listContributions(userId: string, goalId: string) { return goalResponse(await this.get(userId, goalId)).contributions; }
  async createContribution(userId: string, goalId: string, input: Record<string, unknown>) {
    await this.get(userId, goalId); await this.assertSubgoal(userId, goalId, input.subgoalId as string | null | undefined);
    const data: Prisma.GoalContributionUncheckedCreateInput = { userId, goalId, amount: parseMoney(input.amount as string), date: parseDate(input.date as string) };
    if (input.subgoalId !== undefined) data.subgoalId = input.subgoalId as string | null;
    if (input.description !== undefined) data.description = input.description as string | null;
    return contributionResponse(await prisma.goalContribution.create({ data }));
  }
  async updateContribution(userId: string, goalId: string, id: string, input: Record<string, unknown>) {
    const contribution = await this.contribution(userId, goalId, id); const subgoalId = input.subgoalId === undefined ? contribution.subgoalId : input.subgoalId as string | null;
    await this.assertSubgoal(userId, goalId, subgoalId);
    const data: Prisma.GoalContributionUncheckedUpdateInput = {};
    if (input.amount !== undefined) data.amount = parseMoney(input.amount as string);
    if (input.date !== undefined) data.date = parseDate(input.date as string);
    if (input.subgoalId !== undefined) data.subgoalId = input.subgoalId as string | null;
    if (input.description !== undefined) data.description = input.description as string | null;
    return contributionResponse(await prisma.goalContribution.update({ where: { id: contribution.id }, data }));
  }
  async removeContribution(userId: string, goalId: string, id: string): Promise<void> { const contribution = await this.contribution(userId, goalId, id); await prisma.goalContribution.update({ where: { id: contribution.id }, data: { deletedAt: new Date() } }); }
}

export const goalService = new GoalService();
