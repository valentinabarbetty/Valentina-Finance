import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { Category, FinancialTransaction, IncomePayload, ExpensePayload, TransactionFilters, TransactionType } from '../../models/financial-settings.models';
import { CategoryService } from '../../services/category.service';
import { ExpenseService } from '../../services/expense.service';
import { IncomeService } from '../../services/income.service';
import { TransactionTypeService } from '../../services/transaction-type.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav';
import { FabQuickAddComponent } from '../fab-quick-add/fab-quick-add';
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface RecordGroup {
  dateLabel: string;
  items: FinancialTransaction[];
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

@Component({ selector: 'app-transactions-manager', imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, BottomNavComponent, FabQuickAddComponent], templateUrl: './transactions-manager.html', styleUrl: './transactions-manager.scss' })
export class TransactionsManagerComponent implements OnInit {
  private readonly builder = inject(FormBuilder); private readonly categoriesApi = inject(CategoryService); private readonly typesApi = inject(TransactionTypeService); private readonly expenses = inject(ExpenseService); private readonly incomes = inject(IncomeService);
  @Input({ required: true }) kind!: 'expenses' | 'incomes';

  readonly records = signal<FinancialTransaction[]>([]); readonly categories = signal<Category[]>([]);
  readonly formTypes = signal<TransactionType[]>([]); readonly filterTypes = signal<TransactionType[]>([]);
  readonly loading = signal(true); readonly saving = signal(false); readonly formError = signal<string | null>(null); readonly editingId = signal<string | null>(null); readonly formVisible = signal(false);
  readonly isExpense = computed(() => this.kind === 'expenses'); readonly title = computed(() => this.isExpense() ? 'Gastos' : 'Ingresos'); readonly singular = computed(() => this.isExpense() ? 'gasto' : 'ingreso');

  readonly filteredCategories = computed(() => {
    const kind = this.isExpense() ? 'EXPENSE' : 'INCOME';
    return this.categories().filter(c => c.kind === kind);
  });

  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly monthLabel = computed(() => `${MONTH_NAMES[this.selectedMonth() - 1]} ${this.selectedYear()}`);

