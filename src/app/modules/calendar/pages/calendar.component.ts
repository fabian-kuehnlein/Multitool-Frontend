// Angular Core
import {
    Component,
    inject,
    signal,
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

// FullCalendar
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import type { CalendarOptions, EventClickArg, EventDropArg } from '@fullcalendar/core';

// Third Party
import dayjs from 'dayjs';
import { debounceTime, Subject, takeUntil } from 'rxjs';

// App Services, Components & Utilities
import { CalendarService } from '../services/calendar.service';
import {
    EventDialogComponent,
    EventDialogResult,
} from './components/event-dialog/event-dialog.component';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component';
import { RecurrenceChoiceDialogComponent } from './components/recurrence-choice-dialog/recurrence-choice-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
    DialogEventInput,
    fromFullCalendarEvent,
    FullCalendarEventInput,
    toCalendarEvent,
    toEventInput,
} from '../mappers/event.mapper';
import type { CalendarEvent } from '../models/calendar-event.model';
import type { CreateCalendarEvent } from '../models/create-calendar-event.model';
import {
    createTodayPlaceholder,
    expandEventInstances,
    filterPastEvents,
    hasEventToday,
    toHolidayEventInput,
} from '../logic/event-list.logic';
import {
    CalendarAction,
    defaultCalendarOptions,
} from '../utilities/calendar.config';
import { UI_MODULES } from '../../../shared/utilities/material-ui';
import { SidenavComponent } from '../../../core/layout/sidenav/sidenav.component';
import { CategoryService } from '../../../shared/services/category.service';
import { MediaService } from '../../../core/services/media.service';
import { HotkeyService, Hotkeys } from '../../../core/services/hotkey.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
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
    private readonly media = inject(MediaService);
    private readonly hotkeyService = inject(HotkeyService);
    private readonly snackbar = inject(SnackbarService);
    private readonly destroy$ = new Subject<void>();
    private readonly hotkeyUnsubscribers: Array<() => void> = [];

    // --- Signals & State ---
    public readonly title = signal<string>('');
    public readonly isToday = signal<boolean>(true);
    public readonly currentView = signal<string>('dayGridMonth');
    public readonly showFilters = signal<boolean>(false);
    public readonly loading = signal<boolean>(false);

    protected readonly isMobile = this.media.isMobile;

    protected readonly showPastEvents = signal<boolean>(
        this.media.isMobile() ? false : true,
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
        this.setupPastEventsToggle();
        this.setupHotkeys();
    }

    ngAfterViewInit(): void {
        if (this.media.isMobile() && this.calendarApi) {
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
        this.hotkeyUnsubscribers.forEach((unsubscribe) => unsubscribe());
    }

    // --- Initialization ---
    private setupMobileViewListener() {
        effect(() => {
            const api = this.calendarApi;
            const mobile = this.media.isMobile();

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

    private setupPastEventsToggle() {
        effect(() => {
            const show = this.showPastEvents();
            const api = this.calendarApi;
            if (api) {
                api.refetchEvents();
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

    // --- Hotkeys ---
    private setupHotkeys() {
        this.hotkeyUnsubscribers.push(
            this.hotkeyService.register({
                id: 'calendar.create',
                combo: Hotkeys.create,
                description: 'Neuen Eintrag erstellen',
                action: () => this.createEvent(),
            }),
            this.hotkeyService.register({
                id: 'calendar.search',
                combo: Hotkeys.search,
                description: 'Einträge suchen',
                action: () => this.openSearchResult(),
            }),
            this.hotkeyService.register({
                id: 'calendar.previous',
                combo: Hotkeys.prevPage,
                description: 'Vorherige Ansicht',
                action: () => this.calendarAction('prev'),
            }),
            this.hotkeyService.register({
                id: 'calendar.next',
                combo: Hotkeys.nextPage,
                description: 'Nächste Ansicht',
                action: () => this.calendarAction('next'),
            }),
        );
    }

    // --- UI Actions ---
    public calendarAction(action: CalendarAction) {
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
            position: this.media.isMobile()
                ? { bottom: '120px' }
                : { top: '90px', left: '30px' },
            width: this.media.isMobile() ? '90vw' : 'auto',
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
                width: this.media.isMobile() ? '100vw' : 'auto',
                height: this.media.isMobile() ? '100vh' : 'auto',
                minWidth: this.media.isMobile() ? '100vw' : '600px',
                maxWidth: this.media.isMobile() ? '100vw' : '1500px',
                panelClass: this.media.isMobile() ? 'full-screen-dialog' : '',
                data: { anchorDate, event: null },
            })
            .afterClosed()
            .subscribe((result: CreateCalendarEvent | null) => {
                if (result) {
                    this.calendarService
                        .createEvent(result)
                        .subscribe(() => api.refetchEvents());
                }
            });
    }

    public updateEvent(arg: EventClickArg) {
        const eventData = fromFullCalendarEvent(arg.event);

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

    private openEventDialog(
        eventData: FullCalendarEventInput,
        isInstance: boolean = false,
    ) {
        let dialogEvent: DialogEventInput = eventData;

        if (isInstance) {
            dialogEvent = {
                ...eventData,
                recurrenceRule: null,
                recurrenceEnd: null,
                eventId: null,
            };
        } else if (eventData.recurrenceRule) {
            dialogEvent = {
                ...eventData,
                startDateTime: eventData.seriesStartDateTime ?? null,
                endDateTime: eventData.seriesEndDateTime ?? null,
            };
        }

        const dialogConfig = {
            width: this.media.isMobile() ? '100vw' : 'auto',
            height: this.media.isMobile() ? '100vh' : 'auto',
            minWidth: this.media.isMobile() ? '100vw' : '600px',
            maxWidth: this.media.isMobile() ? '100vw' : '1500px',
            panelClass: this.media.isMobile() ? 'full-screen-dialog' : '',
            data: { event: dialogEvent },
        };

        this.dialog
            .open(EventDialogComponent, dialogConfig)
            .afterClosed()
            .subscribe((result: EventDialogResult | null) => {
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

    private splitEventFromSeries(
        originalInstance: FullCalendarEventInput,
        updatedData: CalendarEvent,
    ) {
        const { id, ...newEvent } = updatedData;
        this.calendarService
            .createEvent({ ...newEvent, isAllDay: newEvent.isAllDay ?? false })
            .subscribe(() => {
                this.excludeDateFromSeries(originalInstance);
            });
    }

    private excludeDateFromSeries(instance: FullCalendarEventInput) {
        if (!instance.startDateTime) return;
        const dateToExclude = dayjs(instance.startDateTime).format(
            'YYYY-MM-DD',
        );
        this.calendarService
            .excludeDateFromSeries(instance.eventId, dateToExclude)
            .subscribe({
                next: () => this.calendarApi?.refetchEvents(),
                error: () =>
                    this.snackbar.openError(
                        'Der Termin konnte nicht aus der Serie entfernt werden.',
                    ),
            });
    }

    public handleEventDrop(arg: EventDropArg) {
        const event = arg.event;

        if (event.extendedProps['isTodo'] === true) return;

        const isRecurring = !!event.extendedProps['recurrenceRule'];
        const updatedEvent = toCalendarEvent(event);

        if (isRecurring) {
            this.dialog
                .open(ConfirmDialogComponent, {
                    data: {
                        title: 'Termin aus Serie entfernen',
                        message:
                            'Dieser Termin wird aus der Serie entfernt und als einzelner Termin verschoben. Möchtest du fortfahren?',
                        confirmText: 'Entfernen',
                        isDestructive: true,
                    },
                })
                .afterClosed()
                .subscribe((confirmed) => {
                    if (!confirmed) {
                        arg.revert();
                        return;
                    }
                    const originalInstance =
                        fromFullCalendarEvent(arg.oldEvent);
                    this.splitEventFromSeries(originalInstance, updatedEvent);
                });
        } else {
            this.calendarService.updateEvent(updatedEvent).subscribe({
                error: () => {
                    this.snackbar.openError(
                        'Der Termin konnte nicht verschoben werden.',
                    );
                    arg.revert();
                },
            });
        }
    }

    public openSearchResult() {
        this.dialog
            .open(SearchDialogComponent, {
                width: this.media.isMobile() ? '100vw' : 'auto',
                height: this.media.isMobile() ? '100vh' : 'auto',
                minWidth: this.media.isMobile() ? '100vw' : '600px',
                maxWidth: this.media.isMobile() ? '100vw' : '1500px',
                panelClass: this.media.isMobile() ? 'full-screen-dialog' : '',
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
                                    toEventInput(e, this.categoryList()),
                                );

                                // Manual expansion for events with EXDATE
                                // The FullCalendar RRule plugin is unreliable
                                // with EXDATE in the object format
                                let processedEvents = expandEventInstances(
                                    mappedEvents,
                                    dayjs(fetchInfo.start).startOf('day'),
                                    dayjs(fetchInfo.end).startOf('day'),
                                );

                                const today = dayjs();
                                if (
                                    !hasEventToday(processedEvents) &&
                                    this.currentView() === 'listMonth'
                                ) {
                                    processedEvents.push(
                                        createTodayPlaceholder(today),
                                    );
                                }

                                let finalEvents = processedEvents;
                                if (!this.showPastEvents()) {
                                    finalEvents = filterPastEvents(
                                        processedEvents,
                                        today,
                                    );
                                }

                                successCallback(finalEvents);
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
                                    holidays.map((h, i) =>
                                        toHolidayEventInput(h.name, h.date, i),
                                    ),
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
