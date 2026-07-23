// Angular Core
import {
    Component,
    inject,
    signal,
    HostListener,
    computed,
    effect,
    OnDestroy,
    viewChild,
    AfterViewInit,
    ChangeDetectionStrategy,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// FullCalendar
import {
    FullCalendarComponent,
    FullCalendarModule,
} from '@fullcalendar/angular';
import {
    CalendarOptions,
    EventClickArg,
    EventDropArg,
} from '@fullcalendar/core';
import { defaultCalendarOptions } from '../utilities/calendar.config';

// Third Party
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { debounceTime, Subject, takeUntil, map } from 'rxjs';

dayjs.extend(duration);

// App Services, Components & Utilities
import { CalendarService } from '../services/calendar.service';
import { EventDialogComponent } from './components/event-dialog/event-dialog.component';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component';
import { RecurrenceChoiceDialogComponent } from './components/recurrence-choice-dialog/recurrence-choice-dialog.component';
import { CalendarMapper } from '../utilities/calendar-mapper';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { CategoryService } from '../../../shared/services/category.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [
        UI_MODULES,
        FullCalendarModule,
        MatChipsModule,
        ReactiveFormsModule,
    ],
    templateUrl: './calendar.component.html',
    styleUrl: './calendar.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    animations: [
        trigger('fadeSlideInOut', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px)' }),
                animate(
                    '200ms ease-out',
                    style({ opacity: 1, transform: 'translateY(0)' }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '150ms ease-in',
                    style({ opacity: 0, transform: 'translateY(-10px)' }),
                ),
            ]),
        ]),
    ],
})
export class CalendarComponent implements OnDestroy, AfterViewInit {
    public readonly calendar = viewChild<FullCalendarComponent>('calendarRef');

    private readonly calendarService = inject(CalendarService);
    private readonly categoryService = inject(CategoryService);
    private readonly dialog = inject(MatDialog);
    private readonly route = inject(ActivatedRoute);
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly destroy$ = new Subject<void>();

    // --- Signals & State ---
    public readonly title = signal<string>('');
    public readonly isToday = signal<boolean>(true);
    public readonly currentView = signal<string>('dayGridMonth');
    public readonly showFilters = signal<boolean>(false);
    public readonly loading = signal<boolean>(false);

    protected readonly isMobile = toSignal(
        this.breakpointObserver
            .observe([Breakpoints.Handset])
            .pipe(map((result) => result.matches)),
        { initialValue: false },
    );

    protected readonly showPastEvents = signal<boolean>(
        this.isMobile() ? false : true,
    );

    public readonly categoryList = this.categoryService.categories;
    public readonly categoryControl = new FormControl<string[]>([]);

    private readonly categoryControlValue = toSignal(
        this.categoryControl.valueChanges,
        { initialValue: [] as string[] },
    );

    public readonly selectedCategoryIds = computed(() => {
        const ids = this.categoryControlValue() || [];
        return ids.length === 0 || ids.length === this.categoryList().length
            ? []
            : ids;
    });

    private get calendarApi() {
        return this.calendar()?.getApi();
    }

    constructor() {
        this.initCategoryControl();
        this.setupCategorySelectionListener();
        this.setupMobileViewListener();
    }

