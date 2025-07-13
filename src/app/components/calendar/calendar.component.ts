// Angular Core
import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';

// Angular Material
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// FullCalendar
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import { defaultCalendarOptions } from './calendar.config';

// Third Party
import moment from 'moment';
import { debounceTime, Subject, takeUntil } from 'rxjs';

// App Services & Components
import { CalendarService } from './calendar.service';
import { EventDialogComponent } from './event-dialog/event-dialog.component';
import { SearchDialogComponent } from './search-dialog/search-dialog.component';
import { CalendarEvent } from './models/Calendarevent';
import { Category } from './models/Category';
import { UI_MODULES } from '../../shared/material-ui';
import { SidenavComponent } from '../../shared/sidenav/sidenav.component';

@Component({
	selector: 'app-calendar',
	imports: [
	UI_MODULES,
    FullCalendarModule,
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
	private readonly destroy$ = new Subject<void>();

	private get calendarApi() { return this.calendar.getApi();}

	public readonly title = signal<string>("");
	public readonly isToday = signal<boolean>(true);

	categoryControl = new FormControl<string[]>(['Alle']);
	searchControl = new FormControl<string>('');
	categoryList: Category[] = [];
	private readonly selectedCategory = signal<string[]>([]);

	ngOnInit(){
		this.calendarService.getCategories().subscribe(categories => {
			if (categories) {
				this.categoryList = categories;

				this.categoryControl.setValue(categories.map(c => c.categoryId));
			}
		});

		this.categoryControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((ids: string[] | null) => {
			if (!ids) return;
			if (ids.length === this.categoryList.length) {
				this.selectedCategory.set([]);
			} else {
				this.selectedCategory.set(ids);
			}
		})

		this.categoryControl.valueChanges.pipe(
			takeUntil(this.destroy$),
			debounceTime(500)
		).subscribe(() => {
			this.calendarApi.refetchEvents();
		})
	};

	ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

	openSideNav() {
		this.dialog.open(SidenavComponent, {
			position: {
				top: '90px',
				left: '30px'
			},
			height: 'auto',
			minHeight: '100px',
			maxHeight: '1000px',
			hasBackdrop: true,
			backdropClass: 'transparent-backdrop',
			data: 'calendar'
		}).afterClosed();
	}

	getCategoryDisplay(): string {
		const selectedIds = this.categoryControl.value || [];

		if (!selectedIds.length) return '';

		if (selectedIds.length === this.categoryList.length) {
			return 'Alle';
		}

		return this.categoryList.find(c => c.categoryId === selectedIds[0])?.categoryName ?? '';
	}

	public readonly calendarOptions: CalendarOptions = {
		...defaultCalendarOptions,
		// sets Title
		datesSet: () => {
			this.title.set(this.calendarApi.view.title);
		},
		// handles Events
		eventSources: [
			{
				events: (fetchInfo, successCallback, failureCallback) => {
					this.calendarService.getEventsByRange(fetchInfo.startStr, fetchInfo.endStr, this.selectedCategory()).subscribe({
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
										recurrenceRule: event.recurrenceRule,
										recurrenceEnd: event.recurrenceEnd
									}
								};

								if (event.recurrenceRule) {
									input.rrule = {
										dtstart: event.startDateTime,
										until: event.recurrenceEnd ?? undefined,
										...this.parseRRuleString(event.recurrenceRule)
									};
									input.duration = this.getDuration(event.startDateTime ?? null, event.endDateTime ?? null); // z.B. 2 Stunden (Länge des Events)
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
		// actives Update on click
		eventClick: this.updateEvent.bind(this),
		// updates the date one drag and drop
		eventDrop: this.handleEventDrop.bind(this)
	};

	openSearchResult() {
		this.dialog.open(SearchDialogComponent, { 
			width: 'fit-content',
			maxWidth: '90vw',
			minWidth: '500px',
			data: this.searchControl.value
		 }).afterClosed().subscribe(result => {
			if (result && result.data) {
				this.calendarApi.gotoDate(result.data);
				this.calendarApi.select(result.data);
				return;
			}
			
			this.calendarApi.refetchEvents();
		})
	}

	createEvent() {
		const anchorDate = this.calendarApi.getDate();
		this.dialog.open(EventDialogComponent, {
			width: 'auto',
			minWidth: '600px',
			maxWidth: '1500px',
			height: 'auto',
			data: { 
				anchorDate: anchorDate,
				event: null
			}
		}).afterClosed().subscribe(result => {
			if (result) {
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
			endDateTime: event.end
				? (event.allDay
					? moment(event.end).subtract(1, 'day').toDate()
					: new Date(event.end))
				: event.extendedProps['recurrenceRule'] ? event.start
				: null,
			isAllDay: event.allDay,
			categoryId: event.extendedProps['categoryId'] || null,
			recurrenceRule: event.extendedProps['recurrenceRule'] ?? null,
			recurrenceEnd: event.extendedProps['recurrenceEnd'] ?? null
		};

		this.dialog.open(EventDialogComponent, {
			data: {
				anchorDate: null,
				event: eventData
			},
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

	// for display in calendar
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
