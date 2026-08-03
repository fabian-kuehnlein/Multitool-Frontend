import dayjs from 'dayjs';

import {
    DayStatus,
    WorkDay,
    WorkDayWarning,
    WorkTimeSettings,
} from '../models/work-time-planner.model';
import {
    NINE_HOURS_MINUTES,
    SIX_HOURS_MINUTES,
    TEN_HOURS_MINUTES,
} from '../utilities/work-time.config';

export function getWeekStart(date: Date): string {
    const d = dayjs(date);
    const day = d.day();
    const diff = day === 0 ? -6 : 1 - day;
    return d.add(diff, 'day').format('YYYY-MM-DD');
}

export function normalizeDate(date: string | Date): string {
    return dayjs(date).format('YYYY-MM-DD');
}

export function normalizeTime(time: string | null): string | null {
    if (!time) return null;
    const parts = time.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

export function normalizeWorkDay(day: WorkDay): WorkDay {
    return {
        ...day,
        date: normalizeDate(day.date),
        startTime: normalizeTime(day.startTime),
        endTime: normalizeTime(day.endTime),
    };
}

export function createDefaultWorkDay(date: string): WorkDay {
    return {
        id: 0,
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

export function calculateWorkDay(
    day: WorkDay,
    settings: WorkTimeSettings,
): WorkDay {
    const warnings: WorkDayWarning[] = [];
    let workMinutes = 0;
    let overtimeMinutes = 0;
    let breakMinutes = day.breakMinutes;

    if (day.status !== DayStatus.Normal) {
        workMinutes = settings.dailyTargetMinutes;
        overtimeMinutes = 0;
        breakMinutes = 0;
    } else if (day.startTime && day.endTime) {
        const start = dayjs(day.startTime, 'HH:mm');
        const end = dayjs(day.endTime, 'HH:mm');
        const totalMinutes = end.diff(start, 'minute');

        const rawWorkMinutes = totalMinutes - breakMinutes;

        if (breakMinutes === 0) {
            if (rawWorkMinutes > NINE_HOURS_MINUTES)
                breakMinutes = settings.breakRule9h;
            else if (rawWorkMinutes > SIX_HOURS_MINUTES)
                breakMinutes = settings.breakRule6h;
        }

        workMinutes = Math.max(0, totalMinutes - breakMinutes);
        overtimeMinutes = workMinutes - settings.dailyTargetMinutes;

        if (
            breakMinutes < settings.breakRule9h &&
            workMinutes > NINE_HOURS_MINUTES
        ) {
            warnings.push({
                type: 'PauseTooShort',
                message: `Bei über 9h Arbeitszeit sind mindestens ${settings.breakRule9h} Minuten Pause vorgeschrieben`,
            });
        } else if (
            breakMinutes < settings.breakRule6h &&
            workMinutes > SIX_HOURS_MINUTES
        ) {
            warnings.push({
                type: 'PauseTooShort',
                message: `Bei über 6h Arbeitszeit sind mindestens ${settings.breakRule6h} Minuten Pause vorgeschrieben`,
            });
        }

        if (workMinutes < SIX_HOURS_MINUTES) {
            warnings.push({
                type: 'Under6Hours',
                message: 'Weniger als 6 Stunden Arbeitszeit an einem Tag',
            });
        } else if (workMinutes > TEN_HOURS_MINUTES) {
            warnings.push({
                type: 'Over10Hours',
                message: 'Mehr als 10 Stunden Arbeitszeit an einem Tag',
            });
        }
    }

    return { ...day, workMinutes, overtimeMinutes, breakMinutes, warnings };
}

export function isHomeOfficeDisabled(day: WorkDay): boolean {
    return day.status !== DayStatus.Normal;
}

export function hasMeaningfulData(day: WorkDay): boolean {
    return (
        !!day.startTime ||
        !!day.endTime ||
        day.status !== DayStatus.Normal ||
        day.isHomeOffice
    );
}

export function upsertWorkDay(days: WorkDay[], day: WorkDay): WorkDay[] {
    const idx = days.findIndex((d) => d.date === day.date);
    if (idx !== -1) {
        const next = [...days];
        next[idx] = day;
        return next;
    }
    return [...days, day];
}

export function collectMonthsToQuery(
    startDate: string,
): { year: number; month: number }[] {
    const start = dayjs(startDate);
    const end = start.add(4, 'day');
    const months = new Map<string, { year: number; month: number }>();
    let current = start;
    while (current.isSameOrBefore(end, 'day')) {
        const key = current.format('YYYY-MM');
        if (!months.has(key)) {
            months.set(key, {
                year: current.year(),
                month: current.month() + 1,
            });
        }
        current = current.add(1, 'day');
    }
    return [...months.values()];
}
