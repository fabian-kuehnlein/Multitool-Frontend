import { CalendarOptions } from "@fullcalendar/core/index.js";
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';
import deLocale from '@fullcalendar/core/locales/de-at';

export const defaultCalendarOptions: CalendarOptions = {
    plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
        rrulePlugin
    ],
    locales: [deLocale],
    eventContent: (arg) => {
        const { event } = arg;

        if (event.display === 'background') {
            return {
                html: `<div class="fc-event-background">${event.title}</div>`
            }
        }

        const isAllDay = event.allDay;
        const note = event.extendedProps['eventNote'] || '';
        const categoryId = event.extendedProps['categoryId'];

        const start = event.start ? new Date(event.start) : null;
        const end = event.end ? new Date(event.end) : null;

        const startStr = start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr = end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const timeDisplay = isAllDay
            ? ''
            : startStr
                ? endStr
                    ? `${startStr} – ${endStr}`
                    : `${startStr}`
                : '';

        return {
            html: `
                <div class="fc-event-material category-${categoryId}">
                    <div class="fc-event-title">${event.title}</div>
                    <div class="fc-event-time">${timeDisplay}</div>
                    ${note ? `<div class="fc-event-note">${note}</div>` : ''}
                </div>
            `
        }
    },
    headerToolbar: false,
    initialView: 'dayGridMonth',
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    contentHeight: 900,
    fixedWeekCount: false,
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit'
    },
    dayCellDidMount: (arg) => {
        const today = new Date();
        const cellDate = arg.date;

        if (cellDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
            arg.el.classList.add('past-date')
        }
    },
    eventDidMount: ({ event, el }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const end = event.end
            ? new Date(event.end)
            : event.start 
                ? new Date(event.start)
                : new Date();
        end.setHours(0, 0, 0, 0);

        if (end.getTime() < today.getTime()) {
            el.classList.add('past-event');
        }
    }
}