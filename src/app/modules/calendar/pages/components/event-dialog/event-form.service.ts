import { Injectable, inject } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs';
import { CreateCalendarEvent } from '../../../models/create-calendar-event.model';
import { CalendarEvent } from '../../../models/calendar-event.model';
import { combineDateAndTime } from '../../../utilities/date.util';

@Injectable()
export class EventFormService {
    private readonly fb = inject(FormBuilder);

    /**
     * Initializes the form with default values or patches it with existing event data.
     */
    public buildForm(): FormGroup {
        return this.fb.group(
            {
                eventTitle: [
                    '',
                    [Validators.required, Validators.maxLength(100)],
                ],
                eventNote: ['', [Validators.maxLength(200)]],
                startDate: [null, [Validators.required]],
                startTime: [null],
                endDate: [null, [Validators.required]],
                endTime: [null],
                isAllDay: [false],
                categoryId: [1, [Validators.required]],
                isRecurring: [false],
                recurrenceFrequency: ['WEEKLY'],
                recurrenceInterval: [1],
                recurrenceByDay: [[]],
                recurrenceEndDate: [null],
                exDates: [[]],
            },
            { validators: this.formValidator() },
        );
    }

    /**
     * Maps form values back to a CreateCalendarEvent model.
     */
    public getCreateEventData(formValue: any): CreateCalendarEvent {
        const recurrenceRule = formValue.isRecurring
            ? this.buildRecurrenceString(formValue)
            : null;
        const recurrenceEnd =
            formValue.isRecurring &&
            formValue.recurrenceEndDate &&
            recurrenceRule
                ? this.formatDate(formValue.recurrenceEndDate, undefined, {
                      isRecurring: true,
                  })
                : null;

        const startDateTime = this.formatDate(
            formValue.startDate,
            formValue.startTime,
            { isAllDay: formValue.isAllDay },
        );
        let endDateTime = this.formatDate(
            formValue.endDate ?? formValue.startDate,
            formValue.endTime ?? formValue.startTime,
            {
                isAllDay: formValue.isAllDay,
                addDay: true,
                fallbackDate: formValue.startDate,
            },
        );

        if (
            startDateTime &&
            endDateTime &&
            !dayjs(endDateTime).isAfter(startDateTime) &&
            this.isUnsetTime(formValue.endTime)
        ) {
            endDateTime = startDateTime;
        }

        return {
            title: formValue.eventTitle,
            note:
                formValue.eventNote?.trim() === '' ? null : formValue.eventNote,
            startDateTime,
            endDateTime,
            isAllDay: formValue.isAllDay,
            categoryId: formValue.categoryId,
            recurrenceRule: recurrenceRule,
            recurrenceEnd: recurrenceEnd,
        };
    }

    /**
     * Maps form values back to a CalendarEvent model for updates.
     */
    public getUpdateEventData(id: string, formValue: any): CalendarEvent {
        const createData = this.getCreateEventData(formValue);
        return {
            ...createData,
            id,
        };
    }

    /**
     * Formats a date and optional time into an ISO string.
     */
    public formatDate(
        date: Date | null,
        time?: Date,
        options: {
            isAllDay?: boolean;
            isRecurring?: boolean;
            addDay?: boolean;
            fallbackDate?: Date;
        } = {},
    ): string | null {
        const {
            isAllDay = false,
            isRecurring = false,
            addDay = false,
            fallbackDate = null,
        } = options;
        const finalDate = date ?? fallbackDate;

        if (!finalDate) return null;

        let result: Dayjs;

        if (isAllDay || isRecurring) {
            result = dayjs(finalDate);
            if (isAllDay && addDay) {
                result = result.add(1, 'day');
            }
            result = result.startOf('day');
        } else {
            result = combineDateAndTime(finalDate, time) ?? dayjs(finalDate);
        }

        return result.format('YYYY-MM-DDTHH:mm:ss');
    }

    /**
     * Treats a missing time or midnight (00:00) as an unset time.
     */
    private isUnsetTime(time: Date | null): boolean {
        if (!time) return true;
        return time.getHours() === 0 && time.getMinutes() === 0;
    }

    /**
     * Builds an RRule string from form values.
     */
    public buildRecurrenceString(formValue: any): string | null {
        const {
            recurrenceFrequency: freq,
            recurrenceInterval: interval,
            recurrenceByDay: byDay,
            exDates,
        } = formValue;

        const validInterval = interval && interval > 0;
        const validByDay = Array.isArray(byDay) && byDay.length > 0;

        if (!freq || (!validInterval && !validByDay)) return null;

        let rule = `FREQ=${freq}`;
        if (validInterval) rule += `;INTERVAL=${interval}`;
        if (validByDay) rule += `;BYDAY=${byDay.join(',')}`;
        if (Array.isArray(exDates) && exDates.length > 0) {
            rule += `;EXDATE=${exDates.join(',')}`;
        }

        return rule;
    }

    /**
     * Parses an RRule string into a format suitable for the form.
     */
    public parseRecurrenceString(ruleString: string) {
        if (!ruleString) return null;

        const parts = ruleString.split(';');
        const rule: any = {
            freq: 'WEEKLY',
            interval: 1,
            byDay: [],
            exDates: [],
        };

        parts.forEach((part) => {
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
                    break;
                case 'EXDATE':
                    rule.exDates = value.split(',');
                    break;
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
            const endDate = group.get('endDate')?.value;
            const endTime = group.get('endTime')?.value;
            const isRecurring = group.get('isRecurring')?.value;

            const errors: ValidationErrors = {};

            if (!startDate) errors['startDateMissing'] = true;
            if (!isAllDay && !startTime) errors['startTimeMissing'] = true;
            if (!isAllDay && !isRecurring && !endDate)
                errors['endDateMissing'] = true;

            if (!isAllDay && !isRecurring && startDate && endDate) {
                const start = combineDateAndTime(startDate, startTime);
                const end = combineDateAndTime(endDate, endTime);
                if (
                    start &&
                    end &&
                    end.isBefore(start) &&
                    !this.isUnsetTime(endTime)
                ) {
                    errors['endBeforeStart'] = true;
                }
            }

            if (isRecurring) {
                const interval = group.get('recurrenceInterval')?.value;
                const byDay = group.get('recurrenceByDay')?.value;
                if (!(
                    interval > 0 ||
                    (Array.isArray(byDay) && byDay.length > 0)
                )) {
                    errors['recurrenceInvalid'] = true;
                }
            }

            return Object.keys(errors).length > 0 ? errors : null;
        };
    }
}
