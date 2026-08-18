import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoneyPipe } from '../../pipes/money.pipe';
import { RecentMovement } from '../../models/dashboard.models';

@Component({
  selector: 'app-recent-transactions',
  imports: [RouterLink, MoneyPipe],
  templateUrl: './recent-transactions.html',
  styleUrl: './recent-transactions.scss',
})
export class RecentTransactionsComponent {
  @Input({ required: true }) movements: RecentMovement[] = [];

  formatDate(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    const label = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(parsed);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}