import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    WorkDay,
    WorkTimeSettings,
    WeekSummary,
} from '../models/work-time-planner.model';

@Injectable({
    providedIn: 'root',
})
export class WorkTimePlannerHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/WorkTimePlanner`;

    getWorkDays(startDate: string, endDate: string): Observable<WorkDay[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<WorkDay[]>(`${this.apiUrl}/workdays`, { params });
    }

    createWorkDay(data: Partial<WorkDay>): Observable<WorkDay> {
        return this.http.post<WorkDay>(`${this.apiUrl}/workdays`, data);
    }

    updateWorkDay(id: number, data: Partial<WorkDay>): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/workdays/${id}`, data);
    }

    deleteWorkDay(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/workdays/${id}`);
    }

    getWeekSummary(
        year: number,
        weekNumber: number,
    ): Observable<WeekSummary | null> {
        const params = new HttpParams()
            .set('year', year)
            .set('weekNumber', weekNumber);
        return this.http.get<WeekSummary | null>(`${this.apiUrl}/weeksummary`, {
            params,
        });
    }

    saveWeekSummary(year: number, weekNumber: number): Observable<WeekSummary> {
        const params = new HttpParams()
            .set('year', year)
            .set('weekNumber', weekNumber);
        return this.http.post<WeekSummary>(
            `${this.apiUrl}/weeksummary`,
            null,
            { params },
        );
    }

    getHomeOfficeMonthCount(
        year: number,
        month: number,
    ): Observable<{ year: number; month: number; homeOfficeDays: number }> {
        const params = new HttpParams().set('year', year).set('month', month);
        return this.http.get<{
            year: number;
            month: number;
            homeOfficeDays: number;
        }>(`${this.apiUrl}/homeoffice`, { params });
    }

    getSettings(): Observable<WorkTimeSettings> {
        return this.http.get<WorkTimeSettings>(`${this.apiUrl}/settings`);
    }

    updateSettings(settings: WorkTimeSettings): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/settings`, settings);
    }
}
