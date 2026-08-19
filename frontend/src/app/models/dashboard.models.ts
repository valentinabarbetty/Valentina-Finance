export interface CategoryRef {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface ExpenseByCategory {
  category: CategoryRef | null;
  amount: string;
  percentage: number;
}

export interface RecentMovement {
  id: string;
  kind: 'EXPENSE' | 'INCOME';
  amount: string;
  date: string;
  description: string | null;
  category: CategoryRef | null;
}

export interface NextGoal {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  targetAmount: string;
  currentAmount: string;
  pendingAmount: string;
  percentage: number;
  targetDate: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type GoalPreview = NextGoal;

export interface BudgetStatusItem {
  category: CategoryRef;
  plannedAmount: string;
  spentAmount: string;
  remainingAmount: string;
  percentage: number;
  status: 'UNDER_BUDGET' | 'NEAR_LIMIT' | 'OVER_BUDGET';
}

export interface Unallocated {
  amount: string;
  status: 'BALANCED' | 'OVER_ALLOCATED';
}

export interface MonthlyFinancials {
  income: string;
  expenses: string;
  savingsContributions: string;
  incomeCount: number;
  expenseCount: number;
}

export interface PreviousMonthComparison {
  month: number;
  year: number;
  income: string;
  expenses: string;
  savingsContributions: string;
  incomeDifference: string;
  expenseDifference: string;
  savingsDifference: string;
}

export interface MonthlyEvolutionItem {
  month: number;
  year: number;
  incomeTotal: string;
  expenseTotal: string;
}

export interface DashboardSummary {
  month: number;
  year: number;

  currentBalance: string;
  totalSavings: string;

  monthly: MonthlyFinancials;

  budgets: BudgetStatusItem[];

  unallocated: Unallocated;

  expensesByCategory: ExpenseByCategory[];
  recentTransactions: RecentMovement[];
  nextGoal: NextGoal | null;
  previousMonthComparison: PreviousMonthComparison;
  monthlyEvolution: MonthlyEvolutionItem[];
}
