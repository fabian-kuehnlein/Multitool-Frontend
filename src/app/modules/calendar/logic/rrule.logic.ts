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

export interface RecurrenceRuleForm {
    freq?: string | null;
    interval?: number | null;
    byDay?: string[];
    exDates?: string[];
}

/**
 * Parses an RRule string into a form-shaped structure with defaults.
 */
export function parseRecurrenceRuleString(
    ruleString: string | null | undefined,
): RecurrenceRuleForm | null {
    if (!ruleString) return null;

    const parsed = parseRRuleString(ruleString);

    return {
        freq: parsed.freq ? parsed.freq.toUpperCase() : 'WEEKLY',
        interval: parsed.interval ?? 1,
        byDay: (parsed.byweekday ?? []).map((day) => day.toUpperCase()),
        exDates: parsed.exdate ?? [],
    };
}

/**
 * Builds an RRule string from recurrence form values.
 */
export function buildRecurrenceRuleString(
    form: RecurrenceRuleForm,
): string | null {
    const { freq, interval, byDay, exDates } = form;

    const validInterval = !!interval && interval > 0;
    const validByDay = Array.isArray(byDay) && byDay.length > 0;

    if (!freq || (!validInterval && !validByDay)) return null;

    let rule = `FREQ=${freq}`;
    if (validInterval) rule += `;INTERVAL=${interval}`;
    if (validByDay) rule += `;BYDAY=${byDay.join(',')}`;
    if (Array.isArray(exDates) && exDates.length > 0) {
        rule += `;EXDATE=${exDates.join(',')}`;
    }

    return rule;
}

/**
 * Appends a date to the EXDATE part of an RRule string.
 */
export function addExcludeDateToRule(
    rule: string | null | undefined,
    date: string,
): string {
    const rrule = rule || '';
    if (rrule.includes('EXDATE=')) {
        return rrule.replace(/EXDATE=([^;]*)/, (match, p1) => {
            const existing = p1 ? p1.split(',') : [];
            if (!existing.includes(date)) {
                existing.push(date);
            }
            return `EXDATE=${existing.join(',')}`;
        });
    }
    return rrule + (rrule ? ';' : '') + `EXDATE=${date}`;
}

/**
 * Finds the next occurrence of a recurring event at or after today,
 * preserving the original start time. Returns null when the series is
 * exhausted or no occurrence is found within the next two years.
 */
export function getNextOccurrence(
    start: string,
    ruleStr: string,
    end: string | null,
): Dayjs | null {
    const startDate = dayjs(start);
    const today = dayjs().startOf('day');

    if (startDate.isSameOrAfter(today)) return startDate;

    const rule = parseRRuleString(ruleStr);
    const rrule: RecurrenceRuleInput = {
        dtstart: start,
        until: end,
        ...rule,
    };

    const maxSearchDate = dayjs().add(2, 'year');
    let current = dayjs(today);

    while (current.isBefore(maxSearchDate)) {
        if (eventFallsOnDate(rrule, current)) {
            return current
                .hour(startDate.hour())
                .minute(startDate.minute())
                .second(startDate.second());
        }
        current = current.add(1, 'day');
    }

    return null;
}
