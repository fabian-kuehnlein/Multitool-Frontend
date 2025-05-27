import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CalendarService } from '../../../shared/calendar.service';
import { Category } from '../../../shared/models/Category';
import { CreateCalendarEvent } from '../../../shared/models/CreateCalendarEvent';
import moment from 'moment';
import { CalendarEvent } from '../../../shared/models/Calendarevent';

@Component({
  selector: 'app-event-dialog',
  imports: [
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  providers: [provideMomentDateAdapter()],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.scss'
})
export class EventDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<EventDialogComponent>);
    private readonly calendarService = inject(CalendarService);
    private readonly dialogData = inject(MAT_DIALOG_DATA) as CalendarEvent;
    public isEditMode = false;

    categories: Category[] = [];

    protected readonly values = signal<Record<string, string>>({
        eventTitle: '',
        eventNote: ''
    });

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
        endDate: [null],
        endTime: [null],
        isAllDay: [false],
        categoryId: ['', [Validators.required]]
    }, { validators: FormValidator });
    
    ngOnInit() {
        this.eventForm.get('isAllDay')?.valueChanges.subscribe((isAllDay: boolean) => {
            if (isAllDay) {
                this.eventForm.get('startTime')!.disable();
                this.eventForm.get('endTime')!.disable();
            } else {
                this.eventForm.get('startTime')!.enable();
                this.eventForm.get('endTime')!.enable();
            }
        })

        this.calendarService.getCategories().subscribe(categories => {
            if (categories.length > 0) {
                this.categories = categories;
            }
        })

        this.isEditMode = !!this.dialogData;
    };

    create() {
        if (this.eventForm.valid) {
            const form = this.eventForm.value;

            const newEvent: CreateCalendarEvent = {
                eventTitle: form.eventTitle,
                eventNote: form.eventNote?.trim() === "" ? null : form.eventNote,
                startDateTime: this.buildDate(form.startDate, form.startTime, form.isAllDay),
                endDateTime: this.buildDate(
                    form.endDate ?? form.startDate,
                    form.endTime ?? form.startTime,
                    form.isAllDay),
                isAllDay: form.isAllDay,
                categoryId: form.categoryId
            }

            this.dialogRef.close(newEvent);
        }
    }

    update() {
        if (this.eventForm.valid) {
            const form = this.eventForm.value;

            const updatedEvent: CalendarEvent = {
                eventId: this.dialogData?.eventId,
                eventTitle: form.eventTitle,
                eventNote: form.eventNote?.trim() === "" ? null : form.eventNote,
                startDateTime: this.buildDate(form.startDate, form.startTime, form.isAllDay),
                endDateTime: this.buildDate(
                    form.endDate ?? form.startDate,
                    form.endTime ?? form.startTime,
                    form.isAllDay),
                isAllDay: form.isAllDay,
                categoryId: form.categoryId
            }

            this.dialogRef.close({ data: updatedEvent, action: 'update' });
        }
    }

    delete() {
        if (this.dialogData) {
            const eventId = this.dialogData.eventId;
            this.dialogRef.close({ data: eventId, action: 'delete' });
        } else {
            this.dialogRef.close(null);
        }
    }

    close() {
        this.dialogRef.close(null);
    }

    buildDate(date: any, time: any, isAllDay: boolean): string | null {
        if (!date) return null;
        
        const dateObj = moment(date).clone();

        if (!isAllDay && time) {
            dateObj.set({
                hour: time.hour(),
                minute: time.minute(),
                second: 0,
                millisecond: 0
            });
        } else {
            dateObj.set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            });
        }

        return dateObj.format('YYYY-MM-DDTHH:mm:ss');
    }
}

export const FormValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const title = group.get('eventTitle')?.value;
    const isAllDay = group.get('isAllDay')?.value;
    const startDate = group.get('startDate')?.value;
    const startTime = group.get('startTime')?.value;
    const endDate = group.get('endDate')?.value;
    const endTime = group.get('endTime')?.value;

    const errors: ValidationErrors = {};

    // Validate title
    if (!title) errors['titleIsMissing'] = true;

    // Validate start date
    if (!startDate) errors['startDateMissing'] = true;

    // Validate start time
    if (!isAllDay && !startTime) errors['startTimeMissing'] = true;

    // Validate end date and time
    if (endDate) {
        if (endDate.isBefore(startDate)) {
            group.get('endDate')?.setErrors({ endBeforeStart: true });
        }

        if (!isAllDay && !endTime) {
            group.get('endTime')?.setErrors({ endTimeMissing: true });
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}
