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
