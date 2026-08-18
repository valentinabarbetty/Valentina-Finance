import { Component, Input, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoneyPipe } from '../../pipes/money.pipe';
import { ExpenseByCategory } from '../../models/dashboard.models';

const VISIBLE_LIMIT = 5;

@Component({
  selector: 'app-category-breakdown',
  imports: [RouterLink, MoneyPipe],
  templateUrl: './category-breakdown.html',
  styleUrl: './category-breakdown.scss',
})
export class CategoryBreakdownComponent {
  private readonly _items = signal<ExpenseByCategory[]>([]);

  @Input({ required: true })
  set items(value: ExpenseByCategory[]) {
    this._items.set(value ?? []);
  }

  readonly sorted = computed(() => [...this._items()].sort((a, b) => Number(b.amount) - Number(a.amount)));
  readonly visible = computed(() => this.sorted().slice(0, VISIBLE_LIMIT));
  readonly hasMore = computed(() => this.sorted().length > VISIBLE_LIMIT);
}