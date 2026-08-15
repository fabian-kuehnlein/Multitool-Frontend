import { Injectable, inject, signal, computed } from '@angular/core';
import dayjs from 'dayjs';
import { EMPTY, Observable, map, tap } from 'rxjs';

import {
    WorkDay,
    WorkTimeSettings,
    WeekSummary,
    DayStatus,
    MonthHoCount,
} from '../models/work-time-planner.model';
import { WorkTimePlannerHttpService } from './work-time-planner-http.service';
import { toCreateWorkDayDto, toUpdateWorkDayDto } from '../mappers/work-day.mapper';
import {
    calculateWorkDay,
    collectMonthsToQuery,
    createDefaultWorkDay,
    getWeekStart,
    hasMeaningfulData,
    isHomeOfficeDisabled,
    normalizeWorkDay,
    upsertWorkDay,
} from '../logic/work-time-calculation.logic';
import { DEFAULT_WORK_TIME_SETTINGS } from '../utilities/work-time.config';
import { getWeekNumber, getWeekRange } from '../utilities/work-time.util';

@Injectable({
    providedIn: 'root',
})
export class WorkTimePlannerService {
    private readonly httpService = inject(WorkTimePlannerHttpService);

    private readonly _workDays = signal<WorkDay[]>([]);
    private readonly _currentWeekStart = signal<string>(
        getWeekStart(new Date()),
    );
    private readonly _settings = signal<WorkTimeSettings>({
        ...DEFAULT_WORK_TIME_SETTINGS,
    });
    private readonly _previousWeekSummary = signal<WeekSummary | null>(null);
    private readonly _homeOfficeMonthCounts = signal<MonthHoCount[]>([]);
    private readonly _pendingCreates = new Set<string>();
    private readonly _loading = signal<boolean>(false);

    readonly workDays = this._workDays.asReadonly();
    readonly currentWeekStart = this._currentWeekStart.asReadonly();
    readonly settings = this._settings.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly homeOfficeMonthCounts = this._homeOfficeMonthCounts.asReadonly();

    readonly weekDays = computed(() => {
        const start = dayjs(this._currentWeekStart());
        return Array.from({ length: 5 }, (_, i) => {
            const date = start.add(i, 'day');
            const dateStr = date.format('YYYY-MM-DD');
            const existing = this._workDays().find((wd) => wd.date === dateStr);
            return existing || createDefaultWorkDay(dateStr);
        });
    });

    readonly weeklyWorkMinutes = computed(() =>
        this.weekDays().reduce((sum, d) => sum + d.workMinutes, 0),
    );

    readonly weeklyOvertimeMinutes = computed(() =>
        this.weekDays().reduce((sum, d) => sum + d.overtimeMinutes, 0),
    );

    readonly weeklyTargetMinutes = computed(
        () => this._settings().dailyTargetMinutes * 5,
    );

    readonly baseOvertime = computed(
        () => this._previousWeekSummary()?.totalOvertime ?? 0,
    );

    readonly totalOvertime = computed(
        () => this.baseOvertime() + this.weeklyOvertimeMinutes(),
    );

    readonly homeOfficeDaysThisWeek = computed(
        () => this.weekDays().filter((d) => d.isHomeOffice).length,
    );

    navigateWeek(direction: 'prev' | 'next' | 'current'): void {
        if (direction !== 'current') {
            this.saveCurrentWeekSummary();
        }

        if (direction === 'current') {
            this._currentWeekStart.set(getWeekStart(new Date()));
        } else {
            const offset = direction === 'next' ? 7 : -7;
            const newStart = dayjs(this._currentWeekStart())
                .add(offset, 'day')
                .format('YYYY-MM-DD');
            this._currentWeekStart.set(newStart);
        }

        this.loadWorkDays();
    }

    isCurrentWeek(): boolean {
        return this._currentWeekStart() === getWeekStart(new Date());
    }

    loadWorkDays(): void {
        const start = this._currentWeekStart();
        const end = dayjs(start).add(5, 'day').format('YYYY-MM-DD');

        this._loading.set(true);
        this.httpService.getWorkDays(start, end).subscribe({
            next: (days) => {
                const normalized = days.map((d) => normalizeWorkDay(d));
                const calculated = normalized.map((d) =>
                    calculateWorkDay(d, this._settings()),
                );
                this._workDays.update((existing) => {
                    const nonWeek = existing.filter(
                        (e) => e.date < start || e.date >= end,
                    );
                    return [...nonWeek, ...calculated];
                });
            },
            error: () => {},
            complete: () => this._loading.set(false),
        });

        const prevWeek = dayjs(start).subtract(1, 'week');
        this.httpService
            .getWeekSummary(prevWeek.year(), prevWeek.isoWeek())
            .subscribe({
                next: (summary) => this._previousWeekSummary.set(summary),
                error: () => this._previousWeekSummary.set(null),
            });

        this.loadHomeOfficeMonthCount();
    }

