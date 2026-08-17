import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TransactionType, TransactionTypePayload } from '../models/financial-settings.models';

@Injectable({ providedIn: 'root' })
export class TransactionTypeService {
  private readonly url = `${environment.apiBaseUrl}/api/transaction-types`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<TransactionType[]> { return this.http.get<TransactionType[]>(this.url); }
  create(payload: TransactionTypePayload): Observable<TransactionType> { return this.http.post<TransactionType>(this.url, payload); }
  update(id: string, payload: Partial<TransactionTypePayload>): Observable<TransactionType> { return this.http.patch<TransactionType>(`${this.url}/${id}`, payload); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
