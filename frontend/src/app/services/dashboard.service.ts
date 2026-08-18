import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardSummary } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly url = `${environment.apiBaseUrl}/api/dashboard/summary`;

  constructor(private readonly http: HttpClient) {}

  get(month: number, year: number): Observable<DashboardSummary> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<DashboardSummary>(this.url, { params });
  }
}
