import dayjs, { type ConfigType, type Dayjs } from 'dayjs';

/**
 * Input accepted by every `DateUtil` method: anything dayjs can parse, plus
 * FullCalendar's date arrays (`[year, month, day, hours, minutes, seconds]`).
 */
export type DateValue = ConfigType | number[];

/** API datetime for the database (`timestamp without time zone`). */
export const API_DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
/** API date without time. */
export const API_DATE_FORMAT = 'YYYY-MM-DD';
/** User-facing date. */
export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY';
/** User-facing date with time. */
export const DISPLAY_DATE_TIME_FORMAT = 'DD.MM.YYYY HH:mm';
/** User-facing time. */
export const DISPLAY_TIME_FORMAT = 'HH:mm';
/** User-facing day and month (e.g. for week cards). */
export const DISPLAY_DAY_MONTH_FORMAT = 'DD.MM';

/**
 * Parses any supported value into a dayjs instance.
 *
 * Returns `null` for empty or invalid input. FullCalendar arrays are converted
 * to a local `Date` first, because dayjs does not understand that shape.
 */
function parse(value: DateValue): Dayjs | null {
    if (value === null || value === undefined || value === '') return null;

    // FullCalendar date arrays: [year, month (0-based), day, hours, minutes, seconds]
    if (Array.isArray(value)) {
        const [year, month, day = 1, hours = 0, minutes = 0, seconds = 0] = value;
        const parsed = dayjs(new Date(year, month, day, hours, minutes, seconds));
        return parsed.isValid() ? parsed : null;
    }

    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
}

/** Returns the current date and time as a dayjs instance. */
function getCurrent(): Dayjs {
    return dayjs();
}

/**
 * Returns the current local date/time formatted for API payloads
 * (`YYYY-MM-DDTHH:mm:ss`).
 */
function getCurrentApiDateTime(): string {
    return getCurrent().format(API_DATE_TIME_FORMAT);
}

/** Returns today's local date formatted as `YYYY-MM-DD`. */
function getCurrentApiDate(): string {
    return getCurrent().format(API_DATE_FORMAT);
}

/**
 * Formats a value with an arbitrary dayjs pattern.
 *
 * Returns an empty string when the value cannot be parsed. Use this for
 * one-off display patterns; the named helpers below cover the common cases.
 */
function format(value: DateValue, pattern: string): string {
    return parse(value)?.format(pattern) ?? '';
}

/**
 * Formats a value as a floating API datetime (`YYYY-MM-DDTHH:mm:ss`).
 *
 * The result has no timezone offset, matching the DB columns
 * (`timestamp without time zone`). Returns `null` when parsing fails.
 */
function formatApiDateTime(value: DateValue): string | null {
    return parse(value)?.format(API_DATE_TIME_FORMAT) ?? null;
}

/**
 * Formats a value as an API date (`YYYY-MM-DD`).
 *
 * Returns `null` when parsing fails. Use for date-only API fields and
 * FullCalendar dates.
 */
function formatApiDate(value: DateValue): string | null {
    return parse(value)?.format(API_DATE_FORMAT) ?? null;
}

/**
 * Formats a value with the local timezone offset (`YYYY-MM-DDTHH:mm:ssZ`).
 *
 * Only for the iCal export endpoint, which needs the offset to convert the
 * wall-clock time to UTC. Do not use this for normal API payloads.
 */
function formatIcalDateTime(value: DateValue): string | null {
    return parse(value)?.format(`${API_DATE_TIME_FORMAT}Z`) ?? null;
}

/** Formats a value as a user-facing date (`DD.MM.YYYY`). */
function formatDisplayDate(value: DateValue): string {
    return format(value, DISPLAY_DATE_FORMAT);
}

/** Formats a value as a user-facing date with time (`DD.MM.YYYY HH:mm`). */
function formatDisplayDateTime(value: DateValue): string {
    return format(value, DISPLAY_DATE_TIME_FORMAT);
}

/** Formats a value as a user-facing time (`HH:mm`). */
function formatDisplayTime(value: DateValue): string {
    return format(value, DISPLAY_TIME_FORMAT);
}

/** Formats a value as day and month (`DD.MM`). */
function formatDayMonth(value: DateValue): string {
    return format(value, DISPLAY_DAY_MONTH_FORMAT);
}

/**
 * Returns the German month name for a one-based month number.
 *
 * @param month Month from `1` (January) to `12` (December).
 */
function formatMonthName(year: number, month: number): string {
    const value = `${year}-${String(month).padStart(2, '0')}-01`;
    return format(value, 'MMMM');
}

/**
 * Formats the Monday–Friday range of the week containing `startDate`
 * (e.g. `13.01. – 17.01.2026`).
 */
function formatWeekRange(startDate: DateValue): string {
    const start = parse(startDate);
    if (!start) return '';

    const end = start.add(4, 'day');
    return `${start.format('DD.MM.')} – ${end.format(DISPLAY_DATE_FORMAT)}`;
}

/**
 * Combines the calendar date of `date` with the hours and minutes of `time`.
 *
 * A missing or invalid time yields the start of the day. Seconds and
 * milliseconds are always reset to zero.
 */
function combineDateAndTime(date: DateValue, time: DateValue): Dayjs | null {
    const parsedDate = parse(date);
    if (!parsedDate) return null;

    const parsedTime = parse(time);
    if (!parsedTime) return parsedDate.startOf('day');

    return parsedDate
        .hour(parsedTime.hour())
        .minute(parsedTime.minute())
        .second(0)
        .millisecond(0);
}

