import { Component, ViewChild, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import deLocale from '@fullcalendar/core/locales/de-at';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { CalendarService } from '../../shared/calendar.service';
import { CreateCalendarEvent } from '../../shared/models/CreateCalendarEvent';
import { EventDialogComponent } from './event-dialog/event-dialog.component';

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
		eventSources: [
			{
				events: (fetchInfo, successCallback, failureCallback) => {
					this.calendarService.getEventsByRange(fetchInfo.startStr, fetchInfo.endStr).subscribe({
						next: (events) => {
							const eventInput: EventInput[] = events.map((event) => ({
								id: event.eventId,
								title: event.eventTitle,
								start: this.formatCalendarDate(new Date(event.startDateTime ?? '')),
								end: this.formatCalendarDate(new Date(event.endDateTime ?? '')),
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
				events: (info, successCallback, failureCallback) => {
					const currentYear = info.start.getFullYear().toString();

					this.calendarService.getHolidays(currentYear).subscribe({
						next: (holidays) => {
							const backgroundEvents: EventInput[] = holidays.map((holiday, index) => {
								const startDate = new Date(holiday.holidayDate);
								const endDate = new Date(holiday.holidayDate);

								return {
									id: `holiday-${index}`,
									start: this.formatCalendarDate(startDate),
									end: this.formatCalendarDate(endDate),
									display: 'background',
									color: '#FFCDD2',
									title: holiday.holidayName,
									textColor: '#000000', // this now works for 'block' or 'auto'
								};
							});

							successCallback(backgroundEvents);
						},
						error: (error) => {
							failureCallback(error);
						}

					});

					
				}
			}
		],
		eventClick: (arg) => {
			const event = arg.event;

			const eventData = {
				eventId: event.id,
				eventTitle: event.title,
				eventNote: event.extendedProps['eventNote'] || null,
				startDateTime: event.start,
				endDateTime: event.end,
				isAllDay: event.allDay,
				categoryId: event.extendedProps['categoryId'] || null
			}

			console.log('Event clicked:', eventData);

			this.dialog.open(EventDialogComponent, {
				data: eventData,
				width: '1000px',
				height: 'auto'
			}).afterClosed().subscribe(result => {
				console.log('Dialog closed with result:', result);
				if (result) {
					if (result.action === 'update') {
						// const updatedEvent: CreateCalendarEvent = {
						// 	eventTitle: result.eventTitle,
						// 	eventNote: result.eventNote,
						// 	startDateTime: result.startDateTime,
						// 	endDateTime: result.endDateTime,
						// 	isAllDay: result.isAllDay,
						// 	categoryId: result.categoryId
						// };
	
						// this.calendarService.updateEvent(event.id, updatedEvent).subscribe({
						// 	next: () => {
						// 		this.calendarApi.refetchEvents();
						// 	},
						// 	error: (error) => {
						// 		console.error('Error updating event:', error);
						// 	}
						// });
					} else if (result.action === 'delete') {
						this.calendarService.deleteEvent(result.data).subscribe({
							next: () => {
								this.calendarApi.refetchEvents();
							},
							error: (error: any) => {
								console.error('Error deleting event:', error);
							}
						});
					}


				}
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
		fixedWeekCount: false,
		eventTimeFormat: {
			hour: '2-digit',
			minute: '2-digit'
		}
	};

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

	formatCalendarDate(date: Date): string {
		return [
			date.getFullYear(),
			(date.getMonth() + 1).toString().padStart(2, '0'),
			date.getDate().toString().padStart(2, '0')
		].join('-');
	}
}
