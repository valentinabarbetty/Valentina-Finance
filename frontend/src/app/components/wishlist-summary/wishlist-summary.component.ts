import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService, WishlistSummary } from '../../services/wishlist.service';

@Component({
  selector: 'app-wishlist-summary',
  imports: [RouterLink],
  template: `
    @if (summary(); as s) {
      <section class="panel">
        <div class="section-head">
          <h2>Mis compras</h2>
          <a routerLink="/app/wishlist" class="section-link">Ver todas</a>
        </div>
        <div class="wish-card">
          <div class="wish-stats">
            @if (s.pendingCount > 0) {
              <span class="wish-stat">
                <strong>{{ s.pendingCount }}</strong> pendiente{{ s.pendingCount !== 1 ? 's' : '' }}
              </span>
            }
          </div>
          @if (s.pendingEstimatedTotal && s.pendingCount > 0) {
            <p class="wish-amount">Estimado: {{ s.pendingEstimatedTotal }}</p>
          }
        </div>
      </section>
    }
  `,
  styles: `
    .wish-card {
      padding: 0.85rem 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
    }

    .wish-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem 1rem;
    }

    .wish-stat {
      font-size: 0.82rem;
      color: var(--color-text-muted);
      strong { color: var(--color-accent-strong); font-weight: 700; }
    }

    .wish-amount {
      margin: 0.4rem 0 0;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .wish-spent {
      margin: 0.1rem 0 0;
      font-size: 0.72rem;
      color: var(--color-text-muted);
    }
  `,
})
export class WishlistSummaryComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  summary = signal<WishlistSummary | null>(null);

  ngOnInit(): void {
    this.wishlistService.summary().subscribe({
      next: s => this.summary.set(s),
      error: () => {},
    });
  }
}
