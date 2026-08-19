import { Component, Input } from '@angular/core';
import { MoneyPipe } from '../../pipes/money.pipe';
import { BudgetStatusItem } from '../../models/dashboard.models';

@Component({
  selector: 'app-budget-status',
  imports: [MoneyPipe],
  templateUrl: './budget-status.html',
  styleUrl: './budget-status.scss',
})
export class BudgetStatusComponent {
  @Input({ required: true }) budgets: BudgetStatusItem[] = [];

  statusLabel(status: BudgetStatusItem['status']): string {
    return { UNDER_BUDGET: 'Dentro del presupuesto', NEAR_LIMIT: 'Cerca del límite', OVER_BUDGET: 'Excedido' }[status];
  }

  abs(value: string): string {
    return String(Math.abs(Number(value)));
  }
}
