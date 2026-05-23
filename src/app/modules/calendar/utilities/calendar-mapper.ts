import { EventInput } from '@fullcalendar/core';
import { CalendarEvent } from '../models/calendar-event.model';
import { Category } from '../models/category.model';
import moment from 'moment';

export class CalendarMapper {
    static toEventInput(event: CalendarEvent, categories: Category[]): EventInput {
        const category = categories.find(c => String(c.id) === String(event.categoryId));
        const color = category?.color || '#1976d2';

        const input: EventInput = {
            id: event.id,
            title: event.title,
            start: new Date(event.startDateTime || ''),
            end: new Date(event.endDateTime || ''),
            allDay: event.isAllDay,
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
                eventNote: event.note || '',
                categoryId: event.categoryId,
                categoryColor: color,
                recurrenceRule: event.recurrenceRule,
                recurrenceEnd: event.recurrenceEnd
            }
        };

        if (event.recurrenceRule) {
            input['rrule'] = {
                dtstart: event.startDateTime,
                until: event.recurrenceEnd ?? undefined,
                ...this.parseRRuleString(event.recurrenceRule)
            };
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
            }
        }

        return rule;
    }

    static getDuration(start: string | null | undefined, end: string | null | undefined): string {
        if (!start || !end) return '';

        const startMoment = moment(start);
        const endMoment = moment(end);

        if (!startMoment.isValid() || !endMoment.isValid()) return '';

        return moment.duration(endMoment.diff(startMoment)).toISOString();
    }
}
