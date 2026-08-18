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

export interface PreviousMonthComparison {
  month: number;
  year: number;
  incomeTotal: string;
  expenseTotal: string;
  incomeDifference: string;
  expenseDifference: string;
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
  incomeTotal: string;
  expenseTotal: string;
  savingsAmount: string;
  savingsPercentage: number;
  expenseCount: number;
  incomeCount: number;
  expensesByCategory: ExpenseByCategory[];
  recentTransactions: RecentMovement[];
  nextGoal: NextGoal | null;
  previousMonthComparison: PreviousMonthComparison;
  monthlyEvolution: MonthlyEvolutionItem[];
  globalStats: GlobalStats;
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

/** Alias para compatibilidad con goal-progress-card.ts, que ya usaba este nombre. */
export type GoalPreview = NextGoal;
export interface GlobalStats {
  totalIncome: string;
  totalExpense: string;
  netBalance: string;
  totalContributedToGoals: string;
}