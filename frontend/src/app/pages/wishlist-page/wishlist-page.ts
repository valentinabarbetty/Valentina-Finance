import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  WishlistService, WishlistListSummary, WishlistList, WishlistItem,
  WishlistListPayload, WishlistItemPayload, WishlistPurchasePayload, WishlistItemStatus,
} from '../../services/wishlist.service';
import { Category, TransactionType } from '../../models/financial-settings.models';
import { CategoryService } from '../../services/category.service';
import { TransactionTypeService } from '../../services/transaction-type.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav';
import { ConfirmService } from '../../services/confirm.service';

interface Toast { message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-wishlist-page',
  imports: [ReactiveFormsModule, BottomNavComponent],
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.scss',
})
export class WishlistPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(WishlistService);
  private readonly categoryApi = inject(CategoryService);
  private readonly typeApi = inject(TransactionTypeService);
  private readonly confirm = inject(ConfirmService);

  readonly lists = signal<WishlistListSummary[]>([]);
  readonly selectedList = signal<WishlistList | null>(null);
  readonly loading = signal(true);
  readonly toast = signal<Toast | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly categories = signal<Category[]>([]);
  readonly formTypes = signal<TransactionType[]>([]);

  readonly listEditor = signal(false);
  readonly editingListId = signal<string | null>(null);
  readonly itemEditor = signal(false);
  readonly editingItemId = signal<string | null>(null);
  readonly purchaseEditor = signal(false);
  readonly purchasingItem = signal<WishlistItem | null>(null);

  readonly filterStatus = signal<'all' | WishlistItemStatus>('all');

  readonly filteredItems = computed(() => {
    const list = this.selectedList();
    if (!list) return [];
    const status = this.filterStatus();
    if (status === 'all') return list.items;
    return list.items.filter(i => i.status === status);
  });

  readonly listForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    icon: [''],
  });

  readonly itemForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    estimatedPrice: ['', Validators.pattern(/^\d+(\.\d{1,2})?$/)],
    categoryId: ['', Validators.required],
    typeId: [''],
  });

  readonly purchaseForm = this.fb.nonNullable.group({
    actualPrice: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    date: ['', Validators.required],
    categoryId: ['', Validators.required],
    typeId: [''],
  });

  readonly expenseCategories = computed(() =>
    this.categories().filter(c => c.kind === 'EXPENSE' || c.kind === 'GENERAL')
  );

  ngOnInit(): void {
    this.load();
    this.categoryApi.list().subscribe({ next: cats => this.categories.set(cats) });
  }

  load(): void {
    this.loading.set(true);
    this.api.listLists()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: lists => this.lists.set(lists),
        error: err => this.fail(err),
      });
  }

  openList(id: string): void {
    this.api.getOneList(id).subscribe({
      next: list => this.selectedList.set(list),
      error: err => this.fail(err),
    });
  }

  backToLists(): void {
    this.selectedList.set(null);
    this.filterStatus.set('all');
    this.load();
  }

  // --- List CRUD ---

  openCreateList(): void {
    this.editingListId.set(null);
    this.listForm.reset({ name: '', description: '', icon: '' });
    this.listEditor.set(true);
  }

  openEditList(list: WishlistListSummary): void {
    this.editingListId.set(list.id);
    this.listForm.reset({ name: list.name, description: list.description ?? '', icon: list.icon ?? '' });
    this.listEditor.set(true);
  }

  saveList(): void {
    if (this.listForm.invalid) { this.listForm.markAllAsTouched(); return; }
    const v = this.listForm.getRawValue();
    const payload: WishlistListPayload = { name: v.name, description: v.description.trim() || null, icon: v.icon.trim() || null };
    const id = this.editingListId();
    const req = id ? this.api.updateList(id, payload) : this.api.createList(payload);
    req.subscribe({
      next: (list) => {
        this.listEditor.set(false);
        this.showToast(id ? 'Lista actualizada.' : 'Lista creada.', 'success');
        if (id && this.selectedList()?.id === id) this.openList(id);
        else this.load();
      },
      error: err => this.fail(err),
    });
  }

  async deleteList(list: WishlistListSummary): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Eliminar lista?',
      message: `"${list.name}" y todos sus articulos seran eliminados permanentemente.`,
      confirmLabel: 'Eliminar lista',
    });
    if (!ok) return;
    this.api.removeList(list.id).subscribe({
      next: () => {
        this.selectedList.set(null);
        this.showToast('Lista eliminada.', 'success');
        this.load();
      },
      error: err => this.fail(err),
    });
  }

  // --- Item CRUD ---

  openCreateItem(): void {
    this.editingItemId.set(null);
    this.itemForm.reset({ name: '', description: '', estimatedPrice: '', categoryId: '', typeId: '' });
    this.formTypes.set([]);
    this.itemEditor.set(true);
  }

  openEditItem(item: WishlistItem): void {
    if (item.status === 'PURCHASED') return;
    this.editingItemId.set(item.id);
    this.itemForm.reset({
      name: item.name, description: item.description ?? '',
      estimatedPrice: item.estimatedPrice ?? '', categoryId: item.categoryId, typeId: item.typeId ?? '',
    });
    this.formTypes.set([]);
    if (item.categoryId) this.loadFormTypes(item.categoryId, () => {
      this.itemForm.controls.typeId.setValue(item.typeId ?? '');
    });
    this.itemEditor.set(true);
  }

  saveItem(): void {
    if (this.itemForm.invalid) { this.itemForm.markAllAsTouched(); return; }
    const v = this.itemForm.getRawValue();
    const payload: WishlistItemPayload = {
      name: v.name, description: v.description.trim() || null,
      estimatedPrice: v.estimatedPrice || null, categoryId: v.categoryId, typeId: v.typeId || null,
    };
    const id = this.editingItemId();
    const listId = this.selectedList()?.id;
    if (!listId) return;
    const req = id ? this.api.updateItem(id, payload) : this.api.createItem(listId, payload);
    req.subscribe({
      next: () => {
        this.itemEditor.set(false);
        this.showToast(id ? 'Articulo actualizado.' : 'Articulo agregado.', 'success');
        this.openList(listId);
      },
      error: err => this.fail(err),
    });
  }

  async deleteItem(item: WishlistItem): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Eliminar articulo?',
      message: `"${item.name}" sera eliminado permanentemente.`,
      confirmLabel: 'Eliminar articulo',
    });
    if (!ok) return;
    const listId = this.selectedList()?.id;
    this.api.removeItem(item.id).subscribe({
      next: () => {
        this.showToast('Articulo eliminado.', 'success');
        if (listId) this.openList(listId);
      },
      error: err => this.fail(err),
    });
  }

  // --- Purchase ---

  async openPurchase(item: WishlistItem): Promise<void> {
    if (item.status === 'PURCHASED') return;
    const ok = await this.confirm.ask({
      title: '¿Marcar como comprado?',
      message: `"${item.name}" se convertira en un gasto real.`,
      confirmLabel: 'Si, marcar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;

    this.purchasingItem.set(item);
    this.purchaseForm.reset({
      actualPrice: item.estimatedPrice ?? '',
      date: new Date().toISOString().slice(0, 10),
      categoryId: item.categoryId,
      typeId: item.typeId ?? '',
    });
    this.formTypes.set([]);
    if (item.categoryId) this.loadFormTypes(item.categoryId, () => {
      this.purchaseForm.controls.typeId.setValue(item.typeId ?? '');
    });
    this.purchaseEditor.set(true);
  }

  confirmPurchase(): void {
    if (this.purchaseForm.invalid) { this.purchaseForm.markAllAsTouched(); return; }
    const item = this.purchasingItem();
    if (!item) return;
    const v = this.purchaseForm.getRawValue();
    const payload: WishlistPurchasePayload = {
      actualPrice: v.actualPrice, date: v.date, categoryId: v.categoryId, typeId: v.typeId || null,
    };
    this.api.purchase(item.id, payload).subscribe({
      next: () => {
        this.purchaseEditor.set(false);
        this.showToast('Articulo comprado. Gasto registrado.', 'success');
        this.openList(item.listId);
        this.load();
      },
      error: err => this.fail(err),
    });
  }

  // --- Category -> Type cascading ---

  onItemCategoryChange(): void {
    const categoryId = this.itemForm.controls.categoryId.value ?? '';
    this.itemForm.controls.typeId.setValue('');
    this.loadFormTypes(categoryId);
  }

  onPurchaseCategoryChange(): void {
    const categoryId = this.purchaseForm.controls.categoryId.value ?? '';
    this.purchaseForm.controls.typeId.setValue('');
    this.loadFormTypes(categoryId);
  }

  private loadFormTypes(categoryId: string, afterLoad?: () => void): void {
    if (!categoryId) { this.formTypes.set([]); afterLoad?.(); return; }
    this.typeApi.list(categoryId).subscribe({
      next: items => { this.formTypes.set(items); afterLoad?.(); },
      error: () => { this.formTypes.set([]); afterLoad?.(); },
    });
  }

  // --- Utilities ---

  amount(value: string | null): string {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value));
  }

  formatDate(date: string | null): string {
    if (!date) return '';
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  private fail(err: { error?: { error?: string } }): void {
    this.showToast(err.error?.error ?? 'No fue posible completar la operacion.', 'error');
  }
}
