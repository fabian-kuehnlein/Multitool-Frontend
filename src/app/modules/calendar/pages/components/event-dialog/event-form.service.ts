import { Injectable, inject } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
} from '@angular/forms';
import { DateUtil } from '../../../../../shared/utilities/date.util';
import {
    CalendarEvent,
    CreateCalendarEventDto,
    GetICalLinkEventDto,
} from '../../../models';
import {
    buildRecurrenceRuleString,
    parseRecurrenceRuleString,
} from '../../../logic/rrule.logic';
import { FullCalendarEventInput } from '../../../mappers/event.mapper';

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
     * Maps form values back to a CreateCalendarEventDto payload.
     */
    public getCreateEventData(formValue: EventFormValue): CreateCalendarEventDto {
        const recurrenceRule = formValue.isRecurring
            ? this.buildRecurrenceString(formValue)
            : null;
        const recurrenceEnd =
            formValue.isRecurring && formValue.recurrenceEndDate
                ? DateUtil.formatApiDateTime(
                      DateUtil.startOfDay(formValue.recurrenceEndDate),
                  )
                : null;

        const startDateTime = this.getStartDateTime(formValue);
        let endDateTime = this.getEndDateTime(formValue);

        if (
            startDateTime &&
            endDateTime &&
            !DateUtil.isAfter(endDateTime, startDateTime) &&
            DateUtil.isUnsetTime(formValue.endTime)
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
    public getIcalLinkData(formValue: EventFormValue): GetICalLinkEventDto {
        const createData = this.getCreateEventData(formValue);
        return {
            title: createData.title,
            note: createData.note,
            startDateTime: this.withLocalOffset(createData.startDateTime),
            endDateTime: this.withLocalOffset(createData.endDateTime),
        };
    }

    private getStartDateTime(formValue: EventFormValue): string | null {
        if (!formValue.startDate) return null;

        const start = formValue.isAllDay
            ? DateUtil.startOfDay(formValue.startDate)
            : DateUtil.combineDateAndTime(
                  formValue.startDate,
                  formValue.startTime,
              );

        return DateUtil.formatApiDateTime(start);
    }

    private getEndDateTime(formValue: EventFormValue): string | null {
        const endDate = formValue.endDate ?? formValue.startDate;
        if (!endDate) return null;

        if (formValue.isAllDay) {
            const end = DateUtil.addDays(DateUtil.startOfDay(endDate), 1);
            return DateUtil.formatApiDateTime(end);
        }

        const end = DateUtil.combineDateAndTime(
            endDate,
            formValue.endTime ?? formValue.startTime,
        );
        return DateUtil.formatApiDateTime(end);
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
    public patchFormForEdit(form: FormGroup, event: FullCalendarEventInput): void {
        const rrule = parseRecurrenceRuleString(event.recurrenceRule);

        form.patchValue({
            eventTitle: event.eventTitle,
            eventNote: event.eventNote,
            categoryId: event.categoryId ?? null,
            startDate: DateUtil.toDate(
                DateUtil.startOfDay(event.startDateTime),
            ),
            startTime: DateUtil.toTimeDate(event.startDateTime),
            endDate: DateUtil.toDate(DateUtil.startOfDay(event.endDateTime)),
            endTime: DateUtil.toTimeDate(event.endDateTime),
            isAllDay: event.isAllDay,
            isRecurring: !!rrule,
            recurrenceFrequency: rrule?.freq || 'WEEKLY',
            recurrenceInterval: rrule?.interval || 1,
            recurrenceByDay: rrule?.byDay || [],
            recurrenceEndDate: DateUtil.toDate(event.recurrenceEnd),
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
                const start = DateUtil.combineDateAndTime(startDate, startTime);
                const end = DateUtil.combineDateAndTime(endDate, endTime);
                if (
                    start &&
                    end &&
                    DateUtil.isBefore(end, start) &&
                    !DateUtil.isUnsetTime(endTime)
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
