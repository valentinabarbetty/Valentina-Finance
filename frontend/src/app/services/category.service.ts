import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, CategoryPayload } from '../models/financial-settings.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly url = `${environment.apiBaseUrl}/api/categories`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Category[]> { return this.http.get<Category[]>(this.url); }
  create(payload: CategoryPayload): Observable<Category> { return this.http.post<Category>(this.url, payload); }
  update(id: string, payload: Partial<CategoryPayload>): Observable<Category> { return this.http.patch<Category>(`${this.url}/${id}`, payload); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
