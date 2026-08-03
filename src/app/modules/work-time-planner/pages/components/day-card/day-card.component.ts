import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import dayjs from 'dayjs';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import {
    WorkDay,
    WorkTimeSettings,
    DayStatus,
} from '../../../models/work-time-planner.model';
import { isHomeOfficeDisabled } from '../../../logic/work-time-calculation.logic';
import { formatMinutes } from '../../../utilities/work-time.util';

@Component({
    selector: 'app-day-card',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './day-card.component.html',
    styleUrl: './day-card.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class DayCardComponent {
    readonly DayStatus = DayStatus;
    readonly formatMinutes = formatMinutes;

    @Input({ required: true }) day!: WorkDay;
    @Input({ required: true }) dayName!: string;
    @Input({ required: true }) settings!: WorkTimeSettings;
    @Input() isDesktop = false;
    @Input() isMobile = false;
    @Output() update = new EventEmitter<WorkDay>();
    @Output() toggleHomeOffice = new EventEmitter<string>();
    @Output() toggleDayStatus = new EventEmitter<{
        date: string;
        status: DayStatus;
    }>();
    @Output() toggleLock = new EventEmitter<string>();

    onStartTimeChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.update.emit({ ...this.day, startTime: value || null });
    }

    onEndTimeChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.update.emit({ ...this.day, endTime: value || null });
    }

    onBreakChange(event: Event): void {
        const value = Number((event.target as HTMLInputElement).value);
        this.update.emit({ ...this.day, breakMinutes: value });
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
