import { Component, Input } from '@angular/core';
import { MoneyPipe } from '../../pipes/money.pipe';

@Component({
  selector: 'app-financial-overview',
  imports: [MoneyPipe],
  templateUrl: './financial-overview.html',
  styleUrl: './financial-overview.scss',
})
export class FinancialOverviewComponent {
  @Input({ required: true }) currentBalance!: string;
  @Input({ required: true }) totalSavings!: string;
}
