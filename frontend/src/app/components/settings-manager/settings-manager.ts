import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { TransactionTypeService } from '../../services/transaction-type.service';
import { Category, CategoryKind, CategoryPayload, TransactionKind, TransactionType, TransactionTypePayload } from '../../models/financial-settings.models';

type ManagedRecord = Category | TransactionType;
type ManagerKind = 'categories' | 'transaction-types';

@Component({
  selector: 'app-settings-manager',
  imports: [ReactiveFormsModule],
  templateUrl: './settings-manager.html',
  styleUrl: './settings-manager.scss',
})
export class SettingsManagerComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categories = inject(CategoryService);
  private readonly transactionTypes = inject(TransactionTypeService);

  @Input({ required: true }) manager!: ManagerKind;

  readonly records = signal<ManagedRecord[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly formVisible = signal(false);
  readonly isTransactionType = computed(() => this.manager === 'transaction-types');
  readonly title = computed(() => this.isTransactionType() ? 'Tipos de transacción' : 'Categorías');
  readonly singular = computed(() => this.isTransactionType() ? 'tipo de transacción' : 'categoría');
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    icon: ['', Validators.maxLength(100)],
    color: ['', Validators.maxLength(32)],
    kind: ['GENERAL'],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const request = this.isTransactionType() ? this.transactionTypes.list() : this.categories.list();
    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (records) => this.records.set(records),
      error: (error) => this.error.set(error.error?.error ?? 'No fue posible cargar los datos.'),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', icon: '', color: '', kind: this.isTransactionType() ? 'EXPENSE' : 'GENERAL' });
    this.error.set(null);
    this.success.set(null);
    this.formVisible.set(true);
  }

  openEdit(record: ManagedRecord): void {
    this.editingId.set(record.id);
    this.form.reset({ name: record.name, description: record.description ?? '', icon: record.icon ?? '', color: record.color ?? '', kind: record.kind });
    this.error.set(null);
    this.success.set(null);
    this.formVisible.set(true);
  }

  cancel(): void { this.formVisible.set(false); this.form.reset(); }

  save(): void {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);
    const payload = this.payload();
    const id = this.editingId();
    const request = this.isTransactionType()
      ? (id ? this.transactionTypes.update(id, payload as Partial<TransactionTypePayload>) : this.transactionTypes.create(payload as TransactionTypePayload))
      : (id ? this.categories.update(id, payload as Partial<CategoryPayload>) : this.categories.create(payload as CategoryPayload));

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.success.set(id ? 'Cambios guardados correctamente.' : `Nueva ${this.singular()} creada correctamente.`);
        this.formVisible.set(false);
        this.load();
      },
      error: (error) => this.error.set(error.error?.error ?? 'No fue posible guardar los cambios.'),
    });
  }

  remove(record: ManagedRecord): void {
    if (!window.confirm(`¿Eliminar ${this.singular()} “${record.name}”?`)) return;
    this.error.set(null);
    const request = this.isTransactionType() ? this.transactionTypes.remove(record.id) : this.categories.remove(record.id);
    request.subscribe({
      next: () => { this.success.set(`${this.singular().replace(/^./, (letter) => letter.toUpperCase())} eliminada correctamente.`); this.load(); },
      error: (error) => this.error.set(error.error?.error ?? 'No fue posible eliminar el registro.'),
    });
  }

  private payload(): CategoryPayload | TransactionTypePayload {
    const value = this.form.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    const common = { name: value.name.trim(), description: optional(value.description), icon: optional(value.icon), color: optional(value.color) };
    return this.isTransactionType()
      ? { ...common, kind: value.kind as TransactionKind }
      : { ...common, kind: value.kind as CategoryKind };
  }
}
