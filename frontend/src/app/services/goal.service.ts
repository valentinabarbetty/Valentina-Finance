import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

export interface GoalContribution { id: string; goalId: string; subgoalId: string | null; amount: string; date: string; description: string | null; }
export interface Subgoal { id: string; name: string; targetAmount: string; currentAmount: string; pendingAmount: string; priority: Priority; referenceUrl: string | null; icon: string | null; color: string | null; }
export interface Goal {
  id: string; name: string; description: string | null; targetAmount: string; currentAmount: string; pendingAmount: string; percentage: number;
  startDate: string | null; targetDate: string | null; priority: Priority; status: GoalStatus; icon: string | null; color: string | null;
  subgoals: Subgoal[]; contributions: GoalContribution[];
}
export interface GoalPayload { name: string; targetAmount: string; description?: string | null; startDate?: string | null; targetDate?: string | null; priority?: Priority; status?: GoalStatus; icon?: string | null; color?: string | null; }
export interface SubgoalPayload { name: string; targetAmount: string; priority?: Priority; referenceUrl?: string | null; icon?: string | null; color?: string | null; }
export interface ContributionPayload { amount: string; date: string; description?: string | null; subgoalId?: string | null; }

@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly url = `${environment.apiBaseUrl}/api/goals`;
  constructor(private readonly http: HttpClient) {}
  list(): Observable<Goal[]> { return this.http.get<Goal[]>(this.url); }
  get(id: string): Observable<Goal> { return this.http.get<Goal>(`${this.url}/${id}`); }
  create(payload: GoalPayload): Observable<Goal> { return this.http.post<Goal>(this.url, payload); }
  update(id: string, payload: Partial<GoalPayload>): Observable<Goal> { return this.http.patch<Goal>(`${this.url}/${id}`, payload); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
  createSubgoal(goalId: string, payload: SubgoalPayload): Observable<Subgoal> { return this.http.post<Subgoal>(`${this.url}/${goalId}/subgoals`, payload); }
  updateSubgoal(goalId: string, id: string, payload: Partial<SubgoalPayload>): Observable<Subgoal> { return this.http.patch<Subgoal>(`${this.url}/${goalId}/subgoals/${id}`, payload); }
  removeSubgoal(goalId: string, id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${goalId}/subgoals/${id}`); }
  createContribution(goalId: string, payload: ContributionPayload): Observable<GoalContribution> { return this.http.post<GoalContribution>(`${this.url}/${goalId}/contributions`, payload); }
  updateContribution(goalId: string, id: string, payload: Partial<ContributionPayload>): Observable<GoalContribution> { return this.http.patch<GoalContribution>(`${this.url}/${goalId}/contributions/${id}`, payload); }
  removeContribution(goalId: string, id: string): Observable<void> { return this.http.delete<void>(`${this.url}/${goalId}/contributions/${id}`); }
}
