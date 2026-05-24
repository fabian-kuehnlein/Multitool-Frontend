import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { CalendarHttpService } from './calendar-http.service';
import { Category } from '../models/category.model';
import { CalendarEvent } from '../models/calendar-event.model';
import { CreateCalendarEvent } from '../models/create-calendar-event.model';
import { Holiday } from '../models/holiday.model';
import { SearchResult } from '../models/search-result.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
    private readonly httpService = inject(CalendarHttpService);

    private readonly _categories = signal<Category[]>([]);
    public readonly categories = this._categories.asReadonly();

    private readonly _events = signal<CalendarEvent[]>([]);
    public readonly events = this._events.asReadonly();

    private readonly holidayCache = new Map<string, Holiday[]>();

    constructor() {
        setInterval(() => {
            this.loadCategories();
        }, 60000); // Refresh categories every minute
        this.loadCategories();
    }

    private loadCategories(): void {
        this.httpService.getCategories().subscribe(
            categories => this._categories.set(categories)
        );
    }

    getEvents(startDate: string, endDate: string, categories: string[] | null): Observable<CalendarEvent[]> {
        return this.httpService.getEventsByRange(startDate, endDate, categories).pipe(
            tap(events => this._events.set(events))
        );
    }

    createEvent(event: CreateCalendarEvent): Observable<number> {
        return this.httpService.createEvent(event);
    }

    updateEvent(event: CalendarEvent): Observable<void> {
        return this.httpService.updateEvent(event);
    }

    deleteEvent(eventId: string): Observable<void> {
        return this.httpService.deleteEvent(eventId);
    }

    getHolidays(year: string): Observable<Holiday[]> {
        const cached = this.holidayCache.get(year);
        if (cached) {
            return of(cached);
        }

        return this.httpService.getHolidays(year).pipe(
            tap(holidays => this.holidayCache.set(year, holidays))
        );
    }

    searchEvents(query: string): Observable<SearchResult[]> {
        return this.httpService.searchEvents(query);
    }
}
