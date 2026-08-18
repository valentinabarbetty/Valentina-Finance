import { Component, Input, computed, signal } from '@angular/core';
import { MonthlyEvolutionItem } from '../../models/dashboard.models';

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CHART_HEIGHT = 120;

interface ChartBar {
  label: string;
  incomeValue: number;
  expenseValue: number;
  incomeHeight: number;
  expenseHeight: number;
  incomeAmount: string;
  expenseAmount: string;
}

const currency = (value: number) => value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

@Component({
  selector: 'app-evolution-chart',
  imports: [],
  templateUrl: './evolution-chart.html',
  styleUrl: './evolution-chart.scss',
})
export class EvolutionChartComponent {
  private readonly _data = signal<MonthlyEvolutionItem[]>([]);

  @Input({ required: true })
  set data(value: MonthlyEvolutionItem[]) {
    this._data.set(value ?? []);
  }

  readonly bars = computed<ChartBar[]>(() => {
    const items = this._data();
    const max = Math.max(1, ...items.flatMap((item) => [Number(item.incomeTotal), Number(item.expenseTotal)]));
    return items.map((item) => {
      const incomeValue = Number(item.incomeTotal);
      const expenseValue = Number(item.expenseTotal);
      return {
        label: MONTH_SHORT[item.month - 1],
        incomeValue,
        expenseValue,
        incomeHeight: incomeValue > 0 ? Math.max(3, Math.round((incomeValue / max) * CHART_HEIGHT)) : 0,
        expenseHeight: expenseValue > 0 ? Math.max(3, Math.round((expenseValue / max) * CHART_HEIGHT)) : 0,
        incomeAmount: currency(incomeValue),
        expenseAmount: currency(expenseValue),
      };
    });
  });

  readonly hasMovement = computed(() => this.bars().some((bar) => bar.incomeValue > 0 || bar.expenseValue > 0));
}