// Angular Core
import { Component, ViewChild, inject, signal } from '@angular/core';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// FullCalendar
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de-at';
import timeGridPlugin from '@fullcalendar/timegrid';
import rrulePlugin from '@fullcalendar/rrule';

// Moment.js
import moment from 'moment';

// App Services & Components
import { CalendarService } from '../../shared/calendar.service';
import { EventDialogComponent } from './event-dialog/event-dialog.component';
import { CalendarEvent } from '../../shared/models/Calendarevent';

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
	
	private readonly calendarService = inject(CalendarService);
	private readonly dialog = inject(MatDialog);

	private get calendarApi() { return this.calendar.getApi();}

	public readonly title = signal<string>("");
	public readonly isToday = signal<boolean>(true);

	public readonly calendarOptions: CalendarOptions = {
		plugins: [
			dayGridPlugin,
			timeGridPlugin,
			interactionPlugin,
			rrulePlugin
		],
		eventSources: [
			{
				events: (fetchInfo, successCallback, failureCallback) => {
					this.calendarService.getEventsByRange(fetchInfo.startStr, fetchInfo.endStr).subscribe({
						next: (events) => {
							const eventInput: EventInput[] = events.map((event) => {
								const input: EventInput = {
									id: event.eventId,
									title: event.eventTitle,
									start: new Date(event.startDateTime ?? ''),
									end: new Date(event.endDateTime ?? ''),
									allDay: event.isAllDay,
									extendedProps: {
										eventNote: event.eventNote,
										categoryId: event.categoryId,
									}
								};

								if (event.recurrenceRule) {
									input.rrule = {
										dtstart: event.startDateTime,
										until: event.recurrenceEnd ?? undefined,
										...this.parseRRuleString(event.recurrenceRule)
									};
									input.duration = this.getDuration(event.startDateTime ?? null, event.endDateTime ?? null);
								}

								return input;
							});

							successCallback(eventInput);
						},
						error: (error) => failureCallback(error)
					});
				},
			},
			{
				// Background events for holidays
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
									title: holiday.holidayName
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
		eventClick: this.updateEvent.bind(this),
		eventDrop: this.handleEventDrop.bind(this),
		locales: [deLocale],
		datesSet: () => {
			this.title.set(this.calendarApi.view.title);
		},
		eventContent: (arg) => {
			const { event } = arg;

			if(event.display === 'background') {
				return {
					html: `<div class="fc-event-background">${event.title}</div>`
				}
			}

			const isAllDay = event.allDay;
			const note = event.extendedProps['eventNote'] || '';
			const categoryId = event.extendedProps['categoryId'];

			const start = event.start ? new Date(event.start) : null;
			const end = event.end ? new Date(event.end) : null;

			const startStr = start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			const endStr = end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

			const timeDisplay = isAllDay
				? ''
				: startStr
					? endStr
						? `${startStr} – ${endStr}`
						: `${startStr}`
					: '';

			return {
				html: `
					<div class="fc-event-material category-${categoryId}">
						<div class="fc-event-title">${event.title}</div>
						<div class="fc-event-time">${timeDisplay}</div>
						${note ? `<div class="fc-event-note">${note}</div>` : ''}
					</div>
				`
			}

		},
		headerToolbar: false,
		initialView: 'dayGridMonth',
		weekends: true,
		editable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		contentHeight: 800,
		showNonCurrentDates: false,
		fixedWeekCount: false,
		eventTimeFormat: {
			hour: '2-digit',
			minute: '2-digit'
		}
	};

	createEvent() {
		const dialogRef = this.dialog.open(EventDialogComponent, {
			width: 'auto',
			minWidth: '600px',
			maxWidth: '1500px',
			height: 'auto',
			data: null
		});

		dialogRef.afterClosed().subscribe(result => {
			if (result) {
				console.log('Creating event:', result);
				this.calendarService.createEvent(result).subscribe({
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

	updateEvent(arg: EventClickArg) {
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

		this.dialog.open(EventDialogComponent, {
			data: eventData,
			width: 'auto',
			minWidth: '600px',
			maxWidth: '1500px',
			height: 'auto',
		}).afterClosed().subscribe(result => {
			if (result) {
				if (result.action === 'update') {
					this.calendarService.updateEvent(result.data).subscribe({
						next: () => {
							this.calendarApi.refetchEvents();
						},
						error: (error) => {
							console.error('Error updating event:', error);
						}
					});
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
	};

	handleEventDrop(arg: EventDropArg) {
		const event = arg.event;

		const startDateTime = moment(event.start).format('YYYY-MM-DDTHH:mm:ss');
		const endDateTime = event.end ? moment(event.end).format('YYYY-MM-DDTHH:mm:ss') : startDateTime;

		const updatedEvent: CalendarEvent = {
			eventId: event.id,
			eventTitle: event.title,
			eventNote: event.extendedProps['eventNote'] || '',
			startDateTime: startDateTime,
			endDateTime: endDateTime,
			isAllDay: event.allDay,
			categoryId: event.extendedProps['categoryId'] || ''
		};

		this.calendarService.updateEvent(updatedEvent).subscribe({
			next: () => {
			},
			error: (error) => {
				console.error('Error updating event after drop:', error);
				arg.revert();
			}
		});
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
			this.isToday.set(false);
		} else {
			this.isToday.set(true);
		}
	};

	formatCalendarDate(date: Date): string {
		return [
			date.getFullYear(),
			(date.getMonth() + 1).toString().padStart(2, '0'),
			date.getDate().toString().padStart(2, '0')
		].join('-');
	}

	parseRRuleString(rrule: string): Record<string, any> {
		const parts = rrule.split(';');
		const rule: any = {};

		for (const part of parts) {
			const [key, value] = part.split('=');
			
			switch (key) {
				case 'FREQ':
					rule.freq = value.toLowerCase();
					break;
				case 'INTERVAL':
					rule.interval = parseInt(value);
					break;
				case 'BYDAY':
					rule.byweekday = value.split(',').map(day => day.toLowerCase());
					break;
			}
		}

		return rule;
	}

	getDuration(startDateTime: string | null, endDateTime: string | null): string {
		if (!startDateTime || !endDateTime) {
			return '';
		}

		const start = moment(startDateTime);
		const end = moment(endDateTime);

		if (!start.isValid() || !end.isValid()) {
			return '';
		}

		return moment.duration(end.diff(start)).toISOString();
	}
}
