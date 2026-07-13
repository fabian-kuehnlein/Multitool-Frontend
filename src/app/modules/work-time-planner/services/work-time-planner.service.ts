import { Injectable, inject, signal, computed } from '@angular/core';
import moment from 'moment';
import { WorkDay, WorkDayWarning, WorkTimeSettings, WeekSummary, DayStatus } from '../models/work-time-planner.model';
import { WorkTimePlannerHttpService } from './work-time-planner-http.service';

@Injectable({
  providedIn: 'root',
})
export class WorkTimePlannerService {
  private readonly httpService = inject(WorkTimePlannerHttpService);

  private readonly _workDays = signal<WorkDay[]>([]);
  private readonly _currentWeekStart = signal<string>(this.getWeekStart(new Date()));
  private readonly _settings = signal<WorkTimeSettings>({
    dailyTargetMinutes: 480,
    breakRule6h: 30,
    breakRule9h: 45,
    homeOfficeLimit: 6,
  });
  private readonly _previousWeekSummary = signal<WeekSummary | null>(null);
  private readonly _currentWeekSummary = signal<WeekSummary | null>(null);
  private readonly _homeOfficeMonthCount = signal<number>(0);

  readonly workDays = this._workDays.asReadonly();
  readonly currentWeekStart = this._currentWeekStart.asReadonly();
  readonly settings = this._settings.asReadonly();

