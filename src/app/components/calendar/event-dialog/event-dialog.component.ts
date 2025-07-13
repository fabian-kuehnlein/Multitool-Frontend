// Angular
import { Component, Inject, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';

// Angular Material Form Controls
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatDividerModule } from '@angular/material/divider';

// App Services & Models
import { CalendarService } from '../calendar.service';
import { Category } from '../models/Category';
import { CreateCalendarEvent } from '../models/CreateCalendarEvent';
import { CalendarEvent } from '../models/Calendarevent';

// Third-party Libraries
import moment from 'moment';
import { Subject, takeUntil } from 'rxjs';
import { UI_MODULES } from '../../../shared/material-ui';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-event-dialog',
  imports: [
    UI_MODULES,
    MatDatepickerModule,
    MatTimepickerModule,
    MatSlideToggleModule,
    MatDividerModule,
    NgClass
  ],
  providers: [provideMomentDateAdapter()],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.scss'
})
export class EventDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<EventDialogComponent>);
    public dialog = inject(MatDialog);
    private readonly destroy$ = new Subject<void>();
    private readonly calendarService = inject(CalendarService);
    public readonly isEditMode = signal<boolean>(false);
    public readonly isChanged = signal<boolean>(false);
    public readonly startAt = signal<Date | null>(null);
    private originalEvent: CalendarEvent | null = null;

    categories: Category[] = [];

    // for char-count on title and note inputsa
    protected readonly values = signal<Record<string, string>>({
        eventTitle: '',
        eventNote: ''
    });

    // handles char-count for title and note inputs
    protected onInput(key: string, event: Event) {
        const input = (event.target as HTMLInputElement).value;
        this.values.update(current => ({
            ...current,
            [key]: input
        }));
    }

    eventForm: FormGroup = this.fb.group({
        eventTitle: ['', [Validators.required, Validators.maxLength(100)]],
        eventNote: ['', [Validators.maxLength(200)]],
        startDate: [null, [Validators.required]],
        startTime: [null, [Validators.required]],
        endDate: [null, [Validators.required]],
        endTime: [null],
        isAllDay: [false],
        categoryId: ['', [Validators.required]],
        isRecurring: [false],
        recurrenceFrequency: ['WEEKLY'],
        recurrenceInterval: [0],
        recurrenceByDay: [[]],
        recurrenceEndDate: [null]
    }, { validators: FormValidator });

    public readonly weekdayOptions = [
        { value: 'MO', label: 'Montag' },
        { value: 'TU', label: 'Dienstag' },
        { value: 'WE', label: 'Mittwoch' },
        { value: 'TH', label: 'Donnerstag' },
        { value: 'FR', label: 'Freitag' },
        { value: 'SA', label: 'Samstag' },
        { value: 'SU', label: 'Sonntag' }
    ];

    getFirstSelectedWeekdayLabel(): string {
        const firstSelected = this.eventForm.get('recurrenceByDay')?.value?.[0];
        return this.weekdayOptions.find(d => d.value === firstSelected)?.label || '';
    }

    constructor(@Inject(MAT_DIALOG_DATA) public dialogData: any) {
        const title = dialogData?.event?.eventTitle ?? '';
        const note = dialogData?.event?.eventNote ?? '';

        this.values.set({
            ...this.values(),
            eventTitle: title,
            eventNote: note
        })
    }
    
    ngOnInit() {
        this.eventForm.get('isAllDay')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isAllDay: boolean) => {
            if (isAllDay) {
                this.eventForm.get('startTime')!.disable();
                this.eventForm.get('endTime')!.disable();
            } else {
                this.eventForm.get('startTime')!.enable();
                this.eventForm.get('endTime')!.enable();
            }
        });

        this.eventForm.get('isRecurring')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isRecurring: boolean) => {
            if (isRecurring) {
                this.eventForm.get('endDate')!.disable();
            } else {
                this.eventForm.get('endDate')!.enable();
            }
        })

        this.eventForm?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.isChanged.set(!this.compareOriginalEvent());
        });

        this.calendarService.getCategories().subscribe(categories => {
            if (categories.length > 0) {
                this.categories = categories;

                if (!this.dialogData.event) {
                    const defaultCategory = categories.find(c => c.categoryName === 'Privat');
                    if (defaultCategory) {
                        this.eventForm.get('categoryId')?.setValue(defaultCategory.categoryId);
                    };
                }
            };
        });

        if (this.dialogData && this.dialogData.event) {
            this.isEditMode.set(true);

            const startDateTime = new Date(this.dialogData.event.startDateTime!);
            const endDateTime = this.dialogData.event.endDateTime ? new Date(this.dialogData.event.endDateTime) : null;
            const rule = this.dialogData.event.recurrenceRule ? this.splitRecurrenceString(this.dialogData.event.recurrenceRule) : null;
            const recurrenceEnd = this.dialogData.event.recurrenceEnd ?? null;

            this.eventForm.patchValue({
                eventTitle: this.dialogData.event.eventTitle,
                eventNote: this.dialogData.event.eventNote,
                startDate: new Date(
                    startDateTime.getFullYear(),
                    startDateTime.getMonth(),
                    startDateTime.getDate()
                ),
                startTime: new Date(
                    0, 0, 0,
                    startDateTime.getHours(),
                    startDateTime.getMinutes()
                ),
                endDate: endDateTime ? new Date(
                    endDateTime.getFullYear(),
                    endDateTime.getMonth(),
                    endDateTime.getDate()
                ) : null,
                endTime: endDateTime ? new Date(
                    0, 0, 0,
                    endDateTime.getHours(),
                    endDateTime.getMinutes()
                ) : null,
                isAllDay: this.dialogData.event.isAllDay,
                categoryId: this.dialogData.event.categoryId,
                isRecurring: !!rule,
                recurrenceFrequency: rule?.freq,
                recurrenceInterval: rule?.interval,
                recurrenceByDay: rule?.byDay ?? [],
                recurrenceEndDate: recurrenceEnd
            });

            this.originalEvent = this.eventForm.value;
        } else if (this.dialogData.anchorDate) {
            this.startAt.set(this.dialogData.anchorDate);
        }
    };

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    create() {
        if (this.eventForm.valid) {
            const form = this.eventForm.value;
            const recurrenceRule = form.isRecurring ? this.buildRecurrenceString() : null;
            const recurrenceEnd = (form.isRecurring && form.recurrenceEndDate && recurrenceRule)
                ? this.buildDate(form.recurrenceEndDate, undefined, { isRecurring: true })
                : null;

            const newEvent: CreateCalendarEvent = {
                eventTitle: form.eventTitle,
                eventNote: form.eventNote?.trim() === "" ? null : form.eventNote,
                startDateTime: this.buildDate(
                    form.startDate,
                    form.startTime,
                    {isAllDay: form.isAllDay}),
                endDateTime: this.buildDate(
                    form.endDate ?? form.startDate,
                    form.endTime ?? form.startTime,
                    { isAllDay: form.isAllDay, isRecurring: false, addDay: true }
                ),
                isAllDay: form.isAllDay,
                categoryId: form.categoryId,
                recurrenceRule: recurrenceRule,
                recurrenceEnd: recurrenceEnd
            }

            this.dialogRef.close(newEvent);
        }
    }

    update() {
        if (this.eventForm.valid) {
            const form = this.eventForm.value;
            const recurrenceRule = form.isRecurring ? this.buildRecurrenceString() : null;
            const recurrenceEnd = (form.isRecurring && form.recurrenceEndDate && recurrenceRule)
                ? this.buildDate(form.recurrenceEndDate, undefined, { isRecurring: true })
                : null;

            const updatedEvent: CalendarEvent = {
                eventId: this.dialogData.event?.eventId,
                eventTitle: form.eventTitle,
                eventNote: form.eventNote?.trim() === "" ? null : form.eventNote,
                startDateTime: this.buildDate(
                    form.startDate,
                    form.startTime,
                    {isAllDay: form.isAllDay}),
                endDateTime: this.buildDate(
                    form.endDate ?? form.startDate,
                    form.endTime ?? form.startTime,
                    { isAllDay: form.isAllDay, isRecurring: false, addDay: true, fallbackDate: form.startDate }
                ),
                isAllDay: form.isAllDay,
                categoryId: form.categoryId,
                recurrenceRule: recurrenceRule,
                recurrenceEnd: recurrenceEnd
            }

            this.dialogRef.close({ data: updatedEvent, action: 'update' });
        }
    }

    delete() {
        if (this.dialogData.event) {
            this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(result => {
                if (!result) return;
                
                const eventId = this.dialogData.event.eventId;
                this.dialogRef.close({ data: eventId, action: 'delete' });
            });
        } else {
            this.dialogRef.close(null);
        }
    }

    close() {
        this.dialogRef.close(null);
    }

    buildDate(
        _date: Date | null,
        time?: Date,
        options: { isAllDay?: boolean; isRecurring?: boolean; addDay?: boolean; fallbackDate?: Date } = {}
    ): string | null {
        const { isAllDay = false, isRecurring = false, addDay = false, fallbackDate = null } = options;

        const date = _date ?? fallbackDate;

        if (!date) return null;

        const dateMoment = moment(date);

        if (isAllDay || isRecurring) {
            if (isAllDay && addDay) {
                dateMoment.add(1, 'day');
            }
            dateMoment.startOf('day');
        } else if (time) {
            const timeMoment = moment(time);
            dateMoment.set({
                hour: timeMoment.hour(),
                minute: timeMoment.minute(),
                second: 0,
                millisecond: 0
            });
        } else {
            dateMoment.startOf('day');
        }

        return dateMoment.format('YYYY-MM-DDTHH:mm:ss');
    }

    buildRecurrenceString(): string | null {
        const freq = this.eventForm.value.recurrenceFrequency;
        const interval = this.eventForm.value.recurrenceInterval;
        const byDay = this.eventForm.value.recurrenceByDay;
        
        const validInterval = interval && interval > 0;
        const validByDay = Array.isArray(byDay) && byDay.length > 0;
        
        if ((!freq) || (!validInterval && !validByDay)) return null;
        
        let rule = `FREQ=${freq}`;
        
        if (validInterval) {
            rule += `;INTERVAL=${interval}`;
        }
        
        if (validByDay) {
            rule += `;BYDAY=${byDay.join(',')}`;
        }
        
        return rule;
    }

    splitRecurrenceString(ruleString: string) {
        const parts = ruleString.split(';');
        const rule: {
            freq: string | null;
            interval: number | null;
            byDay: string[] | null;
        } = {
            freq: null,
            interval: null,
            byDay: null
        };

        parts.forEach(part => {
            const [key, value] = part.split('=');
            switch (key) {
                case 'FREQ':
                    rule.freq = value;
                    break;
                case 'INTERVAL':
                    rule.interval = parseInt(value, 10);
                    break;
                case 'BYDAY':
                    rule.byDay = value.split(',');
            }
        });

        return rule;
    }

    // Compares the current form values with the original event data
    compareOriginalEvent(): boolean {
        if (!this.originalEvent) return false;

        const currentEvent = this.eventForm.value;

        return JSON.stringify(currentEvent) == JSON.stringify(this.originalEvent);
    }
}