    ngAfterViewInit(): void {
        const isHandset = this.breakpointObserver.isMatched(
            Breakpoints.Handset,
        );
        if (isHandset && this.calendarApi) {
            this.changeView('listMonth');
            this.currentView.set('listMonth');
            this.updateTodayStatus();
        }

        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const dateParam = params['date'];

                if (!dateParam) return;

                const date = new Date(dateParam);

                if (date && this.calendarApi) this.calendarApi?.gotoDate(date);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // --- Initialization ---
    private setupMobileViewListener() {
        effect(() => {
            const api = this.calendarApi;
            const mobile = this.isMobile();

            if (api) {
                if (mobile) {
                    api.changeView('listMonth');
                    this.currentView.set('listMonth');
                } else {
                    api.changeView('dayGridMonth');
                    this.currentView.set('dayGridMonth');
                }
                this.updateTodayStatus();
            }
        });
    }

    private initCategoryControl() {
        effect(() => {
            const categories = this.categoryList();
            if (
                categories.length > 0 &&
                (this.categoryControl.value?.length || 0) === 0
            ) {
                this.categoryControl.setValue(categories.map((c) => c.id));
            }
        });
    }

    private setupCategorySelectionListener() {
        this.categoryControl.valueChanges
            .pipe(takeUntil(this.destroy$), debounceTime(500))
            .subscribe(() => {
                if (this.calendar()) {
                    this.calendarApi?.refetchEvents();
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
        if (
            (event.altKey && event.key.toLowerCase() === 'f') ||
            (event.key === '/' && !(event.target instanceof HTMLInputElement))
        ) {
            event.preventDefault();
            this.openSearchResult();
        }
    }

    // --- UI Actions ---
    public calendarAction(action: string) {
        const api = this.calendarApi;
        if (!api) return;

        switch (action) {
            case 'today':
                api.today();
                break;
            case 'prev':
                api.prev();
                break;
            case 'prevYear':
                api.prevYear();
                break;
            case 'next':
                api.next();
                break;
            case 'nextYear':
                api.nextYear();
                break;
            case 'changeMonth':
                this.changeView('dayGridMonth');
                break;
            case 'changeWeek':
                this.changeView('timeGridWeek');
                break;
            case 'changeDay':
                this.changeView('timeGridDay');
                break;
        }
        this.updateTodayStatus();
    }

    private changeView(viewName: string) {
        const api = this.calendarApi;
        if (!api) return;

        api.changeView(viewName);
        this.currentView.set(viewName);
        this.title.set(api.view.title);
    }

    private updateTodayStatus() {
        const api = this.calendarApi;
        if (!api) return;

        const view = api.view;
        const start = dayjs(view.currentStart).startOf('day');
        const end = dayjs(view.currentEnd).startOf('day');
        const today = dayjs().startOf('day');

        this.isToday.set(today.isSameOrAfter(start) && today.isBefore(end));
    }

    public openSideNav() {
        this.dialog.open(SidenavComponent, {
            position: this.isMobile()
                ? { bottom: '120px' }
                : { top: '90px', left: '30px' },
            width: this.isMobile() ? '90vw' : 'auto',
            height: 'auto',
            hasBackdrop: true,
            backdropClass: 'transparent-backdrop',
            data: 'calendar',
        });
    }

    // --- Event Operations ---
    public createEvent() {
        const api = this.calendarApi;
        if (!api) return;

        const anchorDate = api.getDate();
        this.dialog
            .open(EventDialogComponent, {
                width: this.isMobile() ? '100vw' : 'auto',
                height: this.isMobile() ? '100vh' : 'auto',
                minWidth: this.isMobile() ? '100vw' : '600px',
                maxWidth: this.isMobile() ? '100vw' : '1500px',
                panelClass: this.isMobile() ? 'full-screen-dialog' : '',
                data: { anchorDate, event: null },
            })
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.calendarService
                        .createEvent(result)
                        .subscribe(() => api.refetchEvents());
                }
            });
    }

    public updateEvent(arg: EventClickArg) {
        const eventData = CalendarMapper.fromFullCalendarEvent(arg.event);

        if (eventData.isTodo === true) return;

        if (eventData.recurrenceRule) {
            this.dialog
                .open(RecurrenceChoiceDialogComponent)
                .afterClosed()
                .subscribe((choice) => {
                    if (choice)
                        this.openEventDialog(eventData, choice === 'instance');
                });
        } else {
            this.openEventDialog(eventData);
        }
    }

    private openEventDialog(eventData: any, isInstance: boolean = false) {
        const dialogConfig = {
            width: this.isMobile() ? '100vw' : 'auto',
            height: this.isMobile() ? '100vh' : 'auto',
            minWidth: this.isMobile() ? '100vw' : '600px',
            maxWidth: this.isMobile() ? '100vw' : '1500px',
            panelClass: this.isMobile() ? 'full-screen-dialog' : '',
            data: {
                event: isInstance
                    ? {
                          ...eventData,
                          recurrenceRule: null,
                          recurrenceEnd: null,
                          eventId: null,
                      }
                    : eventData,
            },
        };

        this.dialog
            .open(EventDialogComponent, dialogConfig)
            .afterClosed()
            .subscribe((result) => {
                if (!result) return;

                if (result.action === 'update') {
                    if (isInstance) {
                        this.splitEventFromSeries(eventData, result.data);
                    } else {
                        this.calendarService
                            .updateEvent(result.data)
                            .subscribe(() => this.calendarApi?.refetchEvents());
                    }
                } else if (result.action === 'delete') {
                    if (isInstance) {
                        this.excludeDateFromSeries(eventData);
                    } else {
                        this.calendarService
                            .deleteEvent(result.data)
                            .subscribe(() => this.calendarApi?.refetchEvents());
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
        const dateToExclude = dayjs(instance.startDateTime).format(
            'YYYY-MM-DD',
        );
        this.calendarService
            .excludeDateFromSeries(instance.eventId, dateToExclude)
            .subscribe({
                next: () => this.calendarApi?.refetchEvents(),
                error: (err) => console.error('Failed to exclude date:', err),
            });
    }

    public handleEventDrop(arg: EventDropArg) {
        const event = arg.event;

        if (event.extendedProps['isTodo'] === true) return;

        const isRecurring = !!event.extendedProps['recurrenceRule'];
        const updatedEvent = CalendarMapper.toCalendarEvent(event);

        if (isRecurring) {
            this.dialog
                .open(RecurrenceChoiceDialogComponent)
                .afterClosed()
                .subscribe((choice) => {
                    if (choice === 'series') {
                        this.calendarService
                            .updateEvent(updatedEvent)
                            .subscribe({
                                next: () => this.calendarApi?.refetchEvents(),
                                error: (err) => {
                                    console.error('Drop failed:', err);
                                    arg.revert();
                                },
                            });
                    } else if (choice === 'instance') {
                        const originalInstance =
                            CalendarMapper.fromFullCalendarEvent(arg.oldEvent);
                        this.splitEventFromSeries(
                            originalInstance,
                            updatedEvent,
                        );
                    } else {
                        arg.revert();
                    }
                });
        } else {
            this.calendarService.updateEvent(updatedEvent).subscribe({
                error: (err) => {
                    console.error('Drop failed:', err);
                    arg.revert();
                },
            });
        }
    }

    public openSearchResult() {
        this.dialog
            .open(SearchDialogComponent, {
                width: this.isMobile() ? '100vw' : 'auto',
                height: this.isMobile() ? '100vh' : 'auto',
                minWidth: this.isMobile() ? '100vw' : '600px',
                maxWidth: this.isMobile() ? '100vw' : '1500px',
                panelClass: this.isMobile() ? 'full-screen-dialog' : '',
            })
            .afterClosed()
            .subscribe((result) => {
                if (result?.data) {
                    this.calendarApi?.gotoDate(result.data);
                    this.calendarApi?.select(result.data);
                } else {
                    this.calendarApi?.refetchEvents();
                }
            });
    }

    // --- Calendar Configuration ---
    public readonly calendarOptions: CalendarOptions = {
        ...defaultCalendarOptions,
        datesSet: () => {
            const api = this.calendarApi;
            if (api) {
                this.title.set(api.view.title);
            }
        },
        loading: (isLoading) => this.loading.set(isLoading),
        eventSources: [
            {
                events: (fetchInfo, successCallback, failureCallback) => {
                    this.calendarService
                        .getEvents(
                            fetchInfo.startStr,
                            fetchInfo.endStr,
                            this.selectedCategoryIds(),
                        )
                        .subscribe({
                            next: (events) => {
                                const mappedEvents = events.map((e) =>
                                    CalendarMapper.toEventInput(
                                        e,
                                        this.categoryList(),
                                    ),
                                );

                                // Manual expansion for events with EXDATE
                                // The FullCalendar RRule plugin is unreliable with EXDATE in the object format
                                const processedEvents: any[] = [];
                                const viewStart = dayjs(
                                    fetchInfo.start,
                                ).startOf('day');
                                const viewEnd = dayjs(fetchInfo.end).startOf(
                                    'day',
                                );

                                for (const event of mappedEvents) {
                                    if (
                                        event.rrule &&
                                        event.exdate &&
                                        Array.isArray(event.exdate) &&
                                        event.exdate.length > 0
                                    ) {
                                        let current = dayjs(viewStart);
                                        while (current.isBefore(viewEnd)) {
                                            if (
                                                CalendarMapper.eventFallsOnDate(
                                                    event.rrule,
                                                    current,
                                                    event.exdate,
                                                )
                                            ) {
                                                const instance = { ...event };
                                                delete instance.rrule;

                                                if (event.allDay) {
                                                    instance.start =
                                                        current.format(
                                                            'YYYY-MM-DD',
                                                        );
                                                    instance.end = current
                                                        .add(1, 'day')
                                                        .format('YYYY-MM-DD');
                                                } else {
                                                    const timePart = dayjs(
                                                        event.start as string,
                                                    ).format('HH:mm:ss');
                                                    instance.start =
                                                        current.format(
                                                            'YYYY-MM-DD',
                                                        ) +
                                                        'T' +
                                                        timePart;
                                                    if (event.duration) {
                                                        instance.end = dayjs(
                                                            instance.start,
                                                        )
                                                            .add(
                                                                dayjs.duration(
                                                                    event.duration as string,
                                                                ),
                                                            )
                                                            .format(
                                                                'YYYY-MM-DDTHH:mm:ss',
                                                            );
                                                    }
                                                }
                                                processedEvents.push(instance);
                                            }
                                            current = current.add(1, 'day');
                                        }
                                    } else {
                                        processedEvents.push(event);
                                    }
                                }

                                const today = dayjs();
                                const hasEventToday = processedEvents.some(
                                    (e) => {
                                        if (e.rrule)
                                            return CalendarMapper.eventFallsOnDate(
                                                e.rrule,
                                                today,
                                            );
                                        return (
                                            dayjs(e.start).format(
                                                'YYYY-MM-DD',
                                            ) === today.format('YYYY-MM-DD')
                                        );
                                    },
                                );

                                if (
                                    !hasEventToday &&
                                    this.currentView() === 'listMonth'
                                ) {
                                    processedEvents.push({
                                        id: 'today-placeholder',
                                        title: 'Keine Termine geplant',
                                        start: today.format('YYYY-MM-DD'),
                                        allDay: true,
                                        display: 'list-item',
                                        extendedProps: { isPlaceholder: true },
                                    });
                                }

                                successCallback(processedEvents);
                            },
                            error: (err) => failureCallback(err),
                        });
                },
            },
            {
                events: (info, successCallback, failureCallback) => {
                    this.calendarService
                        .getHolidays(info.start.getFullYear().toString())
                        .subscribe({
                            next: (holidays) =>
                                successCallback(
                                    holidays.map((h, i) => ({
                                        id: `holiday-${i}`,
                                        start: dayjs(h.date).format(
                                            'YYYY-MM-DD',
                                        ),
                                        end: dayjs(h.date)
                                            .add(1, 'day')
                                            .format('YYYY-MM-DD'),
                                        display: 'background',
                                        title: h.name,
                                    })),
                                ),
                            error: (err) => failureCallback(err),
                        });
                },
            },
        ],
        eventClick: this.updateEvent.bind(this),
        eventDrop: this.handleEventDrop.bind(this),
    };
}