    loadHomeOfficeMonthCount(): void {
        const monthsToQuery = collectMonthsToQuery(this._currentWeekStart());

        const results: MonthHoCount[] = [];
        let completed = 0;
        const total = monthsToQuery.length;

        monthsToQuery.forEach(({ year, month }) => {
            this.httpService.getHomeOfficeMonthCount(year, month).subscribe({
                next: (res) => {
                    const m = dayjs(
                        `${res.year}-${String(res.month).padStart(2, '0')}`,
                        'YYYY-MM',
                    );
                    results.push({
                        year: res.year,
                        month: res.month,
                        monthName: m.format('MMMM'),
                        count: res.homeOfficeDays,
                    });
                },
                error: () => {
                    const m = dayjs(
                        `${year}-${String(month).padStart(2, '0')}`,
                        'YYYY-MM',
                    );
                    results.push({
                        year,
                        month,
                        monthName: m.format('MMMM'),
                        count: 0,
                    });
                },
                complete: () => {
                    completed++;
                    if (completed === total) {
                        results.sort(
                            (a, b) =>
                                a.year * 100 +
                                a.month -
                                (b.year * 100 + b.month),
                        );
                        this._homeOfficeMonthCounts.set(results);
                    }
                },
            });
        });

        if (monthsToQuery.length === 0) {
            this._homeOfficeMonthCounts.set([]);
        }
    }

    loadSettings(): void {
        this.httpService.getSettings().subscribe({
            next: (settings) => {
                this._settings.set(settings);
                this._workDays.update((days) =>
                    days.map((d) => calculateWorkDay(d, settings)),
                );
            },
            error: () => {},
        });
    }

    updateSettings(settings: WorkTimeSettings): void {
        this._settings.set(settings);
        this._workDays.update((days) =>
            days.map((d) => calculateWorkDay(d, settings)),
        );
        this.httpService
            .updateSettings(settings)
            .subscribe({ error: () => {} });
    }

    updateWorkDay(updated: WorkDay): void {
        const toSave = this.prepareWorkDay(updated);
        if (!toSave) return;

        this.saveWorkDay(toSave).subscribe({ error: () => {} });
    }

    toggleHomeOffice(date: string): void {
        const day =
            this._workDays().find((d) => d.date === date) ||
            createDefaultWorkDay(date);
        if (isHomeOfficeDisabled(day)) return;

        const toSave = this.prepareWorkDay({
            ...day,
            isHomeOffice: !day.isHomeOffice,
        });
        if (!toSave) return;

        this.saveWorkDay(toSave).subscribe({
            next: () => this.loadHomeOfficeMonthCount(),
            error: () => {},
        });
    }

    toggleDayStatus(date: string, status: DayStatus): void {
        const day =
            this._workDays().find((d) => d.date === date) ||
            createDefaultWorkDay(date);
        const newStatus = day.status === status ? DayStatus.Normal : status;
        const updated = { ...day, status: newStatus };
        if (newStatus !== DayStatus.Normal) {
            updated.isHomeOffice = false;
        }
        this.updateWorkDay(updated);
    }

    toggleLock(date: string): void {
        const day = this._workDays().find((d) => d.date === date);
        if (!day) return;
        this.updateWorkDay({ ...day, isLocked: !day.isLocked });
    }

    private prepareWorkDay(updated: WorkDay): WorkDay | null {
        const calculated = calculateWorkDay(updated, this._settings());
        const existing = this._workDays().find(
            (d) => d.date === calculated.date,
        );
        const toSave = existing?.id
            ? { ...calculated, id: existing.id }
            : calculated;

        this._workDays.update((days) => upsertWorkDay(days, toSave));

        return hasMeaningfulData(toSave) ? toSave : null;
    }

    private saveWorkDay(toSave: WorkDay): Observable<void> {
        if (toSave.id) {
            return this.httpService
                .updateWorkDay(toSave.id, toUpdateWorkDayDto(toSave))
                .pipe(tap(() => this.saveCurrentWeekSummary()));
        }

        if (this._pendingCreates.has(toSave.date)) {
            return EMPTY;
        }

        this._pendingCreates.add(toSave.date);
        return this.httpService.createWorkDay(toCreateWorkDayDto(toSave)).pipe(
            map((saved) => {
                const normalized = normalizeWorkDay(saved);
                const calculated = calculateWorkDay(
                    normalized,
                    this._settings(),
                );
                this._pendingCreates.delete(calculated.date);
                this._workDays.update((days) =>
                    upsertWorkDay(days, calculated),
                );
                this.saveCurrentWeekSummary();
            }),
        );
    }

    private saveCurrentWeekSummary(): void {
        const currentMoment = dayjs(this._currentWeekStart());
        this.httpService
            .saveWeekSummary(
                currentMoment.year(),
                currentMoment.isoWeek(),
            )
            .subscribe({ error: () => {} });
    }

    getWeekRange(): string {
        return getWeekRange(this._currentWeekStart());
    }

    getWeekNumber(): number {
        return getWeekNumber(this._currentWeekStart());
    }
}
