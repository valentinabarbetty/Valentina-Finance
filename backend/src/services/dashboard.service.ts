import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { budgetService } from "./budget.service.js";
import { serializeDate } from "./transaction.service.js";

const zero = () => new Prisma.Decimal(0);
const money = (value: Prisma.Decimal | null | undefined) => (value ?? zero()).toFixed(2);

function period(month: number, year: number) {
  return { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) };
}

function previousPeriod(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

function previousMonths(month: number, year: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const offset = count - index - 1;
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
  });
}

function budgetStatus(percentage: number): "UNDER_BUDGET" | "NEAR_LIMIT" | "OVER_BUDGET" {
  if (percentage > 100) return "OVER_BUDGET";
  if (percentage > 70) return "NEAR_LIMIT";
  return "UNDER_BUDGET";
}

function unallocatedStatus(amount: Prisma.Decimal): "BALANCED" | "OVER_ALLOCATED" {
  return amount.lt(0) ? "OVER_ALLOCATED" : "BALANCED";
}

export class DashboardService {
  async summary(userId: string, month: number, year: number) {
    const currentMonthDate = period(month, year);
    const previous = previousPeriod(month, year);
    const previousDate = period(previous.month, previous.year);
    const allTimeWhere = { userId, deletedAt: null };

    const [
      user,
      monthlyIncomeAgg,
      monthlyExpenseAgg,
      monthlyGoalContributions,
      allTimeIncomeAgg,
      allTimeExpenseAgg,
      allTimeGoalContributionsAgg,
      categories,
      previousMonthIncomeAgg,
      previousMonthExpenseAgg,
      previousMonthGoalContributionsAgg,
      activeGoals,
      recentExpenses,
      recentIncomes,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { initialBalance: true } }),

