import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent } from '../models/calendar-event.model';
import { CreateCalendarEvent } from '../models/create-calendar-event.model';
import { Holiday } from '../models/holiday.model';
import { SearchResult } from '../models/search-result.model';

@Injectable({
    providedIn: 'root',
})
export class CalendarHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiURL = `${environment.MultitoolApi}/api/Calendar`;

    getEventsByRange(
        startDate: string,
        endDate: string,
        categories: string[] | null,
    ): Observable<CalendarEvent[]> {
        let params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        if (categories && categories.length > 0) {
            params = params.set('categories', categories.join(','));
        }

        return this.http.get<CalendarEvent[]>(`${this.apiURL}/events`, {
            params,
        });
    }

    searchEvents(searchString: string): Observable<SearchResult[]> {
        const params = new HttpParams().set('searchString', searchString);
        return this.http.get<SearchResult[]>(`${this.apiURL}/events/search`, {
            params,
        });
    }

    createEvent(event: CreateCalendarEvent): Observable<number> {
        return this.http.post<number>(`${this.apiURL}/events`, event);
    }

    updateEvent(event: CalendarEvent): Observable<void> {
        return this.http.put<void>(`${this.apiURL}/events`, event);
    }

    generateIcalLink(event: CreateCalendarEvent): Observable<string> {
        return this.http.post<string>(`${this.apiURL}/events/ical-link`, event);
    }

    deleteEvent(eventId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiURL}/events/${eventId}`);
    }

    getHolidays(year: string): Observable<Holiday[]> {
        return this.http.get<Holiday[]>(`${this.apiURL}/holidays/${year}`);
    }
}
