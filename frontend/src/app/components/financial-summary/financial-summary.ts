import { Component, Input, computed, signal } from '@angular/core';
import { MoneyPipe } from '../../pipes/money.pipe';
import { DashboardSummary } from '../../models/dashboard.models';

type Direction = 'up' | 'down' | 'flat' | 'new';

interface MetricCard {
  icon: string;
  label: string;
  value: string;
  isMoney: boolean;
  tone: 'income' | 'expense' | 'savings' | 'rate';
  delta: { label: string; direction: Direction } | null;
}

function percentChange(current: number, previous: number): { value: number; direction: Direction } {
  if (previous === 0) {
    return current === 0 ? { value: 0, direction: 'flat' } : { value: 0, direction: 'new' };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: change, direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat' };
}

@Component({
  selector: 'app-financial-summary',
  imports: [MoneyPipe],
  templateUrl: './financial-summary.html',
  styleUrl: './financial-summary.scss',
})
export class FinancialSummaryComponent {
  private readonly _summary = signal<DashboardSummary | null>(null);

  @Input({ required: true })
  set summary(value: DashboardSummary) {
    this._summary.set(value);
  }

  readonly cards = computed<MetricCard[]>(() => {
    const data = this._summary();
    if (!data) return [];

    const income = Number(data.monthly.income);
    const expense = Number(data.monthly.expenses);
    const savings = Number(data.monthly.savingsContributions);
    const prevIncome = Number(data.previousMonthComparison.income);
    const prevExpense = Number(data.previousMonthComparison.expenses);
    const prevSavings = Number(data.previousMonthComparison.savingsContributions);

    const buildDelta = (change: { value: number; direction: Direction }, invert = false) => {
      if (change.direction === 'new') return { label: 'Nuevo este mes', direction: change.direction };
      if (change.direction === 'flat') return { label: 'Igual que el mes anterior', direction: change.direction };
      const isGood = invert ? change.direction === 'down' : change.direction === 'up';
      return {
        label: `${change.direction === 'up' ? '↑' : '↓'} ${Math.abs(change.value)}% vs. mes anterior`,
        direction: (isGood ? 'up' : 'down') as Direction,
      };
    };

    return [
      { icon: '💰', label: 'Ingresos', value: data.monthly.income, isMoney: true, tone: 'income', delta: buildDelta(percentChange(income, prevIncome)) },
      { icon: '💸', label: 'Gastos', value: data.monthly.expenses, isMoney: true, tone: 'expense', delta: buildDelta(percentChange(expense, prevExpense), true) },
      { icon: '💗', label: 'Aportes a ahorro', value: data.monthly.savingsContributions, isMoney: true, tone: 'savings', delta: buildDelta(percentChange(savings, prevSavings)) },
    ];
  });
}
