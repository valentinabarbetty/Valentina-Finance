import { Component, Input } from '@angular/core';
import { MoneyPipe } from '../../pipes/money.pipe';
import { PreviousMonthComparison } from '../../models/dashboard.models';

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-month-comparison',
  imports: [MoneyPipe],
  templateUrl: './month-comparison.html',
  styleUrl: './month-comparison.scss',
})
export class MonthComparisonComponent {
  @Input({ required: true }) comparison!: PreviousMonthComparison;

  get monthName(): string {
    return MONTH_SHORT[this.comparison.month - 1] ?? '';
  }

  diffSign(value: string): string {
    const n = Number(value);
    if (n > 0) return '+';
    return '';
  }

  diffClass(value: string): string {
    return Number(value) >= 0 ? 'positive' : 'negative';
  }
}
