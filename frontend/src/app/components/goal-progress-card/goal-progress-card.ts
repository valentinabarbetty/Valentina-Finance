import { Component, Input } from '@angular/core';
import { GoalPreview } from '../../models/dashboard.models';
import { MoneyPipe } from '../../pipes/money.pipe';

@Component({
  selector: 'app-goal-progress-card',
  imports: [MoneyPipe],
  templateUrl: './goal-progress-card.html',
  styleUrl: './goal-progress-card.scss',
})
export class GoalProgressCardComponent {
  @Input({ required: true }) goal!: GoalPreview;
}