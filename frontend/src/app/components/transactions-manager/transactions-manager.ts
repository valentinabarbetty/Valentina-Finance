import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Category, FinancialTransaction, IncomePayload, ExpensePayload, TransactionFilters, TransactionType } from '../../models/financial-settings.models';
import { CategoryService } from '../../services/category.service';
import { ExpenseService } from '../../services/expense.service';
import { IncomeService } from '../../services/income.service';
import { TransactionTypeService } from '../../services/transaction-type.service';

@Component({ selector: 'app-transactions-manager', imports: [ReactiveFormsModule], templateUrl: './transactions-manager.html', styleUrl: './transactions-manager.scss' })
export class TransactionsManagerComponent implements OnInit {
  private readonly builder = inject(FormBuilder); private readonly categoriesApi = inject(CategoryService); private readonly typesApi = inject(TransactionTypeService); private readonly expenses = inject(ExpenseService); private readonly incomes = inject(IncomeService);
  @Input({ required: true }) kind!: 'expenses' | 'incomes';
  readonly records = signal<FinancialTransaction[]>([]); readonly categories = signal<Category[]>([]); readonly types = signal<TransactionType[]>([]);
  readonly loading = signal(true); readonly saving = signal(false); readonly error = signal<string | null>(null); readonly success = signal<string | null>(null); readonly editingId = signal<string | null>(null); readonly formVisible = signal(false);
  readonly isExpense = computed(() => this.kind === 'expenses'); readonly title = computed(() => this.isExpense() ? 'Gastos' : 'Ingresos'); readonly singular = computed(() => this.isExpense() ? 'gasto' : 'ingreso');
  readonly filters = this.builder.nonNullable.group({ month: [''], year: [''], categoryId: [''], transactionTypeId: [''] });
  readonly form = this.builder.nonNullable.group({ amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]], date: ['', Validators.required], description: ['', Validators.maxLength(500)], notes: ['', Validators.maxLength(500)], categoryId: [''], typeId: [''] });
  ngOnInit(): void { this.loadOptions(); this.load(); }
  loadOptions(): void { this.categoriesApi.list().subscribe({ next: (items) => this.categories.set(items), error: () => this.error.set('No fue posible cargar categorías.') }); this.typesApi.list().subscribe({ next: (items) => this.types.set(items), error: () => this.error.set('No fue posible cargar tipos de transacción.') }); }
  load(): void { this.loading.set(true); this.error.set(null); const request = this.isExpense() ? this.expenses.list(this.filterPayload()) : this.incomes.list(this.filterPayload()); request.pipe(finalize(() => this.loading.set(false))).subscribe({ next: (items) => this.records.set(items), error: (error) => this.error.set(error.error?.error ?? 'No fue posible cargar los registros.') }); }
  openCreate(): void { this.editingId.set(null); this.form.reset({ amount: '', date: new Date().toISOString().slice(0, 10), description: '', notes: '', categoryId: '', typeId: '' }); this.formVisible.set(true); this.error.set(null); }
  openEdit(record: FinancialTransaction): void { this.editingId.set(record.id); this.form.reset({ amount: record.amount, date: record.date, description: record.description ?? '', notes: record.notes ?? '', categoryId: record.category?.id ?? '', typeId: record.type?.id ?? '' }); this.formVisible.set(true); this.error.set(null); }
  cancel(): void { this.formVisible.set(false); }
  save(): void { if (this.form.invalid || (this.isExpense() && !this.form.controls.categoryId.value) || this.saving()) { this.form.markAllAsTouched(); return; } this.saving.set(true); const payload = this.payload(); const id = this.editingId(); const request = this.isExpense() ? (id ? this.expenses.update(id, payload as Partial<ExpensePayload>) : this.expenses.create(payload as ExpensePayload)) : (id ? this.incomes.update(id, payload as Partial<IncomePayload>) : this.incomes.create(payload as IncomePayload)); request.pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.success.set(id ? 'Cambios guardados.' : `Nuevo ${this.singular()} registrado.`); this.formVisible.set(false); this.load(); }, error: (error) => this.error.set(error.error?.error ?? 'No fue posible guardar.') }); }
  remove(record: FinancialTransaction): void { if (!window.confirm(`¿Eliminar ${this.singular()}?`)) return; const request = this.isExpense() ? this.expenses.remove(record.id) : this.incomes.remove(record.id); request.subscribe({ next: () => { this.success.set(`${this.singular()} eliminado.`); this.load(); }, error: (error) => this.error.set(error.error?.error ?? 'No fue posible eliminar.') }); }
  formatAmount(value: string): string { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(Number(value)); }
  private payload(): ExpensePayload | IncomePayload { const value = this.form.getRawValue(); const text = (value: string) => value.trim() || null; const common = { amount: value.amount, date: value.date, description: text(value.description), notes: text(value.notes), typeId: value.typeId || null }; return this.isExpense() ? { ...common, categoryId: value.categoryId } : { ...common, categoryId: value.categoryId || null }; }
  private filterPayload(): TransactionFilters { const value = this.filters.getRawValue(); return { month: value.month ? Number(value.month) : undefined, year: value.year ? Number(value.year) : undefined, categoryId: value.categoryId || undefined, transactionTypeId: value.transactionTypeId || undefined }; }
}
