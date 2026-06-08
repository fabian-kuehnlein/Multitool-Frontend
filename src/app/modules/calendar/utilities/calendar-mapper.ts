import { EventInput } from '@fullcalendar/core';
import { CalendarEvent } from '../models/calendar-event.model';
import { Category } from '../models/category.model';
import moment from 'moment';

export class CalendarMapper {
    static toEventInput(event: CalendarEvent, categories: Category[]): EventInput {
        const category = categories.find(c => String(c.id) === String(event.categoryId));
        const color = category?.color || '#1976d2';

        // Helper to strip 'Z' and ensure we parse as local time
        const parseAsLocal = (dateStr: string | null | undefined) => {
            if (!dateStr) return undefined;
            // Remove 'Z' if present to prevent UTC conversion by the browser
            const cleanStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
            return moment(cleanStr).toDate();
        };

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
                recurrenceEnd: parseAsLocal(event.recurrenceEnd)
            }
        };

        if (event.recurrenceRule) {
            const parsedRule = this.parseRRuleString(event.recurrenceRule);
            const { exdate, ...rruleOptions } = parsedRule;

            input['rrule'] = {
                dtstart: event.startDateTime?.replace('Z', ''), 
                until: event.recurrenceEnd?.replace('Z', '') ?? undefined,
                ...rruleOptions
            };

            if (exdate) {
                input['exdate'] = exdate;
            }

            input['duration'] = this.getDuration(event.startDateTime, event.endDateTime);
        }

        return input;
    }

    static parseRRuleString(rrule: string): Record<string, any> {
        const parts = rrule.split(';');
        const rule: any = {};

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
                    rule.byweekday = value.split(',').map(day => day.toLowerCase());
                    break;
                case 'EXDATE':
                    rule.exdate = value.split(',');
                    break;
            }
        }

        return rule;
    }

    /**
     * Checks if a recurring event (defined by its rrule object) falls on a specific date.
     */
    static eventFallsOnDate(rrule: any, date: moment.Moment): boolean {
        const dateStr = date.format('YYYY-MM-DD');
        const dtstart = moment(rrule.dtstart).startOf('day');
        const targetDate = moment(date).startOf('day');

        // Before start date
        if (targetDate.isBefore(dtstart)) return false;

        // After until date
        if (rrule.until && targetDate.isAfter(moment(rrule.until).startOf('day'))) return false;

        // Check EXDATE
        if (rrule.exdate && Array.isArray(rrule.exdate)) {
            if (rrule.exdate.some((ex: string) => moment(ex).format('YYYY-MM-DD') === dateStr)) {
                return false;
            }
        }

        const freq = rrule.freq;
        const interval = rrule.interval || 1;

        if (freq === 'daily') {
            const diff = targetDate.diff(dtstart, 'days');
            return diff % interval === 0;
        }

        if (freq === 'weekly') {
            const weeksBetween = Math.floor(targetDate.diff(dtstart, 'days') / 7);
            if (weeksBetween % interval !== 0) return false;

            if (rrule.byweekday && Array.isArray(rrule.byweekday)) {
                const dayName = targetDate.format('dd').toLowerCase();
                return rrule.byweekday.includes(dayName);
            }
            return targetDate.day() === dtstart.day();
        }

        if (freq === 'monthly') {
            const diff = targetDate.diff(dtstart, 'months');
            if (diff % interval !== 0) return false;
            return targetDate.date() === dtstart.date();
        }

        if (freq === 'yearly') {
            const diff = targetDate.diff(dtstart, 'years');
            if (diff % interval !== 0) return false;
            return targetDate.date() === dtstart.date() && targetDate.month() === dtstart.month();
        }

        return false;
    }

    static getDuration(start: string | null | undefined, end: string | null | undefined): string {
        if (!start || !end) return '';

        const startMoment = moment(start);
        const endMoment = moment(end);

        if (!startMoment.isValid() || !endMoment.isValid()) return '';

        return moment.duration(endMoment.diff(startMoment)).toISOString();
    }

    /**
     * Maps a FullCalendar event object to the structure expected by the EventDialogComponent.
     */
    static fromFullCalendarEvent(event: any): any {
        return {
            eventId: event.id,
            eventTitle: event.title,
            eventNote: event.extendedProps['eventNote'] || null,
            startDateTime: event.start,
            endDateTime: event.end
                ? (event.allDay ? moment(event.end).subtract(1, 'day').toDate() : new Date(event.end))
                : (event.extendedProps['recurrenceRule'] ? event.start : null),
            isAllDay: event.allDay,
            categoryId: event.extendedProps['categoryId']?.toString() ?? null,
            recurrenceRule: event.extendedProps['recurrenceRule'] ?? null,
            recurrenceEnd: event.extendedProps['recurrenceEnd'] ?? null
        };
    }

    /**
     * Maps a FullCalendar event object to our internal CalendarEvent model.
     */
    static toCalendarEvent(event: any): CalendarEvent {
        return {
            id: event.id,
            title: event.title,
            note: event.extendedProps['eventNote']?.trim() || null,
            startDateTime: moment(event.start).format('YYYY-MM-DDTHH:mm:ss'),
            endDateTime: event.end ? moment(event.end).format('YYYY-MM-DDTHH:mm:ss') : moment(event.start).format('YYYY-MM-DDTHH:mm:ss'),
            isAllDay: event.allDay,
            categoryId: event.extendedProps['categoryId'] || ''
        };
    }
}
