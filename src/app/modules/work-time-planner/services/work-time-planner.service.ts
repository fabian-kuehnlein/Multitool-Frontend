import { Injectable, inject, signal, computed } from '@angular/core';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);

import {
    WorkDay,
    WorkTimeSettings,
    WeekSummary,
    DayStatus,
} from '../models/work-time-planner.model';
import { WorkTimePlannerHttpService } from './work-time-planner-http.service';
import {
    calculateWorkDay,
    createDefaultWorkDay,
    getWeekStart,
    normalizeWorkDay,
} from '../logic/work-time-calculation.logic';
import { DEFAULT_WORK_TIME_SETTINGS } from '../utilities/work-time.config';

export interface MonthHoCount {
    year: number;
    month: number;
    monthName: string;
    count: number;
}

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
    private readonly _currentWeekSummary = signal<WeekSummary | null>(null);
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

        const currentMoment = dayjs(start);
        const year = currentMoment.year();
        const weekNumber = currentMoment.isoWeek();

        this.httpService.getWeekSummary(year, weekNumber).subscribe({
            next: (summary) => this._currentWeekSummary.set(summary),
            error: () => this._currentWeekSummary.set(null),
        });

        const prevWeek = currentMoment.subtract(1, 'week');
        this.httpService
            .getWeekSummary(prevWeek.year(), prevWeek.isoWeek())
            .subscribe({
                next: (summary) => this._previousWeekSummary.set(summary),
                error: () => this._previousWeekSummary.set(null),
            });

        this.loadHomeOfficeMonthCount();
    }

    loadHomeOfficeMonthCount(): void {
        const start = dayjs(this._currentWeekStart());
        const end = start.add(4, 'day');

        const monthsToQuery = new Map<
            string,
            { year: number; month: number }
        >();
        let current = start;
        while (current.isSameOrBefore(end, 'day')) {
            const key = current.format('YYYY-MM');
            if (!monthsToQuery.has(key)) {
                monthsToQuery.set(key, {
                    year: current.year(),
                    month: current.month() + 1,
                });
            }
            current = current.add(1, 'day');
        }

        const results: MonthHoCount[] = [];
        let completed = 0;
        const total = monthsToQuery.size;

        monthsToQuery.forEach(({ year, month }, key) => {
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

        if (monthsToQuery.size === 0) {
            this._homeOfficeMonthCounts.set([]);
        }
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
        const calculated = calculateWorkDay(updated, this._settings());
        const existing = this._workDays().find(
            (d) => d.date === calculated.date,
        );
        const toSave = existing?.id
            ? { ...calculated, id: existing.id }
            : calculated;

        this._workDays.update((days) => {
            const idx = days.findIndex((d) => d.date === toSave.date);
            if (idx !== -1) {
                const newDays = [...days];
                newDays[idx] = toSave;
                return newDays;
            }
            return [...days, toSave];
        });

        const hasMeaningfulData =
            toSave.startTime ||
            toSave.endTime ||
            toSave.status !== DayStatus.Normal ||
            toSave.isHomeOffice;

        if (!hasMeaningfulData) {
            return;
        }

        if (toSave.id) {
            this.httpService.updateWorkDay(toSave.id, toSave).subscribe({
                next: () => this.saveCurrentWeekSummary(),
                error: () => {},
            });
            return;
        }

        if (this._pendingCreates.has(toSave.date)) {
            return;
        }

        this._pendingCreates.add(toSave.date);
        this.httpService.createWorkDay(toSave).subscribe({
            next: (saved) => {
                const normalized = normalizeWorkDay(saved);
                const calculated = calculateWorkDay(
                    normalized,
                    this._settings(),
                );
                this._pendingCreates.delete(calculated.date);
                this._workDays.update((days) => {
                    const idx = days.findIndex(
                        (d) => d.date === calculated.date,
                    );
                    if (idx !== -1) {
                        const newDays = [...days];
                        newDays[idx] = calculated;
                        return newDays;
                    }
                    return [...days, calculated];
                });
                this.saveCurrentWeekSummary();
            },
            error: () => {
                this._pendingCreates.delete(toSave.date);
            },
        });
    }

    isHomeOfficeDisabled(day: WorkDay): boolean {
        return day.status !== DayStatus.Normal;
    }

    toggleHomeOffice(date: string): void {
        const day =
            this._workDays().find((d) => d.date === date) ||
            createDefaultWorkDay(date);
        if (this.isHomeOfficeDisabled(day)) return;

        const willBeHomeOffice = !day.isHomeOffice;
        this.updateWorkDay({ ...day, isHomeOffice: willBeHomeOffice });

        setTimeout(() => this.loadHomeOfficeMonthCount(), 500);
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

    private saveCurrentWeekSummary(): void {
        const currentMoment = dayjs(this._currentWeekStart());
        const summary: WeekSummary = {
            year: currentMoment.year(),
            weekNumber: currentMoment.isoWeek(),
            totalOvertime: this.totalOvertime(),
        };
        this.httpService
            .saveWeekSummary(summary.year, summary.weekNumber)
            .subscribe({ error: () => {} });
    }

    getWeekRange(): string {
        const start = dayjs(this._currentWeekStart());
        const end = start.add(4, 'day');
        return `${start.format('DD.MM.')} – ${end.format('DD.MM.YYYY')}`;
    }

    getWeekNumber(): number {
        return dayjs(this._currentWeekStart()).isoWeek();
    }
}
