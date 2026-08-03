import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { DateInput } from '@fullcalendar/core';

dayjs.extend(duration);

export interface RecurrenceRuleInput {
    dtstart?: string | null;
    until?: string | null;
    freq?: string;
    interval?: number;
    byweekday?: string[];
    exdate?: string | string[];
}

export interface ParsedRRule {
    freq?: string;
    interval?: number;
    byweekday?: string[];
    exdate?: string[];
}

export function parseRRuleString(rrule: string): ParsedRRule {
    const parts = rrule.split(';');
    const rule: ParsedRRule = {};

    for (const part of parts) {
        const [key, value] = part.split('=');
        if (!key || !value) continue;

        switch (key) {
            case 'FREQ':
                rule.freq = value.toLowerCase();
                break;
            case 'INTERVAL':
                rule.interval = parseInt(value);
                break;
            case 'BYDAY':
                rule.byweekday = value
                    .split(',')
                    .map((day) => day.toLowerCase());
                break;
            case 'EXDATE':
                rule.exdate = value.split(',');
                break;
        }
    }

    return rule;
}

export function eventFallsOnDate(
    rule: RecurrenceRuleInput,
    date: Dayjs,
    exdate?: DateInput | DateInput[],
): boolean {
    const dateStr = date.format('YYYY-MM-DD');
    const dtstart = dayjs(rule.dtstart).startOf('day');
    const targetDate = dayjs(date).startOf('day');

    if (targetDate.isBefore(dtstart)) return false;

    if (rule.until && targetDate.isAfter(dayjs(rule.until).startOf('day')))
        return false;

    if (exdate) {
        const exdateArray = Array.isArray(exdate) ? exdate : [exdate];
        if (
            exdateArray.some(
                (ex) =>
                    dayjs(ex as string | number | Date).format('YYYY-MM-DD') ===
                    dateStr,
            )
        ) {
            return false;
        }
    }

    const freq = rule.freq;
    const interval = rule.interval || 1;

    if (freq === 'daily') {
        const diff = targetDate.diff(dtstart, 'day');
        return diff % interval === 0;
    }

    if (freq === 'weekly') {
        const weeksBetween = Math.floor(
            targetDate.diff(dtstart, 'day') / 7,
        );
        if (weeksBetween % interval !== 0) return false;

        if (rule.byweekday && Array.isArray(rule.byweekday)) {
            const dayName = targetDate.format('dd').toLowerCase();
            return rule.byweekday.includes(dayName);
        }
        return targetDate.day() === dtstart.day();
    }

    if (freq === 'monthly') {
        const diff = targetDate.diff(dtstart, 'month');
        if (diff % interval !== 0) return false;
        return targetDate.date() === dtstart.date();
    }

    if (freq === 'yearly') {
        const diff = targetDate.diff(dtstart, 'year');
        if (diff % interval !== 0) return false;
        return (
            targetDate.date() === dtstart.date() &&
            targetDate.month() === dtstart.month()
        );
    }

    return false;
}

export function getDuration(
    start: string | null | undefined,
    end: string | null | undefined,
): string {
    if (!start || !end) return '';

    const startMoment = dayjs(start);
    const endMoment = dayjs(end);

    if (!startMoment.isValid() || !endMoment.isValid()) return '';

    return dayjs.duration(endMoment.diff(startMoment)).toISOString();
}