// validates and emits errors depending on the error-situation
export const FormValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const title = group.get('eventTitle')?.value;
    const isAllDay = group.get('isAllDay')?.value;
    const startDate = moment(group.get('startDate')?.value);
    const startTime = moment(group.get('startTime')?.value);
    const endDate = moment(group.get('endDate')?.value);
    const endTime = moment(group.get('endTime')?.value);
    const isRecurring = group.get('isRecurring')?.value;
    const interval = group.get('recurrenceInterval')?.value;
    const byDay = group.get('recurrenceByDay')?.value;

    const errors: ValidationErrors = {};

    // Validate title
    if (!title) errors['titleIsMissing'] = true;

    // Validate start date
    if (!startDate) errors['startDateMissing'] = true;

    // Validate start time
    if (!isAllDay && !startTime) errors['startTimeMissing'] = true;

    // Validate end date and time
    if (endDate && !isRecurring) {
        if (!isAllDay && !endTime) {
            group.get('endTime')?.setErrors({ endTimeMissing: true });
        }
    } else if (isRecurring) {
        if (!isAllDay && !endTime) {
            group.get('endTime')?.setErrors({ endTimeMissing: true });
        }
    }

    if (isRecurring) {
        if (!(interval > 0 || (Array.isArray(byDay) && byDay.length > 0))) {
            errors['recurrenceInvalid'] = true;
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}
