import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { serializeDate } from "./transaction.service.js";

const zero = () => new Prisma.Decimal(0);
const money = (value: Prisma.Decimal | null | undefined) => (value ?? zero()).toFixed(2);
const period = (month: number, year: number) => ({ gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) });
const previousPeriod = (month: number, year: number) => month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
const previousMonths = (month: number, year: number, count: number) => Array.from({ length: count }, (_, index) => {
  const offset = count - index - 1;
  const date = new Date(Date.UTC(year, month - 1 - offset, 1));
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
});

export class DashboardService {
  async summary(userId: string, month: number, year: number) {
    const date = period(month, year);
    const previous = previousPeriod(month, year);
    const trendMonths = previousMonths(month, year, 6);
    const previousDate = period(previous.month, previous.year);
    const currentWhere = { userId, deletedAt: null, date };
    const previousWhere = { userId, deletedAt: null, date: previousDate };
    const allTimeWhere = { userId, deletedAt: null };

    const [
      income, expenses, previousIncome, previousExpenses, expenseCount, incomeCount,
      categoryGroups, recentExpenses, recentIncomes, activeGoals,
      totalIncomeAllTime, totalExpenseAllTime,
    ] = await Promise.all([
      prisma.income.aggregate({ where: currentWhere, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: currentWhere, _sum: { amount: true } }),
      prisma.income.aggregate({ where: previousWhere, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: previousWhere, _sum: { amount: true } }),
      prisma.expense.count({ where: currentWhere }),
      prisma.income.count({ where: currentWhere }),
      prisma.expense.groupBy({ by: ["categoryId"], where: currentWhere, _sum: { amount: true } }),
      prisma.expense.findMany({ where: { userId, deletedAt: null }, include: { category: { select: { id: true, name: true, icon: true, color: true } } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 5 }),
      prisma.income.findMany({ where: { userId, deletedAt: null }, include: { category: { select: { id: true, name: true, icon: true, color: true } } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 5 }),
      prisma.goal.findMany({
        where: { userId, deletedAt: null, status: "ACTIVE" },
        include: {
          subgoals: { where: { deletedAt: null }, include: { contributions: { where: { deletedAt: null } } } },
          contributions: { where: { deletedAt: null } },
        },
      }),
      // NUEVO: totales sin filtro de fecha (histórico completo)
      prisma.income.aggregate({ where: allTimeWhere, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: allTimeWhere, _sum: { amount: true } }),
    ]);

    const categoryIds = categoryGroups.map((group) => group.categoryId);
    const categories = categoryIds.length ? await prisma.category.findMany({ where: { id: { in: categoryIds }, userId, deletedAt: null }, select: { id: true, name: true, icon: true, color: true } }) : [];
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const incomeTotal = income._sum.amount ?? zero();
    const expenseTotal = expenses._sum.amount ?? zero();
    const savings = incomeTotal.minus(expenseTotal);
    const savingsPercentage = incomeTotal.gt(0) ? Number(savings.div(incomeTotal).mul(100).toFixed(2)) : 0;
    const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
    const goal = activeGoals.sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || Number(left.targetDate ?? new Date("9999-12-31")) - Number(right.targetDate ?? new Date("9999-12-31")))[0];
    const nextGoal = goal ? (() => {
      const direct = goal.contributions.filter((contribution) => contribution.subgoalId === null).reduce((total, contribution) => total.plus(contribution.amount), zero());
      const subgoals = goal.subgoals.reduce((total, subgoal) => total.plus(subgoal.contributions.reduce((subtotal, contribution) => subtotal.plus(contribution.amount), zero())), zero());
      const currentAmount = direct.plus(subgoals);
      return { id: goal.id, name: goal.name, icon: goal.icon, color: goal.color, targetAmount: money(goal.targetAmount), currentAmount: money(currentAmount), pendingAmount: money(Prisma.Decimal.max(goal.targetAmount.minus(currentAmount), zero())), percentage: goal.targetAmount.gt(0) ? Math.min(100, Number(currentAmount.div(goal.targetAmount).mul(100).toFixed(2))) : 0, targetDate: goal.targetDate ? serializeDate(goal.targetDate) : null, priority: goal.priority };
    })() : null;

    // NUEVO: total aportado a metas (todas las metas activas del usuario, sumando directas + subgoals)
    const totalGoalContributions = activeGoals.reduce((total, currentGoal) => {
      const direct = currentGoal.contributions.reduce((subtotal, contribution) => subtotal.plus(contribution.amount), zero());
      const subgoals = currentGoal.subgoals.reduce((subtotal, subgoal) => subtotal.plus(subgoal.contributions.reduce((inner, contribution) => inner.plus(contribution.amount), zero())), zero());
      return total.plus(direct).plus(subgoals);
    }, zero());

    const movements = [
      ...recentExpenses.map((expense) => ({ id: expense.id, kind: "EXPENSE" as const, amount: money(expense.amount), date: serializeDate(expense.date), description: expense.description, category: expense.category })),
      ...recentIncomes.map((incomeRecord) => ({ id: incomeRecord.id, kind: "INCOME" as const, amount: money(incomeRecord.amount), date: serializeDate(incomeRecord.date), description: incomeRecord.description, category: incomeRecord.category })),
    ].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 5);
    const monthlyEvolution = await Promise.all(trendMonths.map(async (item) => {
      const monthlyDate = period(item.month, item.year);
      const [monthlyIncome, monthlyExpenses] = await Promise.all([
        prisma.income.aggregate({ where: { userId, deletedAt: null, date: monthlyDate }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, deletedAt: null, date: monthlyDate }, _sum: { amount: true } }),
      ]);
      return { month: item.month, year: item.year, incomeTotal: money(monthlyIncome._sum.amount), expenseTotal: money(monthlyExpenses._sum.amount) };
    }));

    const totalIncomeAllTimeValue = totalIncomeAllTime._sum.amount ?? zero();
    const totalExpenseAllTimeValue = totalExpenseAllTime._sum.amount ?? zero();

    return {
      month, year, incomeTotal: money(incomeTotal), expenseTotal: money(expenseTotal), savingsAmount: money(savings), savingsPercentage,
      expenseCount, incomeCount,
      expensesByCategory: categoryGroups.map((group) => {
        const amount = group._sum.amount ?? zero();
        return { category: categoryMap.get(group.categoryId) ?? null, amount: money(amount), percentage: expenseTotal.gt(0) ? Number(amount.div(expenseTotal).mul(100).toFixed(2)) : 0 };
      }),
      recentTransactions: movements,
      nextGoal,
      previousMonthComparison: { month: previous.month, year: previous.year, incomeTotal: money(previousIncome._sum.amount), expenseTotal: money(previousExpenses._sum.amount), incomeDifference: money(incomeTotal.minus(previousIncome._sum.amount ?? zero())), expenseDifference: money(expenseTotal.minus(previousExpenses._sum.amount ?? zero())) },
      monthlyEvolution,
      // NUEVO: bloque global, NO depende del mes/año consultado
      globalStats: {
        totalIncome: money(totalIncomeAllTimeValue),
        totalExpense: money(totalExpenseAllTimeValue),
        netBalance: money(totalIncomeAllTimeValue.minus(totalExpenseAllTimeValue)),
        totalContributedToGoals: money(totalGoalContributions),
      },
    };
  }
}

export const dashboardService = new DashboardService();