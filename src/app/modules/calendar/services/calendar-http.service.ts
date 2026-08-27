import { inject, Injectable } from '@angular/core';
import {
    HttpContext,
    HttpClient,
    HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalendarEvent } from '../models/calendar-event.model';
import { CreateCalendarEvent } from '../models/create-calendar-event.model';
import { GetICalLinkEvent } from '../models/get-ical-link-event.model';
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
        categories: number[] | null,
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

    searchEvents(
        searchString: string,
        context?: HttpContext,
    ): Observable<SearchResult[]> {
        const params = new HttpParams().set('searchString', searchString);
        return this.http.get<SearchResult[]>(`${this.apiURL}/events/search`, {
            params,
            context,
        });
    }

    createEvent(event: CreateCalendarEvent): Observable<number> {
        return this.http.post<number>(`${this.apiURL}/events`, event);
    }

    updateEvent(event: CalendarEvent, context?: HttpContext): Observable<void> {
        return this.http.put<void>(`${this.apiURL}/events/${event.id}`, event, {
            context,
        });
    }

    generateIcalLink(event: GetICalLinkEvent): Observable<Blob> {
        return this.http.post(`${this.apiURL}/events/ical`, event, {
            responseType: 'blob',
        });
    }

    deleteEvent(
        eventId: string | number,
        context?: HttpContext,
    ): Observable<void> {
        return this.http.delete<void>(`${this.apiURL}/events/${eventId}`, {
            context,
        });
    }

    getHolidays(year: string): Observable<Holiday[]> {
        return this.http.get<Holiday[]>(`${this.apiURL}/holidays/${year}`);
    }
}
