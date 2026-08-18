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

    const income = Number(data.incomeTotal);
    const expense = Number(data.expenseTotal);
    const savings = Number(data.savingsAmount);
    const prevIncome = Number(data.previousMonthComparison.incomeTotal);
    const prevExpense = Number(data.previousMonthComparison.expenseTotal);
    const prevSavings = prevIncome - prevExpense;
    const prevSavingsRate = prevIncome > 0 ? (prevSavings / prevIncome) * 100 : 0;

    const buildDelta = (change: { value: number; direction: Direction }, invert = false) => {
      if (change.direction === 'new') return { label: 'Nuevo este mes', direction: change.direction };
      if (change.direction === 'flat') return { label: 'Igual que el mes anterior', direction: change.direction };
      const isGood = invert ? change.direction === 'down' : change.direction === 'up';
      return {
        label: `${change.direction === 'up' ? '↑' : '↓'} ${Math.abs(change.value)}% vs. mes anterior`,
        direction: (isGood ? 'up' : 'down') as Direction,
      };
    };

    const rateDelta = Math.round(data.savingsPercentage - prevSavingsRate);

    return [
      { icon: '💰', label: 'Ingresos', value: data.incomeTotal, isMoney: true, tone: 'income', delta: buildDelta(percentChange(income, prevIncome)) },
      { icon: '💸', label: 'Gastos', value: data.expenseTotal, isMoney: true, tone: 'expense', delta: buildDelta(percentChange(expense, prevExpense), true) },
      { icon: '💗', label: 'Ahorrado', value: data.savingsAmount, isMoney: true, tone: 'savings', delta: buildDelta(percentChange(savings, prevSavings)) },
      {
        icon: '📊',
        label: 'Tasa de ahorro',
        value: `${data.savingsPercentage}%`,
        isMoney: false,
        tone: 'rate',
        delta: prevIncome > 0
          ? { label: `${rateDelta >= 0 ? '↑' : '↓'} ${Math.abs(rateDelta)} pts vs. mes anterior`, direction: rateDelta >= 0 ? 'up' : 'down' }
          : null,
      },
    ];
  });
}