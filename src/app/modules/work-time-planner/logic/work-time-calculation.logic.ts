import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import {
    DayStatus,
    WorkDay,
    WorkDayWarning,
    WorkTimeSettings,
} from '../models/work-time-planner.model';

dayjs.extend(customParseFormat);

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
            if (rawWorkMinutes > 540) breakMinutes = settings.breakRule9h;
            else if (rawWorkMinutes > 360) breakMinutes = settings.breakRule6h;
        }

        workMinutes = Math.max(0, totalMinutes - breakMinutes);
        overtimeMinutes = workMinutes - settings.dailyTargetMinutes;

        if (breakMinutes < settings.breakRule9h && workMinutes > 540) {
            warnings.push({
                type: 'PauseTooShort',
                message: `Bei über 9h Arbeitszeit sind mindestens ${settings.breakRule9h} Minuten Pause vorgeschrieben`,
            });
        } else if (breakMinutes < settings.breakRule6h && workMinutes > 360) {
            warnings.push({
                type: 'PauseTooShort',
                message: `Bei über 6h Arbeitszeit sind mindestens ${settings.breakRule6h} Minuten Pause vorgeschrieben`,
            });
        }

        if (workMinutes < 360) {
            warnings.push({
                type: 'Under6Hours',
                message: 'Weniger als 6 Stunden Arbeitszeit an einem Tag',
            });
        } else if (workMinutes > 600) {
            warnings.push({
                type: 'Over10Hours',
                message: 'Mehr als 10 Stunden Arbeitszeit an einem Tag',
            });
        }
    }

    return { ...day, workMinutes, overtimeMinutes, breakMinutes, warnings };
}
