import { inject, Injectable } from '@angular/core';
import { CalendarService } from '../../shared/calendar.service';
import { CalendarEvent } from '../../shared/models/Calendarevent';

export interface Tool {
    title: string,
    icon: string,
    route: string,
    preview: any
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
    private readonly calendarService = inject(CalendarService);

    getTools() {
        return this.defaultTools;
    }
    
    private calendarEvents: CalendarEvent[] = [];

    private readonly defaultTools: Tool[] = [
        {
            title: 'Kalender',
            icon: 'event',
            route: '/calendar',
            preview: this.calendarEvents
        },
        {
            title: 'Custom Tables',
            icon: 'list',
            route: '/custom-table',
            preview: '2 dringende Aufgaben offen'
        }
    ];


    ngOnInit() {
        this.loadEvents()
    }

    loadEvents() {
        const today = new Date().toISOString().slice(0, 10);

        this.calendarService.getEventsByRange(today, today + 1, null).subscribe(events => {
            this.calendarEvents = events;
        });
    }
}
