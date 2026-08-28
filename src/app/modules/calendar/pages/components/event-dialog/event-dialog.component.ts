// Angular
import {
    Component,
    inject,
    signal,
    computed,
    effect,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
} from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';

// Angular Material
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';

// App Services & Models
import { CategoryService } from '../../../../../shared/services/category.service';
import { AppModule } from '../../../../../shared/models/app-module.enum';
import { EventFormService, EventFormValue } from './event-form.service';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { RecurrenceFormComponent } from '../../../../../shared/components/recurrence-form/recurrence-form.component';
import { CalendarService } from '../../../services/calendar.service';
import { MediaService } from '../../../../../core/services/media.service';
import { SnackbarService } from '../../../../../core/services/snackbar.service';
import {
    SKIP_HTTP_ERROR_SNACKBAR,
} from '../../../../../core/interceptors/http-error.interceptor';
import {
    DialogEventInput,
    FullCalendarEventInput,
} from '../../../mappers/event.mapper';
import type { CalendarEvent } from '../../../models/calendar-event.model';

// Third-party
import { Subject, takeUntil } from 'rxjs';
import dayjs from 'dayjs';

export interface EventDialogData {
    event?: DialogEventInput | FullCalendarEventInput | null;
    anchorDate?: Date;
}

export interface EventDialogUpdateResult {
    data: CalendarEvent;
    action: 'update';
}

export interface EventDialogDeleteResult {
    data: string;
    action: 'delete';
}

export type EventDialogResult = EventDialogUpdateResult | EventDialogDeleteResult;

@Component({
    selector: 'app-event-dialog',
    standalone: true,
    imports: [
        UI_MODULES,
        MatDatepickerModule,
        MatTimepickerModule,
        MatSlideToggleModule,
        MatDividerModule,
        ReactiveFormsModule,
        NgTemplateOutlet,
        RecurrenceFormComponent,
    ],
    providers: [EventFormService],
    templateUrl: './event-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './event-dialog.component.scss',
})
export class EventDialogComponent implements OnInit, OnDestroy {
    private readonly dialogRef = inject(MatDialogRef<EventDialogComponent>);
    private readonly dialog = inject(MatDialog);
    private readonly categoryService = inject(CategoryService);
    private readonly formService = inject(EventFormService);
    private readonly calendarService = inject(CalendarService);
    private readonly media = inject(MediaService);
    private readonly snackbar = inject(SnackbarService);
    public readonly dialogData = inject<EventDialogData>(MAT_DIALOG_DATA);
    private readonly destroy$ = new Subject<void>();
    private readonly skipErrorSnackbarContext = new HttpContext().set(
        SKIP_HTTP_ERROR_SNACKBAR,
        true,
    );

    // --- Signals & State ---
    public readonly isEditMode = signal<boolean>(false);
    public readonly isMobile = this.media.isMobile;
    public readonly isGeneratingIcal = signal<boolean>(false);
    public readonly isLoadingCategories = computed(
        () => this.categoryService.categories().length === 0,
    );
    public readonly categories = this.categoryService.categories;

    // Form setup
    public readonly eventForm: FormGroup = this.formService.buildForm();

    public readonly selectableCategories =
        this.categoryService.selectableCategoriesForModule(AppModule.Calendar, () =>
            this.eventForm.getRawValue().categoryId,
        );
    private readonly defaultCategory =
        this.categoryService.defaultCategoryForModule(AppModule.Calendar);
    private readonly formValue = toSignal<EventFormValue | null>(
        this.eventForm.valueChanges,
        { initialValue: this.eventForm.getRawValue() },
    );
    private readonly originalEventValue = signal<Record<string, unknown> | null>(
        null,
    );

    // Computed properties for UI
    public readonly isChanged = computed(() => {
        if (!this.isEditMode()) return true;
        return (
            JSON.stringify(this.formValue()) !==
            JSON.stringify(this.originalEventValue())
        );
    });

    public readonly selectedCategory = computed(() => {
        const categoryId = this.formValue()?.categoryId;
        return this.categories().find((c) => c.id === categoryId);
    });

