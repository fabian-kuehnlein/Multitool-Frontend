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

const DEFAULT_WEEKLY_LIMIT = 3;
const DEFAULT_MONTHLY_LIMIT = 10;

@Component({
    selector: 'app-work-time-settings',
    standalone: true,
    imports: [CommonModule, UI_MODULES],
    templateUrl: './work-time-settings.component.html',
    styleUrl: './work-time-settings.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class WorkTimeSettingsComponent {
    private readonly settingsService = inject(SettingsService);

    readonly timeMode = signal<'daily' | 'weekly'>('daily');
    readonly hoursValue = signal<number>(8);
    readonly minutesValue = signal<number>(0);

    readonly weeklyLimit = signal<number>(0);
    readonly monthlyLimit = signal<number>(0);
    readonly isWeeklyLimitEnabled = signal<boolean>(false);
    readonly isMonthlyLimitEnabled = signal<boolean>(false);
    private lastWeeklyLimit = DEFAULT_WEEKLY_LIMIT;
    private lastMonthlyLimit = DEFAULT_MONTHLY_LIMIT;

    private readonly timeInput$ = new Subject<{
        hours: number;
        minutes: number;
    }>();
    private readonly weeklyLimitInput$ = new Subject<number>();
    private readonly monthlyLimitInput$ = new Subject<number>();
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

    constructor() {
        effect(() => {
            const settings = this.settingsService.settings();
            if (!settings || this.isInitialized) return;

            const wt = settings.worktime;
            this.hoursValue.set(Math.floor(wt.dailyTargetMinutes / 60));
            this.minutesValue.set(wt.dailyTargetMinutes % 60);

            this.weeklyLimit.set(wt.homeOfficeLimitWeekly);
            this.monthlyLimit.set(wt.homeOfficeLimitMonthly);
            this.isWeeklyLimitEnabled.set(wt.homeOfficeLimitWeekly > 0);
            this.isMonthlyLimitEnabled.set(wt.homeOfficeLimitMonthly > 0);
            if (wt.homeOfficeLimitWeekly > 0) {
                this.lastWeeklyLimit = wt.homeOfficeLimitWeekly;
            }
            if (wt.homeOfficeLimitMonthly > 0) {
                this.lastMonthlyLimit = wt.homeOfficeLimitMonthly;
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

        this.weeklyLimitInput$
            .pipe(debounceTime(500), takeUntilDestroyed())
            .subscribe((days) => {
                this.settingsService
                    .updateSetting(
                        SETTINGS_MODULE_WORKTIME,
                        WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_WEEKLY,
                        days,
                    )
                    .subscribe({ error: () => {} });
            });

        this.monthlyLimitInput$
            .pipe(debounceTime(500), takeUntilDestroyed())
            .subscribe((days) => {
                this.settingsService
                    .updateSetting(
                        SETTINGS_MODULE_WORKTIME,
                        WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_MONTHLY,
                        days,
                    )
                    .subscribe({ error: () => {} });
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

    onWeeklyLimitInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const raw = Number(input.value) || 0;
        this.setWeeklyLimit(raw);
        input.value = String(this.weeklyLimit());
    }

    onMonthlyLimitInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const raw = Number(input.value) || 0;
        this.setMonthlyLimit(raw);
        input.value = String(this.monthlyLimit());
    }

    incrementWeeklyLimit(): void {
        this.setWeeklyLimit(this.weeklyLimit() + 1);
    }

    decrementWeeklyLimit(): void {
        this.setWeeklyLimit(this.weeklyLimit() - 1);
    }

    incrementMonthlyLimit(): void {
        this.setMonthlyLimit(this.monthlyLimit() + 1);
    }

    decrementMonthlyLimit(): void {
        this.setMonthlyLimit(this.monthlyLimit() - 1);
    }

    clearWeeklyLimit(): void {
        this.isWeeklyLimitEnabled.set(false);
        this.setWeeklyLimit(0);
    }

    enableWeeklyLimit(): void {
        this.isWeeklyLimitEnabled.set(true);
        this.setWeeklyLimit(this.lastWeeklyLimit);
    }

    onWeeklyLimitBlur(): void {
        if (this.weeklyLimit() === 0) {
            this.isWeeklyLimitEnabled.set(false);
        }
    }

    clearMonthlyLimit(): void {
        this.isMonthlyLimitEnabled.set(false);
        this.setMonthlyLimit(0);
    }

    enableMonthlyLimit(): void {
        this.isMonthlyLimitEnabled.set(true);
        this.setMonthlyLimit(this.lastMonthlyLimit);
    }

    onMonthlyLimitBlur(): void {
        if (this.monthlyLimit() === 0) {
            this.isMonthlyLimitEnabled.set(false);
        }
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

    private setWeeklyLimit(value: number): void {
        const clamped = Math.max(0, Math.min(7, value));
        if (clamped > 0) {
            this.lastWeeklyLimit = clamped;
        }
        this.weeklyLimit.set(clamped);
        this.weeklyLimitInput$.next(clamped);
    }

    private setMonthlyLimit(value: number): void {
        const clamped = Math.max(0, Math.min(31, value));
        if (clamped > 0) {
            this.lastMonthlyLimit = clamped;
        }
        this.monthlyLimit.set(clamped);
        this.monthlyLimitInput$.next(clamped);
    }
}
