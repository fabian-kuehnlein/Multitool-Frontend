import type { EventInput } from '@fullcalendar/core';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { DateUtil } from '../../../shared/utilities/date.util';
import { eventFallsOnDate, RecurrenceRuleInput } from './rrule.logic';

dayjs.extend(duration);

/**
 * Expands recurring events that carry an EXDATE into individual instances,
 * because the FullCalendar RRule plugin is unreliable with EXDATE in the
 * object format. All other events pass through unchanged.
 */
export function expandEventInstances(
    events: EventInput[],
    viewStart: Dayjs,
    viewEnd: Dayjs,
): EventInput[] {
    const processedEvents: EventInput[] = [];

    for (const event of events) {
        const rrule = event.rrule as RecurrenceRuleInput | undefined;
        const exdate = event.exdate as string[] | undefined;

        if (rrule && Array.isArray(exdate) && exdate.length > 0) {
            let current = dayjs(viewStart);
            while (current.isBefore(viewEnd)) {
                if (eventFallsOnDate(rrule, current, exdate)) {
                    processedEvents.push(buildExcludedInstance(event, current));
                }
                current = current.add(1, 'day');
            }
        } else {
            processedEvents.push(event);
        }
    }

    return processedEvents;
}

function buildExcludedInstance(
    event: EventInput,
    current: Dayjs,
): EventInput {
    const instance = { ...event };
    delete instance.rrule;
    delete instance.exdate;

    if (event.allDay) {
        instance.start = DateUtil.formatApiDate(current) ?? '';
        instance.end = DateUtil.formatApiDate(DateUtil.addDays(current, 1)) ?? '';
    } else {
        const timePart = DateUtil.format(event.start, 'HH:mm:ss');
        instance.start = `${DateUtil.formatApiDate(current) ?? ''}T${timePart}`;

        const duration = event.duration as string | undefined;
        if (duration) {
            instance.end = DateUtil.formatApiDateTime(
                dayjs(instance.start as string).add(dayjs.duration(duration)),
            ) ?? undefined;
        }
    }

    return instance;
}

/**
 * Returns whether at least one event takes place on the given day, either
 * directly or as part of a recurring series.
 */
export function hasEventToday(events: EventInput[]): boolean {
    const today = DateUtil.getCurrent();
    const todayStr = DateUtil.formatApiDate(today) ?? '';

    return events.some((event) => {
        const rrule = event.rrule as RecurrenceRuleInput | undefined;
        if (rrule) return eventFallsOnDate(rrule, today);

        const start = DateUtil.formatApiDate(event.start) ?? '';
        if (start === todayStr) return true;
        if (event.end) {
            const end = DateUtil.formatApiDate(event.end) ?? '';
            return start < todayStr && end > todayStr;
        }
        return false;
    });
}

export function createTodayPlaceholder(today: Dayjs): EventInput {
    return {
        id: 'today-placeholder',
        title: 'Keine Termine geplant',
        start: DateUtil.formatApiDate(today) ?? '',
        allDay: true,
        display: 'list-item',
        extendedProps: { isPlaceholder: true },
    };
}

/**
 * Drops events that ended before today and clips all-day events that started
 * earlier to today.
 */
export function filterPastEvents(
    events: EventInput[],
    today: Dayjs,
): EventInput[] {
    const todayStart = today.startOf('day');
    const filtered: EventInput[] = [];

    for (const event of events) {
        const rrule = event.rrule as RecurrenceRuleInput | undefined;

        // Recurring events: Only drop the series when its recurrence has fully ended.
        if (rrule) {
            if (
                rrule.until &&
                dayjs(rrule.until).startOf('day').isBefore(todayStart)
            ) {
                continue;
            }
            filtered.push(event);
            continue;
        }

        const eventStart = dayjs(event.start as string);
        const eventEnd = dayjs((event.end || event.start) as string);

        if (eventEnd.isBefore(todayStart)) continue;

        if (event.allDay && eventStart.isBefore(todayStart)) {
            filtered.push({
                ...event,
                start: DateUtil.formatApiDate(todayStart) ?? '',
            });
        } else {
            filtered.push(event);
        }
    }

    return filtered;
}

export function toHolidayEventInput(
    name: string,
    date: string,
    index: number,
): EventInput {
    return {
        id: `holiday-${index}`,
        start: DateUtil.formatApiDate(date) ?? '',
        end: DateUtil.formatApiDate(DateUtil.addDays(date, 1)) ?? '',
        display: 'background',
        title: name,
    };
}
