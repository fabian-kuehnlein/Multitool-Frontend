import type { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import deLocale from '@fullcalendar/core/locales/de-at';
import {
    applyEventMount,
    buildEventContent,
    getDayCellClassNames,
} from '../logic/event-content.logic';
import { weekdayOptions, frequencyLabels } from '../../../shared/utilities/recurrence.config';
import type {
    RecurrenceFrequency,
    Weekday,
    WeekdayOption,
} from '../../../shared/utilities/recurrence.config';

export type {
    RecurrenceFrequency,
    Weekday,
    WeekdayOption,
};
export { weekdayOptions, frequencyLabels };

export type CalendarAction =
    | 'today'
    | 'prev'
    | 'prevYear'
    | 'next'
    | 'nextYear'
    | 'changeMonth'
    | 'changeWeek'
    | 'changeDay';

export const defaultCalendarOptions: CalendarOptions = {
    plugins: [
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        rrulePlugin,
    ],
    locales: [deLocale],
    locale: 'de',
    timeZone: 'local',
    headerToolbar: false,
    initialView: 'dayGridMonth',
    firstDay: 1,
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    height: '100%',
    fixedWeekCount: false,
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
    },
    eventContent: buildEventContent,
    dayCellClassNames: getDayCellClassNames,
    eventDidMount: applyEventMount,
};
