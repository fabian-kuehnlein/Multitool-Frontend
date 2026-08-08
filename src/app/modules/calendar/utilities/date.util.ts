import dayjs, { Dayjs } from 'dayjs';

/**
 * Combines a date with an optional time. Without a time, the result is the start of the day.
 */
export function combineDateAndTime(
    date: Date,
    time: Date | null | undefined,
): Dayjs | null {
    if (!date) return null;
    const result = dayjs(date);
    if (!time) return result.startOf('day');
    const timeMoment = dayjs(time);
    return result
        .hour(timeMoment.hour())
        .minute(timeMoment.minute())
        .second(0)
        .millisecond(0);
}

/**
 * Treats a missing time or midnight (00:00) as an unset time.
 */
export function isUnsetTime(time: Date | null | undefined): boolean {
    if (!time) return true;
    return time.getHours() === 0 && time.getMinutes() === 0;
}

/**
 * Formats a date and optional time into an ISO string.
 */
export function formatDate(
    date: Date | null,
    time?: Date | null,
    options: {
        isAllDay?: boolean;
        isRecurring?: boolean;
        addDay?: boolean;
        fallbackDate?: Date | null;
    } = {},
): string | null {
    const {
        isAllDay = false,
        isRecurring = false,
        addDay = false,
        fallbackDate = null,
    } = options;
    const finalDate = date ?? fallbackDate;

    if (!finalDate) return null;

    let result: Dayjs;

    if (isAllDay || isRecurring) {
        result = dayjs(finalDate);
        if (isAllDay && addDay) {
            result = result.add(1, 'day');
        }
        result = result.startOf('day');
    } else {
        result = combineDateAndTime(finalDate, time) ?? dayjs(finalDate);
    }

    return result.format('YYYY-MM-DDTHH:mm:ss');
}
