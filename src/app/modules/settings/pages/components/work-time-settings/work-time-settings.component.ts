import {
    Component,
    inject,
    signal,
    computed,
    effect,
    ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { UI_MODULES } from '../../../../../shared/utilities/material-ui';
import { SettingsService } from '../../../services/settings.service';
import {
    SETTINGS_MODULE_WORKTIME,
    WORKTIME_SETTING_KEYS,
} from '../../../models/settings.model';

@Component({
    selector: 'app-work-time-settings',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './work-time-settings.component.html',
    styleUrl: './work-time-settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class WorkTimeSettingsComponent {
    protected readonly settingsService = inject(SettingsService);

    readonly timeMode = signal<'daily' | 'weekly'>('daily');
    readonly hoursValue = signal<number>(8);
    readonly minutesValue = signal<number>(0);

    readonly hoMode = signal<'weekly' | 'monthly'>('weekly');
    readonly hoDaysValue = signal<number>(0);

    private readonly timeInput$ = new Subject<{
        hours: number;
        minutes: number;
    }>();
    private readonly hoInput$ = new Subject<number>();
    private isInitialized = false;

    // Derived hints
    readonly weeklyHoursEquivalent = computed(() => {
        const totalWeekly =
            (this.hoursValue() * 60 + this.minutesValue()) * 5;
        return Math.floor(totalWeekly / 60);
    });

    readonly weeklyMinutesEquivalent = computed(() => {
        const totalWeekly =
            (this.hoursValue() * 60 + this.minutesValue()) * 5;
        return totalWeekly % 60;
    });

    readonly dailyHoursEquivalent = computed(() => {
        const totalWeekly = this.hoursValue() * 60 + this.minutesValue();
        const dailyMins = Math.round(totalWeekly / 5);
        return Math.floor(dailyMins / 60);
    });

    readonly dailyMinutesEquivalent = computed(() => {
        const totalWeekly = this.hoursValue() * 60 + this.minutesValue();
        const dailyMins = Math.round(totalWeekly / 5);
        return dailyMins % 60;
    });

    readonly hoWeeklyEquivalent = computed(() => {
        return (this.hoDaysValue() / 4).toFixed(1);
    });

    constructor() {
        effect(() => {
            const settings = this.settingsService.settings();
            if (!settings || this.isInitialized) return;

            const wt = settings.worktime;
            this.hoursValue.set(Math.floor(wt.dailyTargetMinutes / 60));
            this.minutesValue.set(wt.dailyTargetMinutes % 60);

            if (
                wt.homeOfficeLimitMonthly > 0 &&
                wt.homeOfficeLimitWeekly === 0
            ) {
                this.hoMode.set('monthly');
                this.hoDaysValue.set(wt.homeOfficeLimitMonthly);
            } else {
                this.hoMode.set('weekly');
                this.hoDaysValue.set(wt.homeOfficeLimitWeekly);
            }

            this.isInitialized = true;
        });

        this.timeInput$
            .pipe(debounceTime(500), takeUntilDestroyed())
            .subscribe(({ hours, minutes }) => {
                let dailyMinutes: number;
                if (this.timeMode() === 'weekly') {
                    const totalWeekly = hours * 60 + minutes;
                    dailyMinutes = Math.round(totalWeekly / 5);
                } else {
                    dailyMinutes = hours * 60 + minutes;
                }
                const clamped = Math.max(1, Math.min(600, dailyMinutes));
                this.settingsService
                    .updateSetting(
                        SETTINGS_MODULE_WORKTIME,
                        WORKTIME_SETTING_KEYS.DAILY_TARGET_MINUTES,
                        clamped,
                    )
                    .subscribe({ error: () => {} });
            });

        this.hoInput$
            .pipe(debounceTime(500), takeUntilDestroyed())
            .subscribe((days) => {
                if (this.hoMode() === 'weekly') {
                    const clamped = Math.max(0, Math.min(7, days));
                    this.settingsService
                        .updateSetting(
                            SETTINGS_MODULE_WORKTIME,
                            WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_WEEKLY,
                            clamped,
                        )
                        .subscribe({ error: () => {} });

                    const currentMonthly =
                        this.settingsService.settings()?.worktime
                            .homeOfficeLimitMonthly ?? 0;
                    if (currentMonthly > 0) {
                        this.settingsService
                            .updateSetting(
                                SETTINGS_MODULE_WORKTIME,
                                WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_MONTHLY,
                                0,
                            )
                            .subscribe({ error: () => {} });
                    }
                } else {
                    const clamped = Math.max(0, Math.min(31, days));
                    this.settingsService
                        .updateSetting(
                            SETTINGS_MODULE_WORKTIME,
                            WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_MONTHLY,
                            clamped,
                        )
                        .subscribe({ error: () => {} });

                    const currentWeekly =
                        this.settingsService.settings()?.worktime
                            .homeOfficeLimitWeekly ?? 0;
                    if (currentWeekly > 0) {
                        this.settingsService
                            .updateSetting(
                                SETTINGS_MODULE_WORKTIME,
                                WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_WEEKLY,
                                0,
                            )
                            .subscribe({ error: () => {} });
                    }
                }
            });
    }

    onTimeModeChange(mode: 'daily' | 'weekly'): void {
        const prevMode = this.timeMode();
        if (prevMode === mode) return;

        this.timeMode.set(mode);
        const currentHours = this.hoursValue();
        const currentMinutes = this.minutesValue();

        if (mode === 'weekly') {
            const dailyMins = currentHours * 60 + currentMinutes;
            const weeklyMins = dailyMins * 5;
            this.hoursValue.set(Math.floor(weeklyMins / 60));
            this.minutesValue.set(weeklyMins % 60);
        } else {
            const weeklyMins = currentHours * 60 + currentMinutes;
            const dailyMins = Math.round(weeklyMins / 5);
            this.hoursValue.set(Math.floor(dailyMins / 60));
            this.minutesValue.set(dailyMins % 60);
        }
    }

    onHoursInput(event: Event): void {
        const val = Math.max(
            0,
            Number((event.target as HTMLInputElement).value) || 0,
        );
        this.hoursValue.set(val);
        this.timeInput$.next({ hours: val, minutes: this.minutesValue() });
    }

    onMinutesInput(event: Event): void {
        const raw = Number((event.target as HTMLInputElement).value) || 0;
        const val = Math.max(0, Math.min(59, raw));
        this.minutesValue.set(val);
        this.timeInput$.next({ hours: this.hoursValue(), minutes: val });
    }

    incrementHours(): void {
        this.adjustHours(1);
    }

    decrementHours(): void {
        this.adjustHours(-1);
    }

    incrementMinutes(): void {
        this.adjustMinutes(5);
    }

    decrementMinutes(): void {
        this.adjustMinutes(-5);
    }

    incrementHoDays(): void {
        this.adjustHoDays(1);
    }

    decrementHoDays(): void {
        this.adjustHoDays(-1);
    }

    private adjustHours(delta: number): void {
        const max = this.timeMode() === 'weekly' ? 50 : 10;
        const newVal = Math.max(0, Math.min(max, this.hoursValue() + delta));
        this.hoursValue.set(newVal);
        this.timeInput$.next({ hours: newVal, minutes: this.minutesValue() });
    }

    private adjustMinutes(delta: number): void {
        const newVal = Math.max(0, Math.min(59, this.minutesValue() + delta));
        this.minutesValue.set(newVal);
        this.timeInput$.next({ hours: this.hoursValue(), minutes: newVal });
    }

    private adjustHoDays(delta: number): void {
        const max = this.hoMode() === 'weekly' ? 7 : 31;
        const newVal = Math.max(0, Math.min(max, this.hoDaysValue() + delta));
        this.hoDaysValue.set(newVal);
        this.hoInput$.next(newVal);
    }

    onHoModeChange(mode: 'weekly' | 'monthly'): void {
        const prevMode = this.hoMode();
        if (prevMode === mode) return;

        this.hoMode.set(mode);
        const currentDays = this.hoDaysValue();

        if (currentDays === 0) return;

        if (mode === 'monthly') {
            const newMonthly = Math.min(31, currentDays * 4);
            this.hoDaysValue.set(newMonthly);
            this.settingsService
                .updateSetting(
                    SETTINGS_MODULE_WORKTIME,
                    WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_MONTHLY,
                    newMonthly,
                )
                .subscribe({ error: () => {} });
            this.settingsService
                .updateSetting(
                    SETTINGS_MODULE_WORKTIME,
                    WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_WEEKLY,
                    0,
                )
                .subscribe({ error: () => {} });
        } else {
            const newWeekly = Math.min(7, Math.round(currentDays / 4));
            this.hoDaysValue.set(newWeekly);
            this.settingsService
                .updateSetting(
                    SETTINGS_MODULE_WORKTIME,
                    WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_WEEKLY,
                    newWeekly,
                )
                .subscribe({ error: () => {} });
            this.settingsService
                .updateSetting(
                    SETTINGS_MODULE_WORKTIME,
                    WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_MONTHLY,
                    0,
                )
                .subscribe({ error: () => {} });
        }
    }

    onHoDaysInput(event: Event): void {
        const raw = Number((event.target as HTMLInputElement).value) || 0;
        const max = this.hoMode() === 'weekly' ? 7 : 31;
        const val = Math.max(0, Math.min(max, raw));
        this.hoDaysValue.set(val);
        this.hoInput$.next(val);
    }
}
