import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
        return this.http.get<WorkDay[]>(
            `${this.apiUrl}/workdays?startDate=${startDate}&endDate=${endDate}`,
        );
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
        return this.http.get<WeekSummary | null>(
            `${this.apiUrl}/weeksummary?year=${year}&weekNumber=${weekNumber}`,
        );
    }

    saveWeekSummary(year: number, weekNumber: number): Observable<WeekSummary> {
        return this.http.post<WeekSummary>(
            `${this.apiUrl}/weeksummary?year=${year}&weekNumber=${weekNumber}`,
            null,
        );
    }

    getHomeOfficeMonthCount(
        year: number,
        month: number,
    ): Observable<{ year: number; month: number; homeOfficeDays: number }> {
        return this.http.get<{
            year: number;
            month: number;
            homeOfficeDays: number;
        }>(`${this.apiUrl}/homeoffice?year=${year}&month=${month}`);
    }

    getSettings(): Observable<WorkTimeSettings> {
        return this.http.get<WorkTimeSettings>(`${this.apiUrl}/settings`);
    }

    updateSettings(settings: WorkTimeSettings): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/settings`, settings);
    }
}
