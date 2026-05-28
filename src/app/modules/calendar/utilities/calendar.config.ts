import { CalendarOptions } from "@fullcalendar/core/index.js";
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import deLocale from '@fullcalendar/core/locales/de-at';

export const defaultCalendarOptions: CalendarOptions = {
    plugins: [
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        rrulePlugin
    ],
    locales: [deLocale],
    locale: 'de',
    timeZone: 'local',
    eventContent: (arg) => {
        const { event, view } = arg;
        const isListView = view.type.includes('list');

        if (event.display === 'background') {
            return {
                html: `<div class="fc-event-background" title="${event.title || ''}">${event.title || ''}</div>`
            }
        }

        const isAllDay = event.allDay;
        const note = event.extendedProps['eventNote'] || '';

        const start = event.start ? new Date(event.start) : null;
        const end = event.end ? new Date(event.end) : null;

        const startStr = start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr = end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const timeDisplay = isAllDay
            ? 'Ganztägig'
            : startStr
                ? endStr
                    ? `${startStr} – ${endStr}`
                    : `${startStr}`
                : '';

        if (isListView) {
            return {
                html: `
                    <div class="fc-list-event-custom">
                        <div class="fc-event-title" style="font-weight: 600; color: #333;">${event.title || ''}</div>
                        ${note ? `<div class="fc-event-note" style="font-size: 0.85rem; font-style: italic; color: #888; margin-top: 2px;">${note}</div>` : ''}
                    </div>
                `
            };
        }

        return {
            html: `
                <div class="fc-event-main-content">
                    <div class="fc-event-title">${event.title || ''}</div>
                    ${timeDisplay ? `<div class="fc-event-time">${timeDisplay}</div>` : ''}
                    ${note ? `<div class="fc-event-note">${note}</div>` : ''}
                </div>
            `
        }
    },
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
        minute: '2-digit'
    },
    dayCellClassNames: (arg) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const cellDate = new Date(arg.date);
        cellDate.setHours(0, 0, 0, 0);

        if (cellDate.getTime() < today.getTime()) {
            return ['past-date'];
        }
        return [];
    },
    eventDidMount: ({ event, el, view }) => {
        const categoryColor = event.extendedProps['categoryColor'];
        const isListView = view.type.includes('list');

        if (categoryColor) {
            if (isListView) {
                // Apply color to the dot and a left border
                const dot = el.querySelector('.fc-list-event-dot') as HTMLElement;
                if (dot) {
                    dot.style.borderColor = categoryColor;
                    dot.style.backgroundColor = categoryColor;
                }
                
                // For our custom indicator
                el.style.setProperty('--event-color', categoryColor);
            } else {
                el.style.backgroundColor = categoryColor;
                el.style.borderColor = categoryColor;
                el.style.color = '#fff';
            }
        }

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
            el.style.opacity = '0.6';
        }
    }
}