      prisma.income.aggregate({
        where: { userId, deletedAt: null, date: currentMonthDate },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.expense.aggregate({
        where: { userId, deletedAt: null, date: currentMonthDate },
        _sum: { amount: true },
        _count: true,
      }),

      prisma.goalContribution.aggregate({
        where: { userId, deletedAt: null, date: currentMonthDate },
        _sum: { amount: true },
      }),

      prisma.income.aggregate({
        where: allTimeWhere,
        _sum: { amount: true },
      }),

      prisma.expense.aggregate({
        where: allTimeWhere,
        _sum: { amount: true },
      }),

      prisma.goalContribution.aggregate({
        where: allTimeWhere,
        _sum: { amount: true },
      }),

      prisma.category.findMany({
        where: { userId, deletedAt: null, kind: "EXPENSE" },
        select: { id: true, name: true, icon: true, color: true },
      }),

      prisma.income.aggregate({
        where: { userId, deletedAt: null, date: previousDate },
        _sum: { amount: true },
      }),

      prisma.expense.aggregate({
        where: { userId, deletedAt: null, date: previousDate },
        _sum: { amount: true },
      }),

      prisma.goalContribution.aggregate({
        where: { userId, deletedAt: null, date: previousDate },
        _sum: { amount: true },
      }),

      prisma.goal.findMany({
        where: { userId, deletedAt: null, status: "ACTIVE" },
        include: {
          subgoals: { where: { deletedAt: null }, include: { contributions: { where: { deletedAt: null } } } },
          contributions: { where: { deletedAt: null } },
        },
      }),

      prisma.expense.findMany({
        where: { userId, deletedAt: null },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          type: { select: { id: true, name: true, kind: true, icon: true, color: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),

      prisma.income.findMany({
        where: { userId, deletedAt: null },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
          type: { select: { id: true, name: true, kind: true, icon: true, color: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

    const initialBalance = user?.initialBalance ?? zero();

    const totalIncomeAllTime = allTimeIncomeAgg._sum.amount ?? zero();
    const totalExpenseAllTime = allTimeExpenseAgg._sum.amount ?? zero();
    const totalGoalContributionsAllTime = allTimeGoalContributionsAgg._sum.amount ?? zero();

    const monthlyIncome = monthlyIncomeAgg._sum.amount ?? zero();
    const monthlyExpenses = monthlyExpenseAgg._sum.amount ?? zero();
    const monthlySavingsContributions = monthlyGoalContributions._sum.amount ?? zero();

    const currentBalance = initialBalance
      .plus(totalIncomeAllTime)
      .minus(totalExpenseAllTime)
      .minus(totalGoalContributionsAllTime);

    const totalSavings = totalGoalContributionsAllTime;

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const budgetStatuses = await Promise.all(
      categories.map(async (category) => {
        const budget = await budgetService.resolve(userId, category.id, month, year);
        if (!budget) return null;

        const spentAgg = await prisma.expense.aggregate({
          where: { userId, deletedAt: null, categoryId: category.id, date: currentMonthDate },
          _sum: { amount: true },
        });
        const spentAmount = spentAgg._sum.amount ?? zero();
        const plannedAmount = new Prisma.Decimal(budget.plannedAmount);
        const remainingAmount = plannedAmount.minus(spentAmount);
        const percentage = plannedAmount.gt(0)
          ? Number(spentAmount.div(plannedAmount).mul(100).toFixed(2))
          : 0;

        return {
          category,
          plannedAmount: budget.plannedAmount,
          spentAmount: money(spentAmount),
          remainingAmount: remainingAmount.toFixed(2),
          percentage,
          status: budgetStatus(percentage),
        };
      })
    );

    const resolvedExpenseBudgets = budgetStatuses.filter(
      (b): b is NonNullable<typeof b> => b !== null
    );

    let plannedExpenseBudgetsTotal = zero();
    for (const entry of resolvedExpenseBudgets) {
      plannedExpenseBudgetsTotal = plannedExpenseBudgetsTotal.plus(new Prisma.Decimal(entry.plannedAmount));
    }

    let plannedGoalSavingsTotal = zero();
    for (const goal of activeGoals) {
      const budget = await budgetService.resolveGoal(userId, goal.id, month, year);
      if (budget) {
        plannedGoalSavingsTotal = plannedGoalSavingsTotal.plus(new Prisma.Decimal(budget.plannedAmount));
      }
    }

    const unallocatedAmount = monthlyIncome.minus(plannedExpenseBudgetsTotal).minus(plannedGoalSavingsTotal);

    const expensesByCategoryRaw = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, deletedAt: null, date: currentMonthDate },
      _sum: { amount: true },
    });

    const expensesByCategory = expensesByCategoryRaw.map((group) => {
      const amount = group._sum.amount ?? zero();
      return {
        category: categoryMap.get(group.categoryId) ?? null,
        amount: money(amount),
        percentage: monthlyExpenses.gt(0) ? Number(amount.div(monthlyExpenses).mul(100).toFixed(2)) : 0,
      };
    });

    const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
    const sortedGoals = [...activeGoals].sort(
      (a, b) => priorityRank[a.priority] - priorityRank[b.priority] ||
        Number(a.targetDate ?? new Date("9999-12-31")) - Number(b.targetDate ?? new Date("9999-12-31"))
    );
    const topGoal = sortedGoals[0] ?? null;

    const nextGoal = topGoal ? (() => {
      const direct = topGoal.contributions
        .filter((c) => c.subgoalId === null)
        .reduce((total, c) => total.plus(c.amount), zero());
      const subgoalAmounts = topGoal.subgoals.reduce(
        (total, sg) => total.plus(sg.contributions.reduce((inner, c) => inner.plus(c.amount), zero())),
        zero()
      );
      const currentAmount = direct.plus(subgoalAmounts);
      return {
        id: topGoal.id,
        name: topGoal.name,
        icon: topGoal.icon,
        color: topGoal.color,
        targetAmount: money(topGoal.targetAmount),
        currentAmount: money(currentAmount),
        pendingAmount: money(Prisma.Decimal.max(topGoal.targetAmount.minus(currentAmount), zero())),
        percentage: topGoal.targetDate
          ? Math.min(100, Number(currentAmount.div(topGoal.targetAmount).mul(100).toFixed(2)))
          : 0,
        targetDate: topGoal.targetDate ? serializeDate(topGoal.targetDate) : null,
        priority: topGoal.priority,
      };
    })() : null;

    const recentTransactions = [
      ...recentExpenses.map((e) => ({
        id: e.id,
        kind: "EXPENSE" as const,
        amount: money(e.amount),
        date: serializeDate(e.date),
        description: e.description,
        category: e.category,
      })),
      ...recentIncomes.map((i) => ({
        id: i.id,
        kind: "INCOME" as const,
        amount: money(i.amount),
        date: serializeDate(i.date),
        description: i.description,
        category: i.category,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    const trendMonths = previousMonths(month, year, 6);
    const monthlyEvolution = await Promise.all(
      trendMonths.map(async (item) => {
        const md = period(item.month, item.year);
        const [mi, me] = await Promise.all([
          prisma.income.aggregate({ where: { userId, deletedAt: null, date: md }, _sum: { amount: true } }),
          prisma.expense.aggregate({ where: { userId, deletedAt: null, date: md }, _sum: { amount: true } }),
        ]);
        return { month: item.month, year: item.year, incomeTotal: money(mi._sum.amount), expenseTotal: money(me._sum.amount) };
      })
    );

    const previousMonthComparison = {
      month: previous.month,
      year: previous.year,
      income: money(previousMonthIncomeAgg._sum.amount),
      expenses: money(previousMonthExpenseAgg._sum.amount),
      savingsContributions: money(previousMonthGoalContributionsAgg._sum.amount),
      incomeDifference: money(monthlyIncome.minus(previousMonthIncomeAgg._sum.amount ?? zero())),
      expenseDifference: money(monthlyExpenses.minus(previousMonthExpenseAgg._sum.amount ?? zero())),
      savingsDifference: money(monthlySavingsContributions.minus(previousMonthGoalContributionsAgg._sum.amount ?? zero())),
    };

    return {
      month,
      year,

      currentBalance: money(currentBalance),
      totalSavings: money(totalSavings),

      monthly: {
        income: money(monthlyIncome),
        expenses: money(monthlyExpenses),
        savingsContributions: money(monthlySavingsContributions),
        incomeCount: monthlyIncomeAgg._count,
        expenseCount: monthlyExpenseAgg._count,
      },

      budgets: resolvedExpenseBudgets,

      unallocated: {
        amount: unallocatedAmount.toFixed(2),
        status: unallocatedStatus(unallocatedAmount),
      },

      expensesByCategory,
      recentTransactions,
      nextGoal,
      previousMonthComparison,
      monthlyEvolution,
    };
  }
}

export const dashboardService = new DashboardService();
