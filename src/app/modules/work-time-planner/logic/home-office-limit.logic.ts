import { DateUtil } from '../../../shared/utilities/date.util';
import {
    MonthHoCount,
    WorkDay,
    WorkDayWarning,
} from '../models/work-time-planner.model';

export function isHomeOfficeLimitExceeded(
    count: number,
    limit: number,
): boolean {
    return limit > 0 && count > limit;
}

export function collectHomeOfficeLimitWarnings(
    days: WorkDay[],
    weeklyLimit: number,
    monthlyLimit: number,
    monthCounts: MonthHoCount[],
): Map<string, WorkDayWarning> {
    const warningsByDate = new Map<string, WorkDayWarning>();
    const weeklyExceeded = isHomeOfficeLimitExceeded(
        days.filter((day) => day.isHomeOffice).length,
        weeklyLimit,
    );
    const exceededMonths = new Set(
        monthCounts
            .filter((month) =>
                isHomeOfficeLimitExceeded(month.count, monthlyLimit),
            )
            .map((month) => `${month.year}-${month.month}`),
    );

    for (const day of days) {
        if (!day.isHomeOffice) continue;

        const date = DateUtil.parse(day.date);
        if (!date) continue;

        const monthKey = `${date.year()}-${date.month() + 1}`;
        const monthlyExceeded = exceededMonths.has(monthKey);
        if (!weeklyExceeded && !monthlyExceeded) continue;

        const limits: string[] = [];
        if (weeklyExceeded) {
            limits.push(`max. ${weeklyLimit} Tage/Woche`);
        }
        if (monthlyExceeded) {
            limits.push(`max. ${monthlyLimit} Tage/Monat`);
        }

        warningsByDate.set(day.date, {
            type: 'HomeOfficeLimitExceeded',
            message: `Homeoffice-Limit überschritten (${limits.join(', ')})`,
        });
    }

    return warningsByDate;
}
