import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize, switchMap } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { TransactionTypeService } from '../../services/transaction-type.service';
import { Category, CategoryKind, CategoryPayload, TransactionType, TransactionTypePayload } from '../../models/financial-settings.models';
import { BottomNavComponent } from '../bottom-nav/bottom-nav';
import { ConfirmService } from '../../services/confirm.service';

interface CategoryWithType extends Category {
  types: TransactionType[];
  typesLoading: boolean;
  expanded: boolean;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

type EditorMode = 'category-create' | 'category-edit' | 'type-create' | 'type-edit';

const KIND_LABELS: Record<CategoryKind, string> = {
  EXPENSE: 'Gastos',
  INCOME: 'Ingresos',
  GENERAL: 'General',
};

@Component({
  selector: 'app-settings-manager',
  imports: [ReactiveFormsModule, BottomNavComponent],
  templateUrl: './settings-manager.html',
  styleUrl: './settings-manager.scss',
})
export class SettingsManagerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly typeService = inject(TransactionTypeService);
  private readonly confirm = inject(ConfirmService);

  readonly categories = signal<CategoryWithType[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly toast = signal<Toast | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly editorMode = signal<EditorMode | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly parentCategoryId = signal<string | null>(null);

  readonly isCategoryEditor = computed(() => {
    const mode = this.editorMode();
    return mode === 'category-create' || mode === 'category-edit';
  });

  readonly editorTitle = computed(() => {
    const mode = this.editorMode();
    if (mode === 'category-create') return 'Crear categoría';
    if (mode === 'category-edit') return 'Editar categoría';
    if (mode === 'type-create') return 'Crear tipo de transacción';
    if (mode === 'type-edit') return 'Editar tipo de transacción';
    return '';
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    icon: ['', Validators.maxLength(100)],
    color: ['', Validators.maxLength(32)],
    kind: ['GENERAL' as CategoryKind],
  });

  readonly groupedCategories = computed(() => {
    const cats = this.categories();
    const groups: { kind: CategoryKind; label: string; items: CategoryWithType[] }[] = [];
    for (const kind of ['EXPENSE', 'INCOME', 'GENERAL'] as CategoryKind[]) {
      const items = cats.filter(c => c.kind === kind);
      if (items.length > 0) {
        groups.push({ kind, label: KIND_LABELS[kind], items });
      }
    }
    return groups;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.categoryService.list().pipe(
      switchMap(cats => {
        if (cats.length === 0) return [];
        const calls = cats.map(cat =>
          this.typeService.list(cat.id).pipe(
            switchMap(types => [this.buildCategoryWithType(cat, types)]),
          ),
        );
        return forkJoin(calls);
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (result) => {
        this.categories.set(result);
      },
      error: (err) => this.showToast(err.error?.error ?? 'No fue posible cargar los datos.', 'error'),
    });
  }

  private buildCategoryWithType(cat: Category, types: TransactionType[]): CategoryWithType {
    return { ...cat, types, typesLoading: false, expanded: false };
  }

  toggleCategory(catId: string): void {
    this.categories.update(cats => cats.map(c => c.id === catId ? { ...c, expanded: !c.expanded } : c));
  }

  openCreateCategory(): void {
    this.editingId.set(null);
    this.parentCategoryId.set(null);
    this.editorMode.set('category-create');
    this.form.reset({ name: '', description: '', icon: '', color: '', kind: 'GENERAL' });
    this.formError.set(null);
  }

  openEditCategory(category: CategoryWithType): void {
    this.editingId.set(category.id);
    this.parentCategoryId.set(null);
    this.editorMode.set('category-edit');
    this.form.reset({ name: category.name, description: category.description ?? '', icon: category.icon ?? '', color: category.color ?? '', kind: category.kind });
    this.formError.set(null);
  }

  openCreateType(category: CategoryWithType): void {
    this.editingId.set(null);
    this.parentCategoryId.set(category.id);
    this.editorMode.set('type-create');
    this.form.reset({ name: '', description: '', icon: '', color: '', kind: category.kind });
    this.formError.set(null);
  }

  openEditType(type: TransactionType): void {
    this.editingId.set(type.id);
    this.parentCategoryId.set(type.categoryId);
    this.editorMode.set('type-edit');
    this.form.reset({ name: type.name, description: type.description ?? '', icon: type.icon ?? '', color: type.color ?? '', kind: type.kind });
    this.formError.set(null);
  }

  cancel(): void {
    this.editorMode.set(null);
    this.editingId.set(null);
    this.parentCategoryId.set(null);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    const mode = this.editorMode()!;
    const id = this.editingId();
    const value = this.form.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    const name = value.name.trim();

    if (mode === 'category-create' || mode === 'category-edit') {
      const payload: CategoryPayload = {
        name,
        description: optional(value.description),
        icon: optional(value.icon),
        color: optional(value.color),
        kind: value.kind as CategoryKind,
      };

      const request = id
        ? this.categoryService.update(id, payload)
        : this.categoryService.create(payload);

      request.pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => {
          this.showToast(id ? 'Categoría actualizada.' : 'Categoría creada.', 'success');
          this.cancel();
          this.load();
        },
        error: (err) => this.formError.set(err.error?.error ?? 'No fue posible guardar la categoría.'),
      });
    } else {
      const catId = this.parentCategoryId()!;
      const category = this.categories().find(c => c.id === catId);
      const payload: TransactionTypePayload = {
        name,
        description: optional(value.description),
        icon: optional(value.icon),
        color: optional(value.color),
        kind: (category?.kind ?? value.kind) as 'INCOME' | 'EXPENSE',
        categoryId: catId,
      };

      const request = id
        ? this.typeService.update(id, { name: payload.name, description: payload.description, icon: payload.icon, color: payload.color })
        : this.typeService.create(payload);

      request.pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => {
          this.showToast(id ? 'Tipo actualizado.' : 'Tipo creado.', 'success');
          this.cancel();
          this.load();
        },
        error: (err) => this.formError.set(err.error?.error ?? 'No fue posible guardar el tipo de transacción.'),
      });
    }
  }

  async removeCategory(category: CategoryWithType): Promise<void> {
    const hasTypes = category.types.length > 0;
    const message = hasTypes
      ? `"${category.name}" tiene ${category.types.length} tipo${category.types.length !== 1 ? 's' : ''} asociado${category.types.length !== 1 ? 's' : ''}. Al eliminarla, también se eliminarán todos sus tipos.`
      : `"${category.name}" será eliminada permanentemente.`;

    const ok = await this.confirm.ask({
      title: '¿Eliminar categoría?',
      message,
      confirmLabel: 'Eliminar categoría',
    });
    if (!ok) return;

    this.categoryService.remove(category.id).subscribe({
      next: () => {
        this.showToast('Categoría eliminada.', 'success');
        this.load();
      },
      error: (err) => this.showToast(err.error?.error ?? 'No fue posible eliminar la categoría.', 'error'),
    });
  }

  async removeType(type: TransactionType): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Eliminar tipo?',
      message: `"${type.name}" será eliminado permanentemente.`,
      confirmLabel: 'Eliminar tipo',
    });
    if (!ok) return;

    this.typeService.remove(type.id).subscribe({
      next: () => {
        this.showToast('Tipo eliminado.', 'success');
        this.load();
      },
      error: (err) => this.showToast(err.error?.error ?? 'No fue posible eliminar el tipo.', 'error'),
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }
}
