import { EventApi, EventInput } from '@fullcalendar/core';
import { CalendarEvent } from '../models';
import { Category } from '../../../shared/models/category.model';
import { DateUtil } from '../../../shared/utilities/date.util';
import { getDuration, parseRRuleString } from '../logic/rrule.logic';

export interface FullCalendarEventInput {
    eventId: string;
    eventTitle: string;
    eventNote: string | null;
    startDateTime: Date | null;
    endDateTime: Date | null;
    isAllDay: boolean;
    categoryId: number | null;
    recurrenceRule: string | null;
    recurrenceEnd: string | null;
    isTodo: boolean;
    seriesStartDateTime?: Date | null;
    seriesEndDateTime?: Date | null;
}

function parseAsLocal(dateStr: string | null | undefined): Date | undefined {
    return DateUtil.parseAsLocalDate(dateStr) ?? undefined;
}

export function toEventInput(
    event: CalendarEvent,
    categories: Category[],
): EventInput {
    const category = categories.find(
        (c) => c.id === event.categoryId,
    );
    const color = category?.color || 'var(--mat-sys-primary)';

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
            seriesStartDateTime: parseAsLocal(event.startDateTime),
            seriesEndDateTime: parseAsLocal(event.endDateTime),
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
    const seriesEnd = event.extendedProps['seriesEndDateTime'] as
        | Date
        | null
        | undefined;
    const seriesEndDateTime = seriesEnd
        ? event.allDay
            ? DateUtil.toDate(DateUtil.addDays(seriesEnd, -1))
            : DateUtil.toDate(seriesEnd)
        : null;

    const endDateTime = event.end
        ? event.allDay
            ? DateUtil.toDate(DateUtil.addDays(event.end, -1))
            : DateUtil.toDate(event.end)
        : event.extendedProps['recurrenceRule']
          ? event.start
          : seriesEndDateTime;

    return {
        eventId: event.id,
        eventTitle: event.title,
        eventNote: event.extendedProps['eventNote'] || null,
        startDateTime: event.start,
        endDateTime,
        isAllDay: event.allDay,
        categoryId: event.extendedProps['categoryId'] ?? null,
        recurrenceRule: event.extendedProps['recurrenceRule'] ?? null,
        recurrenceEnd: event.extendedProps['recurrenceEnd'] ?? null,
        isTodo: event.extendedProps['isTodo'] ?? false,
        seriesStartDateTime:
            event.extendedProps['seriesStartDateTime'] ?? null,
        seriesEndDateTime,
    };
}

export function toCalendarEvent(event: EventApi): CalendarEvent {
    return {
        id: event.id,
        title: event.title,
        note: event.extendedProps['eventNote']?.trim() || null,
        startDateTime: DateUtil.formatApiDateTime(event.start),
        endDateTime: DateUtil.formatApiDateTime(event.end ?? event.start),
        isAllDay: event.allDay,
        categoryId: event.extendedProps['categoryId'] ?? null,
    };
}
