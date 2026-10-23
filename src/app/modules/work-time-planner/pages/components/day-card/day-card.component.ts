import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import dayjs from 'dayjs';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import {
    WorkDay,
    WorkTimeSettings,
    DayStatus,
} from '../../../models/work-time-planner.model';
import { isHomeOfficeDisabled } from '../../../logic/work-time-calculation.logic';
import { DAY_INPUT_DEBOUNCE_MS } from '../../../utilities/work-time.config';
import { formatMinutes } from '../../../utilities/work-time.util';

@Component({
    selector: 'app-day-card',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './day-card.component.html',
    styleUrl: './day-card.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class DayCardComponent implements OnDestroy {
    readonly DayStatus = DayStatus;
    readonly formatMinutes = formatMinutes;

    @Input({ required: true }) day!: WorkDay;
    @Input({ required: true }) dayName!: string;
    @Input({ required: true }) settings!: WorkTimeSettings;
    @Input() isDesktop = false;
    @Input() isMobile = false;
    @Output() readonly update = new EventEmitter<WorkDay>();
    @Output() readonly toggleHomeOffice = new EventEmitter<string>();
    @Output() readonly toggleDayStatus = new EventEmitter<{
        date: string;
        status: DayStatus;
    }>();
    @Output() readonly toggleLock = new EventEmitter<string>();

    private readonly startTimeChanges = new Subject<string | null>();
    private readonly endTimeChanges = new Subject<string | null>();
    private readonly breakChanges = new Subject<number>();
    private readonly destroy$ = new Subject<void>();

    constructor() {
        this.startTimeChanges
            .pipe(debounceTime(DAY_INPUT_DEBOUNCE_MS), takeUntil(this.destroy$))
            .subscribe((startTime) =>
                this.update.emit({ ...this.day, startTime }),
            );
        this.endTimeChanges
            .pipe(debounceTime(DAY_INPUT_DEBOUNCE_MS), takeUntil(this.destroy$))
            .subscribe((endTime) => this.update.emit({ ...this.day, endTime }));
        this.breakChanges
            .pipe(debounceTime(DAY_INPUT_DEBOUNCE_MS), takeUntil(this.destroy$))
            .subscribe((breakMinutes) =>
                this.update.emit({ ...this.day, breakMinutes }),
            );
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Native `<input type="time">`/number controls fire `change` for every valid
    // intermediate value while typing (e.g. 17:00, 17:03, 17:30). These three
    // handlers only forward the raw value to their debounced Subject above, so a
    // burst of keystrokes collapses into a single update/save instead of one
    // request per keystroke.
    onStartTimeInputChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.startTimeChanges.next(value || null);
    }

    onEndTimeInputChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.endTimeChanges.next(value || null);
    }

    onBreakInputChange(event: Event): void {
        const value = Number((event.target as HTMLInputElement).value);
        this.breakChanges.next(value);
    }

    onHomeOfficeToggle(): void {
        this.toggleHomeOffice.emit(this.day.date);
    }

    onDayStatusToggle(status: DayStatus): void {
        this.toggleDayStatus.emit({ date: this.day.date, status });
    }

    onLockToggle(): void {
        this.toggleLock.emit(this.day.date);
    }

    get formattedDate(): string {
        return dayjs(this.day.date).format('DD.MM');
    }

    get isToday(): boolean {
        return this.day.date === dayjs().format('YYYY-MM-DD');
    }

    get hasData(): boolean {
        return this.day.startTime !== null && this.day.endTime !== null;
    }

    get isAbsent(): boolean {
        return isHomeOfficeDisabled(this.day);
    }
}
