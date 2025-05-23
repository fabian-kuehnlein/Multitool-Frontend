import { Component, signal, ViewChild, AfterViewInit, inject } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { CalendarService } from '../../shared/calendar.service';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import deLocale from '@fullcalendar/core/locales/de-at';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventDialogComponent } from './event-dialog/event-dialog.component';


@Component({
	selector: 'app-calendar',
	imports: [
    MatDatepickerModule,
    MatCardModule,
    MatButtonModule,
    FullCalendarModule,
    MatIconModule,
	MatToolbarModule,
	MatTooltipModule
],
	templateUrl: './calendar.component.html',
	styleUrl: './calendar.component.scss'
})

export class CalendarComponent {
	@ViewChild('calendarRef') calendar!: FullCalendarComponent;
	
	calendarService = inject(CalendarService);
	dialog = inject(MatDialog);

	ngAfterViewInit() {
		this.getAllEvents();
	}

	get calendarApi() {
		return this.calendar.getApi();
	}

	public readonly title = signal<string>("");
	public isToday: boolean = false;

	public dataSource: EventInput[] = []

	public readonly calendarOptions: CalendarOptions = {
		plugins: [
			dayGridPlugin,
			timeGridPlugin,
			interactionPlugin
		],
		events: (fetchInfo, successCallback, failureCallback) => {
			this.calendarService.getEventsByRange(fetchInfo.startStr, fetchInfo.endStr).subscribe({
				next: (events) => {
					const eventInput: EventInput[] = events.map((event) => ({
						id: event.eventId,
						title: event.eventTitle,
						start: event.startDateTime,
						end: event.endDateTime,
						allDay: event.isAllDay,
						extendedProps: {
							eventNote: event.eventNote,
							categoryId: event.categoryId
						}
					}));

					successCallback(eventInput);
				},
				error: (error) => failureCallback(error)
			});
		},
		locales: [deLocale],
		datesSet: () => {
			this.title.set(this.calendarApi.view.title);
		},
		headerToolbar: false,
		initialView: 'dayGridMonth',
		weekends: true,
		editable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		contentHeight: 750,
		showNonCurrentDates: false,
		fixedWeekCount: false
	};

	getAllEvents() {
		this.calendarService.getAllEvents().subscribe((events) => {
			const eventInput: EventInput[] = events.map((event) => ({
				id: event.eventId,
				title: event.eventTitle,
				start: event.startDateTime,
				end: event.endDateTime,
				allDay: event.isAllDay,
				extendedProps: {
					eventNote: event.eventNote,
					categoryId: event.categoryId
				}
			}));

			this.dataSource = eventInput;
		})
	}

	calendarAction(action: 'today' | 'prev' | 'prevYear' | 'next' | 'nextYear' | 'changeMonth' | 'changeWeek' | 'changeDay') {
		switch(action) {
			case 'today':
			this.calendarApi.today();
			break;
			case 'prev':
			this.calendarApi.prev();
			break;
			case 'prevYear':
			this.calendarApi.prevYear();
			break;
			case 'next':
			this.calendarApi.next();
			break;
			case 'nextYear':
			this.calendarApi.nextYear();
			break;
			case 'changeMonth':
			this.calendarApi.changeView('dayGridMonth');
			break;
			case 'changeWeek':
			this.calendarApi.changeView('timeGridWeek');
			break;
			case 'changeDay':
			this.calendarApi.changeView('timeGridDay');
			break;
		}

		const view = this.calendarApi.view;
		const start = new Date(view.currentStart);
		const end = new Date(view.currentEnd);
		const today = new Date();

		if (today >= start && today <= end) {
			this.isToday = false;
		} else {
			this.isToday = true;
		}
	}

	createEvent() {
		const dialogRef = this.dialog.open(EventDialogComponent, {
			width: '1000px',
			height: 'auto',
			data: null
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				const newEvent: EventInput = {
					id: result.eventId,
					title: result.eventTitle,
					start: result.startDateTime,
					end: result.endDateTime,
					allDay: result.isAllDay,
					extendedProps: {
						eventNote: result.eventNote,
						categoryId: result.categoryId
					}
				};

				this.calendarService.createEvent(result).subscribe({
					next: () => {
						this.calendarApi.addEvent(newEvent);
					}
				});
			}
		});
	};
}
