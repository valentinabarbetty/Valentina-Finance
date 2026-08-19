import { Component, Input } from '@angular/core';
import { MoneyPipe } from '../../pipes/money.pipe';
import { Unallocated } from '../../models/dashboard.models';

@Component({
  selector: 'app-unallocated-card',
  imports: [MoneyPipe],
  templateUrl: './unallocated-card.html',
  styleUrl: './unallocated-card.scss',
})
export class UnallocatedCardComponent {
  @Input({ required: true }) unallocated!: Unallocated;
}
