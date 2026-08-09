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

export type CalendarAction =
    | 'today'
    | 'prev'
    | 'prevYear'
    | 'next'
    | 'nextYear'
    | 'changeMonth'
    | 'changeWeek'
    | 'changeDay';

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface WeekdayOption {
    value: Weekday;
    label: string;
}

export const weekdayOptions: WeekdayOption[] = [
    { value: 'MO', label: 'Montag' },
    { value: 'TU', label: 'Dienstag' },
    { value: 'WE', label: 'Mittwoch' },
    { value: 'TH', label: 'Donnerstag' },
    { value: 'FR', label: 'Freitag' },
    { value: 'SA', label: 'Samstag' },
    { value: 'SU', label: 'Sonntag' },
];

export const frequencyLabels: Record<RecurrenceFrequency, string> = {
    DAILY: 'Tage',
    WEEKLY: 'Wochen',
    MONTHLY: 'Monate',
    YEARLY: 'Jahre',
};

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
