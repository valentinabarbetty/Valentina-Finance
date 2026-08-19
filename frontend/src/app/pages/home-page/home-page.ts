import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../../core/auth.service";
import { DashboardService } from "../../services/dashboard.service";
import { DashboardSummary } from "../../models/dashboard.models";
import { BottomNavComponent } from "../../components/bottom-nav/bottom-nav";
import { FabQuickAddComponent } from "../../components/fab-quick-add/fab-quick-add";
import { GoalProgressCardComponent } from "../../components/goal-progress-card/goal-progress-card";
import { FinancialSummaryComponent } from "../../components/financial-summary/financial-summary";
import { EvolutionChartComponent } from "../../components/evolution-chart/evolution-chart";
import { CategoryBreakdownComponent } from "../../components/category-breakdown/category-breakdown";
import { RecentTransactionsComponent } from "../../components/recent-transactions/recent-transactions";
import { FinancialOverviewComponent } from "../../components/financial-overview/financial-overview";
import { BudgetStatusComponent } from "../../components/budget-status/budget-status";
import { UnallocatedCardComponent } from "../../components/unallocated-card/unallocated-card";
import { MonthComparisonComponent } from "../../components/month-comparison/month-comparison";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

@Component({
  selector: "app-home-page",
  imports: [
    RouterLink,
    BottomNavComponent,
    FabQuickAddComponent,
    GoalProgressCardComponent,
    FinancialSummaryComponent,
    EvolutionChartComponent,
    CategoryBreakdownComponent,
    RecentTransactionsComponent,
    FinancialOverviewComponent,
    BudgetStatusComponent,
    UnallocatedCardComponent,
    MonthComparisonComponent,
  ],
  templateUrl: "./home-page.html",
  styleUrl: "./home-page.scss",
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly displayName = computed(() => this.user()?.email?.split("@")[0] ?? "");

  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly monthLabel = computed(() => `${MONTH_NAMES[this.selectedMonth() - 1]} ${this.selectedYear()}`);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.summary.set(await firstValueFrom(this.dashboardService.get(this.selectedMonth(), this.selectedYear())));
    } catch {
      this.error.set("No pudimos cargar tu resumen del mes. Intenta de nuevo.");
    } finally {
      this.loading.set(false);
    }
  }

  prevMonth(): void {
    let month = this.selectedMonth() - 1;
    let year = this.selectedYear();
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    this.selectedMonth.set(month);
    this.selectedYear.set(year);
    this.load();
  }

  nextMonth(): void {
    let month = this.selectedMonth() + 1;
    let year = this.selectedYear();
    if (month > 12) {
      month = 1;
      year += 1;
    }
    this.selectedMonth.set(month);
    this.selectedYear.set(year);
    this.load();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/login");
  }
}
