import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap, throwError } from 'rxjs';
import { CalendarHttpService } from './calendar-http.service';
import { CalendarEvent } from '../models/calendar-event.model';
import { CreateCalendarEvent } from '../models/create-calendar-event.model';
import { Holiday } from '../models/holiday.model';
import { SearchResult } from '../models/search-result.model';
import { addExcludeDateToRule } from '../logic/rrule.logic';

@Injectable({
    providedIn: 'root',
})
export class CalendarService {
    private readonly httpService = inject(CalendarHttpService);

    private readonly _events = signal<CalendarEvent[]>([]);
    public readonly events = this._events.asReadonly();

    private readonly holidayCache = new Map<string, Holiday[]>();

    getEvents(
        startDate: string,
        endDate: string,
        categories: string[] | null,
    ): Observable<CalendarEvent[]> {
        return this.httpService
            .getEventsByRange(startDate, endDate, categories)
            .pipe(tap((events) => this._events.set(events)));
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

    generateIcalLink(event: CreateCalendarEvent): Observable<string> {
        return this.httpService.generateIcalLink(event);
    }

    /**
     * Excludes a specific date from a recurring event series.
     * @param seriesId The ID of the recurring event series.
     * @param date The date to exclude (formatted as YYYY-MM-DD).
     */
    excludeDateFromSeries(seriesId: string, date: string): Observable<void> {
        const seriesEvent = this._events().find(
            (e) => String(e.id) === String(seriesId),
        );
        if (!seriesEvent) {
            return throwError(() => new Error('Series event not found'));
        }

        const updatedSeries = { ...seriesEvent };
        updatedSeries.recurrenceRule = addExcludeDateToRule(
            updatedSeries.recurrenceRule,
            date,
        );

        return this.updateEvent(updatedSeries);
    }

    getHolidays(year: string): Observable<Holiday[]> {
        const cached = this.holidayCache.get(year);
        if (cached) {
            return of(cached);
        }

        return this.httpService
            .getHolidays(year)
            .pipe(tap((holidays) => this.holidayCache.set(year, holidays)));
    }

    searchEvents(query: string): Observable<SearchResult[]> {
        return this.httpService.searchEvents(query);
    }
}
