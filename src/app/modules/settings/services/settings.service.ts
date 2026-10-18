import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { SettingsHttpService } from './settings-http.service';
import {
    SettingsDto,
    SETTINGS_MODULE_WORKTIME,
    WORKTIME_SETTING_KEYS,
} from '../models/settings.model';

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    private readonly httpService = inject(SettingsHttpService);

    private readonly _settings = signal<SettingsDto | null>(null);
    private readonly _loading = signal<boolean>(false);

    readonly settings = this._settings.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly worktimeSettings = computed(
        () => this._settings()?.worktime ?? null,
    );

    loadSettings(force = false): Observable<SettingsDto> {
        const current = this._settings();
        if (current && !force) {
            return of(current);
        }

        this._loading.set(true);
        return this.httpService.getSettings().pipe(
            tap({
                next: (settings) => this._settings.set(settings),
                finalize: () => this._loading.set(false),
            }),
        );
    }

    updateSetting(
        module: string,
        key: string,
        value: string | number,
    ): Observable<void> {
        const strVal = String(value);
        return this.httpService
            .updateSetting(module, key, { value: strVal })
            .pipe(
                tap(() => {
                    this.patchLocalSetting(module, key, Number(value));
                }),
            );
    }

    private patchLocalSetting(
        module: string,
        key: string,
        numVal: number,
    ): void {
        this._settings.update((current) => {
            if (!current) return current;
            if (module === SETTINGS_MODULE_WORKTIME) {
                const worktime = { ...current.worktime };
                if (key === WORKTIME_SETTING_KEYS.DAILY_TARGET_MINUTES) {
                    worktime.dailyTargetMinutes = numVal;
                } else if (
                    key === WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_MONTHLY
                ) {
                    worktime.homeOfficeLimitMonthly = numVal;
                } else if (
                    key === WORKTIME_SETTING_KEYS.HOME_OFFICE_LIMIT_WEEKLY
                ) {
                    worktime.homeOfficeLimitWeekly = numVal;
                }
                return { ...current, worktime };
            }
            return current;
        });
    }
}
