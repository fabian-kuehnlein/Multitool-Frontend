import { Component, signal, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { CalendarService } from '../../shared/calendar.service';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import { CreateCalendarEvent } from '../../shared/models/CreateCalendarEvent';
import { EventDialogComponent } from './event-dialog/event-dialog.component';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import deLocale from '@fullcalendar/core/locales/de-at';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
	selector: 'app-calendar',
	imports: [
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
		eventSources: [
			{
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
			},
			{
				events: [
					{
						start: '2025-05-25',
						end: '2025-05-26',
						display: 'background',
						color: '#ffcccc',
						title: 'Beispielhintergrundereignis'
					}
				]
			}
		],
		locales: [deLocale],
		datesSet: () => {
			this.title.set(this.calendarApi.view.title);
		},
		// eventContent: this.customEvent,
		headerToolbar: false,
		initialView: 'dayGridMonth',
		weekends: true,
		editable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		contentHeight: 750,
		showNonCurrentDates: false,
		fixedWeekCount: false,
		eventTimeFormat: {
			hour: '2-digit',
			minute: '2-digit'
		},
		eventBackgroundColor: '#005CBB',
		eventBorderColor: '#005CBB',
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
				const newEvent: CreateCalendarEvent = {
					eventTitle: result.eventTitle,
					eventNote: result.eventNote,
					startDateTime: result.startDateTime,
					endDateTime: result.endDateTime,
					isAllDay: result.isAllDay,
					categoryId: result.categoryId
				};

				this.calendarService.createEvent(newEvent).subscribe({
					next: () => {
						this.calendarApi.refetchEvents();
					},
					error: (error) => {
						console.error('Error creating event:', error);
					}
				});
			}
		});
	};

	// customEvent(arg: any): { html: string } {
	// 	const { event } = arg;
	// 	const { extendedProps } = event;

	// 	// Formatierte Zeit, z.B. "12:00 - 13:30"
	// 	const startTime = event.start ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
	// 	const endTime = event.end ? new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
	// 	const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime;

	// 	return {
	// 		html: `
	// 			<div class="fc-event-material">
	// 				<div class="fc-event-time">${timeRange}</div>
	// 				<div class="fc-event-title">${event.title}</div>
	// 			</div>
	// 		`
	// 	};
	// }
}
