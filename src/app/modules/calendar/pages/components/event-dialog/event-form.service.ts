import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment';
import { CreateCalendarEvent } from '../../../models/create-calendar-event.model';
import { CalendarEvent } from '../../../models/calendar-event.model';

@Injectable()
export class EventFormService {
    private readonly fb = inject(FormBuilder);

    /**
     * Initializes the form with default values or patches it with existing event data.
     */
    public buildForm(): FormGroup {
        return this.fb.group({
            eventTitle: ['', [Validators.required, Validators.maxLength(100)]],
            eventNote: ['', [Validators.maxLength(200)]],
            startDate: [null, [Validators.required]],
            startTime: [null],
            endDate: [null],
            endTime: [null],
            isAllDay: [false],
            categoryId: [1, [Validators.required]],
            isRecurring: [false],
            recurrenceFrequency: ['WEEKLY'],
            recurrenceInterval: [1],
            recurrenceByDay: [[]],
            recurrenceEndDate: [null]
        }, { validators: this.formValidator() });
    }

    /**
     * Maps form values back to a CreateCalendarEvent model.
     */
    public getCreateEventData(formValue: any): CreateCalendarEvent {
        const recurrenceRule = formValue.isRecurring ? this.buildRecurrenceString(formValue) : null;
        const recurrenceEnd = (formValue.isRecurring && formValue.recurrenceEndDate && recurrenceRule)
            ? this.formatDate(formValue.recurrenceEndDate, undefined, { isRecurring: true })
            : null;

        return {
            title: formValue.eventTitle,
            note: formValue.eventNote?.trim() === "" ? null : formValue.eventNote,
            startDateTime: this.formatDate(
                formValue.startDate,
                formValue.startTime,
                { isAllDay: formValue.isAllDay }
            )!,
            endDateTime: this.formatDate(
                formValue.endDate ?? formValue.startDate,
                formValue.endTime ?? formValue.startTime,
                { isAllDay: formValue.isAllDay, addDay: true, fallbackDate: formValue.startDate }
            ),
            isAllDay: formValue.isAllDay,
            categoryId: formValue.categoryId,
            recurrenceRule: recurrenceRule,
            recurrenceEnd: recurrenceEnd
        };
    }

    /**
     * Maps form values back to a CalendarEvent model for updates.
     */
    public getUpdateEventData(id: string, formValue: any): CalendarEvent {
        const createData = this.getCreateEventData(formValue);
        return {
            ...createData,
            id
        };
    }

    /**
     * Formats a date and optional time into an ISO string.
     */
    public formatDate(
        date: Date | null,
        time?: Date,
        options: { isAllDay?: boolean; isRecurring?: boolean; addDay?: boolean; fallbackDate?: Date } = {}
    ): string | null {
        const { isAllDay = false, isRecurring = false, addDay = false, fallbackDate = null } = options;
        const finalDate = date ?? fallbackDate;

        if (!finalDate) return null;

        const dateMoment = moment(finalDate);

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

    /**
     * Builds an RRule string from form values.
     */
    public buildRecurrenceString(formValue: any): string | null {
        const { recurrenceFrequency: freq, recurrenceInterval: interval, recurrenceByDay: byDay } = formValue;
        
        const validInterval = interval && interval > 0;
        const validByDay = Array.isArray(byDay) && byDay.length > 0;
        
        if (!freq || (!validInterval && !validByDay)) return null;
        
        let rule = `FREQ=${freq}`;
        if (validInterval) rule += `;INTERVAL=${interval}`;
        if (validByDay) rule += `;BYDAY=${byDay.join(',')}`;
        
        return rule;
    }

    /**
     * Parses an RRule string into a format suitable for the form.
     */
    public parseRecurrenceString(ruleString: string) {
        if (!ruleString) return null;

        const parts = ruleString.split(';');
        const rule: any = { freq: 'WEEKLY', interval: 1, byDay: [] };

        parts.forEach(part => {
            const [key, value] = part.split('=');
            switch (key) {
                case 'FREQ': rule.freq = value; break;
                case 'INTERVAL': rule.interval = parseInt(value, 10); break;
                case 'BYDAY': rule.byDay = value.split(','); break;
            }
        });

        return rule;
    }

    /**
     * Centralized form validator.
     */
    private formValidator(): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const isAllDay = group.get('isAllDay')?.value;
            const startDate = group.get('startDate')?.value;
            const startTime = group.get('startTime')?.value;
            const isRecurring = group.get('isRecurring')?.value;

            const errors: ValidationErrors = {};

            if (!startDate) errors['startDateMissing'] = true;
            if (!isAllDay && !startTime) errors['startTimeMissing'] = true;

            if (isRecurring) {
                const interval = group.get('recurrenceInterval')?.value;
                const byDay = group.get('recurrenceByDay')?.value;
                if (!(interval > 0 || (Array.isArray(byDay) && byDay.length > 0))) {
                    errors['recurrenceInvalid'] = true;
                }
            }

            return Object.keys(errors).length > 0 ? errors : null;
        };
    }
}
