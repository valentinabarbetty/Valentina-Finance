import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TransactionRelation } from '../models/financial-settings.models';

export type WishlistItemStatus = 'PENDING' | 'PURCHASED';

export interface WishlistListSummary {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  pendingCount: number;
  purchasedCount: number;
  pendingEstimatedTotal: string | null;
  purchasedTotal: string | null;
}

export interface WishlistItem {
  id: string;
  listId: string;
  name: string;
  description: string | null;
  estimatedPrice: string | null;
  actualPrice: string | null;
  categoryId: string;
  category: TransactionRelation | null;
  typeId: string | null;
  type: TransactionRelation | null;
  status: WishlistItemStatus;
  purchasedAt: string | null;
  expenseId: string | null;
  expense: { id: string; amount: string | null; date: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistList extends WishlistListSummary {
  items: WishlistItem[];
}

export interface WishlistListPayload {
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface WishlistItemPayload {
  name: string;
  description?: string | null;
  estimatedPrice?: string | null;
  categoryId: string;
  typeId?: string | null;
}

export interface WishlistPurchasePayload {
  actualPrice: string;
  date: string;
  categoryId: string;
  typeId?: string | null;
}

export interface WishlistSummary {
  pendingCount: number;
  pendingEstimatedTotal: string | null;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly url = `${environment.apiBaseUrl}/api/wishlist`;

  constructor(private readonly http: HttpClient) {}

  // Lists
  listLists(): Observable<WishlistListSummary[]> { return this.http.get<WishlistListSummary[]>(`${this.url}/lists`); }
  getOneList(id: string): Observable<WishlistList> { return this.http.get<WishlistList>(`${this.url}/lists/${id}`); }
  createList(payload: WishlistListPayload): Observable<WishlistList> { return this.http.post<WishlistList>(`${this.url}/lists`, payload); }
  updateList(id: string, payload: Partial<WishlistListPayload>): Observable<WishlistList> { return this.http.patch<WishlistList>(`${this.url}/lists/${id}`, payload); }
  removeList(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/lists/${id}`); }

  // Items
  listItems(listId: string): Observable<WishlistItem[]> { return this.http.get<WishlistItem[]>(`${this.url}/lists/${listId}/items`); }
  createItem(listId: string, payload: WishlistItemPayload): Observable<WishlistItem> { return this.http.post<WishlistItem>(`${this.url}/lists/${listId}/items`, payload); }
  updateItem(id: string, payload: Partial<WishlistItemPayload>): Observable<WishlistItem> { return this.http.patch<WishlistItem>(`${this.url}/items/${id}`, payload); }
  removeItem(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/items/${id}`); }

  // Purchase
  purchase(id: string, payload: WishlistPurchasePayload): Observable<WishlistItem> { return this.http.post<WishlistItem>(`${this.url}/items/${id}/purchase`, payload); }

  // Dashboard
  summary(): Observable<WishlistSummary> { return this.http.get<WishlistSummary>(`${this.url}/summary`); }
}