  readonly weekDays = computed(() => {
    const start = moment(this._currentWeekStart());
    return Array.from({ length: 5 }, (_, i) => {
      const date = start.clone().add(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      const existing = this._workDays().find(wd => wd.date === dateStr);
      return existing || this.createDefaultWorkDay(dateStr);
    });
  });

  readonly weeklyWorkMinutes = computed(() =>
    this.weekDays().reduce((sum, d) => sum + d.workMinutes, 0)
  );

  readonly weeklyOvertimeMinutes = computed(() =>
    this.weekDays().reduce((sum, d) => sum + d.overtimeMinutes, 0)
  );

  readonly weeklyTargetMinutes = computed(() => this._settings().dailyTargetMinutes * 5);

  readonly baseOvertime = computed(() => this._previousWeekSummary()?.totalOvertime ?? 0);

  readonly totalOvertime = computed(() => this.baseOvertime() + this.weeklyOvertimeMinutes());

  readonly homeOfficeDaysThisWeek = computed(() =>
    this.weekDays().filter(d => d.isHomeOffice).length
  );

  readonly homeOfficeMonthCount = this._homeOfficeMonthCount.asReadonly();

  getWeekStart(date: Date): string {
    const d = moment(date);
    const day = d.day();
    const diff = day === 0 ? -6 : 1 - day;
    return d.add(diff, 'days').format('YYYY-MM-DD');
  }

  private createDefaultWorkDay(date: string): WorkDay {
    return {
      id: '',
      date,
      startTime: null,
      endTime: null,
      breakMinutes: 30,
      workMinutes: 0,
      overtimeMinutes: 0,
      isHomeOffice: false,
      status: DayStatus.Normal,
      isLocked: false,
      warnings: [],
    };
  }

  navigateWeek(direction: 'prev' | 'next' | 'current'): void {
    if (direction !== 'current') {
      this.saveCurrentWeekSummary();
    }

    if (direction === 'current') {
      this._currentWeekStart.set(this.getWeekStart(new Date()));
    } else {
      const offset = direction === 'next' ? 7 : -7;
      const newStart = moment(this._currentWeekStart()).add(offset, 'days').format('YYYY-MM-DD');
      this._currentWeekStart.set(newStart);
    }

    this.loadWorkDays();
  }

  isCurrentWeek(): boolean {
    return this._currentWeekStart() === this.getWeekStart(new Date());
  }

  loadWorkDays(): void {
    const start = this._currentWeekStart();
    const end = moment(start).add(4, 'days').format('YYYY-MM-DD');

    this.httpService.getWorkDays(start, end).subscribe({
      next: (days) => {
        const calculated = days.map(d => this.calculateWorkDay(d));
        this._workDays.update(existing => {
          const nonWeek = existing.filter(e => e.date < start || e.date > end);
          return [...nonWeek, ...calculated];
        });
      },
      error: () => {},
    });

    const currentMoment = moment(start);
    const year = currentMoment.year();
    const weekNumber = currentMoment.isoWeek();

    this.httpService.getWeekSummary(year, weekNumber).subscribe({
      next: (summary) => this._currentWeekSummary.set(summary),
      error: () => this._currentWeekSummary.set(null),
    });

    const prevWeek = currentMoment.clone().subtract(1, 'week');
    this.httpService.getWeekSummary(prevWeek.year(), prevWeek.isoWeek()).subscribe({
      next: (summary) => this._previousWeekSummary.set(summary),
      error: () => this._previousWeekSummary.set(null),
    });

    this.loadHomeOfficeMonthCount();
  }

  loadHomeOfficeMonthCount(): void {
    const now = moment();
    this.httpService.getHomeOfficeMonthCount(now.year(), now.month() + 1).subscribe({
      next: (count) => this._homeOfficeMonthCount.set(count),
      error: () => {},
    });
  }

  updateSettings(settings: WorkTimeSettings): void {
    this._settings.set(settings);
    this._workDays.update(days => days.map(d => this.calculateWorkDay(d)));
    this.httpService.updateSettings(settings).subscribe({ error: () => {} });
  }

  updateWorkDay(updated: WorkDay): void {
    const calculated = this.calculateWorkDay(updated);
    this._workDays.update(days => {
      const idx = days.findIndex(d => d.date === calculated.date);
      if (idx !== -1) {
        const newDays = [...days];
        newDays[idx] = calculated;
        return newDays;
      }
      return [...days, calculated];
    });

    if (calculated.id) {
      this.httpService.updateWorkDay(calculated.id, calculated).subscribe({ error: () => {} });
    } else {
      this.httpService.createWorkDay(calculated).subscribe({
        next: (saved) => {
          this._workDays.update(days => {
            const idx = days.findIndex(d => d.date === saved.date);
            if (idx !== -1) {
              const newDays = [...days];
              newDays[idx] = saved;
              return newDays;
            }
            return [...days, saved];
          });
        },
        error: () => {},
      });
    }
  }

  toggleHomeOffice(date: string): void {
    const day = this._workDays().find(d => d.date === date) || this.createDefaultWorkDay(date);
    const willBeHomeOffice = !day.isHomeOffice;
    this.updateWorkDay({ ...day, isHomeOffice: willBeHomeOffice });

    const dateMonth = moment(date).month();
    const currentMonth = moment().month();
    if (dateMonth === currentMonth) {
      this._homeOfficeMonthCount.update(c => willBeHomeOffice ? c + 1 : Math.max(0, c - 1));
    }
  }

  toggleDayStatus(date: string, status: DayStatus): void {
    const day = this._workDays().find(d => d.date === date) || this.createDefaultWorkDay(date);
    const updated = { ...day, status: day.status === status ? DayStatus.Normal : status };
    this.updateWorkDay(updated);
  }

  toggleLock(date: string): void {
    const day = this._workDays().find(d => d.date === date);
    if (!day) return;
    this.updateWorkDay({ ...day, isLocked: !day.isLocked });
  }

  private calculateWorkDay(day: WorkDay): WorkDay {
    const warnings: WorkDayWarning[] = [];
    let workMinutes = 0;
    let overtimeMinutes = 0;
    let breakMinutes = day.breakMinutes;

    if (day.status !== DayStatus.Normal) {
      workMinutes = this._settings().dailyTargetMinutes;
      overtimeMinutes = 0;
      breakMinutes = 0;
    } else if (day.startTime && day.endTime) {
      const start = moment(day.startTime, 'HH:mm');
      const end = moment(day.endTime, 'HH:mm');
      const totalMinutes = end.diff(start, 'minutes');

      if (breakMinutes === 0) {
        if (totalMinutes > 540) breakMinutes = this._settings().breakRule9h;
        else if (totalMinutes > 360) breakMinutes = this._settings().breakRule6h;
      }

      workMinutes = Math.max(0, totalMinutes - breakMinutes);
      overtimeMinutes = workMinutes - this._settings().dailyTargetMinutes;

      if (breakMinutes < this._settings().breakRule9h && totalMinutes > 540) {
        warnings.push({
          type: 'PauseTooShort',
          message: `Bei ${Math.round(totalMinutes / 60)}h Arbeitszeit sind mindestens ${this._settings().breakRule9h} Minuten Pause vorgeschrieben`,
        });
      } else if (breakMinutes < this._settings().breakRule6h && totalMinutes > 360) {
        warnings.push({
          type: 'PauseTooShort',
          message: `Bei ${Math.round(totalMinutes / 60)}h Arbeitszeit sind mindestens ${this._settings().breakRule6h} Minuten Pause vorgeschrieben`,
        });
      }

      if (totalMinutes > 600) {
        warnings.push({
          type: 'Over10Hours',
          message: 'Mehr als 10 Stunden Arbeitszeit an einem Tag',
        });
      }
    }

    return { ...day, workMinutes, overtimeMinutes, breakMinutes, warnings };
  }

  private saveCurrentWeekSummary(): void {
    const currentMoment = moment(this._currentWeekStart());
    const summary: WeekSummary = {
      year: currentMoment.year(),
      weekNumber: currentMoment.isoWeek(),
      totalOvertime: this.totalOvertime(),
    };
    this.httpService.saveWeekSummary(summary).subscribe({ error: () => {} });
  }

  getWeekRange(): string {
    const start = moment(this._currentWeekStart());
    const end = start.clone().add(4, 'days');
    return `${start.format('DD.MM.')} – ${end.format('DD.MM.YYYY')}`;
  }

  getWeekNumber(): number {
    return moment(this._currentWeekStart()).isoWeek();
  }
}
