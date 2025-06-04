import { Injectable } from '@angular/core';
import { CalendarEvent } from './models/Calendarevent';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CreateCalendarEvent } from './models/CreateCalendarEvent';
import { Category } from './models/Category';
import { Holiday } from './models/Holiday';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

    constructor(private readonly http: HttpClient) { }

    private readonly apiURL = 'api/CalendarEvent';
    
    getAllEvents(): Observable<CalendarEvent[]> {
        return this.http.get<CalendarEvent[]>(`${environment.MultitoolApi}/${this.apiURL}/GetAllEvents`);
    }

    getEventsByRange(startDate: string, endDate: string): Observable<CalendarEvent[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        return this.http.get<CalendarEvent[]>(`${environment.MultitoolApi}/${this.apiURL}/GetEventsByRange`, { params });
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
