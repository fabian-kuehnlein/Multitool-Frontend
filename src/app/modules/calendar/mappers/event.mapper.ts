import { EventApi, EventInput } from '@fullcalendar/core';
import dayjs from 'dayjs';
import { CalendarEvent } from '../models/calendar-event.model';
import { Category } from '../../../shared/models/category.model';
import { getDuration, parseRRuleString } from '../logic/rrule.logic';

export interface FullCalendarEventInput {
    eventId: string;
    eventTitle: string;
    eventNote: string | null;
    startDateTime: Date | null;
    endDateTime: Date | null;
    isAllDay: boolean;
    categoryId: string | null;
    recurrenceRule: string | null;
    recurrenceEnd: string | null;
    isTodo: boolean;
}

function parseAsLocal(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr) return undefined;
    // Remove 'Z' if present to prevent UTC conversion by the browser
    const cleanStr = dateStr.endsWith('Z')
        ? dateStr.slice(0, -1)
        : dateStr;
    return dayjs(cleanStr).toDate();
}

export function toEventInput(
    event: CalendarEvent,
    categories: Category[],
): EventInput {
    const category = categories.find(
        (c) => String(c.id) === String(event.categoryId),
    );
    const color = category?.color || '#1976d2';

    const input: EventInput = {
        id: event.id,
        title: event.title,
        start: parseAsLocal(event.startDateTime),
        end: parseAsLocal(event.endDateTime),
        allDay: event.isAllDay,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
            eventNote: event.note || '',
            categoryId: event.categoryId,
            categoryColor: color,
            recurrenceRule: event.recurrenceRule,
            recurrenceEnd: parseAsLocal(event.recurrenceEnd),
            isTodo: event.isTodo || false,
        },
    };

    if (event.recurrenceRule) {
        const parsedRule = parseRRuleString(event.recurrenceRule);
        const { exdate, ...rruleOptions } = parsedRule;

        input['rrule'] = {
            dtstart: event.startDateTime?.replace('Z', ''),
            until: event.recurrenceEnd?.replace('Z', '') ?? undefined,
            ...rruleOptions,
        };

        if (exdate) {
            input['exdate'] = exdate;
        }

        input['duration'] = getDuration(
            event.startDateTime,
            event.endDateTime,
        );
    }

    return input;
}

export function fromFullCalendarEvent(
    event: EventApi,
): FullCalendarEventInput {
    return {
        eventId: event.id,
        eventTitle: event.title,
        eventNote: event.extendedProps['eventNote'] || null,
        startDateTime: event.start,
        endDateTime: event.end
            ? event.allDay
                ? dayjs(event.end).subtract(1, 'day').toDate()
                : new Date(event.end)
            : event.extendedProps['recurrenceRule']
              ? event.start
              : null,
        isAllDay: event.allDay,
        categoryId: event.extendedProps['categoryId']?.toString() ?? null,
        recurrenceRule: event.extendedProps['recurrenceRule'] ?? null,
        recurrenceEnd: event.extendedProps['recurrenceEnd'] ?? null,
        isTodo: event.extendedProps['isTodo'] ?? false,
    };
}

export function toCalendarEvent(event: EventApi): CalendarEvent {
    return {
        id: event.id,
        title: event.title,
        note: event.extendedProps['eventNote']?.trim() || null,
        startDateTime: dayjs(event.start).format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: event.end
            ? dayjs(event.end).format('YYYY-MM-DDTHH:mm:ss')
            : dayjs(event.start).format('YYYY-MM-DDTHH:mm:ss'),
        isAllDay: event.allDay,
        categoryId: event.extendedProps['categoryId'] || '',
    };
}
