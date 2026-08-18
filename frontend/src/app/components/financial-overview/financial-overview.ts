import { Component, Input } from '@angular/core';
import { MoneyPipe } from '../../pipes/money.pipe';
import { GlobalStats } from '../../models/dashboard.models';

@Component({
  selector: 'app-financial-overview',
  imports: [MoneyPipe],
  templateUrl: './financial-overview.html',
  styleUrl: './financial-overview.scss',
})
export class FinancialOverviewComponent {
  @Input({ required: true }) stats!: GlobalStats;
}