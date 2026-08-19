import { Injectable, inject } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import dayjs from 'dayjs';
import { CreateCalendarEvent } from '../../../models/create-calendar-event.model';
import { GetICalLinkEvent } from '../../../models/get-ical-link-event.model';
import { CalendarEvent } from '../../../models/calendar-event.model';
import {
    combineDateAndTime,
    formatDate,
    isUnsetTime,
} from '../../../utilities/date.util';
import {
    buildRecurrenceRuleString,
    parseRecurrenceRuleString,
} from '../../../logic/rrule.logic';
import { DialogEventInput } from '../../../mappers/event.mapper';

export interface EventFormValue {
    eventTitle: string;
    eventNote: string | null;
    startDate: Date | null;
    startTime: Date | null;
    endDate: Date | null;
    endTime: Date | null;
    isAllDay: boolean;
    categoryId: number | null;
    isRecurring: boolean;
    recurrenceFrequency: string;
    recurrenceInterval: number;
    recurrenceByDay: string[];
    recurrenceEndDate: Date | null;
    exDates: string[];
}

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
                categoryId: [null as number | null, [Validators.required]],
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
    public getCreateEventData(formValue: EventFormValue): CreateCalendarEvent {
        const recurrenceRule = formValue.isRecurring
            ? this.buildRecurrenceString(formValue)
            : null;
        const recurrenceEnd =
            formValue.isRecurring && formValue.recurrenceEndDate
                ? formatDate(formValue.recurrenceEndDate, null, {
                      isRecurring: true,
                  })
                : null;

        const startDateTime = formatDate(
            formValue.startDate,
            formValue.startTime,
            { isAllDay: formValue.isAllDay },
        );
        let endDateTime = formatDate(
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
            isUnsetTime(formValue.endTime)
        ) {
            endDateTime = startDateTime;
        }

        return {
            title: formValue.eventTitle,
            note:
                formValue.eventNote?.trim() === ''
                    ? null
                    : formValue.eventNote,
            startDateTime,
            endDateTime,
            isAllDay: formValue.isAllDay,
            categoryId: formValue.categoryId!,
            recurrenceRule: recurrenceRule,
            recurrenceEnd: recurrenceEnd,
        };
    }

    /**
     * Maps form values back to a CalendarEvent model for updates.
     */
    public getUpdateEventData(
        id: string,
        formValue: EventFormValue,
    ): CalendarEvent {
        const createData = this.getCreateEventData(formValue);
        return {
            ...createData,
            id,
        };
    }

    /**
     * Maps form values back to the payload expected by the iCal link endpoint.
     */
    public getIcalLinkData(formValue: EventFormValue): GetICalLinkEvent {
        const createData = this.getCreateEventData(formValue);
        return {
            title: createData.title,
            note: createData.note,
            startDateTime: this.withLocalOffset(createData.startDateTime),
            endDateTime: this.withLocalOffset(createData.endDateTime),
        };
    }

    /**
     * Appends the local timezone offset to a floating datetime string so the
     * backend can convert it to UTC for the iCal export. Without an offset the
     * backend treats the value as UTC, which shifts the event by the local
     * UTC offset (e.g. +2h in Germany).
     */
    private withLocalOffset(value: string | null | undefined): string | null {
        if (!value) return null;
        return dayjs(value).format('YYYY-MM-DDTHH:mm:ssZ');
    }

    /**
     * Builds an RRule string from form values.
     */
    public buildRecurrenceString(formValue: EventFormValue): string | null {
        return buildRecurrenceRuleString({
            freq: formValue.recurrenceFrequency,
            interval: formValue.recurrenceInterval,
            byDay: formValue.recurrenceByDay,
            exDates: formValue.exDates,
        });
    }

    /**
     * Parses an RRule string into a format suitable for the form.
     */
    public parseRecurrenceString(
        ruleString: string | null | undefined,
    ) {
        return parseRecurrenceRuleString(ruleString);
    }

    /**
     * Fills the form with existing event data for editing.
     */
    public patchFormForEdit(form: FormGroup, event: DialogEventInput): void {
        const start = event.startDateTime ? dayjs(event.startDateTime) : null;
        const end = event.endDateTime ? dayjs(event.endDateTime) : null;
        const rrule = parseRecurrenceRuleString(event.recurrenceRule);

        form.patchValue({
            eventTitle: event.eventTitle,
            eventNote: event.eventNote,
            categoryId: event.categoryId ?? null,
            startDate: start?.isValid()
                ? start.startOf('day').toDate()
                : null,
            startTime: start?.isValid()
                ? new Date(0, 0, 0, start.hour(), start.minute())
                : null,
            endDate: end?.isValid() ? end.startOf('day').toDate() : null,
            endTime: end?.isValid()
                ? new Date(0, 0, 0, end.hour(), end.minute())
                : null,
            isAllDay: event.isAllDay,
            isRecurring: !!rrule,
            recurrenceFrequency: rrule?.freq || 'WEEKLY',
            recurrenceInterval: rrule?.interval || 1,
            recurrenceByDay: rrule?.byDay || [],
            recurrenceEndDate: event.recurrenceEnd
                ? dayjs(event.recurrenceEnd).toDate()
                : null,
            exDates: rrule?.exDates || [],
        });
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
                    !isUnsetTime(endTime)
                ) {
                    errors['endBeforeStart'] = true;
                }
            }

            if (isRecurring) {
                const interval = group.get('recurrenceInterval')?.value;
                const byDay = group.get('recurrenceByDay')?.value;
                if (
                    !(
                        interval > 0 ||
                        (Array.isArray(byDay) && byDay.length > 0)
                    )
                ) {
                    errors['recurrenceInvalid'] = true;
                }
            }

            return Object.keys(errors).length > 0 ? errors : null;
        };
    }
}
