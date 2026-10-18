import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    UpsertWorkDayDto,
    LockWorkDayDto,
    WorkDay,
    OvertimeBalance,
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

    upsertWorkDay(data: UpsertWorkDayDto): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/workdays`, data);
    }

    setWorkDayLock(id: number, data: LockWorkDayDto): Observable<void> {
        return this.http.put<void>(
            `${this.apiUrl}/workdays/${id}/lock`,
            data,
        );
    }

    getOvertimeBalance(): Observable<OvertimeBalance> {
        return this.http.get<OvertimeBalance>(
            `${this.apiUrl}/overtime-balance`,
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
}
