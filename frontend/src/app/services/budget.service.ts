import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Budget {
  id: string;
  userId: string;
  plannedAmount: string;
  isRecurring: boolean;
  month: number | null;
  year: number | null;
  categoryId: string | null;
  goalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPayload {
  plannedAmount: string;
  isRecurring?: boolean;
  month?: number | null;
  year?: number | null;
  categoryId?: string | null;
  goalId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly url = `${environment.apiBaseUrl}/api/budgets`;
  constructor(private readonly http: HttpClient) {}
  list(): Observable<Budget[]> { return this.http.get<Budget[]>(this.url); }
  get(id: string): Observable<Budget> { return this.http.get<Budget>(`${this.url}/${id}`); }
  create(payload: BudgetPayload): Observable<Budget> { return this.http.post<Budget>(this.url, payload); }
  update(id: string, payload: Partial<BudgetPayload>): Observable<Budget> { return this.http.patch<Budget>(`${this.url}/${id}`, payload); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
