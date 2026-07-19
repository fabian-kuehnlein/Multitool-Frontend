// Angular
import {
    Component,
    Inject,
    inject,
    signal,
    computed,
    effect,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

// Angular Material
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';

// App Services & Models
import { CategoryService } from '../../../../../shared/services/category.service';
import { EventFormService } from './event-form.service';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

// Third-party
import { Subject, takeUntil } from 'rxjs';

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
        NgClass,
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
    public readonly dialogData = inject(MAT_DIALOG_DATA);
    private readonly destroy$ = new Subject<void>();

    // --- Signals & State ---
    public readonly isEditMode = signal<boolean>(false);
    public readonly isLoadingCategories = computed(
        () => this.categoryService.categories().length === 0,
    );
    public readonly categories = this.categoryService.categories;

    // UI Metadata
    protected readonly weekdayOptions = [
        { value: 'MO', label: 'Montag' },
        { value: 'TU', label: 'Dienstag' },
        { value: 'WE', label: 'Mittwoch' },
        { value: 'TH', label: 'Donnerstag' },
        { value: 'FR', label: 'Freitag' },
        { value: 'SA', label: 'Samstag' },
        { value: 'SU', label: 'Sonntag' },
    ];

    // Form setup
    public readonly eventForm: FormGroup = this.formService.buildForm();
    private readonly formValue = toSignal(this.eventForm.valueChanges, {
        initialValue: this.eventForm.getRawValue(),
    });
    private readonly originalEventValue = signal<any>(null);

    // Computed properties for UI
    public readonly isChanged = computed(() => {
        if (!this.isEditMode()) return true;
        return (
            JSON.stringify(this.formValue()) !==
            JSON.stringify(this.originalEventValue())
        );
    });

    public readonly firstSelectedWeekdayLabel = computed(() => {
        const firstSelected = this.formValue()?.recurrenceByDay?.[0];
        return (
            this.weekdayOptions.find((d) => d.value === firstSelected)?.label ||
            ''
        );
    });

    public readonly selectedCategory = computed(() => {
        const categoryId = this.formValue()?.categoryId;
        return this.categories().find((c) => c.id == categoryId);
    });

    public readonly getFrequencyLabel = computed(() => {
        const freq = this.formValue()?.recurrenceFrequency;
        switch (freq) {
            case 'DAILY':
                return 'Tage';
            case 'WEEKLY':
                return 'Wochen';
            case 'MONTHLY':
                return 'Monate';
            case 'YEARLY':
                return 'Jahre';
            default:
                return '';
        }
    });

    // handles char-count for inputs
    protected readonly charCounts = computed(() => ({
        title: (this.formValue()?.eventTitle || '').length,
        note: (this.formValue()?.eventNote || '').length,
    }));

    constructor() {
        this.isEditMode.set(!!this.dialogData?.event);

        // Category Initialization logic
        effect(() => {
            const categories = this.categories();
            if (categories.length === 0) return;

            const categoryControl = this.eventForm.get('categoryId');

            if (this.isEditMode()) {
                const eventCategoryId = this.dialogData.event.categoryId;
                if (eventCategoryId != null) {
                    categoryControl?.setValue(Number(eventCategoryId), {
                        emitEvent: false,
                    });
                    this.originalEventValue.set(this.eventForm.getRawValue());
                }
            } else {
                const defaultCat =
                    categories.find((c) => Number(c.id) === 1) || categories[0];
                categoryControl?.setValue(Number(defaultCat.id), {
                    emitEvent: false,
                });
            }
        });
    }

    ngOnInit() {
        this.setupFormSubscriptions();
        if (this.isEditMode()) {
            this.patchFormForEdit();
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

    private patchFormForEdit() {
        const event = this.dialogData.event;
        const start = new Date(event.startDateTime);
        const end = event.endDateTime ? new Date(event.endDateTime) : null;
        const rrule = this.formService.parseRecurrenceString(
            event.recurrenceRule,
        );

        this.eventForm.patchValue({
            eventTitle: event.eventTitle,
            eventNote: event.eventNote,
            startDate: new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate(),
            ),
            startTime: new Date(0, 0, 0, start.getHours(), start.getMinutes()),
            endDate: end
                ? new Date(end.getFullYear(), end.getMonth(), end.getDate())
                : null,
            endTime: end
                ? new Date(0, 0, 0, end.getHours(), end.getMinutes())
                : null,
            isAllDay: event.isAllDay,
            isRecurring: !!rrule,
            recurrenceFrequency: rrule?.freq || 'WEEKLY',
            recurrenceInterval: rrule?.interval || 1,
            recurrenceByDay: rrule?.byDay || [],
            recurrenceEndDate: event.recurrenceEnd
                ? new Date(event.recurrenceEnd)
                : null,
            exDates: rrule?.exDates || [],
        });

        this.originalEventValue.set(this.eventForm.getRawValue());
    }

    // --- Actions ---
    public save() {
        if (this.eventForm.invalid) return;

        const formValue = this.eventForm.getRawValue();
        if (this.isEditMode()) {
            const updated = this.formService.getUpdateEventData(
                this.dialogData.event.eventId,
                formValue,
            );
            this.dialogRef.close({ data: updated, action: 'update' });
        } else {
            const created = this.formService.getCreateEventData(formValue);
            this.dialogRef.close(created);
        }
    }

    public delete() {
        this.dialog
            .open(ConfirmDialogComponent, {
                data: {
                    title: 'Ereignis löschen',
                    message: 'Möchten Sie dieses Ereignis wirklich löschen?',
                    confirmText: 'Löschen',
                    isDestructive: true,
                },
            })
            .afterClosed()
            .subscribe((confirm) => {
                if (confirm)
                    this.dialogRef.close({
                        data: this.dialogData.event.eventId,
                        action: 'delete',
                    });
            });
    }

    public close() {
        this.dialogRef.close(null);
    }

    public changeInterval(delta: number) {
        const control = this.eventForm.get('recurrenceInterval');
        const currentValue = control?.value || 1;
        const newValue = Math.max(1, currentValue + delta);
        control?.setValue(newValue);
    }
}