  readonly toast = signal<Toast | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly filters = this.builder.nonNullable.group({ categoryId: [''], transactionTypeId: [''] });
  readonly form = this.builder.nonNullable.group({ amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]], date: ['', Validators.required], description: ['', Validators.maxLength(500)], notes: ['', Validators.maxLength(500)], categoryId: [''], typeId: [''] });

  readonly groupedRecords = computed<RecordGroup[]>(() => {
    const sorted = [...this.records()].sort((a, b) => b.date.localeCompare(a.date));
    const groups: RecordGroup[] = [];
    for (const item of sorted) {
      const label = this.formatDateLabel(item.date);
      const last = groups[groups.length - 1];
      if (last && last.dateLabel === label) {
        last.items.push(item);
      } else {
        groups.push({ dateLabel: label, items: [item] });
      }
    }
    return groups;
  });

  ngOnInit(): void { this.loadOptions(); this.load(); }

  loadOptions(): void {
    this.categoriesApi.list().subscribe({ next: (items) => this.categories.set(items), error: () => this.showToast('No fue posible cargar categorías.', 'error') });
    const kind = this.isExpense() ? 'EXPENSE' : 'INCOME';
    this.typesApi.list().subscribe({ next: (items) => this.filterTypes.set(items.filter(t => t.kind === kind)), error: () => this.showToast('No fue posible cargar tipos de transacción.', 'error') });
  }

  load(): void {
    this.loading.set(true);
    const request = this.isExpense() ? this.expenses.list(this.filterPayload()) : this.incomes.list(this.filterPayload());
    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (items) => this.records.set(items),
      error: (error) => this.showToast(error.error?.error ?? 'No fue posible cargar los registros.', 'error'),
    });
  }

  prevMonth(): void {
    let month = this.selectedMonth() - 1; let year = this.selectedYear();
    if (month < 1) { month = 12; year -= 1; }
    this.selectedMonth.set(month); this.selectedYear.set(year); this.load();
  }

  nextMonth(): void {
    let month = this.selectedMonth() + 1; let year = this.selectedYear();
    if (month > 12) { month = 1; year += 1; }
    this.selectedMonth.set(month); this.selectedYear.set(year); this.load();
  }

  openCreate(): void { this.editingId.set(null); this.form.reset({ amount: '', date: new Date().toISOString().slice(0, 10), description: '', notes: '', categoryId: '', typeId: '' }); this.formTypes.set([]); this.formVisible.set(true); this.formError.set(null); }
  openEdit(record: FinancialTransaction): void {
    this.editingId.set(record.id);
    const categoryId = record.category?.id ?? '';
    const typeId = record.type?.id ?? '';
    this.form.reset({ amount: record.amount, date: record.date, description: record.description ?? '', notes: record.notes ?? '', categoryId: categoryId, typeId: '' });
    this.formVisible.set(true); this.formError.set(null);
    if (categoryId) {
      this.loadFormTypes(categoryId, () => { this.form.controls.typeId.setValue(typeId); });
    }
  }
  cancel(): void { this.formVisible.set(false); }

  onFormCategoryChange(): void {
    const categoryId = this.form.controls.categoryId.value ?? '';
    this.form.controls.typeId.setValue('');
    this.loadFormTypes(categoryId);
  }

  onFilterCategoryChange(): void {
    const categoryId = this.filters.controls.categoryId.value ?? '';
    this.filters.controls.transactionTypeId.setValue('');
    this.loadFilterTypes(categoryId);
    this.load();
  }

  loadFormTypes(categoryId: string, afterLoad?: () => void): void {
    if (!categoryId) { this.formTypes.set([]); afterLoad?.(); return; }
    this.typesApi.list(categoryId).subscribe({
      next: (items) => { this.formTypes.set(items); afterLoad?.(); },
      error: () => { this.formTypes.set([]); afterLoad?.(); },
    });
  }

  loadFilterTypes(categoryId: string): void {
    if (!categoryId) {
      const kind = this.isExpense() ? 'EXPENSE' : 'INCOME';
      this.typesApi.list().subscribe({
        next: (items) => this.filterTypes.set(items.filter(t => t.kind === kind)),
        error: () => this.filterTypes.set([]),
      });
      return;
    }
    this.typesApi.list(categoryId).subscribe({
      next: (items) => this.filterTypes.set(items),
      error: () => this.filterTypes.set([]),
    });
  }

  save(): void {
    if (this.form.invalid || (this.isExpense() && !this.form.controls.categoryId.value) || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = this.payload(); const id = this.editingId();
    const request = this.isExpense()
      ? (id ? this.expenses.update(id, payload as Partial<ExpensePayload>) : this.expenses.create(payload as ExpensePayload))
      : (id ? this.incomes.update(id, payload as Partial<IncomePayload>) : this.incomes.create(payload as IncomePayload));
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.showToast(id ? 'Cambios guardados.' : `Nuevo ${this.singular()} registrado.`, 'success'); this.formVisible.set(false); this.load(); },
      error: (error) => this.formError.set(error.error?.error ?? 'No fue posible guardar.'),
    });
  }

  remove(record: FinancialTransaction): void {
    if (!window.confirm(`¿Eliminar ${this.singular()}?`)) return;
    const request = this.isExpense() ? this.expenses.remove(record.id) : this.incomes.remove(record.id);
    request.subscribe({
      next: () => { this.showToast(`${this.singular()} eliminado.`, 'success'); this.load(); },
      error: (error) => this.showToast(error.error?.error ?? 'No fue posible eliminar.', 'error'),
    });
  }

  formatAmount(value: string): string {
    const formatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(Number(value));
    return `${this.isExpense() ? '-' : '+'} ${formatted}`;
  }

  private formatDateLabel(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);
    const label = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(parsed);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  private payload(): ExpensePayload | IncomePayload {
    const value = this.form.getRawValue(); const text = (value: string) => value.trim() || null;
    const common = { amount: value.amount, date: value.date, description: text(value.description), notes: text(value.notes), typeId: value.typeId || null };
    return this.isExpense() ? { ...common, categoryId: value.categoryId } : { ...common, categoryId: value.categoryId || null };
  }

  private filterPayload(): TransactionFilters {
    const value = this.filters.getRawValue();
    return { month: this.selectedMonth(), year: this.selectedYear(), categoryId: value.categoryId || undefined, transactionTypeId: value.transactionTypeId || undefined };
  }
}
