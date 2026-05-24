// Angular Core
import { Component, ViewChild, inject, signal, HostListener, computed, effect, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

// Angular Material
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

// FullCalendar
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { defaultCalendarOptions } from '../utilities/calendar.config';

// Third Party
import moment from 'moment';
import { debounceTime, Subject, takeUntil } from 'rxjs';

// App Services, Components & Utilities
import { CalendarService } from '../services/calendar.service';
import { EventDialogComponent } from './components/event-dialog/event-dialog.component';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component';
import { RecurrenceChoiceDialogComponent } from './components/recurrence-choice-dialog/recurrence-choice-dialog.component';
import { CalendarEvent } from '../models/calendar-event.model';
import { CalendarMapper } from '../utilities/calendar-mapper';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';

@Component({
	selector: 'app-calendar',
	standalone: true,
	imports: [
		UI_MODULES,
		FullCalendarModule,
		MatChipsModule,
		ReactiveFormsModule,
		RecurrenceChoiceDialogComponent
	],
	templateUrl: './calendar.component.html',
	styleUrl: './calendar.component.scss',
	animations: [
		trigger('fadeSlideInOut', [
			transition(':enter', [
				style({ opacity: 0, transform: 'translateY(-10px)', height: 0 }),
				animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)', height: '*' }))
			]),
			transition(':leave', [
				animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)', height: 0 }))
			])
		])
	]
})
export class CalendarComponent implements OnDestroy {
	@ViewChild('calendarRef') calendar!: FullCalendarComponent;

	private readonly calendarService = inject(CalendarService);
	private readonly dialog = inject(MatDialog);
	private readonly destroy$ = new Subject<void>();

	// --- Signals & State ---
	public readonly title = signal<string>("");
	public readonly isToday = signal<boolean>(true);
	public readonly currentView = signal<string>('dayGridMonth');
	public readonly showFilters = signal<boolean>(false);
	public readonly isLoading = signal<boolean>(false);

	public readonly categoryList = this.calendarService.categories;
	public readonly categoryControl = new FormControl<string[]>([]);

    // Converts the valueChange observable into a signal to reactively track the selected categories without needing to subscribe manually
	private readonly categoryControlValue = toSignal(this.categoryControl.valueChanges, { initialValue: [] as string[] });

    // Computes the IDs of all categories whose events are currently shown
	public readonly selectedCategoryIds = computed(() => {
		const ids = this.categoryControlValue() || [];
		return (ids.length === 0 || ids.length === this.categoryList().length) ? [] : ids;
	});

	private get calendarApi() { return this.calendar.getApi(); }

