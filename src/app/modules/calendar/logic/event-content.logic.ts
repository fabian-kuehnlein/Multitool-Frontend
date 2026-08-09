import type {
    DayCellContentArg,
    EventContentArg,
    EventMountArg,
} from '@fullcalendar/core';
import dayjs from 'dayjs';
import { createElement } from '../../../shared/utilities/dom.util';

export interface EventContentResult {
    domNodes: HTMLElement[];
}

function createEventIcon(icon: string): HTMLElement {
    return createElement('span', {
        className: 'material-symbols-outlined fc-event-icon',
        text: icon,
    });
}

function getTimeDisplay(
    start: Date | null,
    end: Date | null,
    isAllDay: boolean,
): string {
    if (isAllDay || !start) return '';
    const startStr = dayjs(start).format('HH:mm');
    return end ? `${startStr} – ${dayjs(end).format('HH:mm')}` : startStr;
}

export function buildEventContent(arg: EventContentArg): EventContentResult {
    const { event, view } = arg;
    const isListView = view.type.includes('list');

    if (event.display === 'background') {
        const title = event.title || '';
        return {
            domNodes: [
                createElement('div', {
                    className: 'fc-event-background',
                    text: title,
                    title,
                }),
            ],
        };
    }

    const isAllDay = event.allDay;
    const isTodo = !!event.extendedProps['isTodo'];
    const isRecurring = !!event.extendedProps['recurrenceRule'];
    const note = event.extendedProps['eventNote'] || '';
    const title = event.title || '';

    const titleEl = createElement('div', { className: 'fc-event-title' });
    if (isTodo) titleEl.append(createEventIcon('task_alt'));
    if (isRecurring) titleEl.append(createEventIcon('sync'));
    titleEl.append(document.createTextNode(title));

    if (isListView) {
        const container = createElement('div', {
            className: 'fc-list-event-custom',
        });
        container.append(titleEl);
        if (note) {
            container.append(
                createElement('div', {
                    className: 'fc-event-note',
                    text: note,
                }),
            );
        }
        return { domNodes: [container] };
    }

    const content = createElement('div', {
        className: 'fc-event-main-content',
    });
    content.append(titleEl);

    const timeDisplay = getTimeDisplay(event.start, event.end, isAllDay);
    if (timeDisplay) {
        content.append(
            createElement('div', {
                className: 'fc-event-time',
                text: timeDisplay,
            }),
        );
    }
    if (note) {
        content.append(
            createElement('div', {
                className: 'fc-event-note',
                text: note,
            }),
        );
    }

    return { domNodes: [content] };
}

export function getDayCellClassNames(arg: DayCellContentArg): string[] {
    const today = dayjs().startOf('day');
    return dayjs(arg.date).startOf('day').isBefore(today)
        ? ['past-date']
        : [];
}

export function applyEventMount(arg: EventMountArg): void {
    const { event, el, view } = arg;
    const categoryColor = event.extendedProps['categoryColor'];
    const isListView = view.type.includes('list');
    const isPlaceholder = event.extendedProps['isPlaceholder'];

    if (isPlaceholder) {
        el.style.fontStyle = 'italic';
        el.style.opacity = '0.7';
        el.style.pointerEvents = 'none';
        const dot = el.querySelector('.fc-list-event-dot') as HTMLElement | null;
        if (dot) dot.style.display = 'none';
        return;
    }

    if (categoryColor) {
        if (isListView) {
            const dot = el.querySelector(
                '.fc-list-event-dot',
            ) as HTMLElement | null;
            if (dot) {
                dot.style.borderColor = categoryColor;
                dot.style.backgroundColor = categoryColor;
            }
            el.style.setProperty('--event-color', categoryColor);
        } else {
            el.style.backgroundColor = categoryColor;
            el.style.borderColor = categoryColor;
        }
    }

    const end = event.end
        ? dayjs(event.end)
        : event.start
          ? dayjs(event.start)
          : dayjs();

    if (end.startOf('day').isBefore(dayjs().startOf('day'))) {
        el.classList.add('past-event');
        el.style.opacity = '0.6';
    }
}
