import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { WorkDay, WorkTimeSettings, DayStatus } from '../../../models/work-time-planner.model';

@Component({
  selector: 'app-day-card',
  standalone: true,
  imports: [CommonModule, UI_MODULES],
  templateUrl: './day-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './day-card.component.scss',
})
export class DayCardComponent {
  readonly DayStatus = DayStatus;

  @Input({ required: true }) day!: WorkDay;
  @Input({ required: true }) dayName!: string;
  @Input({ required: true }) settings!: WorkTimeSettings;
  @Input() isDesktop = false;
  @Input() isMobile = false;
  @Output() update = new EventEmitter<WorkDay>();
  @Output() toggleHomeOffice = new EventEmitter<string>();
  @Output() toggleDayStatus = new EventEmitter<{ date: string; status: DayStatus }>();
  @Output() toggleLock = new EventEmitter<string>();

  onStartTimeChange(value: string): void {
    this.update.emit({ ...this.day, startTime: value || null });
  }

  onEndTimeChange(value: string): void {
    this.update.emit({ ...this.day, endTime: value || null });
  }

  onBreakChange(value: number): void {
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

  formatMinutes(minutes: number): string {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${h}h ${m.toString().padStart(2, '0')}min`;
  }

  get formattedDate(): string {
    const d = new Date(this.day.date);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }

  get isToday(): boolean {
    return this.day.date === new Date().toISOString().split('T')[0];
  }

  get hasData(): boolean {
    return this.day.startTime !== null && this.day.endTime !== null;
  }

  get isAbsent(): boolean {
    return this.day.status !== DayStatus.Normal;
  }
}
