import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WorkDay, WorkTimeSettings, WeekSummary } from '../models/work-time-planner.model';

@Injectable({
  providedIn: 'root',
})
export class WorkTimePlannerHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/WorkTimePlanner`;

    getWorkDays(startDate: string, endDate: string): Observable<WorkDay[]> {
        return this.http.get<WorkDay[]>(`${this.apiUrl}?startDate=${startDate}&endDate=${endDate}`);
    }

    createWorkDay(data: Partial<WorkDay>): Observable<WorkDay> {
        return this.http.post<WorkDay>(this.apiUrl, data);
    }

    updateWorkDay(id: string, data: Partial<WorkDay>): Observable<WorkDay> {
        return this.http.put<WorkDay>(`${this.apiUrl}/${id}`, data);
    }

    getWeekSummary(year: number, weekNumber: number): Observable<WeekSummary | null> {
        return this.http.get<WeekSummary | null>(`${this.apiUrl}/week-summary?year=${year}&weekNumber=${weekNumber}`);
    }

    saveWeekSummary(summary: WeekSummary): Observable<WeekSummary> {
        return this.http.post<WeekSummary>(`${this.apiUrl}/week-summary`, summary);
    }

    getHomeOfficeMonthCount(year: number, month: number): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/homeoffice-count?year=${year}&month=${month}`);
    }

    getSettings(): Observable<WorkTimeSettings> {
        return this.http.get<WorkTimeSettings>(`${this.apiUrl}/settings`);
    }

    updateSettings(settings: WorkTimeSettings): Observable<WorkTimeSettings> {
        return this.http.put<WorkTimeSettings>(`${this.apiUrl}/settings`, settings);
    }
}
