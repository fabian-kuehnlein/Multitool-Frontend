import { inject, Injectable } from '@angular/core';
import {
    HttpContext,
    HttpClient,
    HttpParams,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    CalendarEvent,
    CreateCalendarEventDto,
    GetICalLinkEventDto,
    Holiday,
    SearchResult,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class CalendarHttpService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.MultitoolApi}/api/Calendar`;

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

        return this.http.get<CalendarEvent[]>(`${this.apiUrl}/events`, {
            params,
        });
    }

    searchEvents(
        searchString: string,
        context?: HttpContext,
    ): Observable<SearchResult[]> {
        const params = new HttpParams().set('searchString', searchString);
        return this.http.get<SearchResult[]>(`${this.apiUrl}/events/search`, {
            params,
            context,
        });
    }

    createEvent(event: CreateCalendarEventDto): Observable<number> {
        return this.http.post<number>(`${this.apiUrl}/events`, event);
    }

    updateEvent(event: CalendarEvent, context?: HttpContext): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/events/${event.id}`, event, {
            context,
        });
    }

    generateIcalLink(
        event: GetICalLinkEventDto,
        context?: HttpContext,
    ): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/events/ical`, event, {
            responseType: 'blob',
            context,
        });
    }

    deleteEvent(
        eventId: string | number,
        context?: HttpContext,
    ): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/events/${eventId}`, {
            context,
        });
    }

    getHolidays(year: string): Observable<Holiday[]> {
        return this.http.get<Holiday[]>(`${this.apiUrl}/holidays/${year}`);
    }
}