    // handles char-count for inputs
    protected readonly charCounts = computed(() => ({
        title: (this.formValue()?.eventTitle || '').length,
        note: (this.formValue()?.eventNote || '').length,
    }));

    constructor() {
        this.isEditMode.set(!!this.dialogData?.event);

        // Preselect default category for new events once categories have loaded.
        // Uses centralized policy from CategoryService (prefers "Privat", falls back
        // to first selectable in insertion order) – avoids hard-coded id=1 which
        // breaks when "Privat" is deleted. Editing uses the event's own category.
        effect(() => {
            if (this.isEditMode()) return;
            if (this.eventForm.get('categoryId')?.value != null) return;
            const defaultCat = this.defaultCategory();
            if (defaultCat) {
                this.eventForm.get('categoryId')?.setValue(defaultCat.id);
            }
        });
    }

    ngOnInit() {
        this.setupFormSubscriptions();
        if (this.isEditMode() && this.dialogData.event) {
            this.formService.patchFormForEdit(this.eventForm, this.dialogData.event);
            this.originalEventValue.set(this.eventForm.getRawValue());
        } else if (this.dialogData.anchorDate) {
            const setDate = new Date(this.dialogData.anchorDate);
            this.eventForm.patchValue({ startDate: setDate, endDate: setDate });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupFormSubscriptions() {
        // Toggle time field enablement based on AllDay status
        this.eventForm
            .get('isAllDay')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((isAllDay) => {
                const timeControls = ['startTime', 'endTime'];
                timeControls.forEach((ctrl) =>
                    isAllDay
                        ? this.eventForm.get(ctrl)?.disable()
                        : this.eventForm.get(ctrl)?.enable(),
                );
            });

        // Disable endDate if recurring (as we use recurrenceEndDate)
        this.eventForm
            .get('isRecurring')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((isRec) => {
                isRec
                    ? this.eventForm.get('endDate')?.disable()
                    : this.eventForm.get('endDate')?.enable();
            });
    }

    // --- Actions ---
    public save() {
        if (this.eventForm.invalid) return;

        const formValue = this.eventForm.getRawValue() as EventFormValue;
        if (this.isEditMode()) {
            const eventId = this.dialogData.event?.eventId;
            if (!eventId) return;
            const updated = this.formService.getUpdateEventData(eventId, formValue);
            this.dialogRef.close({ data: updated, action: 'update' });
        } else {
            const created = this.formService.getCreateEventData(formValue);
            this.dialogRef.close(created);
        }
    }

    public delete() {
        const eventId = this.dialogData.event?.eventId;
        if (!eventId) return;

        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Ereignis löschen',
                    message: 'Möchtest du dieses Ereignis wirklich löschen?',
                    confirmText: 'Löschen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((confirm) => {
                if (confirm)
                    this.dialogRef.close({
                        data: eventId,
                        action: 'delete',
                    });
            });
    }

    public close() {
        this.dialogRef.close(null);
    }

    public generateIcalLink() {
        if (this.isGeneratingIcal() || this.eventForm.invalid) return;

        const event = this.formService.getIcalLinkData(
            this.eventForm.getRawValue() as EventFormValue,
        );
        this.isGeneratingIcal.set(true);
        this.calendarService
            .generateIcalLink(event, this.skipErrorSnackbarContext)
            .subscribe({
            next: (blob) => {
                this.isGeneratingIcal.set(false);
                this.downloadIcalFile(blob, event.startDateTime);
            },
            error: () => {
                this.isGeneratingIcal.set(false);
                this.showIcalError();
            },
        });
    }

    private downloadIcalFile(blob: Blob, startDateTime: string | null) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = this.buildIcalFileName(startDateTime);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    private buildIcalFileName(startDateTime: string | null): string {
        const start = startDateTime ? dayjs(startDateTime) : null;
        return start?.isValid()
            ? `${start.format('YYYY-MM-DD-HH-mm')}.ics`
            : 'event.ics';
    }

    private showIcalError() {
        this.snackbar.openError(
            'Der Kalender-Link konnte nicht erstellt werden.',
        );
    }
}
