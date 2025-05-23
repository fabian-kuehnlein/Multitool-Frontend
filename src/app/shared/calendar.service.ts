import { Injectable } from '@angular/core';
import { CalendarEvent } from './models/calendarevent';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

    constructor(private readonly http: HttpClient) { }

    private readonly apiURL = 'api/CalendarEvent';
    
    getAllEvents(): Observable<CalendarEvent[]> {
        return this.http.get<CalendarEvent[]>(`${environment.CalendarApi}/${this.apiURL}/GetAllEvents`);
    }

    getEventsByRange(startDate: string, endDate: string): Observable<CalendarEvent[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        return this.http.get<CalendarEvent[]>(`${environment.CalendarApi}/${this.apiURL}/GetEventsByRange`, { params });
    }

    createEvent(event: CalendarEvent): Observable<CalendarEvent> {
        return this.http.post<CalendarEvent>(`${environment.CalendarApi}/${this.apiURL}/CreateEvent`, event);
    }
}
