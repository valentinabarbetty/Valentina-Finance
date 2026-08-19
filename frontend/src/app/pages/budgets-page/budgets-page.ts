import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Budget, BudgetPayload, BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { Goal, GoalService } from '../../services/goal.service';
import { Category } from '../../models/financial-settings.models';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav';
import { MoneyPipe } from '../../pipes/money.pipe';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-budgets-page',
  imports: [ReactiveFormsModule, BottomNavComponent, MoneyPipe],
  templateUrl: './budgets-page.html',
  styleUrl: './budgets-page.scss',
})
export class BudgetsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly budgetApi = inject(BudgetService);
  private readonly categoryApi = inject(CategoryService);
  private readonly goalApi = inject(GoalService);
  private readonly confirm = inject(ConfirmService);

  readonly budgets = signal<Budget[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly goals = signal<Goal[]>([]);
  readonly loading = signal(true);
  readonly toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly now = signal(new Date());

  readonly currentMonth = computed(() => this.now().getMonth() + 1);
  readonly currentYear = computed(() => this.now().getFullYear());

  readonly monthLabel = computed(() => {
    const d = new Date(this.currentYear(), this.currentMonth() - 1);
    return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  });

  readonly expenseBudgets = computed(() =>
    this.budgets().filter(b => b.categoryId !== null)
  );

  readonly goalBudgets = computed(() =>
    this.budgets().filter(b => b.goalId !== null)
  );

  readonly recurringBudgets = computed(() =>
    this.budgets().filter(b => b.isRecurring)
  );

  readonly oneTimeBudgets = computed(() =>
    this.budgets().filter(b => !b.isRecurring)
  );

  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly mode = signal<'expense' | 'goal'>('expense');

  readonly form = this.fb.nonNullable.group({
    categoryId: [''],
    goalId: [''],
    plannedAmount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    isRecurring: [false],
    month: [this.currentMonth()],
    year: [this.currentYear()],
  });

  readonly categoriesForSelect = computed(() =>
    this.categories().filter(c => c.kind === 'EXPENSE' || c.kind === 'GENERAL')
  );

  readonly goalsForSelect = computed(() =>
    this.goals().filter(g => g.status === 'ACTIVE')
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.budgetApi.list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (budgets) => this.budgets.set(budgets),
        error: (err) => this.fail(err),
      });
    this.categoryApi.list().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {},
    });
    this.goalApi.list().subscribe({
      next: (goals) => this.goals.set(goals),
      error: () => {},
    });
  }

  prevMonth(): void {
    const d = new Date(this.currentYear(), this.currentMonth() - 2, 1);
    this.now.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentYear(), this.currentMonth(), 1);
    this.now.set(d);
  }

  openCreate(type: 'expense' | 'goal'): void {
    this.mode.set(type);
    this.editingId.set(null);
    this.form.reset({
      categoryId: '',
      goalId: '',
      plannedAmount: '',
      isRecurring: false,
      month: this.currentMonth(),
      year: this.currentYear(),
    });
    this.editorOpen.set(true);
  }

  openEdit(budget: Budget): void {
    this.mode.set(budget.categoryId ? 'expense' : 'goal');
    this.editingId.set(budget.id);
    this.form.reset({
      categoryId: budget.categoryId ?? '',
      goalId: budget.goalId ?? '',
      plannedAmount: budget.plannedAmount,
      isRecurring: budget.isRecurring,
      month: budget.month ?? this.currentMonth(),
      year: budget.year ?? this.currentYear(),
    });
    this.editorOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: BudgetPayload = {
      plannedAmount: v.plannedAmount,
      isRecurring: v.isRecurring,
      month: v.isRecurring ? null : v.month,
      year: v.isRecurring ? null : v.year,
      categoryId: this.mode() === 'expense' ? v.categoryId || null : null,
      goalId: this.mode() === 'goal' ? v.goalId || null : null,
    };

    const id = this.editingId();
    const req = id
      ? this.budgetApi.update(id, payload)
      : this.budgetApi.create(payload);

    req.subscribe({
      next: () => {
        this.editorOpen.set(false);
        this.showToast(id ? 'Presupuesto actualizado.' : 'Presupuesto creado.', 'success');
        this.load();
      },
      error: (err) => this.fail(err),
    });
  }

  async deleteBudget(budget: Budget): Promise<void> {
    const name = this.targetName(budget);
    const ok = await this.confirm.ask({
      title: '¿Eliminar presupuesto?',
      message: `El presupuesto de "${name}" será eliminado permanentemente.`,
      confirmLabel: 'Eliminar presupuesto',
    });
    if (!ok) return;
    this.budgetApi.remove(budget.id).subscribe({
      next: () => {
        this.showToast('Presupuesto eliminado.', 'success');
        this.load();
      },
      error: (err) => this.fail(err),
    });
  }

  targetName(budget: Budget): string {
    if (budget.categoryId) {
      return this.categories().find(c => c.id === budget.categoryId)?.name ?? 'Sin categoría';
    }
    if (budget.goalId) {
      return this.goals().find(g => g.id === budget.goalId)?.name ?? 'Sin meta';
    }
    return 'Sin asignar';
  }

  targetIcon(budget: Budget): string {
    if (budget.categoryId) {
      return this.categories().find(c => c.id === budget.categoryId)?.icon ?? '📂';
    }
    if (budget.goalId) {
      return this.goals().find(g => g.id === budget.goalId)?.icon ?? '🎯';
    }
    return '📌';
  }

  label(budget: Budget): string {
    if (budget.isRecurring) return 'Recurrente';
    return `${budget.month}/${budget.year}`;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  private fail(err: { error?: { error?: string } }): void {
    this.showToast(err.error?.error ?? 'No fue posible completar la operación.', 'error');
  }
}
