import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CalendarEvent } from './models/Calendarevent';
import { Category } from './models/Category';
import { CreateCalendarEvent } from './models/CreateCalendarEvent';
import { Holiday } from './models/Holiday';
import { SearchResult } from './models/SearchResult';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

    constructor(private readonly http: HttpClient) { }

    private readonly apiURL = 'api/CalendarEvent';

    getEventsByRange(startDate: string, endDate: string, categories: string[] | null): Observable<CalendarEvent[]> {
        let params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        if (categories && categories.length > 0) {
            params = params.set('categories', categories.join(','));
        }

        return this.http.get<CalendarEvent[]>(`${environment.MultitoolApi}/${this.apiURL}/GetEventsByRange`, { params });
    }

    searchEvents(searchString: string): Observable<SearchResult[]> {
        let params = new HttpParams().set('searchString', searchString)
        return this.http.get<SearchResult[]>(`${environment.MultitoolApi}/${this.apiURL}/SearchEvents`, { params });
    }

    createEvent(event: CreateCalendarEvent): Observable<CalendarEvent> {
        return this.http.post<CalendarEvent>(`${environment.MultitoolApi}/${this.apiURL}/InsertEvent`, event);
    }

    updateEvent(event: CalendarEvent): Observable<CalendarEvent> {
        return this.http.put<CalendarEvent>(`${environment.MultitoolApi}/${this.apiURL}/UpdateEvent`, event);
    }

    deleteEvent(eventId: string): Observable<void> {
        const params = new HttpParams().set('eventId', eventId);
        return this.http.delete<void>(`${environment.MultitoolApi}/${this.apiURL}/DeleteEvent`, { params });
    }

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${environment.MultitoolApi}/${this.apiURL}/GetCategories`);
    }

    getHolidays(year: string): Observable<Holiday[]> {
        const params = new HttpParams().set('year', year);
        return this.http.get<Holiday[]>(`${environment.MultitoolApi}/${this.apiURL}/GetHolidays`, { params });
    }
}