/** Returns `true` when the time is missing or exactly `00:00`. */
function isUnsetTime(time: DateValue): boolean {
    const parsed = parse(time);
    if (!parsed) return true;
    return parsed.hour() === 0 && parsed.minute() === 0;
}

/** Returns `true` when both values fall on the same calendar day (time ignored). */
function isSameDay(a: DateValue, b: DateValue): boolean {
    const first = parse(a);
    const second = parse(b);
    return !!first && !!second && first.isSame(second, 'day');
}

/**
 * Returns `true` when `a` is on an earlier calendar day than `b`.
 *
 * Compares the date part only, so `a = 12:00` and `b = 08:00` on the same day
 * are not "before". For an exact timestamp comparison use `isBefore`.
 */
function isBeforeDay(a: DateValue, b: DateValue): boolean {
    const first = parse(a);
    const second = parse(b);
    return !!first && !!second && first.isBefore(second, 'day');
}

/**
 * Returns `true` when `a` is on a later calendar day than `b`.
 *
 * Compares the date part only. For an exact timestamp comparison use
 * `isAfter`.
 */
function isAfterDay(a: DateValue, b: DateValue): boolean {
    const first = parse(a);
    const second = parse(b);
    return !!first && !!second && first.isAfter(second, 'day');
}

/**
 * Returns `true` when `a` is strictly before `b`, including the time of day.
 *
 * Same day at an earlier time counts as before. For a day-only comparison use
 * `isBeforeDay`.
 */
function isBefore(a: DateValue, b: DateValue): boolean {
    const first = parse(a);
    const second = parse(b);
    return !!first && !!second && first.isBefore(second);
}

/**
 * Returns `true` when `a` is strictly after `b`, including the time of day.
 *
 * Same day at a later time counts as after. For a day-only comparison use
 * `isAfterDay`.
 */
function isAfter(a: DateValue, b: DateValue): boolean {
    const first = parse(a);
    const second = parse(b);
    return !!first && !!second && first.isAfter(second);
}

/** Returns `true` when the value is on today's calendar day. */
function isToday(value: DateValue): boolean {
    return isSameDay(value, getCurrent());
}

/** Returns the start of the calendar day (`00:00:00.000`) or `null`. */
function startOfDay(value: DateValue): Dayjs | null {
    return parse(value)?.startOf('day') ?? null;
}

/** Returns the first day of the month at `00:00:00.000` or `null`. */
function startOfMonth(value: DateValue): Dayjs | null {
    return parse(value)?.startOf('month') ?? null;
}

/**
 * Returns a copy shifted by `days` (negative values move backwards) or `null`.
 */
function addDays(value: DateValue, days: number): Dayjs | null {
    return parse(value)?.add(days, 'day') ?? null;
}

/**
 * Converts a value to a native `Date` for library interop (Material
 * datepicker, FullCalendar) or `null`.
 */
function toDate(value: DateValue): Date | null {
    return parse(value)?.toDate() ?? null;
}

/**
 * Returns a native `Date` anchored to `0000-01-01` with the hours and minutes
 * of the value.
 *
 * Intended for time-only form controls (Material timepicker), where the date
 * part is irrelevant.
 */
function toTimeDate(value: DateValue): Date | null {
    const parsed = parse(value);
    if (!parsed) return null;
    return new Date(0, 0, 0, parsed.hour(), parsed.minute());
}

/**
 * Converts a value to a native `Date`, treating it as local wall-clock time.
 *
 * A trailing `Z` is stripped before parsing so API timestamps are not shifted
 * by the local UTC offset. Non-string values are delegated to `toDate`.
 */
function parseAsLocalDate(value: DateValue): Date | null {
    if (typeof value !== 'string') return toDate(value);

    const cleanValue = value.endsWith('Z') ? value.slice(0, -1) : value;
    return toDate(cleanValue);
}

/**
 * Sort comparator for nullable dates: earlier values first, `null` last.
 *
 * Returns `0` when both values are invalid, so it stays a valid comparator.
 */
function compare(a: DateValue, b: DateValue): number {
    const first = parse(a);
    const second = parse(b);

    if (!first && !second) return 0;
    if (!first) return 1;
    if (!second) return -1;

    return first.valueOf() - second.valueOf();
}

/** Returns the Monday of the ISO week as `YYYY-MM-DD`, or `''`. */
function getWeekStart(value: DateValue = getCurrent()): string {
    return parse(value)?.startOf('isoWeek').format(API_DATE_FORMAT) ?? '';
}

/** Returns the Sunday of the ISO week as `YYYY-MM-DD`, or `''`. */
function getWeekEnd(value: DateValue = getCurrent()): string {
    return parse(value)?.endOf('isoWeek').format(API_DATE_FORMAT) ?? '';
}

/** Returns the ISO week number (`1`–`53`), or `0` when parsing fails. */
function getIsoWeek(value: DateValue = getCurrent()): number {
    return parse(value)?.isoWeek() ?? 0;
}

export const DateUtil = {
    getCurrent,
    getCurrentApiDateTime,
    getCurrentApiDate,
    parse,
    format,
    formatApiDateTime,
    formatApiDate,
    formatIcalDateTime,
    formatDisplayDate,
    formatDisplayDateTime,
    formatDisplayTime,
    formatDayMonth,
    formatMonthName,
    formatWeekRange,
    combineDateAndTime,
    isUnsetTime,
    isSameDay,
    isBeforeDay,
    isAfterDay,
    isBefore,
    isAfter,
    isToday,
    startOfDay,
    startOfMonth,
    addDays,
    toDate,
    toTimeDate,
    parseAsLocalDate,
    compare,
    getWeekStart,
    getWeekEnd,
    getIsoWeek,
} as const;
