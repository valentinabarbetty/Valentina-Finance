import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FinancialTransaction, IncomePayload, TransactionFilters } from '../models/financial-settings.models';

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private readonly url = `${environment.apiBaseUrl}/api/incomes`;
  constructor(private readonly http: HttpClient) {}
  list(filters: TransactionFilters = {}): Observable<FinancialTransaction[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params = params.set(key, String(value));
    return this.http.get<FinancialTransaction[]>(this.url, { params });
  }
  create(payload: IncomePayload): Observable<FinancialTransaction> { return this.http.post<FinancialTransaction>(this.url, payload); }
  update(id: string, payload: Partial<IncomePayload>): Observable<FinancialTransaction> { return this.http.patch<FinancialTransaction>(`${this.url}/${id}`, payload); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