	constructor() {
		this.initCategoryControl();
		this.setupCategorySelectionListener();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	// --- Initialization ---
	private initCategoryControl() {
		effect(() => {
			const categories = this.categoryList();
			if (categories.length > 0 && (this.categoryControl.value?.length || 0) === 0) {
				this.categoryControl.setValue(categories.map(c => c.id));
			}
		});
	}

	private setupCategorySelectionListener() {
		this.categoryControl.valueChanges.pipe(
			takeUntil(this.destroy$),
			debounceTime(500)
		).subscribe(() => {
			if (this.calendar) {
				this.calendarApi.refetchEvents();
			}
		});
	}

	// --- Host Listeners ---
	@HostListener('window:keydown', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		if (event.altKey && event.key.toLowerCase() === 'n') {
			event.preventDefault();
			this.createEvent();
		}
		if ((event.altKey && event.key.toLowerCase() === 'f') || (event.key === '/' && !(event.target instanceof HTMLInputElement))) {
			event.preventDefault();
			this.openSearchResult();
		}
	}

	// --- UI Actions ---
	public calendarAction(action: string) {
		switch (action) {
			case 'today': this.calendarApi.today(); break;
			case 'prev': this.calendarApi.prev(); break;
			case 'prevYear': this.calendarApi.prevYear(); break;
			case 'next': this.calendarApi.next(); break;
			case 'nextYear': this.calendarApi.nextYear(); break;
			case 'changeMonth': this.changeView('dayGridMonth'); break;
			case 'changeWeek': this.changeView('timeGridWeek'); break;
			case 'changeDay': this.changeView('timeGridDay'); break;
		}
		this.updateTodayStatus();
	}

	private changeView(viewName: string) {
		this.calendarApi.changeView(viewName);
		this.currentView.set(viewName);
	}

	private updateTodayStatus() {
		const view = this.calendarApi.view;
		const start = moment(view.currentStart).startOf('day');
		const end = moment(view.currentEnd).startOf('day');
		const today = moment().startOf('day');

		this.isToday.set(today.isSameOrAfter(start) && today.isBefore(end));
	}

	public openSideNav() {
		this.dialog.open(SidenavComponent, {
			position: { top: '90px', left: '30px' },
			height: 'auto',
			hasBackdrop: true,
			backdropClass: 'transparent-backdrop',
			data: 'calendar'
		});
	}

	// --- Event Operations ---
	public createEvent() {
		const anchorDate = this.calendarApi.getDate();
		this.dialog.open(EventDialogComponent, {
			width: 'auto',
			minWidth: '600px',
            maxWidth: '1500px',
			data: { anchorDate, event: null }
		}).afterClosed().subscribe(result => {
			if (result) {
				this.calendarService.createEvent(result).subscribe(() => this.calendarApi.refetchEvents());
			}
		});
	}

	public updateEvent(arg: EventClickArg) {
		const eventData = CalendarMapper.fromFullCalendarEvent(arg.event);

        if (eventData.recurrenceRule) {
            this.dialog.open(RecurrenceChoiceDialogComponent).afterClosed().subscribe(choice => {
                if (choice) this.openEventDialog(eventData, choice === 'instance');
            });
        } else {
            this.openEventDialog(eventData);
        }
	}

    private openEventDialog(eventData: any, isInstance: boolean = false) {
        const dialogConfig = {
			width: 'auto',
			minWidth: '600px',
            maxWidth: '1500px',
			data: { event: isInstance ? { ...eventData, recurrenceRule: null, recurrenceEnd: null, eventId: null } : eventData }
		};

		this.dialog.open(EventDialogComponent, dialogConfig).afterClosed().subscribe(result => {
			if (!result) return;
			
			if (result.action === 'update') {
                if (isInstance) {
                    this.splitEventFromSeries(eventData, result.data);
                } else {
				    this.calendarService.updateEvent(result.data).subscribe(() => this.calendarApi.refetchEvents());
                }
			} else if (result.action === 'delete') {
				if (isInstance) {
                    this.excludeDateFromSeries(eventData);
                } else {
                    this.calendarService.deleteEvent(result.data).subscribe(() => this.calendarApi.refetchEvents());
                }
			}
		});
    }

    private splitEventFromSeries(originalInstance: any, updatedData: any) {
        const newEvent = { ...updatedData, id: undefined };
        this.calendarService.createEvent(newEvent).subscribe(() => {
            this.excludeDateFromSeries(originalInstance);
        });
    }

    private excludeDateFromSeries(instance: any) {
        const dateToExclude = moment(instance.startDateTime).format('YYYY-MM-DD');
        this.calendarService.excludeDateFromSeries(instance.eventId, dateToExclude).subscribe({
            next: () => this.calendarApi.refetchEvents(),
            error: (err) => console.error('Failed to exclude date:', err)
        });
    }

	public handleEventDrop(arg: EventDropArg) {
		const event = arg.event;
        const isRecurring = !!event.extendedProps['recurrenceRule'];
		const updatedEvent = CalendarMapper.toCalendarEvent(event);

        if (isRecurring) {
            this.dialog.open(RecurrenceChoiceDialogComponent).afterClosed().subscribe(choice => {
                if (choice === 'series') {
                    this.calendarService.updateEvent(updatedEvent).subscribe({
                        next: () => this.calendarApi.refetchEvents(),
                        error: (err) => {
                            console.error('Drop failed:', err);
                            arg.revert();
                        }
                    });
                } else if (choice === 'instance') {
                    const originalInstance = CalendarMapper.fromFullCalendarEvent(arg.oldEvent);
                    this.splitEventFromSeries(originalInstance, updatedEvent);
                } else {
                    arg.revert();
                }
            });
        } else {
            this.calendarService.updateEvent(updatedEvent).subscribe({
                error: (err) => {
                    console.error('Drop failed:', err);
                    arg.revert();
                }
            });
        }
	}

	public openSearchResult() {
		this.dialog.open(SearchDialogComponent, {
			width: 'fit-content',
			minWidth: '500px',
		}).afterClosed().subscribe(result => {
			if (result?.data) {
				this.calendarApi.gotoDate(result.data);
				this.calendarApi.select(result.data);
			} else {
				this.calendarApi.refetchEvents();
			}
		});
	}

	// --- Calendar Configuration ---
	public readonly calendarOptions: CalendarOptions = {
		...defaultCalendarOptions,
		datesSet: () => this.title.set(this.calendarApi.view.title),
		loading: (isLoading) => this.isLoading.set(isLoading),
		eventSources: [
			{
				events: (fetchInfo, successCallback, failureCallback) => {
					this.calendarService.getEvents(fetchInfo.startStr, fetchInfo.endStr, this.selectedCategoryIds()).subscribe({
						next: (events) => successCallback(events.map(e => CalendarMapper.toEventInput(e, this.categoryList()))),
						error: (err) => failureCallback(err)
					});
				}
			},
			{
				events: (info, successCallback, failureCallback) => {
					this.calendarService.getHolidays(info.start.getFullYear().toString()).subscribe({
						next: (holidays) => successCallback(holidays.map((h, i) => ({
							id: `holiday-${i}`,
							start: moment(h.date).format('YYYY-MM-DD'),
							end: moment(h.date).add(1, 'day').format('YYYY-MM-DD'),
							display: 'background',
							color: '#FFCDD2',
							title: h.name
						}))),
						error: (err) => failureCallback(err)
					});
				}
			}
		],
		eventClick: this.updateEvent.bind(this),
		eventDrop: this.handleEventDrop.bind(this)
	};
}
